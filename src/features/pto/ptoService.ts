import firestore from '@react-native-firebase/firestore';

export interface PtoRequest {
  id?: string;
  userId: string;
  dates: string[]; // ISO strings
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

// Submit a PTO request
export const requestPto = async (userId: string, dates: Date[]) => {
  const request: PtoRequest = {
    userId,
    dates: dates.map(d => d.toISOString()),
    status: 'pending',
    requestedAt: new Date().toISOString(),
  };
  await firestore().collection('ptoRequests').add(request);
};

// Listen for PTO requests (all for admin, or filtered by user)
export const subscribeToPtoRequests = (
  callback: (requests: PtoRequest[]) => void,
  userId?: string
) => {
  let ref = firestore().collection('ptoRequests');
  if (userId) ref = ref.where('userId', '==', userId);
  return ref.onSnapshot(snapshot => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PtoRequest)));
  });
};

// Admin: Approve or reject a PTO request
export const reviewPtoRequest = async (
  requestId: string,
  status: 'approved' | 'rejected',
  adminId: string
) => {
  await firestore().collection('ptoRequests').doc(requestId).update({
    status,
    reviewedBy: adminId,
    reviewedAt: new Date().toISOString(),
  });
};

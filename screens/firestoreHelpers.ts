import firestore from '@react-native-firebase/firestore';

// Data models
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  // Add more user fields as needed
}

export interface Shift {
  shiftId: string;
  userId: string | null; // null for open/unassigned shifts
  start: string; // ISO date string
  end: string;   // ISO date string
  location?: string;
  // Recurrence info: type can be 'none', 'weekly', or 'monthly'.
  recurrence?: {
    type: 'none' | 'weekly' | 'monthly';
    days?: number[]; // 0=Sunday, 1=Monday, ... for weekly
    date?: number;   // 1-31 for monthly
  };
  // Open shift & bidding support
  status?: 'assigned' | 'open';
  bids?: Array<{ userId: string; message?: string; timestamp: string }>;
  // Add more shift fields as needed
}

export interface Swap {
  swapId: string;
  // Legacy fields for backward compatibility
  fromUserId?: string;
  toUserId?: string;
  shiftId?: string;
  // Robust new fields
  requesterId: string;
  targetUserId: string;
  requesterShiftId: string;
  targetShiftId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'counter';
  createdAt: string;
  updatedAt?: string;
  history?: any[];
  // Recurring swap support
  recurringParentId?: string; // ID for the recurring swap series
  recurringInstanceDate?: string; // ISO date string for the instance
  // Add more swap fields as needed
}

export interface Wallet {
  uid: string;
  credits: number;
  // Add more wallet fields as needed
}

// USERS
// Add or update a user document
export const addUser = (user: User) =>
  firestore().collection('users').doc(user.uid).set(user);

// Get a user document by uid
export const getUser = (uid: string) =>
  firestore().collection('users').doc(uid).get();

// Listen for real-time changes to a user document
export const onUserChange = (uid: string, callback: (user: User | null) => void) =>
  firestore().collection('users').doc(uid).onSnapshot(doc => {
    callback(doc.exists ? (doc.data() as User) : null);
  });

// Fetch all users (for colleague search)
export const getAllUsers = async (): Promise<User[]> => {
  const snapshot = await firestore().collection('users').get();
  return snapshot.docs.map(doc => doc.data() as User);
};

// SHIFTS
// Add or update a shift document
export const addShift = async (shift: Shift) => {
  try {
    await firestore().collection('shifts').doc(shift.shiftId).set(shift);
    return true;
  } catch (err) {
    console.error('Failed to add shift:', err);
    throw err;
  }
};

// Get a shift document by shiftId
export const getShift = (shiftId: string) =>
  firestore().collection('shifts').doc(shiftId).get();

// Update a shift document
export const updateShift = (shiftId: string, data: Partial<Shift>) =>
  firestore().collection('shifts').doc(shiftId).update(data);

// Listen for real-time changes to all shifts
export const onShiftsChange = (callback: (shifts: Shift[]) => void) =>
  firestore().collection('shifts').onSnapshot(snapshot => {
    callback(snapshot.docs.map(doc => doc.data() as Shift));
  });

// Listen for real-time changes to shifts for a specific user
export const onUserShiftsChange = (userId: string, callback: (shifts: Shift[]) => void) =>
  firestore().collection('shifts').where('userId', '==', userId).onSnapshot(snapshot => {
    callback(snapshot.docs.map(doc => doc.data() as Shift));
  });

// Fetch all shifts for a user (for counter-proposal)
export const getUserShifts = async (userId: string) => {
  const snapshot = await firestore().collection('shifts').where('userId', '==', userId).get();
  return snapshot.docs.map(doc => doc.data());
};

// SWAPS
// Add or update a swap document
export const addSwap = (swap: Swap) =>
  firestore().collection('swaps').doc(swap.swapId).set(swap);

// Get a swap document by swapId
export const getSwap = (swapId: string) =>
  firestore().collection('swaps').doc(swapId).get();

// Listen for real-time changes to all swaps
export const onSwapsChange = (callback: (swaps: Swap[]) => void) =>
  firestore().collection('swaps').onSnapshot(snapshot => {
    callback(snapshot.docs.map(doc => doc.data() as Swap));
  });

// updateSwap: If data.historyPush is present, push to the history array
// Otherwise, update swap document with provided data
export const updateSwap = (swapId: string, data: any) => {
  const ref = firestore().collection('swaps').doc(swapId);
  if (data.historyPush) {
    const { historyPush, ...rest } = data;
    return ref.update({ ...rest, history: firestore.FieldValue.arrayUnion(historyPush) });
  }
  return ref.update(data);
};

// ATOMIC SWAP ACCEPTANCE
// Accept a swap and atomically update both users' shifts
export const acceptSwapAtomic = async (swapId: string, requesterShiftId: string, targetShiftId: string) => {
  const db = firestore();
  return db.runTransaction(async transaction => {
    const swapRef = db.collection('swaps').doc(swapId);
    const requesterShiftRef = db.collection('shifts').doc(requesterShiftId);
    const targetShiftRef = db.collection('shifts').doc(targetShiftId);
    transaction.update(swapRef, { status: 'accepted', updatedAt: new Date().toISOString() });
    transaction.update(requesterShiftRef, { userId: (await targetShiftRef.get()).data()?.userId, swapStatus: 'completed', swapId: null });
    transaction.update(targetShiftRef, { userId: (await requesterShiftRef.get()).data()?.userId, swapStatus: 'completed', swapId: null });
  });
};

// SWAP MESSAGES
// Add a message to a swap's messages subcollection
export const addSwapMessage = (swapId: string, message: { senderId: string; text: string; timestamp: string; status?: 'sent' | 'delivered' | 'seen' }) =>
  firestore().collection('swaps').doc(swapId).collection('messages').add({ ...message, status: message.status || 'sent' });

// Update the status of a message (e.g., to 'delivered' or 'seen')
export const updateSwapMessageStatus = (swapId: string, messageId: string, status: 'delivered' | 'seen') =>
  firestore().collection('swaps').doc(swapId).collection('messages').doc(messageId).update({ status });

// Listen for real-time changes to swap messages
export const onSwapMessagesChange = (swapId: string, callback: (messages: any[]) => void) =>
  firestore().collection('swaps').doc(swapId).collection('messages').orderBy('timestamp').onSnapshot(snapshot => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });

// WALLETS
// Add or update a wallet document
export const addWallet = (wallet: Wallet) =>
  firestore().collection('wallets').doc(wallet.uid).set(wallet);

// Get a wallet document by uid
export const getWallet = (uid: string) =>
  firestore().collection('wallets').doc(uid).get();

// Listen for real-time changes to a wallet document
export const onWalletChange = (uid: string, callback: (wallet: Wallet | null) => void) =>
  firestore().collection('wallets').doc(uid).onSnapshot(doc => {
    callback(doc.exists ? (doc.data() as Wallet) : null);
  }); 
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';
// --- FCM PUSH NOTIFICATION SETUP (reference, requires @react-native-firebase/messaging) ---
// import messaging from '@react-native-firebase/messaging';

// Request user permission for notifications and get FCM token
export async function requestNotificationPermissionAndToken() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  if (enabled) {
    const fcmToken = await messaging().getToken();
    return fcmToken;
  }
  return null;
}

// Listen for foreground messages
export function onForegroundNotification(callback: (remoteMessage: any) => void) {
  return messaging().onMessage(callback);
}

// To send push notifications, use Firebase Cloud Functions or server-side code to send to the device tokens saved in Firestore.
// See: https://rnfirebase.io/messaging/usage and Firebase docs for setup steps.

export { auth, firestore }; 
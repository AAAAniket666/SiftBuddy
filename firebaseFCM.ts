import messaging from '@react-native-firebase/messaging';

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
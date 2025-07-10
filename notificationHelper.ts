import PushNotification from 'react-native-push-notification';
import { Platform, Alert } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Call this once (e.g., in App.tsx or on app start)
export function initializeNotifications() {
  if (Platform.OS === 'android') {
    PushNotification.createChannel(
      {
        channelId: 'shift-reminders',
        channelName: 'Shift Reminders',
        channelDescription: 'Reminders for upcoming shifts',
        importance: 4, // Max
        vibrate: true,
      },
      (created) => console.log(`createChannel returned '${created}'`) // log result
    );
  }
}

// Schedule a local notification for a shift
export function scheduleShiftReminder(
  shiftId: string,
  shiftTitle: string,
  shiftTime: Date,
  enable1h: boolean = true,
  enable30m: boolean = true
) {
  if (enable1h) {
    const fireTime1 = new Date(shiftTime.getTime() - 60 * 60 * 1000);
    console.log('[LocalNotification] Scheduling for:', fireTime1.toString(), '(1 hour before)', 'Shift:', shiftTitle, 'ID:', shiftId);
    PushNotification.localNotificationSchedule({
      channelId: 'shift-reminders',
      title: 'Upcoming Shift',
      message: `You have a shift: ${shiftTitle} in 1 hour`,
      date: fireTime1,
      allowWhileIdle: true,
      playSound: true,
      soundName: 'default',
      importance: 'max',
      id: shiftId + '_1h',
      smallIcon: 'ic_notification',
      color: '#A15C48',
    });
  }
  if (enable30m) {
    const fireTime2 = new Date(shiftTime.getTime() - 30 * 60 * 1000);
    console.log('[LocalNotification] Scheduling for:', fireTime2.toString(), '(30 min before)', 'Shift:', shiftTitle, 'ID:', shiftId);
    PushNotification.localNotificationSchedule({
      channelId: 'shift-reminders',
      title: 'Upcoming Shift',
      message: `You have a shift: ${shiftTitle} in 30 minutes`,
      date: fireTime2,
      allowWhileIdle: true,
      playSound: true,
      soundName: 'default',
      importance: 'max',
      id: shiftId + '_30m',
      smallIcon: 'ic_notification',
      color: '#A15C48',
    });
  }
}

export type InAppNotification = {
  id: string;
  title: string;
  message: string;
  type: string;
  timestamp: number;
  read: boolean;
};

const NOTIFICATION_HISTORY_KEY = 'notification_history';

export async function saveNotificationToHistory(notification: InAppNotification) {
  try {
    const existing = await AsyncStorage.getItem(NOTIFICATION_HISTORY_KEY);
    const history: InAppNotification[] = existing ? JSON.parse(existing) : [];
    history.unshift(notification); // Add to top
    await AsyncStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(history.slice(0, 100)));
  } catch (e) {
    console.warn('Failed to save notification to history', e);
  }
}

export async function loadNotificationHistory(): Promise<InAppNotification[]> {
  try {
    const existing = await AsyncStorage.getItem(NOTIFICATION_HISTORY_KEY);
    return existing ? JSON.parse(existing) : [];
  } catch (e) {
    return [];
  }
}

// Foreground handler for local notifications
export function setForegroundNotificationHandler() {
  PushNotification.configure({
    onNotification: function (notification) {
      const notifObj = {
        id: `${Date.now()}_${Math.random()}`,
        title: notification.title || 'Notification',
        message: notification.message || '',
        type: notification.foreground ? 'foreground' : 'background',
        timestamp: Date.now(),
        read: false,
      };
      if (notification.foreground) {
        showMessage({
          message: notifObj.title,
          description: notifObj.message,
          type: 'info',
          backgroundColor: '#A15C48', // Brand color
          color: '#fff',
        });
      }
      // Save to history for both foreground and background
      saveNotificationToHistory(notifObj);
    },
    // Android only: (optional) Called when a remote or local notification is opened or received
    popInitialNotification: true,
    requestPermissions: false, // We handle permissions separately
  });
} 
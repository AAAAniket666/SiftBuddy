// 4. Scheduled notification before shift start
export const notifyBeforeShift = functions.pubsub.schedule('every 5 minutes').onRun(async (context) => {
  const now = new Date();
  const thirtyMin = new Date(now.getTime() + 30 * 60000);
  const sixtyMin = new Date(now.getTime() + 60 * 60000);
  // Query all shifts starting in next 30 or 60 minutes
  const shiftsSnap = await db.collection('shifts').where('start', '>=', now.toISOString()).where('start', '<=', sixtyMin.toISOString()).get();
  for (const doc of shiftsSnap.docs) {
    const shift = doc.data();
    if (!shift.userId) continue;
    const start = new Date(shift.start);
    let minutesToStart = Math.round((start.getTime() - now.getTime()) / 60000);
    let notifyType = '';
    if (minutesToStart <= 30 && minutesToStart > 25) notifyType = '30min';
    else if (minutesToStart <= 60 && minutesToStart > 55) notifyType = '60min';
    if (notifyType) {
      await sendNotificationToUser(
        shift.userId,
        {
          title: `Upcoming Shift Reminder`,
          body: `Your shift at ${shift.location || 'work'} starts in ${notifyType === '30min' ? '30' : '60'} minutes.`,
        },
        { shiftId: shift.shiftId, type: `shift_reminder_${notifyType}` }
      );
    }
  }
  return null;
});
/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

admin.initializeApp();

const db = admin.firestore();

// Helper to send notification
async function sendNotificationToUser(
  userId: string,
  notification: admin.messaging.NotificationMessagePayload,
  data: { [key: string]: string } = {}
) {
  const userDoc = await db.collection('users').doc(userId).get();
  const fcmToken = userDoc.data()?.fcmToken;
  if (!fcmToken) {
    console.warn(`No FCM token for user ${userId}`);
    return;
  }
  try {
    await admin.messaging().sendToDevice(fcmToken, {
      notification,
      data,
    });
    console.log(`Notification sent to user ${userId} (token: ${fcmToken})`, { notification, data });
  } catch (error) {
    console.error(`Error sending notification to user ${userId} (token: ${fcmToken}):`, error);
    // Optionally, remove invalid tokens from Firestore if error.code === 'messaging/invalid-registration-token'
  }
}

// 1. Notify on new swap request
export const notifyOnSwapRequest = functions.firestore
  .document('swaps/{swapId}')
  .onCreate(async (
    snap: functions.firestore.QueryDocumentSnapshot,
    context: functions.EventContext
  ) => {
    const swap = snap.data();
    await sendNotificationToUser(
      swap.targetUserId,
      {
        title: 'New Swap Request',
        body: `You have a new swap request from ${swap.requesterId}`,
      },
      { swapId: context.params.swapId, type: 'swap_request' }
    );
    return null;
  });

// 2. Notify on swap accept/reject
export const notifyOnSwapStatusChange = functions.firestore
  .document('swaps/{swapId}')
  .onUpdate(async (
    change: functions.Change<functions.firestore.DocumentSnapshot>,
    context: functions.EventContext
  ) => {
    const before = change.before.data();
    const after = change.after.data();
    if (before && after && before.status !== after.status && ['accepted', 'rejected'].includes(after.status)) {
      // Notify both requester and target
      const usersToNotify = [after.requesterId, after.targetUserId];
      await Promise.all(usersToNotify.map(userId =>
        sendNotificationToUser(
          userId,
          {
            title: `Swap ${after.status.charAt(0).toUpperCase() + after.status.slice(1)}`,
            body: `Swap with ID ${context.params.swapId} was ${after.status}.`,
          },
          { swapId: context.params.swapId, type: `swap_${after.status}` }
        )
      ));
    }
    return null;
  });

// 3. Notify on new chat message
export const notifyOnSwapChatMessage = functions.firestore
  .document('swaps/{swapId}/messages/{messageId}')
  .onCreate(async (
    snap: functions.firestore.QueryDocumentSnapshot,
    context: functions.EventContext
  ) => {
    const message = snap.data();
    const swapDoc = await db.collection('swaps').doc(context.params.swapId).get();
    const swap = swapDoc.data();
    if (!swap) return null;
    // Notify the other user
    const recipientId = message.senderId === swap.requesterId ? swap.targetUserId : swap.requesterId;
    await sendNotificationToUser(
      recipientId,
      {
        title: 'New Chat Message',
        body: message.text,
      },
      { swapId: context.params.swapId, type: 'chat_message' }
    );
    return null;
  });

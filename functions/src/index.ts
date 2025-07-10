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

import * as OneSignal from "onesignal-node";

const oneSignalClient = new OneSignal.Client({
  userKey: process.env.ONESIGNAL_USER_KEY!,
  app: {
    appAuthKey: process.env.ONESIGNAL_REST_API_KEY!,
    appId: process.env.ONESIGNAL_APP_ID!,
  },
});

export interface PushNotificationPayload {
  userId: string;
  heading: string;
  content: string;
  data?: Record<string, string>;
}

export async function sendPushNotification(payload: PushNotificationPayload) {
  try {
    // If OneSignal is not configured, skip
    if (!process.env.ONESIGNAL_APP_ID || !process.env.ONESIGNAL_REST_API_KEY) {
      console.log("OneSignal not configured, skipping push notification");
      return;
    }

    // Send notification to specific user
    const notification = new OneSignal.Notification({
      contents: { en: payload.content },
      headings: { en: payload.heading },
      include_external_user_ids: [payload.userId],
      data: payload.data || {},
    });

    await oneSignalClient.createNotification(notification);
    console.log(`Push notification sent to user ${payload.userId}`);
  } catch (error) {
    console.error("Failed to send OneSignal push notification:", error);
    // Don't throw - let app continue even if push fails
  }
}

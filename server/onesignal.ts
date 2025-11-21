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

    // Send notification via OneSignal REST API
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: process.env.ONESIGNAL_APP_ID,
        include_external_user_ids: [payload.userId],
        contents: { en: payload.content },
        headings: { en: payload.heading },
        data: payload.data || {},
      }),
    });

    if (!response.ok) {
      console.error("OneSignal API error:", await response.text());
      return;
    }

    console.log(`Push notification sent to user ${payload.userId}`);
  } catch (error) {
    console.error("Failed to send OneSignal push notification:", error);
    // Don't throw - let app continue even if push fails
  }
}

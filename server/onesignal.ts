export interface PushNotificationPayload {
  userId: string;
  heading: string;
  content: string;
  data?: Record<string, string>;
}

export async function sendPushNotification(payload: PushNotificationPayload) {
  try {
    if (!process.env.ONESIGNAL_APP_ID || !process.env.ONESIGNAL_REST_API_KEY) {
      return;
    }

    const requestBody = {
      app_id: process.env.ONESIGNAL_APP_ID,
      include_external_user_ids: [payload.userId],
      contents: { en: payload.content },
      headings: { en: payload.heading },
      data: payload.data || {},
    };

    const response = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "ONESIGNAL-REST-API-KEY": process.env.ONESIGNAL_REST_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OneSignal API error:", error);
      return;
    }

    console.log(`Push notification sent to user ${payload.userId}`);
  } catch (error) {
    console.error("Failed to send OneSignal push notification:", error);
  }
}

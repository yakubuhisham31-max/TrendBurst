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
      console.log("[OneSignal] Not configured, skipping");
      return;
    }

    console.log(`[OneSignal] Sending to user: ${payload.userId}`);
    console.log(`[OneSignal] App ID: ${process.env.ONESIGNAL_APP_ID?.substring(0, 10)}...`);
    console.log(`[OneSignal] API Key configured: ${!!process.env.ONESIGNAL_REST_API_KEY}`);

    const requestBody = {
      app_id: process.env.ONESIGNAL_APP_ID,
      include_external_user_ids: [payload.userId],
      contents: { en: payload.content },
      headings: { en: payload.heading },
      data: payload.data || {},
    };

    console.log(`[OneSignal] Request body:`, JSON.stringify(requestBody, null, 2));

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": process.env.ONESIGNAL_REST_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log(`[OneSignal] Response status: ${response.status}`);
    console.log(`[OneSignal] Response body: ${responseText}`);

    if (!response.ok) {
      console.error(`[OneSignal] API error (${response.status}):`, responseText);
      return;
    }

    console.log(`[OneSignal] Success: notification sent to ${payload.userId}`);
  } catch (error) {
    console.error("[OneSignal] Exception:", error);
  }
}

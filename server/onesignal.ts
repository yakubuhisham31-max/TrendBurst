export interface PushNotificationPayload {
  userId: string;
  heading: string;
  content: string;
  data?: Record<string, string>;
}

export async function sendPushNotification(payload: PushNotificationPayload) {
  try {
    if (!process.env.ONESIGNAL_APP_ID || !process.env.ONESIGNAL_REST_API_KEY) {
      console.log("⚠️ OneSignal not configured - missing APP_ID or API_KEY");
      console.log(`APP_ID: ${process.env.ONESIGNAL_APP_ID ? '✓ set' : '✗ missing'}`);
      console.log(`REST_API_KEY: ${process.env.ONESIGNAL_REST_API_KEY ? '✓ set' : '✗ missing'}`);
      return;
    }

    console.log(`📢 Sending push notification: "${payload.heading}" to user ${payload.userId}`);

    // Determine icon URLs based on environment
    const isProduction = process.env.NODE_ENV === 'production';
    const domain = isProduction ? 'https://trendx.social' : 'https://trendx.social';
    const logoUrl = `${domain}/favicon.png`;

    const requestBody = {
      app_id: process.env.ONESIGNAL_APP_ID,
      include_external_user_ids: [payload.userId],
      contents: { en: payload.content },
      headings: { en: payload.heading },
      name: `notification_${Date.now()}`,
      data: payload.data || {},
      
      // ========== BRANDING CONFIGURATION ==========
      // Main logo/icon that displays in notification
      chrome_web_icon: logoUrl,
      chrome_icon: logoUrl,
      large_icon: logoUrl,
      adm_small_icon: logoUrl,
      
      // Big picture for visual impact on Android
      big_picture: logoUrl,
      chrome_web_badge: logoUrl,
      
      // Notification appearance
      ios_attachments: { image: logoUrl },
      
      // Platform-specific configuration
      isWebPush: true,
      channelForExternalUserIds: true,
    };

    const apiKey = process.env.ONESIGNAL_REST_API_KEY;
    console.log(`🔑 API Key first 20 chars: ${apiKey?.substring(0, 20)}...`);
    console.log(`🖼️ Logo URL: ${logoUrl}`);
    console.log(`📡 Using Authorization header: Bearer ${apiKey?.substring(0, 20)}...`);

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`📊 OneSignal API response status: ${response.status}`);

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ OneSignal API error:", error);
      return;
    }

    console.log(`✅ Push notification sent to user ${payload.userId}`);
  } catch (error) {
    console.error("❌ Failed to send OneSignal push notification:", error);
  }
}

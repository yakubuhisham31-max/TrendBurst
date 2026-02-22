export interface PushNotificationPayload {
  userId: string;
  heading: string;
  content: string;
  data?: Record<string, string>;
}

export async function sendPushNotification(payload: PushNotificationPayload) {
  try {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📤 sendPushNotification() called");
    console.log(`   📢 Heading: "${payload.heading}"`);
    console.log(`   👤 To external_id: ${payload.userId}`);
    console.log(`   📝 Content: "${payload.content}"`);
    
    if (!process.env.ONESIGNAL_APP_ID || !process.env.ONESIGNAL_REST_API_KEY) {
      console.log("⚠️ OneSignal not configured - missing APP_ID or API_KEY");
      console.log(`   APP_ID: ${process.env.ONESIGNAL_APP_ID ? '✓ set' : '✗ MISSING'}`);
      console.log(`   REST_API_KEY: ${process.env.ONESIGNAL_REST_API_KEY ? '✓ set' : '✗ MISSING'}`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
      return;
    }

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
    console.log(`   🔑 API Key: ${apiKey?.substring(0, 20)}...`);
    console.log(`   🆔 App ID: ${process.env.ONESIGNAL_APP_ID?.substring(0, 20)}...`);
    console.log(`   🖼️ Logo URL: ${logoUrl}`);
    console.log(`   📡 Request Body:`, JSON.stringify(requestBody, null, 2));
    console.log(`   📡 Calling OneSignal API...`);

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`   📊 API Response Status: ${response.status}`);

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ OneSignal API error (${response.status}):`, error);
      console.log(`   📝 Full error response: ${error}`);
      
      // Check if it's a "no subscribers" error
      if (error.includes("no_subscribed_users") || (error.includes("All") && error.includes("not valid"))) {
        console.warn("⚠️  User has no active push subscriptions");
        console.warn("   → User needs to:");
        console.warn("     1. Sign in to https://trendx.social");
        console.warn("     2. Click 'Enable Push' button in the header");
        console.warn("     3. Grant browser notification permission");
      }
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
      return;
    }

    const responseData = await response.json();
    console.log(`✅ Push notification sent to OneSignal!`);
    console.log(`   🎯 OneSignal Response:`, responseData);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } catch (error) {
    console.error("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("❌ Failed to send OneSignal push notification:", error);
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  }
}

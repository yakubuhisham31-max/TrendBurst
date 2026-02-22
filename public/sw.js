// Service Worker for Trendx Application

console.log("🔧 Service Worker script loaded");

// Listen for messages from the app
self.addEventListener("message", (event) => {
  console.log("📨 Service Worker received message:", event.data);
  
  if (event.data && event.data.type === "TEST_MESSAGE") {
    console.log("✅ TEST MESSAGE received in Service Worker");
    console.log("   Payload:", event.data.payload);
    
    // Echo back to the app
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({
        type: "TEST_MESSAGE_RESPONSE",
        message: "Service Worker received and processed message",
        timestamp: new Date().toISOString()
      });
    }
  }
});

// Activation and installation
self.addEventListener("install", (event) => {
  console.log("🛠️ Service Worker installing...");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("✅ Service Worker activated");
  event.waitUntil(clients.claim());
});

// Handle push notifications - display detailed logs and show notifications
self.addEventListener("push", (event) => {
  console.log("📬 PUSH EVENT RECEIVED");
  console.log("   Event:", event);
  
  if (!event.data) {
    console.log("   ⚠️ No data in push event - ignoring");
    return;
  }

  try {
    const rawData = event.data.text();
    console.log("   📝 Raw push data:", rawData);
    
    let data;
    try {
      data = JSON.parse(rawData);
      console.log("   ✅ Parsed JSON:", data);
    } catch (e) {
      console.log("   ⚠️ Could not parse as JSON, treating as plain text");
      data = { message: rawData };
    }

    const title = data.title || data.heading || "Trendx Notification";
    const body = data.alert || data.body || data.message || "";
    const icon = data.icon || data.big_picture || "/favicon.png";
    const badge = data.badge || "/favicon.png";
    const tag = data.custom?.i || data.tag || "trendx-notification";

    console.log(`   🔔 Will display: "${title}"`);
    console.log(`   📝 Body: "${body}"`);
    console.log(`   🎯 Tag: "${tag}"`);

    const options = {
      body: body,
      icon: icon,
      badge: badge,
      tag: tag,
      requireInteraction: false,
      data: data.custom || data || {}
    };

    console.log("   📤 Showing notification with options:", options);

    event.waitUntil(
      self.registration.showNotification(title, options)
        .then(() => {
          console.log("✅ NOTIFICATION DISPLAYED SUCCESSFULLY");
        })
        .catch((err) => {
          console.error("❌ FAILED TO DISPLAY NOTIFICATION:", err);
          console.error("   Error name:", err.name);
          console.error("   Error message:", err.message);
        })
    );
  } catch (err) {
    console.error("❌ ERROR PROCESSING PUSH EVENT:", err);
    console.error("   Stack:", err instanceof Error ? err.stack : "N/A");
  }
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("🔔 NOTIFICATION CLICKED:", event.notification.title);
  event.notification.close();
  
  // Optionally focus the window
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow('/');
    })
  );
});

console.log("✅ Service Worker ready to receive messages");

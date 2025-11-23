importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Log service worker activation
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("[OneSignal SW] Service worker loaded and ready");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

// Log service worker details
self.addEventListener("install", (event) => {
  console.log("[OneSignal SW] Service worker installing...");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[OneSignal SW] Service worker activating and claiming clients");
  event.waitUntil(self.clients.claim());
});

// Handle push events
self.addEventListener("push", (event) => {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("[OneSignal SW] 🔔 PUSH NOTIFICATION RECEIVED");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  if (!event.data) {
    console.warn("[OneSignal SW] ⚠️  Push event has no data");
    return;
  }
  
  let pushData = null;
  let title = "Notification";
  let options = {
    body: "You have a new notification",
    icon: "/icon-192x192.png",
    badge: "/badge-72x72.png",
    tag: "notification",
    requireInteraction: false
  };
  
  try {
    // Try to parse as JSON first
    pushData = event.data.json();
    console.log("[OneSignal SW] 📨 Notification Data (parsed JSON):", pushData);
    
    // Extract title and content from parsed JSON
    if (pushData.headings && pushData.headings.en) {
      title = pushData.headings.en;
    } else if (pushData.heading) {
      title = pushData.heading;
    }
    
    if (pushData.contents && pushData.contents.en) {
      options.body = pushData.contents.en;
    } else if (pushData.content) {
      options.body = pushData.content;
    }
    
    if (pushData.data) {
      options.data = pushData.data;
    }
  } catch (jsonError) {
    // If JSON parsing fails, try getting text
    try {
      const textData = event.data.text();
      console.log("[OneSignal SW] 📨 Notification Data (text):", textData);
      options.body = textData;
    } catch (textError) {
      console.warn("[OneSignal SW] ⚠️  Could not parse push data:", jsonError);
      return;
    }
  }
  
  // Log notification details
  if (pushData) {
    if (pushData.data) {
      console.log("[OneSignal SW] 🆔 Data Object:", pushData.data);
    }
    if (pushData.heading || pushData.headings) {
      console.log("[OneSignal SW] 📝 Heading:", title);
    }
    if (pushData.contents || pushData.content) {
      console.log("[OneSignal SW] 📄 Content:", options.body);
    }
  }
  
  // IMPORTANT: Actually show the notification to the user
  console.log("[OneSignal SW] 📢 Displaying notification to user...");
  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => {
        console.log("[OneSignal SW] ✅ Notification displayed successfully");
      })
      .catch((error) => {
        console.error("[OneSignal SW] ❌ Failed to show notification:", error);
      })
  );
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("[OneSignal SW] 👆 Notification clicked:", event.notification.tag);
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === "/" && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow("/");
      }
    })
  );
});

console.log("[OneSignal SW] ✅ Event listeners registered for push and notification clicks");

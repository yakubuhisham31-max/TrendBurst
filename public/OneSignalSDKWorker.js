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
  
  try {
    // Try to parse as JSON first
    pushData = event.data.json();
    console.log("[OneSignal SW] 📨 Notification Data (parsed JSON):", pushData);
  } catch (jsonError) {
    // If JSON parsing fails, try getting text
    try {
      const textData = event.data.text();
      console.log("[OneSignal SW] 📨 Notification Data (text):", textData);
      pushData = { text: textData };
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
      console.log("[OneSignal SW] 📝 Heading:", pushData.heading || pushData.headings);
    }
    if (pushData.contents || pushData.content) {
      console.log("[OneSignal SW] 📄 Content:", pushData.contents || pushData.content);
    }
  }
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

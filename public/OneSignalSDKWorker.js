importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Log service worker activation
console.log("[OneSignal SW] Service worker loaded and ready to handle push events");

// Handle push events
self.addEventListener("push", (event) => {
  console.log("[OneSignal SW] Push event received:", event);
  if (!event.data) {
    console.warn("[OneSignal SW] Push event has no data");
    return;
  }
  console.log("[OneSignal SW] Push notification data:", event.data.json());
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("[OneSignal SW] Notification clicked:", event.notification.tag);
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

console.log("[OneSignal SW] Event listeners registered for push and notification clicks");

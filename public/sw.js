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

// OneSignal's SDK handles push notifications
// Our custom SW just provides message handling and lifecycle management
// Let OneSignalSDKWorker.js handle all push events and notification display

console.log("✅ Service Worker ready to receive messages");

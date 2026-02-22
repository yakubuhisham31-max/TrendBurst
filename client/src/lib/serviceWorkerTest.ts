/**
 * Service Worker messaging utility
 * Use in browser console: testServiceWorker() to test messaging
 */

export async function testServiceWorker(payload: any = { test: "data" }) {
  console.log("🧪 Testing Service Worker messaging...");
  
  if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
    console.error("❌ No active Service Worker controller found!");
    console.log("   Available registrations:", await navigator.serviceWorker.getRegistrations());
    return null;
  }
  
  console.log("✅ Service Worker controller is active");
  
  const channel = new MessageChannel();
  
  return new Promise((resolve) => {
    // Set up listener for response
    channel.port1.onmessage = (event) => {
      console.log("✅ Received response from Service Worker:", event.data);
      resolve(event.data);
    };
    
    // Send message to service worker
    console.log("📤 Sending test message to Service Worker...", payload);
    navigator.serviceWorker.controller?.postMessage(
      {
        type: "TEST_MESSAGE",
        payload: payload
      },
      [channel.port2]
    );
    
    // Timeout after 5 seconds
    setTimeout(() => {
      console.warn("⚠️  No response from Service Worker after 5 seconds");
      resolve(null);
    }, 5000);
  });
}

// Make it globally available for console testing
if (typeof window !== "undefined") {
  (window as any).testServiceWorker = testServiceWorker;
  console.log("✅ Service Worker test utility available - call testServiceWorker() in console");
}

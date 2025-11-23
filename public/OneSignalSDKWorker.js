// OneSignal Service Worker Loader
console.log('OneSignalSDKWorker.js loading...');

try {
  importScripts('https://cdn.onesignal.com/sdks/OneSignalSDKWorker.js');
  console.log('✅ OneSignalSDKWorker.js loaded successfully from CDN');
} catch (error) {
  console.error('❌ Failed to load OneSignalSDKWorker.js from CDN:', error);
  console.error('Error details:', {
    message: error?.message,
    stack: error?.stack
  });
  throw error;
}

// Log when service worker activates
self.addEventListener('activate', (event) => {
  console.log('🔄 OneSignalSDKWorker activated');
});

// Log when service worker installs
self.addEventListener('install', (event) => {
  console.log('📦 OneSignalSDKWorker installed');
  self.skipWaiting();
});

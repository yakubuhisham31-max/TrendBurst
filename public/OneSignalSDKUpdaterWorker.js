// OneSignal Service Worker Updater Loader
console.log('OneSignalSDKUpdaterWorker.js loading...');

try {
  importScripts('https://cdn.onesignal.com/sdks/OneSignalSDKWorker.js');
  console.log('✅ OneSignalSDKUpdaterWorker.js loaded successfully from CDN');
} catch (error) {
  console.error('❌ Failed to load OneSignalSDKUpdaterWorker.js from CDN:', error);
  console.error('Error details:', {
    message: error?.message,
    stack: error?.stack
  });
  throw error;
}

// Log when service worker activates
self.addEventListener('activate', (event) => {
  console.log('🔄 OneSignalSDKUpdaterWorker activated');
});

// Log when service worker installs
self.addEventListener('install', (event) => {
  console.log('📦 OneSignalSDKUpdaterWorker installed');
  self.skipWaiting();
});

import OneSignal from "onesignal-js";

export function initializeOneSignal(userId: string) {
  try {
    // OneSignal is loaded from CDN in index.html
    const onesignalAppId = import.meta.env.VITE_ONESIGNAL_APP_ID;

    if (!onesignalAppId || !window.OneSignal) {
      console.log("OneSignal not configured");
      return;
    }

    // Initialize OneSignal
    window.OneSignal.push(function () {
      window.OneSignal.init({
        appId: onesignalAppId,
        allowLocalhostAsSecureOrigin: true,
      });

      // Set external user ID for tracking
      window.OneSignal.setExternalUserId(userId);

      // Request notification permission
      window.OneSignal.showSlidedownPrompt();

      console.log("OneSignal initialized");
    });
  } catch (error) {
    console.error("Failed to initialize OneSignal:", error);
  }
}

export function updateOneSignalUserId(userId: string) {
  try {
    if (!window.OneSignal) return;

    window.OneSignal.push(function () {
      window.OneSignal.setExternalUserId(userId);
    });
  } catch (error) {
    console.error("Failed to update OneSignal user ID:", error);
  }
}

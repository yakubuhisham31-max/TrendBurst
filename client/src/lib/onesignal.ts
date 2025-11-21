declare global {
  interface Window {
    OneSignal?: any;
  }
}

export async function initializeOneSignal(userId: string) {
  try {
    const onesignalAppId = import.meta.env.VITE_ONESIGNAL_APP_ID;

    if (!onesignalAppId) {
      console.log("OneSignal app ID not configured");
      return;
    }

    if (!window.OneSignal) {
      console.log("OneSignal SDK not loaded");
      return;
    }

    // Use the v16 OneSignal API correctly
    await window.OneSignal.Slidedown.promptPush();
    
    // Set the external user ID for this user
    window.OneSignal.login(userId);

    console.log("OneSignal initialized for user:", userId);
  } catch (error) {
    console.error("Failed to initialize OneSignal:", error);
  }
}

export async function updateOneSignalUserId(userId: string) {
  try {
    if (!window.OneSignal) {
      console.log("OneSignal not available");
      return;
    }

    window.OneSignal.login(userId);
    console.log("OneSignal user ID updated:", userId);
  } catch (error) {
    console.error("Failed to update OneSignal user ID:", error);
  }
}

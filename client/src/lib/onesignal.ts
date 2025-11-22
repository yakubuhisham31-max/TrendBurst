declare global {
  interface Window {
    OneSignal?: any;
    OneSignalDeferred?: any[];
  }
}

// Helper function to wait for OneSignal SDK to load
async function waitForOneSignal(maxWaitMs = 5000): Promise<any> {
  const startTime = Date.now();
  while (!window.OneSignal && Date.now() - startTime < maxWaitMs) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return window.OneSignal;
}

export async function initializeOneSignal(userId: string) {
  try {
    const onesignalAppId = import.meta.env.VITE_ONESIGNAL_APP_ID;

    if (!onesignalAppId) {
      console.log("OneSignal app ID not configured");
      return;
    }

    // Wait for OneSignal SDK to load
    const OneSignal = await waitForOneSignal();
    if (!OneSignal) {
      console.error("OneSignal SDK failed to load after waiting");
      return;
    }

    console.log("OneSignal SDK loaded, initializing...");

    // Set the external user ID for this user
    await OneSignal.login(userId);
    
    // Prompt for push notifications
    await OneSignal.Slidedown.promptPush();

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

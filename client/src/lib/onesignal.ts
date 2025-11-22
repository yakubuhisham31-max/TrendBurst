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
    // Only run on HTTPS (production)
    if (window.location.protocol !== 'https:') {
      console.log("⚠️ OneSignal only works on HTTPS, skipping initialization");
      return;
    }

    const onesignalAppId = import.meta.env.VITE_ONESIGNAL_APP_ID;

    if (!onesignalAppId) {
      console.log("⚠️ OneSignal app ID not configured in VITE_ONESIGNAL_APP_ID");
      return;
    }

    console.log("📢 Initializing OneSignal with app ID:", onesignalAppId);

    // Wait for OneSignal SDK to load
    const OneSignal = await waitForOneSignal();
    if (!OneSignal) {
      console.error("❌ OneSignal SDK failed to load after waiting");
      return;
    }

    console.log("✅ OneSignal SDK loaded, initializing with App ID...");

    // Initialize OneSignal with App ID
    await OneSignal.init({
      appId: onesignalAppId,
    });

    console.log("✅ OneSignal initialized, logging in user:", userId);

    // Set the external user ID for this user
    await OneSignal.login(userId);
    
    // Prompt for push notifications
    console.log("📢 Prompting for push notification permission...");
    await OneSignal.Slidedown.promptPush();

    console.log("✅ OneSignal successfully initialized for user:", userId);
  } catch (error) {
    console.error("❌ Failed to initialize OneSignal:", error);
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

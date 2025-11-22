declare global {
  interface Window {
    OneSignal?: any;
    OneSignalDeferred?: any[];
  }
}

// OneSignal v16 SDK is initialized in index.html
// This function links the logged-in user's ID with their OneSignal Player ID
export async function initializeOneSignal(userId: string) {
  try {
    if (!(window as any).OneSignalDeferred) {
      console.log("⚠️ OneSignal SDK not loaded yet");
      return;
    }

    console.log("📢 Linking OneSignal to user ID:", userId);
    
    // Use OneSignalDeferred for v16 SDK
    (window as any).OneSignalDeferred.push(async function(OneSignal: any) {
      try {
        await OneSignal.setExternalUserId(userId);
        console.log("✅ OneSignal user ID set:", userId);
      } catch (error) {
        console.error("❌ Failed to set OneSignal user ID:", error);
      }
    });

  } catch (error) {
    console.error("❌ Failed to initialize OneSignal:", error);
  }
}

export async function updateOneSignalUserId(userId: string) {
  try {
    if (!(window as any).OneSignalDeferred) {
      console.log("OneSignal not available");
      return;
    }

    console.log("📢 Updating OneSignal user ID:", userId);
    
    // Use OneSignalDeferred for v16 SDK
    (window as any).OneSignalDeferred.push(async function(OneSignal: any) {
      try {
        await OneSignal.setExternalUserId(userId);
        console.log("✅ OneSignal user ID updated:", userId);
      } catch (error) {
        console.error("❌ Failed to update OneSignal user ID:", error);
      }
    });
  } catch (error) {
    console.error("Failed to update OneSignal user ID:", error);
  }
}

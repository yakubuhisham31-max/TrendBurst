declare global {
  interface Window {
    OneSignal?: any;
  }
}

// OneSignal is now initialized in index.html
// This function just associates the logged-in user with their Player ID
export async function initializeOneSignal(userId: string) {
  try {
    if (!window.OneSignal) {
      console.log("⚠️ OneSignal SDK not loaded yet");
      return;
    }

    console.log("📢 Setting OneSignal external user ID for:", userId);
    
    // Set the external user ID for this user
    window.OneSignal.push(function() {
      window.OneSignal.setExternalUserId(userId);
      console.log("✅ OneSignal user ID set:", userId);
    });

  } catch (error) {
    console.error("❌ Failed to set OneSignal user ID:", error);
  }
}

export async function updateOneSignalUserId(userId: string) {
  try {
    if (!window.OneSignal) {
      console.log("OneSignal not available");
      return;
    }

    window.OneSignal.push(function() {
      window.OneSignal.setExternalUserId(userId);
      console.log("✅ OneSignal user ID updated:", userId);
    });
  } catch (error) {
    console.error("Failed to update OneSignal user ID:", error);
  }
}

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
        // Check if SDK initialized successfully
        const isInitialized = await OneSignal.context;
        if (!isInitialized) {
          console.log("⚠️ OneSignal SDK not initialized");
          return;
        }

        // Set external user ID for push targeting
        await OneSignal.login(userId);
        console.log("✅ OneSignal user logged in:", userId);
      } catch (error) {
        console.error("❌ Failed to set OneSignal user ID:", error);
      }
    });

  } catch (error) {
    console.error("❌ Failed to initialize OneSignal:", error);
  }
}

// Request push notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (!(window as any).OneSignalDeferred) {
      console.log("⚠️ OneSignal SDK not loaded");
      return false;
    }

    return new Promise((resolve) => {
      (window as any).OneSignalDeferred.push(async function(OneSignal: any) {
        try {
          // Check if already subscribed
          const isPushEnabled = await OneSignal.Notifications.permission;
          if (isPushEnabled) {
            console.log("✅ Push notifications already enabled");
            resolve(true);
            return;
          }

          // Request permission
          const permission = await OneSignal.Notifications.requestPermission();
          console.log("📢 Notification permission:", permission);
          resolve(permission === true || permission === 'granted');
        } catch (error) {
          console.error("❌ Failed to request notification permission:", error);
          resolve(false);
        }
      });
    });
  } catch (error) {
    console.error("❌ Failed to request permission:", error);
    return false;
  }
}

// Check if user has granted notification permission
export async function checkNotificationPermission(): Promise<boolean> {
  try {
    if (!(window as any).OneSignalDeferred) {
      return false;
    }

    return new Promise((resolve) => {
      (window as any).OneSignalDeferred.push(async function(OneSignal: any) {
        try {
          const permission = await OneSignal.Notifications.permission;
          resolve(permission === true || permission === 'granted');
        } catch (error) {
          console.error("❌ Failed to check notification permission:", error);
          resolve(false);
        }
      });
    });
  } catch (error) {
    return false;
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

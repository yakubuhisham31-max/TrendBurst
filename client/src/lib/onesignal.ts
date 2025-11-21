declare global {
  interface Window {
    OneSignal?: {
      push: (fn: () => void) => void;
      init: (config: any) => void;
      setExternalUserId: (userId: string) => void;
      showSlidedownPrompt: () => void;
    };
  }
}

export function initializeOneSignal(userId: string) {
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

    window.OneSignal.push(() => {
      window.OneSignal!.init({
        appId: onesignalAppId,
        allowLocalhostAsSecureOrigin: true,
      });

      window.OneSignal!.setExternalUserId(userId);
      window.OneSignal!.showSlidedownPrompt();

      console.log("OneSignal initialized for user:", userId);
    });
  } catch (error) {
    console.error("Failed to initialize OneSignal:", error);
  }
}

export function updateOneSignalUserId(userId: string) {
  try {
    if (!window.OneSignal) {
      console.log("OneSignal not available");
      return;
    }

    window.OneSignal.push(() => {
      window.OneSignal!.setExternalUserId(userId);
      console.log("OneSignal user ID updated:", userId);
    });
  } catch (error) {
    console.error("Failed to update OneSignal user ID:", error);
  }
}

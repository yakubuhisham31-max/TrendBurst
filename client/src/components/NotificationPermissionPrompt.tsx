import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function NotificationPermissionPrompt() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Check if we've already shown the prompt this session
    const promptShownKey = `notif_prompt_shown_${user.id}`;
    const hasShownThisSession = sessionStorage.getItem(promptShownKey);

    // Only show prompt if:
    // 1. We haven't shown it yet this session
    // 2. Notifications are not granted and not previously denied (permission is "default")
    if (!hasShownThisSession && typeof Notification !== "undefined" && Notification.permission === "default") {
      setOpen(true);
      sessionStorage.setItem(promptShownKey, "true");
    }
  }, [user]);

  const handleAllow = async () => {
    try {
      if ((window as any).OneSignal && Notification.permission === "default") {
        const OS = (window as any).OneSignal;
        console.log("🔔 [Prompt] Requesting push notification permission...");
        
        const permissionGranted = await OS.Notifications.requestPermission();
        
        if (permissionGranted) {
          console.log("✅ [Prompt] Push notifications enabled!");
          
          // Wait for subscription to be created
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Capture subscription IDs
          try {
            const subscriptionId = OS.User.PushSubscription.id;
            const oneSignalUserId = OS.User.onesignal_id;
            const pushToken = OS.User.PushSubscription.token;
            
            console.log(`   📱 Push Subscription ID: ${subscriptionId || 'pending'}`);
            console.log(`   🆔 OneSignal User ID: ${oneSignalUserId || 'pending'}`);
            
            // Save subscription IDs to backend
            const response = await fetch("/api/push/subscribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                subscriptionId: subscriptionId || 'pending',
                oneSignalUserId,
                pushToken,
              }),
            });
            
            if (response.ok) {
              const data = await response.json();
              console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
              console.log("✅ SUBSCRIPTION SAVED (FROM PROMPT)");
              console.log(`   Trendx User ID: ${data.ids.userId}`);
              console.log(`   Subscription ID: ${data.ids.subscriptionId}`);
              console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            }
          } catch (idError) {
            console.log("ℹ️  Could not capture subscription IDs:", (idError as Error).message);
          }
        } else {
          console.log("ℹ️  [Prompt] Push notifications denied by user");
        }
      }
    } catch (error) {
      console.log("ℹ️  [Prompt] Permission request error:", (error as Error).message);
    }
    
    setOpen(false);
  };

  const handleDeny = () => {
    console.log("ℹ️  [Prompt] User declined notification prompt");
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent data-testid="dialog-notification-permission">
        <AlertDialogHeader>
          <AlertDialogTitle data-testid="text-notification-title">Enable Push Notifications?</AlertDialogTitle>
          <AlertDialogDescription data-testid="text-notification-description">
            Get instant updates when someone interacts with your posts, joins trends, or mentions you. You can manage this anytime in your browser settings.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-3 justify-end">
          <AlertDialogCancel onClick={handleDeny} data-testid="button-notification-deny">
            Not now
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleAllow} data-testid="button-notification-allow">
            Enable
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface NotificationPermissionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationPermissionModal({ isOpen, onOpenChange }: NotificationPermissionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      const OS = (window as any).OneSignal;
      
      // Check if OneSignal is available
      if (!OS || !OS.Notifications || typeof OS.Notifications.requestPermission !== 'function') {
        console.log("ℹ️ OneSignal not available - skipping push notifications");
        toast({
          title: "Note",
          description: "Push notifications are available on https://trendx.social",
        });
        onOpenChange(false);
        return;
      }

      // Request browser permission
      if (Notification.permission !== "granted") {
        console.log("🔔 Requesting push notification permission...");
        const permissionGranted = await OS.Notifications.requestPermission();
        
        if (!permissionGranted) {
          toast({
            title: "Skipped",
            description: "You can enable notifications anytime from your profile settings.",
          });
          onOpenChange(false);
          return;
        }
      }

      // Get subscription ID
      let subscriptionId = null;
      for (let i = 0; i < 20; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const id = OS.User.PushSubscription.id;
        if (id && id !== 'pending') {
          subscriptionId = id;
          break;
        }
      }

      if (!subscriptionId) {
        throw new Error("Could not get subscription ID");
      }

      // Get OneSignal User ID
      let oneSignalUserId = null;
      for (let i = 0; i < 10; i++) {
        const id = OS.User.onesignal_id;
        if (id && id !== 'pending') {
          oneSignalUserId = id;
          break;
        }
        if (i < 9) await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Save subscription to backend
      const pushToken = OS.User.PushSubscription.token;
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId,
          oneSignalUserId: oneSignalUserId || undefined,
          pushToken: pushToken,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to save subscription");
      }

      toast({
        title: "Notifications enabled!",
        description: "You'll now receive updates about posts, comments, and more.",
      });

      onOpenChange(false);
    } catch (error) {
      console.error("❌ Notification setup error:", error);
      toast({
        title: "Setup failed",
        description: "You can enable notifications anytime from your profile settings.",
      });
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Stay Updated!
          </DialogTitle>
          <DialogDescription>
            Get notified when you receive votes, comments, and when you've been followed
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-foreground">
            Enable push notifications to stay in the loop with what's happening on Trendx.
          </p>
          
          <div className="space-y-2">
            <Button
              onClick={handleEnableNotifications}
              disabled={isLoading}
              className="w-full"
              size="lg"
              data-testid="button-enable-notifications"
            >
              {isLoading ? "Enabling..." : "Enable Notifications"}
            </Button>
            <Button
              onClick={handleSkip}
              disabled={isLoading}
              variant="outline"
              className="w-full"
              size="lg"
              data-testid="button-skip-notifications"
            >
              Skip for now
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            You can change this anytime in your settings
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

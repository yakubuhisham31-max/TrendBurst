import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function PushNotificationButton() {
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Check if push notifications are supported and enabled
  useEffect(() => {
    const checkSupport = async () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window;
      setIsSupported(supported);
      
      if (supported && Notification.permission === "granted") {
        setIsEnabled(true);
      }
    };
    
    checkSupport();
  }, []);

  const saveSubscriptionToBackend = async (OS: any) => {
    console.log("⏳ Waiting for OneSignal to create subscription (up to 10s)...");
    
    let subscriptionId = null;
    for (let i = 0; i < 20; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const id = OS.User.PushSubscription.id;
      if (id && id !== 'pending') {
        subscriptionId = id;
        console.log(`✅ Got subscription ID after ${(i + 1) * 500}ms`);
        break;
      }
    }
    
    if (!subscriptionId) {
      console.error("❌ OneSignal subscription ID not available after 10s");
      throw new Error("Subscription ID not available");
    }
    
    try {
      console.log(`   📱 Push Subscription ID: ${subscriptionId}`);
      
      const oneSignalUserId = OS.User.onesignal_id;
      console.log(`   🆔 OneSignal User ID: ${oneSignalUserId || 'pending'}`);
      
      const pushToken = OS.User.PushSubscription.token;
      console.log(`   🔑 Push Token: ${pushToken ? '✓ present' : '✗ not available'}`);
      
      const response = await apiRequest("POST", "/api/push/subscribe", {
        subscriptionId,
        oneSignalUserId: oneSignalUserId,
        pushToken: pushToken,
      });
      
      const data = await response.json();
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("✅ PUSH NOTIFICATIONS ENABLED");
      console.log(`   Subscription ID: ${data.ids.subscriptionId}`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      return true;
    } catch (error) {
      console.error("❌ Failed to save subscription:", (error as Error).message);
      throw error;
    }
  };

  const handleEnablePushNotifications = async () => {
    setIsLoading(true);
    try {
      if (!(window as any).OneSignal) {
        toast({
          title: "OneSignal not available",
          description: "Push notifications are only available on https://trendx.social",
          variant: "destructive"
        });
        return;
      }

      const OS = (window as any).OneSignal;

      if (Notification.permission !== "granted") {
        console.log("🔔 Requesting push notification permission...");
        const permissionGranted = await OS.Notifications.requestPermission();
        
        if (!permissionGranted) {
          toast({
            title: "Permission denied",
            description: "You declined push notifications. You can enable them later in browser settings.",
          });
          return;
        }
        console.log("✅ Push notifications enabled!");
      } else {
        console.log("✅ Push notifications already enabled - saving subscription...");
      }

      await saveSubscriptionToBackend(OS);
      setIsEnabled(true);
      
      toast({
        title: "Push notifications enabled!",
        description: "You'll now receive notifications for posts, followers, and more.",
      });
    } catch (error) {
      toast({
        title: "Failed to enable notifications",
        description: (error as Error).message,
        variant: "destructive"
      });
      console.error("❌ Push permission error:", (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Only show button if push notifications are supported and not already enabled
  if (!isSupported || isEnabled) {
    return null;
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleEnablePushNotifications}
      disabled={isLoading}
      className="gap-2"
      data-testid="button-enable-push"
    >
      <Bell className="w-4 h-4" />
      {isLoading ? "Enabling..." : "Enable Push"}
    </Button>
  );
}

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function PushNotificationButton() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Check if push notifications are already enabled in backend
  useEffect(() => {
    const checkIfEnabled = async () => {
      try {
        console.log("🔍 Checking push notification status...");
        // Check if we have a saved subscription in backend
        const response = await apiRequest("GET", "/api/push/status", {});
        if (response.ok) {
          const data = await response.json();
          console.log("📊 Push status response:", data);
          if (data.isEnabled) {
            setIsEnabled(true);
            console.log("✅ Push notifications already enabled - button will show 'Enabled'");
          } else {
            console.log("❌ No active push subscription - button will show 'Enable Push'");
          }
        }
      } catch (error) {
        console.log("⚠️  Push notification status check failed:", (error as Error).message);
      }
    };
    
    checkIfEnabled();
  }, []);

  const saveSubscriptionToBackend = async (OS: any) => {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📤 SAVING SUBSCRIPTION TO BACKEND");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("⏳ Waiting for OneSignal to create subscription (up to 10s)...");
    
    let subscriptionId = null;
    for (let i = 0; i < 20; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const id = OS.User.PushSubscription.id;
      if (id && id !== 'pending') {
        subscriptionId = id;
        console.log(`✅ Got subscription ID after ${(i + 1) * 500}ms: ${subscriptionId}`);
        break;
      }
    }
    
    if (!subscriptionId) {
      const error = "OneSignal subscription ID not available after 10 seconds";
      console.error("❌", error);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
      throw new Error(error);
    }
    
    try {
      console.log(`   📱 Subscription ID: ${subscriptionId}`);
      
      // Wait for OneSignal User ID to be assigned (up to 5 seconds)
      let oneSignalUserId = null;
      for (let i = 0; i < 10; i++) {
        const id = OS.User.onesignal_id;
        if (id && id !== 'pending') {
          oneSignalUserId = id;
          console.log(`✅ OneSignal User ID assigned after ${(i + 1) * 500}ms: ${oneSignalUserId}`);
          break;
        }
        if (i < 9) await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      if (!oneSignalUserId) {
        console.log(`   ⚠️  OneSignal User ID not assigned yet (will be assigned by backend)`);
      }
      
      const pushToken = OS.User.PushSubscription.token;
      console.log(`   🔑 Push Token: ${pushToken ? 'present' : 'not available'}`);
      console.log(`   📤 Sending to backend...`);
      
      const response = await apiRequest("POST", "/api/push/subscribe", {
        subscriptionId,
        oneSignalUserId: oneSignalUserId || undefined,
        pushToken: pushToken,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Backend returned error (${response.status}):`, errorText);
        throw new Error(`Backend error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("✅ PUSH NOTIFICATIONS ENABLED!");
      console.log(`   Subscription saved: ${data.ids.subscriptionId}`);
      console.log(`   External ID (Trendx): ${data.ids.externalId}`);
      console.log(`   OneSignal User ID: ${data.ids.oneSignalUserId}`);
      console.log("   Status: READY TO RECEIVE NOTIFICATIONS 🚀");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
      return true;
    } catch (error) {
      console.error("❌ Failed to save subscription:", (error as Error).message);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
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

  return (
    <Button
      size="sm"
      variant={isEnabled ? "default" : "outline"}
      onClick={handleEnablePushNotifications}
      disabled={isLoading || isEnabled}
      className="gap-2"
      data-testid="button-enable-push"
    >
      <Bell className="w-4 h-4" />
      {isLoading ? "Enabling..." : isEnabled ? "Enabled" : "Enable Push"}
    </Button>
  );
}

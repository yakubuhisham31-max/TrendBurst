import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import type { Notification, User } from "@shared/schema";
import { notificationSound } from "@/lib/notificationSound";

type NotificationWithActor = Notification & {
  actor: Pick<User, "id" | "username" | "profilePicture"> | null;
};

function getNotificationMessage(notification: NotificationWithActor): string {
  const actorName = notification.actor?.username || "Someone";
  
  switch (notification.type) {
    case "comment_on_post":
      return `${actorName} commented on your post`;
    case "new_follower":
      return `${actorName} started following you`;
    case "new_post_from_following":
      return `${actorName} posted to a trend you follow`;
    case "new_trend_from_following":
      return `${actorName} created a new trend`;
    case "reply_to_comment":
      return `${actorName} replied to your comment`;
    case "mention":
      return `${actorName} mentioned you in a comment`;
    case "vote_on_post": {
      const voteCount = notification.voteCount || 1;
      return `${actorName} voted ${voteCount}x on your post`;
    }
    case "post_in_your_trend":
      return `${actorName} posted in your trend`;
    case "earned_points":
      return `You earned ${notification.pointsEarned || 50} TrendX points!`;
    case "bonus_reward": {
      const points = notification.pointsEarned || 0;
      let place = "Top 3";
      if (points === 150) place = "1st place";
      else if (points === 100) place = "2nd place";
      else if (points === 50) place = "3rd place";
      return `Congratulations! ${place} - You earned ${points} bonus points!`;
    }
    default:
      return "New notification";
  }
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const previousUnreadCount = useRef<number | null>(null);

  // Request push notification permission when bell is clicked (OneSignal v16)
  const requestPushPermission = async () => {
    try {
      if ((window as any).OneSignal && Notification.permission !== "granted") {
        const OS = (window as any).OneSignal;
        console.log("🔔 Requesting push notification permission...");
        
        // OneSignal v16 native permission request (creates subscription automatically)
        const permissionGranted = await OS.Notifications.requestPermission();
        
        if (permissionGranted) {
          console.log("✅ Push notifications enabled!");
          console.log("⏳ Waiting for OneSignal to create subscription (up to 10s)...");
          
          // Wait for subscription to be created - OneSignal v16 needs time to assign IDs
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
            console.error("⚠️  Push notifications may not work. Try again or check OneSignal dashboard.");
            return;
          }
          
          // Capture all necessary IDs for tracking
          try {
            console.log(`   📱 Push Subscription ID: ${subscriptionId}`);
            
            // Get OneSignal's internal user ID
            const oneSignalUserId = OS.User.onesignal_id;
            console.log(`   🆔 OneSignal User ID: ${oneSignalUserId || 'pending'}`);
            
            // Get push token if available
            const pushToken = OS.User.PushSubscription.token;
            console.log(`   🔑 Push Token: ${pushToken ? '✓ present' : '✗ not available'}`);
            
            // Save subscription IDs to backend
            const response = await apiRequest("POST", "/api/push/subscribe", {
              subscriptionId,
              oneSignalUserId: oneSignalUserId,
              pushToken: pushToken,
            });
            
            const responseText = await response.text();
            
            if (!response.ok) {
              console.error("❌ Subscription save failed:", response.status, responseText);
              throw new Error(responseText || "Failed to save subscription");
            }
            
            const data = JSON.parse(responseText);
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("✅ SUBSCRIPTION SAVED TO DATABASE");
            console.log(`   Trendx User ID: ${data.ids.userId}`);
            console.log(`   OneSignal External ID: ${data.ids.externalId}`);
            console.log(`   Subscription ID: ${data.ids.subscriptionId}`);
            console.log(`   OneSignal User ID: ${data.ids.oneSignalUserId}`);
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          } catch (idError) {
            console.error("❌ Failed to save subscription:", (idError as Error).message);
          }
        } else {
          console.log("ℹ️  Push notifications denied by user");
        }
      }
    } catch (error) {
      console.log("ℹ️  Push permission request:", (error as Error).message);
    }
  };

  // Fetch unread count
  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Play sound when new notifications arrive
  useEffect(() => {
    const currentCount = unreadData?.count || 0;
    
    // Only play sound if count increased (not on initial load)
    if (previousUnreadCount.current !== null && currentCount > previousUnreadCount.current) {
      notificationSound.play();
    }
    
    previousUnreadCount.current = currentCount;
  }, [unreadData?.count]);

  // Fetch notifications
  const { data: notifications = [] } = useQuery<NotificationWithActor[]>({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications?limit=20", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const data = await res.json();
      return data.map((n: any) => ({
        ...n,
        createdAt: new Date(n.createdAt),
      }));
    },
    enabled: open,
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", "/api/notifications/mark-all-read");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await apiRequest("DELETE", `/api/notifications/${notificationId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const handleDeleteNotification = (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent any parent click handlers
    deleteNotificationMutation.mutate(notificationId);
  };

  const unreadCount = unreadData?.count || 0;

  // Handle popover open - allow re-requesting permission anytime
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && Notification.permission !== "granted") {
      requestPushPermission();
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="button-notification-bell"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              data-testid="badge-notification-count"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" data-testid="popover-notifications">
        <div className="flex items-center justify-between p-4">
          <h3 className="font-semibold text-lg">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              data-testid="button-mark-all-read"
            >
              Mark all as read
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground" data-testid="text-no-notifications">
              No notifications yet
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`w-full p-4 ${
                    !notification.isRead ? "bg-accent/50" : ""
                  }`}
                  data-testid={`notification-item-${notification.id}`}
                >
                  <div className="flex items-start gap-3">
                    {notification.actor?.profilePicture ? (
                      <img
                        src={notification.actor.profilePicture}
                        alt={notification.actor.username}
                        className="w-10 h-10 rounded-full object-cover"
                        data-testid={`img-notification-avatar-${notification.id}`}
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold"
                        data-testid={`avatar-notification-${notification.id}`}
                      >
                        {notification.actor?.username?.[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm" data-testid={`text-notification-message-${notification.id}`}>
                        {getNotificationMessage(notification)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1" data-testid={`text-notification-time-${notification.id}`}>
                        {notification.createdAt ? formatDistanceToNow(notification.createdAt, { addSuffix: true }) : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!notification.isRead && (
                        <div className="w-2 h-2 rounded-full bg-blue-500" data-testid={`indicator-unread-${notification.id}`} />
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => handleDeleteNotification(notification.id, e)}
                        disabled={deleteNotificationMutation.isPending}
                        data-testid={`button-delete-notification-${notification.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

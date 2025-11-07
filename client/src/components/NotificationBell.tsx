import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Bell } from "lucide-react";
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
    case "vote_on_post": {
      const voteCount = notification.voteCount || 1;
      return `${actorName} voted ${voteCount}x on your post`;
    }
    default:
      return "New notification";
  }
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();

  // Fetch unread count
  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 10000, // Refetch every 10 seconds
  });

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

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await apiRequest("PATCH", `/api/notifications/${notificationId}/read`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
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

  const handleNotificationClick = (notification: NotificationWithActor) => {
    // Mark as read
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navigate to relevant content
    if (notification.postId) {
      // Navigate to feed page for the trend
      setLocation(`/feed/${notification.trendId}`);
    } else if (notification.trendId) {
      // Navigate to trend instructions or feed
      setLocation(`/instructions/${notification.trendId}`);
    } else if (notification.type === "new_follower" && notification.actorId) {
      // Navigate to actor's profile
      setLocation(`/profile/${notification.actorId}`);
    }

    setOpen(false);
  };

  const unreadCount = unreadData?.count || 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full text-left p-4 hover:bg-accent transition-colors ${
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
                    {!notification.isRead && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" data-testid={`indicator-unread-${notification.id}`} />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

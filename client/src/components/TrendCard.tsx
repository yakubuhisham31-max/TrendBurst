import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, Users, MessageCircle, MoreVertical, Share2, Bookmark, Bell, BellOff, BellRing, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface TrendCardProps {
  id: string;
  coverImage?: string;
  trendName: string;
  username: string;
  userAvatar?: string;
  category: string;
  views: number;
  participants: number;
  chatCount: number;
  createdAt: Date;
  isHost?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
}

type NotificationStatus = "all" | "posts" | "muted";

export default function TrendCard({
  coverImage,
  trendName,
  username,
  userAvatar,
  category,
  views,
  participants,
  chatCount,
  createdAt,
  isHost = false,
  onClick,
  onDelete,
}: TrendCardProps) {
  const [notificationStatus, setNotificationStatus] = useState<NotificationStatus>("all");

  const cycleNotifications = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNotificationStatus((prev) => {
      if (prev === "all") return "posts";
      if (prev === "posts") return "muted";
      return "all";
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete();
  };

  const getNotificationIcon = () => {
    if (notificationStatus === "muted") return <BellOff className="w-4 h-4" />;
    if (notificationStatus === "posts") return <Bell className="w-4 h-4" />;
    return <BellRing className="w-4 h-4" />;
  };

  const getNotificationLabel = () => {
    if (notificationStatus === "muted") return "Muted";
    if (notificationStatus === "posts") return "Posts only";
    return "Posts & chat";
  };

  return (
    <Card
      className="overflow-hidden transition-all duration-200 hover-elevate hover:shadow-md cursor-pointer"
      onClick={onClick}
      data-testid="card-trend"
    >
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {coverImage ? (
          <img
            src={coverImage}
            alt={trendName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-chart-2/20" />
        )}
        
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/60" />

        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Avatar className="w-10 h-10 flex-shrink-0 border-2 border-white/20" data-testid="avatar-user">
              <AvatarImage src={userAvatar} alt={username} />
              <AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-medium truncate text-white" data-testid="text-username">
                {username}
              </span>
              <span className="text-xs text-white/80" data-testid="text-time">
                {formatDistanceToNow(createdAt, { addSuffix: true })}
              </span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 flex-shrink-0 text-white hover:bg-white/20"
                data-testid="button-trend-menu"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" data-testid="menu-trend-options">
              <DropdownMenuItem data-testid="menu-item-share">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem data-testid="menu-item-save">
                <Bookmark className="w-4 h-4 mr-2" />
                Save
              </DropdownMenuItem>
              <DropdownMenuItem onClick={cycleNotifications} data-testid="menu-item-notifications">
                {getNotificationIcon()}
                <span className="ml-2">{getNotificationLabel()}</span>
              </DropdownMenuItem>
              {isHost && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleDelete} 
                    className="text-destructive focus:text-destructive"
                    data-testid="menu-item-delete"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Trend
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="absolute bottom-3 left-3 right-3 text-white">
          <h3 className="text-xl font-bold line-clamp-2 mb-3 drop-shadow-lg" data-testid="text-trend-name">
            {trendName}
          </h3>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5" data-testid="stat-views">
                <Eye className="w-4 h-4" />
                <span>{views}</span>
              </div>
              <div className="flex items-center gap-1.5" data-testid="stat-participants">
                <Users className="w-4 h-4" />
                <span>{participants}</span>
              </div>
              <div className="flex items-center gap-1.5" data-testid="stat-chat">
                <MessageCircle className="w-4 h-4" />
                <span>{chatCount}</span>
              </div>
            </div>
            <Badge
              className="bg-primary/90 backdrop-blur-sm text-primary-foreground text-xs"
              data-testid={`badge-category-${category.toLowerCase()}`}
            >
              {category}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}

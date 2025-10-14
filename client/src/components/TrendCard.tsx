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
import { Eye, Users, MessageCircle, MoreVertical, Share2, Bookmark, Bell, BellOff, BellRing, Trash2, Flame } from "lucide-react";
import { formatDistanceToNow, differenceInDays } from "date-fns";
import { useLocation } from "wouter";
import FollowButton from "./FollowButton";

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
  endDate?: Date;
  description?: string;
  isTrending?: boolean;
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
  endDate,
  description,
  isTrending = false,
  isHost = false,
  onClick,
  onDelete,
}: TrendCardProps) {
  const [notificationStatus, setNotificationStatus] = useState<NotificationStatus>("all");
  const [, setLocation] = useLocation();

  const getTrendStatus = () => {
    if (!endDate) return null;
    const now = new Date();
    const daysUntilEnd = differenceInDays(endDate, now);
    
    if (endDate < now) return "ended";
    if (daysUntilEnd <= 3) return "ending-soon";
    return "active";
  };

  const status = getTrendStatus();

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
      className="overflow-hidden rounded-2xl shadow-lg transition-all duration-200 hover-elevate hover:shadow-xl cursor-pointer"
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
        
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80" />

        {/* Top Section */}
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar 
              className="w-12 h-12 border-2 border-white/30 cursor-pointer hover-elevate" 
              data-testid="avatar-user"
              onClick={(e) => {
                e.stopPropagation();
                setLocation(`/profile/${username}`);
              }}
            >
              <AvatarImage src={userAvatar} alt={username} />
              <AvatarFallback className="bg-[#00C8FF] text-white">
                {username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span 
                className="text-sm font-medium text-white drop-shadow-md cursor-pointer hover:underline" 
                data-testid="text-username"
                onClick={(e) => {
                  e.stopPropagation();
                  setLocation(`/profile/${username}`);
                }}
              >
                {username}
              </span>
              <span className="text-xs text-white/90 drop-shadow" data-testid="text-time">
                {formatDistanceToNow(createdAt, { addSuffix: true })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <FollowButton 
              username={username} 
              size="sm" 
              variant="outline"
              className="h-8 px-3 text-white border-white/40 hover:bg-white/20 hover:border-white/60 bg-black/20"
            />
            {isTrending && (
              <Badge className="bg-yellow-500 text-yellow-950 px-2.5 py-1 gap-1 items-center border-0 rounded-full" data-testid="badge-trending">
                <Flame className="w-3.5 h-3.5" />
                Trending
              </Badge>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-white hover:bg-white/20"
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
        </div>

        {/* Middle Section */}
        <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 flex flex-col items-center text-center gap-3">
          <Badge 
            className="bg-black/60 text-white backdrop-blur-sm px-3 py-1 rounded-full border-0"
            data-testid={`badge-category-${category.toLowerCase()}`}
          >
            {category}
          </Badge>
          <h3 className="text-2xl font-bold text-white drop-shadow-lg line-clamp-2" data-testid="text-trend-name">
            {trendName}
          </h3>
          {description && (
            <p className="text-base text-white/90 drop-shadow-md line-clamp-2 max-w-lg px-4" data-testid="text-description">
              {description}
            </p>
          )}
        </div>

        {/* Bottom Section */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <div className="flex items-center gap-4 text-white text-sm drop-shadow">
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

          <div className="flex items-center gap-2">
            {status === "ending-soon" && (
              <Badge 
                className="bg-yellow-500 text-yellow-950 px-2.5 py-1 rounded-full border-0"
                data-testid="badge-ending-soon"
              >
                Ending Soon
              </Badge>
            )}
            {status === "ended" && (
              <Badge 
                className="bg-red-500 text-white px-2.5 py-1 rounded-full border-0"
                data-testid="badge-ended"
              >
                Ended
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

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
import { Eye, Users, MessageCircle, MoreVertical, Share2, Bookmark, Bell, BellOff, BellRing, Trash2, Heart, Star, Flame } from "lucide-react";
import { formatDistanceToNow, differenceInDays } from "date-fns";
import { useLocation } from "wouter";
import FollowButton from "./FollowButton";

interface TrendCardProps {
  id: string;
  coverImage?: string;
  trendName: string;
  instructions?: string;
  username: string;
  userAvatar?: string;
  category: string;
  views: number;
  participants: number;
  chatCount: number;
  createdAt: Date;
  endDate?: Date;
  isHost?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
}

type NotificationStatus = "all" | "posts" | "muted";

export default function TrendCard({
  coverImage,
  trendName,
  instructions,
  username,
  userAvatar,
  category,
  views,
  participants,
  chatCount,
  createdAt,
  endDate,
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
        
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80" />

        {/* Top section - Category and Trending badge with menu */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
          {/* Category badge */}
          <Badge
            className="bg-transparent border border-white/40 text-white text-xs backdrop-blur-sm"
            data-testid={`badge-category-${category.toLowerCase()}`}
          >
            {category}
          </Badge>

          {/* Trending badge and menu */}
          <div className="flex items-center gap-2">
            <Badge
              className="bg-yellow-500 text-yellow-950 text-xs font-semibold flex items-center gap-1"
              data-testid="badge-trending"
            >
              <Flame className="w-3 h-3" />
              Trending
            </Badge>
            
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
        </div>

        {/* Middle section - Title and creator */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-4 text-white">
          <h3 className="text-2xl font-bold line-clamp-2 mb-2 drop-shadow-lg" data-testid="text-trend-name">
            {trendName}
          </h3>
          
          <div className="flex items-center gap-1.5 mb-3">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span 
              className="text-sm font-medium cursor-pointer hover:underline" 
              data-testid="text-username"
              onClick={(e) => {
                e.stopPropagation();
                setLocation(`/profile/${username}`);
              }}
            >
              {username}
            </span>
          </div>

          {instructions && (
            <p className="text-sm text-white/90 line-clamp-2 drop-shadow" data-testid="text-description">
              {instructions}
            </p>
          )}
        </div>

        {/* Bottom section - Stats */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5" data-testid="stat-likes">
              <Heart className="w-4 h-4" />
              <span>{participants.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5" data-testid="stat-chat">
              <MessageCircle className="w-4 h-4" />
              <span>{chatCount}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 text-sm" data-testid="stat-views">
            <Eye className="w-5 h-5 text-yellow-400" />
            <span className="font-semibold text-yellow-400">{views} playing</span>
          </div>
        </div>

        {/* Status badges (if applicable) */}
        {status === "ending-soon" && (
          <Badge 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-yellow-500/90 text-yellow-950 text-xs px-3 py-1"
            data-testid="badge-ending-soon"
          >
            Ending Soon
          </Badge>
        )}
        {status === "ended" && (
          <Badge 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500/90 text-white text-xs px-3 py-1"
            data-testid="badge-ended"
          >
            Ended
          </Badge>
        )}
      </div>
    </Card>
  );
}

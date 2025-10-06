import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, Users, MessageCircle, MoreVertical, Share2, Bookmark, Bell, BellOff } from "lucide-react";
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
  onClick?: () => void;
}

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
  onClick,
}: TrendCardProps) {
  return (
    <Card
      className="overflow-hidden transition-all duration-200 hover-elevate hover:shadow-md"
      data-testid="card-trend"
    >
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0" onClick={onClick} role="button">
            <Avatar className="w-10 h-10 flex-shrink-0" data-testid="avatar-user">
              <AvatarImage src={userAvatar} alt={username} />
              <AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-medium truncate" data-testid="text-username">
                {username}
              </span>
              <span className="text-xs text-muted-foreground" data-testid="text-time">
                {formatDistanceToNow(createdAt, { addSuffix: true })}
              </span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 flex-shrink-0"
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
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger data-testid="menu-item-notifications">
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem data-testid="menu-item-mute">
                    <BellOff className="w-4 h-4 mr-2" />
                    Mute
                  </DropdownMenuItem>
                  <DropdownMenuItem data-testid="menu-item-posts-only">
                    Posts only
                  </DropdownMenuItem>
                  <DropdownMenuItem data-testid="menu-item-posts-chat">
                    Posts and chat
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="relative aspect-video bg-muted overflow-hidden rounded-lg cursor-pointer" onClick={onClick}>
          {coverImage ? (
            <img
              src={coverImage}
              alt={trendName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-chart-2/20" />
          )}
          <Badge
            className="absolute top-3 right-3 bg-primary/90 backdrop-blur-sm text-primary-foreground text-xs"
            data-testid={`badge-category-${category.toLowerCase()}`}
          >
            {category}
          </Badge>
        </div>

        <div onClick={onClick} role="button">
          <h3 className="text-lg font-semibold line-clamp-2 mb-2" data-testid="text-trend-name">
            {trendName}
          </h3>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1" data-testid="stat-views">
              <Eye className="w-4 h-4" />
              <span>{views}</span>
            </div>
            <div className="flex items-center gap-1" data-testid="stat-participants">
              <Users className="w-4 h-4" />
              <span>{participants}</span>
            </div>
            <div className="flex items-center gap-1" data-testid="stat-chat">
              <MessageCircle className="w-4 h-4" />
              <span>{chatCount}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Eye, Users, MessageCircle } from "lucide-react";
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
      className="overflow-hidden cursor-pointer transition-all duration-200 hover-elevate hover:shadow-md"
      onClick={onClick}
      data-testid="card-trend"
    >
      <div className="relative aspect-video bg-muted overflow-hidden">
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

      <div className="p-4 space-y-3">
        <h3 className="text-lg font-semibold line-clamp-2" data-testid="text-trend-name">
          {trendName}
        </h3>

        <div className="flex items-center gap-2">
          <Avatar className="w-8 h-8" data-testid="avatar-user">
            <AvatarImage src={userAvatar} alt={username} />
            <AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium" data-testid="text-username">
              {username}
            </span>
            <span className="text-xs text-muted-foreground" data-testid="text-time">
              {formatDistanceToNow(createdAt, { addSuffix: true })}
            </span>
          </div>
        </div>

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
    </Card>
  );
}

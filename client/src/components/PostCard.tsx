import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThumbsUp, ThumbsDown, MessageCircle, MoreVertical, Share2, Bookmark, Trash2, AlertTriangle, Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import FollowButton from "./FollowButton";

interface PostCardProps {
  id: string;
  rank: number;
  imageUrl: string;
  caption?: string;
  username: string;
  userAvatar?: string;
  votes: number;
  createdAt: Date;
  userVoted?: boolean;
  commentsCount?: number;
  isCreator?: boolean;
  isTrendHost?: boolean;
  isUserTrendHost?: boolean;
  isDisqualified?: boolean;
  isTrendEnded?: boolean;
  onVoteUp?: () => void;
  onVoteDown?: () => void;
  onComment?: () => void;
  onDelete?: () => void;
  onDisqualify?: () => void;
}

const getRankBadge = (rank: number) => {
  const suffixes = ["st", "nd", "rd"];
  const suffix = rank <= 3 ? suffixes[rank - 1] : "th";
  return `${rank}${suffix}`;
};

export default function PostCard({
  rank,
  imageUrl,
  caption,
  username,
  userAvatar,
  votes,
  createdAt,
  userVoted,
  commentsCount = 0,
  isCreator = false,
  isTrendHost = false,
  isUserTrendHost = false,
  isDisqualified = false,
  isTrendEnded = false,
  onVoteUp,
  onVoteDown,
  onComment,
  onDelete,
  onDisqualify,
}: PostCardProps) {
  const [showFullCaption, setShowFullCaption] = useState(false);

  return (
    <Card className="overflow-hidden" data-testid="card-post">
      <div className="relative">
        <Badge
          className="absolute top-3 left-3 w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-primary to-chart-2 text-primary-foreground shadow-lg text-sm font-bold z-10"
          data-testid={`badge-rank-${rank}`}
        >
          {getRankBadge(rank)}
        </Badge>

        <div className="absolute top-3 right-3 left-16 flex items-start justify-between gap-2 z-10">
          <div className="flex items-center gap-2 flex-1 min-w-0 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5">
            <Avatar className="w-8 h-8 border-2 border-white/20" data-testid="avatar-user">
              <AvatarImage src={userAvatar} alt={username} />
              <AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="flex items-center gap-1 min-w-0">
                <span className="text-sm font-medium truncate text-white" data-testid="text-username">
                  {username}
                </span>
                {isTrendHost && (
                  <Star className="w-4 h-4 fill-yellow-500 text-yellow-500 flex-shrink-0" data-testid="icon-host-star" />
                )}
              </div>
              <FollowButton 
                username={username} 
                size="sm" 
                variant="ghost"
                className="h-6 px-2 text-xs text-white hover:bg-white/20 border-white/40 flex-shrink-0"
              />
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 bg-black/40 backdrop-blur-sm text-white hover:bg-white/20 flex-shrink-0"
                data-testid="button-post-menu"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" data-testid="menu-post-options">
              <DropdownMenuItem data-testid="menu-item-share">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem data-testid="menu-item-save">
                <Bookmark className="w-4 h-4 mr-2" />
                Save
              </DropdownMenuItem>
              {(isCreator || isUserTrendHost) && <DropdownMenuSeparator />}
              {isCreator && (
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                  data-testid="menu-item-delete"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
              {isUserTrendHost && !isCreator && (
                <DropdownMenuItem
                  onClick={onDisqualify}
                  className="text-destructive focus:text-destructive"
                  data-testid="menu-item-disqualify"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  {isDisqualified ? "Requalify" : "Disqualify"}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isDisqualified && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <Badge variant="destructive" className="text-lg px-4 py-2" data-testid="badge-disqualified">
              Disqualified
            </Badge>
          </div>
        )}

        <div className={`relative aspect-square overflow-hidden bg-muted ${isDisqualified ? 'blur-sm' : ''}`}>
          <img
            src={imageUrl}
            alt="Post"
            className="w-full h-full object-cover"
            data-testid="img-post"
          />
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center gap-1">
            <Button
              size="icon"
              variant={userVoted ? "default" : "outline"}
              onClick={onVoteUp}
              disabled={isDisqualified || isTrendEnded}
              data-testid="button-vote-up"
            >
              <ThumbsUp className="w-5 h-5" />
            </Button>
            <span className="text-sm font-bold" data-testid="text-votes">
              {votes}
            </span>
          </div>

          <Button
            variant="ghost"
            className="gap-2 text-muted-foreground"
            onClick={onComment}
            data-testid="button-comments"
          >
            <MessageCircle className="w-5 h-5" />
            <span>{commentsCount}</span>
          </Button>
        </div>

        {caption && (
          <div className="space-y-1">
            <p
              className={`text-sm ${!showFullCaption ? "line-clamp-3" : ""}`}
              data-testid="text-caption"
            >
              <span className="font-medium">{username}</span> {caption}
            </p>
            {caption.length > 150 && (
              <button
                onClick={() => setShowFullCaption(!showFullCaption)}
                className="text-sm text-muted-foreground hover:text-foreground"
                data-testid="button-read-more"
              >
                {showFullCaption ? "Show less" : "more"}
              </button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

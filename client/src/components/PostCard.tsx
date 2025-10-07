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
  onVoteUp,
  onVoteDown,
  onComment,
  onDelete,
  onDisqualify,
}: PostCardProps) {
  const [showFullCaption, setShowFullCaption] = useState(false);

  return (
    <Card className="overflow-hidden" data-testid="card-post">
      <div className="p-4 pb-0">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Avatar className="w-10 h-10" data-testid="avatar-user">
              <AvatarImage src={userAvatar} alt={username} />
              <AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium truncate" data-testid="text-username">
                  {username}
                </span>
                {isTrendHost && (
                  <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" data-testid="icon-host-star" />
                )}
              </div>
              <span className="text-xs text-muted-foreground" data-testid="text-time">
                {formatDistanceToNow(createdAt, { addSuffix: true })}
              </span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
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
      </div>

      <div className="relative">
        <Badge
          className="absolute top-3 left-3 w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-primary to-chart-2 text-primary-foreground shadow-lg text-sm font-bold z-10"
          data-testid={`badge-rank-${rank}`}
        >
          {getRankBadge(rank)}
        </Badge>

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
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant={userVoted ? "default" : "outline"}
              onClick={onVoteUp}
              disabled={isDisqualified}
              data-testid="button-vote-up"
            >
              <ThumbsUp className="w-5 h-5" />
            </Button>
            <span className="text-lg font-bold min-w-[3ch] text-center" data-testid="text-votes">
              {votes}
            </span>
            <Button
              size="icon"
              variant="outline"
              onClick={onVoteDown}
              disabled={isDisqualified}
              data-testid="button-vote-down"
            >
              <ThumbsDown className="w-5 h-5" />
            </Button>
          </div>

          <Button
            variant="ghost"
            className="gap-2 text-muted-foreground"
            onClick={onComment}
            data-testid="button-comments"
          >
            <MessageCircle className="w-4 h-4" />
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

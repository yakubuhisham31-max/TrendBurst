import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, ThumbsDown, MessageCircle } from "lucide-react";
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
  onVoteUp?: () => void;
  onVoteDown?: () => void;
  onComment?: () => void;
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
  onVoteUp,
  onVoteDown,
  onComment,
}: PostCardProps) {
  const [showFullCaption, setShowFullCaption] = useState(false);

  return (
    <Card className="overflow-hidden" data-testid="card-post">
      <div className="relative">
        <Badge
          className="absolute top-3 right-3 w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-primary to-chart-2 text-primary-foreground shadow-lg text-sm font-bold z-10"
          data-testid={`badge-rank-${rank}`}
        >
          {getRankBadge(rank)}
        </Badge>

        <div className="relative max-h-[500px] overflow-hidden bg-muted">
          <img
            src={imageUrl}
            alt="Post"
            className="w-full h-full object-contain"
            data-testid="img-post"
          />
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-4">
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

          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant={userVoted ? "default" : "outline"}
              onClick={onVoteUp}
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
              data-testid="button-vote-down"
            >
              <ThumbsDown className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {caption && (
          <div className="space-y-1">
            <p
              className={`text-sm ${!showFullCaption ? "line-clamp-3" : ""}`}
              data-testid="text-caption"
            >
              {caption}
            </p>
            {caption.length > 150 && (
              <button
                onClick={() => setShowFullCaption(!showFullCaption)}
                className="text-sm text-primary hover:underline"
                data-testid="button-read-more"
              >
                {showFullCaption ? "Show less" : "Read more"}
              </button>
            )}
          </div>
        )}

        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-muted-foreground"
          onClick={onComment}
          data-testid="button-comments"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{commentsCount} comments</span>
        </Button>
      </div>
    </Card>
  );
}

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
import { ThumbsUp, ThumbsDown, MessageCircle, MoreVertical, Share2, Bookmark, Trash2, AlertTriangle, Star, Volume2, VolumeX } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import FollowButton from "./FollowButton";

interface PostCardProps {
  id: string;
  rank: number;
  mediaUrl: string;
  mediaType: 'image' | 'video';
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
  mediaUrl,
  mediaType,
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
  const [isMuted, setIsMuted] = useState(true);
  const [, setLocation] = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Sync muted state with video element
  useEffect(() => {
    if (mediaType !== 'video' || !videoRef.current) return;
    videoRef.current.muted = isMuted;
  }, [isMuted, mediaType]);

  // Auto-play video when in view (Instagram style)
  useEffect(() => {
    if (mediaType !== 'video' || !videoRef.current) return;

    const video = videoRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch(() => {
              // Video play failed (e.g., user interaction required)
            });
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.5 } // Play when 50% visible
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
    };
  }, [mediaType]);

  return (
    <Card className="overflow-hidden" data-testid="card-post">
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar 
              className="w-10 h-10 flex-shrink-0 cursor-pointer hover-elevate" 
              data-testid="avatar-user"
              onClick={() => setLocation(`/profile/${username}`)}
            >
              <AvatarImage src={userAvatar} alt={username} />
              <AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span 
                  className="font-semibold truncate cursor-pointer hover:underline" 
                  data-testid="text-username"
                  onClick={() => setLocation(`/profile/${username}`)}
                >
                  {username}
                </span>
                {isTrendHost && (
                  <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" data-testid="icon-host" />
                )}
              </div>
              <span className="text-sm text-muted-foreground" data-testid="text-time">
                {formatDistanceToNow(createdAt, { addSuffix: true })}
              </span>
            </div>
            {!isCreator && <FollowButton username={username} size="sm" />}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 flex-shrink-0"
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
                  {isDisqualified ? "Undo Disqualify" : "Disqualify"}
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
          {mediaType === 'video' ? (
            <>
              <video
                ref={videoRef}
                src={mediaUrl}
                className="w-full h-full object-cover"
                loop
                muted={isMuted}
                playsInline
                data-testid="video-post"
              />
              {/* Mute/Unmute button */}
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-3 right-3 w-10 h-10 rounded-full shadow-lg hover-elevate"
                onClick={() => setIsMuted(!isMuted)}
                data-testid="button-toggle-mute"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </Button>
            </>
          ) : (
            <img
              src={mediaUrl}
              alt="Post"
              className="w-full h-full object-cover"
              data-testid="img-post"
            />
          )}
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
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
            <Button
              size="icon"
              variant="outline"
              onClick={onVoteDown}
              disabled={isDisqualified || isTrendEnded}
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

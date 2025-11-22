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
import { ThumbsUp, ThumbsDown, MessageCircle, MoreVertical, Share2, Bookmark, Trash2, AlertTriangle, Star, Volume2, VolumeX, Play, Expand, Trophy, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import FollowButton from "./FollowButton";
import ShareDialog from "./ShareDialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

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
  isBlurred?: boolean;
  isTrendEnded?: boolean;
  onVoteUp?: () => void;
  onVoteDown?: () => void;
  onComment?: () => void;
  onDelete?: () => void;
  onDisqualify?: () => void;
  onFullscreen?: () => void;
  onAuthModalOpen?: () => void;
}

const getRankBadge = (rank: number) => {
  const suffixes = ["st", "nd", "rd"];
  const suffix = rank <= 3 ? suffixes[rank - 1] : "th";
  return `${rank}${suffix}`;
};

const getRankStyle = (rank: number) => {
  if (rank === 1) {
    return {
      bgGradient: "bg-gradient-to-br from-yellow-400 via-yellow-300 to-orange-400",
      borderColor: "border-2 border-yellow-500/50",
      glowClass: "shadow-[0_0_20px_rgba(250,204,21,0.6)]",
      textColor: "text-yellow-950",
      icon: Trophy,
      iconColor: "text-yellow-950",
    };
  } else if (rank === 2) {
    return {
      bgGradient: "bg-gradient-to-br from-slate-300 via-slate-200 to-slate-400",
      borderColor: "border-2 border-slate-400/50",
      glowClass: "shadow-[0_0_15px_rgba(148,163,184,0.5)]",
      textColor: "text-slate-800",
      icon: Trophy,
      iconColor: "text-slate-800",
    };
  } else if (rank === 3) {
    return {
      bgGradient: "bg-gradient-to-br from-orange-300 via-orange-200 to-rose-400",
      borderColor: "border-2 border-orange-500/50",
      glowClass: "shadow-[0_0_15px_rgba(251,146,60,0.5)]",
      textColor: "text-orange-950",
      icon: Trophy,
      iconColor: "text-orange-950",
    };
  } else {
    return {
      bgGradient: "bg-gradient-to-br from-primary to-chart-2",
      borderColor: "border-2 border-primary/30",
      glowClass: "shadow-lg",
      textColor: "text-primary-foreground",
      icon: Zap,
      iconColor: "text-primary-foreground",
    };
  }
};

export default function PostCard({
  id,
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
  isBlurred = false,
  isTrendEnded = false,
  onVoteUp,
  onVoteDown,
  onComment,
  onDelete,
  onDisqualify,
  onFullscreen,
  onAuthModalOpen,
}: PostCardProps) {
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [, setLocation] = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<number>(0);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Check if post is saved
  const { data: savedStatus } = useQuery<{ isSaved: boolean }>({
    queryKey: ["/api/saved/posts", id, "status"],
    enabled: !!user,
  });

  const isSaved = savedStatus?.isSaved || false;

  // Save post mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isSaved) {
        await apiRequest("DELETE", `/api/saved/posts/${id}`);
      } else {
        await apiRequest("POST", `/api/saved/posts/${id}`, {});
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved/posts", id, "status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/saved/posts"] });
      toast({
        title: isSaved ? "Post unsaved" : "Post saved",
        description: isSaved ? "Post removed from your saved collection" : "Post added to your saved collection",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    saveMutation.mutate();
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShareDialogOpen(true);
  };

  // Handle video tap: single tap to mute/unmute, double tap to like
  const handleVideoTap = () => {
    if (mediaType !== 'video') return;

    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    if (timeSinceLastTap < 300) {
      // Double tap detected - clear pending single tap action and execute like/unlike
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
        tapTimeoutRef.current = null;
      }
      
      // Execute like/unlike
      if (onVoteUp && !isDisqualified && !isTrendEnded) {
        if (userVoted && onVoteDown) {
          onVoteDown();
        } else {
          onVoteUp();
        }
      }
      lastTapRef.current = 0;
    } else {
      // Potential single tap - defer mute toggle to check for double tap
      lastTapRef.current = now;
      
      // Clear any existing timeout
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
      
      // Set timeout to toggle mute after double-tap window
      tapTimeoutRef.current = setTimeout(() => {
        // Only toggle mute if still a video and not disqualified
        if (mediaType === 'video' && !isDisqualified) {
          setIsMuted((prev) => !prev);
        }
        tapTimeoutRef.current = null;
      }, 300);
    }
  };

  // Clean up tap timeout when mediaType or isDisqualified changes
  useEffect(() => {
    // Clear timeout immediately when dependencies change
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
      tapTimeoutRef.current = null;
    }
    
    // Pause video if disqualified
    if (isDisqualified && mediaType === 'video' && videoRef.current) {
      videoRef.current.pause();
    }
    
    // Also clear on unmount
    return () => {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
        tapTimeoutRef.current = null;
      }
    };
  }, [mediaType, isDisqualified]);

  // Sync muted state with video element
  useEffect(() => {
    if (mediaType !== 'video' || !videoRef.current) return;
    videoRef.current.muted = isMuted;
  }, [isMuted, mediaType]);

  // Track video play/pause state and progress
  useEffect(() => {
    if (mediaType !== 'video' || !videoRef.current) return;
    const video = videoRef.current;

    const updatePlayState = () => setIsPlaying(!video.paused);
    const updateProgress = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    video.addEventListener('play', updatePlayState);
    video.addEventListener('pause', updatePlayState);
    video.addEventListener('timeupdate', updateProgress);

    return () => {
      video.removeEventListener('play', updatePlayState);
      video.removeEventListener('pause', updatePlayState);
      video.removeEventListener('timeupdate', updateProgress);
    };
  }, [mediaType]);

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  };

  // Auto-play video when in view (Instagram style), but NOT for disqualified or blurred posts
  useEffect(() => {
    if (mediaType !== 'video' || !videoRef.current || isDisqualified || isBlurred) return;

    const video = videoRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Pause all other videos in the DOM to prevent multiple playback
            const allVideos = document.querySelectorAll('video');
            allVideos.forEach((v: any) => {
              if (v !== video) {
                v.pause();
              }
            });
            video.play().catch(() => {
              // Video play failed (e.g., user interaction required)
            });
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.8 } // Play only when 80% visible
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
      // Clean up any pending tap timeout
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
    };
  }, [mediaType, isDisqualified, isBlurred]);

  return (
    <Card id={`post-${id}`} className="overflow-hidden transition-all" data-testid="card-post">
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar 
              className="w-10 h-10 flex-shrink-0 cursor-pointer hover-elevate" 
              data-testid="avatar-user"
              onClick={() => {
                if (!user) {
                  onAuthModalOpen?.();
                  return;
                }
                setLocation(`/profile/${username}`);
              }}
            >
              <AvatarImage src={userAvatar} alt={username} />
              <AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span 
                  className="font-semibold truncate cursor-pointer hover:underline" 
                  data-testid="text-username"
                  onClick={() => {
                    if (!user) {
                      onAuthModalOpen?.();
                      return;
                    }
                    setLocation(`/profile/${username}`);
                  }}
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
              <DropdownMenuItem onClick={handleShare} data-testid="menu-item-share">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSave} data-testid="menu-item-save">
                <Bookmark className={`w-4 h-4 mr-2 ${isSaved ? 'fill-current' : ''}`} />
                {isSaved ? 'Unsave' : 'Save'}
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
        {(() => {
          const IconComponent = rank === 1 ? Trophy : rank === 2 ? Trophy : rank === 3 ? Trophy : Zap;
          let badgeClass = "";
          
          if (rank === 1) {
            badgeClass = "rank-badge-gold rank-badge-pulse";
          } else if (rank === 2) {
            badgeClass = "rank-badge-silver";
          } else if (rank === 3) {
            badgeClass = "rank-badge-bronze";
          } else {
            badgeClass = "rank-badge-other";
          }
          
          return (
            <div
              className={`absolute top-4 left-4 w-16 h-16 rounded-full flex flex-col items-center justify-center z-10 rank-badge-enter ${badgeClass} transition-transform hover:scale-125`}
              data-testid={`badge-rank-${rank}`}
            >
              <IconComponent className="w-6 h-6 flex-shrink-0 drop-shadow-lg" />
              <span className="text-xs font-black leading-none mt-1 drop-shadow-lg">
                {rank}
              </span>
            </div>
          );
        })()}

        {isDisqualified && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <Badge variant="destructive" className="text-lg px-4 py-2" data-testid="badge-disqualified">
              Disqualified
            </Badge>
          </div>
        )}

        <div className={`relative aspect-[4/5] overflow-hidden bg-muted ${isDisqualified ? 'blur-sm' : ''}`}>
          {mediaType === 'video' ? (
            <>
              <video
                ref={videoRef}
                src={mediaUrl}
                className="w-full h-full object-cover"
                loop
                muted={isMuted}
                playsInline
                preload="auto"
                crossOrigin="anonymous"
                data-testid="video-post"
              />
              
              {/* Play/Pause overlay - centered */}
              {!isPlaying && !isDisqualified && (
                <button
                  onClick={handlePlayPause}
                  className="absolute inset-0 flex items-center justify-center hover-elevate"
                  data-testid="button-video-play"
                  aria-label="Play video"
                >
                  <div className="w-16 h-16 rounded-full bg-primary/80 backdrop-blur-sm flex items-center justify-center shadow-lg">
                    <Play className="w-8 h-8 text-primary-foreground fill-primary-foreground" />
                  </div>
                </button>
              )}

              {/* Playing indicator - centered top */}
              {isPlaying && !isDisqualified && (
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
                  <div className="flex gap-0.5">
                    <div className="w-0.5 h-2 bg-primary rounded-full animate-pulse" style={{animationDelay: '0ms'}}></div>
                    <div className="w-0.5 h-2 bg-primary rounded-full animate-pulse" style={{animationDelay: '150ms'}}></div>
                    <div className="w-0.5 h-2 bg-primary rounded-full animate-pulse" style={{animationDelay: '300ms'}}></div>
                  </div>
                  <span className="text-xs text-white font-medium">Playing</span>
                </div>
              )}

              {/* Controls bar - bottom */}
              <div className="absolute bottom-0 left-0 right-0 flex items-center gap-1.5 bg-black/20 px-1.5 py-1">
                {/* Play/Pause button */}
                <button
                  onClick={handlePlayPause}
                  className="flex-shrink-0 w-6 h-6 rounded bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
                  data-testid="button-video-play-pause"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <div className="w-1 h-2 bg-white mx-0.5" />
                  ) : (
                    <Play className="w-3 h-3 text-white fill-white" />
                  )}
                </button>

                {/* Progress bar */}
                <div 
                  ref={progressBarRef}
                  className="flex-1 h-1 bg-black/40 rounded-full cursor-pointer hover:h-1.5 transition-all"
                  onClick={(e) => {
                    if (!videoRef.current || !progressBarRef.current) return;
                    const rect = progressBarRef.current.getBoundingClientRect();
                    const percent = (e.clientX - rect.left) / rect.width;
                    const newTime = percent * videoRef.current.duration;
                    videoRef.current.currentTime = newTime;
                  }}
                  onMouseDown={(e) => {
                    if (!videoRef.current || !progressBarRef.current) return;
                    
                    const handleMouseMove = (moveEvent: MouseEvent) => {
                      const rect = progressBarRef.current!.getBoundingClientRect();
                      const percent = Math.max(0, Math.min(1, (moveEvent.clientX - rect.left) / rect.width));
                      videoRef.current!.currentTime = percent * videoRef.current!.duration;
                    };

                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };

                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                  data-testid="video-progress-bar"
                >
                  <div 
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Mute/Unmute button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted(!isMuted);
                  }}
                  className="flex-shrink-0 w-6 h-6 rounded bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
                  data-testid="button-video-mute"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? (
                    <VolumeX className="w-3 h-3 text-white" />
                  ) : (
                    <Volume2 className="w-3 h-3 text-white" />
                  )}
                </button>

                {/* Expand button */}
                {!isDisqualified && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!user) {
                        onAuthModalOpen?.();
                        return;
                      }
                      onFullscreen?.();
                    }}
                    className="flex-shrink-0 w-6 h-6 rounded bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
                    data-testid="button-video-expand"
                    aria-label="Expand video"
                  >
                    <Expand className="w-3 h-3 text-white" />
                  </button>
                )}
              </div>
            </>
          ) : (
            <img
              src={mediaUrl}
              alt="Post"
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => {
                if (!user) {
                  onAuthModalOpen?.();
                  return;
                }
                onFullscreen?.();
              }}
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

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        url={`/post/${id}`}
        title={`Check out this post by ${username}`}
        description={caption}
      />
    </Card>
  );
}

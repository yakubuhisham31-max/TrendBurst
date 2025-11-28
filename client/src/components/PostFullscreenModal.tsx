import { ArrowLeft, ThumbsUp, ThumbsDown, MessageCircle, Share2, Bookmark, X, MessageSquare, Trash2, MoreVertical, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import ShareDialog from "./ShareDialog";
import PostCommentsDialog from "./PostCommentsDialog";
import VerificationBadge from "./VerificationBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import type { Post, User } from "@shared/schema";

interface PostFullscreenModalProps {
  post: Post & { user?: User };
  isOpen: boolean;
  onClose: () => void;
  onComment?: (postId: string) => void;
  onVoteUp?: (postId: string) => void;
  onVoteDown?: (postId: string) => void;
  userVoted?: boolean;
  rank?: number;
  allPosts?: (Post & { user?: User })[];
  onNextPost?: () => void;
  onPreviousPost?: () => void;
  onTrendChat?: (trendId: string) => void;
  isTrendCreator?: boolean;
  onDisqualify?: (postId: string) => void;
  onDisqualifyAndDelete?: (postId: string) => void;
  isDisqualifyPending?: boolean;
}

export default function PostFullscreenModal({
  post,
  isOpen,
  onClose,
  onComment,
  onVoteUp,
  onVoteDown,
  userVoted = false,
  rank,
  allPosts,
  onNextPost,
  onPreviousPost,
  onTrendChat,
  isTrendCreator = false,
  onDisqualify,
  onDisqualifyAndDelete,
  isDisqualifyPending = false,
}: PostFullscreenModalProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const touchStartY = useRef(0);
  const pointerStartY = useRef(0);
  const { user } = useAuth();
  const { toast } = useToast();

  const getRankOrdinal = (num: number) => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return `${num}st`;
    if (j === 2 && k !== 12) return `${num}nd`;
    if (j === 3 && k !== 13) return `${num}rd`;
    return `${num}th`;
  };

  // Calculate rank from allPosts if not provided
  const calculatedRank = rank || (allPosts ? (() => {
    const sorted = [...allPosts].sort((a, b) => (b.votes || 0) - (a.votes || 0));
    return sorted.findIndex(p => p.id === post.id) + 1;
  })() : undefined);

  // Check if post is saved
  const { data: savedStatus } = useQuery<{ isSaved: boolean }>({
    queryKey: ["/api/saved/posts", post.id, "status"],
    enabled: !!user && isOpen,
  });

  const isSaved = savedStatus?.isSaved || false;

  // Get user's remaining votes for this trend
  const { data: voteCountData } = useQuery<{ count: number }>({
    queryKey: ["/api/votes/trend", post.trendId, "count"],
    enabled: !!user && isOpen && !!post.trendId,
  });

  const remainingVotes = voteCountData ? 10 - voteCountData.count : null;

  // Save post mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isSaved) {
        await apiRequest("DELETE", `/api/saved/posts/${post.id}`);
      } else {
        await apiRequest("POST", `/api/saved/posts/${post.id}`, {});
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved/posts", post.id, "status"] });
      toast({
        title: isSaved ? "Post unsaved" : "Post saved",
        description: isSaved ? "Post removed from your saved collection" : "Post added to your saved collection",
      });
    },
  });

  if (!isOpen) return null;

  // Prevent background scrolling when fullscreen is open and hide scrollbars
  useEffect(() => {
    const htmlStyle = document.documentElement.style as any;
    const bodyStyle = document.body.style as any;
    
    htmlStyle.overflow = "hidden";
    htmlStyle.scrollbarWidth = "none";
    htmlStyle.msOverflowStyle = "none";
    bodyStyle.overflow = "hidden";
    bodyStyle.scrollbarWidth = "none";
    bodyStyle.msOverflowStyle = "none";

    return () => {
      htmlStyle.overflow = "";
      htmlStyle.scrollbarWidth = "";
      htmlStyle.msOverflowStyle = "";
      bodyStyle.overflow = "";
      bodyStyle.scrollbarWidth = "";
      bodyStyle.msOverflowStyle = "";
    };
  }, []);

  // Track video progress and play state
  useEffect(() => {
    if (mediaType !== "video" || !videoRef.current) return;
    const video = videoRef.current;

    const updateProgress = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    const updatePlayState = () => setIsPlaying(!video.paused);

    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('play', updatePlayState);
    video.addEventListener('pause', updatePlayState);

    return () => {
      video.removeEventListener('timeupdate', updateProgress);
      video.removeEventListener('play', updatePlayState);
      video.removeEventListener('pause', updatePlayState);
    };
  }, []);

  // Prevent video playback when disqualified
  useEffect(() => {
    if (mediaType !== "video" || !videoRef.current) return;
    if (post.isDisqualified) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [post.isDisqualified]);

  // Autoplay video when post changes (swiping to new post)
  useEffect(() => {
    if (!videoRef.current || post.isDisqualified) return;
    const type = post.mediaType || "image";
    if (type === "video") {
      videoRef.current.play().catch(() => {
        // Video play failed (e.g., user interaction required)
      });
    }
  }, [post.id, post.isDisqualified]);

  // Handle swipe gestures for post navigation (touch)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const swipeDistance = touchStartY.current - touchEndY;
    const minSwipeDistance = 50;

    // Swipe up (positive distance) - next post
    if (swipeDistance > minSwipeDistance && onNextPost) {
      setIsTransitioning(true);
      setTimeout(() => {
        onNextPost();
        setIsTransitioning(false);
      }, 300);
    }
    // Swipe down (negative distance) - previous post
    else if (swipeDistance < -minSwipeDistance && onPreviousPost) {
      setIsTransitioning(true);
      setTimeout(() => {
        onPreviousPost();
        setIsTransitioning(false);
      }, 300);
    }
  };

  // Handle swipe gestures for post navigation (desktop/mouse)
  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStartY.current = e.clientY;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const pointerEndY = e.clientY;
    const swipeDistance = pointerStartY.current - pointerEndY;
    const minSwipeDistance = 50;

    // Swipe up (positive distance) - next post
    if (swipeDistance > minSwipeDistance && onNextPost) {
      setIsTransitioning(true);
      setTimeout(() => {
        onNextPost();
        setIsTransitioning(false);
      }, 300);
    }
    // Swipe down (negative distance) - previous post
    else if (swipeDistance < -minSwipeDistance && onPreviousPost) {
      setIsTransitioning(true);
      setTimeout(() => {
        onPreviousPost();
        setIsTransitioning(false);
      }, 300);
    }
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    saveMutation.mutate();
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShareOpen(true);
  };

  const mediaUrl = post.mediaUrl || post.imageUrl || "";
  const mediaType = post.mediaType || "image";

  return (
    <>
      <div
        className="fixed inset-0 bg-black z-50 w-screen h-screen overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        data-testid="modal-fullscreen-post-backdrop"
        style={{ touchAction: "none" }}
      >
        <div
          className={`relative w-screen h-screen bg-black overflow-hidden flex flex-col transition-opacity duration-300 ${
            isTransitioning ? "opacity-50" : "opacity-100"
          }`}
          data-testid="modal-fullscreen-post"
        >
          {/* Back Button */}
          <button
            onClick={onClose}
            className="absolute top-6 left-6 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-white text-black hover:bg-gray-200 transition-colors shadow-lg"
            data-testid="button-close-fullscreen"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Disqualified Badge - Centered */}
          {post.isDisqualified && (
            <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none" data-testid="badge-disqualified-fullscreen">
              <Badge variant="destructive" className="gap-1.5 px-4 py-2 text-lg font-semibold">
                <AlertCircle className="w-5 h-5" />
                <span>Disqualified</span>
              </Badge>
            </div>
          )}

          {/* Media */}
          <div className="absolute inset-0 flex items-center justify-center bg-black overflow-hidden">
            {mediaType === "video" ? (
              <>
                <video
                  ref={videoRef}
                  src={mediaUrl}
                  className={`w-full h-full object-contain ${post.isDisqualified ? 'blur-sm pointer-events-none' : ''}`}
                  controls={!post.isDisqualified}
                  autoPlay={!post.isDisqualified}
                  preload="metadata"
                  crossOrigin="anonymous"
                  data-testid="video-fullscreen"
                  onPlay={(e) => post.isDisqualified && (e.currentTarget.pause())}
                  onPause={(e) => {
                    if (post.isDisqualified && !e.currentTarget.paused) {
                      e.currentTarget.pause();
                    }
                  }}
                />
                {/* Progress bar for fullscreen */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                  <div 
                    className="h-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                    data-testid="video-fullscreen-progress"
                  />
                </div>
                {/* Playing indicator */}
                {isPlaying && (
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
                    <div className="flex gap-0.5">
                      <div className="w-0.5 h-2 bg-primary rounded-full animate-pulse" style={{animationDelay: '0ms'}}></div>
                      <div className="w-0.5 h-2 bg-primary rounded-full animate-pulse" style={{animationDelay: '150ms'}}></div>
                      <div className="w-0.5 h-2 bg-primary rounded-full animate-pulse" style={{animationDelay: '300ms'}}></div>
                    </div>
                    <span className="text-xs text-white font-medium">Playing</span>
                  </div>
                )}

                {/* Remaining votes badge and chat button */}
                <div className="absolute top-4 right-4 flex items-center gap-3">
                  {remainingVotes !== null && (
                    <div className="bg-gradient-to-r from-primary/80 to-primary/60 backdrop-blur-md px-3 py-2 rounded-full border border-primary/40 shadow-lg" data-testid="badge-remaining-votes">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">{remainingVotes}</span>
                        <span className="text-xs text-white/80">votes left</span>
                      </div>
                    </div>
                  )}
                  {post.trendId && (
                    <button
                      onClick={() => onTrendChat?.(post.trendId!)}
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-colors"
                      data-testid="button-trend-chat"
                      aria-label="Trend chat"
                    >
                      <MessageSquare className="w-5 h-5 text-white" />
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <img
                  src={mediaUrl}
                  alt="Post"
                  className={`w-full h-full object-contain ${post.isDisqualified ? 'blur-sm' : ''}`}
                  data-testid="img-fullscreen"
                />
                {/* Remaining votes badge and chat button for images */}
                <div className="absolute top-4 right-4 flex items-center gap-3">
                  {remainingVotes !== null && (
                    <div className="bg-gradient-to-r from-primary/80 to-primary/60 backdrop-blur-md px-3 py-2 rounded-full border border-primary/40 shadow-lg" data-testid="badge-remaining-votes">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">{remainingVotes}</span>
                        <span className="text-xs text-white/80">votes left</span>
                      </div>
                    </div>
                  )}
                  {post.trendId && (
                    <button
                      onClick={() => onTrendChat?.(post.trendId!)}
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-colors"
                      data-testid="button-trend-chat"
                      aria-label="Trend chat"
                    >
                      <MessageSquare className="w-5 h-5 text-white" />
                    </button>
                  )}
                </div>
              </>
            
            )}
          </div>

          {/* Right Side Action Buttons - TikTok Style */}
          <div className="absolute right-3 bottom-32 md:bottom-24 z-40 flex flex-col items-center gap-4">
            {/* Vote Up */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => onVoteUp?.(post.id)}
                className={`w-11 h-11 flex items-center justify-center rounded-full backdrop-blur-sm transition-all ${
                  userVoted 
                    ? "bg-primary text-white shadow-lg shadow-primary/30" 
                    : "bg-white/10 hover:bg-white/20"
                }`}
                data-testid="button-vote-up-fullscreen"
              >
                <ThumbsUp className={`w-5 h-5 ${userVoted ? "fill-current" : "text-white"}`} />
              </button>
              <span className={`text-xs font-semibold mt-1 ${userVoted ? "text-primary" : "text-white"}`} data-testid="text-votes-fullscreen">
                {post.votes ?? 0}
              </span>
            </div>

            {/* Vote Down */}
            <button
              onClick={() => onVoteDown?.(post.id)}
              className={`w-11 h-11 flex items-center justify-center rounded-full backdrop-blur-sm transition-all ${
                userVoted === false && (post.votes ?? 0) < 0
                  ? "bg-destructive text-white shadow-lg shadow-destructive/30"
                  : "bg-white/10 hover:bg-white/20"
              }`}
              data-testid="button-vote-down-fullscreen"
            >
              <ThumbsDown className="w-5 h-5 text-white" />
            </button>

            {/* Comments */}
            <button
              onClick={() => setCommentsOpen(true)}
              className="w-11 h-11 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
              data-testid="button-comment-fullscreen"
            >
              <MessageCircle className="w-5 h-5 text-white" />
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="w-11 h-11 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
              data-testid="button-share-fullscreen"
            >
              <Share2 className="w-5 h-5 text-white" />
            </button>

            {/* Save */}
            <button
              onClick={handleSave}
              className="w-11 h-11 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
              data-testid="button-save-fullscreen"
            >
              <Bookmark className={`w-5 h-5 text-white ${isSaved ? "fill-current" : ""}`} />
            </button>

            {/* More Options (Disqualify) */}
            {isTrendCreator && post.userId !== user?.id && onDisqualify && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="w-11 h-11 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
                    disabled={isDisqualifyPending}
                    data-testid="button-disqualify-fullscreen"
                  >
                    <MoreVertical className="w-5 h-5 text-white" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem
                    onClick={() => onDisqualify(post.id)}
                    className="text-destructive cursor-pointer flex items-center"
                    data-testid="menu-disqualify"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    <span>{post.isDisqualified ? "Undo Disqualify" : "Disqualify User"}</span>
                  </DropdownMenuItem>
                  {!post.isDisqualified && (
                    <DropdownMenuItem
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-destructive cursor-pointer flex items-center"
                      data-testid="menu-disqualify-delete"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      <span>Disqualify & Delete Post</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Bottom Left - User Info & Caption */}
          <div className="absolute bottom-0 left-0 right-16 z-40 pb-6 md:pb-4">
            <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pt-16 pb-4">
              {/* User Info */}
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="w-10 h-10 border-2 border-white/30">
                  <AvatarImage src={post.user?.profilePicture || undefined} alt={post.user?.username} />
                  <AvatarFallback className="text-sm bg-primary/20 text-white">{post.user?.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-white">{post.user?.username}</span>
                    <VerificationBadge verified={post.user?.verified} size="sm" />
                    {typeof calculatedRank === 'number' && calculatedRank > 0 && !post.isDisqualified && (
                      <span className="text-xs font-bold px-2 py-0.5 bg-primary/30 text-primary rounded-full">
                        {getRankOrdinal(calculatedRank)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Caption */}
              {post.caption && (
                <p className="text-sm text-white/90 line-clamp-2 leading-relaxed">{post.caption}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <ShareDialog 
        open={shareOpen} 
        onOpenChange={setShareOpen} 
        url={`/feed/${post.trendId || ""}#post-${post.id}`}
        title={`Check out this post by ${post.user?.username}`}
        description={post.caption || undefined}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent data-testid="dialog-delete-confirm-fullscreen">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this post and disqualify the user?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDisqualifyAndDelete?.(post.id);
                setShowDeleteConfirm(false);
              }}
              data-testid="button-delete-confirm-fullscreen"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Comments Dialog - Stays in fullscreen mode */}
      {commentsOpen && post.trendId && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-background rounded-lg w-full h-full max-w-md shadow-lg flex flex-col relative">
            {/* Close Button */}
            <button
              onClick={() => setCommentsOpen(false)}
              className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 transition-colors"
              aria-label="Close comments"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Comments Header */}
            <div className="border-b border-border/20 px-4 py-3 flex-shrink-0">
              <h2 className="text-lg font-bold text-white">Comments</h2>
            </div>

            {/* Comments Content */}
            <div className="flex-1 overflow-y-auto">
              <PostCommentsDialog
                postId={post.id}
                trendId={post.trendId}
                open={commentsOpen}
                onOpenChange={setCommentsOpen}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

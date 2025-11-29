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
  userVoteCount?: number;
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
  userVoteCount = 0,
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
  const [chatViewed, setChatViewed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const touchStartY = useRef(0);
  const pointerStartY = useRef(0);
  const hasAutoplayedThisOpen = useRef(false);
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

  // Get unread chat message count
  const { data: unreadChatData } = useQuery<{ count: number }>({
    queryKey: ["/api/unread-chat-count", post.trendId],
    enabled: !!user && isOpen && !!post.trendId && !chatViewed,
    refetchInterval: 5000,
  });

  const unreadMessageCount = unreadChatData?.count || 0;

  // Update view tracking mutation for chat
  const updateViewMutation = useMutation({
    mutationFn: async ({ type, identifier }: { type: string; identifier: string }) => {
      const response = await apiRequest("POST", "/api/view-tracking", { type, identifier });
      return response.json();
    },
    onSuccess: () => {
      setChatViewed(true);
      queryClient.invalidateQueries({ queryKey: ["/api/unread-chat-count", post.trendId] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/counts"] });
    },
  });

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

  const mediaUrl = post.mediaUrl || post.imageUrl || "";
  const mediaType = post.mediaType || "image";

  // Prevent background scrolling when fullscreen is open and hide scrollbars
  useEffect(() => {
    const htmlStyle = document.documentElement.style as any;
    const bodyStyle = document.body.style as any;
    
    htmlStyle.overflow = "hidden";
    bodyStyle.overflow = "hidden";

    return () => {
      htmlStyle.overflow = "";
      bodyStyle.overflow = "";
    };
  }, [isOpen]);

  // Reset autoplay tracking when modal opens or post changes (on swipe)
  useEffect(() => {
    if (isOpen) {
      hasAutoplayedThisOpen.current = false;
    } else {
      // Pause video when modal closes
      if (videoRef.current) {
        videoRef.current.pause();
      }
    }
  }, [isOpen, post.id]);

  // Trigger autoplay when video metadata is loaded (only once per modal opening)
  const handleVideoLoadedMetadata = () => {
    if (videoRef.current && mediaType === "video" && !post.isDisqualified) {
      // Only autoplay once per modal opening
      if (!hasAutoplayedThisOpen.current) {
        hasAutoplayedThisOpen.current = true;
        videoRef.current.currentTime = 0;
        videoRef.current.muted = true;
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            videoRef.current!.muted = false;
          }).catch(() => {
            // Autoplay was prevented, user will need to click play
          });
        }
      }
    }
  };

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

  return (
    <>
      <div
        className="fixed inset-0 bg-black z-50 w-screen h-screen overflow-hidden flex flex-col"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        data-testid="modal-fullscreen-post-backdrop"
        style={{ touchAction: "none" }}
      >
        {/* Header - Back button, votes remaining, chat */}
        <div className="relative z-40 h-16 bg-black border-b border-white/10 flex items-center justify-between px-4">
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-black hover:bg-gray-200 transition-colors"
            data-testid="button-close-fullscreen"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            {remainingVotes !== null && remainingVotes >= 0 && (
              <div className="bg-cyan-500 text-black px-3 py-1.5 rounded-full text-sm font-semibold" data-testid="badge-remaining-votes">
                {remainingVotes} votes left
              </div>
            )}
            {post.trendId && (
              <div className="relative">
                <button
                  onClick={() => {
                    updateViewMutation.mutate({ type: "chat", identifier: post.trendId! });
                    onTrendChat?.(post.trendId!);
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                  data-testid="button-trend-chat"
                  aria-label="Trend chat"
                >
                  <MessageSquare className="w-5 h-5 text-white" />
                </button>
                {!chatViewed && unreadMessageCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{unreadMessageCount > 99 ? '99+' : unreadMessageCount}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area - Media + Disqualified Badge */}
        <div className={`relative flex-1 z-0 bg-black overflow-hidden transition-opacity duration-300 ${
          isTransitioning ? "opacity-50" : "opacity-100"
        }`} data-testid="modal-fullscreen-post">
          
          {/* Media Container */}
          <div className="absolute inset-0 flex items-center justify-center bg-black overflow-hidden">
            {mediaType === "video" ? (
              <video
                key={`video-${post.id}`}
                ref={videoRef}
                src={mediaUrl}
                className={`w-full h-full object-contain ${post.isDisqualified ? 'blur-sm pointer-events-none' : ''}`}
                controls={!post.isDisqualified}
                muted
                preload="metadata"
                crossOrigin="anonymous"
                onLoadedMetadata={handleVideoLoadedMetadata}
                data-testid="video-fullscreen"
              />
            ) : (
              <img
                src={mediaUrl}
                alt="Post"
                className={`w-full h-full object-contain ${post.isDisqualified ? 'blur-sm' : ''}`}
                data-testid="img-fullscreen"
              />
            )}
          </div>

          {/* Disqualified Badge - Centered */}
          {post.isDisqualified && (
            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none" data-testid="badge-disqualified-fullscreen">
              <Badge variant="destructive" className="gap-1.5 px-4 py-2 text-lg font-semibold">
                <AlertCircle className="w-5 h-5" />
                <span>Disqualified</span>
              </Badge>
            </div>
          )}
        </div>

        {/* Bottom Section - Caption, User Info, Action Buttons */}
        <div className="relative z-30 bg-black border-t border-white/10 px-4 py-4">
          {/* Caption */}
          {post.caption && (
            <p className="text-sm text-white/90 mb-3 line-clamp-2">{post.caption}</p>
          )}

          {/* User Info */}
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="w-10 h-10 border border-white/30 flex-shrink-0">
              <AvatarImage src={post.user?.profilePicture || undefined} alt={post.user?.username} />
              <AvatarFallback className="text-xs bg-primary/20 text-white">{post.user?.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-bold text-white truncate">{post.user?.username}</span>
                <VerificationBadge verified={post.user?.verified} size="sm" />
                {typeof calculatedRank === 'number' && calculatedRank > 0 && !post.isDisqualified && (
                  <span className="text-xs font-bold px-1.5 py-0.5 bg-primary/30 text-primary rounded-full flex-shrink-0">
                    {getRankOrdinal(calculatedRank)}
                  </span>
                )}
              </div>
              <span className="text-xs text-white/60">{formatDistanceToNow(new Date(post.createdAt || Date.now()), { addSuffix: true })}</span>
            </div>
          </div>

          {/* Action Buttons - Simple Horizontal Layout */}
          <div className="flex items-center gap-6">
            {/* Vote Up */}
            <button
              onClick={() => onVoteUp?.(post.id)}
              className="flex items-center hover:opacity-80 transition-opacity"
              data-testid="button-vote-up-fullscreen"
            >
              <ThumbsUp className={`w-5 h-5 ${userVoteCount > 0 ? "text-cyan-500 fill-current" : "text-white"}`} />
            </button>

            {/* Vote Count */}
            <span className="text-sm font-semibold text-white min-w-[2rem] text-center" data-testid="text-votes-fullscreen">
              {post.votes ?? 0}
            </span>

            {/* Vote Down */}
            <button
              onClick={() => onVoteDown?.(post.id)}
              className="flex items-center hover:opacity-80 transition-opacity"
              data-testid="button-vote-down-fullscreen"
            >
              <ThumbsDown className="w-5 h-5 text-white" />
            </button>

            {/* Comments */}
            <button
              onClick={() => setCommentsOpen(true)}
              className="flex items-center hover:opacity-80 transition-opacity"
              data-testid="button-comment-fullscreen"
            >
              <MessageCircle className="w-5 h-5 text-white" />
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="flex items-center hover:opacity-80 transition-opacity"
              data-testid="button-share-fullscreen"
            >
              <Share2 className="w-5 h-5 text-white" />
            </button>

            {/* Save */}
            <button
              onClick={handleSave}
              className="flex items-center hover:opacity-80 transition-opacity"
              data-testid="button-save-fullscreen"
            >
              <Bookmark className={`w-5 h-5 ${isSaved ? "text-cyan-500 fill-current" : "text-white"}`} />
            </button>

            {/* More Options (Disqualify) */}
            {isTrendCreator && post.userId !== user?.id && onDisqualify && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center hover:opacity-80 transition-opacity ml-auto"
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
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

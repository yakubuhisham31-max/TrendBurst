import { X, ThumbsUp, ThumbsDown, MessageCircle, Share2, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import ShareDialog from "./ShareDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
}

export default function PostFullscreenModal({
  post,
  isOpen,
  onClose,
  onComment,
  onVoteUp,
  onVoteDown,
  userVoted = false,
}: PostFullscreenModalProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Check if post is saved
  const { data: savedStatus } = useQuery<{ isSaved: boolean }>({
    queryKey: ["/api/saved/posts", post.id, "status"],
    enabled: !!user && isOpen,
  });

  const isSaved = savedStatus?.isSaved || false;

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
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
        onClick={onClose}
        data-testid="modal-fullscreen-post-backdrop"
      >
        <div
          className="relative w-full max-w-4xl bg-black rounded-lg overflow-hidden max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
          data-testid="modal-fullscreen-post"
        >
          {/* Close Button */}
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full"
            onClick={onClose}
            data-testid="button-close-fullscreen"
          >
            <X className="w-6 h-6" />
          </Button>

          {/* Media */}
          <div className="flex-1 flex items-center justify-center bg-black overflow-hidden">
            {mediaType === "video" ? (
              <video
                src={mediaUrl}
                className="w-full h-full object-contain"
                controls
                autoPlay
                data-testid="video-fullscreen"
              />
            ) : (
              <img
                src={mediaUrl}
                alt="Post"
                className="w-full h-full object-contain"
                data-testid="img-fullscreen"
              />
            )}
          </div>

          {/* Post Info Bar */}
          <div className="bg-black border-t border-border/20 p-4 space-y-4">
            {/* User Info */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <AvatarImage src={post.user?.profilePicture || undefined} alt={post.user?.username} />
                  <AvatarFallback>{post.user?.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{post.user?.username}</p>
                  <p className="text-xs text-muted-foreground">
                    {post.createdAt && formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>

            {/* Caption */}
            {post.caption && (
              <p className="text-sm text-foreground line-clamp-3">{post.caption}</p>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="gap-2 text-white hover:text-primary"
                onClick={() => onVoteUp?.(post.id)}
                data-testid="button-vote-up-fullscreen"
              >
                <ThumbsUp className="w-4 h-4" />
                <span className="text-xs">{post.votes}</span>
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="gap-2 text-white hover:text-destructive"
                onClick={() => onVoteDown?.(post.id)}
                data-testid="button-vote-down-fullscreen"
              >
                <ThumbsDown className="w-4 h-4" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="gap-2 text-white hover:text-primary"
                onClick={() => {
                  onComment?.(post.id);
                  onClose();
                }}
                data-testid="button-comment-fullscreen"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs">{post.commentCount || 0}</span>
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="gap-2 text-white hover:text-primary"
                onClick={handleShare}
                data-testid="button-share-fullscreen"
              >
                <Share2 className="w-4 h-4" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="gap-2 text-white hover:text-primary ml-auto"
                onClick={handleSave}
                data-testid="button-save-fullscreen"
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
              </Button>
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
    </>
  );
}

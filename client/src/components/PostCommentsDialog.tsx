import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthModal } from "@/components/AuthModal";
import VerificationBadge from "@/components/VerificationBadge";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Star, Reply, Trash2, Trophy } from "lucide-react";
import { parseMentions } from "@/lib/mentions";
import type { Comment, User, Trend, Post } from "@shared/schema";

type CommentWithUser = Comment & { user: User | null };

interface PostCommentsDialogProps {
  postId: string;
  trendId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  highlightCommentId?: string;
}

export default function PostCommentsDialog({
  postId,
  trendId,
  open,
  onOpenChange,
  highlightCommentId,
}: PostCommentsDialogProps) {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<CommentWithUser | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [shownRepliesCount, setShownRepliesCount] = useState<Map<string, number>>(new Map());
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch trend info to get host ID
  const { data: trend } = useQuery<Trend>({
    queryKey: [`/api/trends/${trendId}`],
    enabled: open && !!trendId,
  });

  // Fetch post info to check owner
  const { data: post } = useQuery<Post>({
    queryKey: ["/api/posts", postId],
    enabled: open && !!postId,
  });

  // Fetch comments for this post
  const { data: comments = [], isLoading } = useQuery<CommentWithUser[]>({
    queryKey: [`/api/comments/post/${postId}`],
    enabled: open && !!postId,
    refetchInterval: 5000,
  });

  // Fetch rankings to get user ranks
  const { data: rankingsData } = useQuery<{ rankings: any[] }>({
    queryKey: [`/api/rankings/${trendId}`],
    enabled: open && !!trendId,
  });

  // Create a map of userId to rank for quick lookup
  const userRankMap = new Map<string, number>();
  if (rankingsData?.rankings) {
    rankingsData.rankings.forEach((ranking, index: number) => {
      if (ranking.user?.id) {
        userRankMap.set(ranking.user.id, index + 1);
      }
    });
  }

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await apiRequest("POST", "/api/comments", {
        postId,
        trendId,
        text,
        parentId: replyingTo?.id,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/comments/post/${postId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/trend", trendId] });
      setNewComment("");
      setReplyingTo(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to post comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      try {
        const response = await apiRequest("DELETE", `/api/comments/${commentId}`);
        return response.json();
      } catch (error) {
        console.error("Delete comment error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/comments/post/${postId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/trend", trendId] });
      toast({
        title: "Comment deleted",
        description: "Your comment has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      console.error("Mutation error:", error);
      toast({
        title: "Failed to delete comment",
        description: error.message || "An error occurred while deleting the comment",
        variant: "destructive",
      });
    },
  });

  // Delete post mutation (for trend creator)
  const deletePostMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/posts/${postId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/trend", trendId] });
      setShowDeleteConfirm(false);
      onOpenChange(false);
      toast({
        title: "Post removed",
        description: "User has been disqualified from this trend.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove post",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    if (newComment.trim()) {
      createCommentMutation.mutate(newComment.trim());
    }
  };

  // Build nested comment tree (supports replies to replies at any depth)
  const buildCommentTree = (comments: CommentWithUser[]) => {
    const commentMap = new Map(comments.map(c => [c.id, { ...c, replies: [] as CommentWithUser[] }]));
    const roots: Array<CommentWithUser & { replies: CommentWithUser[] }> = [];
    
    // Build tree structure
    for (const comment of comments) {
      const node = commentMap.get(comment.id)!;
      if (!comment.parentId) {
        roots.push(node);
      } else {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.replies.push(node);
        }
      }
    }
    
    // Sort roots by newest first
    roots.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    
    // Sort replies chronologically (oldest first) at all levels
    const sortReplies = (replies: any[]) => {
      replies.sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());
      replies.forEach(r => sortReplies(r.replies));
    };
    roots.forEach(r => sortReplies(r.replies));
    
    return roots;
  };
  
  const rootComments = buildCommentTree(comments);
  
  // Create a map for quick comment lookups by ID
  const commentMap = new Map(comments.map(c => [c.id, c]));
  
  // Count all nested replies recursively
  const countAllReplies = (comment: CommentWithUser & { replies: CommentWithUser[] }): number => {
    return comment.replies.length + comment.replies.reduce((sum, reply) => sum + countAllReplies(reply as CommentWithUser & { replies: CommentWithUser[] }), 0);
  };
  
  // Recursive comment component
  const CommentThread = ({ comment, depth = 0 }: { comment: CommentWithUser & { replies: CommentWithUser[] }; depth?: number }) => {
    const isOwnComment = comment.userId === user?.id;
    const isChild = depth > 0;
    const indentClass = isChild ? `ml-${Math.min(depth * 3, 12)}` : "";
    const isExpanded = expandedReplies.has(comment.id);
    const repliesPerPage = 2;
    const currentShown = shownRepliesCount.get(comment.id) || repliesPerPage;
    const totalReplies = countAllReplies(comment);
    
    // Get parent username if this is a reply to a reply
    const parentComment = comment.parentId ? commentMap.get(comment.parentId) : null;
    const parentUsername = parentComment?.user?.username;
    
    const toggleReplies = () => {
      const newSet = new Set(expandedReplies);
      if (newSet.has(comment.id)) {
        newSet.delete(comment.id);
      } else {
        newSet.add(comment.id);
      }
      setExpandedReplies(newSet);
    };
    
    const showMoreReplies = () => {
      setShownRepliesCount(new Map(shownRepliesCount).set(comment.id, currentShown + repliesPerPage));
    };
    
    return (
      <div key={comment.id}>
        <div
          id={`comment-${comment.id}`}
          className={`flex gap-3 group transition-all ${indentClass}`}
          data-testid={`comment-${comment.id}`}
        >
          <Avatar className={isChild ? "w-6 h-6" : "w-8 h-8"}>
            <AvatarImage
              src={comment.user?.profilePicture || undefined}
              alt={comment.user?.username || "User"}
            />
            <AvatarFallback>
              {(comment.user?.username || "U").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <div className="flex items-baseline gap-2 min-w-0">
              <span className={`${isChild ? "text-xs font-medium" : "text-sm font-medium"} truncate`} data-testid="text-commenter" title={comment.user?.username}>
                {comment.user?.username || "Unknown"}
              </span>
              <VerificationBadge verified={comment.user?.verified} size="sm" />
              {comment.user?.id && userRankMap.has(comment.user.id) && (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30">
                  <Trophy className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">#{userRankMap.get(comment.user.id)}</span>
                </div>
              )}
              {comment.user?.id === trend?.userId && (
                <Star className={`${isChild ? "w-2.5 h-2.5" : "w-3 h-3"} fill-yellow-500 text-yellow-500`} data-testid="icon-host" />
              )}
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.createdAt!), { addSuffix: true })}
              </span>
            </div>
            <p className={isChild ? "text-xs" : "text-sm"} data-testid="text-comment">
              {parentUsername && (
                <span className="bg-primary/20 text-primary font-medium rounded px-1 mr-1">
                  @{parentUsername}
                </span>
              )}
              {parseMentions(comment.text).map((part, idx) => 
                typeof part === "string" ? (
                  <span key={idx}>{part}</span>
                ) : (
                  <span key={idx} className="bg-primary/20 text-primary font-medium rounded px-1">
                    @{part.username}
                  </span>
                )
              )}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className={`mt-1 text-xs ${isChild ? "h-5 p-0" : "h-6"}`}
                onClick={() => setReplyingTo(comment)}
                data-testid={`button-reply-${comment.id}`}
              >
                <Reply className={`${isChild ? "w-2.5 h-2.5" : "w-3 h-3"} mr-1`} />
                Reply
              </Button>
              {!isChild && totalReplies > 0 && !isExpanded && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 text-xs text-primary/70"
                  onClick={toggleReplies}
                  data-testid={`button-toggle-replies-${comment.id}`}
                >
                  Show {totalReplies} {totalReplies === 1 ? "reply" : "replies"}
                </Button>
              )}
              {isOwnComment && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={`mt-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive ${isChild ? "h-5 p-0" : "h-6"}`}
                  onClick={() => deleteCommentMutation.mutate(comment.id)}
                  disabled={deleteCommentMutation.isPending}
                  data-testid={`button-delete-${comment.id}`}
                >
                  <Trash2 className={`${isChild ? "w-2.5 h-2.5" : "w-3 h-3"} mr-1`} />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Render nested replies - only show if expanded or if this is a nested reply */}
        {comment.replies.length > 0 && (isExpanded || isChild) && (
          <div className={isChild ? "space-y-2 mt-2" : "space-y-2 mt-2 pl-3 border-l-2 border-muted"}>
            {comment.replies.slice(0, isChild ? comment.replies.length : currentShown).map(reply => (
              <CommentThread key={reply.id} comment={reply as CommentWithUser & { replies: CommentWithUser[] }} depth={depth + 1} />
            ))}
            {!isChild && currentShown < comment.replies.length && (
              <div className="mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-primary/70"
                  onClick={showMoreReplies}
                  data-testid={`button-show-more-${comment.id}`}
                >
                  Show {Math.min(repliesPerPage, comment.replies.length - currentShown)} more {Math.min(repliesPerPage, comment.replies.length - currentShown) === 1 ? "reply" : "replies"}
                </Button>
              </div>
            )}
            {!isChild && isExpanded && (
              <div className="mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-primary/70"
                  onClick={toggleReplies}
                  data-testid={`button-hide-replies-${comment.id}`}
                >
                  Hide {totalReplies} {totalReplies === 1 ? "reply" : "replies"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Scroll to highlighted comment when dialog opens with comments loaded
  useEffect(() => {
    if (!open || !highlightCommentId || !comments.length) return;
    
    // Wait for dialog to fully render
    setTimeout(() => {
      const commentElement = document.getElementById(`comment-${highlightCommentId}`);
      if (commentElement) {
        commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        commentElement.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
        setTimeout(() => {
          commentElement.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
        }, 3000);
      }
    }, 300);
  }, [open, highlightCommentId, comments]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col" data-testid="dialog-comments">
        <DialogHeader>
          <DialogTitle>Comments</DialogTitle>
        </DialogHeader>

        {/* Post actions for trend creator */}
        {trend && user && trend.userId === user.id && post && post.userId !== user.id && (
          <div className="flex gap-2 border-b pb-3">
            <Button
              variant="outline"
              size="sm"
              className="text-destructive"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deletePostMutation.isPending}
              data-testid="button-delete-post"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Disqualify & Delete
            </Button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {isLoading ? (
            <>
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </>
          ) : rootComments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            rootComments.map(comment => (
              <CommentThread key={comment.id} comment={comment} depth={0} />
            ))
          )}
        </div>

        <div className="pt-4 border-t space-y-2">
          {replyingTo && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
              <Reply className="w-4 h-4" />
              <span>Replying to <strong>{replyingTo.user?.username}</strong></span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-6"
                onClick={() => setReplyingTo(null)}
                data-testid="button-cancel-reply"
              >
                Cancel
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <Textarea
              placeholder={replyingTo ? `Reply to ${replyingTo.user?.username}...` : "Write a comment..."}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[60px]"
              data-testid="input-comment"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <Button
              onClick={handleSubmit}
              disabled={!newComment.trim() || createCommentMutation.isPending}
              data-testid="button-submit-comment"
            >
              Post
            </Button>
          </div>
        </div>
      </DialogContent>

      <AuthModal
        isOpen={authModalOpen}
        onOpenChange={setAuthModalOpen}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent data-testid="dialog-delete-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove This Post?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this post? The user will not be allowed to reenter this trend.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-delete-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePostMutation.mutate()}
              disabled={deletePostMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-delete-confirm"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

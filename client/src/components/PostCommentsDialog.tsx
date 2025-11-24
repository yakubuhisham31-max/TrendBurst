import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthModal } from "@/components/AuthModal";
import VerificationBadge from "@/components/VerificationBadge";
import { formatDistanceToNow } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Star, Reply, Trash2 } from "lucide-react";
import { parseMentions } from "@/lib/mentions";
import type { Comment, User, Trend } from "@shared/schema";

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
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch trend info to get host ID
  const { data: trend } = useQuery<Trend>({
    queryKey: [`/api/trends/${trendId}`],
    enabled: open && !!trendId,
  });

  // Fetch comments for this post
  const { data: comments = [], isLoading } = useQuery<CommentWithUser[]>({
    queryKey: [`/api/comments/post/${postId}`],
    enabled: open && !!postId,
  });

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

  const handleSubmit = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    if (newComment.trim()) {
      createCommentMutation.mutate(newComment.trim());
    }
  };

  // Organize comments with threaded replies (Instagram style)
  const organizeComments = (comments: CommentWithUser[]) => {
    const result: Array<{ comment: CommentWithUser; replies: CommentWithUser[] }> = [];
    const commentMap = new Map(comments.map(c => [c.id, c]));
    
    // Sort all comments by newest first
    const sorted = [...comments].sort(
      (a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
    
    // Group parent comments with their replies
    for (const comment of sorted) {
      if (!comment.parentId) {
        // This is a parent comment
        const replies = sorted.filter(c => c.parentId === comment.id);
        result.push({ comment, replies: replies.sort((a, b) => 
          new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime()
        )});
      }
    }
    
    return result;
  };
  
  const groupedComments = organizeComments(comments);

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

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {isLoading ? (
            <>
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </>
          ) : groupedComments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            groupedComments.map(({ comment, replies }) => {
              const isOwnComment = comment.userId === user?.id;
              
              return (
                <div key={comment.id}>
                  {/* Parent Comment */}
                  <div
                    id={`comment-${comment.id}`}
                    className="flex gap-3 group transition-all"
                    data-testid={`comment-${comment.id}`}
                  >
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage
                        src={comment.user?.profilePicture || undefined}
                        alt={comment.user?.username || "User"}
                      />
                      <AvatarFallback>
                        {(comment.user?.username || "U").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium" data-testid="text-commenter">
                          {comment.user?.username || "Unknown"}
                        </span>
                        <VerificationBadge verified={comment.user?.verified} size="sm" />
                        {comment.user?.id === trend?.userId && (
                          <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" data-testid="icon-host" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.createdAt!), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className="text-sm" data-testid="text-comment">
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
                          className="mt-1 h-6 text-xs"
                          onClick={() => setReplyingTo(comment)}
                          data-testid={`button-reply-${comment.id}`}
                        >
                          <Reply className="w-3 h-3 mr-1" />
                          Reply
                        </Button>
                        {replies.length > 0 && (
                          <span className="text-xs text-primary/70 ml-2">
                            {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                          </span>
                        )}
                        {isOwnComment && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-1 h-6 text-xs opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                            onClick={() => deleteCommentMutation.mutate(comment.id)}
                            disabled={deleteCommentMutation.isPending}
                            data-testid={`button-delete-${comment.id}`}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Replies (threaded) */}
                  {replies.length > 0 && (
                    <div className="ml-6 mt-2 space-y-2 pl-3 border-l-2 border-muted">
                      {replies.map((reply) => {
                        const isOwnReply = reply.userId === user?.id;
                        return (
                          <div
                            key={reply.id}
                            id={`comment-${reply.id}`}
                            className="flex gap-2 group transition-all"
                            data-testid={`comment-${reply.id}`}
                          >
                            <Avatar className="w-6 h-6 flex-shrink-0">
                              <AvatarImage
                                src={reply.user?.profilePicture || undefined}
                                alt={reply.user?.username || "User"}
                              />
                              <AvatarFallback>
                                {(reply.user?.username || "U").slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-baseline gap-2">
                                <span className="text-xs font-medium" data-testid="text-commenter">
                                  {reply.user?.username || "Unknown"}
                                </span>
                                <VerificationBadge verified={reply.user?.verified} size="sm" />
                                {reply.user?.id === trend?.userId && (
                                  <Star className="w-2.5 h-2.5 fill-yellow-500 text-yellow-500" data-testid="icon-host" />
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(reply.createdAt!), {
                                    addSuffix: true,
                                  })}
                                </span>
                              </div>
                              <p className="text-xs" data-testid="text-comment">
                                {parseMentions(reply.text).map((part, idx) => 
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
                                  className="h-5 text-xs p-0"
                                  onClick={() => setReplyingTo(reply)}
                                  data-testid={`button-reply-${reply.id}`}
                                >
                                  <Reply className="w-2.5 h-2.5 mr-1" />
                                  Reply
                                </Button>
                                {isOwnReply && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 text-xs p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                                    onClick={() => deleteCommentMutation.mutate(reply.id)}
                                    disabled={deleteCommentMutation.isPending}
                                    data-testid={`button-delete-${reply.id}`}
                                  >
                                    <Trash2 className="w-2.5 h-2.5 mr-1" />
                                    Delete
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
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
    </Dialog>
  );
}

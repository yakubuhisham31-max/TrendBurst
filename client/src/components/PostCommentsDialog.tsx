import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import type { Comment, User } from "@shared/schema";

type CommentWithUser = Comment & { user: User | null };

interface PostCommentsDialogProps {
  postId: string;
  trendId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PostCommentsDialog({
  postId,
  trendId,
  open,
  onOpenChange,
}: PostCommentsDialogProps) {
  const [newComment, setNewComment] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

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
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/comments/post/${postId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/trend", trendId] });
      setNewComment("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to post comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to comment.",
        variant: "destructive",
      });
      return;
    }
    if (newComment.trim()) {
      createCommentMutation.mutate(newComment.trim());
    }
  };

  // Sort comments by createdAt (newest first)
  const sortedComments = [...comments].sort(
    (a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
  );

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
          ) : sortedComments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            sortedComments.map((comment) => (
              <div
                key={comment.id}
                className="flex gap-3"
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
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.createdAt!), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="text-sm" data-testid="text-comment">
                    {comment.text}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Textarea
            placeholder="Write a comment..."
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
      </DialogContent>
    </Dialog>
  );
}

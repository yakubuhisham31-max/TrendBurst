import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Users, Eye, Send, Star, Reply, Trash2, Trophy } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { parseMentions } from "@/lib/mentions";
import type { Comment, Trend, User, Post } from "@shared/schema";

type CommentWithUser = Comment & { user: User | null };
type TrendWithCreator = Trend & { creator: User | null };

export default function FeedChatPage() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const trendId = params.id;
  const [message, setMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState<CommentWithUser | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [shownRepliesCount, setShownRepliesCount] = useState<Map<string, number>>(new Map());
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Get query params
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const fromPostId = searchParams.get('fromPost');

  // Fetch trend info
  const { data: trend, isLoading: trendLoading } = useQuery<TrendWithCreator>({
    queryKey: [`/api/trends/${trendId}`],
    enabled: !!trendId,
  });

  // Fetch comments for this trend
  const { data: comments = [], isLoading: commentsLoading } = useQuery<CommentWithUser[]>({
    queryKey: ["/api/comments/trend", trendId],
    enabled: !!trendId,
    refetchInterval: 5000,
  });


  // Update view tracking mutation
  const updateViewMutation = useMutation({
    mutationFn: async ({ type, identifier }: { type: string; identifier: string }) => {
      const response = await apiRequest("POST", "/api/view-tracking", { type, identifier });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/counts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/unread-chat-count", trendId] });
    },
  });

  // Mark chat as viewed when entering
  useEffect(() => {
    if (user && trendId) {
      updateViewMutation.mutate({ type: "chat", identifier: trendId });
    }
  }, [trendId, user]);

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!trendId) throw new Error("Trend ID is required");
      const response = await apiRequest("POST", "/api/comments", {
        trendId,
        text,
        parentId: replyingTo?.id,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/comments/trend", trendId] });
      queryClient.invalidateQueries({ queryKey: [`/api/trends/${trendId}`] });
      setMessage("");
      setReplyingTo(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
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
      queryClient.invalidateQueries({ queryKey: ["/api/comments/trend", trendId] });
      queryClient.invalidateQueries({ queryKey: [`/api/trends/${trendId}`] });
      toast({
        title: "Message deleted",
        description: "Your message has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      console.error("Mutation error:", error);
      toast({
        title: "Failed to delete message",
        description: error.message || "An error occurred while deleting the message",
        variant: "destructive",
      });
    },
  });

  // Delete post mutation (for trend creator)
  const deletePostMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPostId) throw new Error("No post selected");
      const response = await apiRequest("DELETE", `/api/posts/${selectedPostId}`);
      return response.json();
    },
    onSuccess: () => {
      if (selectedPostId) {
        queryClient.invalidateQueries({ queryKey: ["/api/posts", selectedPostId] });
        queryClient.invalidateQueries({ queryKey: ["/api/posts/trend", trendId] });
      }
      setShowDeleteConfirm(false);
      setSelectedPostId(null);
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

  const handleSendMessage = () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to send messages.",
        variant: "destructive",
      });
      return;
    }
    if (message.trim()) {
      createCommentMutation.mutate(message.trim());
    }
  };

  // Scroll to specific comment from notification deep link
  useEffect(() => {
    if (!comments.length) return;
    
    const hash = window.location.hash.slice(1); // Remove the # character
    if (!hash) return;
    
    // Parse hash for comment ID
    const commentMatch = hash.match(/comment-([a-f0-9-]+)/);
    
    if (commentMatch) {
      const commentId = commentMatch[1];
      
      // Scroll to the comment
      setTimeout(() => {
        const commentElement = document.getElementById(`comment-${commentId}`);
        if (commentElement) {
          commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          commentElement.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
          setTimeout(() => {
            commentElement.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
          }, 3000);
        }
      }, 500);
      
      // Clear hash from URL after processing
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [comments]);

  // Auto-scroll to bottom on new messages (only if no hash)
  useEffect(() => {
    if (!window.location.hash) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments]);

  // Auto-expand textarea as user types
  useEffect(() => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 200); // Max height of 200px
    textarea.style.height = `${newHeight}px`;
  }, [message]);

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
    
    // Keep chronological order (oldest first) for chat
    roots.sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());
    
    // Sort replies chronologically at all levels
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

  // Recursive chat comment component (supports replies to replies at any depth) - same as comments
  const ChatCommentThread = ({ comment, depth = 0 }: { comment: CommentWithUser & { replies: CommentWithUser[] }; depth?: number }) => {
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
              <ChatCommentThread key={reply.id} comment={reply as CommentWithUser & { replies: CommentWithUser[] }} depth={depth + 1} />
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                if (fromPostId) {
                  setLocation(`/feed/${trendId}?fullscreenPost=${fromPostId}`);
                } else if (trendId) {
                  setLocation(`/feed/${trendId}`);
                } else {
                  setLocation("/");
                }
              }}
              data-testid="button-back"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold" data-testid="text-trend-name">Trend Discussion</h1>
              <p className="text-xs text-muted-foreground">Chat with participants</p>
            </div>
          </div>

          {trendLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : trend ? (
            <Card className="overflow-hidden">
              <div className="relative h-32">
                {trend.coverPicture ? (
                  <img
                    src={trend.coverPicture}
                    alt={trend.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-chart-2/20" />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60" />
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h2 className="font-bold text-base line-clamp-1 mb-2" data-testid="text-trend-title">
                    {trend.name}
                  </h2>
                  <div className="flex items-center gap-3 text-xs">
                    <Badge className="bg-primary/90 text-primary-foreground" data-testid="badge-category">
                      {trend.category}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{trend.participants || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>{trend.views || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ) : null}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto max-w-4xl mx-auto w-full px-4 py-4">
        {commentsLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : rootComments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <div className="space-y-4">
            {rootComments.map(comment => (
              <ChatCommentThread key={comment.id} comment={comment} depth={0} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
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
      </main>

      <footer className="sticky bottom-0 bg-background border-t">
        <div className="max-w-4xl mx-auto px-4 py-3">
          {replyingTo && (
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
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
          <div className="flex gap-2 items-end">
            <Textarea
              ref={textareaRef}
              placeholder={replyingTo ? `Reply to ${replyingTo.user?.username}...` : "Type your message..."}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="flex-1 resize-none min-h-10 max-h-52"
              rows={1}
              data-testid="input-message"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!message.trim() || createCommentMutation.isPending}
              data-testid="button-send"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}

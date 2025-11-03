import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Users, Eye, Send, Star, Reply, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Comment, Trend, User } from "@shared/schema";

type CommentWithUser = Comment & { user: User | null };
type TrendWithCreator = Trend & { creator: User | null };

export default function FeedChatPage() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const trendId = params.id;
  const [message, setMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState<CommentWithUser | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch trend info
  const { data: trend, isLoading: trendLoading } = useQuery<TrendWithCreator>({
    queryKey: [`/api/trends/${trendId}`],
    enabled: !!trendId,
  });

  // Fetch comments for this trend
  const { data: comments = [], isLoading: commentsLoading } = useQuery<CommentWithUser[]>({
    queryKey: ["/api/comments/trend", trendId],
    enabled: !!trendId,
  });

  // Update view tracking mutation
  const updateViewMutation = useMutation({
    mutationFn: async ({ type, identifier }: { type: string; identifier: string }) => {
      const response = await apiRequest("POST", "/api/view-tracking", { type, identifier });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/counts"] });
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
      const response = await apiRequest("DELETE", `/api/comments/${commentId}`);
      return response.json();
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
      toast({
        title: "Failed to delete message",
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

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  // Sort comments by createdAt (oldest first)
  const sortedComments = [...comments].sort((a, b) => 
    new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime()
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => window.history.back()}
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
        ) : sortedComments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <div className="space-y-4">
            {sortedComments.map((comment) => {
              const isCurrentUser = comment.userId === user?.id;
              const isHost = comment.userId === trend?.userId;
              const parentComment = comment.parentId 
                ? sortedComments.find(c => c.id === comment.parentId)
                : null;
              
              if (isCurrentUser) {
                return (
                  <div key={comment.id} className="flex justify-end group" data-testid={`comment-${comment.id}`}>
                    <div className="max-w-[70%] bg-primary text-primary-foreground rounded-lg p-3 relative">
                      {isHost && (
                        <div className="flex items-center gap-1 mb-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" data-testid="icon-host" />
                          <span className="text-xs opacity-80">Host</span>
                        </div>
                      )}
                      {parentComment && (
                        <div className="text-xs opacity-80 bg-primary-foreground/20 px-2 py-1 rounded mb-2 italic border-l-2 border-primary-foreground/50">
                          <Reply className="w-3 h-3 inline mr-1" />
                          Replying to <strong>{parentComment.user?.username}</strong>: {parentComment.text.slice(0, 40)}{parentComment.text.length > 40 ? '...' : ''}
                        </div>
                      )}
                      <p className="text-sm" data-testid={`text-message-${comment.id}`}>
                        {comment.text}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs opacity-80" data-testid={`text-time-${comment.id}`}>
                          {formatDistanceToNow(new Date(comment.createdAt!), { addSuffix: true })}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-primary-foreground hover:bg-primary-foreground/20"
                          onClick={() => deleteCommentMutation.mutate(comment.id)}
                          disabled={deleteCommentMutation.isPending}
                          data-testid={`button-delete-${comment.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              }
              
              return (
                <div key={comment.id} className="flex gap-3 hover-elevate p-3 rounded-lg" data-testid={`comment-${comment.id}`}>
                  <Avatar 
                    className="w-10 h-10 flex-shrink-0 cursor-pointer"
                    onClick={() => setLocation(`/profile/${comment.user?.username}`)}
                  >
                    <AvatarImage src={comment.user?.profilePicture || undefined} alt={comment.user?.username} />
                    <AvatarFallback>{comment.user?.username?.slice(0, 2).toUpperCase() || "?"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span 
                        className="font-semibold text-sm cursor-pointer hover:underline" 
                        data-testid={`text-username-${comment.id}`}
                        onClick={() => setLocation(`/profile/${comment.user?.username}`)}
                      >
                        {comment.user?.username || "Unknown"}
                      </span>
                      {isHost && (
                        <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" data-testid="icon-host" />
                      )}
                      <span className="text-xs text-muted-foreground" data-testid={`text-time-${comment.id}`}>
                        {formatDistanceToNow(new Date(comment.createdAt!), { addSuffix: true })}
                      </span>
                    </div>
                    {parentComment && (
                      <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded mb-2 italic border-l-2 border-primary/50">
                        <Reply className="w-3 h-3 inline mr-1" />
                        Replying to <strong>{parentComment.user?.username}</strong>: {parentComment.text.slice(0, 40)}{parentComment.text.length > 40 ? '...' : ''}
                      </div>
                    )}
                    <p className="text-sm text-foreground" data-testid={`text-message-${comment.id}`}>
                      {comment.text}
                    </p>
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
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
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
          <div className="flex gap-2">
            <Input
              placeholder={replyingTo ? `Reply to ${replyingTo.user?.username}...` : "Type your message..."}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1"
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

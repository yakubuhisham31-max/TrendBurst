import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Info, Trophy, MessageSquare, Plus, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import PostCard from "@/components/PostCard";
import CreatePostDialog from "@/components/CreatePostDialog";
import PostCommentsDialog from "@/components/PostCommentsDialog";
import logoImage from "@assets/file_0000000058b0622fae99adc55619c415_1759754745057.png";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Post, Trend, User } from "@shared/schema";

type PostWithUser = Post & { user: User | null; userVoted: boolean };
type TrendWithCreator = Trend & { creator: User | null };

export default function FeedPage() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const trendId = params.id;
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch trend info
  const { data: trend, isLoading: trendLoading } = useQuery<TrendWithCreator>({
    queryKey: ["/api/trends", trendId],
    enabled: !!trendId,
  });

  // Fetch posts for this trend
  const { data: posts = [], isLoading: postsLoading } = useQuery<PostWithUser[]>({
    queryKey: ["/api/posts/trend", trendId],
    enabled: !!trendId,
  });

  // Fetch vote count for current user
  const { data: voteCountData } = useQuery<{ count: number }>({
    queryKey: ["/api/votes/trend", trendId, "count"],
    enabled: !!trendId && !!user,
  });

  // Fetch notification counts
  const { data: notificationCounts } = useQuery<{ category: Record<string, number>, chat: Record<string, number> }>({
    queryKey: ["/api/notifications/counts"],
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const votesRemaining = 10 - (voteCountData?.count || 0);
  const isTrendEnded = trend?.endDate ? new Date(trend.endDate) < new Date() : false;
  const userHasPosted = posts.some(post => post.userId === user?.id);
  const unreadChatCount = trendId && notificationCounts?.chat?.[trendId] || 0;

  // Vote increment mutation
  const voteUpMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!trendId) throw new Error("Trend ID is required");
      const response = await apiRequest("POST", "/api/votes/increment", { postId, trendId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts/trend", trendId] });
      queryClient.invalidateQueries({ queryKey: ["/api/votes/trend", trendId, "count"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Vote failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Vote decrement mutation
  const voteDownMutation = useMutation({
    mutationFn: async (postId: string) => {
      await apiRequest("POST", "/api/votes/decrement", { postId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts/trend", trendId] });
      queryClient.invalidateQueries({ queryKey: ["/api/votes/trend", trendId, "count"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove vote",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (data: { imageUrl: string; caption: string }) => {
      if (!trendId) throw new Error("Trend ID is required");
      const response = await apiRequest("POST", "/api/posts", {
        trendId,
        ...data,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts/trend", trendId] });
      setCreatePostOpen(false);
      toast({
        title: "Post created!",
        description: "Your post has been added to the trend.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create post",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Disqualify post mutation
  const disqualifyMutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await apiRequest("PATCH", `/api/posts/${postId}/disqualify`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts/trend", trendId] });
      toast({
        title: "Post status updated",
        description: data.isDisqualified 
          ? "The post has been disqualified." 
          : "The post has been requalified.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update post status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete trend mutation
  const deleteTrendMutation = useMutation({
    mutationFn: async () => {
      if (!trendId) throw new Error("Trend ID is required");
      const response = await apiRequest("DELETE", `/api/trends/${trendId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trends"] });
      toast({
        title: "Trend deleted",
        description: "Your trend has been deleted successfully.",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete trend",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleVoteUp = (postId: string) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to vote on posts.",
        variant: "destructive",
      });
      return;
    }
    
    // Check vote limit
    if (votesRemaining <= 0) {
      toast({
        title: "No votes remaining",
        description: "You have used all 10 votes for this trend.",
        variant: "destructive",
      });
      return;
    }
    
    // Increment vote
    voteUpMutation.mutate(postId);
  };

  const handleVoteDown = (postId: string) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to vote on posts.",
        variant: "destructive",
      });
      return;
    }
    
    // Decrement vote
    voteDownMutation.mutate(postId);
  };

  const handleCreatePost = (data: { imageUrl: string; caption: string }) => {
    createPostMutation.mutate(data);
  };

  const handleDisqualify = (postId: string) => {
    disqualifyMutation.mutate(postId);
  };

  const handleDeleteTrend = () => {
    if (confirm("Are you sure you want to delete this trend? This action cannot be undone.")) {
      deleteTrendMutation.mutate();
    }
  };

  const isTrendCreator = user?.id === trend?.userId;

  // Sort posts by createdAt (oldest first as per requirements)
  const sortedPosts = [...posts].sort((a, b) => 
    new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime()
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>

          <img 
            src={logoImage} 
            alt="Trendz" 
            className="h-10 object-contain"
            data-testid="img-logo"
          />

          {isTrendCreator ? (
            <Button
              size="icon"
              variant="ghost"
              onClick={handleDeleteTrend}
              disabled={deleteTrendMutation.isPending}
              data-testid="button-delete-trend"
            >
              <Trash2 className="w-5 h-5 text-destructive" />
            </Button>
          ) : (
            <div className="w-10" />
          )}
        </div>

        <div className="max-w-3xl mx-auto px-4 pb-3 flex items-center justify-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setLocation(`/instructions/${trendId}`)}
            data-testid="button-instructions"
          >
            <Info className="w-4 h-4 mr-2" />
            Instructions
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setLocation(`/rankings/${trendId}`)}
            data-testid="button-rankings"
          >
            <Trophy className="w-4 h-4 mr-2" />
            Rankings
          </Button>
          <div className="flex items-center gap-2 px-4 py-1.5 bg-muted rounded-full">
            <span className="text-sm font-medium">Remaining Votes: {votesRemaining}/10</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4 space-y-6">
        {(trendLoading || postsLoading) ? (
          <>
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-96 w-full" />
          </>
        ) : sortedPosts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No posts yet. Be the first to post!
          </div>
        ) : (
          sortedPosts.map((post, index) => (
            <PostCard
              key={post.id}
              id={post.id}
              rank={index + 1}
              imageUrl={post.imageUrl}
              caption={post.caption || ""}
              username={post.user?.username || "Unknown"}
              userAvatar={post.user?.profilePicture || undefined}
              votes={post.votes || 0}
              createdAt={new Date(post.createdAt!)}
              userVoted={post.userVoted}
              commentsCount={post.commentCount || 0}
              isTrendHost={post.userId === trend?.userId}
              isUserTrendHost={user?.id === trend?.userId}
              isCreator={user?.id === post.userId}
              isDisqualified={!!post.isDisqualified}
              isTrendEnded={isTrendEnded}
              onVoteUp={() => handleVoteUp(post.id)}
              onVoteDown={() => handleVoteDown(post.id)}
              onComment={() => setCommentsPostId(post.id)}
              onDisqualify={() => handleDisqualify(post.id)}
            />
          ))
        )}
      </main>

      {!isTrendEnded && user && !userHasPosted && (
        <Button
          size="icon"
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-50"
          onClick={() => setCreatePostOpen(true)}
          data-testid="button-create-post"
        >
          <Plus className="w-6 h-6" />
        </Button>
      )}

      <Button
        size="icon"
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full shadow-lg bg-chart-2 z-50 relative"
        onClick={() => setLocation(`/feed-chat/${trendId}`)}
        data-testid="button-feed-chat"
      >
        <MessageSquare className="w-6 h-6" />
        {unreadChatCount > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 h-6 min-w-6 px-1.5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center"
            data-testid="badge-chat-notification"
          >
            {unreadChatCount > 99 ? "99+" : unreadChatCount}
          </Badge>
        )}
      </Button>

      <CreatePostDialog
        open={createPostOpen}
        onOpenChange={setCreatePostOpen}
        onSubmit={handleCreatePost}
      />

      {commentsPostId && trendId && (
        <PostCommentsDialog
          postId={commentsPostId}
          trendId={trendId}
          open={!!commentsPostId}
          onOpenChange={(open) => !open && setCommentsPostId(null)}
        />
      )}
    </div>
  );
}

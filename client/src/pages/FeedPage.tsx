import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Info, Trophy, MessageSquare, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import PostCard from "@/components/PostCard";
import CreatePostDialog from "@/components/CreatePostDialog";
import PostCommentsDialog from "@/components/PostCommentsDialog";
import PostFullscreenModal from "@/components/PostFullscreenModal";
import { AuthModal } from "@/components/AuthModal";
import logoImage from "@assets/trendx_background_fully_transparent (1)_1761635187125.png";
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
  const [highlightCommentId, setHighlightCommentId] = useState<string | null>(null);
  const [fullscreenPostId, setFullscreenPostId] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
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

  // Pause all background videos when fullscreen opens
  useEffect(() => {
    const allVideos = document.querySelectorAll("video");
    allVideos.forEach((video) => {
      if (fullscreenPostId) {
        video.pause();
      }
    });
  }, [fullscreenPostId]);

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
    mutationFn: async (data: { mediaUrl: string; mediaType: 'image' | 'video'; caption: string }) => {
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

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      await apiRequest("DELETE", `/api/posts/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts/trend", trendId] });
      toast({
        title: "Post deleted",
        description: "Your post has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete post",
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

  // Scroll to specific post/comment from notification deep link
  useEffect(() => {
    if (!posts.length) return;
    
    const hash = window.location.hash.slice(1); // Remove the # character
    if (!hash) return;
    
    // Parse hash for post and/or comment IDs
    const postMatch = hash.match(/post-([a-f0-9-]+)/);
    const commentMatch = hash.match(/comment-([a-f0-9-]+)/);
    
    if (postMatch) {
      const postId = postMatch[1];
      
      // If there's a comment ID, open the comments dialog with highlighted comment
      if (commentMatch) {
        const commentId = commentMatch[1];
        setHighlightCommentId(commentId);
        setCommentsPostId(postId);
      } else {
        // Just scroll to the post
        setTimeout(() => {
          const postElement = document.getElementById(`post-${postId}`);
          if (postElement) {
            postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            postElement.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
            setTimeout(() => {
              postElement.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
            }, 3000);
          }
        }, 300);
      }
      
      // Clear hash from URL after processing
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [posts]);

  const handleVoteUp = (postId: string) => {
    if (!user) {
      setAuthModalOpen(true);
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
      setAuthModalOpen(true);
      return;
    }
    
    // Decrement vote
    voteDownMutation.mutate(postId);
  };

  const handleCreatePost = (data: { mediaUrl: string; mediaType: 'image' | 'video'; caption: string }) => {
    createPostMutation.mutate(data);
  };

  const handleDeletePost = (postId: string) => {
    deletePostMutation.mutate(postId);
  };

  const handleDisqualify = (postId: string) => {
    disqualifyMutation.mutate(postId);
  };


  const isTrendCreator = user?.id === trend?.userId;

  // Sort posts by time (oldest first) for display
  const sortedPosts = [...posts].sort((a, b) => 
    new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime()
  );

  // Calculate vote-based rankings
  const rankedByVotes = [...posts].sort((a, b) => (b.votes || 0) - (a.votes || 0));
  const voteRankMap = new Map<string, number>();
  rankedByVotes.forEach((post, index) => {
    voteRankMap.set(post.id, index + 1);
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-3xl mx-auto px-4 h-20 flex items-center justify-between gap-4">
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
            className="h-14 sm:h-16 md:h-20 object-contain"
            data-testid="img-logo"
          />

          <div className="flex items-center gap-2">
            {!isTrendEnded && user && !userHasPosted && (
              <Button
                size="icon"
                variant="default"
                className="w-10 h-10 rounded-full"
                onClick={() => setCreatePostOpen(true)}
                data-testid="button-create-post"
              >
                <Plus className="w-5 h-5" />
              </Button>
            )}
            <Button
              size="icon"
              variant="secondary"
              className="w-10 h-10 rounded-full relative"
              onClick={() => setLocation(`/feed-chat/${trendId}`)}
              data-testid="button-feed-chat"
            >
              <MessageSquare className="w-5 h-5" />
              {unreadChatCount > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 h-5 min-w-5 px-1 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center"
                  data-testid="badge-chat-notification"
                >
                  {unreadChatCount > 99 ? "99+" : unreadChatCount}
                </Badge>
              )}
            </Button>
          </div>
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
          sortedPosts.map((post, index) => {
            const isBlurred = !user && index >= 3;
            return (
              <div
                key={post.id}
                className={`relative ${isBlurred ? 'blur-sm pointer-events-none' : ''}`}
              >
                <PostCard
                  id={post.id}
                  rank={voteRankMap.get(post.id) || 0}
                  mediaUrl={post.mediaUrl || post.imageUrl || ""}
                  mediaType={(post.mediaType as 'image' | 'video') || 'image'}
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
                  onDelete={() => handleDeletePost(post.id)}
                  onDisqualify={() => handleDisqualify(post.id)}
                  onFullscreen={() => setFullscreenPostId(post.id)}
                />
                
                {isBlurred && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/30 backdrop-blur-sm cursor-pointer"
                    onClick={() => setAuthModalOpen(true)}
                  >
                    <div className="text-center space-y-2">
                      <p className="text-white font-semibold text-lg">Sign in to view more posts</p>
                      <p className="text-white/80 text-sm">Tap to continue</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>

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
          onOpenChange={(open) => {
            if (!open) {
              setCommentsPostId(null);
              setHighlightCommentId(null);
            }
          }}
          highlightCommentId={highlightCommentId || undefined}
        />
      )}

      {fullscreenPostId && (
        <PostFullscreenModal
          post={posts.find((p) => p.id === fullscreenPostId)! as Post & { user?: User }}
          isOpen={!!fullscreenPostId}
          onClose={() => setFullscreenPostId(null)}
          onComment={setCommentsPostId}
          onVoteUp={() => handleVoteUp(fullscreenPostId)}
          onVoteDown={() => handleVoteDown(fullscreenPostId)}
          userVoted={posts.find((p) => p.id === fullscreenPostId)?.userVoted}
          rank={voteRankMap.get(fullscreenPostId)}
          allPosts={posts as (Post & { user?: User })[]}
          onNextPost={() => {
            const currentIndex = posts.findIndex((p) => p.id === fullscreenPostId);
            if (currentIndex < posts.length - 1) {
              setFullscreenPostId(posts[currentIndex + 1].id);
            }
          }}
          onPreviousPost={() => {
            const currentIndex = posts.findIndex((p) => p.id === fullscreenPostId);
            if (currentIndex > 0) {
              setFullscreenPostId(posts[currentIndex - 1].id);
            }
          }}
        />
      )}

      <AuthModal
        isOpen={authModalOpen}
        onOpenChange={setAuthModalOpen}
      />
    </div>
  );
}

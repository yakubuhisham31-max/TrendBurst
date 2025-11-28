import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { ChevronLeft, Info, Trophy, MessageSquare, Plus, Users, Flame, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import PostCard from "@/components/PostCard";
import CreatePostDialog from "@/components/CreatePostDialog";
import PostCommentsDialog from "@/components/PostCommentsDialog";
import PostFullscreenModal from "@/components/PostFullscreenModal";
import { AuthModal } from "@/components/AuthModal";
import logoImage from "@assets/trendx_background_fully_transparent (1)_1761635187125.png";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmPostId, setDeleteConfirmPostId] = useState<string | null>(null);
  const [fromAnalytics, setFromAnalytics] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const postListRef = useRef<HTMLDivElement>(null);
  
  // Get query params for fullscreen post from returning from chat or analytics
  useEffect(() => {
    const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const fullscreenPostParam = searchParams.get('fullscreenPost');
    const fromParam = searchParams.get('from');
    if (fullscreenPostParam) {
      setFullscreenPostId(fullscreenPostParam);
      setFromAnalytics(fromParam === 'analytics');
      // Clean up URL
      window.history.replaceState({}, '', `/feed/${trendId}`);
    }
  }, [trendId]);

  // Fetch trend info
  const { data: trend, isLoading: trendLoading } = useQuery<TrendWithCreator>({
    queryKey: ["/api/trends", trendId],
    enabled: !!trendId,
  });

  // Fetch posts for this trend
  const { data: posts = [], isLoading: postsLoading } = useQuery<PostWithUser[]>({
    queryKey: ["/api/posts/trend", trendId],
    enabled: !!trendId,
    refetchInterval: 5000,
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

  // Check if user is disqualified from this trend
  const { data: disqualificationStatus } = useQuery<{ isDisqualified: boolean }>({
    queryKey: ["/api/trends", trendId, "disqualification-status"],
    enabled: !!trendId && !!user,
  });

  const votesRemaining = 10 - (voteCountData?.count || 0);
  const isTrendEnded = trend?.endDate ? new Date(trend.endDate) < new Date() : false;
  const userHasPosted = posts.some(post => post.userId === user?.id);
  const isUserDisqualified = disqualificationStatus?.isDisqualified || false;
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

  // Scroll to top when closing fullscreen to show first (oldest) post
  useEffect(() => {
    if (!fullscreenPostId && postListRef.current) {
      postListRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [fullscreenPostId]);

  // Vote increment mutation with optimistic updates
  const voteUpMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!trendId) throw new Error("Trend ID is required");
      const response = await apiRequest("POST", "/api/votes/increment", { postId, trendId });
      return response.json();
    },
    onMutate: async (postId: string) => {
      // Cancel any outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: ["/api/posts/trend", trendId] });
      await queryClient.cancelQueries({ queryKey: ["/api/votes/trend", trendId, "count"] });

      // Snapshot the previous value
      const previousPosts = queryClient.getQueryData<PostWithUser[]>(["/api/posts/trend", trendId]);
      const previousVoteCount = queryClient.getQueryData<{ count: number }>(["/api/votes/trend", trendId, "count"]);

      // Optimistically update posts
      if (previousPosts) {
        queryClient.setQueryData<PostWithUser[]>(
          ["/api/posts/trend", trendId],
          previousPosts.map(post =>
            post.id === postId
              ? { ...post, votes: (post.votes || 0) + 1, userVoted: true }
              : post
          )
        );
      }

      // Optimistically update vote count
      if (previousVoteCount) {
        queryClient.setQueryData<{ count: number }>(
          ["/api/votes/trend", trendId, "count"],
          { count: previousVoteCount.count + 1 }
        );
      }

      return { previousPosts, previousVoteCount };
    },
    onSuccess: () => {
      // Keep the optimistic update, no need to refetch
    },
    onError: (error: Error, variables, context) => {
      // Rollback on error
      if (context?.previousPosts) {
        queryClient.setQueryData(["/api/posts/trend", trendId], context.previousPosts);
      }
      if (context?.previousVoteCount) {
        queryClient.setQueryData(["/api/votes/trend", trendId, "count"], context.previousVoteCount);
      }
      
      toast({
        title: "Vote failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Vote decrement mutation with optimistic updates
  const voteDownMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!trendId) throw new Error("Trend ID is required");
      await apiRequest("POST", "/api/votes/decrement", { postId, trendId });
    },
    onMutate: async (postId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/posts/trend", trendId] });
      await queryClient.cancelQueries({ queryKey: ["/api/votes/trend", trendId, "count"] });

      // Snapshot the previous value
      const previousPosts = queryClient.getQueryData<PostWithUser[]>(["/api/posts/trend", trendId]);
      const previousVoteCount = queryClient.getQueryData<{ count: number }>(["/api/votes/trend", trendId, "count"]);

      // Optimistically update posts
      if (previousPosts) {
        queryClient.setQueryData<PostWithUser[]>(
          ["/api/posts/trend", trendId],
          previousPosts.map(post =>
            post.id === postId
              ? { ...post, votes: Math.max((post.votes || 0) - 1, 0), userVoted: false }
              : post
          )
        );
      }

      // Optimistically update vote count
      if (previousVoteCount) {
        queryClient.setQueryData<{ count: number }>(
          ["/api/votes/trend", trendId, "count"],
          { count: Math.max(previousVoteCount.count - 1, 0) }
        );
      }

      return { previousPosts, previousVoteCount };
    },
    onSuccess: () => {
      // Keep the optimistic update, no need to refetch
    },
    onError: (error: Error, variables, context) => {
      // Rollback on error
      if (context?.previousPosts) {
        queryClient.setQueryData(["/api/posts/trend", trendId], context.previousPosts);
      }
      if (context?.previousVoteCount) {
        queryClient.setQueryData(["/api/votes/trend", trendId, "count"], context.previousVoteCount);
      }

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

  const handleDisqualifyAndDelete = (postId: string) => {
    setDeleteConfirmPostId(postId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (deleteConfirmPostId) {
      deletePostMutation.mutate(deleteConfirmPostId);
    }
    setShowDeleteConfirm(false);
    setDeleteConfirmPostId(null);
  };


  const isTrendCreator = user?.id === trend?.userId;

  // Sort posts by time (oldest first) for display
  const sortedPosts = [...posts].sort((a, b) => 
    new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime()
  );

  // Calculate vote-based rankings (excluding disqualified posts)
  const qualifiedPosts = posts.filter(post => !post.isDisqualified);
  const rankedByVotes = [...qualifiedPosts].sort((a, b) => (b.votes || 0) - (a.votes || 0));
  const voteRankMap = new Map<string, number>();
  rankedByVotes.forEach((post, index) => {
    voteRankMap.set(post.id, index + 1);
  });

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Floating Action Buttons - Chat and Post */}
      <div className="fixed bottom-8 right-8 z-40 flex flex-col items-center gap-3">
        {/* Chat Button */}
        <div className="relative">
          <Button
            size="icon"
            variant="secondary"
            className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all"
            onClick={() => {
              if (!user) {
                setAuthModalOpen(true);
                return;
              }
              setLocation(`/feed-chat/${trendId}`);
            }}
            data-testid="button-feed-chat"
          >
            <MessageSquare className="w-6 h-6" />
          </Button>
          {unreadChatCount > 0 && (
            <div 
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md"
              data-testid="badge-chat-notification"
            >
              {unreadChatCount > 99 ? "99+" : unreadChatCount}
            </div>
          )}
        </div>

        {/* Post Button */}
        {!isTrendEnded && !userHasPosted && !isUserDisqualified && (
          <Button
            size="lg"
            className="gap-2 bg-primary hover:bg-primary/90 text-white border-0 shadow-lg hover:shadow-xl transition-all rounded-full px-6 py-3 h-auto"
            onClick={() => {
              if (!user) {
                setAuthModalOpen(true);
                return;
              }
              setCreatePostOpen(true);
            }}
            data-testid="button-create-post-fab"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm font-semibold">Post</span>
          </Button>
        )}
      </div>
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
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
            className="h-14 sm:h-16 md:h-18 object-contain flex-1 text-center"
            data-testid="img-logo"
          />
          
          <div className="w-10"></div>
        </div>

        <div className="max-w-3xl mx-auto px-4 pb-3 flex items-center justify-center gap-2 flex-wrap">
          <Button
            size="sm"
            className="gap-1.5 bg-primary/90 hover:bg-primary text-white border-0 shadow-sm hover:shadow-md transition-all"
            onClick={() => setLocation(`/instructions/${trendId}?from=feed`)}
            data-testid="button-instructions"
          >
            <Info className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Instructions</span>
          </Button>
          <Button
            size="sm"
            className="gap-1.5 bg-muted-foreground/60 hover:bg-muted-foreground text-white border-0 shadow-sm hover:shadow-md transition-all"
            onClick={() => {
              if (!user) {
                setAuthModalOpen(true);
                return;
              }
              setLocation(`/rankings/${trendId}`);
            }}
            data-testid="button-rankings"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Rankings</span>
          </Button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20 hover:border-primary/40 transition-colors">
            <span className="text-xs font-semibold text-primary">{votesRemaining} votes left</span>
          </div>
        </div>

        {/* Trend Stats */}
        {trend && !trendLoading && (
          <div className="max-w-3xl mx-auto px-4 py-2 flex items-center justify-center gap-2 flex-wrap">
            {trend.participants !== undefined && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/5 border border-primary/20 hover:border-primary/40 transition-colors">
                <Users className="w-3 h-3 text-primary" />
                <span className="text-xs font-semibold text-foreground">{trend.participants}</span>
              </div>
            )}
            {trend.endDate && (
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors ${
                isTrendEnded 
                  ? 'bg-destructive/5 border-destructive/20 hover:border-destructive/40' 
                  : 'bg-chart-3/5 border-chart-3/20 hover:border-chart-3/40'
              }`}>
                <Clock className={`w-3 h-3 ${
                  isTrendEnded 
                    ? 'text-destructive' 
                    : 'text-chart-3'
                }`} />
                <span className={`text-xs font-semibold ${
                  isTrendEnded 
                    ? 'text-destructive' 
                    : 'text-foreground'
                }`}>
                  {isTrendEnded ? 'Ended' : formatDistanceToNow(new Date(trend.endDate), { addSuffix: true })}
                </span>
              </div>
            )}
          </div>
        )}
      </header>

      <main ref={postListRef} className="max-w-3xl mx-auto px-4 py-4 space-y-6">
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
                className={`relative w-full ${isBlurred ? 'border border-border rounded-lg' : ''}`}
                id={`post-${post.id}`}
              >
                <div className={isBlurred ? 'blur-sm' : ''}>
                  <PostCard
                    id={post.id}
                    rank={voteRankMap.get(post.id) || 0}
                    mediaUrl={post.mediaUrl || post.imageUrl || ""}
                    mediaType={(post.mediaType as 'image' | 'video') || 'image'}
                    caption={post.caption || ""}
                    username={post.user?.username || "Unknown"}
                    userAvatar={post.user?.profilePicture || undefined}
                    userVerified={post.user?.verified}
                    votes={post.votes || 0}
                    createdAt={new Date(post.createdAt!)}
                    userVoted={post.userVoted}
                    commentsCount={post.commentCount || 0}
                    isTrendHost={post.userId === trend?.userId}
                    isUserTrendHost={user?.id === trend?.userId}
                    isCreator={user?.id === post.userId}
                    isDisqualified={!!post.isDisqualified}
                    isBlurred={isBlurred}
                    isTrendEnded={isTrendEnded}
                    onVoteUp={() => handleVoteUp(post.id)}
                    onVoteDown={() => handleVoteDown(post.id)}
                    onComment={() => {
                      if (!user) {
                        setAuthModalOpen(true);
                        return;
                      }
                      setCommentsPostId(post.id);
                    }}
                    onDelete={() => handleDeletePost(post.id)}
                    onDisqualify={() => handleDisqualify(post.id)}
                    onDisqualifyAndDelete={() => handleDisqualifyAndDelete(post.id)}
                    onFullscreen={() => setFullscreenPostId(post.id)}
                    onAuthModalOpen={() => setAuthModalOpen(true)}
                  />
                </div>
                
                {isBlurred && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center rounded-lg cursor-pointer z-20"
                    onClick={() => setAuthModalOpen(true)}
                  >
                    <div className="text-center space-y-3 bg-black/70 px-8 py-4 rounded-lg backdrop-blur-sm">
                      <p className="text-white font-bold text-xl">Tap to view</p>
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

      {fullscreenPostId && posts.length > 0 && (
        (() => {
          const selectedPost = posts.find((p) => p.id === fullscreenPostId);
          return selectedPost ? (
            <PostFullscreenModal
              post={selectedPost as Post & { user?: User }}
              isOpen={!!fullscreenPostId}
              onClose={() => {
                setFullscreenPostId(null);
                if (fromAnalytics) {
                  setLocation(`/analytics/${trendId}`);
                  setFromAnalytics(false);
                }
              }}
              onComment={setCommentsPostId}
              onVoteUp={() => handleVoteUp(fullscreenPostId)}
              onVoteDown={() => handleVoteDown(fullscreenPostId)}
              userVoted={selectedPost.userVoted}
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
              onTrendChat={(trendChatId) => {
                if (!user) {
                  setAuthModalOpen(true);
                  return;
                }
                setLocation(`/feed-chat/${trendChatId}?fromPost=${fullscreenPostId}`);
              }}
              isTrendCreator={isTrendCreator}
              onDisqualify={() => disqualifyMutation.mutate(fullscreenPostId)}
              onDisqualifyAndDelete={handleDisqualifyAndDelete}
              isDisqualifyPending={disqualifyMutation.isPending || deletePostMutation.isPending}
            />
          ) : null;
        })()
      )}

      <AuthModal
        isOpen={authModalOpen}
        onOpenChange={setAuthModalOpen}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent data-testid="dialog-delete-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this post and disqualify the user?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              data-testid="button-delete-confirm"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

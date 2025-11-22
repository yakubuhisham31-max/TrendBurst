import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, Trophy, Loader2, Star, Play, Crown, Flame, Zap, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import PostFullscreenModal from "@/components/PostFullscreenModal";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Post, User } from "@shared/schema";

interface RankingEntry {
  rank: number;
  post: Post & { user?: User };
}

interface RankingsResponse {
  trendId: string;
  trendName: string;
  trendHostId: string;
  trendHostUsername: string;
  isEnded: boolean;
  rankings: RankingEntry[];
}

export default function RankingsPage() {
  const { id: trendId } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user: currentUser } = useAuth();
  const [fullscreenPostId, setFullscreenPostId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: rankingsData, isLoading } = useQuery<RankingsResponse>({
    queryKey: [`/api/rankings/${trendId}`],
    enabled: !!trendId,
  });

  // Vote increment mutation
  const voteUpMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!trendId) throw new Error("Trend ID is required");
      const response = await apiRequest("POST", "/api/votes/increment", { postId, trendId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/rankings/${trendId}`] });
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
      queryClient.invalidateQueries({ queryKey: [`/api/rankings/${trendId}`] });
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

  const currentUserPost = rankingsData?.rankings.find(
    (entry) => entry.post.userId === currentUser?.id
  );

  const getRankBadge = (rank: number) => {
    const suffixes = ["st", "nd", "rd"];
    const suffix = rank <= 3 ? suffixes[rank - 1] : "th";
    return `${rank}${suffix}`;
  };

  const getMaxVotes = () => {
    return Math.max(...(rankingsData?.rankings.map(e => e.post.votes || 0) || [0]));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!rankingsData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">No rankings available</p>
      </div>
    );
  }

  const topThree = rankingsData.rankings.slice(0, 3);
  const restOfRankings = rankingsData.rankings.slice(3);
  const maxVotes = getMaxVotes();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => window.history.back()}
            data-testid="button-back"
            className="text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div className="flex flex-col flex-1">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-bold text-primary">{rankingsData.trendName}</h1>
            </div>
            <p className="text-xs text-muted-foreground font-medium">Hosted by <span className="text-foreground font-semibold">{rankingsData.trendHostUsername}</span></p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Your Entry */}
        {currentUserPost && (
          <div className="rank-item-card rounded-lg p-4 border-2 border-primary/50 bg-gray-50">
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary/60 to-primary/40 flex items-center justify-center">
                  <span className="text-lg font-bold text-white">{currentUserPost.rank}</span>
                </div>
                <div className="absolute -top-2 -right-2 bg-primary/80 text-white text-xs font-bold px-2 py-1 rounded-full">
                  YOU
                </div>
              </div>

              {(currentUserPost.post.imageUrl || currentUserPost.post.mediaUrl) && (
                currentUserPost.post.mediaType === "video" && currentUserPost.post.mediaUrl ? (
                  <div 
                    className="relative cursor-pointer"
                    onClick={() => setFullscreenPostId(currentUserPost.post.id)}
                    data-testid="video-user-post"
                  >
                    <video
                      src={currentUserPost.post.mediaUrl}
                      className="w-20 h-20 rounded-lg object-cover"
                      muted
                    />
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/30">
                      <Play className="w-4 h-4 text-white fill-white" />
                    </div>
                  </div>
                ) : (
                  <img
                    src={currentUserPost.post.imageUrl || currentUserPost.post.mediaUrl || ""}
                    alt={currentUserPost.post.user?.username}
                    className="w-20 h-20 rounded-lg object-cover cursor-pointer"
                    onClick={() => setFullscreenPostId(currentUserPost.post.id)}
                    data-testid="img-user-post"
                  />
                )
              )}

              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900">{currentUserPost.post.user?.username}</p>
                <p className="text-sm text-gray-600 line-clamp-1">{currentUserPost.post.caption}</p>
                <div className="mt-3 space-y-2">
                  <div className="vote-progress-bar">
                    <div
                      className="vote-progress-fill transition-all duration-500"
                      style={{ width: `${((currentUserPost.post.votes || 0) / maxVotes) * 100}%` }}
                    />
                  </div>
                  <p className="text-sm font-bold text-primary">{currentUserPost.post.votes || 0} votes</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top 3 Podium */}
        {topThree.length > 0 && (
          <div className="grid grid-cols-3 gap-4 items-end">
            {topThree.map((entry, index) => {
              const isFirst = entry.rank === 1;
              const heights = isFirst ? ["40px", "60px", "30px"] : ["30px", "50px", "20px"];
              const orders = [1, 0, 2];
              const badges = ["gold", "silver", "bronze"];
              const badge = badges[index];

              return (
                <div
                  key={entry.post.id}
                  className={`podium-column ${isFirst ? "ring-2 ring-yellow-400/50 rounded-lg p-4" : ""}`}
                  style={{ order: orders[index] }}
                  data-testid={`podium-${entry.rank}`}
                >
                  {/* Crown for 1st */}
                  {entry.rank === 1 && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-10">
                      <Crown className="w-8 h-8 text-yellow-400" />
                    </div>
                  )}

                  {/* Avatar */}
                  <Avatar className={`${isFirst ? "w-20 h-20" : "w-16 h-16"} border-2 ring-4 ${
                    badge === "gold" ? "border-yellow-500 ring-yellow-500/30" :
                    badge === "silver" ? "border-gray-400 ring-gray-400/20" :
                    "border-orange-500 ring-orange-500/20"
                  }`}>
                    <AvatarImage src={entry.post.user?.profilePicture || undefined} alt={entry.post.user?.username} />
                    <AvatarFallback className={isFirst ? "text-lg" : ""}>{entry.post.user?.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>

                  {/* Post Media - Clickable */}
                  {(entry.post.imageUrl || entry.post.mediaUrl) && (
                    entry.post.mediaType === "video" && entry.post.mediaUrl ? (
                      <div 
                        className="relative cursor-pointer"
                        onClick={() => setFullscreenPostId(entry.post.id)}
                        data-testid={`video-podium-${entry.rank}`}
                      >
                        <video
                          src={entry.post.mediaUrl}
                          className={`${isFirst ? "w-20 h-20" : "w-16 h-16"} rounded-lg object-cover`}
                          muted
                        />
                        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/30">
                          <Play className="w-4 h-4 text-white fill-white" />
                        </div>
                      </div>
                    ) : (
                      <img
                        src={entry.post.imageUrl || entry.post.mediaUrl || ""}
                        alt={entry.post.user?.username}
                        className={`${isFirst ? "w-20 h-20" : "w-16 h-16"} rounded-lg object-cover cursor-pointer`}
                        onClick={() => setFullscreenPostId(entry.post.id)}
                        data-testid={`img-podium-${entry.rank}`}
                      />
                    )
                  )}

                  {/* Rank Badge */}
                  <div className={`rank-badge-${badge} ${isFirst ? "w-14 h-14 text-2xl" : "w-12 h-12 text-lg"} rounded-full flex items-center justify-center font-bold border border-white/20`}>
                    {entry.rank}
                  </div>

                  {/* Username */}
                  <p className={`${isFirst ? "text-base font-bold" : "text-sm font-semibold"} text-gray-900 text-center line-clamp-1 max-w-[160px]`}>
                    {entry.post.user?.username}
                  </p>

                  {/* Host indicator */}
                  {entry.post.user?.id === rankingsData?.trendHostId && (
                    <Star className={`${isFirst ? "w-4 h-4" : "w-3 h-3"} fill-yellow-500 text-yellow-500`} data-testid="icon-host" />
                  )}

                  {/* Votes */}
                  <p className={`${isFirst ? "text-sm font-bold" : "text-xs font-bold"} ${
                    badge === "gold" ? "text-yellow-600" :
                    badge === "silver" ? "text-gray-600" :
                    "text-orange-600"
                  }`}>
                    {entry.post.votes || 0} votes
                  </p>

                  {/* Podium Base */}
                  <div
                    className={`w-full podium-base ${
                      badge === "gold" ? "rank-card-gold" :
                      badge === "silver" ? "rank-card-silver" :
                      "rank-card-bronze"
                    } ${isFirst ? "shadow-lg" : ""}`}
                    style={{ height: heights[index] }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Rankings List */}
        {restOfRankings.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider">More Rankings</h2>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Percentage shows votes relative to the #1 ranked post</p>
                </TooltipContent>
              </Tooltip>
            </div>
            {restOfRankings.map((entry) => (
              <div
                key={entry.post.id}
                className={`rank-item-card rounded-lg p-4 flex items-center gap-4 cursor-pointer group ${
                  entry.post.userId === currentUser?.id ? 'border-primary/50' : ''
                }`}
                onClick={() => setFullscreenPostId(entry.post.id)}
                data-testid={`ranking-item-${entry.rank}`}
              >
                {/* Rank Number */}
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gray-100 flex flex-col items-center justify-center group-hover:bg-gray-200 transition-colors">
                  <span className="text-lg font-bold text-gray-900">{entry.rank}</span>
                  <span className="text-xs text-gray-600">{getRankBadge(entry.rank)}</span>
                </div>

                {/* Media */}
                {(entry.post.imageUrl || entry.post.mediaUrl) && (
                  entry.post.mediaType === "video" && entry.post.mediaUrl ? (
                    <div className="relative flex-shrink-0">
                      <video
                        src={entry.post.mediaUrl}
                        className="w-20 h-20 rounded-lg object-cover"
                        muted
                        onClick={(e) => {
                          e.stopPropagation();
                          setFullscreenPostId(entry.post.id);
                        }}
                        data-testid={`video-rank-${entry.rank}`}
                      />
                      <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/20">
                        <Play className="w-4 h-4 text-white fill-white" />
                      </div>
                    </div>
                  ) : (
                    <img
                      src={entry.post.imageUrl || entry.post.mediaUrl || ""}
                      alt={entry.post.user?.username}
                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFullscreenPostId(entry.post.id);
                      }}
                      data-testid={`img-rank-${entry.rank}`}
                    />
                  )
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="w-6 h-6 flex-shrink-0">
                      <AvatarImage src={entry.post.user?.profilePicture || undefined} alt={entry.post.user?.username} />
                      <AvatarFallback className="text-xs">{entry.post.user?.username.slice(0, 1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <p className="text-sm font-bold text-gray-900 truncate">{entry.post.user?.username}</p>
                    {entry.post.user?.id === rankingsData?.trendHostId && (
                      <Star className="w-3 h-3 fill-yellow-500 text-yellow-500 flex-shrink-0" data-testid="icon-host" />
                    )}
                  </div>

                  <p className="text-xs text-gray-600 line-clamp-1 mb-2">
                    {entry.post.caption || "No caption"}
                  </p>

                  {/* Vote Progress */}
                  <div className="space-y-1">
                    <div className="vote-progress-bar">
                      <div
                        className="vote-progress-fill transition-all duration-500"
                        style={{ width: `${(((entry.post.votes || 0) / maxVotes) || 0) * 100}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-primary">{entry.post.votes || 0} votes</p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-xs text-muted-foreground cursor-help hover:text-foreground transition-colors">
                            {Math.round((((entry.post.votes || 0) / maxVotes) || 0) * 100)}%
                          </p>
                        </TooltipTrigger>
                        <TooltipContent side="left" align="end">
                          <p className="text-xs">Votes compared to #1</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>

                {/* Momentum Indicator */}
                {entry.rank <= 3 && (
                  <Flame className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {fullscreenPostId && rankingsData && (
        <PostFullscreenModal
          post={rankingsData.rankings.find((e) => e.post.id === fullscreenPostId)?.post!}
          isOpen={!!fullscreenPostId}
          onClose={() => setFullscreenPostId(null)}
          rank={rankingsData.rankings.find((e) => e.post.id === fullscreenPostId)?.rank}
          onVoteUp={(postId) => voteUpMutation.mutate(postId)}
          onVoteDown={(postId) => voteDownMutation.mutate(postId)}
          allPosts={rankingsData.rankings.map((e) => e.post)}
          onNextPost={() => {
            const currentIndex = rankingsData.rankings.findIndex((e) => e.post.id === fullscreenPostId);
            if (currentIndex < rankingsData.rankings.length - 1) {
              setFullscreenPostId(rankingsData.rankings[currentIndex + 1].post.id);
            }
          }}
          onPreviousPost={() => {
            const currentIndex = rankingsData.rankings.findIndex((e) => e.post.id === fullscreenPostId);
            if (currentIndex > 0) {
              setFullscreenPostId(rankingsData.rankings[currentIndex - 1].post.id);
            }
          }}
        />
      )}
    </div>
  );
}

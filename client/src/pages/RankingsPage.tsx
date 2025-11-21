import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, Trophy, Loader2, Star, Play, Crown, Flame, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import PostFullscreenModal from "@/components/PostFullscreenModal";
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

  const { data: rankingsData, isLoading } = useQuery<RankingsResponse>({
    queryKey: [`/api/rankings/${trendId}`],
    enabled: !!trendId,
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
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => window.history.back()}
            data-testid="button-back"
            className="text-muted-foreground hover:text-white"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div className="flex flex-col flex-1">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-bold text-white">{rankingsData.trendName}</h1>
            </div>
            <p className="text-xs text-muted-foreground font-medium">Hosted by <span className="text-foreground font-semibold">{rankingsData.trendHostUsername}</span></p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Your Entry */}
        {currentUserPost && (
          <div className="rank-item-card rounded-lg p-4 border-2 border-primary/50">
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
                  <div className="relative">
                    <video
                      src={currentUserPost.post.mediaUrl}
                      className="w-20 h-20 rounded-lg object-cover"
                      muted
                      data-testid="video-user-post"
                    />
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/30">
                      <Play className="w-4 h-4 text-white fill-white" />
                    </div>
                  </div>
                ) : (
                  <img
                    src={currentUserPost.post.imageUrl || currentUserPost.post.mediaUrl || ""}
                    alt={currentUserPost.post.user?.username}
                    className="w-20 h-20 rounded-lg object-cover"
                    data-testid="img-user-post"
                  />
                )
              )}

              <div className="flex-1 min-w-0">
                <p className="font-bold text-white">{currentUserPost.post.user?.username}</p>
                <p className="text-sm text-muted-foreground line-clamp-1">{currentUserPost.post.caption}</p>
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
              const heights = isFirst ? ["80px", "100px", "60px"] : ["60px", "80px", "50px"];
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

                  {/* Rank Badge */}
                  <div className={`rank-badge-${badge} ${isFirst ? "w-14 h-14 text-2xl" : "w-12 h-12 text-lg"} rounded-full flex items-center justify-center font-bold border border-white/20`}>
                    {entry.rank}
                  </div>

                  {/* Username */}
                  <p className={`${isFirst ? "text-base font-bold" : "text-sm font-semibold"} text-white text-center line-clamp-1 max-w-[160px]`}>
                    {entry.post.user?.username}
                  </p>

                  {/* Host indicator */}
                  {entry.post.user?.id === rankingsData?.trendHostId && (
                    <Star className={`${isFirst ? "w-4 h-4" : "w-3 h-3"} fill-yellow-500 text-yellow-500`} data-testid="icon-host" />
                  )}

                  {/* Votes */}
                  <p className={`${isFirst ? "text-sm font-bold" : "text-xs font-bold"} ${
                    badge === "gold" ? "text-yellow-300" :
                    badge === "silver" ? "text-gray-200" :
                    "text-orange-300"
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
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">More Rankings</h2>
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
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-white/5 flex flex-col items-center justify-center group-hover:bg-white/10 transition-colors">
                  <span className="text-lg font-bold text-white">{entry.rank}</span>
                  <span className="text-xs text-muted-foreground">{getRankBadge(entry.rank)}</span>
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
                    <p className="text-sm font-bold text-white truncate">{entry.post.user?.username}</p>
                    {entry.post.user?.id === rankingsData?.trendHostId && (
                      <Star className="w-3 h-3 fill-yellow-500 text-yellow-500 flex-shrink-0" data-testid="icon-host" />
                    )}
                  </div>

                  <p className="text-xs text-gray-300 line-clamp-1 mb-2">
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
                      <p className="text-xs text-muted-foreground">{Math.round((((entry.post.votes || 0) / maxVotes) || 0) * 100)}%</p>
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
        />
      )}
    </div>
  );
}

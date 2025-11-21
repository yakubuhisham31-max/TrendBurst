import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, Trophy, Loader2, Star, Play, Crown, TrendingUp, TrendingDown, Minus, X } from "lucide-react";
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
  const [filterTab, setFilterTab] = useState<"rankings" | "newest" | "votes" | "trending">("rankings");

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

  const getMomentumIndicator = (rank: number) => {
    // Simulated momentum - in production, calculate from recent vote changes
    if (rank <= 2) return { type: "rising" as const, label: "Rising" };
    if (rank >= 8) return { type: "dropping" as const, label: "Dropping" };
    return { type: "steady" as const, label: "Steady" };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
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

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--trendx-bg))" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 glass-effect border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-4">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => window.history.back()}
            data-testid="button-back"
            className="text-white hover:bg-white/10"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div className="flex flex-col flex-1">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5" style={{ color: "hsl(var(--trendx-accent))" }} />
              <h1 className="text-lg font-bold text-white">{rankingsData.trendName}</h1>
            </div>
            <p className="text-xs" style={{ color: "hsl(var(--trendx-subtext))" }}>
              Hosted by {rankingsData.trendHostUsername}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {["rankings", "newest", "votes", "trending"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab as any)}
              className={`px-4 py-2 rounded-full font-medium text-sm transition-all whitespace-nowrap ${
                filterTab === tab
                  ? "glow-accent text-white"
                  : "text-muted-foreground hover:text-white"
              }`}
              style={{
                background: filterTab === tab ? "hsl(var(--trendx-accent) / 0.2)" : "transparent",
                border: filterTab === tab ? "1px solid hsl(var(--trendx-accent) / 0.5)" : "1px solid transparent",
              }}
              data-testid={`filter-${tab}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Your Entry Card */}
        {currentUserPost && (
          <div className="glass-effect rounded-xl p-6 border border-white/10" style={{ borderColor: "hsl(var(--trendx-accent) / 0.4)" }}>
            <p className="text-xs font-semibold text-white mb-4 uppercase tracking-wider">Your Entry</p>
            <div className="flex items-center gap-4">
              {/* Rank Badge */}
              <div
                className="w-14 h-14 rounded-lg flex items-center justify-center font-bold text-white text-lg"
                style={{
                  background: currentUserPost.rank === 1 ? "hsl(var(--trendx-gold) / 0.3)" : "hsl(var(--trendx-accent) / 0.2)",
                  border: `2px solid hsl(${currentUserPost.rank === 1 ? "var(--trendx-gold)" : "var(--trendx-accent)"})`,
                }}
              >
                {currentUserPost.rank}
              </div>

              {/* Media Thumbnail */}
              {(currentUserPost.post.imageUrl || currentUserPost.post.mediaUrl) && (
                currentUserPost.post.mediaType === "video" && currentUserPost.post.mediaUrl ? (
                  <div className="relative w-24 h-24">
                    <video
                      src={currentUserPost.post.mediaUrl}
                      className="w-full h-full rounded-lg object-cover"
                      muted
                      data-testid="video-user-post"
                    />
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/20">
                      <Play className="w-6 h-6 text-white fill-white" />
                    </div>
                  </div>
                ) : (
                  <img
                    src={currentUserPost.post.imageUrl || currentUserPost.post.mediaUrl || ""}
                    alt={currentUserPost.post.user?.username}
                    className="w-24 h-24 rounded-lg object-cover"
                    data-testid="img-user-post"
                  />
                )
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white">{currentUserPost.post.user?.username}</p>
                <p className="text-sm line-clamp-2" style={{ color: "hsl(var(--trendx-subtext))" }}>
                  {currentUserPost.post.caption}
                </p>
                <p className="text-sm font-bold mt-2" style={{ color: "hsl(var(--trendx-accent))" }}>
                  {currentUserPost.post.votes} votes
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Top 3 Podium */}
        {topThree.length > 0 && (
          <div className="grid grid-cols-3 gap-4 items-end mb-4">
            {topThree.map((entry, index) => {
              const positions = [1, 0, 2]; // 1st in middle, 2nd on left, 3rd on right
              const heights = ["120px", "160px", "100px"];
              const colors = [
                { name: "gold", var: "var(--trendx-gold)" },
                { name: "silver", var: "var(--trendx-silver)" },
                { name: "bronze", var: "var(--trendx-bronze)" },
              ];
              const color = colors[index];

              return (
                <div
                  key={entry.post.id}
                  className="flex flex-col items-center gap-3 pop-animation"
                  style={{ order: positions[index] } as any}
                  data-testid={`podium-${entry.rank}`}
                >
                  {/* Crown for #1 */}
                  {entry.rank === 1 && (
                    <Crown className="w-6 h-6" style={{ color: "hsl(var(--trendx-gold))" }} />
                  )}

                  {/* Avatar */}
                  <Avatar className="w-16 h-16 border-2" style={{ borderColor: `hsl(${color.var})` }}>
                    <AvatarImage src={entry.post.user?.profilePicture || undefined} alt={entry.post.user?.username} />
                    <AvatarFallback>{entry.post.user?.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>

                  {/* Rank */}
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg border-2"
                    style={{
                      background: `hsl(${color.var} / 0.2)`,
                      borderColor: `hsl(${color.var})`,
                    }}
                  >
                    {entry.rank}
                  </div>

                  {/* Username */}
                  <p className="text-sm font-semibold text-white text-center line-clamp-1">
                    {entry.post.user?.username}
                  </p>

                  {/* Votes */}
                  <p className="text-xs font-bold" style={{ color: `hsl(${color.var})` }}>
                    {entry.post.votes} votes
                  </p>

                  {/* Bar */}
                  <div
                    className="w-full rounded-t-lg"
                    style={{
                      height: heights[index],
                      background: `linear-gradient(180deg, hsl(${color.var} / 0.3), hsl(${color.var} / 0.1))`,
                      border: `1px solid hsl(${color.var} / 0.3)`,
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Ranking List */}
        {restOfRankings.length > 0 && (
          <div className="space-y-3">
            {restOfRankings.map((entry) => {
              const momentum = getMomentumIndicator(entry.rank);
              const maxVotes = Math.max(...rankingsData.rankings.map(e => e.post.votes));
              const votePercentage = (entry.post.votes / maxVotes) * 100;

              return (
                <div
                  key={entry.post.id}
                  className="group glass-effect rounded-lg p-4 cursor-pointer transition-all duration-300 hover:border-white/20 hover:shadow-lg"
                  style={{ borderColor: "rgba(255, 255, 255, 0.05)" }}
                  onClick={() => setFullscreenPostId(entry.post.id)}
                  data-testid={`ranking-item-${entry.rank}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Rank Number - Left Aligned */}
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-white">{entry.rank}</span>
                      <span className="text-xs" style={{ color: "hsl(var(--trendx-subtext))" }}>
                        {getRankBadge(entry.rank)}
                      </span>
                    </div>

                    {/* Media Thumbnail */}
                    {(entry.post.imageUrl || entry.post.mediaUrl) && (
                      entry.post.mediaType === "video" && entry.post.mediaUrl ? (
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                          <video
                            src={entry.post.mediaUrl}
                            className="w-full h-full object-cover"
                            muted
                            onClick={(e) => {
                              e.stopPropagation();
                              setFullscreenPostId(entry.post.id);
                            }}
                            data-testid={`video-rank-${entry.rank}`}
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <Play className="w-5 h-5 text-white fill-white" />
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
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={entry.post.user?.profilePicture || undefined} alt={entry.post.user?.username} />
                          <AvatarFallback className="text-xs">{entry.post.user?.username.slice(0, 1).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-white text-sm">{entry.post.user?.username}</span>
                        {entry.post.user?.id === rankingsData?.trendHostId && (
                          <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" data-testid="icon-host" />
                        )}

                        {/* Momentum Indicator */}
                        <div className="ml-auto flex items-center gap-1">
                          {momentum.type === "rising" && (
                            <div className="flex items-center gap-0.5 text-xs" style={{ color: "hsl(var(--trendx-rising))" }}>
                              <TrendingUp className="w-3 h-3" />
                              <span>{momentum.label}</span>
                            </div>
                          )}
                          {momentum.type === "dropping" && (
                            <div className="flex items-center gap-0.5 text-xs" style={{ color: "hsl(var(--trendx-dropping))" }}>
                              <TrendingDown className="w-3 h-3" />
                              <span>{momentum.label}</span>
                            </div>
                          )}
                          {momentum.type === "steady" && (
                            <div className="flex items-center gap-0.5 text-xs" style={{ color: "hsl(var(--trendx-subtext))" }}>
                              <Minus className="w-3 h-3" />
                              <span>{momentum.label}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Caption */}
                      <p className="text-sm line-clamp-1 mb-3" style={{ color: "hsl(var(--trendx-subtext))" }}>
                        {entry.post.caption}
                      </p>

                      {/* Vote Bar */}
                      <div className="space-y-1">
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="vote-bar-glow rounded-full transition-all duration-500"
                            style={{ width: `${votePercentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-xs font-bold" style={{ color: "hsl(var(--trendx-accent))" }}>
                            {entry.post.votes} votes
                          </p>
                          <p className="text-xs" style={{ color: "hsl(var(--trendx-subtext))" }}>
                            {Math.round(votePercentage)}% of max
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Fullscreen Modal */}
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

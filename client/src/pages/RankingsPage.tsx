import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Trophy, Loader2, Star } from "lucide-react";
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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-4">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => window.history.back()}
            data-testid="button-back"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-semibold">{rankingsData.trendName}</h1>
            </div>
            <p className="text-xs text-muted-foreground">
              Hosted by {rankingsData.trendHostUsername}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {currentUserPost && (
          <Card className="p-4 border-2 border-primary bg-primary/5">
            <p className="text-xs font-medium text-muted-foreground mb-3">Your Entry</p>
            <div className="flex items-center gap-4">
              <Badge
                className="w-12 h-12 rounded-full flex items-center justify-center font-bold bg-gradient-to-br from-primary to-chart-2 text-primary-foreground"
                data-testid="badge-user-rank"
              >
                {getRankBadge(currentUserPost.rank)}
              </Badge>
              {(currentUserPost.post.imageUrl || currentUserPost.post.mediaUrl) && (
                currentUserPost.post.mediaType === "video" && currentUserPost.post.mediaUrl ? (
                  <video
                    src={currentUserPost.post.mediaUrl}
                    className="w-20 h-20 rounded-lg object-cover"
                    muted
                    data-testid="video-user-post"
                  />
                ) : (
                  <img
                    src={currentUserPost.post.imageUrl || currentUserPost.post.mediaUrl || ""}
                    alt={currentUserPost.post.user?.username}
                    className="w-20 h-20 rounded-lg object-cover"
                    data-testid="img-user-post"
                  />
                )
              )}
              <div className="flex-1">
                <p className="font-medium">{currentUserPost.post.user?.username}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">{currentUserPost.post.caption}</p>
                <p className="text-sm font-bold text-primary mt-1">{currentUserPost.post.votes} votes</p>
              </div>
            </div>
          </Card>
        )}
        
        {topThree.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {topThree.map((entry, index) => {
              const heights = ["h-32", "h-40", "h-28"];
              const orders = [1, 0, 2];
              
              return (
                <div
                  key={entry.post.id}
                  className="flex flex-col items-center gap-2"
                  style={{ order: orders[index] }}
                  data-testid={`podium-${entry.rank}`}
                >
                  <Avatar className="w-16 h-16 ring-4 ring-primary/20">
                    <AvatarImage src={entry.post.user?.profilePicture || undefined} alt={entry.post.user?.username} />
                    <AvatarFallback>
                      {entry.post.user?.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Badge className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    entry.rank === 1 ? "bg-gradient-to-br from-yellow-400 to-yellow-600" :
                    entry.rank === 2 ? "bg-gradient-to-br from-gray-300 to-gray-500" :
                    "bg-gradient-to-br from-orange-400 to-orange-600"
                  } text-white font-bold`}>
                    {entry.rank}
                  </Badge>
                  <div className="flex items-center gap-1 justify-center">
                    <p className="text-xs font-medium text-center">{entry.post.user?.username}</p>
                    {entry.post.user?.id === rankingsData?.trendHostId && (
                      <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" data-testid="icon-host" />
                    )}
                  </div>
                  <p className="text-sm font-bold text-primary">{entry.post.votes} votes</p>
                  <div className={`w-full ${heights[index]} bg-gradient-to-t ${
                    entry.rank === 1 ? "from-primary/30 to-primary/10" :
                    entry.rank === 2 ? "from-chart-2/30 to-chart-2/10" :
                    "from-chart-4/30 to-chart-4/10"
                  } rounded-t-lg`} />
                </div>
              );
            })}
          </div>
        )}

        {restOfRankings.length > 0 && (
          <div className="space-y-2">
            {restOfRankings.map((entry) => (
              <Card
                key={entry.post.id}
                className={`p-4 flex items-center gap-4 cursor-pointer hover-elevate ${
                  entry.post.userId === currentUser?.id ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => setFullscreenPostId(entry.post.id)}
                data-testid={`ranking-item-${entry.rank}`}
              >
                <Badge
                  variant="secondary"
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                >
                  {getRankBadge(entry.rank)}
                </Badge>
                {(entry.post.imageUrl || entry.post.mediaUrl) && (
                  entry.post.mediaType === "video" && entry.post.mediaUrl ? (
                    <video
                      src={entry.post.mediaUrl}
                      className="w-16 h-16 rounded-lg object-cover cursor-pointer"
                      muted
                      onClick={(e) => {
                        e.stopPropagation();
                        setFullscreenPostId(entry.post.id);
                      }}
                      data-testid={`video-rank-${entry.rank}`}
                    />
                  ) : (
                    <img
                      src={entry.post.imageUrl || entry.post.mediaUrl || ""}
                      alt={entry.post.user?.username}
                      className="w-16 h-16 rounded-lg object-cover cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFullscreenPostId(entry.post.id);
                      }}
                      data-testid={`img-rank-${entry.rank}`}
                    />
                  )
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-1">
                    <p className="font-medium" data-testid="text-username">
                      {entry.post.user?.username}
                    </p>
                    {entry.post.user?.id === rankingsData?.trendHostId && (
                      <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" data-testid="icon-host" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {entry.post.caption}
                  </p>
                  <p className="text-sm font-bold text-primary">
                    {entry.post.votes} votes
                  </p>
                </div>
              </Card>
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

import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, Users, Award, Activity, Loader2, Eye, MessageSquare, ThumbsUp, BarChart3, Edit, Play, Pause } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { Trend } from "@shared/schema";
import { useState } from "react";
import { differenceInDays } from "date-fns";

interface DashboardStats {
  trendsCreated: number;
  totalParticipants: number;
  totalPosts: number;
  activeTrends: number;
  trendxPoints: number;
}

interface TrendAnalytics {
  trendId: string;
  trendName: string;
  category: string;
  views: number;
  participants: number;
  totalPosts: number;
  totalVotes: number;
  chatMessages: number;
  engagementRate: string;
  topPosts: Array<{
    rank: number;
    username: string;
    votes: number;
    imageUrl?: string;
    mediaUrl?: string;
    mediaType?: string;
  }>;
  isActive: boolean;
  createdAt: string;
  endDate: string | null;
}

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [selectedTrendId, setSelectedTrendId] = useState<string | null>(null);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    enabled: !!user,
  });

  const { data: recentTrends, isLoading: trendsLoading } = useQuery<Trend[]>({
    queryKey: ["/api/trends/user", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const res = await fetch(`/api/trends/user/${user?.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch trends");
      const data = await res.json();
      return data.map((trend: any) => ({
        ...trend,
        createdAt: new Date(trend.createdAt),
        endDate: trend.endDate ? new Date(trend.endDate) : null,
      }));
    },
  });

  const { data: trendAnalytics, isLoading: analyticsLoading } = useQuery<TrendAnalytics>({
    queryKey: ["/api/dashboard/trends", selectedTrendId, "analytics"],
    enabled: !!selectedTrendId,
  });

  const getTrendStatus = (endDate: Date | null | undefined): "active" | "ending-soon" | "ended" => {
    if (!endDate) return "active";
    const now = new Date();
    const daysUntilEnd = differenceInDays(endDate, now);
    
    if (endDate < now) return "ended";
    if (daysUntilEnd <= 3) return "ending-soon";
    return "active";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold">Dashboard</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Your Performance</h2>
          <p className="text-muted-foreground">Track your trends and engagement</p>
        </div>

        {statsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              <Card data-testid="card-trends-created" className="hover-elevate transition-all">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Trends Created</CardTitle>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.trendsCreated}</div>
                  <p className="text-xs text-muted-foreground mt-1">Total trends you've started</p>
                </CardContent>
              </Card>

              <Card data-testid="card-participants" className="hover-elevate transition-all">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
                  <div className="w-10 h-10 rounded-full bg-chart-2/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-chart-2" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalParticipants}</div>
                  <p className="text-xs text-muted-foreground mt-1">Across all your trends</p>
                </CardContent>
              </Card>

              <Card data-testid="card-posts" className="hover-elevate transition-all">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                  <div className="w-10 h-10 rounded-full bg-chart-4/10 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-chart-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalPosts}</div>
                  <p className="text-xs text-muted-foreground mt-1">Posts in your trends</p>
                </CardContent>
              </Card>

              <Card data-testid="card-active-trends" className="hover-elevate transition-all">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Trends</CardTitle>
                  <div className="w-10 h-10 rounded-full bg-chart-5/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-chart-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.activeTrends}</div>
                  <p className="text-xs text-muted-foreground mt-1">Currently running</p>
                </CardContent>
              </Card>

              <Card data-testid="card-trendx-points" className="hover-elevate transition-all border-2 border-primary bg-primary/5">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">TrendX Points</CardTitle>
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{stats.trendxPoints}</div>
                  <p className="text-xs text-muted-foreground mt-1">Your total points</p>
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}

        <div>
          <h2 className="text-xl font-bold mb-4">Your Trends Analytics</h2>
          {trendsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : recentTrends && recentTrends.length > 0 ? (
            <div className="space-y-6">
              {recentTrends.map((trend) => (
                <Card
                  key={trend.id}
                  className="overflow-hidden"
                  data-testid={`trend-${trend.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{trend.name}</h3>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            <span>{trend.category}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const status = getTrendStatus(trend.endDate);
                          if (status === "active") {
                            return (
                              <Badge className="bg-primary/10 text-primary px-3 py-1 rounded-full border-0" data-testid={`badge-status-${trend.id}`}>
                                Active
                              </Badge>
                            );
                          } else if (status === "ending-soon") {
                            return (
                              <Badge className="bg-yellow-500 text-yellow-950 px-3 py-1 rounded-full border-0" data-testid={`badge-status-${trend.id}`}>
                                Ending Soon
                              </Badge>
                            );
                          } else {
                            return (
                              <Badge className="bg-red-500 text-white px-3 py-1 rounded-full border-0" data-testid={`badge-status-${trend.id}`}>
                                Ended
                              </Badge>
                            );
                          }
                        })()}
                        <Button
                          size="sm"
                          variant={selectedTrendId === trend.id ? "default" : "outline"}
                          onClick={() => setSelectedTrendId(selectedTrendId === trend.id ? null : trend.id)}
                          data-testid={`button-analytics-${trend.id}`}
                        >
                          <BarChart3 className="w-4 h-4 mr-2" />
                          {selectedTrendId === trend.id ? "Hide" : "Analytics"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setLocation(`/edit-trend/${trend.id}`)}
                          data-testid={`button-edit-trend-${trend.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {selectedTrendId === trend.id && (
                      analyticsLoading ? (
                        <div className="flex items-center justify-center py-8 border-t mt-4 pt-4">
                          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : trendAnalytics ? (
                        <div className="border-t mt-4 pt-4 space-y-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Eye className="w-4 h-4" />
                                <span>Views</span>
                              </div>
                              <p className="text-2xl font-bold">{trendAnalytics.views}</p>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Users className="w-4 h-4" />
                                <span>Participants</span>
                              </div>
                              <p className="text-2xl font-bold">{trendAnalytics.participants}</p>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Activity className="w-4 h-4" />
                                <span>Posts</span>
                              </div>
                              <p className="text-2xl font-bold">{trendAnalytics.totalPosts}</p>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <ThumbsUp className="w-4 h-4" />
                                <span>Total Votes</span>
                              </div>
                              <p className="text-2xl font-bold">{trendAnalytics.totalVotes}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MessageSquare className="w-4 h-4" />
                                <span>Chat Messages</span>
                              </div>
                              <p className="text-2xl font-bold">{trendAnalytics.chatMessages}</p>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <TrendingUp className="w-4 h-4" />
                                <span>Engagement Rate</span>
                              </div>
                              <p className="text-2xl font-bold">{trendAnalytics.engagementRate}</p>
                              <p className="text-xs text-muted-foreground">votes per participant</p>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Users className="w-4 h-4" />
                                <span>Participation Rate</span>
                              </div>
                              <p className="text-2xl font-bold">
                                {trendAnalytics.views > 0 
                                  ? `${((trendAnalytics.participants / trendAnalytics.views) * 100).toFixed(1)}%`
                                  : '0%'}
                              </p>
                              <p className="text-xs text-muted-foreground">participants / views</p>
                            </div>
                          </div>

                          {trendAnalytics.topPosts.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-3">Top Performing Posts</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {trendAnalytics.topPosts.map((post) => {
                                  const mediaUrl = post.mediaUrl || post.imageUrl || "";
                                  const mediaType = post.mediaType || "image";
                                  const videoId = `video-${trendAnalytics.trendId}-${post.rank}`;
                                  const isPlaying = playingVideoId === videoId;
                                  
                                  return (
                                    <div key={post.rank} className="bg-muted rounded-lg p-3 space-y-2">
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-muted-foreground">
                                          #{post.rank}
                                        </span>
                                        <div className="flex items-center gap-1 text-sm font-medium">
                                          <ThumbsUp className="w-3 h-3" />
                                          <span>{post.votes}</span>
                                        </div>
                                      </div>
                                      
                                      <div className="relative w-full aspect-square rounded overflow-hidden bg-black">
                                        {mediaType === "video" ? (
                                          <>
                                            <video
                                              id={videoId}
                                              src={mediaUrl}
                                              className="w-full h-full object-cover"
                                              onPlay={() => setPlayingVideoId(videoId)}
                                              onPause={() => setPlayingVideoId(null)}
                                            />
                                            <button
                                              onClick={(e) => {
                                                e.preventDefault();
                                                const video = document.getElementById(videoId) as HTMLVideoElement;
                                                if (video) {
                                                  if (isPlaying) {
                                                    video.pause();
                                                  } else {
                                                    video.play();
                                                  }
                                                }
                                              }}
                                              className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-colors"
                                              data-testid={`button-play-video-${post.rank}`}
                                            >
                                              {isPlaying ? (
                                                <Pause className="w-8 h-8 text-white" />
                                              ) : (
                                                <Play className="w-8 h-8 text-white" />
                                              )}
                                            </button>
                                          </>
                                        ) : (
                                          <img
                                            src={mediaUrl}
                                            alt={`Top post by ${post.username}`}
                                            className="w-full h-full object-cover"
                                          />
                                        )}
                                      </div>
                                      
                                      <p className="text-sm font-medium">@{post.username}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : null
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">You haven't created any trends yet.</p>
                <Button 
                  className="mt-4" 
                  onClick={() => setLocation("/")}
                  data-testid="button-create-trend"
                >
                  Create Your First Trend
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, TrendingUp, Users, Award, Activity, Loader2, BarChart3, Edit } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
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


export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Trends Created</CardTitle>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Skeleton className="h-5 w-5 rounded" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-3 w-32 mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
                <div className="w-10 h-10 rounded-full bg-chart-2/10 flex items-center justify-center">
                  <Skeleton className="h-5 w-5 rounded" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-3 w-32 mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                <div className="w-10 h-10 rounded-full bg-chart-4/10 flex items-center justify-center">
                  <Skeleton className="h-5 w-5 rounded" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-3 w-32 mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Trends</CardTitle>
                <div className="w-10 h-10 rounded-full bg-chart-5/10 flex items-center justify-center">
                  <Skeleton className="h-5 w-5 rounded" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-3 w-32 mt-2" />
              </CardContent>
            </Card>
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
                          variant="outline"
                          onClick={() => setLocation(`/analytics/${trend.id}`)}
                          data-testid={`button-analytics-${trend.id}`}
                        >
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Analytics
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

import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, Users, Award, Activity } from "lucide-react";

export default function DashboardPage() {
  const [, setLocation] = useLocation();

  const stats = {
    trendsCreated: 12,
    totalParticipants: 456,
    averageJoinRate: "78%",
    totalPosts: 289,
    activeTrends: 5,
    trendxPoints: 1250,
  };

  const recentTrends = [
    { id: "1", name: "Best AI Tools of 2025", participants: 89, joinRate: "82%", status: "active" },
    { id: "2", name: "Epic Gaming Moments", participants: 234, joinRate: "91%", status: "active" },
    { id: "3", name: "Digital Art Showcase", participants: 45, joinRate: "65%", status: "ended" },
  ];

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

          <Card data-testid="card-join-rate" className="hover-elevate transition-all">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Join Rate</CardTitle>
              <div className="w-10 h-10 rounded-full bg-chart-3/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-chart-3" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.averageJoinRate}</div>
              <p className="text-xs text-muted-foreground mt-1">User engagement rate</p>
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

        <div>
          <h2 className="text-xl font-bold mb-4">Your Recent Trends</h2>
          <div className="space-y-3">
            {recentTrends.map((trend) => (
              <Card
                key={trend.id}
                className="hover-elevate cursor-pointer transition-all"
                onClick={() => setLocation(`/feed/${trend.id}`)}
                data-testid={`trend-${trend.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{trend.name}</h3>
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{trend.participants} participants</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          <span>Join rate: {trend.joinRate}</span>
                        </div>
                      </div>
                    </div>
                    <div
                      className={`px-4 py-2 rounded-full text-sm font-medium ${
                        trend.status === "active"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {trend.status}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card data-testid="card-trends-created">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trends Created</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.trendsCreated}</div>
              <p className="text-xs text-muted-foreground">Total trends you've started</p>
            </CardContent>
          </Card>

          <Card data-testid="card-participants">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalParticipants}</div>
              <p className="text-xs text-muted-foreground">Across all your trends</p>
            </CardContent>
          </Card>

          <Card data-testid="card-join-rate">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Join Rate</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageJoinRate}</div>
              <p className="text-xs text-muted-foreground">User engagement rate</p>
            </CardContent>
          </Card>

          <Card data-testid="card-posts">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPosts}</div>
              <p className="text-xs text-muted-foreground">Posts in your trends</p>
            </CardContent>
          </Card>

          <Card data-testid="card-active-trends">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Trends</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeTrends}</div>
              <p className="text-xs text-muted-foreground">Currently running</p>
            </CardContent>
          </Card>

          <Card data-testid="card-trendx-points">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">TrendX Points</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.trendxPoints}</div>
              <p className="text-xs text-muted-foreground">Your total points</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Recent Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTrends.map((trend) => (
                <div
                  key={trend.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover-elevate cursor-pointer"
                  onClick={() => setLocation(`/feed/${trend.id}`)}
                  data-testid={`trend-${trend.id}`}
                >
                  <div className="flex-1">
                    <h3 className="font-medium">{trend.name}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>{trend.participants} participants</span>
                      <span>Join rate: {trend.joinRate}</span>
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      trend.status === "active"
                        ? "bg-green-500/20 text-green-700 dark:text-green-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {trend.status}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

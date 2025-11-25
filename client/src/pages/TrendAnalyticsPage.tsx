import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, TrendingUp, Users, MessageSquare, Flame, Target } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import type { Trend, User } from "@shared/schema";

type TrendWithCreator = Trend & { creator: User | null };

interface TrendAnalytics {
  totalPosts: number;
  totalVotes: number;
  totalComments: number;
  uniqueParticipants: number;
  averageVotesPerPost: number;
  topPosts: Array<{ id: string; caption: string; votes: number; username: string }>;
  engagementRate: number;
}

export default function TrendAnalyticsPage() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const trendId = params.id;
  const { user } = useAuth();

  // Fetch trend
  const { data: trend, isLoading: trendLoading } = useQuery<TrendWithCreator>({
    queryKey: ["/api/trends", trendId],
    enabled: !!trendId,
  });

  // Fetch analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery<TrendAnalytics>({
    queryKey: ["/api/trends", trendId, "analytics"],
    enabled: !!trendId && user?.id === trend?.userId,
  });

  // Prepare data for visualizations
  const topPostsData = analytics?.topPosts || [];

  // Create pie chart data for engagement breakdown
  const engagementData = analytics ? [
    { name: "Votes", value: analytics.totalVotes },
    { name: "Comments", value: analytics.totalComments },
  ] : [];

  const COLORS = ["#06B6D4", "#0891B2"];

  if (!user || user.id !== trend?.userId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background p-4">
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground">Only the trend creator can view analytics.</p>
        <Button onClick={() => setLocation("/")} variant="outline">
          Go Back Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setLocation(`/profile`)}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold flex-1">Analytics</h1>
          <div className="text-sm text-muted-foreground">
            {trend?.name}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Total Posts</p>
                {analyticsLoading ? (
                  <Skeleton className="w-12 h-8" />
                ) : (
                  <p className="text-2xl font-bold">{analytics?.totalPosts || 0}</p>
                )}
              </div>
              <Flame className="w-5 h-5 text-orange-500 opacity-60" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Total Votes</p>
                {analyticsLoading ? (
                  <Skeleton className="w-12 h-8" />
                ) : (
                  <p className="text-2xl font-bold">{analytics?.totalVotes || 0}</p>
                )}
              </div>
              <TrendingUp className="w-5 h-5 text-green-500 opacity-60" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Participants</p>
                {analyticsLoading ? (
                  <Skeleton className="w-12 h-8" />
                ) : (
                  <p className="text-2xl font-bold">{analytics?.uniqueParticipants || 0}</p>
                )}
              </div>
              <Users className="w-5 h-5 text-blue-500 opacity-60" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Engagement</p>
                {analyticsLoading ? (
                  <Skeleton className="w-12 h-8" />
                ) : (
                  <p className="text-2xl font-bold">{analytics?.engagementRate.toFixed(1) || 0}%</p>
                )}
              </div>
              <Target className="w-5 h-5 text-purple-500 opacity-60" />
            </div>
          </Card>
        </div>

        {/* Detailed Metrics */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Average Votes & Comments */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Performance Metrics
            </h3>
            {analyticsLoading ? (
              <Skeleton className="w-full h-40" />
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Avg Votes per Post</span>
                  <span className="font-bold text-lg">{analytics?.averageVotesPerPost.toFixed(1) || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Total Comments</span>
                  <span className="font-bold text-lg">{analytics?.totalComments || 0}</span>
                </div>
              </div>
            )}
          </Card>

          {/* Engagement Breakdown */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Engagement Breakdown</h3>
            {analyticsLoading ? (
              <Skeleton className="w-full h-40" />
            ) : engagementData.length > 0 ? (
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={engagementData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={50}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {engagementData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No engagement data available</p>
            )}
          </Card>
        </div>

        {/* Top Posts */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Top Posts
          </h3>
          {analyticsLoading ? (
            <div className="space-y-3">
              <Skeleton className="w-full h-12" />
              <Skeleton className="w-full h-12" />
              <Skeleton className="w-full h-12" />
            </div>
          ) : topPostsData.length > 0 ? (
            <div className="space-y-2">
              {topPostsData.map((post, index) => (
                <div key={post.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      #{index + 1} • {post.username}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {post.caption || "(No caption)"}
                    </p>
                  </div>
                  <div className="ml-4 text-right flex-shrink-0">
                    <p className="font-bold text-lg">{post.votes}</p>
                    <p className="text-xs text-muted-foreground">votes</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No posts yet</p>
          )}
        </Card>

        {/* Chart: Votes Distribution */}
        {topPostsData.length > 0 && (
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Votes Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topPostsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="username"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="votes" fill="#06B6D4" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>
    </div>
  );
}

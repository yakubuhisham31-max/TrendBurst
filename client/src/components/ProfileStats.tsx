import { Award } from "lucide-react";

interface ProfileStatsProps {
  followers: number;
  following: number;
  trendsCreated: number;
  posts: number;
  trendxPoints?: number;
}

export default function ProfileStats({
  followers,
  following,
  trendsCreated,
  posts,
  trendxPoints = 0,
}: ProfileStatsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4 py-4 border-y">
        <div className="text-center">
          <p className="text-2xl font-bold" data-testid="stat-followers">
            {followers}
          </p>
          <p className="text-sm text-muted-foreground">Followers</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold" data-testid="stat-following">
            {following}
          </p>
          <p className="text-sm text-muted-foreground">Following</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold" data-testid="stat-trends">
            {trendsCreated}
          </p>
          <p className="text-sm text-muted-foreground">Trends</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold" data-testid="stat-posts">
            {posts}
          </p>
          <p className="text-sm text-muted-foreground">Posts</p>
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-primary/10 to-chart-2/10 rounded-lg border">
        <Award className="w-5 h-5 text-primary" />
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold" data-testid="stat-trendx-points">
            {trendxPoints}
          </span>
          <span className="text-sm font-medium text-muted-foreground">TrendX Points</span>
        </div>
      </div>
    </div>
  );
}

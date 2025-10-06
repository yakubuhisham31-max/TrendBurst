interface ProfileStatsProps {
  followers: number;
  following: number;
  trendsCreated: number;
  posts: number;
}

export default function ProfileStats({
  followers,
  following,
  trendsCreated,
  posts,
}: ProfileStatsProps) {
  return (
    <div className="grid grid-cols-4 gap-4 py-4 border-b">
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
  );
}

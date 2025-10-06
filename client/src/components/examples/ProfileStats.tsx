import ProfileStats from '../ProfileStats';

export default function ProfileStatsExample() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <ProfileStats
        followers={1234}
        following={567}
        trendsCreated={23}
        posts={156}
      />
    </div>
  );
}

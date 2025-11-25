import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Edit, Share2, Bookmark, BarChart3 } from "lucide-react";
import { SiInstagram, SiTiktok, SiX, SiYoutube } from "react-icons/si";
import { Skeleton } from "@/components/ui/skeleton";
import ProfileStats from "@/components/ProfileStats";
import TrendCard from "@/components/TrendCard";
import FollowButton from "@/components/FollowButton";
import VerificationBadge from "@/components/VerificationBadge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { User, Trend } from "@shared/schema";

export default function ProfilePage() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const [activeTab, setActiveTab] = useState("trends");
  const [savedSubTab, setSavedSubTab] = useState("trends");
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  // Get username from URL params or use current user
  const viewingUsername = params.username || currentUser?.username;
  const isOwnProfile = !params.username || params.username === currentUser?.username;

  const handleBackClick = () => {
    if (isOwnProfile) {
      setLocation("/");
    } else {
      window.history.back();
    }
  };

  const handleShareProfile = () => {
    if (!viewingUsername) return;
    
    const profileUrl = `${window.location.origin}/profile/${viewingUsername}`;
    navigator.clipboard.writeText(profileUrl).then(() => {
      toast({
        title: "Copied to clipboard",
        description: "Profile link copied successfully.",
      });
    }).catch(() => {
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard.",
        variant: "destructive",
      });
    });
  };

  // Fetch user data
  const { data: profileUser, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/users", viewingUsername],
    enabled: !!viewingUsername,
  });

  // Fetch user's trends
  const { data: trends = [], isLoading: trendsLoading } = useQuery<Trend[]>({
    queryKey: ["/api/trends/user", profileUser?.id],
    enabled: !!profileUser?.id,
  });

  // Fetch user's posts
  const { data: posts = [], isLoading: postsLoading } = useQuery<any[]>({
    queryKey: ["/api/posts/user", profileUser?.id],
    enabled: !!profileUser?.id,
  });

  // Fetch saved trends (only for own profile)
  const { data: savedTrends = [], isLoading: savedTrendsLoading } = useQuery<Trend[]>({
    queryKey: ["/api/saved/trends"],
    enabled: !!currentUser && isOwnProfile,
  });

  // Fetch saved posts (only for own profile)
  const { data: savedPosts = [], isLoading: savedPostsLoading } = useQuery<any[]>({
    queryKey: ["/api/saved/posts"],
    enabled: !!currentUser && isOwnProfile,
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleBackClick}
            data-testid="button-back"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-lg font-semibold">Profile</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        {userLoading ? (
          <div className="space-y-4">
            <div className="h-32 md:h-48 bg-gradient-to-br from-primary to-chart-2" />
            <div className="px-4 pb-4">
              <Skeleton className="w-24 h-24 md:w-32 md:h-32 rounded-full -mt-16 mb-4" />
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ) : !profileUser ? (
          <div className="text-center py-12 text-muted-foreground">
            User not found
          </div>
        ) : (
          <div className="relative">
            <div className="h-32 md:h-48 bg-gradient-to-br from-primary to-chart-2" />
            <div className="px-4 pb-4">
              <div className="relative -mt-16 mb-4">
                <Avatar className="w-24 h-24 md:w-32 md:h-32 ring-4 ring-background" data-testid="avatar-profile">
                  <AvatarImage src={profileUser.profilePicture || undefined} alt={profileUser.username} />
                  <AvatarFallback className="text-2xl">
                    {profileUser.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2" data-testid="text-username">
                    {profileUser.username}
                    <VerificationBadge verified={profileUser.verified} size="lg" />
                  </h2>
                  {profileUser.bio && (
                    <p className="text-muted-foreground mt-1" data-testid="text-bio">
                      {profileUser.bio}
                    </p>
                  )}
                  
                  {(profileUser.instagramUrl || profileUser.tiktokUrl || 
                    profileUser.twitterUrl || profileUser.youtubeUrl) && (
                    <div className="flex items-center gap-3 mt-3">
                      {profileUser.instagramUrl && (
                        <a 
                          href={profileUser.instagramUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          data-testid="link-instagram"
                        >
                          <SiInstagram className="w-5 h-5" />
                        </a>
                      )}
                      {profileUser.tiktokUrl && (
                        <a 
                          href={profileUser.tiktokUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          data-testid="link-tiktok"
                        >
                          <SiTiktok className="w-5 h-5" />
                        </a>
                      )}
                      {profileUser.twitterUrl && (
                        <a 
                          href={profileUser.twitterUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          data-testid="link-twitter"
                        >
                          <SiX className="w-5 h-5" />
                        </a>
                      )}
                      {profileUser.youtubeUrl && (
                        <a 
                          href={profileUser.youtubeUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          data-testid="link-youtube"
                        >
                          <SiYoutube className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {isOwnProfile ? (
                    <>
                      <Button 
                        className="flex-1 gap-2" 
                        onClick={() => setLocation("/edit-profile")}
                        data-testid="button-edit-profile"
                      >
                        <Edit className="w-4 h-4" />
                        Edit Profile
                      </Button>
                      <Button variant="outline" className="flex-1 gap-2" onClick={handleShareProfile} data-testid="button-share-profile">
                        <Share2 className="w-4 h-4" />
                        Share Profile
                      </Button>
                    </>
                  ) : (
                    <>
                      <FollowButton username={viewingUsername!} className="flex-1" />
                      <Button variant="outline" className="flex-1 gap-2" onClick={handleShareProfile} data-testid="button-share-profile">
                        <Share2 className="w-4 h-4" />
                        Share Profile
                      </Button>
                    </>
                  )}
                </div>

                <ProfileStats
                  followers={profileUser.followers || 0}
                  following={profileUser.following || 0}
                  trendsCreated={trends.length}
                  posts={posts.length}
                  trendxPoints={profileUser.trendxPoints || 0}
                />

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="w-full">
                    <TabsTrigger value="trends" className="flex-1" data-testid="tab-trends">
                      Trends Created
                    </TabsTrigger>
                    <TabsTrigger value="posts" className="flex-1" data-testid="tab-posts">
                      Posts
                    </TabsTrigger>
                    {isOwnProfile && (
                      <TabsTrigger value="saved" className="flex-1" data-testid="tab-saved">
                        Saved
                      </TabsTrigger>
                    )}
                  </TabsList>

                  <TabsContent value="trends" className="mt-6">
                    {trendsLoading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Skeleton className="h-64" />
                        <Skeleton className="h-64" />
                      </div>
                    ) : trends.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        No trends created yet
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {trends.map((trend) => (
                          <div key={trend.id} className="relative">
                            <TrendCard
                              id={trend.id}
                              coverImage={trend.coverPicture || undefined}
                              trendName={trend.name}
                              username={profileUser.username}
                              userAvatar={profileUser.profilePicture || undefined}
                              category={trend.category}
                              views={trend.views || 0}
                              participants={(trend as any).postCount || trend.participants || 0}
                              chatCount={trend.chatCount || 0}
                              createdAt={new Date(trend.createdAt!)}
                              endDate={trend.endDate ? new Date(trend.endDate) : undefined}
                              description={trend.description || undefined}
                              isHost={isOwnProfile}
                              trendNameFont={(trend as any).trendNameFont || "inter"}
                              trendNameColor={(trend as any).trendNameColor || "#FFFFFF"}
                              onClick={() => setLocation(`/instructions/${trend.id}`)}
                            />
                            {isOwnProfile && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="absolute top-2 right-2 gap-2"
                                onClick={() => setLocation(`/analytics/${trend.id}`)}
                                data-testid={`button-analytics-${trend.id}`}
                              >
                                <BarChart3 className="w-4 h-4" />
                                <span className="hidden sm:inline">Analytics</span>
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="posts" className="mt-6">
                    {postsLoading ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <Skeleton key={i} className="aspect-square" />
                        ))}
                      </div>
                    ) : posts.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        No posts yet
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {posts.map((post) => (
                          <div
                            key={post.id}
                            className="aspect-square bg-muted rounded-lg cursor-pointer hover-elevate overflow-hidden relative group"
                            onClick={() => setLocation(`/feed/${post.trendId}`)}
                            data-testid={`post-${post.id}`}
                          >
                            {post.mediaType === 'video' ? (
                              <video
                                src={post.mediaUrl || post.imageUrl}
                                className="w-full h-full object-cover"
                                muted
                              />
                            ) : (
                              <img
                                src={post.mediaUrl || post.imageUrl}
                                alt={post.caption || "Post"}
                                className="w-full h-full object-cover"
                              />
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {isOwnProfile && (
                    <TabsContent value="saved" className="mt-6">
                      <div className="space-y-6">
                        {/* Sub-tabs for saved content grouping */}
                        <Tabs value={savedSubTab} onValueChange={setSavedSubTab} className="w-full">
                          <TabsList className="w-full grid w-full grid-cols-2">
                            <TabsTrigger value="trends" className="gap-2" data-testid="tab-saved-trends">
                              <Bookmark className="w-4 h-4" />
                              <span>Saved Trends</span>
                              <span className="ml-1 text-xs text-muted-foreground">({savedTrends.length})</span>
                            </TabsTrigger>
                            <TabsTrigger value="posts" className="gap-2" data-testid="tab-saved-posts">
                              <Bookmark className="w-4 h-4" />
                              <span>Saved Posts</span>
                              <span className="ml-1 text-xs text-muted-foreground">({savedPosts.length})</span>
                            </TabsTrigger>
                          </TabsList>

                          {/* Saved Trends Section */}
                          <TabsContent value="trends" className="mt-6">
                            {savedTrendsLoading ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Skeleton className="h-64" />
                                <Skeleton className="h-64" />
                              </div>
                            ) : savedTrends.length === 0 ? (
                              <div className="text-center py-12 text-muted-foreground">
                                No saved trends yet
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {savedTrends.map((trend) => (
                                  <TrendCard
                                    key={trend.id}
                                    id={trend.id}
                                    coverImage={trend.coverPicture || undefined}
                                    trendName={trend.name}
                                    username={(trend as any).creator?.username || "Unknown"}
                                    userAvatar={(trend as any).creator?.profilePicture || undefined}
                                    category={trend.category}
                                    views={trend.views || 0}
                                    participants={trend.participants || 0}
                                    chatCount={trend.chatCount || 0}
                                    createdAt={new Date(trend.createdAt!)}
                                    endDate={trend.endDate ? new Date(trend.endDate) : undefined}
                                    description={trend.description || undefined}
                                    isHost={false}
                                    trendNameFont={(trend as any).trendNameFont || "inter"}
                                    trendNameColor={(trend as any).trendNameColor || "#FFFFFF"}
                                    onClick={() => setLocation(`/instructions/${trend.id}`)}
                                    data-testid={`saved-trend-${trend.id}`}
                                  />
                                ))}
                              </div>
                            )}
                          </TabsContent>

                          {/* Saved Posts Section */}
                          <TabsContent value="posts" className="mt-6">
                            {savedPostsLoading ? (
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                <Skeleton className="aspect-square" />
                                <Skeleton className="aspect-square" />
                                <Skeleton className="aspect-square" />
                              </div>
                            ) : savedPosts.length === 0 ? (
                              <div className="text-center py-12 text-muted-foreground">
                                No saved posts yet
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {savedPosts.map((post) => (
                                  <div
                                    key={post.id}
                                    className="aspect-square bg-muted rounded-lg cursor-pointer hover-elevate overflow-hidden relative group"
                                    onClick={() => setLocation(`/feed/${post.trendId}`)}
                                    data-testid={`saved-post-${post.id}`}
                                  >
                                    {post.mediaType === 'video' ? (
                                      <video
                                        src={post.mediaUrl || post.imageUrl}
                                        className="w-full h-full object-cover"
                                        muted
                                      />
                                    ) : (
                                      <img
                                        src={post.mediaUrl || post.imageUrl}
                                        alt={post.caption || "Post"}
                                        className="w-full h-full object-cover"
                                      />
                                    )}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                  </div>
                                ))}
                              </div>
                            )}
                          </TabsContent>
                        </Tabs>
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

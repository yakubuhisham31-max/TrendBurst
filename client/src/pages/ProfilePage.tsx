import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Edit, Share2 } from "lucide-react";
import { SiInstagram, SiTiktok, SiX, SiYoutube } from "react-icons/si";
import ProfileStats from "@/components/ProfileStats";
import TrendCard from "@/components/TrendCard";
import FollowButton from "@/components/FollowButton";

export default function ProfilePage() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const [activeTab, setActiveTab] = useState("trends");

  // Get username from URL params or use current user
  const currentUser = "johndoe"; // This would come from auth context in real app
  const viewingUsername = params.username || currentUser;
  const isOwnProfile = !params.username || params.username === currentUser;

  const mockUser = {
    username: viewingUsername,
    bio: "Tech enthusiast and content creator. Passionate about AI, design, and digital trends.",
    followers: 1234,
    following: 567,
    trendsCreated: 23,
    posts: 156,
    trendxPoints: 1250,
    socialLinks: {
      instagram: "https://instagram.com/johndoe",
      tiktok: "https://tiktok.com/@johndoe",
      twitter: "https://twitter.com/johndoe",
      youtube: "https://youtube.com/@johndoe",
    },
  };

  const mockTrends = [
    {
      id: "1",
      trendName: "Best AI Tools of 2025",
      username: "johndoe",
      category: "AI",
      views: 1243,
      participants: 89,
      chatCount: 156,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
    },
    {
      id: "2",
      trendName: "Digital Art Showcase",
      username: "johndoe",
      category: "Art",
      views: 987,
      participants: 45,
      chatCount: 78,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-lg font-semibold">Profile</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        <div className="relative">
          <div className="h-32 md:h-48 bg-gradient-to-br from-primary to-chart-2" />
          <div className="px-4 pb-4">
            <div className="relative -mt-16 mb-4">
              <Avatar className="w-24 h-24 md:w-32 md:h-32 ring-4 ring-background" data-testid="avatar-profile">
                <AvatarImage src={undefined} alt={mockUser.username} />
                <AvatarFallback className="text-2xl">
                  {mockUser.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold" data-testid="text-username">
                  {mockUser.username}
                </h2>
                <p className="text-muted-foreground mt-1" data-testid="text-bio">
                  {mockUser.bio}
                </p>
                
                {(mockUser.socialLinks.instagram || mockUser.socialLinks.tiktok || 
                  mockUser.socialLinks.twitter || mockUser.socialLinks.youtube) && (
                  <div className="flex items-center gap-3 mt-3">
                    {mockUser.socialLinks.instagram && (
                      <a 
                        href={mockUser.socialLinks.instagram} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        data-testid="link-instagram"
                      >
                        <SiInstagram className="w-5 h-5" />
                      </a>
                    )}
                    {mockUser.socialLinks.tiktok && (
                      <a 
                        href={mockUser.socialLinks.tiktok} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        data-testid="link-tiktok"
                      >
                        <SiTiktok className="w-5 h-5" />
                      </a>
                    )}
                    {mockUser.socialLinks.twitter && (
                      <a 
                        href={mockUser.socialLinks.twitter} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        data-testid="link-twitter"
                      >
                        <SiX className="w-5 h-5" />
                      </a>
                    )}
                    {mockUser.socialLinks.youtube && (
                      <a 
                        href={mockUser.socialLinks.youtube} 
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
                    <Button variant="outline" className="flex-1 gap-2" data-testid="button-share-profile">
                      <Share2 className="w-4 h-4" />
                      Share Profile
                    </Button>
                  </>
                ) : (
                  <>
                    <FollowButton username={viewingUsername} className="flex-1" />
                    <Button variant="outline" className="flex-1 gap-2" data-testid="button-share-profile">
                      <Share2 className="w-4 h-4" />
                      Share Profile
                    </Button>
                  </>
                )}
              </div>

              <ProfileStats
                followers={mockUser.followers}
                following={mockUser.following}
                trendsCreated={mockUser.trendsCreated}
                posts={mockUser.posts}
                trendxPoints={mockUser.trendxPoints}
              />

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="trends" className="flex-1" data-testid="tab-trends">
                    Trends Created
                  </TabsTrigger>
                  <TabsTrigger value="posts" className="flex-1" data-testid="tab-posts">
                    Posts
                  </TabsTrigger>
                  <TabsTrigger value="saved" className="flex-1" data-testid="tab-saved">
                    Saved
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="trends" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mockTrends.map((trend) => (
                      <TrendCard
                        key={trend.id}
                        {...trend}
                        onClick={() => setLocation(`/feed/${trend.id}`)}
                      />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="posts" className="mt-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div
                        key={i}
                        className="aspect-square bg-muted rounded-lg cursor-pointer hover-elevate"
                        data-testid={`post-thumbnail-${i}`}
                      />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="saved" className="mt-6">
                  <div className="text-center py-12 text-muted-foreground">
                    No saved items yet
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

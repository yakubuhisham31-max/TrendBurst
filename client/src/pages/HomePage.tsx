import { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Menu, Plus, Search, AlertCircle, LogIn, Flame, Sparkles, TrendingUp } from "lucide-react";
import TrendCard from "@/components/TrendCard";
import NavigationMenu from "@/components/NavigationMenu";
import NotificationBell from "@/components/NotificationBell";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getTrendStatus } from "@/lib/trendStatus";
import type { Trend, User } from "@shared/schema";
import { differenceInDays, differenceInHours } from "date-fns";
import logoImage from "@assets/trendx_background_fully_transparent (1)_1761635187125.png";

type TrendWithCreator = Trend & {
  creator: Pick<User, "id" | "username" | "profilePicture" | "verified"> | null;
};

const categoryIcons: Record<string, JSX.Element> = {
  "AI": <span className="text-lg">🤖</span>,
  "Arts": <span className="text-lg">🎨</span>,
  "Entertainment": <span className="text-lg">🎬</span>,
  "Fashion": <span className="text-lg">👗</span>,
  "Food": <span className="text-lg">🍔</span>,
  "Gaming": <span className="text-lg">🎮</span>,
  "Photography": <span className="text-lg">📸</span>,
  "Sports": <span className="text-lg">⚽</span>,
  "Technology": <span className="text-lg">💻</span>,
  "Other": <span className="text-lg">✨</span>,
};

const categories = [
  "All",
  "AI",
  "Arts",
  "Entertainment",
  "Fashion",
  "Food",
  "Gaming",
  "Photography",
  "Sports",
  "Technology",
  "Other",
];

const subcategories = [
  "New",
  "Trending",
  "Ending Soon",
  "Ended",
];

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { user, isLoading: loading } = useAuth();

  const categoryParam = selectedCategory === "All" ? undefined : selectedCategory;
  
  const { data: allTrends = [], isLoading } = useQuery<TrendWithCreator[]>({
    queryKey: categoryParam ? [`/api/trends?category=${categoryParam}`] : ["/api/trends"],
  });

  // Fetch notification counts
  const { data: notificationCounts } = useQuery<{ category: Record<string, number>, chat: Record<string, number> }>({
    queryKey: ["/api/notifications/counts"],
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Update view tracking mutation
  const updateViewMutation = useMutation({
    mutationFn: async ({ type, identifier }: { type: string; identifier: string }) => {
      const response = await apiRequest("POST", "/api/view-tracking", { type, identifier });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/counts"] });
    },
  });

  // Mark category as viewed when selected
  useEffect(() => {
    if (user && selectedCategory && selectedCategory !== "All") {
      updateViewMutation.mutate({ type: "category", identifier: selectedCategory });
    }
  }, [selectedCategory, user]);

  // Filter trends based on subcategory
  const trends = useMemo(() => {
    // Sort with verified creators first - only applies to main categories (All, AI, Arts, etc.)
    const sortByVerified = (items: TrendWithCreator[]) => {
      return [...items].sort((a, b) => {
        const aVerified = a.creator?.verified ? 1 : 0;
        const bVerified = b.creator?.verified ? 1 : 0;
        return bVerified - aVerified;
      });
    };

    // If no subcategory selected (main category view), sort by verified
    if (!selectedSubcategory) return sortByVerified(allTrends);

    const now = new Date();

    // For subcategories (New, Trending, Ending Soon, Ended), don't sort by verified
    switch (selectedSubcategory) {
      case "New":
        return allTrends.filter(trend => {
          const hoursSinceCreation = differenceInHours(now, trend.createdAt || now);
          return hoursSinceCreation <= 72; // Created within last 3 days (72 hours)
        });
      
      case "Trending":
        // Trending: Only show trends with very high engagement
        // Engagement calculation: views + (participants * 2) + (chatCount * 3)
        // Very high engagement threshold: 300 or more
        const ENGAGEMENT_THRESHOLD = 300;
        return [...allTrends]
          .map(trend => ({
            ...trend,
            engagement: (trend.views || 0) + (trend.participants || 0) * 2 + (trend.chatCount || 0) * 3
          }))
          .filter(trend => trend.engagement >= ENGAGEMENT_THRESHOLD)
          .sort((a, b) => b.engagement - a.engagement)
          .slice(0, 20); // Top 20 trending
      
      case "Ending Soon":
        return allTrends.filter(trend => getTrendStatus(trend.endDate) === "ending-soon");
      
      case "Ended":
        return allTrends.filter(trend => getTrendStatus(trend.endDate) === "ended");
      
      default:
        return sortByVerified(allTrends);
    }
  }, [allTrends, selectedSubcategory]);

  // Filter by search query
  const filteredTrends = useMemo(() => {
    if (!searchQuery.trim()) return trends;
    
    const query = searchQuery.toLowerCase();
    return trends.filter(trend => 
      trend.name.toLowerCase().includes(query) ||
      trend.creator?.username.toLowerCase().includes(query) ||
      trend.category.toLowerCase().includes(query)
    );
  }, [trends, searchQuery]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="w-full py-3 flex items-center justify-between px-4">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setMenuOpen(true)}
            data-testid="button-menu"
          >
            <Menu className="w-6 h-6" />
          </Button>
          <img 
            src={logoImage} 
            alt="Trendz" 
            className="h-14 sm:h-16 md:h-18 object-contain flex-1 text-center"
            data-testid="img-logo"
          />
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <NotificationBell />
              </>
            ) : (
              <Button
                variant="default"
                onClick={() => setAuthModalOpen(true)}
                className="gap-2"
                data-testid="button-sign-in"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Button>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search trends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 rounded-full bg-muted/50 border-0 focus-visible:ring-2"
              data-testid="input-search"
            />
          </div>

          {/* Create Trend Button */}
          {user ? (
            <Link href="/create-trend">
              <Button
                className="w-full h-12 rounded-full shadow-lg hover:shadow-xl gap-2.5 text-sm font-bold transition-all bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white border-0"
                data-testid="button-create-trend"
              >
                <Plus className="w-5 h-5" />
                Create New Trend
              </Button>
            </Link>
          ) : (
            <Button
              onClick={() => setAuthModalOpen(true)}
              className="w-full h-12 rounded-full shadow-lg hover:shadow-xl gap-2.5 text-sm font-bold transition-all bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white border-0"
              data-testid="button-create-trend"
            >
              <Plus className="w-5 h-5" />
              Create New Trend
            </Button>
          )}

          {/* Filter Section */}
          <div className="space-y-2">
            {/* Subcategories */}
            <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
              <div className="flex gap-2 min-w-max pb-1">
                {subcategories.map((subcategory) => (
                  <Button
                    key={subcategory}
                    variant={selectedSubcategory === subcategory ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedSubcategory(
                      selectedSubcategory === subcategory ? null : subcategory
                    )}
                    className="whitespace-nowrap rounded-full text-xs font-medium"
                    data-testid={`button-subcategory-${subcategory.toLowerCase().replace(' ', '-')}`}
                  >
                    {subcategory}
                  </Button>
                ))}
              </div>
            </div>

            {/* Main Categories */}
            <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
              <div className="flex gap-2 min-w-max pb-1">
                {categories.map((category) => {
                  const newCount = category !== "All" && notificationCounts?.category?.[category] || 0;
                  const icon = category !== "All" ? categoryIcons[category] : null;
                  return (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className="whitespace-nowrap rounded-full text-xs font-medium gap-1.5 relative"
                      data-testid={`button-category-${category.toLowerCase()}`}
                    >
                      {icon && <span>{icon}</span>}
                      {category}
                      {newCount > 0 && (
                        <Badge 
                          className="ml-1 h-4 min-w-4 px-1.5 bg-destructive text-destructive-foreground rounded-full text-xs font-bold"
                          data-testid={`badge-notification-${category.toLowerCase()}`}
                        >
                          {newCount > 99 ? "99+" : newCount}
                        </Badge>
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Logged Out Users */}
      {!user && !loading && (
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b">
          <div className="max-w-7xl mx-auto px-4 py-12 text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Discover Viral Trends
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join millions in creating, voting on, and competing in the hottest trends and challenges
            </p>
            <Button
              size="lg"
              onClick={() => setAuthModalOpen(true)}
              className="gap-2 rounded-full"
              data-testid="button-hero-get-started"
            >
              <Sparkles className="w-4 h-4" />
              Get Started
            </Button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-8">
        {isLoading && (
          <div className="space-y-8">
            {/* Featured Section Skeleton */}
            {selectedSubcategory === "Trending" && (
              <div className="space-y-3">
                <Skeleton className="h-8 w-40" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="aspect-[16/9] w-full rounded-lg" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Grid Skeleton */}
            <div className="space-y-3">
              <Skeleton className="h-6 w-24" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-[4/3] w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!isLoading && filteredTrends.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold text-foreground">No trends found</p>
            <p className="text-sm text-muted-foreground max-w-md text-center">
              {searchQuery ? "Try adjusting your search or filters" : "Be the first to create a trend!"}
            </p>
            {!searchQuery && user && (
              <Link href="/create-trend">
                <Button className="mt-2 rounded-full gap-2">
                  <Plus className="w-4 h-4" />
                  Create First Trend
                </Button>
              </Link>
            )}
          </div>
        )}

        {!isLoading && filteredTrends.length > 0 && (
          <div className="space-y-8">
            {/* Featured Section - Trending */}
            {selectedSubcategory === "Trending" && filteredTrends.slice(0, 2).length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-yellow-500" />
                  <h2 className="text-2xl font-bold">Trending Now</h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredTrends.slice(0, 2).map((trend) => (
                    <div
                      key={trend.id}
                      className="group relative rounded-xl overflow-hidden cursor-pointer aspect-video"
                      onClick={() => setLocation(`/instructions/${trend.id}?from=home`)}
                    >
                      <img
                        src={trend.coverPicture || ""}
                        alt={trend.name}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white space-y-2">
                        <Badge className="w-fit bg-primary">Featured</Badge>
                        <h3 className="text-xl font-bold line-clamp-2">{trend.name}</h3>
                        <div className="flex items-center justify-between text-sm text-gray-200">
                          <span>{trend.creator?.username}</span>
                          <div className="flex gap-3 text-xs">
                            <span>{trend.participants || 0} participants</span>
                            <span>{trend.views || 0} views</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Main Grid */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {selectedSubcategory === "Trending" ? (
                  <TrendingUp className="w-5 h-5 text-primary" />
                ) : (
                  <Sparkles className="w-5 h-5 text-primary" />
                )}
                <h2 className="text-xl font-bold">
                  {selectedSubcategory === "Trending" ? "Trending Trends" : selectedSubcategory || "All Trends"}
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {(selectedSubcategory === "Trending" ? filteredTrends.slice(2) : filteredTrends).map((trend) => (
                  <TrendCard
                    key={trend.id}
                    id={trend.id}
                    coverImage={trend.coverPicture || undefined}
                    trendName={trend.name}
                    description={trend.description || undefined}
                    username={trend.creator?.username || "Unknown"}
                    userAvatar={trend.creator?.profilePicture || undefined}
                    userVerified={trend.creator?.verified}
                    category={trend.category}
                    views={trend.views || 0}
                    participants={trend.participants || 0}
                    chatCount={trend.chatCount || 0}
                    createdAt={trend.createdAt || new Date()}
                    endDate={trend.endDate || undefined}
                    isTrending={selectedSubcategory === "Trending"}
                    trendNameFont={(trend as any).trendNameFont || "inter"}
                    trendNameColor={(trend as any).trendNameColor || "#FFFFFF"}
                    onClick={() => {
                      setLocation(`/instructions/${trend.id}?from=home`);
                    }}
                    onAuthModalOpen={() => setAuthModalOpen(true)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <NavigationMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        username={user?.username || "Guest"}
        userAvatar={user?.profilePicture || undefined}
        userVerified={user?.verified}
        onAuthModalOpen={() => setAuthModalOpen(true)}
      />

      <AuthModal
        isOpen={authModalOpen}
        onOpenChange={setAuthModalOpen}
      />
    </div>
  );
}

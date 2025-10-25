import { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Menu, Plus, Search, AlertCircle } from "lucide-react";
import TrendCard from "@/components/TrendCard";
import NavigationMenu from "@/components/NavigationMenu";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Trend, User } from "@shared/schema";
import { differenceInDays, differenceInHours } from "date-fns";
import logoImage from "@assets/file_000000003b9861f58e6c60daa28b8f45_1761404274206.png";

type TrendWithCreator = Trend & {
  creator: Pick<User, "id" | "username" | "profilePicture"> | null;
};

const categories = [
  "All",
  "Food",
  "Arts",
  "Sports",
  "Fashion",
  "Photography",
  "AI",
  "Entertainment",
  "Music",
  "Technology",
  "Gaming",
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
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const categoryParam = selectedCategory === "All" ? undefined : selectedCategory;
  
  const { data: allTrends = [], isLoading, error } = useQuery<TrendWithCreator[]>({
    queryKey: ["/api/trends", categoryParam],
    queryFn: async () => {
      const url = categoryParam 
        ? `/api/trends?category=${encodeURIComponent(categoryParam)}`
        : "/api/trends";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch trends");
      const data = await res.json();
      return data.map((trend: any) => ({
        ...trend,
        createdAt: new Date(trend.createdAt),
        endDate: trend.endDate ? new Date(trend.endDate) : undefined,
      }));
    },
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
    if (!selectedSubcategory) return allTrends;

    const now = new Date();

    switch (selectedSubcategory) {
      case "New":
        return allTrends.filter(trend => {
          const hoursSinceCreation = differenceInHours(now, trend.createdAt || now);
          return hoursSinceCreation <= 72; // Created within last 3 days (72 hours)
        });
      
      case "Trending":
        // Trending: Sort by engagement (views + participants * 2 + chatCount * 3)
        return [...allTrends]
          .map(trend => ({
            ...trend,
            engagement: (trend.views || 0) + (trend.participants || 0) * 2 + (trend.chatCount || 0) * 3
          }))
          .sort((a, b) => b.engagement - a.engagement)
          .slice(0, 20); // Top 20 trending
      
      case "Ending Soon":
        return allTrends.filter(trend => {
          if (!trend.endDate) return false;
          const daysUntilEnd = differenceInDays(trend.endDate, now);
          return daysUntilEnd <= 3 && daysUntilEnd >= 0;
        });
      
      case "Ended":
        return allTrends.filter(trend => {
          if (!trend.endDate) return false;
          return trend.endDate < now;
        });
      
      default:
        return allTrends;
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
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 h-24 flex items-center justify-between gap-3">
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
            className="h-20 sm:h-24 object-contain px-2"
            data-testid="img-logo"
          />
          <div className="w-10" />
        </div>
      </header>

      <div className="sticky top-24 z-40 bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-2 space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 rounded-full"
              data-testid="input-search"
            />
          </div>

          {/* Subcategories */}
          <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
            <div className="flex gap-2 min-w-max pb-1">
              {subcategories.map((subcategory) => (
                <Button
                  key={subcategory}
                  variant={selectedSubcategory === subcategory ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedSubcategory(
                    selectedSubcategory === subcategory ? null : subcategory
                  )}
                  className="whitespace-nowrap rounded-full"
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
                return (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="whitespace-nowrap rounded-full relative"
                    data-testid={`button-category-${category.toLowerCase()}`}
                  >
                    {category}
                    {newCount > 0 && (
                      <Badge 
                        className="ml-1.5 h-5 min-w-5 px-1.5 bg-destructive text-destructive-foreground rounded-full text-xs"
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

      <main className="max-w-7xl mx-auto px-4 py-4">
        {error && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <p className="text-lg font-medium text-muted-foreground">Failed to load trends</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/3] w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && !error && filteredTrends.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <p className="text-lg font-medium text-muted-foreground">No trends found</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "Try a different search term" : "Be the first to create a trend!"}
            </p>
          </div>
        )}

        {!isLoading && !error && filteredTrends.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTrends.map((trend) => (
              <TrendCard
                key={trend.id}
                id={trend.id}
                coverImage={trend.coverPicture || undefined}
                trendName={trend.name}
                username={trend.creator?.username || "Unknown"}
                userAvatar={trend.creator?.profilePicture || undefined}
                category={trend.category}
                views={trend.views || 0}
                participants={trend.participants || 0}
                chatCount={trend.chatCount || 0}
                createdAt={trend.createdAt || new Date()}
                endDate={trend.endDate || undefined}
                isTrending={selectedSubcategory === "Trending"}
                onClick={() => setLocation(`/feed/${trend.id}`)}
              />
            ))}
          </div>
        )}
      </main>

      <Link href="/create-trend">
        <Button
          className="fixed bottom-6 right-6 h-14 px-6 rounded-full shadow-lg gap-2 text-base font-medium z-50"
          data-testid="button-create-trend"
        >
          <Plus className="w-5 h-5" />
          Create New Trend
        </Button>
      </Link>

      <NavigationMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        username={user?.username || "Guest"}
        userAvatar={user?.profilePicture || undefined}
        onLogoutClick={async () => {
          await logout();
          setLocation("/login");
        }}
      />
    </div>
  );
}

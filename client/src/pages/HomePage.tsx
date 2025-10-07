import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Menu, Plus, Search, AlertCircle } from "lucide-react";
import TrendCard from "@/components/TrendCard";
import NavigationMenu from "@/components/NavigationMenu";
import { useAuth } from "@/contexts/AuthContext";
import type { Trend, User } from "@shared/schema";
import logoImage from "@assets/file_0000000058b0622fae99adc55619c415_1759754745057.png";

type TrendWithCreator = Trend & {
  creator: Pick<User, "id" | "username" | "profilePicture"> | null;
};

const categories = [
  "All",
  "Trending",
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

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const categoryParam = selectedCategory === "All" ? undefined : selectedCategory;
  
  const { data: trends = [], isLoading, error } = useQuery<TrendWithCreator[]>({
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

  return (
    <div className="min-h-screen bg-background">
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
            className="h-20 object-contain"
            data-testid="img-logo"
          />
          <div className="w-10" />
        </div>
      </header>

      <div className="sticky top-24 z-40 bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-2 space-y-2">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search trends or users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 rounded-full"
              data-testid="input-search"
            />
          </div>

          <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
            <div className="flex gap-2 min-w-max pb-1">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="whitespace-nowrap rounded-full"
                  data-testid={`button-category-${category.toLowerCase()}`}
                >
                  {category}
                </Button>
              ))}
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

        {!isLoading && !error && trends.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <p className="text-lg font-medium text-muted-foreground">No trends found</p>
            <p className="text-sm text-muted-foreground">Be the first to create a trend!</p>
          </div>
        )}

        {!isLoading && !error && trends.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trends.map((trend) => (
              <TrendCard
                key={trend.id}
                id={trend.id}
                coverImage={trend.coverPicture || undefined}
                trendName={trend.name}
                instructions={trend.instructions || undefined}
                username={trend.creator?.username || "Unknown"}
                userAvatar={trend.creator?.profilePicture || undefined}
                category={trend.category}
                views={trend.views || 0}
                participants={trend.participants || 0}
                chatCount={trend.chatCount || 0}
                createdAt={trend.createdAt || new Date()}
                endDate={trend.endDate || undefined}
                onClick={() => setLocation(`/feed/${trend.id}`)}
              />
            ))}
          </div>
        )}
      </main>

      <Link href="/create-trend">
        <Button
          size="icon"
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg"
          data-testid="button-create-trend"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </Link>

      <NavigationMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        username={user?.username || "Guest"}
        onLogoutClick={async () => {
          await logout();
          setLocation("/login");
        }}
      />
    </div>
  );
}

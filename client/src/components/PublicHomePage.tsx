import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Menu, Plus, Search, LogIn } from "lucide-react";
import { Link } from "wouter";
import logoImage from "@assets/trendx_background_fully_transparent (1)_1761635187125.png";
import { AuthModal } from "@/components/AuthModal";
import { RestrictedPostCard } from "@/components/RestrictedPostCard";
import type { Trend, User } from "@shared/schema";

type TrendWithCreator = Trend & {
  creator: Pick<User, "id" | "username" | "profilePicture"> | null;
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

export function PublicHomePage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const categoryParam = selectedCategory === "All" ? undefined : selectedCategory;
  
  const { data: allTrends = [], isLoading } = useQuery<TrendWithCreator[]>({
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

  const filteredTrends = useMemo(() => {
    return allTrends.filter(trend =>
      trend.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allTrends, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <AuthModal isOpen={authModalOpen} onOpenChange={setAuthModalOpen} />
      
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <img src={logoImage} alt="Trendx" className="h-8 object-contain" data-testid="img-logo" />
          <div className="flex-1 flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search trends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none"
              data-testid="input-search"
            />
          </div>
          <Button
            variant="default"
            onClick={() => setAuthModalOpen(true)}
            data-testid="button-login-header"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Sign In
          </Button>
        </div>
      </header>

      {/* Categories */}
      <div className="border-b bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-background hover:bg-muted"
              }`}
              data-testid={`button-category-${cat.toLowerCase()}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading trends...</p>
          </div>
        ) : filteredTrends.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <p className="text-muted-foreground">No trends found</p>
            <Button onClick={() => setAuthModalOpen(true)} data-testid="button-signup-empty">
              Sign up to create trends
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTrends.map((trend) => (
              <Card key={trend.id} className="overflow-hidden hover-elevate cursor-pointer" onClick={() => setAuthModalOpen(true)} data-testid={`card-trend-${trend.id}`}>
                <div className="aspect-video bg-muted relative">
                  {trend.coverPicture ? (
                    <img src={trend.coverPicture} alt={trend.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold line-clamp-2">{trend.name}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">{trend.category}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{trend.description}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

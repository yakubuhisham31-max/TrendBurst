import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Menu, Plus, Search } from "lucide-react";
import TrendCard from "@/components/TrendCard";
import NavigationMenu from "@/components/NavigationMenu";
import logoImage from "@assets/file_0000000058b0622fae99adc55619c415_1759754745057.png";

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

  const mockTrends = [
    {
      id: "1",
      trendName: "Best AI Tools of 2025",
      username: "techguru",
      category: "AI",
      views: 1243,
      participants: 89,
      chatCount: 156,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
    },
    {
      id: "2",
      trendName: "Epic Gaming Moments",
      username: "gamerpro",
      category: "Entertainment",
      views: 2891,
      participants: 234,
      chatCount: 445,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
    },
    {
      id: "3",
      trendName: "Digital Art Showcase",
      username: "artlover",
      category: "Arts",
      views: 987,
      participants: 45,
      chatCount: 78,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
    {
      id: "4",
      trendName: "Sports Highlights 2025",
      username: "sportsfan",
      category: "Sports",
      views: 3421,
      participants: 312,
      chatCount: 589,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
    },
    {
      id: "5",
      trendName: "Music Production Tips",
      username: "musicpro",
      category: "Music",
      views: 756,
      participants: 67,
      chatCount: 123,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18),
    },
    {
      id: "6",
      trendName: "Fashion Trends 2025",
      username: "fashionista",
      category: "Fashion",
      views: 2134,
      participants: 178,
      chatCount: 267,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
    },
  ];

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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mockTrends.map((trend) => (
            <TrendCard
              key={trend.id}
              {...trend}
              onClick={() => setLocation(`/feed/${trend.id}`)}
            />
          ))}
        </div>
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
        username="johndoe"
        onLogoutClick={() => {
          console.log("Logout");
          setLocation("/login");
        }}
      />
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Trophy } from "lucide-react";

export default function RankingsPage() {
  const trendName = "Best AI Tools of 2025";
  const hostUsername = "techguru";
  const currentUser = "artlover"; // The logged-in user

  const mockPosts = [
    {
      id: "1",
      rank: 1,
      username: "techguru",
      votes: 42,
      imageUrl: "https://images.unsplash.com/photo-1614680376739-414d95ff43df?w=200&h=200&fit=crop",
      caption: "This is an amazing AI tool that has revolutionized my workflow!",
    },
    {
      id: "2",
      rank: 2,
      username: "artlover",
      votes: 35,
      imageUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=200&h=200&fit=crop",
      caption: "Beautiful art work here! This piece took me several hours to create.",
    },
    {
      id: "3",
      rank: 3,
      username: "naturelover",
      votes: 28,
      imageUrl: "https://images.unsplash.com/photo-1547954575-855750c57bd3?w=200&h=200&fit=crop",
      caption: "Check out this amazing sunset view!",
    },
    {
      id: "4",
      rank: 4,
      username: "designpro",
      votes: 24,
      imageUrl: "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=200&h=200&fit=crop",
      caption: "Design tools that every creative needs in 2025",
    },
    {
      id: "5",
      rank: 5,
      username: "devmaster",
      votes: 19,
      imageUrl: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=200&h=200&fit=crop",
      caption: "The best coding assistant I've ever used",
    },
  ];

  const currentUserPost = mockPosts.find(post => post.username === currentUser);

  const getRankBadge = (rank: number) => {
    const suffixes = ["st", "nd", "rd"];
    const suffix = rank <= 3 ? suffixes[rank - 1] : "th";
    return `${rank}${suffix}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-4">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => console.log("Navigate back")}
            data-testid="button-back"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-semibold">{trendName}</h1>
            </div>
            <p className="text-xs text-muted-foreground">
              Hosted by {hostUsername}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {currentUserPost && (
          <Card className="p-4 border-2 border-primary bg-primary/5">
            <p className="text-xs font-medium text-muted-foreground mb-3">Your Entry</p>
            <div className="flex items-center gap-4">
              <Badge
                className="w-12 h-12 rounded-full flex items-center justify-center font-bold bg-gradient-to-br from-primary to-chart-2 text-primary-foreground"
                data-testid="badge-user-rank"
              >
                {getRankBadge(currentUserPost.rank)}
              </Badge>
              <img
                src={currentUserPost.imageUrl}
                alt={currentUserPost.username}
                className="w-20 h-20 rounded-lg object-cover"
                data-testid="img-user-post"
              />
              <div className="flex-1">
                <p className="font-medium">{currentUserPost.username}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">{currentUserPost.caption}</p>
                <p className="text-sm font-bold text-primary mt-1">{currentUserPost.votes} votes</p>
              </div>
            </div>
          </Card>
        )}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {mockPosts.slice(0, 3).map((post, index) => {
            const heights = ["h-32", "h-40", "h-28"];
            const orders = [1, 0, 2];
            
            return (
              <div
                key={post.id}
                className="flex flex-col items-center gap-2"
                style={{ order: orders[index] }}
                data-testid={`podium-${post.rank}`}
              >
                <Avatar className="w-16 h-16 ring-4 ring-primary/20">
                  <AvatarImage src={post.imageUrl} alt={post.username} />
                  <AvatarFallback>
                    {post.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Badge className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  post.rank === 1 ? "bg-gradient-to-br from-yellow-400 to-yellow-600" :
                  post.rank === 2 ? "bg-gradient-to-br from-gray-300 to-gray-500" :
                  "bg-gradient-to-br from-orange-400 to-orange-600"
                } text-white font-bold`}>
                  {post.rank}
                </Badge>
                <p className="text-xs font-medium text-center">{post.username}</p>
                <p className="text-sm font-bold text-primary">{post.votes} votes</p>
                <div className={`w-full ${heights[index]} bg-gradient-to-t ${
                  post.rank === 1 ? "from-primary/30 to-primary/10" :
                  post.rank === 2 ? "from-chart-2/30 to-chart-2/10" :
                  "from-chart-4/30 to-chart-4/10"
                } rounded-t-lg`} />
              </div>
            );
          })}
        </div>

        <div className="space-y-2">
          {mockPosts.slice(3).map((post) => (
            <Card
              key={post.id}
              className={`p-4 flex items-center gap-4 cursor-pointer hover-elevate ${
                post.username === currentUser ? 'border-primary bg-primary/5' : ''
              }`}
              data-testid={`ranking-item-${post.rank}`}
            >
              <Badge
                variant="secondary"
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
              >
                {getRankBadge(post.rank)}
              </Badge>
              <img
                src={post.imageUrl}
                alt={post.username}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div className="flex-1">
                <p className="font-medium" data-testid="text-username">
                  {post.username}
                </p>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {post.caption}
                </p>
                <p className="text-sm font-bold text-primary">
                  {post.votes} votes
                </p>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}

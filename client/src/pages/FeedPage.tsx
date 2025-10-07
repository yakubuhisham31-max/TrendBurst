import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Info, Trophy, MessageSquare, Plus } from "lucide-react";
import PostCard from "@/components/PostCard";
import CreatePostDialog from "@/components/CreatePostDialog";
import logoImage from "@assets/file_0000000058b0622fae99adc55619c415_1759754745057.png";

export default function FeedPage() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const trendId = params.id;
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [userHasPosted, setUserHasPosted] = useState(false);
  const [votesRemaining, setVotesRemaining] = useState(10);

  // Mock trend data - in real app this would come from API
  const mockTrend = {
    endDate: trendId === "3" 
      ? new Date(Date.now() - 1000 * 60 * 60 * 12) // ended 12 hours ago
      : new Date(Date.now() + 1000 * 60 * 60 * 24 * 5), // ends in 5 days
  };

  const isTrendEnded = mockTrend.endDate < new Date();

  const mockPosts = [
    {
      id: "1",
      rank: 1,
      imageUrl: "https://images.unsplash.com/photo-1614680376739-414d95ff43df?w=800&h=600&fit=crop",
      caption: "This is an amazing post about AI and technology! Really excited to share this with everyone.",
      username: "techguru",
      votes: 42,
      createdAt: new Date(Date.now() - 1000 * 60 * 90),
      userVoted: true,
      commentsCount: 12,
      isTrendHost: true,
    },
    {
      id: "2",
      rank: 2,
      imageUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=600&fit=crop",
      caption: "Beautiful art work here! This piece took me several hours to create.",
      username: "artlover",
      votes: 35,
      createdAt: new Date(Date.now() - 1000 * 60 * 60),
      commentsCount: 8,
    },
    {
      id: "3",
      rank: 3,
      imageUrl: "https://images.unsplash.com/photo-1547954575-855750c57bd3?w=800&h=600&fit=crop",
      caption: "Check out this amazing sunset view!",
      username: "naturelover",
      votes: 28,
      createdAt: new Date(Date.now() - 1000 * 60 * 30),
      commentsCount: 5,
      isDisqualified: true,
    },
  ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const handleCreatePost = () => {
    setUserHasPosted(true);
    setCreatePostOpen(false);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>

          <img 
            src={logoImage} 
            alt="Trendz" 
            className="h-10 object-contain"
            data-testid="img-logo"
          />

          <div className="w-10" />
        </div>

        <div className="max-w-3xl mx-auto px-4 pb-3 flex items-center justify-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setLocation(`/instructions/${trendId}`)}
            data-testid="button-instructions"
          >
            <Info className="w-4 h-4 mr-2" />
            Instructions
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setLocation(`/rankings/${trendId}`)}
            data-testid="button-rankings"
          >
            <Trophy className="w-4 h-4 mr-2" />
            Rankings
          </Button>
          <div className="flex items-center gap-2 px-4 py-1.5 bg-muted rounded-full">
            <span className="text-sm font-medium">Remaining Votes: {votesRemaining}/10</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4 space-y-6">
        {mockPosts.map((post) => (
          <PostCard
            key={post.id}
            {...post}
            isTrendEnded={isTrendEnded}
            onVoteUp={() => !isTrendEnded && console.log("Vote up", post.id)}
            onVoteDown={() => !isTrendEnded && console.log("Vote down", post.id)}
            onComment={() => console.log("Comment on", post.id)}
          />
        ))}
      </main>

      {!userHasPosted && !isTrendEnded && (
        <Button
          size="icon"
          className="fixed bottom-6 left-6 w-14 h-14 rounded-full shadow-lg"
          onClick={() => setCreatePostOpen(true)}
          data-testid="button-create-post"
        >
          <Plus className="w-6 h-6" />
        </Button>
      )}

      <Button
        size="icon"
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg bg-chart-2"
        onClick={() => setLocation(`/feed-chat/${trendId}`)}
        data-testid="button-feed-chat"
      >
        <MessageSquare className="w-6 h-6" />
      </Button>

      <CreatePostDialog
        open={createPostOpen}
        onOpenChange={setCreatePostOpen}
        onSubmit={handleCreatePost}
      />
    </div>
  );
}

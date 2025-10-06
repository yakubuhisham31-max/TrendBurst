import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Info, Trophy, MessageSquare } from "lucide-react";
import PostCard from "@/components/PostCard";
import CreatePostDialog from "@/components/CreatePostDialog";

export default function FeedPage() {
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [userHasPosted, setUserHasPosted] = useState(false);
  const [votesRemaining, setVotesRemaining] = useState(10);

  const mockPosts = [
    {
      id: "1",
      rank: 1,
      imageUrl: "https://images.unsplash.com/photo-1614680376739-414d95ff43df?w=800&h=600&fit=crop",
      caption: "This is an amazing post about AI and technology! Really excited to share this with everyone.",
      username: "techguru",
      votes: 42,
      createdAt: new Date(Date.now() - 1000 * 60 * 30),
      userVoted: true,
      commentsCount: 12,
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
      createdAt: new Date(Date.now() - 1000 * 60 * 90),
      commentsCount: 5,
    },
  ];

  const handleCreatePost = () => {
    setUserHasPosted(true);
    setCreatePostOpen(false);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => console.log("Navigate back")}
            data-testid="button-back"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>

          <h1 className="text-lg font-semibold flex-1 text-center line-clamp-1">
            Best AI Tools of 2025
          </h1>

          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => console.log("Show instructions")}
              data-testid="button-instructions"
            >
              <Info className="w-5 h-5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => console.log("Show rankings")}
              data-testid="button-rankings"
            >
              <Trophy className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <span className="text-sm text-muted-foreground">
            Votes remaining: <span className="font-bold text-foreground">{votesRemaining}/10</span>
          </span>
          {!userHasPosted && (
            <Button
              onClick={() => setCreatePostOpen(true)}
              data-testid="button-create-post"
            >
              Create Post
            </Button>
          )}
        </div>

        {mockPosts.map((post) => (
          <PostCard
            key={post.id}
            {...post}
            onVoteUp={() => console.log("Vote up", post.id)}
            onVoteDown={() => console.log("Vote down", post.id)}
            onComment={() => console.log("Comment on", post.id)}
          />
        ))}
      </main>

      <Button
        size="icon"
        className="fixed bottom-6 left-6 w-14 h-14 rounded-full shadow-lg bg-chart-2"
        onClick={() => console.log("Open feed chat")}
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

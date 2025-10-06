import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import CommentSection from "@/components/CommentSection";

export default function FeedChatPage() {
  const mockComments = [
    {
      id: "1",
      username: "johndoe",
      text: "This trend is amazing! Love seeing everyone's submissions.",
      createdAt: new Date(Date.now() - 1000 * 60 * 15),
    },
    {
      id: "2",
      username: "janedoe",
      text: "Great idea for a trend. Can't wait to participate!",
      createdAt: new Date(Date.now() - 1000 * 60 * 30),
    },
    {
      id: "3",
      username: "techguru",
      text: "The competition is tough this time around!",
      createdAt: new Date(Date.now() - 1000 * 60 * 45),
    },
    {
      id: "4",
      username: "artlover",
      text: "Really enjoying the variety of posts here.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60),
    },
  ];

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
          <h1 className="text-lg font-semibold">Feed Discussion</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Discuss this trend with other participants
          </p>
        </div>

        <CommentSection
          comments={mockComments}
          onAddComment={(text) => console.log("New comment:", text)}
        />
      </main>
    </div>
  );
}

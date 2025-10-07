import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Users, Eye, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

export default function FeedChatPage() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const [message, setMessage] = useState("");

  const mockTrend = {
    name: "AI Innovation Challenge",
    category: "technology",
    participants: 156,
    views: 2345,
    coverImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop",
  };

  const mockComments = [
    {
      id: "1",
      username: "johndoe",
      userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=johndoe",
      text: "This trend is amazing! Love seeing everyone's submissions.",
      createdAt: new Date(Date.now() - 1000 * 60 * 15),
    },
    {
      id: "2",
      username: "janedoe",
      userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=janedoe",
      text: "Great idea for a trend. Can't wait to participate!",
      createdAt: new Date(Date.now() - 1000 * 60 * 30),
    },
    {
      id: "3",
      username: "techguru",
      userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=techguru",
      text: "The competition is tough this time around! Everyone's bringing their A-game 🔥",
      createdAt: new Date(Date.now() - 1000 * 60 * 45),
    },
    {
      id: "4",
      username: "artlover",
      userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=artlover",
      text: "Really enjoying the variety of posts here.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60),
    },
  ];

  const handleSendMessage = () => {
    if (message.trim()) {
      console.log("Send message:", message);
      setMessage("");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setLocation(`/feed/${params.id}`)}
              data-testid="button-back"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold" data-testid="text-trend-name">Trend Discussion</h1>
              <p className="text-xs text-muted-foreground">Chat with participants</p>
            </div>
          </div>

          <Card className="overflow-hidden">
            <div className="relative h-32">
              {mockTrend.coverImage ? (
                <img
                  src={mockTrend.coverImage}
                  alt={mockTrend.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-chart-2/20" />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60" />
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <h2 className="font-bold text-base line-clamp-1 mb-2" data-testid="text-trend-title">
                  {mockTrend.name}
                </h2>
                <div className="flex items-center gap-3 text-xs">
                  <Badge className="bg-primary/90 text-primary-foreground" data-testid="badge-category">
                    {mockTrend.category}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{mockTrend.participants}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>{mockTrend.views}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto max-w-4xl mx-auto w-full px-4 py-4">
        <div className="space-y-4">
          {mockComments.map((comment) => (
            <div key={comment.id} className="flex gap-3 hover-elevate p-3 rounded-lg" data-testid={`comment-${comment.id}`}>
              <Avatar 
                className="w-10 h-10 flex-shrink-0"
                onClick={() => setLocation(`/profile/${comment.username}`)}
              >
                <AvatarImage src={comment.userAvatar} alt={comment.username} />
                <AvatarFallback>{comment.username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span 
                    className="font-semibold text-sm cursor-pointer hover:underline" 
                    data-testid={`text-username-${comment.id}`}
                    onClick={() => setLocation(`/profile/${comment.username}`)}
                  >
                    {comment.username}
                  </span>
                  <span className="text-xs text-muted-foreground" data-testid={`text-time-${comment.id}`}>
                    {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-foreground" data-testid={`text-message-${comment.id}`}>
                  {comment.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="sticky bottom-0 bg-background border-t">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex gap-2">
            <Input
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1"
              data-testid="input-message"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!message.trim()}
              data-testid="button-send"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}

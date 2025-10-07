import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Star, Calendar } from "lucide-react";
import { SiInstagram, SiTiktok, SiTwitter, SiYoutube } from "react-icons/si";
import FollowButton from "@/components/FollowButton";
import { differenceInDays } from "date-fns";

export default function InstructionsPage() {
  const [, setLocation] = useLocation();
  
  const mockTrend = {
    name: "Best AI Tools of 2025",
    instructions: "Share your favorite AI tools and explain why they're the best. Upload screenshots or graphics showcasing the tools in action. Vote on other submissions to determine the community's top picks!",
    rules: [
      "Only one post per user allowed",
      "Must include actual screenshots or graphics of the AI tool",
      "Provide clear explanation of why the tool is valuable",
    ],
    category: "AI",
    host: {
      username: "techguru",
      avatar: "",
      verified: true,
      socialLinks: {
        instagram: "https://instagram.com/techguru",
        tiktok: "https://tiktok.com/@techguru",
        twitter: "https://twitter.com/techguru",
        youtube: "https://youtube.com/@techguru",
      }
    },
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days from now
    referenceMedia: [] as string[],
  };

  const daysLeft = differenceInDays(mockTrend.endDate, new Date());

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
          <h1 className="text-lg font-semibold">Instructions</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <Card className="p-6 space-y-6">
          <div className="flex items-start gap-4 pb-4 border-b">
            <Avatar className="w-16 h-16" data-testid="avatar-host">
              <AvatarImage src={mockTrend.host.avatar} alt={mockTrend.host.username} />
              <AvatarFallback>{mockTrend.host.username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold" data-testid="text-host-username">
                  {mockTrend.host.username}
                </span>
                {mockTrend.host.verified && (
                  <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" data-testid="icon-verified" />
                )}
              </div>
              <div className="flex items-center gap-3 mb-3">
                {mockTrend.host.socialLinks.instagram && (
                  <a 
                    href={mockTrend.host.socialLinks.instagram} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    data-testid="link-instagram"
                  >
                    <SiInstagram className="w-4 h-4" />
                  </a>
                )}
                {mockTrend.host.socialLinks.tiktok && (
                  <a 
                    href={mockTrend.host.socialLinks.tiktok} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    data-testid="link-tiktok"
                  >
                    <SiTiktok className="w-4 h-4" />
                  </a>
                )}
                {mockTrend.host.socialLinks.twitter && (
                  <a 
                    href={mockTrend.host.socialLinks.twitter} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    data-testid="link-twitter"
                  >
                    <SiTwitter className="w-4 h-4" />
                  </a>
                )}
                {mockTrend.host.socialLinks.youtube && (
                  <a 
                    href={mockTrend.host.socialLinks.youtube} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    data-testid="link-youtube"
                  >
                    <SiYoutube className="w-4 h-4" />
                  </a>
                )}
              </div>
              <FollowButton username={mockTrend.host.username} />
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-2" data-testid="text-trend-name">
              {mockTrend.name}
            </h2>
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="secondary" data-testid="badge-category">
                {mockTrend.category}
              </Badge>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span data-testid="text-days-left">
                  {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">How It Works</h3>
            <p className="text-muted-foreground" data-testid="text-instructions">
              {mockTrend.instructions}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Rules</h3>
            <ol className="space-y-2">
              {mockTrend.rules.map((rule, index) => (
                <li
                  key={index}
                  className="flex gap-3"
                  data-testid={`rule-${index + 1}`}
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="flex-1 pt-0.5">{rule}</span>
                </li>
              ))}
            </ol>
          </div>

          {mockTrend.referenceMedia.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Reference Examples</h3>
              <div className="grid grid-cols-2 gap-3">
                {mockTrend.referenceMedia.map((media, index) => (
                  <div key={index} className="aspect-video rounded-lg overflow-hidden bg-muted">
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-chart-2/20" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4">
            <Button
              className="w-full"
              onClick={() => setLocation("/feed/1")}
              data-testid="button-back-to-feed"
            >
              Continue to Feed
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}

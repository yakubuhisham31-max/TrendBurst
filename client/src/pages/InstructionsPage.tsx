import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";

export default function InstructionsPage() {
  const mockTrend = {
    name: "Best AI Tools of 2025",
    instructions: "Share your favorite AI tools and explain why they're the best. Upload screenshots or graphics showcasing the tools in action. Vote on other submissions to determine the community's top picks!",
    rules: [
      "Only one post per user allowed",
      "Must include actual screenshots or graphics of the AI tool",
      "Provide clear explanation of why the tool is valuable",
    ],
    category: "AI",
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
          <h1 className="text-lg font-semibold">Instructions</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2" data-testid="text-trend-name">
              {mockTrend.name}
            </h2>
            <div className="inline-block">
              <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary" data-testid="badge-category">
                {mockTrend.category}
              </span>
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

          <div className="pt-4">
            <Button
              className="w-full"
              onClick={() => console.log("Navigate to feed")}
              data-testid="button-back-to-feed"
            >
              Back to Feed
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}

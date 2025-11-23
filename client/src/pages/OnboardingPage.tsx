import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Film, Star, Trophy } from "lucide-react";

export default function OnboardingPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Mark onboarding as complete in localStorage
  const handleContinue = () => {
    if (user?.id) {
      localStorage.setItem(`onboarding-${user.id}`, "true");
      setLocation("/");
    }
  };

  useEffect(() => {
    // Check if user has already seen onboarding
    if (user?.id) {
      const hasSeenOnboarding = localStorage.getItem(`onboarding-${user.id}`);
      if (hasSeenOnboarding) {
        setLocation("/");
      }
    }
  }, [user, setLocation]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Hero Section */}
        <div className="relative mb-8 rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-500 p-12">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

          {/* Welcome Content */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-12">
            <div className="mb-4">
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                Welcome to Trendz
              </h1>
              <p className="text-2xl md:text-3xl text-white/95 leading-relaxed font-semibold">
                Compete, Vote, Create
              </p>
              <p className="text-2xl md:text-3xl text-white/95 leading-relaxed font-semibold">
                Discover the Hottest Trends with Your Friends
              </p>
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center">
            <Film className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-sm font-semibold text-foreground">Create</p>
            <p className="text-xs text-muted-foreground">Post your best content</p>
          </div>
          <div className="text-center">
            <Star className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-sm font-semibold text-foreground">Vote</p>
            <p className="text-xs text-muted-foreground">Support your favorites</p>
          </div>
          <div className="text-center">
            <Trophy className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-sm font-semibold text-foreground">Compete</p>
            <p className="text-xs text-muted-foreground">Climb the rankings</p>
          </div>
        </div>

        {/* CTA Button */}
        <Button
          size="lg"
          onClick={handleContinue}
          className="w-full text-lg"
          data-testid="button-onboarding-continue"
        >
          Let's Get Started
        </Button>

        <p className="text-center text-xs text-muted-foreground mt-4">
          You can skip this anytime
        </p>
      </div>
    </div>
  );
}

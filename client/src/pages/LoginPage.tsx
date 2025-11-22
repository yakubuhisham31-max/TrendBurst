import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import logoImage from "@assets/trendx_background_fully_transparent (1)_1761635187125.png";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const handleSignIn = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 -ml-2"
          onClick={() => setLocation("/")}
          data-testid="button-back-to-home"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        {/* Card */}
        <Card className="p-8 sm:p-10 space-y-8">
          <div className="text-center space-y-4">
            <img 
              src={logoImage} 
              alt="Trendx" 
              className="h-16 object-contain mx-auto"
              data-testid="img-logo"
            />
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Welcome Back!</h1>
              <p className="text-muted-foreground">
                Sign in to discover and join trending challenges
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full"
              onClick={handleSignIn}
              data-testid="button-signin"
            >
              Sign In
            </Button>

            <p className="text-xs text-center text-muted-foreground pt-2">
              Sign in with your Google, GitHub, X, or Apple account
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

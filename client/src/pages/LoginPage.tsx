import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import logoImage from "@assets/trendx_background_fully_transparent (1)_1761635187125.png";

const GoogleLogo = () => (
  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#clip0_1)">
      <path d="M23.745 12.27c0-.79-.07-1.54-.188-2.27h-11.3v4.28h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.6z" fill="#4285F4"/>
      <path d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-.9.64-2.05 1.04-3.93 1.04-3.02 0-5.57-2.04-6.48-4.78H1.07v3.1C3.05 22.9 7.12 24 12.255 24z" fill="#34A853"/>
      <path d="M5.775 14.35c-.23-.64-.36-1.33-.36-2.05s.13-1.41.36-2.05V6.15H1.07A11.98 11.98 0 000 12.25c0 1.93.48 3.77 1.33 5.38l4.29-3.28z" fill="#FBBC04"/>
      <path d="M12.255 5.92c1.7 0 3.21.58 4.41 1.71l3.31-3.31C18.205 1.14 15.495 0 12.255 0 7.12 0 3.05 1.1 1.07 4.87l4.29 3.28c.91-2.74 3.46-4.83 6.48-4.83z" fill="#EA4335"/>
    </g>
  </svg>
);

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const handleSignIn = () => {
    window.location.href = "/api/login/google";
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
              data-testid="button-signin-google"
            >
              <GoogleLogo />
              Continue with Google
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => window.location.href = "/api/login"}
              data-testid="button-signin-other"
            >
              Other Methods (GitHub, X, Apple)
            </Button>

            <p className="text-xs text-center text-muted-foreground pt-2">
              Trendx uses secure OAuth authentication. Click above to sign in with your preferred account.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

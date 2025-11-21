import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mail, LogIn } from "lucide-react";
import { Link } from "wouter";
import { useLocation } from "wouter";

interface AuthModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

export function AuthModal({ 
  isOpen, 
  onOpenChange,
  title = "Join Trendx to Continue",
  description = "Sign in or create an account to access this feature"
}: AuthModalProps) {
  const [isSliding, setIsSliding] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Load Google Sign-In SDK
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const handleGoogleSignIn = () => {
    // For now, redirect to login page where users can set up credentials
    // Future: Implement full Google OAuth flow
    window.location.href = "/login";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={`sm:max-w-md transition-all duration-300 ${isSliding ? 'translate-y-full' : ''}`}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <Button
            variant="default"
            size="lg"
            className="w-full"
            onClick={() => {
              setLocation("/login");
            }}
            data-testid="button-auth-email"
          >
            <Mail className="w-4 h-4 mr-2" />
            Continue with Email
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={handleGoogleSignIn}
            data-testid="button-auth-google"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Continue with Google
          </Button>

          <div className="text-center text-sm text-muted-foreground mt-2">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary hover:underline font-semibold"
              data-testid="link-auth-signin"
            >
              Sign in
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

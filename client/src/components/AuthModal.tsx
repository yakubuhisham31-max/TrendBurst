import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { Link } from "wouter";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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


interface AuthModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

declare global {
  interface Window {
    google: any;
  }
}

export function AuthModal({ 
  isOpen, 
  onOpenChange,
  title = "Join Trendx to Continue",
  description = "Sign in or create an account to access this feature"
}: AuthModalProps) {
  const [isSliding, setIsSliding] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Load Google Sign-In SDK
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    // Create persistent hidden container for Google button
    if (!document.getElementById('google-signin-container')) {
      const container = document.createElement('div');
      container.id = 'google-signin-container';
      container.style.display = 'none';
      document.body.appendChild(container);
    }

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      // Check if Google Client ID is configured
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) {
        toast({
          title: "Google Sign-In Not Configured",
          description: "Please use email sign-in. Google OAuth will be available soon.",
          variant: "destructive",
        });
        return;
      }

      // Validate Client ID format (should NOT start with GOCSPX- which is a client secret)
      if (clientId.startsWith('GOCSPX-')) {
        toast({
          title: "Invalid Google Credentials",
          description: "Please provide the Client ID (not Client Secret). Get it from Google Cloud Console.",
          variant: "destructive",
        });
        return;
      }

      // Initialize Google Sign-In
      if (!window.google) {
        toast({
          title: "Google Sign-In Loading",
          description: "Please wait a moment and try again",
        });
        return;
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
      });

      // Render button on persistent hidden container and trigger click
      const container = document.getElementById('google-signin-container');
      if (container) {
        // Clear previous content
        container.innerHTML = '';
        
        window.google.accounts.id.renderButton(container, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
        });
        
        // Find and click the rendered button
        const button = container.querySelector('div[role="button"]') as HTMLElement;
        if (button) {
          button.click();
        }
      }
    } catch (error) {
      console.error('Google Sign-In error:', error);
      toast({
        title: "Error",
        description: "Could not initialize Google Sign-In. Please use email sign-in instead.",
        variant: "destructive",
      });
    }
  };

  const handleCredentialResponse = async (response: any) => {
    try {
      const token = response.credential;
      
      // Decode the JWT to get user info (without verification - for dev purposes)
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      const payload = JSON.parse(jsonPayload);
      
      // Send to backend for authentication
      const response2 = await apiRequest('POST', '/api/auth/google', {
        googleId: payload.sub,
        email: payload.email,
        fullName: payload.name,
      });

      const data = await response2.json();
      
      if (!response2.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      // Check if this is a new user
      if (data.isNewUser) {
        toast({
          title: "Welcome!",
          description: "Let's set up your username and password",
        });
      } else {
        toast({
          title: "Success",
          description: "You have been logged in with Google",
        });
      }

      // Redirect based on backend response
      if (data.redirectTo) {
        setLocation(data.redirectTo);
      } else {
        setLocation('/');
      }
      
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Google authentication failed',
        variant: "destructive",
      });
    }
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
            <GoogleLogo />
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

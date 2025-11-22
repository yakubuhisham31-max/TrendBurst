import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

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

export function AuthModal({ 
  isOpen, 
  onOpenChange,
  title = "Join Trendx to Continue",
  description = "Sign in or create an account to access this feature"
}: AuthModalProps) {

  const [, navigate] = useLocation();

  const handleGoogleAuth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Navigate to Google OAuth endpoint which forces account selection
    window.location.href = "/auth/google";
  };

  const handleEmailAuth = () => {
    onOpenChange(false);
    navigate("/login");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="google" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="google">Google</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
          </TabsList>

          <TabsContent value="google" className="flex flex-col gap-3">
            <button
              type="button"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}
              onClick={handleGoogleAuth}
              data-testid="button-auth-google"
            >
              <GoogleLogo />
              Continue with Google
            </button>

            <div className="text-center text-xs text-muted-foreground mt-2">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </div>
          </TabsContent>

          <TabsContent value="email" className="flex flex-col gap-3">
            <Button
              size="lg"
              className="w-full"
              onClick={handleEmailAuth}
              data-testid="button-auth-email"
            >
              Continue with Email
            </Button>

            <div className="text-center text-xs text-muted-foreground mt-2">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

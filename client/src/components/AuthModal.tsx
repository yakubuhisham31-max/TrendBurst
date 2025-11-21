import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mail, LogIn } from "lucide-react";
import { Link } from "wouter";

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
              // For now, redirect to login. In future, implement Google OAuth
              window.location.href = "/login";
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
            onClick={() => {
              // Google OAuth will be implemented here
              window.location.href = "/api/auth/google";
            }}
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

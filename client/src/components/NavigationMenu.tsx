import { Link, useLocation } from "wouter";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, LogOut, BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import VerificationBadge from "./VerificationBadge";

interface NavigationMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username?: string;
  userAvatar?: string;
  userVerified?: number | boolean | null;
  onLogoutClick?: () => void;
  onAuthModalOpen?: () => void;
}

export default function NavigationMenu({
  open,
  onOpenChange,
  username = "User",
  userAvatar,
  userVerified,
  onLogoutClick,
  onAuthModalOpen,
}: NavigationMenuProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Logged out", description: "You've been signed out" });
      onOpenChange(false);
      window.location.href = "/";
    } catch (error: any) {
      toast({
        title: "Logout failed",
        description: error.message || "Could not log out",
        variant: "destructive"
      });
    }
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72" data-testid="sheet-navigation">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-2">
          {user ? (
            <>
              <Link href="/profile">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 hover-elevate cursor-pointer" onClick={() => onOpenChange(false)}>
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={userAvatar} alt={username} />
                    <AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 min-w-0">
                      <p className="font-medium truncate" data-testid="text-username" title={username}>
                        {username}
                      </p>
                      <VerificationBadge verified={userVerified} size="sm" />
                    </div>
                    <p className="text-sm text-muted-foreground">View Profile</p>
                  </div>
                </div>
              </Link>

              <Link href="/profile">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => onOpenChange(false)}
                  data-testid="button-profile"
                >
                  <User className="w-5 h-5" />
                  Profile
                </Button>
              </Link>

              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => onOpenChange(false)}
                  data-testid="button-dashboard"
                >
                  <BarChart3 className="w-5 h-5" />
                  Dashboard
                </Button>
              </Link>

              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="w-5 h-5" />
                Log Out
              </Button>
            </>
          ) : (
            <Button
              className="w-full"
              onClick={() => {
                onOpenChange(false);
                onAuthModalOpen?.();
              }}
              data-testid="button-sign-in-menu"
            >
              Sign In to Continue
            </Button>
          )}
        </div>

        <div className="absolute bottom-4 left-0 right-0 px-6">
          <p className="text-xs text-center text-muted-foreground" data-testid="text-copyright">
            © 2025 TrendX. All rights reserved.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

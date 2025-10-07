import { Link } from "wouter";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, LogOut, BarChart3 } from "lucide-react";

interface NavigationMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username?: string;
  userAvatar?: string;
  onLogoutClick?: () => void;
}

export default function NavigationMenu({
  open,
  onOpenChange,
  username = "User",
  userAvatar,
  onLogoutClick,
}: NavigationMenuProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72" data-testid="sheet-navigation">
        <SheetHeader>
          <SheetTitle>Trendz</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-2">
          <Link href="/profile">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 hover-elevate cursor-pointer" onClick={() => onOpenChange(false)}>
              <Avatar className="w-12 h-12">
                <AvatarImage src={userAvatar} alt={username} />
                <AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium" data-testid="text-username">
                  {username}
                </p>
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
            onClick={onLogoutClick}
            data-testid="button-logout"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

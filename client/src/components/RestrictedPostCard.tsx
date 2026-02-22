import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

interface RestrictedPostCardProps {
  onUnblur: () => void;
  mediaType?: "image" | "video";
}

export function RestrictedPostCard({ onUnblur, mediaType = "image" }: RestrictedPostCardProps) {
  return (
    <Card className="relative w-full aspect-square bg-muted overflow-hidden group">
      <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
        <button
          onClick={onUnblur}
          className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/60 transition-colors"
          data-testid="button-view-restricted"
        >
          <div className="flex flex-col items-center gap-2">
            <Lock className="w-8 h-8 text-white" />
            <span className="text-white font-semibold text-sm">Click to view</span>
          </div>
        </button>
      </div>
    </Card>
  );
}

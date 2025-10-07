import { useState } from "react";
import { Button } from "@/components/ui/button";

interface FollowButtonProps {
  username: string;
  initialFollowing?: boolean;
  size?: "default" | "sm" | "lg";
  variant?: "default" | "outline" | "ghost";
  className?: string;
}

export default function FollowButton({ 
  username, 
  initialFollowing = false, 
  size = "sm",
  variant = "outline",
  className = ""
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFollowing(!isFollowing);
    console.log(isFollowing ? `Unfollowed ${username}` : `Followed ${username}`);
  };

  return (
    <Button
      size={size}
      variant={isFollowing ? "secondary" : variant}
      onClick={handleClick}
      className={`flex-shrink-0 ${className}`}
      data-testid={`button-follow-${username}`}
    >
      {isFollowing ? "Following" : "Follow"}
    </Button>
  );
}

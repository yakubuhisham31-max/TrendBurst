import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FollowButtonProps {
  username: string;
  size?: "default" | "sm" | "lg";
  variant?: "default" | "outline" | "ghost";
  className?: string;
}

export default function FollowButton({ 
  username, 
  size = "sm",
  variant = "outline",
  className = ""
}: FollowButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch user by username to get userId
  const { data: targetUser } = useQuery<{ id: string; username: string }>({
    queryKey: ["/api/users", username],
    enabled: !!username && !!user,
  });

  // Fetch follow status
  const { data: followStatus, isLoading } = useQuery<{ isFollowing: boolean }>({
    queryKey: ["/api/follows", targetUser?.id, "status"],
    enabled: !!targetUser?.id && !!user,
  });

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      if (!targetUser?.id) throw new Error("User not found");
      const response = await apiRequest("POST", "/api/follows", {
        followingId: targetUser.id,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/follows", targetUser?.id, "status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", username] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to follow",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Unfollow mutation
  const unfollowMutation = useMutation({
    mutationFn: async () => {
      if (!targetUser?.id) throw new Error("User not found");
      await apiRequest("DELETE", `/api/follows/${targetUser.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/follows", targetUser?.id, "status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", username] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to unfollow",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to follow users.",
        variant: "destructive",
      });
      return;
    }

    if (followStatus?.isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  const isFollowing = followStatus?.isFollowing || false;
  const isPending = followMutation.isPending || unfollowMutation.isPending;

  return (
    <Button
      size={size}
      variant={isFollowing ? "secondary" : variant}
      onClick={handleClick}
      disabled={isLoading || isPending || !user}
      className={`flex-shrink-0 ${className}`}
      data-testid={`button-follow-${username}`}
    >
      {isFollowing ? "Following" : "Follow"}
    </Button>
  );
}

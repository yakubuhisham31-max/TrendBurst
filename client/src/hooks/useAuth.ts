import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "./use-toast";

interface User {
  id: string;
  email?: string;
  username?: string;
  fullName?: string;
  bio?: string;
  profilePicture?: string;
  followers?: number;
  following?: number;
  verified?: number;
  [key: string]: any;
}

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });
  const { toast } = useToast();

  const logout = async () => {
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
      window.location.href = "/";
    } catch (error: any) {
      toast({
        title: "Logout failed",
        description: error.message || "Could not log out",
        variant: "destructive"
      });
    }
  };

  return {
    user: user as User | undefined,
    isLoading,
    isAuthenticated: !!user,
    logout,
  };
}

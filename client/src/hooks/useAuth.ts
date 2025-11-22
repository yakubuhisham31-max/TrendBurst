import { useQuery } from "@tanstack/react-query";

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

  return {
    user: user as User | undefined,
    isLoading,
    isAuthenticated: !!user,
  };
}

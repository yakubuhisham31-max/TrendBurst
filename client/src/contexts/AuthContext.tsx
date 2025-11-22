import { createContext, useContext, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { initializeOneSignal, updateOneSignalUserId } from "@/lib/onesignal";
import type { User } from "@shared/schema";

export interface RegisterData {
  username: string;
  email: string;
  fullName: string;
  password: string;
  profilePicture?: string;
  categories?: string[];
  role?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  checkAuth: () => Promise<void>;
  isLoggedOut: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const { data, isLoading, refetch } = useQuery<{ user: User } | null>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: 1,
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (data?.user) {
      setUser(data.user);
      initializeOneSignal(data.user.id);
    } else {
      setUser(null);
    }
  }, [data]);

  const login = async () => {
    // OAuth login - redirect to Replit Auth
    window.location.href = "/api/login";
  };

  const logout = async () => {
    try {
      // Call logout endpoint
      await apiRequest("POST", "/api/auth/logout", {});
    } catch (error) {
      console.error("Logout API error:", error);
      // Continue with logout even if API fails
    }
    
    // Clear user state immediately
    setUser(null);
    
    // Refetch to confirm we're logged out
    try {
      await refetch();
    } catch (error) {
      console.error("Refetch error:", error);
    }

    // Redirect to home after logout
    window.location.href = "/";
  };

  const register = async () => {
    // OAuth registration - redirect to Replit Auth
    window.location.href = "/api/login";
  };

  const checkAuth = async () => {
    await refetch();
  };

  const isLoggedOut = () => !user && !isLoading;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: isLoading,
        login,
        logout,
        register,
        checkAuth,
        isLoggedOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

import { createContext, useContext, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const { data, isLoading, refetch } = useQuery<{ user: User } | null>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    if (data?.user) {
      setUser(data.user);
    } else {
      setUser(null);
    }
  }, [data]);

  const login = async (username: string, password: string) => {
    const response = await apiRequest("POST", "/api/auth/login", {
      username,
      password,
    });
    const { user } = await response.json();
    setUser(user);
  };

  const logout = async () => {
    await apiRequest("POST", "/api/auth/logout", {});
    setUser(null);
  };

  const register = async (data: RegisterData) => {
    const response = await apiRequest("POST", "/api/auth/register", data);
    const { user } = await response.json();
    setUser(user);
  };

  const checkAuth = async () => {
    await refetch();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: isLoading,
        login,
        logout,
        register,
        checkAuth,
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

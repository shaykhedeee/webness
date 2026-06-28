// Auth state management using React Context

import { useState, useEffect, useContext, createContext, type ReactNode } from "react";
import api from "../lib/api";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  orgId: string;
  favoriteShape?: string;
  organization: {
    name: string;
    slug: string;
    plan: string;
  };
  creditBalance: number;
}

interface AuthMeResponse {
  user: Omit<User, "organization" | "creditBalance">;
  org: User["organization"];
  credits: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("webness_token");
      if (!token) {
        setUser(null);
        return;
      }
      const { data } = await api.get("/auth/me");
      const payload = data.data as AuthMeResponse;
      setUser({
        ...payload.user,
        organization: payload.org,
        creditBalance: payload.credits,
      });
    } catch {
      setUser(null);
      localStorage.removeItem("webness_token");
      localStorage.removeItem("webness_refresh");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("webness_token", data.data.token);
    localStorage.setItem("webness_refresh", data.data.refreshToken);
    await fetchUser();
  };

  const logout = () => {
    localStorage.removeItem("webness_token");
    localStorage.removeItem("webness_refresh");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, logout, refetch: fetchUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiGetProfile, apiLogin } from "@/lib/api/auth";

interface AdminAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined,
);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const hydrateSession = async () => {
      const adminSession = localStorage.getItem("admin_session");
      const token = localStorage.getItem("access_token");
      if (adminSession !== "true" || !token) {
        setIsLoading(false);
        return;
      }

      try {
        await apiGetProfile();
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem("admin_session");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    hydrateSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const data = await apiLogin({ email, password });
      if (data?.access && data?.refresh) {
        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);
      }
      localStorage.setItem("admin_session", "true");
      localStorage.setItem("admin_session_at", String(Date.now()));
      setIsAuthenticated(true);
      return true;
    } catch {
      localStorage.removeItem("admin_session");
      setIsAuthenticated(false);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("admin_session");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setIsAuthenticated(false);
    router.push("/admin");
  };

  // Protect routes
  useEffect(() => {
    if (
      !isLoading &&
      !isAuthenticated &&
      pathname.startsWith("/admin") &&
      pathname !== "/admin"
    ) {
      router.push("/admin");
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  return (
    <AdminAuthContext.Provider
      value={{ isAuthenticated, isLoading, login, logout }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}

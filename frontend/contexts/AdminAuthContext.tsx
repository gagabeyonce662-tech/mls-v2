"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiAdminLogin } from "@/lib/api/auth";

interface AdminAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined,
);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return (
      typeof window !== "undefined" &&
      window.localStorage.getItem("admin_session") === "true"
    );
  });
  const [isLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const login = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const data = await apiAdminLogin({ email: normalizedEmail, password });

    localStorage.setItem("admin_session", "true");
    localStorage.setItem("admin_access_token", data.access);
    localStorage.setItem("admin_refresh_token", data.refresh);
    localStorage.setItem(
      "admin_user",
      JSON.stringify(data.user ?? { email: normalizedEmail }),
    );
    localStorage.setItem("admin_session_at", String(Date.now()));
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem("admin_session");
    localStorage.removeItem("admin_access_token");
    localStorage.removeItem("admin_refresh_token");
    localStorage.removeItem("admin_user");
    localStorage.removeItem("admin_session_at");
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
  return context
}

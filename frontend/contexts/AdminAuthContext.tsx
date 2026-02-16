"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface AdminAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (password: string) => boolean;
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

  // The secret passphrase - in a real app this would be more secure,
  // but for a client-side gate without backend auth, this is the pattern.
  const ADMIN_PASSPHRASE = process.env.NEXT_PUBLIC_ADMIN_PASSPHRASE;

  useEffect(() => {
    // Check for existing session
    const session = localStorage.getItem("admin_session");
    if (session === "true") {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = (password: string) => {
    if (password === ADMIN_PASSPHRASE) {
      localStorage.setItem("admin_session", "true");
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem("admin_session");
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

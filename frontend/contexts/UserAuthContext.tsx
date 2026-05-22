"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  apiLogin,
  apiRegister,
  apiGetProfile,
  apiRefreshToken,
  apiGoogleAuth,
  apiGoogleAuthCode,
  apiFacebookAuthCode,
  apiSendOtp,
  apiVerifyOtp,
} from "@/lib/api/auth";
import { getJwtExpiryMs, isJwtExpired } from "@/lib/auth/jwt";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  phone_verified?: boolean;
  avatar?: string;
}

interface UserAuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  googleLoginWithCode: (code: string) => Promise<void>;
  facebookLoginWithCode: (code: string, redirectUri?: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; phone: string }) => Promise<void>;
  logout: () => void;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const UserAuthContext = createContext<UserAuthContextType | undefined>(
  undefined,
);

export function UserAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("user_session");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }, []);

  const loadProfile = useCallback(async () => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      setIsLoading(false);
      return;
    }
    if (isJwtExpired(accessToken)) {
      logout();
      setIsLoading(false);
      return;
    }

    try {
      const userData = await apiGetProfile();
      setUser(userData);
      localStorage.setItem("user_session", JSON.stringify(userData));
    } catch (error: any) {
      console.error("Failed to load user profile", error);
      
      // If unauthorized, try to refresh
      if (error.message.includes("401")) {
        const refresh = localStorage.getItem("refresh_token");
        if (refresh) {
          try {
            const tokens = await apiRefreshToken(refresh);
            localStorage.setItem("access_token", tokens.access);
            // Retry loading profile
            const userData = await apiGetProfile();
            setUser(userData);
            localStorage.setItem("user_session", JSON.stringify(userData));
          } catch (refreshError) {
            logout();
          }
        } else {
          logout();
        }
      } else {
        logout();
      }
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) return;

    const expiryMs = getJwtExpiryMs(accessToken);
    if (!expiryMs) {
      logout();
      return;
    }

    const delayMs = expiryMs - Date.now();
    if (delayMs <= 0) {
      logout();
      return;
    }

    const timeoutId = window.setTimeout(() => {
      logout();
    }, delayMs);

    return () => window.clearTimeout(timeoutId);
  }, [user, logout]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await apiLogin({ email, password });
      
      // Store tokens
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      
      setUser(data.user);
      localStorage.setItem("user_session", JSON.stringify(data.user));
    } catch (error) {
      console.error("Login failed", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (regData: { name: string; email: string; password: string; phone: string }) => {
    setIsLoading(true);
    try {
      await apiRegister(regData);
    } catch (error) {
      console.error("Registration failed", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async (idToken: string) => {
    setIsLoading(true);
    try {
      const data = await apiGoogleAuth(idToken);
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      setUser(data.user);
      localStorage.setItem("user_session", JSON.stringify(data.user));
    } catch (error) {
      console.error("Google login failed", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const googleLoginWithCode = async (code: string) => {
    setIsLoading(true);
    try {
      const data = await apiGoogleAuthCode(code);
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      setUser(data.user);
      localStorage.setItem("user_session", JSON.stringify(data.user));
    } catch (error) {
      console.error("Google OAuth code login failed", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const facebookLoginWithCode = async (code: string, redirectUri?: string) => {
    setIsLoading(true);
    try {
      const data = await apiFacebookAuthCode(code, redirectUri);
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      setUser(data.user);
      localStorage.setItem("user_session", JSON.stringify(data.user));
    } catch (error) {
      console.error("Facebook OAuth code login failed", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = useCallback(async () => {
    const userData = await apiGetProfile();
    setUser(userData);
    localStorage.setItem("user_session", JSON.stringify(userData));
  }, []);

  const sendOtp = async (phone: string) => {
    await apiSendOtp(phone);
  };

  const verifyOtp = async (phone: string, code: string) => {
    await apiVerifyOtp(phone, code);
    await refreshProfile();
  };

  return (
    <UserAuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        googleLogin,
        googleLoginWithCode,
        facebookLoginWithCode,
        register,
        logout,
        sendOtp,
        verifyOtp,
        refreshProfile,
      }}
    >
      {children}
    </UserAuthContext.Provider>
  );
}

export function useUserAuth() {
  const context = useContext(UserAuthContext);
  if (context === undefined) {
    throw new Error("useUserAuth must be used within a UserAuthProvider");
  }
  return context;
}

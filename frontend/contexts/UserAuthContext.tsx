"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  apiLogin,
  apiRegister,
  apiGetProfile,
  apiRefreshToken,
  apiGoogleAuth,
  apiGoogleAuthCode,
  apiSendOtp,
  apiVerifyOtp,
} from "@/lib/api/auth";
import { isJwtExpired } from "@/lib/auth/jwt";

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
  register: (data: {
    name: string;
    email: string;
    password: string;
    phone: string;
  }) => Promise<void>;
  loginWithTokens: (data: {
    access: string;
    refresh: string;
    user: User;
  }) => void;
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
    const refreshToken = localStorage.getItem("refresh_token");

    if (!accessToken && !refreshToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      if (!accessToken || isJwtExpired(accessToken)) {
        if (!refreshToken) {
          logout();
          return;
        }

        const tokens = await apiRefreshToken(refreshToken);
        localStorage.setItem("access_token", tokens.access);
      }

      const userData = await apiGetProfile();

      setUser(userData);
      localStorage.setItem("user_session", JSON.stringify(userData));
    } catch (error) {
      console.error("Failed to restore user session", error);
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    loadProfile();

    const handleStorageChange = (event: StorageEvent) => {
      if (
        event.key === "access_token" ||
        event.key === "refresh_token" ||
        event.key === "user_session"
      ) {
        loadProfile();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [loadProfile]);

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

  const register = async (regData: {
    name: string;
    email: string;
    password: string;
    phone: string;
  }) => {
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

  const refreshProfile = useCallback(async () => {
    const userData = await apiGetProfile();
    setUser(userData);
    localStorage.setItem("user_session", JSON.stringify(userData));
  }, []);

  const loginWithTokens = (data: {
    access: string;
    refresh: string;
    user: User;
  }) => {
    localStorage.setItem("access_token", data.access);
    localStorage.setItem("refresh_token", data.refresh);
    localStorage.setItem("user_session", JSON.stringify(data.user));
    setUser(data.user);
  };

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
        register,
        loginWithTokens,
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

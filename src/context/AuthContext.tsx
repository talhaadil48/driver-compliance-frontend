"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { StaffUser } from "@/types";
import { apiFetch } from "@/lib/api";

interface AuthContextType {
  staffUser: StaffUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem("staff_access_token");
      if (!token) {
        setStaffUser(null);
        setIsLoading(false);
        return;
      }
      const user = await apiFetch<StaffUser>("/auth/me");
      setStaffUser(user);
    } catch {
      localStorage.removeItem("staff_access_token");
      setStaffUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();

    const handleUnauthorized = () => {
      setStaffUser(null);
    };
    window.addEventListener("auth_unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth_unauthorized", handleUnauthorized);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiFetch<{ access_token: string; staff: StaffUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem("staff_access_token", res.access_token);
    setStaffUser(res.staff);
  };

  const logout = () => {
    localStorage.removeItem("staff_access_token");
    setStaffUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        staffUser,
        isAuthenticated: !!staffUser,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

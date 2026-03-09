"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "passenger" | "driver" | "operator";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  licenseNumber?: string;
  vehiclePlate?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  driverStatus?: "pending" | "verified";
  driverEarnings?: number;
  companyName?: string;
  fleetSize?: number;
  operatorStatus?: "pending" | "verified";
}

interface SignupData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  licenseNumber?: string;
  vehiclePlate?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  companyName?: string;
  fleetSize?: number;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => { success: boolean; error?: string };
  signup: (data: SignupData) => { success: boolean; error?: string };
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("quallor_current_user");
    if (stored) setUser(JSON.parse(stored));
    setIsLoading(false);
  }, []);

  function getAllUsers(): Record<string, { user: User; password: string }> {
    const stored = localStorage.getItem("quallor_users");
    return stored ? JSON.parse(stored) : {};
  }

  function login(email: string, password: string) {
    const users = getAllUsers();
    const match = users[email];
    if (!match) return { success: false, error: "No account found with this email." };
    if (match.password !== password) return { success: false, error: "Incorrect password." };
    setUser(match.user);
    localStorage.setItem("quallor_current_user", JSON.stringify(match.user));
    return { success: true };
  }

  function signup(data: SignupData) {
    const users = getAllUsers();
    if (users[data.email]) return { success: false, error: "An account with this email already exists." };

    const newUser: User = {
      id: `USR-${Date.now()}`,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      ...(data.role === "driver" && {
        licenseNumber: data.licenseNumber,
        vehiclePlate: data.vehiclePlate,
        vehicleModel: data.vehicleModel || "Toyota Quantum",
        vehicleColor: data.vehicleColor,
        driverStatus: "pending",
        driverEarnings: 0,
      }),
      ...(data.role === "operator" && {
        companyName: data.companyName,
        fleetSize: data.fleetSize || 0,
        operatorStatus: "pending",
      }),
    };

    users[data.email] = { user: newUser, password: data.password };
    localStorage.setItem("quallor_users", JSON.stringify(users));
    setUser(newUser);
    localStorage.setItem("quallor_current_user", JSON.stringify(newUser));
    return { success: true };
  }

  function logout() {
    setUser(null);
    localStorage.removeItem("quallor_current_user");
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

/**
 * Four roles, three of them operational and one back-office.
 *
 * "operator" runs a fleet day to day and sees only their own vehicles.
 * "fleet" is the fleet manager, a Quallor role that owns the vehicle register
 * across every operator: adding vehicles, running assessments and taking
 * vehicles off the road are their job, not the operator's.
 */
export type UserRole = "passenger" | "driver" | "operator" | "fleet";

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
  /** Fleet manager staff number, used on assessment records. */
  staffNumber?: string;
  /** Set on a driver once their vehicle is on the register. */
  vehicleId?: string;
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
  staffNumber?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => { success: boolean; error?: string };
  signup: (data: SignupData) => { success: boolean; error?: string };
  logout: () => void;
  updateUser: (patch: Partial<User>) => { success: boolean; error?: string };
  changePassword: (current: string, next: string) => { success: boolean; error?: string };
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
      ...(data.role === "fleet" && {
        staffNumber: data.staffNumber,
        companyName: "Quallor Fleet Office",
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

  /**
   * Edit the signed-in account. Changing the email re-keys the user record,
   * since accounts are stored by email address.
   */
  function updateUser(patch: Partial<User>) {
    if (!user) return { success: false, error: "You are not signed in." };

    const users = getAllUsers();
    const existing = users[user.email];
    if (!existing) return { success: false, error: "Account record not found." };

    const nextEmail = patch.email?.trim() || user.email;
    if (nextEmail !== user.email && users[nextEmail]) {
      return { success: false, error: "That email is already used by another account." };
    }

    const updated: User = { ...user, ...patch, email: nextEmail, id: user.id, role: user.role };

    if (nextEmail !== user.email) delete users[user.email];
    users[nextEmail] = { user: updated, password: existing.password };

    localStorage.setItem("quallor_users", JSON.stringify(users));
    localStorage.setItem("quallor_current_user", JSON.stringify(updated));
    setUser(updated);
    return { success: true };
  }

  function changePassword(current: string, next: string) {
    if (!user) return { success: false, error: "You are not signed in." };
    const users = getAllUsers();
    const record = users[user.email];
    if (!record) return { success: false, error: "Account record not found." };
    if (record.password !== current) return { success: false, error: "Your current password is incorrect." };
    if (next.length < 6) return { success: false, error: "Use at least 6 characters." };
    if (next === current) return { success: false, error: "Choose a password you have not used before." };

    users[user.email] = { ...record, password: next };
    localStorage.setItem("quallor_users", JSON.stringify(users));
    return { success: true };
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, updateUser, changePassword, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

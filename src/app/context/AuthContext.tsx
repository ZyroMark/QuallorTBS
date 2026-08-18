"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { type ProvinceId, toProvinceId } from "@/lib/places";

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
  /** The metro network this account travels in. Scopes every destination list. */
  homeProvince: ProvinceId;
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
  homeProvince?: ProvinceId;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  /** Set when the action worked but the account still needs an emailed confirmation. */
  notice?: string;
  /**
   * The signed-in profile, returned so a caller can route on role immediately.
   * React state has not necessarily re-rendered by the time the promise
   * resolves, so reading `user` from the hook straight after an await can still
   * give the previous value.
   */
  user?: User;
}

/**
 * Every mutating call is asynchronous now: they cross the network to Supabase
 * rather than touching localStorage. Callers must await the result.
 */
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (data: SignupData) => Promise<AuthResult>;
  logout: () => Promise<void>;
  updateUser: (patch: Partial<User>) => Promise<AuthResult>;
  changePassword: (current: string, next: string) => Promise<AuthResult>;
  /** Re-reads the signed-in user's profile row, after a fleet office change. */
  refresh: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

/** The shape of a public.profiles row, as PostgREST returns it. */
interface ProfileRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  license_number: string | null;
  vehicle_plate: string | null;
  vehicle_model: string | null;
  vehicle_color: string | null;
  driver_status: "pending" | "verified" | null;
  driver_earnings: number | string | null;
  company_name: string | null;
  fleet_size: number | null;
  operator_status: "pending" | "verified" | null;
  staff_number: string | null;
  vehicle_id: string | null;
  home_province: string | null;
}

/** Column names are snake_case in Postgres and camelCase through the app. */
function fromRow(row: ProfileRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    licenseNumber: row.license_number ?? undefined,
    vehiclePlate: row.vehicle_plate ?? undefined,
    vehicleModel: row.vehicle_model ?? undefined,
    vehicleColor: row.vehicle_color ?? undefined,
    driverStatus: row.driver_status ?? undefined,
    // numeric(12,2) arrives as a string from PostgREST.
    driverEarnings: row.driver_earnings === null ? undefined : Number(row.driver_earnings),
    companyName: row.company_name ?? undefined,
    fleetSize: row.fleet_size ?? undefined,
    operatorStatus: row.operator_status ?? undefined,
    staffNumber: row.staff_number ?? undefined,
    vehicleId: row.vehicle_id ?? undefined,
    homeProvince: toProvinceId(row.home_province),
  };
}

/**
 * The subset of a profile a user may edit themselves. role, driver_status,
 * operator_status, driver_earnings and vehicle_id are deliberately absent: the
 * database rejects those with a 42501 regardless of what is sent here.
 */
function toEditableRow(patch: Partial<User>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.email !== undefined) row.email = patch.email;
  if (patch.phone !== undefined) row.phone = patch.phone;
  if (patch.licenseNumber !== undefined) row.license_number = patch.licenseNumber;
  if (patch.vehiclePlate !== undefined) row.vehicle_plate = patch.vehiclePlate;
  if (patch.vehicleModel !== undefined) row.vehicle_model = patch.vehicleModel;
  if (patch.vehicleColor !== undefined) row.vehicle_color = patch.vehicleColor;
  if (patch.companyName !== undefined) row.company_name = patch.companyName;
  if (patch.fleetSize !== undefined) row.fleet_size = patch.fleetSize;
  if (patch.staffNumber !== undefined) row.staff_number = patch.staffNumber;
  if (patch.homeProvince !== undefined) row.home_province = patch.homeProvince;
  return row;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(
    async (userId: string): Promise<User | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (error || !data) return null;
      return fromRow(data as ProfileRow);
    },
    [supabase]
  );

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setUser(data.session ? await loadProfile(data.session.user.id) : null);
      if (active) setIsLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (!session) {
        setUser(null);
        return;
      }
      // supabase-js warns against awaiting its own calls inside this callback,
      // so the profile read is deferred out of the auth lock.
      setTimeout(() => {
        void (async () => {
          const profile = await loadProfile(session.user.id);
          if (active) setUser(profile);
        })();
      }, 0);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase, loadProfile]);

  async function login(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      // Supabase answers a wrong password and an unknown address identically,
      // on purpose: saying which one is wrong tells an attacker who has an
      // account here.
      if (error.message.toLowerCase().includes("email not confirmed")) {
        return { success: false, error: "Confirm your email address before signing in." };
      }
      return { success: false, error: "That email and password do not match an account." };
    }

    const profile = data.user ? await loadProfile(data.user.id) : null;
    if (!profile) {
      return { success: false, error: "Signed in, but your profile could not be loaded." };
    }
    setUser(profile);
    return { success: true, user: profile };
  }

  async function signup(data: SignupData): Promise<AuthResult> {
    const { data: result, error } = await supabase.auth.signUp({
      email: data.email.trim(),
      password: data.password,
      // handle_new_user() reads these to build the profiles row.
      options: {
        data: {
          name: data.name,
          phone: data.phone,
          role: data.role,
          license_number: data.licenseNumber ?? null,
          vehicle_plate: data.vehiclePlate ?? null,
          vehicle_model: data.vehicleModel || (data.role === "driver" ? "Toyota Quantum" : null),
          vehicle_color: data.vehicleColor ?? null,
          company_name: data.companyName ?? null,
          fleet_size: data.fleetSize ?? null,
          staff_number: data.staffNumber ?? null,
          home_province: data.homeProvince ?? "eastern-cape",
        },
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes("already registered")) {
        return { success: false, error: "An account with this email already exists." };
      }
      return { success: false, error: error.message };
    }

    // No session means the project has email confirmation switched on, so the
    // account exists but cannot be used until the link is clicked.
    if (!result.session) {
      return {
        success: true,
        notice: "Check your email for a confirmation link, then sign in.",
      };
    }

    const profile = result.user ? await loadProfile(result.user.id) : null;
    if (!profile) {
      return { success: false, error: "Account created, but your profile could not be loaded." };
    }
    setUser(profile);
    return { success: true, user: profile };
  }

  async function logout(): Promise<void> {
    await supabase.auth.signOut();
    setUser(null);
  }

  /**
   * Edit the signed-in account. Role and verification status are not editable
   * here: the database refuses them, which is the point.
   */
  async function updateUser(patch: Partial<User>): Promise<AuthResult> {
    if (!user) return { success: false, error: "You are not signed in." };

    const changes = toEditableRow(patch);
    if (Object.keys(changes).length === 0) return { success: true };

    const nextEmail = typeof changes.email === "string" ? changes.email.trim() : undefined;
    let notice: string | undefined;

    // The login address lives in auth.users, so it has to change there too, and
    // Supabase confirms that by email before it takes effect.
    if (nextEmail && nextEmail !== user.email) {
      const { error: authError } = await supabase.auth.updateUser({ email: nextEmail });
      if (authError) return { success: false, error: authError.message };
      notice = "Confirm the change from the email we just sent before signing in with the new address.";
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(changes)
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      if (error.code === "42501") {
        return { success: false, error: "That change is not yours to make." };
      }
      if (error.code === "23505") {
        return { success: false, error: "That email is already used by another account." };
      }
      return { success: false, error: error.message };
    }

    const updated = fromRow(data as ProfileRow);
    setUser(updated);
    return { success: true, notice, user: updated };
  }

  async function changePassword(current: string, next: string): Promise<AuthResult> {
    if (!user) return { success: false, error: "You are not signed in." };
    if (next.length < 6) return { success: false, error: "Use at least 6 characters." };
    if (next === current) return { success: false, error: "Choose a password you have not used before." };

    // updateUser does not ask for the old password, so it is checked here by
    // signing in with it. Without this anyone with an unlocked tab could
    // silently take the account over.
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: current,
    });
    if (reauthError) return { success: false, error: "Your current password is incorrect." };

    const { error } = await supabase.auth.updateUser({ password: next });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    setUser(data.session ? await loadProfile(data.session.user.id) : null);
  }, [supabase, loadProfile]);

  return (
    <AuthContext.Provider
      value={{ user, login, signup, logout, updateUser, changePassword, refresh, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

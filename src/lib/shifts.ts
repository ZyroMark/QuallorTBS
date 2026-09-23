"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/context/AuthContext";

/**
 * Driver shifts: clock-in, clock-out and online status.
 *
 * All three are written by database functions (clock_in, clock_out,
 * set_driver_online in 0006_driver_shifts.sql), never by a table write from
 * here, so the rules about roadworthy vehicles and the operator's shift limit
 * hold whichever device the request comes from. The driver device and the
 * gaatjie device share the driver's account and therefore the same shift.
 */

export type ShiftEndReason = "driver" | "shift-limit" | "vehicle-off-road";

export interface DriverShift {
    id: string;
    driverId: string;
    vehicleId?: string;
    plate: string;
    clockedInAt: string;
    clockedOutAt?: string;
    endReason?: ShiftEndReason;
    maxShiftHours: number;
    online: boolean;
    onlineChangedAt: string;
}

interface ShiftRow {
    id: string | null;
    driver_id: string;
    vehicle_id: string | null;
    plate: string;
    clocked_in_at: string;
    clocked_out_at: string | null;
    end_reason: ShiftEndReason | null;
    max_shift_hours: number;
    online: boolean;
    online_changed_at: string;
}

/** A function returning a composite type sends back an all-null row for "none". */
function shiftFromRow(row: ShiftRow | null): DriverShift | null {
    if (!row || !row.id) return null;
    return {
        id: row.id,
        driverId: row.driver_id,
        vehicleId: row.vehicle_id ?? undefined,
        plate: row.plate,
        clockedInAt: row.clocked_in_at,
        clockedOutAt: row.clocked_out_at ?? undefined,
        endReason: row.end_reason ?? undefined,
        maxShiftHours: row.max_shift_hours,
        online: row.online,
        onlineChangedAt: row.online_changed_at,
    };
}

export function shiftEndsAt(s: DriverShift): number {
    return new Date(s.clockedInAt).getTime() + s.maxShiftHours * 3_600_000;
}

/** Milliseconds worked, up to now for an open shift and never past its limit. */
export function shiftDuration(s: DriverShift, now = Date.now()): number {
    const end = s.clockedOutAt ? new Date(s.clockedOutAt).getTime() : Math.min(now, shiftEndsAt(s));
    return Math.max(0, end - new Date(s.clockedInAt).getTime());
}

export function formatDuration(ms: number): string {
    const mins = Math.floor(ms / 60_000);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}

export function formatClock(iso: string): string {
    return new Date(iso).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
}

function startOfToday(): string {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
}

/** Re-read often enough that the gaatjie device follows the driver device. */
const POLL_MS = 30_000;

export interface ShiftResult {
    success: boolean;
    error?: string;
}

/** The signed-in driver's current shift, and today's finished ones. */
export function useDriverShift() {
    const supabase = useMemo(() => createClient(), []);
    const { user } = useAuth();
    const [shift, setShift] = useState<DriverShift | null>(null);
    const [today, setToday] = useState<DriverShift[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [now, setNow] = useState(() => Date.now());

    const refresh = useCallback(async () => {
        if (!user || user.role !== "driver") {
            setShift(null);
            setToday([]);
            setIsLoading(false);
            return;
        }
        const { data, error } = await supabase
            .from("driver_shifts")
            .select("*")
            .eq("driver_id", user.id)
            .or(`clocked_out_at.is.null,clocked_in_at.gte."${startOfToday()}"`)
            .order("clocked_in_at", { ascending: false });

        if (!error) {
            const rows = ((data ?? []) as ShiftRow[]).map(shiftFromRow).filter((s): s is DriverShift => s !== null);
            setShift(rows.find((s) => !s.clockedOutAt) ?? null);
            setToday(rows);
        }
        setIsLoading(false);
    }, [supabase, user]);

    useEffect(() => {
        queueMicrotask(() => void refresh());
        const poll = setInterval(() => void refresh(), POLL_MS);
        const onFocus = () => void refresh();
        window.addEventListener("focus", onFocus);
        return () => {
            clearInterval(poll);
            window.removeEventListener("focus", onFocus);
        };
    }, [refresh]);

    // Tick once a minute for the timer, and close the shift in the database the
    // moment it passes the operator's limit rather than waiting for the driver.
    useEffect(() => {
        const tick = setInterval(() => setNow(Date.now()), 60_000);
        return () => clearInterval(tick);
    }, []);

    const expired = Boolean(shift && now >= shiftEndsAt(shift));
    useEffect(() => {
        if (!expired) return;
        void supabase.rpc("clock_out").then(() => refresh());
    }, [expired, supabase, refresh]);

    async function call(fn: string, args?: Record<string, unknown>): Promise<ShiftResult> {
        setBusy(true);
        const { error } = await supabase.rpc(fn, args);
        await refresh();
        setBusy(false);
        if (error) {
            const offline = typeof navigator !== "undefined" && !navigator.onLine;
            return { success: false, error: offline ? "You are offline. Clocking in needs a connection." : error.message };
        }
        return { success: true };
    }

    const workedToday = today.reduce((a, s) => a + shiftDuration(s, now), 0);

    return {
        shift,
        onShift: Boolean(shift),
        online: Boolean(shift?.online),
        workedToday,
        now,
        isLoading,
        busy,
        clockIn: () => call("clock_in"),
        clockOut: () => call("clock_out"),
        setOnline: (online: boolean) => call("set_driver_online", { is_online: online }),
        refresh,
    };
}

/**
 * Today's shifts on the vehicles the caller can see, for the operator console.
 * RLS limits the rows to the operator's own vehicles (or everything, for the
 * fleet office).
 */
export function useVehicleShifts() {
    const supabase = useMemo(() => createClient(), []);
    const { user } = useAuth();
    const [shifts, setShifts] = useState<DriverShift[]>([]);
    const [now, setNow] = useState(() => Date.now());

    const refresh = useCallback(async () => {
        if (!user) {
            setShifts([]);
            return;
        }
        const { data, error } = await supabase
            .from("driver_shifts")
            .select("*")
            .or(`clocked_out_at.is.null,clocked_in_at.gte."${startOfToday()}"`)
            .order("clocked_in_at", { ascending: false });
        if (!error) {
            setShifts(((data ?? []) as ShiftRow[]).map(shiftFromRow).filter((s): s is DriverShift => s !== null));
        }
        setNow(Date.now());
    }, [supabase, user]);

    useEffect(() => {
        queueMicrotask(() => void refresh());
        const poll = setInterval(() => void refresh(), POLL_MS);
        return () => clearInterval(poll);
    }, [refresh]);

    /** The open shift and today's total for one vehicle. */
    function forVehicle(vehicleId: string) {
        const mine = shifts.filter((s) => s.vehicleId === vehicleId);
        const open = mine.find((s) => !s.clockedOutAt && now < shiftEndsAt(s)) ?? null;
        const last = mine.find((s) => s.clockedOutAt) ?? null;
        return {
            open,
            last,
            workedToday: mine.reduce((a, s) => a + shiftDuration(s, now), 0),
        };
    }

    return { shifts, forVehicle, refresh };
}

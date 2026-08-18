"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/context/AuthContext";

/**
 * The fleet register: every vehicle on the Quallor network and every assessment
 * ever carried out on it.
 *
 * Ownership is split deliberately. The FLEET MANAGER owns this register: they
 * add vehicles, run assessments and set service status across every operator.
 * An OPERATOR only ever reads the slice of it that belongs to them. Drivers and
 * passengers never touch it directly, but both are affected by it: a vehicle
 * that is not roadworthy disappears from passenger search and stops its driver
 * going online.
 *
 * That split is no longer enforced by convention. It lives in the row level
 * security policies on public.vehicles and public.assessments, so a read here
 * returns only what the signed-in account is entitled to and a forbidden write
 * comes back as a 42501 rather than quietly succeeding.
 */

export type VehicleStatus = "active" | "standby" | "maintenance" | "suspended" | "retired";

/** Statuses a vehicle can carry passengers in. */
export const ROADWORTHY_STATUSES: VehicleStatus[] = ["active", "standby"];

export interface Vehicle {
    id: string;
    plate: string;
    model: string;
    year: number;
    capacity: number;

    /** The operator or association this vehicle belongs to. */
    operatorId: string;
    operatorName: string;

    /** The driver account assigned to it, once one is linked. */
    driverId?: string;
    driverName: string;
    driverPhone: string;

    homeRank: string;
    route: string;
    status: VehicleStatus;
    odometer: number;
    licenceExpiry: string;   // ISO date
    permitNumber: string;
    addedAt: string;         // ISO date

    /** Set when the fleet manager takes the vehicle off the road. */
    suspendedAt?: string;
    suspensionReason?: string;

    /**
     * Vehicles created from a driver's own registration start unverified. The
     * fleet manager confirms the paperwork before they can carry passengers.
     */
    verified: boolean;
    /** Where the record came from, so the manager knows what needs checking. */
    source: "fleet-manager" | "driver-registration";
}

export type AssessmentType = "roadworthy" | "safety" | "cleanliness" | "driver-conduct";
export type AssessmentResult = "pass" | "conditional" | "fail";

export interface AssessmentItem {
    label: string;
    status: "pass" | "fail" | "na";
    note?: string;
}

export interface Assessment {
    id: string;
    vehicleId: string;
    plate: string;
    type: AssessmentType;
    assessedAt: string;
    assessor: string;
    score: number;
    result: AssessmentResult;
    items: AssessmentItem[];
    notes: string;
    nextDue: string;
}

export const ASSESSMENT_CHECKLISTS: Record<AssessmentType, string[]> = {
    roadworthy: [
        "Brakes and handbrake",
        "Tyre tread and pressure",
        "Steering and suspension",
        "Lights and indicators",
        "Windscreen and wipers",
        "Exhaust and emissions",
    ],
    safety: [
        "Seatbelts on every seat",
        "Fire extinguisher present and charged",
        "First aid kit stocked",
        "Emergency exit clear",
        "Warning triangle on board",
        "Passenger grab handles secure",
    ],
    cleanliness: [
        "Seats and upholstery",
        "Floor and aisle",
        "Windows and mirrors",
        "Exterior bodywork",
        "No rubbish left on board",
    ],
    "driver-conduct": [
        "Valid PrDP on the driver",
        "Uniform and identification worn",
        "Speed record within limits",
        "No passenger complaints this period",
        "Fare collection recorded correctly",
    ],
};

export const ASSESSMENT_LABELS: Record<AssessmentType, string> = {
    roadworthy: "Roadworthy Inspection",
    safety: "Safety Equipment Check",
    cleanliness: "Cleanliness Audit",
    "driver-conduct": "Driver Conduct Review",
};

/**
 * An operator cannot change the register themselves, so this is how they ask
 * the fleet office for something: a new vehicle, an assessment, a repair, or a
 * driver change. It appears in the fleet manager's inbox.
 */
export type RequestKind = "add-vehicle" | "assessment" | "repair" | "driver-change" | "other";

export interface FleetRequest {
    id: string;
    kind: RequestKind;
    operatorId: string;
    operatorName: string;
    vehicleId?: string;
    plate?: string;
    detail: string;
    raisedAt: string;
    status: "open" | "resolved";
    resolvedAt?: string;
}

export const REQUEST_LABELS: Record<RequestKind, string> = {
    "add-vehicle": "Add a vehicle",
    assessment: "Request an assessment",
    repair: "Report a defect",
    "driver-change": "Change assigned driver",
    other: "Other",
};

/**
 * Kept for the fleet manager's operator picker. These associations are names on
 * the register seeded by migration 0003, not Quallor accounts, so they have no
 * id until a real operator signs up and the fleet office assigns vehicles over.
 */
export const SEED_OPERATORS = [
    { id: "OP-BORDER", name: "Border Alliance Taxi Association" },
    { id: "OP-AMATHOLE", name: "Amathole Taxi Council" },
];

export interface FleetWriteResult {
    success: boolean;
    error?: string;
}

interface FleetContextType {
    vehicles: Vehicle[];
    assessments: Assessment[];
    requests: FleetRequest[];

    /** Operator to fleet-office channel. */
    raiseRequest: (r: Omit<FleetRequest, "id" | "raisedAt" | "status">) => Promise<FleetRequest | null>;
    resolveRequest: (id: string) => Promise<void>;

    /** Fleet-manager operations. */
    addVehicle: (v: Omit<Vehicle, "id" | "addedAt">) => Promise<Vehicle | null>;
    updateVehicle: (id: string, patch: Partial<Vehicle>) => Promise<FleetWriteResult>;
    removeVehicle: (id: string) => Promise<void>;
    setVehicleStatus: (id: string, status: VehicleStatus, reason?: string) => Promise<void>;
    verifyVehicle: (id: string) => Promise<void>;
    addAssessment: (a: Omit<Assessment, "id">) => Promise<Assessment | null>;

    /** Registers a vehicle from a driver's own sign-up, pending verification. */
    registerDriverVehicle: (input: {
        plate: string; model: string; driverId: string; driverName: string; driverPhone: string;
    }) => Promise<Vehicle | null>;

    /** Scoped reads. */
    vehiclesForOperator: (operatorId: string, companyName?: string) => Vehicle[];
    vehicleForDriver: (driverId?: string, plate?: string) => Vehicle | undefined;
    assessmentsFor: (vehicleId: string) => Assessment[];
    latestFor: (vehicleId: string) => Assessment | undefined;

    /** Every operator that has vehicles on the register, plus the seeded ones. */
    operators: { id: string; name: string; count: number }[];

    /** True when the vehicle may legally carry passengers right now. */
    canCarryPassengers: (v: Vehicle) => boolean;
    /** Plain-language reason a vehicle is off the road, or null when it is fine. */
    blockingReason: (v: Vehicle) => string | null;

    refresh: () => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

const FleetContext = createContext<FleetContextType | null>(null);

// --------------------------------------------------------------------------
// Row mappers. Postgres is snake_case, the app is camelCase.
// --------------------------------------------------------------------------

interface VehicleRow {
    id: string;
    plate: string;
    model: string;
    year: number | null;
    capacity: number;
    operator_id: string | null;
    operator_name: string;
    driver_id: string | null;
    driver_name: string;
    driver_phone: string;
    home_rank: string;
    route: string;
    status: VehicleStatus;
    odometer: number;
    licence_expiry: string | null;
    permit_number: string | null;
    added_at: string;
    suspended_at: string | null;
    suspension_reason: string | null;
    verified: boolean;
    source: "fleet-manager" | "driver-registration";
}

function vehicleFromRow(row: VehicleRow): Vehicle {
    return {
        id: row.id,
        plate: row.plate,
        model: row.model,
        year: row.year ?? new Date().getFullYear(),
        capacity: row.capacity,
        operatorId: row.operator_id ?? "",
        operatorName: row.operator_name,
        driverId: row.driver_id ?? undefined,
        driverName: row.driver_name,
        driverPhone: row.driver_phone,
        homeRank: row.home_rank,
        route: row.route,
        status: row.status,
        odometer: row.odometer,
        licenceExpiry: row.licence_expiry ?? "",
        permitNumber: row.permit_number ?? "",
        addedAt: row.added_at,
        suspendedAt: row.suspended_at ?? undefined,
        suspensionReason: row.suspension_reason ?? undefined,
        verified: row.verified,
        source: row.source,
    };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** operator_id is a real profiles reference, so a seeded label like "OP-BORDER" is not one. */
function asUuid(value: string | undefined): string | null {
    return value && UUID.test(value) ? value : null;
}

function vehicleToRow(patch: Partial<Vehicle>): Record<string, unknown> {
    const row: Record<string, unknown> = {};
    if (patch.plate !== undefined) row.plate = patch.plate;
    if (patch.model !== undefined) row.model = patch.model;
    if (patch.year !== undefined) row.year = patch.year;
    if (patch.capacity !== undefined) row.capacity = patch.capacity;
    if (patch.operatorId !== undefined) row.operator_id = asUuid(patch.operatorId);
    if (patch.operatorName !== undefined) row.operator_name = patch.operatorName;
    if (patch.driverId !== undefined) row.driver_id = asUuid(patch.driverId);
    if (patch.driverName !== undefined) row.driver_name = patch.driverName;
    if (patch.driverPhone !== undefined) row.driver_phone = patch.driverPhone;
    if (patch.homeRank !== undefined) row.home_rank = patch.homeRank;
    if (patch.route !== undefined) row.route = patch.route;
    if (patch.status !== undefined) row.status = patch.status;
    if (patch.odometer !== undefined) row.odometer = patch.odometer;
    if (patch.licenceExpiry !== undefined) row.licence_expiry = patch.licenceExpiry || null;
    if (patch.permitNumber !== undefined) row.permit_number = patch.permitNumber;
    if (patch.suspendedAt !== undefined) row.suspended_at = patch.suspendedAt ?? null;
    if (patch.suspensionReason !== undefined) row.suspension_reason = patch.suspensionReason ?? null;
    if (patch.verified !== undefined) row.verified = patch.verified;
    if (patch.source !== undefined) row.source = patch.source;
    return row;
}

interface AssessmentRow {
    id: string;
    vehicle_id: string;
    plate: string;
    type: AssessmentType;
    assessed_at: string;
    assessor: string;
    score: number;
    result: AssessmentResult;
    items: AssessmentItem[];
    notes: string;
    next_due: string | null;
}

function assessmentFromRow(row: AssessmentRow): Assessment {
    return {
        id: row.id,
        vehicleId: row.vehicle_id,
        plate: row.plate,
        type: row.type,
        assessedAt: row.assessed_at,
        assessor: row.assessor,
        score: row.score,
        result: row.result,
        items: Array.isArray(row.items) ? row.items : [],
        notes: row.notes,
        nextDue: row.next_due ?? "",
    };
}

interface RequestRow {
    id: string;
    kind: RequestKind;
    operator_id: string;
    operator_name: string;
    vehicle_id: string | null;
    plate: string | null;
    detail: string;
    raised_at: string;
    status: "open" | "resolved";
    resolved_at: string | null;
}

function requestFromRow(row: RequestRow): FleetRequest {
    return {
        id: row.id,
        kind: row.kind,
        operatorId: row.operator_id,
        operatorName: row.operator_name,
        vehicleId: row.vehicle_id ?? undefined,
        plate: row.plate ?? undefined,
        detail: row.detail,
        raisedAt: row.raised_at,
        status: row.status,
        resolvedAt: row.resolved_at ?? undefined,
    };
}

/** Turns a PostgREST error into something a dispatcher can act on. */
function readable(error: { code?: string; message: string }): string {
    if (error.code === "42501") return "Only the fleet office can change the register.";
    if (error.code === "23505") return "A vehicle with that number plate is already registered.";
    return error.message;
}

export function FleetProvider({ children }: { children: React.ReactNode }) {
    const supabase = useMemo(() => createClient(), []);
    const { user, isLoading: authLoading } = useAuth();

    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [requests, setRequests] = useState<FleetRequest[]>([]);
    const [operatorAccounts, setOperatorAccounts] = useState<{ id: string; name: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * One read per table. What comes back is already scoped by RLS: the fleet
     * office sees the whole register, an operator sees their own vehicles, a
     * driver sees the one assigned to them, and a passenger sees only vehicles
     * that are roadworthy.
     */
    const refresh = useCallback(async () => {
        if (!user) {
            setVehicles([]);
            setAssessments([]);
            setRequests([]);
            setOperatorAccounts([]);
            setIsLoading(false);
            return;
        }

        const [vehicleRes, assessmentRes, requestRes, operatorRes] = await Promise.all([
            supabase.from("vehicles").select("*").order("added_at", { ascending: false }),
            supabase.from("assessments").select("*").order("assessed_at", { ascending: false }),
            supabase.from("fleet_requests").select("*").order("raised_at", { ascending: false }),
            supabase.from("profiles").select("id, name, company_name").eq("role", "operator"),
        ]);

        if (vehicleRes.error) {
            setError(vehicleRes.error.message);
            setIsLoading(false);
            return;
        }

        setVehicles((vehicleRes.data as VehicleRow[]).map(vehicleFromRow));
        setAssessments(((assessmentRes.data ?? []) as AssessmentRow[]).map(assessmentFromRow));
        setRequests(((requestRes.data ?? []) as RequestRow[]).map(requestFromRow));
        setOperatorAccounts(
            ((operatorRes.data ?? []) as { id: string; name: string; company_name: string | null }[]).map(
                (o) => ({ id: o.id, name: o.company_name || o.name })
            )
        );
        setError(null);
        setIsLoading(false);
    }, [supabase, user]);

    useEffect(() => {
        if (authLoading) return;
        // Deferred: refresh() resets state synchronously on its signed-out path,
        // and doing that inside the effect body cascades an extra render.
        queueMicrotask(() => void refresh());
    }, [authLoading, refresh]);

    // ----------------------------------------------------------------------
    // Operator to fleet-office requests
    // ----------------------------------------------------------------------

    async function raiseRequest(
        r: Omit<FleetRequest, "id" | "raisedAt" | "status">
    ): Promise<FleetRequest | null> {
        const { data, error: err } = await supabase
            .from("fleet_requests")
            .insert({
                kind: r.kind,
                operator_id: asUuid(r.operatorId) ?? user?.id,
                operator_name: r.operatorName,
                vehicle_id: asUuid(r.vehicleId),
                plate: r.plate ?? null,
                detail: r.detail,
                status: "open",
            })
            .select()
            .single();

        if (err) {
            setError(readable(err));
            return null;
        }
        const saved = requestFromRow(data as RequestRow);
        setRequests((prev) => [saved, ...prev]);
        setError(null);
        return saved;
    }

    async function resolveRequest(id: string): Promise<void> {
        const { data, error: err } = await supabase
            .from("fleet_requests")
            .update({ status: "resolved", resolved_at: new Date().toISOString(), resolved_by: user?.id })
            .eq("id", id)
            .select()
            .single();

        if (err) {
            setError(readable(err));
            return;
        }
        const saved = requestFromRow(data as RequestRow);
        setRequests((prev) => prev.map((r) => (r.id === id ? saved : r)));
        setError(null);
    }

    // ----------------------------------------------------------------------
    // Fleet-manager operations
    // ----------------------------------------------------------------------

    async function addVehicle(v: Omit<Vehicle, "id" | "addedAt">): Promise<Vehicle | null> {
        const { data, error: err } = await supabase
            .from("vehicles")
            .insert({ ...vehicleToRow(v), added_at: new Date().toISOString() })
            .select()
            .single();

        if (err) {
            setError(readable(err));
            return null;
        }
        const saved = vehicleFromRow(data as VehicleRow);
        setVehicles((prev) => [saved, ...prev]);
        setError(null);
        return saved;
    }

    async function updateVehicle(id: string, patch: Partial<Vehicle>): Promise<FleetWriteResult> {
        const { data, error: err } = await supabase
            .from("vehicles")
            .update(vehicleToRow(patch))
            .eq("id", id)
            .select()
            .maybeSingle();

        if (err) {
            const message = readable(err);
            setError(message);
            return { success: false, error: message };
        }
        // RLS filters rather than throwing, so no row back means not permitted.
        if (!data) {
            const message = "Only the fleet office can change the register.";
            setError(message);
            return { success: false, error: message };
        }

        const saved = vehicleFromRow(data as VehicleRow);
        setVehicles((prev) => prev.map((v) => (v.id === id ? saved : v)));
        setError(null);
        return { success: true };
    }

    async function removeVehicle(id: string): Promise<void> {
        const { error: err } = await supabase.from("vehicles").delete().eq("id", id);
        if (err) {
            setError(readable(err));
            return;
        }
        // Assessments cascade in the database; mirror that in local state.
        setVehicles((prev) => prev.filter((v) => v.id !== id));
        setAssessments((prev) => prev.filter((a) => a.vehicleId !== id));
        setError(null);
    }

    async function setVehicleStatus(id: string, status: VehicleStatus, reason?: string): Promise<void> {
        await updateVehicle(id, {
            status,
            suspendedAt: status === "suspended" ? new Date().toISOString() : undefined,
            suspensionReason: status === "suspended" ? reason : undefined,
        });
    }

    async function verifyVehicle(id: string): Promise<void> {
        await updateVehicle(id, { verified: true, status: "standby" });
    }

    async function addAssessment(a: Omit<Assessment, "id">): Promise<Assessment | null> {
        const { data, error: err } = await supabase
            .from("assessments")
            .insert({
                vehicle_id: a.vehicleId,
                plate: a.plate,
                type: a.type,
                assessed_at: a.assessedAt,
                assessor_id: user?.id ?? null,
                assessor: a.assessor,
                score: a.score,
                result: a.result,
                items: a.items,
                notes: a.notes,
                next_due: a.nextDue || null,
            })
            .select()
            .single();

        if (err) {
            setError(readable(err));
            return null;
        }

        const saved = assessmentFromRow(data as AssessmentRow);
        setAssessments((prev) => [saved, ...prev]);

        // A failed assessment takes the vehicle off the road straight away. That
        // single write is what stops the driver going online and hides the taxi
        // from passenger search.
        if (a.result === "fail") {
            await setVehicleStatus(
                a.vehicleId,
                "maintenance",
                `Failed ${ASSESSMENT_LABELS[a.type].toLowerCase()}`
            );
        }
        setError(null);
        return saved;
    }

    async function registerDriverVehicle(input: {
        plate: string; model: string; driverId: string; driverName: string; driverPhone: string;
    }): Promise<Vehicle | null> {
        const plate = input.plate.trim().toUpperCase();
        if (!plate) return null;

        // The register is not fully visible to a driver, so ask the database
        // rather than the local copy whether this plate already exists.
        const { data: existing } = await supabase
            .from("vehicles")
            .select("*")
            .ilike("plate", plate)
            .maybeSingle();

        if (existing) {
            // Already on the register. Linking a driver to someone else's
            // vehicle is a fleet-office job, so this is left for them: the
            // driver's own update would be refused anyway.
            return vehicleFromRow(existing as VehicleRow);
        }

        // Must satisfy vehicles_insert_driver_registration: unverified, on
        // standby, owned by the driver making the request.
        const { data, error: err } = await supabase
            .from("vehicles")
            .insert({
                plate,
                model: input.model || "Toyota Quantum",
                year: new Date().getFullYear(),
                capacity: 15,
                operator_id: null,
                operator_name: "Awaiting operator assignment",
                driver_id: asUuid(input.driverId),
                driver_name: input.driverName,
                driver_phone: input.driverPhone,
                home_rank: "Unassigned",
                route: "Not set",
                status: "standby",
                odometer: 0,
                licence_expiry: null,
                permit_number: "Pending",
                verified: false,
                source: "driver-registration",
            })
            .select()
            .single();

        if (err) {
            setError(readable(err));
            return null;
        }

        const saved = vehicleFromRow(data as VehicleRow);
        setVehicles((prev) => [saved, ...prev]);
        setError(null);
        return saved;
    }

    // ----------------------------------------------------------------------
    // Scoped reads, all over already-fetched state
    // ----------------------------------------------------------------------

    function assessmentsFor(vehicleId: string) {
        return assessments
            .filter((a) => a.vehicleId === vehicleId)
            .sort((x, y) => y.assessedAt.localeCompare(x.assessedAt));
    }

    function latestFor(vehicleId: string) {
        return assessmentsFor(vehicleId)[0];
    }

    /**
     * An operator's own vehicles. Matched on account id, and also on company
     * name so an association that signs up after its vehicles were registered
     * still sees them.
     */
    function vehiclesForOperator(operatorId: string, companyName?: string) {
        return vehicles.filter(
            (v) =>
                (operatorId && v.operatorId === operatorId) ||
                (companyName && v.operatorName.toLowerCase() === companyName.toLowerCase())
        );
    }

    function vehicleForDriver(driverId?: string, plate?: string) {
        if (driverId) {
            const byId = vehicles.find((v) => v.driverId === driverId);
            if (byId) return byId;
        }
        if (plate) {
            const wanted = plate.trim().toUpperCase();
            return vehicles.find((v) => v.plate.toUpperCase() === wanted);
        }
        return undefined;
    }

    /**
     * Every operator the fleet manager can assign a vehicle to: the seeded
     * associations, any real operator account, and any operator already
     * referenced by a vehicle.
     */
    const operators = useMemo(() => {
        const map = new Map<string, { id: string; name: string; count: number }>();
        SEED_OPERATORS.forEach((o) => map.set(o.id, { ...o, count: 0 }));
        operatorAccounts.forEach((o) => map.set(o.id, { id: o.id, name: o.name, count: 0 }));

        vehicles.forEach((v) => {
            if (!v.operatorId) return;
            const found = map.get(v.operatorId);
            if (found) found.count++;
            else map.set(v.operatorId, { id: v.operatorId, name: v.operatorName, count: 1 });
        });
        return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
    }, [vehicles, operatorAccounts]);

    function blockingReason(v: Vehicle): string | null {
        if (!v.verified) return "Waiting for the fleet manager to verify this vehicle's paperwork.";
        if (v.status === "suspended") return v.suspensionReason || "Suspended from the network by the fleet manager.";
        if (v.status === "maintenance") return "In maintenance after a failed inspection.";
        if (v.status === "retired") return "Retired from the network.";
        if (v.licenceExpiry && new Date(v.licenceExpiry).getTime() < Date.now()) {
            return "The operating licence on this vehicle has expired.";
        }
        return null;
    }

    function canCarryPassengers(v: Vehicle) {
        return blockingReason(v) === null && ROADWORTHY_STATUSES.includes(v.status);
    }

    return (
        <FleetContext.Provider
            value={{
                vehicles, assessments, requests,
                raiseRequest, resolveRequest,
                addVehicle, updateVehicle, removeVehicle, setVehicleStatus, verifyVehicle,
                addAssessment, registerDriverVehicle,
                vehiclesForOperator, vehicleForDriver, assessmentsFor, latestFor,
                operators, canCarryPassengers, blockingReason,
                refresh, isLoading, error,
            }}
        >
            {children}
        </FleetContext.Provider>
    );
}

export function useFleet() {
    const ctx = useContext(FleetContext);
    if (!ctx) throw new Error("useFleet must be used within FleetProvider");
    return ctx;
}

/** Score to result band, shared by the assessment form and the register. */
export function resultForScore(score: number): AssessmentResult {
    if (score >= 85) return "pass";
    if (score >= 65) return "conditional";
    return "fail";
}

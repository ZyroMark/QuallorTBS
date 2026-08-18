"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

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
 * Because all four roles read the same localStorage keys, a change made by the
 * fleet manager reaches the operator, driver and passenger views without any
 * sync step. The storage listener below keeps other open tabs current too.
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

const VEHICLES_KEY = "quallor_fleet_vehicles";
const ASSESSMENTS_KEY = "quallor_fleet_assessments";
const REQUESTS_KEY = "quallor_fleet_requests";
const SCHEMA_KEY = "quallor_fleet_schema";
const SCHEMA_VERSION = "2";

/** Seed operators, so the register is not empty and shows more than one fleet. */
export const SEED_OPERATORS = [
    { id: "OP-BORDER", name: "Border Alliance Taxi Association" },
    { id: "OP-AMATHOLE", name: "Amathole Taxi Council" },
];

const SEED_VEHICLES: Vehicle[] = [
    { id: "QLR-T01", plate: "EC 123-456", model: "Toyota Quantum",    year: 2021, capacity: 15, operatorId: "OP-BORDER",   operatorName: SEED_OPERATORS[0].name, driverName: "Sipho Ndlovu",   driverPhone: "+27 63 123 4567", homeRank: "Beacon Bay Rank",   route: "Beacon Bay to Mdantsane",           status: "active",      odometer: 143200, licenceExpiry: "2027-03-14", permitNumber: "OL-EC-88213", addedAt: "2025-11-02", verified: true, source: "fleet-manager" },
    { id: "QLR-T02", plate: "EC 789-012", model: "Toyota Quantum",    year: 2019, capacity: 15, operatorId: "OP-BORDER",   operatorName: SEED_OPERATORS[0].name, driverName: "Thabo Mokoena",  driverPhone: "+27 71 234 5678", homeRank: "East London CBD",   route: "East London to King William's Town", status: "active",      odometer: 221000, licenceExpiry: "2026-09-30", permitNumber: "OL-EC-77104", addedAt: "2025-11-02", verified: true, source: "fleet-manager" },
    { id: "QLR-T03", plate: "EC 345-678", model: "Nissan NV350",      year: 2022, capacity: 15, operatorId: "OP-AMATHOLE", operatorName: SEED_OPERATORS[1].name, driverName: "Nomsa Dlamini",  driverPhone: "+27 82 345 6789", homeRank: "Southernwood Rank", route: "Southernwood to Beacon Bay",         status: "active",      odometer: 87600,  licenceExpiry: "2027-06-21", permitNumber: "OL-EC-91556", addedAt: "2026-01-18", verified: true, source: "fleet-manager" },
    { id: "QLR-T04", plate: "EC 901-234", model: "Toyota Quantum",    year: 2017, capacity: 15, operatorId: "OP-BORDER",   operatorName: SEED_OPERATORS[0].name, driverName: "Luyanda Zulu",   driverPhone: "+27 61 456 7890", homeRank: "Mdantsane Rank",    route: "Standing down",                      status: "maintenance", odometer: 314500, licenceExpiry: "2026-08-29", permitNumber: "OL-EC-60398", addedAt: "2025-11-02", verified: true, source: "fleet-manager" },
    { id: "QLR-T05", plate: "EC 567-890", model: "Mercedes Sprinter", year: 2023, capacity: 22, operatorId: "OP-AMATHOLE", operatorName: SEED_OPERATORS[1].name, driverName: "Zanele Khumalo", driverPhone: "+27 73 567 8901", homeRank: "Mdantsane Rank",    route: "Mdantsane to City Centre",           status: "active",      odometer: 189000, licenceExpiry: "2028-01-11", permitNumber: "OL-EC-93877", addedAt: "2026-04-06", verified: true, source: "fleet-manager" },
];

const SEED_ASSESSMENTS: Assessment[] = [
    {
        id: "AS-1001", vehicleId: "QLR-T01", plate: "EC 123-456", type: "roadworthy",
        assessedAt: "2026-07-12", assessor: "M. Jacobs", score: 92, result: "pass",
        items: ASSESSMENT_CHECKLISTS.roadworthy.map((label) => ({ label, status: "pass" as const })),
        notes: "Front tyres at 4mm, monitor before the next inspection.", nextDue: "2027-01-12",
    },
    {
        id: "AS-1002", vehicleId: "QLR-T04", plate: "EC 901-234", type: "roadworthy",
        assessedAt: "2026-08-02", assessor: "M. Jacobs", score: 54, result: "fail",
        items: ASSESSMENT_CHECKLISTS.roadworthy.map((label, i) => ({
            label,
            status: i === 0 || i === 1 ? ("fail" as const) : ("pass" as const),
            note: i === 0 ? "Rear brake pads below limit" : i === 1 ? "Left rear tyre below tread depth" : undefined,
        })),
        notes: "Vehicle pulled from service until brakes and tyre are replaced.", nextDue: "2026-08-16",
    },
    {
        id: "AS-1003", vehicleId: "QLR-T02", plate: "EC 789-012", type: "safety",
        assessedAt: "2026-08-09", assessor: "N. Peters", score: 83, result: "conditional",
        items: ASSESSMENT_CHECKLISTS.safety.map((label, i) => ({
            label,
            status: i === 2 ? ("fail" as const) : ("pass" as const),
            note: i === 2 ? "First aid kit missing burn dressing" : undefined,
        })),
        notes: "Restock first aid kit within 7 days.", nextDue: "2026-08-16",
    },
];

interface FleetContextType {
    vehicles: Vehicle[];
    assessments: Assessment[];
    requests: FleetRequest[];

    /** Operator to fleet-office channel. */
    raiseRequest: (r: Omit<FleetRequest, "id" | "raisedAt" | "status">) => FleetRequest;
    resolveRequest: (id: string) => void;

    /** Fleet-manager operations. */
    addVehicle: (v: Omit<Vehicle, "id" | "addedAt">) => Vehicle;
    updateVehicle: (id: string, patch: Partial<Vehicle>) => void;
    removeVehicle: (id: string) => void;
    setVehicleStatus: (id: string, status: VehicleStatus, reason?: string) => void;
    verifyVehicle: (id: string) => void;
    addAssessment: (a: Omit<Assessment, "id">) => Assessment;

    /** Registers a vehicle from a driver's own sign-up, pending verification. */
    registerDriverVehicle: (input: {
        plate: string; model: string; driverId: string; driverName: string; driverPhone: string;
    }) => Vehicle | null;

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
}

const FleetContext = createContext<FleetContextType | null>(null);

function readJson<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

export function FleetProvider({ children }: { children: React.ReactNode }) {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [requests, setRequests] = useState<FleetRequest[]>([]);

    function load() {
        // The vehicle shape changed when operators and drivers were linked, so a
        // register written by the old version is reseeded rather than patched.
        const schema = localStorage.getItem(SCHEMA_KEY);
        if (schema !== SCHEMA_VERSION) {
            localStorage.setItem(VEHICLES_KEY, JSON.stringify(SEED_VEHICLES));
            localStorage.setItem(ASSESSMENTS_KEY, JSON.stringify(SEED_ASSESSMENTS));
            localStorage.setItem(SCHEMA_KEY, SCHEMA_VERSION);
            setVehicles(SEED_VEHICLES);
            setAssessments(SEED_ASSESSMENTS);
            return;
        }
        setVehicles(readJson<Vehicle[]>(VEHICLES_KEY, SEED_VEHICLES));
        setAssessments(readJson<Assessment[]>(ASSESSMENTS_KEY, SEED_ASSESSMENTS));
        setRequests(readJson<FleetRequest[]>(REQUESTS_KEY, []));
    }

    useEffect(() => {
        load();
        // Another role open in a second tab should see fleet changes immediately.
        function onStorage(e: StorageEvent) {
            if (e.key === VEHICLES_KEY || e.key === ASSESSMENTS_KEY || e.key === REQUESTS_KEY) load();
        }
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    function persistVehicles(next: Vehicle[]) {
        setVehicles(next);
        localStorage.setItem(VEHICLES_KEY, JSON.stringify(next));
    }

    function persistAssessments(next: Assessment[]) {
        setAssessments(next);
        localStorage.setItem(ASSESSMENTS_KEY, JSON.stringify(next));
    }

    function persistRequests(next: FleetRequest[]) {
        setRequests(next);
        localStorage.setItem(REQUESTS_KEY, JSON.stringify(next));
    }

    function raiseRequest(r: Omit<FleetRequest, "id" | "raisedAt" | "status">): FleetRequest {
        const request: FleetRequest = {
            ...r,
            id: `REQ-${Date.now().toString(36).toUpperCase()}`,
            raisedAt: new Date().toISOString(),
            status: "open",
        };
        persistRequests([request, ...requests]);
        return request;
    }

    function resolveRequest(id: string) {
        persistRequests(
            requests.map((r) => (r.id === id ? { ...r, status: "resolved" as const, resolvedAt: new Date().toISOString() } : r))
        );
    }

    function addVehicle(v: Omit<Vehicle, "id" | "addedAt">): Vehicle {
        const vehicle: Vehicle = {
            ...v,
            id: `QLR-T${Date.now().toString(36).slice(-4).toUpperCase()}`,
            addedAt: new Date().toISOString().slice(0, 10),
        };
        persistVehicles([...vehicles, vehicle]);
        return vehicle;
    }

    function updateVehicle(id: string, patch: Partial<Vehicle>) {
        persistVehicles(vehicles.map((v) => (v.id === id ? { ...v, ...patch } : v)));
    }

    function removeVehicle(id: string) {
        persistVehicles(vehicles.filter((v) => v.id !== id));
        persistAssessments(assessments.filter((a) => a.vehicleId !== id));
    }

    function setVehicleStatus(id: string, status: VehicleStatus, reason?: string) {
        persistVehicles(
            vehicles.map((v) =>
                v.id === id
                    ? {
                          ...v,
                          status,
                          suspendedAt: status === "suspended" ? new Date().toISOString() : undefined,
                          suspensionReason: status === "suspended" ? reason : undefined,
                      }
                    : v
            )
        );
    }

    function verifyVehicle(id: string) {
        persistVehicles(vehicles.map((v) => (v.id === id ? { ...v, verified: true, status: "standby" } : v)));
    }

    function registerDriverVehicle(input: {
        plate: string; model: string; driverId: string; driverName: string; driverPhone: string;
    }): Vehicle | null {
        const plate = input.plate.trim().toUpperCase();
        if (!plate) return null;

        const existing = vehicles.find((v) => v.plate.toUpperCase() === plate);
        if (existing) {
            // The vehicle is already on the register, so just link the driver to it.
            updateVehicle(existing.id, {
                driverId: input.driverId,
                driverName: input.driverName || existing.driverName,
                driverPhone: input.driverPhone || existing.driverPhone,
            });
            return existing;
        }

        return addVehicle({
            plate,
            model: input.model || "Toyota Quantum",
            year: new Date().getFullYear(),
            capacity: 15,
            operatorId: "",
            operatorName: "Awaiting operator assignment",
            driverId: input.driverId,
            driverName: input.driverName,
            driverPhone: input.driverPhone,
            homeRank: "Unassigned",
            route: "Not set",
            status: "standby",
            odometer: 0,
            licenceExpiry: "",
            permitNumber: "Pending",
            verified: false,
            source: "driver-registration",
        });
    }

    function addAssessment(a: Omit<Assessment, "id">): Assessment {
        const assessment: Assessment = { ...a, id: `AS-${Date.now().toString().slice(-6)}` };
        persistAssessments([assessment, ...assessments]);

        // A failed assessment takes the vehicle off the road straight away. That
        // single write is what stops the driver going online and hides the taxi
        // from passenger search.
        if (a.result === "fail") {
            setVehicleStatus(a.vehicleId, "maintenance", `Failed ${ASSESSMENT_LABELS[a.type].toLowerCase()}`);
        }
        return assessment;
    }

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
     * associations, any real operator account that has signed up, and any
     * operator already referenced by a vehicle.
     */
    const operators = (() => {
        const map = new Map<string, { id: string; name: string; count: number }>();
        SEED_OPERATORS.forEach((o) => map.set(o.id, { ...o, count: 0 }));

        if (typeof window !== "undefined") {
            try {
                const users = JSON.parse(localStorage.getItem("quallor_users") || "{}") as Record<
                    string,
                    { user: { id: string; role: string; name: string; companyName?: string } }
                >;
                Object.values(users).forEach(({ user }) => {
                    if (user.role !== "operator") return;
                    map.set(user.id, { id: user.id, name: user.companyName || user.name, count: 0 });
                });
            } catch {
                // No account store yet, the seeded associations are enough.
            }
        }

        vehicles.forEach((v) => {
            if (!v.operatorId) return;
            const found = map.get(v.operatorId);
            if (found) found.count++;
            else map.set(v.operatorId, { id: v.operatorId, name: v.operatorName, count: 1 });
        });
        return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
    })();

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

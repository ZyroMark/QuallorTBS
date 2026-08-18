"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
    useFleet,
    ASSESSMENT_LABELS,
    REQUEST_LABELS,
    type Vehicle,
    type VehicleStatus,
    type AssessmentResult,
} from "@/app/context/FleetContext";
import { useAuth } from "@/app/context/AuthContext";
import { useToast } from "@/components/Toast";
import OperatorGate from "@/components/OperatorGate";

/**
 * Fleet Management, the Quallor fleet office.
 *
 * This is the whole network, not one operator's yard. The fleet manager sees
 * every operator's vehicles, adds new ones against an operator, verifies the
 * vehicles drivers registered themselves, runs assessments and takes vehicles
 * off the road. Operators only read their own slice of this in the operator
 * console, which is why /fleet is a separate role behind a separate URL.
 */

type Tab = "vehicles" | "requests" | "verify" | "assessments" | "compliance";

const STATUS_STYLES: Record<VehicleStatus, { bg: string; color: string; label: string }> = {
    active:      { bg: "rgba(22,163,74,0.10)",  color: "#16A34A", label: "Active" },
    standby:     { bg: "rgba(29,54,134,0.08)",  color: "#1D3686", label: "Standby" },
    maintenance: { bg: "rgba(217,119,6,0.10)",  color: "#D97706", label: "Maintenance" },
    suspended:   { bg: "rgba(220,38,38,0.10)",  color: "#DC2626", label: "Suspended" },
    retired:     { bg: "rgba(17,17,17,0.06)",   color: "#8A8678", label: "Retired" },
};

const RESULT_STYLES: Record<AssessmentResult, { bg: string; color: string; label: string }> = {
    pass:        { bg: "rgba(22,163,74,0.10)", color: "#16A34A", label: "Pass" },
    conditional: { bg: "rgba(217,119,6,0.10)", color: "#D97706", label: "Conditional" },
    fail:        { bg: "rgba(220,38,38,0.10)", color: "#DC2626", label: "Fail" },
};

const STATUS_ORDER: VehicleStatus[] = ["active", "standby", "maintenance", "suspended", "retired"];

const SUSPEND_REASONS = [
    "Failed roadworthy inspection",
    "Operating licence lapsed",
    "Repeated passenger complaints",
    "Unsafe driving reported",
    "Vehicle in poor condition",
    "Other",
];

/** A licence within 60 days of expiry needs attention. */
function licenceState(expiry: string): "ok" | "soon" | "expired" | "missing" {
    if (!expiry) return "missing";
    const days = (new Date(expiry).getTime() - Date.now()) / 86_400_000;
    if (days < 0) return "expired";
    if (days < 60) return "soon";
    return "ok";
}

function FleetContent() {
    const {
        vehicles, assessments, operators, requests, resolveRequest,
        addVehicle, setVehicleStatus, verifyVehicle, updateVehicle,
        latestFor, assessmentsFor, blockingReason,
    } = useFleet();
    const { user } = useAuth();
    const { toast } = useToast();

    const [tab, setTab] = useState<Tab>("vehicles");
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<VehicleStatus | "all">("all");
    const [operatorFilter, setOperatorFilter] = useState<string>("all");
    const [expanded, setExpanded] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);
    const [suspendTarget, setSuspendTarget] = useState<Vehicle | null>(null);

    const [form, setForm] = useState({
        plate: "", model: "Toyota Quantum", year: String(new Date().getFullYear()),
        capacity: "15", driverName: "", driverPhone: "",
        operatorId: "", homeRank: "", route: "", permitNumber: "", licenceExpiry: "", odometer: "0",
    });
    const [formError, setFormError] = useState("");

    const pendingVerification = vehicles.filter((v) => !v.verified);
    const openRequests = requests.filter((r) => r.status === "open");

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return vehicles
            .filter((v) => statusFilter === "all" || v.status === statusFilter)
            .filter((v) => operatorFilter === "all" || v.operatorId === operatorFilter)
            .filter((v) => !q || [v.plate, v.model, v.driverName, v.operatorName, v.homeRank, v.id].join(" ").toLowerCase().includes(q));
    }, [vehicles, query, statusFilter, operatorFilter]);

    const stats = useMemo(() => ({
        onRoad: vehicles.filter((v) => blockingReason(v) === null).length,
        offRoad: vehicles.filter((v) => blockingReason(v) !== null).length,
        pending: pendingVerification.length,
        fleets: operators.filter((o) => o.count > 0).length,
    }), [vehicles, operators, pendingVerification.length, blockingReason]);

    async function submitVehicle(e: React.FormEvent) {
        e.preventDefault();
        setFormError("");

        if (!form.plate.trim()) { setFormError("A number plate is required."); return; }
        if (vehicles.some((v) => v.plate.toLowerCase() === form.plate.trim().toLowerCase())) {
            setFormError("That number plate is already on the register.");
            return;
        }
        if (!form.operatorId) { setFormError("Assign this vehicle to an operator."); return; }
        if (!form.driverName.trim()) { setFormError("Name the driver assigned to this vehicle."); return; }
        if (!form.licenceExpiry) { setFormError("Set the operating licence expiry date."); return; }

        const op = operators.find((o) => o.id === form.operatorId);
        const vehicle = await addVehicle({
            plate: form.plate.trim().toUpperCase(),
            model: form.model.trim() || "Toyota Quantum",
            year: Number(form.year) || new Date().getFullYear(),
            capacity: Number(form.capacity) || 15,
            operatorId: form.operatorId,
            operatorName: op?.name || "Unassigned",
            driverName: form.driverName.trim(),
            driverPhone: form.driverPhone.trim(),
            homeRank: form.homeRank.trim() || "Unassigned",
            route: form.route.trim() || "Not set",
            status: "standby",
            odometer: Number(form.odometer) || 0,
            licenceExpiry: form.licenceExpiry,
            permitNumber: form.permitNumber.trim() || "Pending",
            verified: true,
            source: "fleet-manager",
        });

        if (!vehicle) {
            setFormError("Could not add the vehicle. Check the plate is not already registered.");
            return;
        }

        toast(`${vehicle.plate} added to ${op?.name}`, "success");
        setAdding(false);
        setForm({
            plate: "", model: "Toyota Quantum", year: String(new Date().getFullYear()),
            capacity: "15", driverName: "", driverPhone: "",
            operatorId: "", homeRank: "", route: "", permitNumber: "", licenceExpiry: "", odometer: "0",
        });
    }

    return (
        <main className="min-h-screen" style={{ backgroundColor: "#FFFCF9" }}>
            {/* ── Header ── */}
            <header
                className="sticky top-0 z-20"
                style={{ backgroundColor: "rgba(255,255,255,0.97)", borderBottom: "1px solid rgba(17,17,17,0.08)", backdropFilter: "blur(12px)" }}
            >
                <div className="max-w-4xl mx-auto w-full flex items-center gap-2 px-4 py-3">
                    <div
                        className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: "#111111", color: "#CDDFF6" }}
                    >
                        <span className="material-symbols-outlined">local_taxi</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="font-sans font-black text-base leading-tight" style={{ color: "#111111", letterSpacing: "-0.02em" }}>
                            Fleet Management
                        </h1>
                        <p className="font-mono text-[10px] font-bold uppercase tracking-wider truncate" style={{ color: "#1D3686" }}>
                            Quallor fleet office · {user?.name || "Manager"}
                        </p>
                    </div>
                    <button
                        onClick={() => { setAdding(true); setTab("vehicles"); }}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider flex-shrink-0"
                        style={{ backgroundColor: "#111111", color: "#FFFFFF" }}
                    >
                        <span className="material-symbols-outlined text-base">add</span>
                        Add Vehicle
                    </button>
                </div>

                <div className="max-w-4xl mx-auto w-full flex px-4 overflow-x-auto">
                    {([
                        { id: "vehicles",    label: "All Vehicles" },
                        { id: "requests",    label: `Requests${openRequests.length ? ` (${openRequests.length})` : ""}` },
                        { id: "verify",      label: `Verify${pendingVerification.length ? ` (${pendingVerification.length})` : ""}` },
                        { id: "assessments", label: "Assessments" },
                        { id: "compliance",  label: "Compliance" },
                    ] as { id: Tab; label: string }[]).map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className="px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap"
                            style={tab === t.id
                                ? { borderBottom: "2px solid #111111", color: "#111111" }
                                : { borderBottom: "2px solid transparent", color: "#AEA89C" }}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </header>

            <div className="max-w-4xl mx-auto w-full px-4 py-6 pb-24">

                {/* ── Stat strip ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {[
                        { label: "Fleets Managed", value: stats.fleets,  color: "#111111", icon: "corporate_fare" },
                        { label: "On The Road",    value: stats.onRoad,  color: "#16A34A", icon: "check_circle" },
                        { label: "Off The Road",   value: stats.offRoad, color: "#DC2626", icon: "error" },
                        { label: "Awaiting Check", value: stats.pending, color: "#D97706", icon: "pending" },
                    ].map((s) => (
                        <div
                            key={s.label}
                            className="rounded-[16px] p-4"
                            style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(17,17,17,0.07)", boxShadow: "0 2px 8px rgba(17,17,17,0.05)" }}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <p className="font-mono text-[10px] font-bold uppercase tracking-wider leading-tight" style={{ color: "#8A8678" }}>
                                    {s.label}
                                </p>
                                <span className="material-symbols-outlined text-base" style={{ color: s.color }}>{s.icon}</span>
                            </div>
                            <p className="font-sans font-black text-2xl leading-none" style={{ color: s.color, letterSpacing: "-0.02em" }}>
                                {s.value}
                            </p>
                        </div>
                    ))}
                </div>

                {/* ── Add vehicle ── */}
                {adding && (
                    <form
                        onSubmit={submitVehicle}
                        className="rounded-[18px] p-5 mb-6"
                        style={{ backgroundColor: "#FFFFFF", border: "1.5px solid rgba(17,17,17,0.12)", boxShadow: "0 8px 28px rgba(17,17,17,0.10)" }}
                    >
                        <h2 className="font-sans font-black text-lg mb-1" style={{ color: "#111111", letterSpacing: "-0.02em" }}>
                            Add a vehicle to the register
                        </h2>
                        <p className="font-sans text-sm mb-4" style={{ color: "#8A8678" }}>
                            It appears in that operator&apos;s console as soon as you save.
                        </p>

                        {formError && (
                            <div
                                className="mb-4 px-4 py-3 rounded-[12px] font-sans text-sm font-semibold"
                                style={{ backgroundColor: "rgba(220,38,38,0.07)", border: "1.5px solid rgba(220,38,38,0.20)", color: "#DC2626" }}
                            >
                                {formError}
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="q-label">Operator</label>
                            <select
                                className="q-input"
                                value={form.operatorId}
                                onChange={(e) => setForm({ ...form, operatorId: e.target.value })}
                            >
                                <option value="">Choose the operator this vehicle belongs to</option>
                                {operators.map((o) => (
                                    <option key={o.id} value={o.id}>{o.name} ({o.count} vehicles)</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            {([
                                { key: "plate",         label: "Number Plate",      placeholder: "EC 123-456" },
                                { key: "model",         label: "Model",             placeholder: "Toyota Quantum" },
                                { key: "year",          label: "Year",              placeholder: "2022", type: "number" },
                                { key: "capacity",      label: "Seats",             placeholder: "15", type: "number" },
                                { key: "driverName",    label: "Assigned Driver",   placeholder: "Full name" },
                                { key: "driverPhone",   label: "Driver Phone",      placeholder: "082 123 4567", type: "tel" },
                                { key: "homeRank",      label: "Home Rank",         placeholder: "The rank this taxi works from" },
                                { key: "route",         label: "Assigned Route",    placeholder: "e.g. Beacon Bay to Mdantsane" },
                                { key: "permitNumber",  label: "Operating Licence", placeholder: "OL-EC-00000" },
                                { key: "licenceExpiry", label: "Licence Expiry",    placeholder: "", type: "date" },
                                { key: "odometer",      label: "Odometer (km)",     placeholder: "0", type: "number" },
                            ] as { key: keyof typeof form; label: string; placeholder: string; type?: string }[]).map((f) => (
                                <div key={f.key}>
                                    <label className="q-label">{f.label}</label>
                                    <input
                                        type={f.type ?? "text"}
                                        className="q-input"
                                        placeholder={f.placeholder}
                                        value={form[f.key]}
                                        onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3 mt-5">
                            <button type="button" onClick={() => setAdding(false)} className="q-btn-outline flex-1 justify-center">Cancel</button>
                            <button type="submit" className="q-btn-dark flex-1 justify-center">Add to Register</button>
                        </div>
                    </form>
                )}

                {/* ── ALL VEHICLES ── */}
                {tab === "vehicles" && (
                    <>
                        <div className="relative mb-3">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#AEA89C" }}>search</span>
                            <input
                                className="q-input-lg pl-12 w-full"
                                placeholder="Search by plate, driver, operator or rank"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                aria-label="Search fleet"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                            <button
                                onClick={() => setOperatorFilter("all")}
                                className="px-4 py-1.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider transition-all"
                                style={operatorFilter === "all"
                                    ? { backgroundColor: "#1D3686", color: "#FFFFFF" }
                                    : { backgroundColor: "#E1EDF5", color: "#1D3686" }}
                            >
                                All fleets
                            </button>
                            {operators.map((o) => (
                                <button
                                    key={o.id}
                                    onClick={() => setOperatorFilter(o.id)}
                                    className="px-4 py-1.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider transition-all"
                                    style={operatorFilter === o.id
                                        ? { backgroundColor: "#1D3686", color: "#FFFFFF" }
                                        : { backgroundColor: "#E1EDF5", color: "#1D3686" }}
                                >
                                    {o.name.split(" ")[0]} {o.count}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-wrap gap-2 mb-5">
                            {(["all", ...STATUS_ORDER] as (VehicleStatus | "all")[]).map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setStatusFilter(s)}
                                    className="px-4 py-1.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider transition-all"
                                    style={statusFilter === s
                                        ? { backgroundColor: "#111111", color: "#FFFFFF" }
                                        : { backgroundColor: "#EEF1EA", color: "#5C5A56" }}
                                >
                                    {s === "all" ? `All ${vehicles.length}` : `${STATUS_STYLES[s].label} ${vehicles.filter((v) => v.status === s).length}`}
                                </button>
                            ))}
                        </div>

                        {filtered.length === 0 ? (
                            <div className="py-16 flex flex-col items-center text-center">
                                <span className="material-symbols-outlined text-5xl mb-3" style={{ color: "#CDDFF6" }}>search_off</span>
                                <p className="font-sans font-bold" style={{ color: "#111111" }}>No vehicles match those filters</p>
                                <button
                                    onClick={() => { setQuery(""); setStatusFilter("all"); setOperatorFilter("all"); }}
                                    className="q-btn-outline mt-5"
                                >
                                    Reset filters
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filtered.map((v) => (
                                    <VehicleCard
                                        key={v.id}
                                        vehicle={v}
                                        expanded={expanded === v.id}
                                        onToggle={() => setExpanded(expanded === v.id ? null : v.id)}
                                        onStatusChange={(status) => {
                                            if (status === "suspended") { setSuspendTarget(v); return; }
                                            setVehicleStatus(v.id, status);
                                            toast(`${v.plate} set to ${STATUS_STYLES[status].label.toLowerCase()}`, "success");
                                        }}
                                        onReassign={(operatorId) => {
                                            const op = operators.find((o) => o.id === operatorId);
                                            updateVehicle(v.id, { operatorId, operatorName: op?.name || "Unassigned" });
                                            toast(`${v.plate} moved to ${op?.name}`, "success");
                                        }}
                                        operators={operators}
                                        history={assessmentsFor(v.id)}
                                        blocked={blockingReason(v)}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* ── REQUESTS FROM OPERATORS ── */}
                {tab === "requests" && (
                    <>
                        <h2 className="font-sans font-black text-xl mb-1" style={{ color: "#111111", letterSpacing: "-0.02em" }}>
                            Requests From Operators
                        </h2>
                        <p className="font-sans text-sm mb-5" style={{ color: "#8A8678", lineHeight: 1.6 }}>
                            Operators cannot change the register themselves, so this is what they have asked the fleet office to do.
                        </p>

                        {requests.length === 0 ? (
                            <div className="py-16 flex flex-col items-center text-center">
                                <span className="material-symbols-outlined text-5xl mb-3" style={{ color: "#CDDFF6" }}>inbox</span>
                                <p className="font-sans font-bold" style={{ color: "#111111" }}>Nothing in the inbox</p>
                                <p className="font-sans text-sm mt-1" style={{ color: "#8A8678" }}>
                                    Requests raised in an operator console land here.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {requests.map((r) => (
                                    <div
                                        key={r.id}
                                        className="rounded-[16px] p-4"
                                        style={{
                                            backgroundColor: "#FFFFFF",
                                            border: r.status === "open" ? "1px solid rgba(217,119,6,0.28)" : "1px solid rgba(17,17,17,0.07)",
                                            opacity: r.status === "open" ? 1 : 0.7,
                                        }}
                                    >
                                        <div className="flex items-start gap-3 mb-3">
                                            <span
                                                className="material-symbols-outlined flex-shrink-0"
                                                style={{ color: r.status === "open" ? "#D97706" : "#16A34A" }}
                                            >
                                                {r.status === "open" ? "hourglass_top" : "check_circle"}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-sans font-bold" style={{ color: "#111111" }}>
                                                    {REQUEST_LABELS[r.kind]}{r.plate ? ` · ${r.plate}` : ""}
                                                </p>
                                                <p className="font-mono text-[10px] uppercase tracking-wider mt-0.5" style={{ color: "#8A8678" }}>
                                                    {r.operatorName} · {new Date(r.raisedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="font-sans text-sm mb-4" style={{ color: "rgba(17,17,17,0.78)", lineHeight: 1.6 }}>{r.detail}</p>
                                        {r.status === "open" && (
                                            <div className="flex gap-2">
                                                {r.vehicleId && (
                                                    <Link href={`/fleet/assess?vehicle=${r.vehicleId}`} className="q-btn-outline flex-1 justify-center">
                                                        Assess vehicle
                                                    </Link>
                                                )}
                                                <button
                                                    onClick={() => { resolveRequest(r.id); toast("Request marked as handled", "success"); }}
                                                    className="q-btn-dark flex-1 justify-center"
                                                >
                                                    Mark handled
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* ── VERIFY ── */}
                {tab === "verify" && (
                    <>
                        <h2 className="font-sans font-black text-xl mb-1" style={{ color: "#111111", letterSpacing: "-0.02em" }}>
                            Awaiting Verification
                        </h2>
                        <p className="font-sans text-sm mb-5" style={{ color: "#8A8678", lineHeight: 1.6 }}>
                            Vehicles a driver registered themselves. Confirm the paperwork and assign an operator before they carry passengers.
                        </p>

                        {pendingVerification.length === 0 ? (
                            <div className="py-16 flex flex-col items-center text-center">
                                <span className="material-symbols-outlined text-5xl mb-3" style={{ color: "#16A34A" }}>verified</span>
                                <p className="font-sans font-bold" style={{ color: "#111111" }}>Nothing waiting</p>
                                <p className="font-sans text-sm mt-1" style={{ color: "#8A8678" }}>
                                    Every vehicle on the register has been verified.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {pendingVerification.map((v) => (
                                    <VerifyCard
                                        key={v.id}
                                        vehicle={v}
                                        operators={operators}
                                        onVerify={(operatorId, licenceExpiry, permitNumber) => {
                                            const op = operators.find((o) => o.id === operatorId);
                                            updateVehicle(v.id, {
                                                operatorId,
                                                operatorName: op?.name || "Unassigned",
                                                licenceExpiry,
                                                permitNumber,
                                            });
                                            verifyVehicle(v.id);
                                            toast(`${v.plate} verified and assigned to ${op?.name}`, "success");
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* ── ASSESSMENTS ── */}
                {tab === "assessments" && (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-sans font-black text-xl" style={{ color: "#111111", letterSpacing: "-0.02em" }}>
                                Assessment Records
                            </h2>
                            <Link href="/fleet/assess" className="q-btn-dark">
                                <span className="material-symbols-outlined text-lg">fact_check</span>
                                New Assessment
                            </Link>
                        </div>

                        {assessments.length === 0 ? (
                            <div className="py-16 flex flex-col items-center text-center">
                                <span className="material-symbols-outlined text-5xl mb-3" style={{ color: "#CDDFF6" }}>fact_check</span>
                                <p className="font-sans font-bold mb-1" style={{ color: "#111111" }}>No assessments recorded yet</p>
                                <p className="font-sans text-sm mb-6 max-w-xs" style={{ color: "#8A8678", lineHeight: 1.6 }}>
                                    Every roadworthy, safety, cleanliness and conduct check is saved here permanently.
                                </p>
                                <Link href="/fleet/assess" className="q-btn-dark">Record the first one</Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {[...assessments]
                                    .sort((a, b) => b.assessedAt.localeCompare(a.assessedAt))
                                    .map((a) => {
                                        const r = RESULT_STYLES[a.result];
                                        const failures = a.items.filter((i) => i.status === "fail");
                                        const vehicle = vehicles.find((v) => v.id === a.vehicleId);
                                        return (
                                            <div
                                                key={a.id}
                                                className="rounded-[16px] p-4"
                                                style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(17,17,17,0.07)", boxShadow: "0 2px 8px rgba(17,17,17,0.05)" }}
                                            >
                                                <div className="flex items-start justify-between gap-3 mb-3">
                                                    <div className="min-w-0">
                                                        <p className="font-sans font-bold truncate" style={{ color: "#111111" }}>
                                                            {ASSESSMENT_LABELS[a.type]}
                                                        </p>
                                                        <p className="font-mono text-[10px] uppercase tracking-wider mt-0.5" style={{ color: "#8A8678" }}>
                                                            {a.plate}
                                                            {vehicle && ` · ${vehicle.operatorName}`}
                                                            {" · "}
                                                            {new Date(a.assessedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })} · {a.assessor}
                                                        </p>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <p className="font-sans font-black text-xl leading-none" style={{ color: r.color }}>{a.score}</p>
                                                        <span
                                                            className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded-full inline-block mt-1"
                                                            style={{ backgroundColor: r.bg, color: r.color }}
                                                        >
                                                            {r.label}
                                                        </span>
                                                    </div>
                                                </div>

                                                {failures.length > 0 && (
                                                    <div
                                                        className="rounded-[10px] p-3 mb-3"
                                                        style={{ backgroundColor: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.18)" }}
                                                    >
                                                        <p className="font-mono text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#DC2626" }}>
                                                            {failures.length} item{failures.length === 1 ? "" : "s"} failed
                                                        </p>
                                                        <ul className="space-y-1">
                                                            {failures.map((f) => (
                                                                <li key={f.label} className="font-sans text-xs" style={{ color: "rgba(17,17,17,0.75)" }}>
                                                                    {f.label}{f.note ? ` · ${f.note}` : ""}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {a.notes && (
                                                    <p className="font-sans text-sm mb-3" style={{ color: "rgba(17,17,17,0.72)", lineHeight: 1.6 }}>{a.notes}</p>
                                                )}

                                                <p className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "#AEA89C" }}>
                                                    Ref {a.id} · next due {new Date(a.nextDue).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                                                </p>
                                            </div>
                                        );
                                    })}
                            </div>
                        )}
                    </>
                )}

                {/* ── COMPLIANCE ── */}
                {tab === "compliance" && (
                    <>
                        <h2 className="font-sans font-black text-xl mb-1" style={{ color: "#111111", letterSpacing: "-0.02em" }}>
                            Compliance Overview
                        </h2>
                        <p className="font-sans text-sm mb-5" style={{ color: "#8A8678", lineHeight: 1.6 }}>
                            Vehicles across every fleet that need attention. Anything listed here is already hidden from passenger search and its driver cannot go online.
                        </p>

                        {(() => {
                            const flagged = vehicles
                                .map((v) => {
                                    const last = latestFor(v.id);
                                    const licence = licenceState(v.licenceExpiry);
                                    const issues: string[] = [];
                                    const blocked = blockingReason(v);
                                    if (blocked) issues.push(blocked);
                                    if (!last) issues.push("Never assessed");
                                    if (last?.result === "conditional") issues.push("Conditional pass, correction outstanding");
                                    if (licence === "soon") issues.push("Operating licence expires within 60 days");
                                    return { vehicle: v, issues: [...new Set(issues)] };
                                })
                                .filter((r) => r.issues.length > 0);

                            if (flagged.length === 0) {
                                return (
                                    <div className="py-16 flex flex-col items-center text-center">
                                        <span className="material-symbols-outlined text-5xl mb-3" style={{ color: "#16A34A" }}>verified</span>
                                        <p className="font-sans font-bold" style={{ color: "#111111" }}>Every vehicle is compliant</p>
                                    </div>
                                );
                            }

                            return (
                                <div className="space-y-3">
                                    {flagged.map(({ vehicle: v, issues }) => (
                                        <div
                                            key={v.id}
                                            className="rounded-[16px] p-4"
                                            style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(220,38,38,0.22)", boxShadow: "0 2px 8px rgba(17,17,17,0.05)" }}
                                        >
                                            <div className="flex items-center justify-between gap-3 mb-3">
                                                <div className="min-w-0">
                                                    <p className="font-sans font-bold truncate" style={{ color: "#111111" }}>{v.plate}</p>
                                                    <p className="font-sans text-xs truncate" style={{ color: "#8A8678" }}>
                                                        {v.operatorName} · {v.driverName}
                                                    </p>
                                                </div>
                                                <span
                                                    className="font-mono text-[10px] font-bold uppercase px-2.5 py-1 rounded-full flex-shrink-0"
                                                    style={{ backgroundColor: STATUS_STYLES[v.status].bg, color: STATUS_STYLES[v.status].color }}
                                                >
                                                    {STATUS_STYLES[v.status].label}
                                                </span>
                                            </div>
                                            <ul className="space-y-1.5 mb-4">
                                                {issues.map((i) => (
                                                    <li key={i} className="flex gap-2 items-start">
                                                        <span className="material-symbols-outlined text-base flex-shrink-0" style={{ color: "#DC2626" }}>error</span>
                                                        <span className="font-sans text-sm" style={{ color: "rgba(17,17,17,0.78)" }}>{i}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                            <div className="flex gap-2">
                                                <Link href={`/fleet/assess?vehicle=${v.id}`} className="q-btn-dark flex-1 justify-center">
                                                    <span className="material-symbols-outlined text-lg">fact_check</span>
                                                    Assess
                                                </Link>
                                                {v.verified && v.status !== "active" && (
                                                    <button
                                                        onClick={() => {
                                                            setVehicleStatus(v.id, "active");
                                                            toast(`${v.plate} returned to service`, "success");
                                                        }}
                                                        className="q-btn-outline flex-1 justify-center"
                                                    >
                                                        Return to service
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </>
                )}
            </div>

            {/* ── Suspend dialog ── */}
            {suspendTarget && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
                    style={{ backgroundColor: "rgba(17,17,17,0.45)" }}
                    onClick={() => setSuspendTarget(null)}
                >
                    <div
                        className="w-full max-w-md rounded-[18px] p-5"
                        style={{ backgroundColor: "#FFFFFF" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="font-sans font-black text-lg mb-1" style={{ color: "#111111", letterSpacing: "-0.02em" }}>
                            Suspend {suspendTarget.plate}
                        </h3>
                        <p className="font-sans text-sm mb-4" style={{ color: "#8A8678", lineHeight: 1.6 }}>
                            {suspendTarget.driverName} will not be able to go online, and this taxi disappears from passenger search immediately.
                        </p>
                        <div className="space-y-2 mb-4">
                            {SUSPEND_REASONS.map((reason) => (
                                <button
                                    key={reason}
                                    onClick={() => {
                                        setVehicleStatus(suspendTarget.id, "suspended", reason);
                                        toast(`${suspendTarget.plate} suspended · ${suspendTarget.driverName} notified`, "error");
                                        setSuspendTarget(null);
                                        setExpanded(null);
                                    }}
                                    className="w-full text-left px-4 py-3 rounded-[12px] font-sans text-sm font-semibold transition-colors"
                                    style={{ backgroundColor: "#FFFCF9", border: "1px solid rgba(17,17,17,0.08)", color: "#111111" }}
                                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(220,38,38,0.06)"; }}
                                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#FFFCF9"; }}
                                >
                                    {reason}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setSuspendTarget(null)} className="q-btn-outline w-full justify-center">Cancel</button>
                    </div>
                </div>
            )}
        </main>
    );
}

/* ── Vehicle card ── */
function VehicleCard({
    vehicle: v,
    expanded,
    onToggle,
    onStatusChange,
    onReassign,
    operators,
    history,
    blocked,
}: {
    vehicle: Vehicle;
    expanded: boolean;
    onToggle: () => void;
    onStatusChange: (s: VehicleStatus) => void;
    onReassign: (operatorId: string) => void;
    operators: { id: string; name: string; count: number }[];
    history: ReturnType<ReturnType<typeof useFleet>["assessmentsFor"]>;
    blocked: string | null;
}) {
    const status = STATUS_STYLES[v.status];
    const last = history[0];
    const licence = licenceState(v.licenceExpiry);

    return (
        <div
            className="rounded-[16px] overflow-hidden"
            style={{
                backgroundColor: "#FFFFFF",
                border: blocked ? "1px solid rgba(220,38,38,0.22)" : "1px solid rgba(17,17,17,0.07)",
                boxShadow: "0 2px 8px rgba(17,17,17,0.05)",
            }}
        >
            <button onClick={onToggle} className="w-full flex items-center gap-3 p-4 text-left">
                <div
                    className="w-12 h-12 rounded-[12px] flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: blocked ? "rgba(220,38,38,0.08)" : "#EEF1EA", color: blocked ? "#DC2626" : "#1D3686" }}
                >
                    <span className="material-symbols-outlined">airport_shuttle</span>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="font-sans font-bold truncate" style={{ color: "#111111" }}>{v.plate}</p>
                        <span
                            className="font-mono text-[9px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: status.bg, color: status.color }}
                        >
                            {status.label}
                        </span>
                        {!v.verified && (
                            <span
                                className="font-mono text-[9px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: "rgba(217,119,6,0.12)", color: "#D97706" }}
                            >
                                Unverified
                            </span>
                        )}
                    </div>
                    <p className="font-sans text-xs truncate mt-0.5" style={{ color: "#8A8678" }}>
                        {v.operatorName} · {v.driverName} · {v.capacity} seats
                    </p>
                </div>
                <div className="text-right flex-shrink-0">
                    {last ? (
                        <>
                            <p className="font-sans font-black text-lg leading-none" style={{ color: RESULT_STYLES[last.result].color }}>{last.score}</p>
                            <p className="font-mono text-[9px] uppercase" style={{ color: "#AEA89C" }}>last score</p>
                        </>
                    ) : (
                        <p className="font-mono text-[9px] uppercase" style={{ color: "#D97706" }}>Not assessed</p>
                    )}
                </div>
                <span
                    className="material-symbols-outlined flex-shrink-0 transition-transform"
                    style={{ color: "#AEA89C", transform: expanded ? "rotate(180deg)" : undefined }}
                >
                    expand_more
                </span>
            </button>

            {blocked && (
                <div className="mx-4 mb-4 px-3 py-2.5 rounded-[10px] flex gap-2 items-start" style={{ backgroundColor: "rgba(220,38,38,0.06)" }}>
                    <span className="material-symbols-outlined text-base flex-shrink-0" style={{ color: "#DC2626" }}>block</span>
                    <p className="font-sans text-xs" style={{ color: "rgba(17,17,17,0.78)", lineHeight: 1.5 }}>
                        Off the road: {blocked}
                    </p>
                </div>
            )}

            {expanded && (
                <div className="px-4 pb-4" style={{ borderTop: "1px solid rgba(17,17,17,0.06)" }}>
                    <div className="grid grid-cols-2 gap-y-3 py-4">
                        {[
                            { k: "Fleet ID", v: v.id },
                            { k: "Operator", v: v.operatorName },
                            { k: "Home rank", v: v.homeRank },
                            { k: "Route", v: v.route },
                            { k: "Driver phone", v: v.driverPhone || "Not recorded" },
                            { k: "Odometer", v: `${v.odometer.toLocaleString("en-ZA")} km` },
                            { k: "Operating licence", v: v.permitNumber },
                            {
                                k: "Licence expiry",
                                v: v.licenceExpiry
                                    ? new Date(v.licenceExpiry).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })
                                    : "Not recorded",
                                warn: licence !== "ok",
                            },
                        ].map((row) => (
                            <div key={row.k}>
                                <p className="font-mono text-[9px] font-bold uppercase tracking-wider" style={{ color: "#AEA89C" }}>{row.k}</p>
                                <p className="font-sans text-xs font-semibold mt-0.5" style={{ color: row.warn ? "#DC2626" : "#111111" }}>{row.v}</p>
                            </div>
                        ))}
                    </div>

                    <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#AEA89C" }}>
                        Assessment History
                    </p>
                    {history.length === 0 ? (
                        <p className="font-sans text-sm mb-4" style={{ color: "#8A8678" }}>No assessment has been recorded for this vehicle.</p>
                    ) : (
                        <div className="space-y-2 mb-4">
                            {history.map((a) => (
                                <div
                                    key={a.id}
                                    className="flex items-center gap-3 p-3 rounded-[10px]"
                                    style={{ backgroundColor: "#FFFCF9", border: "1px solid rgba(17,17,17,0.06)" }}
                                >
                                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: RESULT_STYLES[a.result].color }} />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-sans text-xs font-bold truncate" style={{ color: "#111111" }}>{ASSESSMENT_LABELS[a.type]}</p>
                                        <p className="font-mono text-[10px]" style={{ color: "#AEA89C" }}>
                                            {new Date(a.assessedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })} · {a.assessor}
                                        </p>
                                    </div>
                                    <span
                                        className="font-mono text-[10px] font-bold uppercase px-2 py-1 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: RESULT_STYLES[a.result].bg, color: RESULT_STYLES[a.result].color }}
                                    >
                                        {a.score} · {RESULT_STYLES[a.result].label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#AEA89C" }}>
                        Service Status
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {STATUS_ORDER.map((s) => (
                            <button
                                key={s}
                                onClick={() => onStatusChange(s)}
                                className="px-3.5 py-1.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider transition-all"
                                style={v.status === s
                                    ? { backgroundColor: STATUS_STYLES[s].color, color: "#FFFFFF" }
                                    : { backgroundColor: "#EEF1EA", color: "#5C5A56" }}
                            >
                                {STATUS_STYLES[s].label}
                            </button>
                        ))}
                    </div>

                    <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#AEA89C" }}>
                        Move To Another Operator
                    </p>
                    <select
                        className="q-input mb-4"
                        value={v.operatorId}
                        onChange={(e) => onReassign(e.target.value)}
                    >
                        {operators.map((o) => (
                            <option key={o.id} value={o.id}>{o.name}</option>
                        ))}
                    </select>

                    <Link href={`/fleet/assess?vehicle=${v.id}`} className="q-btn-dark w-full justify-center">
                        <span className="material-symbols-outlined text-lg">fact_check</span>
                        Record an assessment
                    </Link>
                </div>
            )}
        </div>
    );
}

/* ── Verification card for driver-registered vehicles ── */
function VerifyCard({
    vehicle: v,
    operators,
    onVerify,
}: {
    vehicle: Vehicle;
    operators: { id: string; name: string; count: number }[];
    onVerify: (operatorId: string, licenceExpiry: string, permitNumber: string) => void;
}) {
    const [operatorId, setOperatorId] = useState(v.operatorId || "");
    const [licenceExpiry, setLicenceExpiry] = useState(v.licenceExpiry || "");
    const [permitNumber, setPermitNumber] = useState(v.permitNumber === "Pending" ? "" : v.permitNumber);
    const [error, setError] = useState("");

    return (
        <div
            className="rounded-[16px] p-4"
            style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(217,119,6,0.28)", boxShadow: "0 2px 8px rgba(17,17,17,0.05)" }}
        >
            <div className="flex items-center gap-3 mb-3">
                <div
                    className="w-11 h-11 rounded-[12px] flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "rgba(217,119,6,0.10)", color: "#D97706" }}
                >
                    <span className="material-symbols-outlined">pending</span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-sans font-bold truncate" style={{ color: "#111111" }}>{v.plate}</p>
                    <p className="font-sans text-xs truncate" style={{ color: "#8A8678" }}>
                        {v.model} · registered by {v.driverName}
                        {v.driverPhone && ` · ${v.driverPhone}`}
                    </p>
                </div>
            </div>

            {error && <p className="font-sans text-xs mb-3" style={{ color: "#DC2626" }}>{error}</p>}

            <div className="grid sm:grid-cols-3 gap-3 mb-4">
                <div className="sm:col-span-3">
                    <label className="q-label">Assign to operator</label>
                    <select className="q-input" value={operatorId} onChange={(e) => setOperatorId(e.target.value)}>
                        <option value="">Choose an operator</option>
                        {operators.map((o) => (
                            <option key={o.id} value={o.id}>{o.name}</option>
                        ))}
                    </select>
                </div>
                <div className="sm:col-span-2">
                    <label className="q-label">Operating licence</label>
                    <input className="q-input" placeholder="OL-EC-00000" value={permitNumber} onChange={(e) => setPermitNumber(e.target.value)} />
                </div>
                <div>
                    <label className="q-label">Expiry</label>
                    <input type="date" className="q-input" value={licenceExpiry} onChange={(e) => setLicenceExpiry(e.target.value)} />
                </div>
            </div>

            <button
                onClick={() => {
                    if (!operatorId) { setError("Choose which operator this vehicle belongs to."); return; }
                    if (!licenceExpiry) { setError("Record the operating licence expiry date."); return; }
                    onVerify(operatorId, licenceExpiry, permitNumber.trim() || "Pending");
                }}
                className="q-btn-dark w-full justify-center"
            >
                <span className="material-symbols-outlined text-lg">verified</span>
                Verify and put on standby
            </button>
        </div>
    );
}

export default function FleetPage() {
    return (
        <OperatorGate area="fleet">
            <FleetContent />
        </OperatorGate>
    );
}

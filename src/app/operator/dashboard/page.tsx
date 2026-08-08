"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import AuthGuard from "@/components/AuthGuard";

/* ─── constants ─── */
const navItems = [
    { icon: "grid_view",       label: "Dashboard", tab: "dashboard" },
    { icon: "local_taxi",      label: "Fleet",     tab: "fleet"     },
    { icon: "monitoring",      label: "Analytics", tab: "analytics" },
    { icon: "manage_accounts", label: "Settings",  tab: "settings"  },
];

const ALERTS = [
    { title: "Vehicle Maintenance", time: "2m ago",  desc: "Vehicle Y: Brake pad replacement due immediately.",     icon: "warning",             accent: "#D97706" },
    { title: "Driver Offline",      time: "15m ago", desc: "Driver X: Signal lost near East London Central.",        icon: "signal_disconnected", accent: "#1D3686" },
    { title: "Speeding Alert",      time: "42m ago", desc: "Vehicle Z: Exceeded 120km/h on N2 North.",              icon: "speed",               accent: "#DC2626" },
    { title: "Shift Completed",     time: "1h ago",  desc: "Driver M has successfully signed off shift.",           icon: "check_circle",        accent: "#16A34A" },
];

type FleetStatus = "online" | "busy" | "offline" | "suspended";

interface FleetVehicle {
    id: string; plate: string; driver: string; phone: string;
    status: FleetStatus; route: string;
    passengers: number; capacity: number; fuel: number; km: string;
    suspendedAt?: number;
}

const FOUR_WEEKS_MS = 28 * 24 * 60 * 60 * 1000;
function daysRemaining(suspendedAt: number) {
    return Math.max(0, Math.ceil((suspendedAt + FOUR_WEEKS_MS - Date.now()) / (24 * 60 * 60 * 1000)));
}

const FLEET_INITIAL: FleetVehicle[] = [
    { id: "QLR-T01", plate: "EC 123-456", driver: "Sipho Ndlovu",   phone: "+27 63 123 4567", status: "online",  route: "Beacon Bay → Mdantsane",            passengers: 9,  capacity: 15, fuel: 78, km: "14,320 km" },
    { id: "QLR-T02", plate: "EC 789-012", driver: "Thabo Mokoena",  phone: "+27 71 234 5678", status: "busy",    route: "East London → King William's Town",  passengers: 14, capacity: 15, fuel: 45, km: "22,100 km" },
    { id: "QLR-T03", plate: "EC 345-678", driver: "Nomsa Dlamini",  phone: "+27 82 345 6789", status: "online",  route: "Southernwood → Beacon Bay",          passengers: 6,  capacity: 15, fuel: 91, km: "8,760 km"  },
    { id: "QLR-T04", plate: "EC 901-234", driver: "Luyanda Zulu",   phone: "+27 61 456 7890", status: "offline", route: "-",                                  passengers: 0,  capacity: 15, fuel: 20, km: "31,450 km" },
    { id: "QLR-T05", plate: "EC 567-890", driver: "Zanele Khumalo", phone: "+27 73 567 8901", status: "busy",    route: "Mdantsane → City Centre",            passengers: 11, capacity: 15, fuel: 63, km: "18,900 km" },
];

const WEEKLY_TRIPS = [
    { day: "Mon", trips: 38, revenue: 9120 },
    { day: "Tue", trips: 44, revenue: 10560 },
    { day: "Wed", trips: 31, revenue: 7440 },
    { day: "Thu", trips: 52, revenue: 12480 },
    { day: "Fri", trips: 61, revenue: 14640 },
    { day: "Sat", trips: 47, revenue: 11280 },
    { day: "Sun", trips: 42, revenue: 10080 },
];

const SUSPEND_REASONS = [
    "Safety Violation", "Customer Complaints (3+ reports)",
    "Vehicle in Poor Condition", "Licence / Documentation Issue",
    "Fraudulent Activity", "Other",
];

function statusStyle(s: string) {
    if (s === "online")    return { dot: "#16A34A", badge: { bg: "rgba(22,163,74,0.10)",  color: "#16A34A", border: "rgba(22,163,74,0.30)"  } };
    if (s === "busy")      return { dot: "#1D3686", badge: { bg: "rgba(37,99,235,0.10)",  color: "#1D3686", border: "rgba(37,99,235,0.25)"  } };
    if (s === "suspended") return { dot: "#DC2626", badge: { bg: "rgba(220,38,38,0.10)",  color: "#DC2626", border: "rgba(220,38,38,0.25)"  } };
    return                        { dot: "#AEA89C", badge: { bg: "rgba(17,17,17,0.05)",   color: "#8A8678", border: "rgba(17,17,17,0.12)"  } };
}

type AuthUser = ReturnType<typeof import("@/app/context/AuthContext").useAuth>["user"];

/* ─── TabDashboard ─── */
function TabDashboard({ user, fleet }: { user: AuthUser; fleet: FleetVehicle[] }) {
    const active = fleet.filter((v) => v.status !== "offline" && v.status !== "suspended").length;
    const offline = fleet.filter((v) => v.status === "offline").length;

    const stats = [
        { label: "Trips Today",  value: "42",       trend: "+12%", up: true, icon: "route"        },
        { label: "Active Taxis", value: String(active), trend: "+1", up: true,  icon: "electric_car" },
        { label: "Revenue",      value: "R 12,450", trend: "+5%",  up: true,  icon: "payments"     },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div
                className="rounded-[20px] px-5 pt-5 pb-5"
                style={{ backgroundColor: "#E1EDF5" }}
            >
                <p
                    className="font-sans font-bold text-xs uppercase tracking-widest mb-1"
                    style={{ color: "rgba(17,17,17,0.50)" }}
                >
                    Overview
                </p>
                <h2
                    className="font-sans font-black text-2xl"
                    style={{ color: "#111111", letterSpacing: "-0.02em" }}
                >
                    {user?.name || "Operator"}
                </h2>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
                {stats.map((s, i) => (
                    <div
                        key={i}
                        className="rounded-[16px] p-4"
                        style={{
                            backgroundColor: "#FFFFFF",
                            border: "1px solid rgba(17,17,17,0.07)",
                            boxShadow: "0 2px 8px rgba(17,17,17,0.05)",
                        }}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <p className="font-sans text-[10px] font-bold uppercase tracking-wider leading-tight" style={{ color: "#8A8678" }}>
                                {s.label}
                            </p>
                            <span className="material-symbols-outlined text-base" style={{ color: "#111111" }}>{s.icon}</span>
                        </div>
                        <p className="font-sans font-black text-xl leading-none" style={{ color: "#111111", letterSpacing: "-0.02em" }}>{s.value}</p>
                        <p className="font-sans text-xs font-bold mt-1 flex items-center gap-0.5" style={{ color: s.up ? "#16A34A" : "#DC2626" }}>
                            <span className="material-symbols-outlined text-xs">{s.up ? "trending_up" : "trending_down"}</span>
                            {s.trend}
                        </p>
                    </div>
                ))}
            </div>

            {/* Live map */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3
                        className="font-sans font-black text-base"
                        style={{ color: "#111111", letterSpacing: "-0.01em" }}
                    >
                        Live Fleet Distribution
                    </h3>
                    <span className="flex items-center gap-1.5 font-sans text-xs font-bold" style={{ color: "#16A34A" }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#16A34A" }} />
                        Live
                    </span>
                </div>
                <div
                    className="relative w-full aspect-video rounded-[18px] overflow-hidden bg-cover bg-center"
                    style={{
                        backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1000')",
                        border: "1px solid rgba(17,17,17,0.08)",
                        boxShadow: "0 8px 28px rgba(17,17,17,0.10)",
                    }}
                >
                    <div className="absolute inset-0" style={{ backgroundColor: "rgba(17,17,17,0.25)" }} />
                    <div className="absolute inset-0">
                        {[
                            { top: "35%", left: "28%", label: "T01", color: "#CDDFF6" },
                            { top: "55%", left: "52%", label: "T02", color: "#1D3686" },
                            { top: "22%", left: "63%", label: "T03", color: "#16A34A" },
                            { top: "65%", left: "38%", label: "T05", color: "#1D3686" },
                        ].map((dot) => (
                            <div key={dot.label} className="absolute flex flex-col items-center" style={{ top: dot.top, left: dot.left }}>
                                <div
                                    className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center"
                                    style={{ backgroundColor: dot.color, boxShadow: "0 2px 8px rgba(17,17,17,0.30)" }}
                                >
                                    <span className="material-symbols-outlined text-[#111111] text-[13px]">local_taxi</span>
                                </div>
                                <span
                                    className="font-sans text-[8px] font-bold px-1 rounded mt-0.5"
                                    style={{ color: "#FFFFFF", backgroundColor: "rgba(17,17,17,0.75)" }}
                                >
                                    {dot.label}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 flex gap-2">
                        {[
                            { dot: "#16A34A", label: `${active} Active` },
                            { dot: "#AEA89C", label: `${offline} Offline` },
                        ].map((item) => (
                            <div
                                key={item.label}
                                className="px-3 py-1.5 rounded-full flex items-center gap-2"
                                style={{ backgroundColor: "rgba(255,255,255,0.88)", backdropFilter: "blur(8px)" }}
                            >
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.dot }} />
                                <span className="font-sans text-xs font-bold" style={{ color: "#111111" }}>{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Alerts */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-sans font-black text-base" style={{ color: "#111111", letterSpacing: "-0.01em" }}>Recent Alerts</h3>
                    <span
                        className="font-sans text-xs font-bold px-3 py-1 rounded-full"
                        style={{ backgroundColor: "#CDDFF6", color: "#111111" }}
                    >
                        {ALERTS.length} new
                    </span>
                </div>
                <div className="space-y-3">
                    {ALERTS.map((a, i) => (
                        <div
                            key={i}
                            className="flex items-start gap-3 p-4 rounded-[14px]"
                            style={{
                                backgroundColor: "#FFFFFF",
                                border: "1px solid rgba(17,17,17,0.07)",
                                borderLeft: `3px solid ${a.accent}`,
                                boxShadow: "0 2px 8px rgba(17,17,17,0.05)",
                            }}
                        >
                            <span className="material-symbols-outlined flex-shrink-0" style={{ color: a.accent }}>{a.icon}</span>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <p className="font-sans text-sm font-bold" style={{ color: "#111111" }}>{a.title}</p>
                                    <span className="font-sans text-[10px] uppercase ml-2 flex-shrink-0" style={{ color: "#AEA89C" }}>{a.time}</span>
                                </div>
                                <p className="font-sans text-xs mt-0.5" style={{ color: "#5C5A56" }}>{a.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ─── SuspendModal ─── */
function SuspendModal({ vehicle, onClose, onConfirm }: {
    vehicle: FleetVehicle;
    onClose: () => void;
    onConfirm: (reason: string, description: string, fileName: string) => void;
}) {
    const [reason, setReason] = useState("");
    const [description, setDescription] = useState("");
    const [fileName, setFileName] = useState("");
    const [error, setError] = useState("");

    function handleSubmit() {
        if (!reason) { setError("Please select a suspension reason."); return; }
        if (description.trim().length < 20) { setError("Please provide a detailed description (min. 20 characters)."); return; }
        if (!fileName) { setError("Please attach a supporting document."); return; }
        onConfirm(reason, description, fileName);
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ backgroundColor: "rgba(17,17,17,0.60)" }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="w-full max-w-lg rounded-t-[24px] p-6 space-y-5 max-h-[90vh] overflow-y-auto"
                style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(17,17,17,0.08)" }}
            >
                <div className="w-10 h-1 rounded-full mx-auto -mt-1 mb-1" style={{ backgroundColor: "rgba(17,17,17,0.12)" }} />

                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(220,38,38,0.10)" }}>
                        <span className="material-symbols-outlined" style={{ color: "#DC2626" }}>block</span>
                    </div>
                    <div>
                        <h3 className="font-sans font-black text-lg" style={{ color: "#111111", letterSpacing: "-0.02em" }}>Suspend Driver</h3>
                        <p className="font-sans text-sm" style={{ color: "#8A8678" }}>{vehicle.driver} · {vehicle.plate}</p>
                    </div>
                </div>

                <div className="rounded-[12px] p-4 flex gap-3" style={{ backgroundColor: "rgba(217,119,6,0.08)", border: "1.5px solid rgba(217,119,6,0.25)" }}>
                    <span className="material-symbols-outlined text-xl flex-shrink-0" style={{ color: "#D97706" }}>info</span>
                    <p className="font-sans text-sm leading-relaxed" style={{ color: "#5C5A56" }}>
                        The driver will receive an SMS and have <strong style={{ color: "#111111" }}>4 weeks</strong> to resolve the issue before permanent action is taken.
                    </p>
                </div>

                {error && (
                    <div className="rounded-[12px] px-4 py-3 font-sans text-sm font-semibold" style={{ backgroundColor: "rgba(220,38,38,0.08)", border: "1.5px solid rgba(220,38,38,0.20)", color: "#DC2626" }}>
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="q-label">Suspension Reason <span style={{ color: "#DC2626" }}>*</span></label>
                        <select className="q-input-lg w-full" value={reason} onChange={(e) => setReason(e.target.value)}>
                            <option value="">Select a reason…</option>
                            {SUSPEND_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="q-label">Incident Description <span style={{ color: "#DC2626" }}>*</span></label>
                        <textarea
                            className="q-input-lg w-full resize-none"
                            style={{ height: "auto" }}
                            rows={4}
                            placeholder="Describe the incident in detail…"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                        <p className="font-sans text-xs mt-1" style={{ color: "#AEA89C" }}>{description.trim().length} / 20 min. characters</p>
                    </div>
                    <div>
                        <label className="q-label">Supporting Document <span style={{ color: "#DC2626" }}>*</span></label>
                        <label
                            className="border-2 border-dashed rounded-[14px] p-5 flex flex-col items-center gap-2 cursor-pointer transition-colors"
                            style={{
                                borderColor: fileName ? "rgba(22,163,74,0.40)" : "rgba(17,17,17,0.15)",
                                backgroundColor: fileName ? "rgba(22,163,74,0.06)" : "#FFFCF9",
                            }}
                        >
                            <input type="file" className="hidden" accept="image/*,.pdf,.doc,.docx" onChange={(e) => setFileName(e.target.files?.[0]?.name || "")} />
                            {fileName ? (
                                <>
                                    <span className="material-symbols-outlined text-2xl" style={{ color: "#16A34A", fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                    <span className="font-sans text-xs font-bold text-center break-all" style={{ color: "#16A34A" }}>{fileName}</span>
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-2xl" style={{ color: "#8A8678" }}>upload_file</span>
                                    <span className="font-sans text-xs font-bold" style={{ color: "#5C5A56" }}>Attach report or evidence file</span>
                                    <span className="font-sans text-[10px]" style={{ color: "#AEA89C" }}>PDF, Word, or image</span>
                                </>
                            )}
                        </label>
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3.5 rounded-[9999px] font-sans font-bold text-sm transition-colors"
                        style={{ border: "2px solid rgba(17,17,17,0.15)", color: "#5C5A56", backgroundColor: "transparent" }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex-1 py-3.5 rounded-[9999px] font-sans font-bold text-sm flex items-center justify-center gap-2"
                        style={{ backgroundColor: "#DC2626", color: "#FFFFFF" }}
                    >
                        <span className="material-symbols-outlined text-sm">block</span>
                        File Report & Suspend
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─── SmsToast ─── */
function SmsToast({ driver, reason, type, onClose }: { driver: string; reason: string; type: "suspend" | "reinstate"; onClose: () => void }) {
    const isSuspend = type === "suspend";
    return (
        <div className="fixed bottom-28 left-4 right-4 z-50 max-w-lg mx-auto">
            <div
                className="rounded-[16px] p-4 flex gap-3 items-start"
                style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid rgba(17,17,17,0.08)",
                    boxShadow: "0 12px 32px rgba(17,17,17,0.15)",
                }}
            >
                <div
                    className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: isSuspend ? "rgba(220,38,38,0.10)" : "rgba(22,163,74,0.10)" }}
                >
                    <span className="material-symbols-outlined text-base" style={{ color: isSuspend ? "#DC2626" : "#16A34A", fontVariationSettings: "'FILL' 1" }}>sms</span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-sans text-sm font-bold mb-0.5" style={{ color: "#111111" }}>
                        {isSuspend ? "Driver Suspended · SMS Sent" : "Driver Reinstated · SMS Sent"}
                    </p>
                    <p className="font-sans text-xs leading-relaxed" style={{ color: "#5C5A56" }}>
                        SMS to <span style={{ color: "#111111", fontWeight: 700 }}>{driver}</span>
                        {isSuspend
                            ? <>: Suspension notice sent. Reason: {reason}. <span style={{ color: "#111111", fontWeight: 700 }}>4 weeks</span> to resolve.</>
                            : <>: Driving licence reinstated. You may resume operations immediately.</>
                        }
                    </p>
                </div>
                <button onClick={onClose} style={{ color: "#AEA89C" }}>
                    <span className="material-symbols-outlined text-base">close</span>
                </button>
            </div>
        </div>
    );
}

/* ─── TabFleet ─── */
function TabFleet({ fleet, setFleet }: { fleet: FleetVehicle[]; setFleet: React.Dispatch<React.SetStateAction<FleetVehicle[]>> }) {
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [expanded, setExpanded] = useState<string | null>(null);
    const [suspendTarget, setSuspendTarget] = useState<FleetVehicle | null>(null);
    const [smsToast, setSmsToast] = useState<{ driver: string; reason: string; type: "suspend" | "reinstate" } | null>(null);

    const filters = ["all", "online", "busy", "offline", "suspended"];
    const visible = fleet.filter(
        (v) => (filter === "all" || v.status === filter) &&
               (v.plate.toLowerCase().includes(search.toLowerCase()) || v.driver.toLowerCase().includes(search.toLowerCase()))
    );

    function handleSuspendConfirm(reason: string, description: string, _fn: string) {
        if (!suspendTarget) return;
        setFleet((prev) => prev.map((v) => v.id === suspendTarget.id ? { ...v, status: "suspended" as FleetStatus, suspendedAt: Date.now() } : v));
        setSmsToast({ driver: suspendTarget.driver, reason, type: "suspend" });
        setSuspendTarget(null); setExpanded(null);
        setTimeout(() => setSmsToast(null), 8000);
    }
    function handleReinstate(vehicle: FleetVehicle) {
        setFleet((prev) => prev.map((v) => v.id === vehicle.id ? { ...v, status: "offline" as FleetStatus, suspendedAt: undefined } : v));
        setSmsToast({ driver: vehicle.driver, reason: "", type: "reinstate" });
        setExpanded(null);
        setTimeout(() => setSmsToast(null), 8000);
    }

    return (
        <>
            <div className="space-y-5">
                <h2
                    className="font-sans font-black text-2xl"
                    style={{ color: "#111111", letterSpacing: "-0.02em" }}
                >
                    Fleet Management
                </h2>

                <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#AEA89C" }}>search</span>
                    <input
                        className="q-input w-full pl-12"
                        placeholder="Search by plate or driver…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1">
                    {filters.map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className="flex-shrink-0 px-4 py-1.5 rounded-full font-sans text-xs font-bold capitalize transition-all"
                            style={filter === f
                                ? { backgroundColor: "#111111", color: "#FFFFFF" }
                                : { backgroundColor: "#EEF1EA", color: "#5C5A56", border: "1px solid rgba(17,17,17,0.08)" }
                            }
                        >
                            {f === "all" ? `All (${fleet.length})` : `${f} (${fleet.filter((v) => v.status === f).length})`}
                        </button>
                    ))}
                </div>

                <div className="space-y-3">
                    {visible.length === 0 && (
                        <div className="text-center py-12">
                            <span className="material-symbols-outlined text-4xl mb-2" style={{ color: "#E4E1DA" }}>local_taxi</span>
                            <p className="font-sans text-sm" style={{ color: "#AEA89C" }}>No vehicles match your filter</p>
                        </div>
                    )}
                    {visible.map((v) => {
                        const ss = statusStyle(v.status);
                        const isOpen = expanded === v.id;
                        const isSuspended = v.status === "suspended";
                        return (
                            <div
                                key={v.id}
                                className="overflow-hidden rounded-[16px]"
                                style={{
                                    backgroundColor: "#FFFFFF",
                                    border: "1px solid rgba(17,17,17,0.07)",
                                    boxShadow: "0 2px 8px rgba(17,17,17,0.05)",
                                }}
                            >
                                <button
                                    className="w-full flex items-center gap-3 p-4 text-left transition-colors"
                                    onClick={() => setExpanded(isOpen ? null : v.id)}
                                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#FFFCF9"; }}
                                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = ""; }}
                                >
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center border-2 flex-shrink-0"
                                        style={{ borderColor: ss.dot, backgroundColor: `${ss.dot}15` }}
                                    >
                                        <span className="material-symbols-outlined text-base" style={{ color: ss.dot }}>local_taxi</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-sans font-bold" style={{ color: "#111111" }}>{v.plate}</p>
                                            <span
                                                className="font-sans text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                                                style={{ backgroundColor: ss.badge.bg, color: ss.badge.color, border: `1px solid ${ss.badge.border}` }}
                                            >
                                                {v.status}
                                            </span>
                                        </div>
                                        <p className="font-sans text-xs truncate" style={{ color: "#8A8678" }}>{v.driver}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0 mr-2">
                                        <p className="font-sans text-sm font-bold" style={{ color: "#111111" }}>
                                            {v.passengers}<span style={{ color: "#AEA89C", fontWeight: 400 }}>/{v.capacity}</span>
                                        </p>
                                        <p className="font-sans text-[10px]" style={{ color: "#AEA89C" }}>seats</p>
                                    </div>
                                    <span
                                        className={`material-symbols-outlined text-base transition-transform ${isOpen ? "rotate-180" : ""}`}
                                        style={{ color: "#AEA89C" }}
                                    >
                                        expand_more
                                    </span>
                                </button>

                                {isOpen && (
                                    <div
                                        className="px-4 pb-4 pt-3 space-y-3"
                                        style={{ borderTop: "1px solid rgba(17,17,17,0.07)", backgroundColor: "#FFFCF9" }}
                                    >
                                        <p className="font-sans text-xs flex items-center gap-1" style={{ color: "#5C5A56" }}>
                                            <span className="material-symbols-outlined text-sm" style={{ color: "#111111" }}>route</span>
                                            {v.route}
                                        </p>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[{ label: "Odometer", value: v.km }].map((item) => (
                                                <div
                                                    key={item.label}
                                                    className="rounded-[10px] p-3"
                                                    style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(17,17,17,0.07)" }}
                                                >
                                                    <p className="font-sans text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "#AEA89C" }}>{item.label}</p>
                                                    <p className="font-sans text-sm font-bold" style={{ color: "#111111" }}>{item.value}</p>
                                                </div>
                                            ))}
                                            <div className="rounded-[10px] p-3" style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(17,17,17,0.07)" }}>
                                                <p className="font-sans text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "#AEA89C" }}>Fuel Level</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#EEF1EA" }}>
                                                        <div className="h-full rounded-full" style={{
                                                            width: `${v.fuel}%`,
                                                            backgroundColor: v.fuel > 50 ? "#16A34A" : v.fuel > 25 ? "#D97706" : "#DC2626"
                                                        }} />
                                                    </div>
                                                    <p className="font-sans text-sm font-bold" style={{ color: "#111111" }}>{v.fuel}%</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between font-sans text-[10px] mb-1" style={{ color: "#AEA89C" }}>
                                                <span>Passenger Load</span><span>{v.passengers}/{v.capacity}</span>
                                            </div>
                                            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#EEF1EA" }}>
                                                <div className="h-full rounded-full" style={{ width: `${(v.passengers / v.capacity) * 100}%`, backgroundColor: "#111111" }} />
                                            </div>
                                        </div>

                                        {isSuspended ? (() => {
                                            const days = v.suspendedAt ? daysRemaining(v.suspendedAt) : 0;
                                            return days === 0 ? (
                                                <div
                                                    className="space-y-2 rounded-[12px] p-4"
                                                    style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(17,17,17,0.07)" }}
                                                >
                                                    <p className="font-sans text-sm font-bold" style={{ color: "#111111" }}>Reinstatement Window Expired</p>
                                                    <p className="font-sans text-xs leading-relaxed" style={{ color: "#5C5A56" }}>The 4-week window has passed. This driver must re-register.</p>
                                                    <a href="/auth/signup?role=driver" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-sans text-xs font-bold hover:underline" style={{ color: "#111111" }}>
                                                        <span className="material-symbols-outlined text-sm">open_in_new</span>Driver Re-registration Form
                                                    </a>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    <div
                                                        className="rounded-[12px] p-3 flex items-start gap-3"
                                                        style={{ backgroundColor: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.18)" }}
                                                    >
                                                        <span className="material-symbols-outlined text-base flex-shrink-0 mt-0.5" style={{ color: "#DC2626" }}>info</span>
                                                        <p className="font-sans text-xs" style={{ color: "#5C5A56" }}>
                                                            <span className="font-bold" style={{ color: "#DC2626" }}>{days} day{days !== 1 ? "s" : ""}</span> remaining before re-registration required.
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleReinstate(v)}
                                                        className="w-full py-2.5 rounded-[9999px] font-sans text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                                                        style={{ border: "2px solid rgba(22,163,74,0.30)", color: "#16A34A", backgroundColor: "rgba(22,163,74,0.07)" }}
                                                    >
                                                        <span className="material-symbols-outlined text-sm">check_circle</span>Reinstate Driver
                                                    </button>
                                                </div>
                                            );
                                        })() : (
                                            <div className="flex gap-2 pt-1">
                                                <button
                                                    onClick={() => window.location.href = `tel:${v.phone.replace(/\s/g, "")}`}
                                                    className="flex-1 py-2.5 rounded-[9999px] font-sans text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                                                    style={{ border: "2px solid rgba(17,17,17,0.15)", color: "#111111", backgroundColor: "transparent" }}
                                                >
                                                    <span className="material-symbols-outlined text-sm">call</span>Call Driver
                                                </button>
                                                <button
                                                    onClick={() => setSuspendTarget(v)}
                                                    className="flex-1 py-2.5 rounded-[9999px] font-sans text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                                                    style={{ border: "2px solid rgba(220,38,38,0.22)", color: "#DC2626", backgroundColor: "transparent" }}
                                                >
                                                    <span className="material-symbols-outlined text-sm">block</span>Suspend
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {suspendTarget && <SuspendModal vehicle={suspendTarget} onClose={() => setSuspendTarget(null)} onConfirm={handleSuspendConfirm} />}
            {smsToast && <SmsToast driver={smsToast.driver} reason={smsToast.reason} type={smsToast.type} onClose={() => setSmsToast(null)} />}
        </>
    );
}

/* ─── TabAnalytics ─── */
function TabAnalytics() {
    const [metric, setMetric] = useState<"trips" | "revenue">("trips");
    const maxVal = metric === "trips" ? Math.max(...WEEKLY_TRIPS.map((d) => d.trips)) : Math.max(...WEEKLY_TRIPS.map((d) => d.revenue));
    const totalRevenue = WEEKLY_TRIPS.reduce((s, d) => s + d.revenue, 0);
    const totalTrips = WEEKLY_TRIPS.reduce((s, d) => s + d.trips, 0);

    const perfStats = [
        { label: "Total Trips",   value: String(totalTrips),                  icon: "route"    },
        { label: "Total Revenue", value: `R ${totalRevenue.toLocaleString()}`, icon: "payments" },
        { label: "Avg. Rating",   value: "4.8 ★",                             icon: "star"     },
        { label: "On-Time Rate",  value: "94%",                               icon: "schedule" },
    ];

    return (
        <div className="space-y-6">
            <h2 className="font-sans font-black text-2xl" style={{ color: "#111111", letterSpacing: "-0.02em" }}>Analytics</h2>

            <div className="grid grid-cols-2 gap-3">
                {perfStats.map((s, i) => (
                    <div
                        key={i}
                        className="rounded-[16px] p-4"
                        style={{
                            backgroundColor: "#FFFFFF",
                            border: "1px solid rgba(17,17,17,0.07)",
                            boxShadow: "0 2px 8px rgba(17,17,17,0.05)",
                        }}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-base" style={{ color: "#111111" }}>{s.icon}</span>
                            <p className="font-sans text-[10px] font-bold uppercase tracking-wider" style={{ color: "#8A8678" }}>{s.label}</p>
                        </div>
                        <p className="font-sans font-black text-xl" style={{ color: "#111111", letterSpacing: "-0.02em" }}>{s.value}</p>
                    </div>
                ))}
            </div>

            <div
                className="rounded-[16px] p-4 space-y-3"
                style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid rgba(17,17,17,0.07)",
                    boxShadow: "0 2px 8px rgba(17,17,17,0.05)",
                }}
            >
                <div className="flex items-center justify-between">
                    <h4 className="font-sans font-black" style={{ color: "#111111", letterSpacing: "-0.01em" }}>This Week</h4>
                    <div className="flex gap-1 rounded-[10px] p-1" style={{ backgroundColor: "#EEF1EA" }}>
                        {(["trips", "revenue"] as const).map((m) => (
                            <button
                                key={m}
                                onClick={() => setMetric(m)}
                                className="px-3 py-1 rounded-[8px] font-sans text-xs font-bold transition-all capitalize"
                                style={metric === m
                                    ? { backgroundColor: "#111111", color: "#FFFFFF" }
                                    : { color: "#8A8678" }
                                }
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-end gap-2 h-32 pt-2">
                    {WEEKLY_TRIPS.map((d) => {
                        const val = metric === "trips" ? d.trips : d.revenue;
                        const pct = (val / maxVal) * 100;
                        const isToday = d.day === "Sun";
                        return (
                            <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                                <p className="font-sans text-[9px] font-semibold" style={{ color: "#AEA89C" }}>
                                    {metric === "trips" ? val : `R${Math.round(val / 1000)}k`}
                                </p>
                                <div className="w-full flex items-end" style={{ height: "80px" }}>
                                    <div className="w-full rounded-t-[6px] transition-all" style={{
                                        height: `${pct}%`,
                                        backgroundColor: isToday ? "#111111" : "#EEF1EA",
                                    }} />
                                </div>
                                <p className="font-sans text-[10px] font-bold" style={{ color: isToday ? "#111111" : "#AEA89C" }}>{d.day}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div>
                <h4 className="font-sans font-black text-base mb-3" style={{ color: "#111111", letterSpacing: "-0.01em" }}>Top Drivers This Week</h4>
                <div
                    className="rounded-[16px] overflow-hidden"
                    style={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid rgba(17,17,17,0.07)",
                        boxShadow: "0 2px 8px rgba(17,17,17,0.05)",
                    }}
                >
                    {[
                        { name: "Thabo Mokoena",  trips: 61, rating: 4.9, earnings: "R 2,440" },
                        { name: "Sipho Ndlovu",   trips: 54, rating: 4.8, earnings: "R 2,160" },
                        { name: "Zanele Khumalo", trips: 48, rating: 4.7, earnings: "R 1,920" },
                    ].map((d, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-3 p-3"
                            style={{ borderBottom: i < 2 ? "1px solid rgba(17,17,17,0.06)" : "none" }}
                        >
                            <div
                                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: i === 0 ? "#CDDFF6" : "#EEF1EA" }}
                            >
                                <span className="font-sans text-sm font-black" style={{ color: "#111111" }}>#{i + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-sans text-sm font-bold truncate" style={{ color: "#111111" }}>{d.name}</p>
                                <p className="font-sans text-xs" style={{ color: "#8A8678" }}>{d.trips} trips · ★ {d.rating}</p>
                            </div>
                            <p className="font-sans text-sm font-black" style={{ color: "#16A34A", letterSpacing: "-0.01em" }}>{d.earnings}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ─── TabSettings ─── */
function TabSettings({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
    const sections = [
        { title: "Company", items: [
            { icon: "business",   label: "Company Profile",   sub: user?.companyName || "Edit company details" },
            { icon: "local_taxi", label: "Fleet Settings",    sub: `${user?.fleetSize || FLEET_INITIAL.length} vehicles registered` },
            { icon: "payments",   label: "Billing & Payouts", sub: "Bank account, invoices" },
        ]},
        { title: "Operations", items: [
            { icon: "route",       label: "Route Management",  sub: "Configure approved routes" },
            { icon: "person_add",  label: "Driver Onboarding", sub: "Invite & manage drivers" },
            { icon: "shield",      label: "Safety Policies",   sub: "Speed limits, SOS settings" },
        ]},
        { title: "Account", items: [
            { icon: "notifications", label: "Notifications", sub: "Alerts, reports, digests" },
            { icon: "help",          label: "Support",       sub: "Help centre, live chat" },
        ]},
    ];

    const initials = user?.name ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "OP";

    return (
        <div className="space-y-6">
            {/* Profile card */}
            <div
                className="flex items-center gap-4 p-4 rounded-[16px]"
                style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid rgba(17,17,17,0.07)",
                    boxShadow: "0 2px 8px rgba(17,17,17,0.05)",
                }}
            >
                <div
                    className="w-16 h-16 rounded-[14px] flex items-center justify-center flex-shrink-0"
                    style={{ background: "#111111" }}
                >
                    <span className="font-sans font-black text-[#CDDFF6] text-2xl" style={{ letterSpacing: "-0.02em" }}>{initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-sans font-black text-lg truncate" style={{ color: "#111111", letterSpacing: "-0.02em" }}>{user?.name || "Operator"}</p>
                    <p className="font-sans text-sm truncate" style={{ color: "#8A8678" }}>{user?.email}</p>
                    <p className="font-sans text-xs font-bold mt-0.5" style={{ color: "#5C5A56" }}>{user?.companyName || "Fleet Operator"}</p>
                </div>
                <span
                    className="font-sans text-[10px] font-bold uppercase px-2 py-1 rounded-full"
                    style={user?.operatorStatus === "verified"
                        ? { backgroundColor: "rgba(22,163,74,0.10)", color: "#16A34A", border: "1px solid rgba(22,163,74,0.25)" }
                        : { backgroundColor: "#EEF1EA", color: "#8A8678", border: "1px solid rgba(17,17,17,0.08)" }
                    }
                >
                    {user?.operatorStatus || "pending"}
                </span>
            </div>

            {sections.map((sec, idx) => (
                <div key={idx}>
                    <p className="font-sans text-xs font-bold uppercase tracking-widest mb-2 px-1" style={{ color: "#AEA89C" }}>{sec.title}</p>
                    <div
                        className="rounded-[16px] overflow-hidden"
                        style={{
                            backgroundColor: "#FFFFFF",
                            border: "1px solid rgba(17,17,17,0.07)",
                            boxShadow: "0 2px 8px rgba(17,17,17,0.05)",
                        }}
                    >
                        {sec.items.map((item, i) => (
                            <button
                                key={i}
                                className="w-full flex items-center gap-4 p-4 transition-colors text-left"
                                style={{ borderTop: i > 0 ? "1px solid rgba(17,17,17,0.06)" : undefined }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#FFFCF9"; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = ""; }}
                            >
                                <div
                                    className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: "#EEF1EA", color: "#111111" }}
                                >
                                    <span className="material-symbols-outlined">{item.icon}</span>
                                </div>
                                <div className="flex-1">
                                    <p className="font-sans font-semibold" style={{ color: "#111111" }}>{item.label}</p>
                                    <p className="font-sans text-xs" style={{ color: "#8A8678" }}>{item.sub}</p>
                                </div>
                                <span className="material-symbols-outlined" style={{ color: "#AEA89C" }}>chevron_right</span>
                            </button>
                        ))}
                    </div>
                </div>
            ))}

            <button
                onClick={onLogout}
                className="w-full py-4 rounded-[9999px] font-sans font-bold flex items-center justify-center gap-2 transition-colors"
                style={{ border: "2px solid rgba(220,38,38,0.22)", color: "#DC2626", backgroundColor: "transparent" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(220,38,38,0.06)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = ""; }}
            >
                <span className="material-symbols-outlined">logout</span>Log Out
            </button>
            <p className="font-sans text-center text-[10px] pb-2" style={{ color: "#AEA89C" }}>Quallor Operator v2.4.1 · Build 890</p>
        </div>
    );
}

/* ─── Main ─── */
function OperatorDashboardContent() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("dashboard");
    const [fleet, setFleet] = useState<FleetVehicle[]>(FLEET_INITIAL);

    const headerTitles: Record<string, string> = {
        dashboard: "Fleet Overview", fleet: "Fleet", analytics: "Analytics", settings: "Settings",
    };

    function handleLogout() { logout(); router.push("/"); }

    return (
        <main className="min-h-screen flex flex-col pb-24" style={{ backgroundColor: "#FFFCF9" }}>
            <header
                className="flex items-center sticky top-0 z-10 px-4 py-3 justify-between"
                style={{
                    backgroundColor: "rgba(255,255,255,0.96)",
                    borderBottom: "1px solid rgba(17,17,17,0.08)",
                    boxShadow: "0 1px 12px rgba(17,17,17,0.06)",
                    backdropFilter: "blur(12px)",
                }}
            >
                <div className="flex items-center gap-3">
                    <div>
                        <h2
                            className="font-sans font-black text-base leading-tight"
                            style={{ color: "#111111", letterSpacing: "-0.02em" }}
                        >
                            {headerTitles[activeTab]}
                        </h2>
                        <p className="font-sans text-[10px]" style={{ color: "#8A8678" }}>{user?.companyName || "Operator Dashboard"}</p>
                    </div>
                </div>
                <button
                    className="relative p-2 rounded-[10px] transition-colors"
                    style={{ color: "#AEA89C" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#EEF1EA"; (e.currentTarget as HTMLElement).style.color = "#111111"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = ""; (e.currentTarget as HTMLElement).style.color = "#AEA89C"; }}
                >
                    <span className="material-symbols-outlined">notifications</span>
                    <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#CDDFF6" }} />
                </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full">
                {activeTab === "dashboard" && <TabDashboard user={user} fleet={fleet} />}
                {activeTab === "fleet"     && <TabFleet fleet={fleet} setFleet={setFleet} />}
                {activeTab === "analytics" && <TabAnalytics />}
                {activeTab === "settings"  && <TabSettings user={user} onLogout={handleLogout} />}
            </div>

            {/* Bottom tab bar */}
            <nav
                className="fixed bottom-0 left-0 right-0 z-20"
                style={{
                    borderTop: "1px solid rgba(17,17,17,0.08)",
                    backgroundColor: "rgba(255,255,255,0.98)",
                    backdropFilter: "blur(12px)",
                }}
            >
                <div className="flex max-w-2xl mx-auto px-3 pb-6 pt-2">
                    {navItems.map((item) => {
                        const isActive = activeTab === item.tab;
                        return (
                            <button
                                key={item.tab}
                                onClick={() => setActiveTab(item.tab)}
                                className="flex-1 flex flex-col items-center gap-0.5 relative py-1"
                            >
                                <div
                                    className="flex items-center justify-center w-12 h-8 rounded-[14px] transition-all duration-200"
                                    style={{ backgroundColor: isActive ? "#111111" : "transparent" }}
                                >
                                    <span
                                        className="material-symbols-outlined text-[22px] transition-all duration-200"
                                        style={{
                                            color: isActive ? "#CDDFF6" : "#AEA89C",
                                            fontVariationSettings: isActive ? "'FILL' 1, 'wght' 600" : "'FILL' 0, 'wght' 400",
                                        }}
                                    >
                                        {item.icon}
                                    </span>
                                </div>
                                <p
                                    className="font-sans text-[9px] font-bold uppercase tracking-widest"
                                    style={{ color: isActive ? "#111111" : "#AEA89C" }}
                                >
                                    {item.label}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </nav>
        </main>
    );
}

export default function OperatorDashboardPage() {
    return (
        <AuthGuard requiredRole="operator">
            <OperatorDashboardContent />
        </AuthGuard>
    );
}

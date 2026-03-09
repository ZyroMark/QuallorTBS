"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import AuthGuard from "@/components/AuthGuard";

const navItems = [
    { icon: "grid_view", label: "Dashboard", tab: "dashboard" },
    { icon: "local_taxi", label: "Fleet", tab: "fleet" },
    { icon: "monitoring", label: "Analytics", tab: "analytics" },
    { icon: "manage_accounts", label: "Settings", tab: "settings" },
];

const ALERTS = [
    { title: "Vehicle Maintenance", time: "2m ago", desc: "Vehicle Y: Brake pad replacement due immediately.", icon: "warning", accent: "border-amber-400" },
    { title: "Driver Offline", time: "15m ago", desc: "Driver X: Signal lost near East London Central.", icon: "signal_disconnected", accent: "border-blue-400" },
    { title: "Speeding Alert", time: "42m ago", desc: "Vehicle Z: Exceeded 120km/h on N2 North.", icon: "speed", accent: "border-red-400" },
    { title: "Shift Completed", time: "1h ago", desc: "Driver M has successfully signed off shift.", icon: "check_circle", accent: "border-green-500" },
];

type FleetStatus = "online" | "busy" | "offline" | "suspended";

interface FleetVehicle {
    id: string;
    plate: string;
    driver: string;
    phone: string;
    status: FleetStatus;
    route: string;
    passengers: number;
    capacity: number;
    fuel: number;
    km: string;
    suspendedAt?: number; // timestamp ms — set when suspended
}

const FOUR_WEEKS_MS = 28 * 24 * 60 * 60 * 1000;

function daysRemaining(suspendedAt: number): number {
    return Math.max(0, Math.ceil((suspendedAt + FOUR_WEEKS_MS - Date.now()) / (24 * 60 * 60 * 1000)));
}

const FLEET_INITIAL: FleetVehicle[] = [
    { id: "QLR-T01", plate: "EC 123-456", driver: "Sipho Ndlovu",    phone: "+27 63 123 4567", status: "online",   route: "Beacon Bay → Mdantsane",              passengers: 9,  capacity: 15, fuel: 78, km: "14,320 km" },
    { id: "QLR-T02", plate: "EC 789-012", driver: "Thabo Mokoena",   phone: "+27 71 234 5678", status: "busy",     route: "East London → King William's Town",   passengers: 14, capacity: 15, fuel: 45, km: "22,100 km" },
    { id: "QLR-T03", plate: "EC 345-678", driver: "Nomsa Dlamini",   phone: "+27 82 345 6789", status: "online",   route: "Southernwood → Beacon Bay",            passengers: 6,  capacity: 15, fuel: 91, km: "8,760 km"  },
    { id: "QLR-T04", plate: "EC 901-234", driver: "Luyanda Zulu",    phone: "+27 61 456 7890", status: "offline",  route: "—",                                    passengers: 0,  capacity: 15, fuel: 20, km: "31,450 km" },
    { id: "QLR-T05", plate: "EC 567-890", driver: "Zanele Khumalo",  phone: "+27 73 567 8901", status: "busy",     route: "Mdantsane → City Centre",              passengers: 11, capacity: 15, fuel: 63, km: "18,900 km" },
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

const maxTrips = Math.max(...WEEKLY_TRIPS.map((d) => d.trips));

const SUSPEND_REASONS = [
    "Safety Violation",
    "Customer Complaints (3+ reports)",
    "Vehicle in Poor Condition",
    "Licence / Documentation Issue",
    "Fraudulent Activity",
    "Other",
];

function statusClasses(s: string) {
    if (s === "online")    return { dot: "bg-green-500",   badge: "bg-green-100 text-green-700",   ring: "border-green-400 bg-green-50"   };
    if (s === "busy")      return { dot: "bg-blue-500",    badge: "bg-blue-100 text-blue-700",     ring: "border-blue-400 bg-blue-50"     };
    if (s === "suspended") return { dot: "bg-red-500",     badge: "bg-red-100 text-red-700",       ring: "border-red-300 bg-red-50"       };
    return                        { dot: "bg-q-stone-400", badge: "bg-q-stone-100 text-q-stone-500", ring: "border-q-stone-300 bg-q-stone-50" };
}

type AuthUser = ReturnType<typeof import("@/app/context/AuthContext").useAuth>["user"];

function TabDashboard({ user, fleet }: { user: AuthUser; fleet: FleetVehicle[] }) {
    const stats = [
        { label: "Trips Today",  value: "42",                                                       trend: "+12%", positive: true,  icon: "route"        },
        { label: "Active Taxis", value: String(fleet.filter((v) => v.status !== "offline" && v.status !== "suspended").length), trend: "+1",    positive: true,  icon: "electric_car" },
        { label: "Revenue",      value: "R 12,450",                                                 trend: "+5%",  positive: true,  icon: "payments"     },
    ];
    return (
        <div className="space-y-6">
            <div>
                <p className="q-caption">Welcome back,</p>
                <h2 className="font-display text-2xl font-semibold text-q-stone-900">{user?.name || "Operator"}</h2>
            </div>

            <div className="grid grid-cols-3 gap-3">
                {stats.map((s, i) => (
                    <div key={i} className="q-card p-4">
                        <div className="flex justify-between items-start mb-2">
                            <p className="font-sans text-[10px] font-bold text-q-stone-500 uppercase tracking-wider leading-tight">{s.label}</p>
                            <span className="material-symbols-outlined text-q-brown text-base">{s.icon}</span>
                        </div>
                        <p className="font-display text-xl font-bold text-q-stone-900 leading-none">{s.value}</p>
                        <p className={`font-sans text-xs font-semibold mt-1 flex items-center gap-0.5 ${s.positive ? "text-green-600" : "text-red-600"}`}>
                            <span className="material-symbols-outlined text-xs">{s.positive ? "trending_up" : "trending_down"}</span>
                            {s.trend}
                        </p>
                    </div>
                ))}
            </div>

            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display text-base font-semibold text-q-stone-900">Live Fleet Distribution</h3>
                    <span className="flex items-center gap-1.5 font-sans text-xs font-semibold text-green-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        Live
                    </span>
                </div>
                <div className="relative w-full aspect-video rounded-[18px] overflow-hidden border border-q-stone-200 shadow-q-md bg-cover bg-center"
                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1000')" }}>
                    <div className="absolute inset-0 bg-q-stone-900/30" />
                    <div className="absolute inset-0">
                        {[
                            { top: "35%", left: "28%", label: "T01", color: "bg-q-brown" },
                            { top: "55%", left: "52%", label: "T02", color: "bg-blue-500" },
                            { top: "22%", left: "63%", label: "T03", color: "bg-green-500" },
                            { top: "65%", left: "38%", label: "T05", color: "bg-blue-500" },
                        ].map((dot) => (
                            <div key={dot.label} className="absolute flex flex-col items-center" style={{ top: dot.top, left: dot.left }}>
                                <div className={`w-7 h-7 rounded-full ${dot.color} border-2 border-white flex items-center justify-center shadow-q-sm`}>
                                    <span className="material-symbols-outlined text-white text-[13px]">local_taxi</span>
                                </div>
                                <span className="font-sans text-[8px] font-bold text-white bg-q-stone-900/80 px-1 rounded mt-0.5">{dot.label}</span>
                            </div>
                        ))}
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 flex gap-2">
                        <div className="bg-white/90 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-q-xs">
                            <span className="w-2 h-2 rounded-full bg-q-brown animate-pulse" />
                            <span className="font-sans text-xs font-semibold text-q-stone-900">{fleet.filter((v) => v.status !== "offline" && v.status !== "suspended").length} Active</span>
                        </div>
                        <div className="bg-white/90 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-q-xs">
                            <span className="w-2 h-2 rounded-full bg-q-stone-400" />
                            <span className="font-sans text-xs font-semibold text-q-stone-900">{fleet.filter((v) => v.status === "offline").length} Offline</span>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display text-base font-semibold text-q-stone-900">Recent Alerts</h3>
                    <span className="font-sans text-xs font-semibold text-q-brown">{ALERTS.length} new</span>
                </div>
                <div className="space-y-3">
                    {ALERTS.map((a, i) => (
                        <div key={i} className={`q-card flex items-start gap-3 p-4 border-l-4 ${a.accent}`}>
                            <span className="material-symbols-outlined text-q-stone-600 flex-shrink-0">{a.icon}</span>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <p className="font-sans text-sm font-semibold text-q-stone-900">{a.title}</p>
                                    <span className="font-sans text-[10px] text-q-stone-400 uppercase ml-2 flex-shrink-0">{a.time}</span>
                                </div>
                                <p className="font-sans text-xs text-q-stone-500 mt-0.5">{a.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

interface SuspendModalProps {
    vehicle: FleetVehicle;
    onClose: () => void;
    onConfirm: (reason: string, description: string, fileName: string) => void;
}

function SuspendModal({ vehicle, onClose, onConfirm }: SuspendModalProps) {
    const [reason, setReason] = useState("");
    const [description, setDescription] = useState("");
    const [fileName, setFileName] = useState("");
    const [error, setError] = useState("");

    function handleSubmit() {
        if (!reason) { setError("Please select a suspension reason."); return; }
        if (description.trim().length < 20) { setError("Please provide a detailed description (min. 20 characters)."); return; }
        if (!fileName) { setError("Please attach a supporting document or report file."); return; }
        setError("");
        onConfirm(reason, description, fileName);
    }

    return (
        <div className="fixed inset-0 z-50 bg-q-stone-900/50 flex items-end justify-center" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-white w-full max-w-lg rounded-t-[24px] p-6 space-y-5 max-h-[90vh] overflow-y-auto">
                {/* Handle */}
                <div className="w-10 h-1 rounded-full bg-q-stone-200 mx-auto -mt-1 mb-1" />

                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-[10px] bg-red-100 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-red-600">block</span>
                    </div>
                    <div>
                        <h3 className="font-display text-lg font-semibold text-q-stone-900">Suspend Driver</h3>
                        <p className="font-sans text-sm text-q-stone-500">{vehicle.driver} · {vehicle.plate}</p>
                    </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-[12px] p-4 flex gap-3">
                    <span className="material-symbols-outlined text-amber-600 text-xl flex-shrink-0">info</span>
                    <p className="font-sans text-sm text-q-stone-700 leading-relaxed">
                        The driver will receive an SMS notification and have <strong>4 weeks</strong> to resolve the issue before permanent action is taken. A report will be filed in the system.
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-[10px] px-4 py-3 font-sans text-sm text-red-600 font-medium">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="q-label">Suspension Reason <span className="text-red-500">*</span></label>
                        <select
                            className="q-input-lg w-full"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        >
                            <option value="">Select a reason…</option>
                            {SUSPEND_REASONS.map((r) => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="q-label">Incident Description <span className="text-red-500">*</span></label>
                        <textarea
                            className="q-input-lg w-full resize-none"
                            rows={4}
                            placeholder="Describe the incident in detail. This will be included in the official report…"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                        <p className="font-sans text-xs text-q-stone-400 mt-1">{description.trim().length} / 20 min. characters</p>
                    </div>

                    <div>
                        <label className="q-label">Supporting Document <span className="text-red-500">*</span></label>
                        <label className={`border-2 border-dashed rounded-[14px] p-5 flex flex-col items-center gap-2 cursor-pointer transition-colors ${fileName ? "border-green-400 bg-green-50" : "border-q-brown-200 bg-q-brown-50 hover:bg-q-brown-100"}`}>
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*,.pdf,.doc,.docx"
                                onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
                            />
                            {fileName ? (
                                <>
                                    <span className="material-symbols-outlined text-green-500 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                    <span className="font-sans text-xs text-green-600 font-semibold text-center break-all">{fileName}</span>
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-q-brown text-2xl">upload_file</span>
                                    <span className="font-sans text-xs text-q-brown font-semibold">Attach report or evidence file</span>
                                    <span className="font-sans text-[10px] text-q-stone-400">PDF, Word, or image</span>
                                </>
                            )}
                        </label>
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3.5 rounded-[12px] border border-q-stone-200 text-q-stone-700 font-sans font-semibold text-sm hover:bg-q-stone-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex-1 py-3.5 rounded-[12px] bg-red-600 text-white font-sans font-semibold text-sm hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-sm">block</span>
                        File Report & Suspend
                    </button>
                </div>
            </div>
        </div>
    );
}

interface SmsToastProps {
    driver: string;
    reason: string;
    type: "suspend" | "reinstate";
    onClose: () => void;
}

function SmsToast({ driver, reason, type, onClose }: SmsToastProps) {
    const isSuspend = type === "suspend";
    return (
        <div className="fixed bottom-28 left-4 right-4 z-50 max-w-lg mx-auto">
            <div className="bg-q-stone-900 text-white rounded-[16px] p-4 shadow-q-md flex gap-3 items-start">
                <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 mt-0.5 ${isSuspend ? "bg-red-500" : "bg-green-500"}`}>
                    <span className="material-symbols-outlined text-white text-base" style={{ fontVariationSettings: "'FILL' 1" }}>sms</span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-sans text-sm font-bold text-white mb-0.5">
                        {isSuspend ? "Driver Suspended — SMS Sent" : "Driver Reinstated — SMS Sent"}
                    </p>
                    <p className="font-sans text-xs text-q-stone-300 leading-relaxed">
                        {isSuspend
                            ? <>SMS to <span className="text-white font-semibold">{driver}</span>: &quot;Your licence has been suspended. Reason: {reason}. You have <strong className="text-white">4 weeks</strong> to resolve this issue with your operator before you must re-register.&quot;</>
                            : <>SMS to <span className="text-white font-semibold">{driver}</span>: &quot;Your driving licence has been reinstated by your operator. You may resume operations immediately.&quot;</>
                        }
                    </p>
                </div>
                <button onClick={onClose} className="text-q-stone-400 hover:text-white flex-shrink-0">
                    <span className="material-symbols-outlined text-base">close</span>
                </button>
            </div>
        </div>
    );
}

function TabFleet({ fleet, setFleet }: { fleet: FleetVehicle[]; setFleet: React.Dispatch<React.SetStateAction<FleetVehicle[]>> }) {
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [expanded, setExpanded] = useState<string | null>(null);
    const [suspendTarget, setSuspendTarget] = useState<FleetVehicle | null>(null);
    const [smsToast, setSmsToast] = useState<{ driver: string; reason: string; type: "suspend" | "reinstate" } | null>(null);

    const filters = ["all", "online", "busy", "offline", "suspended"];
    const visible = fleet.filter(
        (v) =>
            (filter === "all" || v.status === filter) &&
            (v.plate.toLowerCase().includes(search.toLowerCase()) || v.driver.toLowerCase().includes(search.toLowerCase()))
    );

    function handleCall(vehicle: FleetVehicle) {
        window.location.href = `tel:${vehicle.phone.replace(/\s/g, "")}`;
    }

    function handleSuspendConfirm(reason: string, description: string, _fileName: string) {
        if (!suspendTarget) return;
        setFleet((prev) =>
            prev.map((v) => v.id === suspendTarget.id ? { ...v, status: "suspended" as FleetStatus, suspendedAt: Date.now() } : v)
        );
        setSmsToast({ driver: suspendTarget.driver, reason, type: "suspend" });
        setSuspendTarget(null);
        setExpanded(null);
        setTimeout(() => setSmsToast(null), 8000);
    }

    function handleReinstate(vehicle: FleetVehicle) {
        setFleet((prev) =>
            prev.map((v) => v.id === vehicle.id ? { ...v, status: "offline" as FleetStatus, suspendedAt: undefined } : v)
        );
        setSmsToast({ driver: vehicle.driver, reason: "", type: "reinstate" });
        setExpanded(null);
        setTimeout(() => setSmsToast(null), 8000);
    }

    return (
        <>
            <div className="space-y-5">
                <h2 className="font-display text-2xl font-semibold text-q-stone-900">Fleet Management</h2>

                <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-q-stone-400">search</span>
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
                            className={`flex-shrink-0 px-4 py-1.5 rounded-full font-sans text-xs font-bold capitalize transition-all ${
                                filter === f
                                    ? "bg-q-brown text-white shadow-q-sm"
                                    : "bg-white border border-q-stone-200 text-q-stone-600 hover:border-q-brown"
                            }`}
                        >
                            {f === "all" ? `All (${fleet.length})` : `${f} (${fleet.filter((v) => v.status === f).length})`}
                        </button>
                    ))}
                </div>

                <div className="space-y-3">
                    {visible.length === 0 && (
                        <div className="text-center py-12">
                            <span className="material-symbols-outlined text-4xl mb-2 text-q-stone-300">local_taxi</span>
                            <p className="q-caption">No vehicles match your filter</p>
                        </div>
                    )}
                    {visible.map((v) => {
                        const c = statusClasses(v.status);
                        const isOpen = expanded === v.id;
                        const isSuspended = v.status === "suspended";
                        return (
                            <div key={v.id} className="q-card overflow-hidden">
                                <button
                                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-q-stone-50 transition-colors"
                                    onClick={() => setExpanded(isOpen ? null : v.id)}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${c.ring}`}>
                                        <span className="material-symbols-outlined text-q-stone-700 text-base">local_taxi</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-sans font-semibold text-q-stone-900">{v.plate}</p>
                                            <span className={`font-sans text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${c.badge}`}>{v.status}</span>
                                        </div>
                                        <p className="font-sans text-xs text-q-stone-500 truncate">{v.driver}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0 mr-2">
                                        <p className="font-sans text-sm font-bold text-q-stone-900">{v.passengers}<span className="text-q-stone-400 font-normal">/{v.capacity}</span></p>
                                        <p className="font-sans text-[10px] text-q-stone-500">seats</p>
                                    </div>
                                    <span className={`material-symbols-outlined text-q-stone-400 text-base transition-transform ${isOpen ? "rotate-180" : ""}`}>expand_more</span>
                                </button>

                                {isOpen && (
                                    <div className="border-t border-q-stone-200 px-4 pb-4 pt-3 space-y-3 bg-q-bg-section">
                                        <p className="font-sans text-xs text-q-stone-600 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm text-q-brown">route</span>
                                            {v.route}
                                        </p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-white rounded-[10px] p-3 border border-q-stone-200">
                                                <p className="font-sans text-[10px] font-bold text-q-stone-500 uppercase tracking-wider mb-1">Odometer</p>
                                                <p className="font-sans text-sm font-bold text-q-stone-900">{v.km}</p>
                                            </div>
                                            <div className="bg-white rounded-[10px] p-3 border border-q-stone-200">
                                                <p className="font-sans text-[10px] font-bold text-q-stone-500 uppercase tracking-wider mb-1">Fuel Level</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-1.5 rounded-full bg-q-stone-200 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${v.fuel > 50 ? "bg-green-500" : v.fuel > 25 ? "bg-amber-400" : "bg-red-500"}`}
                                                            style={{ width: `${v.fuel}%` }}
                                                        />
                                                    </div>
                                                    <p className="font-sans text-sm font-bold text-q-stone-900">{v.fuel}%</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between font-sans text-[10px] text-q-stone-500 mb-1">
                                                <span>Passenger Load</span>
                                                <span>{v.passengers}/{v.capacity} seats</span>
                                            </div>
                                            <div className="h-1.5 rounded-full bg-q-stone-200 overflow-hidden">
                                                <div className="h-full rounded-full bg-q-brown" style={{ width: `${(v.passengers / v.capacity) * 100}%` }} />
                                            </div>
                                        </div>

                                        {isSuspended ? (() => {
                                            const days = v.suspendedAt ? daysRemaining(v.suspendedAt) : 0;
                                            const expired = days === 0;
                                            return (
                                                <div className="space-y-3">
                                                    {expired ? (
                                                        <div className="bg-q-stone-100 border border-q-stone-300 rounded-[12px] p-4 space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="material-symbols-outlined text-q-stone-600 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>timer_off</span>
                                                                <p className="font-sans text-sm font-bold text-q-stone-800">Reinstatement Window Expired</p>
                                                            </div>
                                                            <p className="font-sans text-xs text-q-stone-600 leading-relaxed">
                                                                The 4-week resolution window has passed. This driver must <strong>re-register</strong> through the driver application process to return to the platform.
                                                            </p>
                                                            <a
                                                                href="/auth/signup?role=driver"
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1.5 font-sans text-xs font-bold text-q-brown hover:underline"
                                                            >
                                                                <span className="material-symbols-outlined text-sm">open_in_new</span>
                                                                Driver Re-registration Form
                                                            </a>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="bg-red-50 border border-red-200 rounded-[12px] p-3 flex items-start gap-3">
                                                                <span className="material-symbols-outlined text-red-500 text-base flex-shrink-0 mt-0.5">info</span>
                                                                <div>
                                                                    <p className="font-sans text-xs font-bold text-red-700">Driver suspended — awaiting resolution</p>
                                                                    <p className="font-sans text-xs text-red-600 mt-0.5">
                                                                        <span className="font-bold">{days} day{days !== 1 ? "s" : ""}</span> remaining to reinstate before driver must re-register.
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => handleReinstate(v)}
                                                                className="w-full py-2.5 rounded-[10px] border border-green-300 bg-green-50 text-green-700 font-sans text-xs font-bold hover:bg-green-100 transition-colors flex items-center justify-center gap-1.5"
                                                            >
                                                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                                                Reinstate Driver
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })() : (
                                            <div className="flex gap-2 pt-1">
                                                <button
                                                    onClick={() => handleCall(v)}
                                                    className="flex-1 py-2.5 rounded-[10px] border border-q-brown text-q-brown font-sans text-xs font-bold hover:bg-q-brown-50 transition-colors flex items-center justify-center gap-1.5"
                                                >
                                                    <span className="material-symbols-outlined text-sm">call</span>
                                                    Call Driver
                                                </button>
                                                <button
                                                    onClick={() => setSuspendTarget(v)}
                                                    className="flex-1 py-2.5 rounded-[10px] border border-red-200 text-red-600 font-sans text-xs font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5"
                                                >
                                                    <span className="material-symbols-outlined text-sm">block</span>
                                                    Suspend
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

            {suspendTarget && (
                <SuspendModal
                    vehicle={suspendTarget}
                    onClose={() => setSuspendTarget(null)}
                    onConfirm={handleSuspendConfirm}
                />
            )}

            {smsToast && (
                <SmsToast
                    driver={smsToast.driver}
                    reason={smsToast.reason}
                    type={smsToast.type}
                    onClose={() => setSmsToast(null)}
                />
            )}
        </>
    );
}

function TabAnalytics() {
    const [metric, setMetric] = useState<"trips" | "revenue">("trips");
    const maxVal = metric === "trips" ? maxTrips : Math.max(...WEEKLY_TRIPS.map((d) => d.revenue));
    const totalRevenue = WEEKLY_TRIPS.reduce((s, d) => s + d.revenue, 0);
    const totalTrips = WEEKLY_TRIPS.reduce((s, d) => s + d.trips, 0);

    const perfStats = [
        { label: "Total Trips",  value: String(totalTrips),               icon: "route"     },
        { label: "Total Revenue", value: `R ${totalRevenue.toLocaleString()}`, icon: "payments" },
        { label: "Avg. Rating",  value: "4.8 ★",                          icon: "star"      },
        { label: "On-Time Rate", value: "94%",                            icon: "schedule"  },
    ];

    return (
        <div className="space-y-6">
            <h2 className="font-display text-2xl font-semibold text-q-stone-900">Analytics</h2>

            <div className="grid grid-cols-2 gap-3">
                {perfStats.map((s, i) => (
                    <div key={i} className="q-card p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-q-brown text-base">{s.icon}</span>
                            <p className="font-sans text-[10px] font-bold text-q-stone-500 uppercase tracking-wider">{s.label}</p>
                        </div>
                        <p className="font-display text-xl font-bold text-q-stone-900">{s.value}</p>
                    </div>
                ))}
            </div>

            <div className="q-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="font-display font-semibold text-q-stone-900">This Week</h4>
                    <div className="flex gap-1 bg-q-stone-100 rounded-[10px] p-1">
                        {(["trips", "revenue"] as const).map((m) => (
                            <button
                                key={m}
                                onClick={() => setMetric(m)}
                                className={`px-3 py-1 rounded-[8px] font-sans text-xs font-bold transition-all capitalize ${metric === m ? "bg-q-brown text-white shadow-q-xs" : "text-q-stone-500"}`}
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
                                <p className="font-sans text-[9px] text-q-stone-500 font-semibold">
                                    {metric === "trips" ? val : `R${Math.round(val / 1000)}k`}
                                </p>
                                <div className="w-full flex items-end" style={{ height: "80px" }}>
                                    <div
                                        className={`w-full rounded-t-[6px] transition-all ${isToday ? "bg-q-brown" : "bg-q-brown-200"}`}
                                        style={{ height: `${pct}%` }}
                                    />
                                </div>
                                <p className={`font-sans text-[10px] font-bold ${isToday ? "text-q-brown" : "text-q-stone-400"}`}>{d.day}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div>
                <h4 className="font-display text-base font-semibold text-q-stone-900 mb-3">Top Drivers This Week</h4>
                <div className="space-y-3">
                    {[
                        { name: "Thabo Mokoena", trips: 61, rating: 4.9, earnings: "R 2,440" },
                        { name: "Sipho Ndlovu",  trips: 54, rating: 4.8, earnings: "R 2,160" },
                        { name: "Zanele Khumalo", trips: 48, rating: 4.7, earnings: "R 1,920" },
                    ].map((d, i) => (
                        <div key={i} className="q-card flex items-center gap-3 p-3">
                            <div className="w-8 h-8 rounded-full bg-q-brown-100 flex items-center justify-center flex-shrink-0">
                                <span className="font-display text-sm font-bold text-q-brown">#{i + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-sans text-sm font-semibold text-q-stone-900 truncate">{d.name}</p>
                                <p className="font-sans text-xs text-q-stone-500">{d.trips} trips · ★ {d.rating}</p>
                            </div>
                            <p className="font-display text-sm font-bold text-green-600">{d.earnings}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function TabSettings({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
    const sections = [
        {
            title: "Company",
            items: [
                { icon: "business",    label: "Company Profile",  sub: user?.companyName || "Edit company details" },
                { icon: "local_taxi",  label: "Fleet Settings",   sub: `${user?.fleetSize || FLEET_INITIAL.length} vehicles registered` },
                { icon: "payments",    label: "Billing & Payouts", sub: "Bank account, invoices" },
            ],
        },
        {
            title: "Operations",
            items: [
                { icon: "route",       label: "Route Management",   sub: "Configure approved routes" },
                { icon: "person_add",  label: "Driver Onboarding",  sub: "Invite & manage drivers" },
                { icon: "shield",      label: "Safety Policies",    sub: "Speed limits, SOS settings" },
            ],
        },
        {
            title: "Account",
            items: [
                { icon: "notifications", label: "Notifications", sub: "Alerts, reports, digests" },
                { icon: "help",          label: "Support",       sub: "Help centre, live chat" },
            ],
        },
    ];

    const initials = user?.name
        ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
        : "OP";

    return (
        <div className="space-y-6">
            <div className="q-card flex items-center gap-4 p-4">
                <div className="w-16 h-16 rounded-[14px] bg-q-brown flex items-center justify-center flex-shrink-0">
                    <span className="font-display font-bold text-white text-2xl">{initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-display text-lg font-semibold text-q-stone-900 truncate">{user?.name || "Operator"}</p>
                    <p className="font-sans text-sm text-q-stone-500 truncate">{user?.email}</p>
                    <p className="font-sans text-xs font-semibold text-q-brown mt-0.5">{user?.companyName || "Fleet Operator"}</p>
                </div>
                <span className={`font-sans text-[10px] font-bold uppercase px-2 py-1 rounded-full ${user?.operatorStatus === "verified" ? "bg-green-100 text-green-700" : "bg-q-brown-100 text-q-brown"}`}>
                    {user?.operatorStatus || "pending"}
                </span>
            </div>

            {sections.map((sec, idx) => (
                <div key={idx}>
                    <p className="font-sans text-xs font-bold uppercase tracking-widest text-q-stone-500 mb-2 px-1">{sec.title}</p>
                    <div className="q-card divide-y divide-q-stone-100">
                        {sec.items.map((item, i) => (
                            <button key={i} className="w-full flex items-center gap-4 p-4 hover:bg-q-stone-50 transition-colors text-left">
                                <div className="w-10 h-10 rounded-[10px] bg-q-brown-100 text-q-brown flex items-center justify-center flex-shrink-0">
                                    <span className="material-symbols-outlined">{item.icon}</span>
                                </div>
                                <div className="flex-1">
                                    <p className="font-sans font-semibold text-q-stone-900">{item.label}</p>
                                    <p className="font-sans text-xs text-q-stone-500">{item.sub}</p>
                                </div>
                                <span className="material-symbols-outlined text-q-stone-400">chevron_right</span>
                            </button>
                        ))}
                    </div>
                </div>
            ))}

            <button
                onClick={onLogout}
                className="w-full py-4 rounded-[14px] border border-red-200 text-red-600 font-sans font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
            >
                <span className="material-symbols-outlined">logout</span>
                Log Out
            </button>
            <p className="font-sans text-center text-[10px] text-q-stone-400 pb-2">Quallor Operator v2.4.1 · Build 890</p>
        </div>
    );
}

function OperatorDashboardContent() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("dashboard");
    const [fleet, setFleet] = useState<FleetVehicle[]>(FLEET_INITIAL);

    const headerTitles: Record<string, string> = {
        dashboard: "Fleet Overview",
        fleet: "Fleet",
        analytics: "Analytics",
        settings: "Settings",
    };

    function handleLogout() {
        logout();
        router.push("/");
    }

    return (
        <main className="min-h-screen bg-q-bg-page flex flex-col pb-24">
            <header className="flex items-center bg-white sticky top-0 z-10 px-4 py-3 border-b border-q-stone-200 shadow-q-xs justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[10px] bg-q-brown-100 flex items-center justify-center">
                        <span className="material-symbols-outlined text-q-brown">local_taxi</span>
                    </div>
                    <div>
                        <h2 className="font-display text-base font-semibold text-q-stone-900 leading-tight">{headerTitles[activeTab]}</h2>
                        <p className="font-sans text-[10px] text-q-stone-500">{user?.companyName || "Operator Dashboard"}</p>
                    </div>
                </div>
                <button className="relative p-2 text-q-stone-500 hover:text-q-brown transition-colors rounded-[10px] hover:bg-q-stone-100">
                    <span className="material-symbols-outlined">notifications</span>
                    <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 rounded-full bg-q-brown" />
                </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full">
                {activeTab === "dashboard"  && <TabDashboard user={user} fleet={fleet} />}
                {activeTab === "fleet"      && <TabFleet fleet={fleet} setFleet={setFleet} />}
                {activeTab === "analytics"  && <TabAnalytics />}
                {activeTab === "settings"   && <TabSettings user={user} onLogout={handleLogout} />}
            </div>

            <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-q-stone-200 bg-white">
                <div className="flex max-w-2xl mx-auto px-3 pb-6 pt-2">
                    {navItems.map((item) => {
                        const isActive = activeTab === item.tab;
                        return (
                            <button
                                key={item.tab}
                                onClick={() => setActiveTab(item.tab)}
                                className="flex-1 flex flex-col items-center gap-0.5 relative py-1"
                            >
                                <div className={`flex items-center justify-center w-12 h-8 rounded-[14px] transition-all duration-200 ${isActive ? "bg-q-brown-100" : ""}`}>
                                    <span
                                        className={`material-symbols-outlined text-[22px] transition-all duration-200 ${isActive ? "text-q-brown" : "text-q-stone-400"}`}
                                        style={{ fontVariationSettings: isActive ? "'FILL' 1, 'wght' 600" : "'FILL' 0, 'wght' 400" }}
                                    >
                                        {item.icon}
                                    </span>
                                </div>
                                <p className={`font-sans text-[9px] font-bold uppercase tracking-widest ${isActive ? "text-q-brown" : "text-q-stone-400"}`}>
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

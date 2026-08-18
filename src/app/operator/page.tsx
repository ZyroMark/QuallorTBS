"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/app/context/AuthContext";
import { useSettings, type OperatorRoute } from "@/app/context/SettingsContext";
import { useFleet, ASSESSMENT_LABELS, REQUEST_LABELS, type Vehicle, type RequestKind } from "@/app/context/FleetContext";
import { useToast } from "@/components/Toast";
import { Toggle, Field } from "@/components/SettingsUI";
import OperatorGate from "@/components/OperatorGate";
import { coordsFor, PLACES, DEFAULT_PROVINCE, type ProvinceId } from "@/lib/places";
import { useProvince } from "@/lib/useProvince";
import { ProvinceOptions } from "@/components/ProvincePicker";

/**
 * Operator console.
 *
 * An operator runs one fleet. They see their own vehicles, their own drivers,
 * their own money and their own routes, all read from the same register the
 * fleet office maintains. What they cannot do here is change the register:
 * adding vehicles, assessing them and taking them off the road belongs to the
 * fleet manager at /fleet. Anything the operator needs from that side goes
 * through a request, which lands in the fleet office inbox.
 */

const MiniMap = dynamic(() => import("@/components/MiniMap"), { ssr: false });

type Tab = "dashboard" | "fleet" | "analytics" | "settings";

const navItems: { icon: string; label: string; tab: Tab }[] = [
    { icon: "grid_view",       label: "Dashboard", tab: "dashboard" },
    { icon: "local_taxi",      label: "Fleet",     tab: "fleet"     },
    { icon: "monitoring",      label: "Analytics", tab: "analytics" },
    { icon: "manage_accounts", label: "Settings",  tab: "settings"  },
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

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
    active:      { bg: "rgba(22,163,74,0.10)", color: "#16A34A", label: "On the road" },
    standby:     { bg: "rgba(29,54,134,0.08)", color: "#1D3686", label: "Standby" },
    maintenance: { bg: "rgba(217,119,6,0.10)", color: "#D97706", label: "Maintenance" },
    suspended:   { bg: "rgba(220,38,38,0.10)", color: "#DC2626", label: "Suspended" },
    retired:     { bg: "rgba(17,17,17,0.06)",  color: "#8A8678", label: "Retired" },
};

type AuthUser = ReturnType<typeof useAuth>["user"];

/* ══════════════════════ Dashboard ══════════════════════ */
function TabDashboard({ user, fleet }: { user: AuthUser; fleet: Vehicle[] }) {
    const { blockingReason, latestFor, requests } = useFleet();

    const onRoad = fleet.filter((v) => blockingReason(v) === null);
    const offRoad = fleet.filter((v) => blockingReason(v) !== null);
    const openRequests = requests.filter((r) => r.status === "open" && r.operatorId === user?.id);

    const stats = [
        { label: "Vehicles",    value: String(fleet.length),   icon: "local_taxi",  trend: `${onRoad.length} on the road`, color: "#111111" },
        { label: "Off Road",    value: String(offRoad.length), icon: "error",       trend: offRoad.length ? "needs attention" : "all clear", color: offRoad.length ? "#DC2626" : "#16A34A" },
        { label: "Revenue",     value: "R 12,450",             icon: "payments",    trend: "+5% this week", color: "#111111" },
    ];

    // Alerts come from the register rather than a fixed list, so what the
    // operator sees matches what the fleet office actually did.
    const alerts = fleet
        .map((v) => {
            const reason = blockingReason(v);
            const last = latestFor(v.id);
            if (reason) {
                return { plate: v.plate, title: `${v.plate} is off the road`, desc: reason, icon: "block", accent: "#DC2626" };
            }
            if (last?.result === "conditional") {
                return { plate: v.plate, title: `${v.plate} passed with conditions`, desc: last.notes || `${ASSESSMENT_LABELS[last.type]} needs a correction.`, icon: "warning", accent: "#D97706" };
            }
            if (last?.result === "pass") {
                return { plate: v.plate, title: `${v.plate} cleared inspection`, desc: `${ASSESSMENT_LABELS[last.type]} scored ${last.score}.`, icon: "check_circle", accent: "#16A34A" };
            }
            return { plate: v.plate, title: `${v.plate} has never been assessed`, desc: "Ask the fleet office to schedule an inspection.", icon: "pending", accent: "#1D3686" };
        })
        .slice(0, 5);

    const markers = fleet
        .filter((v) => blockingReason(v) === null)
        .map((v) => {
            const c = coordsFor(v.homeRank.replace(/ Rank$/, ""));
            return { lat: c.lat, lng: c.lng, label: v.plate.split(" ")[1] ?? v.plate, color: "#16A34A" };
        });

    return (
        <div className="space-y-6">
            <div className="rounded-[20px] px-5 py-5" style={{ backgroundColor: "#E1EDF5" }}>
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(17,17,17,0.50)" }}>
                    Overview
                </p>
                <h2 className="font-sans font-black text-2xl" style={{ color: "#111111", letterSpacing: "-0.02em" }}>
                    {user?.companyName || user?.name || "Operator"}
                </h2>
                <p className="font-sans text-sm mt-1" style={{ color: "rgba(17,17,17,0.60)" }}>
                    {fleet.length === 0
                        ? "No vehicles assigned to you yet. The fleet office assigns them."
                        : `${onRoad.length} of ${fleet.length} vehicles are cleared to carry passengers.`}
                </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
                {stats.map((s) => (
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
                        <p className="font-sans font-black text-xl leading-none" style={{ color: "#111111", letterSpacing: "-0.02em" }}>{s.value}</p>
                        <p className="font-sans text-[11px] font-bold mt-1" style={{ color: s.color }}>{s.trend}</p>
                    </div>
                ))}
            </div>

            {openRequests.length > 0 && (
                <div className="rounded-[16px] p-4" style={{ backgroundColor: "#EEF1EA", border: "1px solid rgba(17,17,17,0.07)" }}>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#5C5A56" }}>
                        With the fleet office
                    </p>
                    {openRequests.slice(0, 3).map((r) => (
                        <div key={r.id} className="flex items-center gap-2 py-1.5">
                            <span className="material-symbols-outlined text-base flex-shrink-0" style={{ color: "#1D3686" }}>hourglass_top</span>
                            <p className="font-sans text-sm flex-1 min-w-0 truncate" style={{ color: "#111111" }}>
                                {REQUEST_LABELS[r.kind]}{r.plate ? ` · ${r.plate}` : ""}
                            </p>
                            <span className="font-mono text-[10px] uppercase flex-shrink-0" style={{ color: "#8A8678" }}>Open</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Live map of this operator's own vehicles */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-sans font-black text-base" style={{ color: "#111111", letterSpacing: "-0.01em" }}>
                        My Fleet On The Map
                    </h3>
                    <span className="flex items-center gap-1.5 font-sans text-xs font-bold" style={{ color: "#16A34A" }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#16A34A" }} />
                        Live
                    </span>
                </div>
                <div
                    className="relative w-full aspect-video rounded-[18px] overflow-hidden"
                    style={{ border: "1px solid rgba(17,17,17,0.08)", boxShadow: "0 8px 28px rgba(17,17,17,0.10)" }}
                >
                    <MiniMap center={{ lat: -32.96, lng: 27.87 }} zoom={11} markers={markers} />
                    <div className="absolute bottom-3 left-3 right-3 flex gap-2 z-[500]">
                        {[
                            { dot: "#16A34A", label: `${onRoad.length} on the road` },
                            { dot: "#DC2626", label: `${offRoad.length} off the road` },
                        ].map((item) => (
                            <div
                                key={item.label}
                                className="px-3 py-1.5 rounded-full flex items-center gap-2"
                                style={{ backgroundColor: "rgba(255,255,255,0.90)", backdropFilter: "blur(8px)" }}
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
                <h3 className="font-sans font-black text-base mb-3" style={{ color: "#111111", letterSpacing: "-0.01em" }}>
                    Fleet Notices
                </h3>
                {alerts.length === 0 ? (
                    <p className="font-sans text-sm py-6 text-center" style={{ color: "#8A8678" }}>
                        No vehicles assigned yet, so there is nothing to report.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {alerts.map((a) => (
                            <div
                                key={a.plate + a.title}
                                className="flex items-start gap-3 p-4 rounded-[14px]"
                                style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(17,17,17,0.07)", borderLeft: `3px solid ${a.accent}` }}
                            >
                                <span className="material-symbols-outlined flex-shrink-0" style={{ color: a.accent }}>{a.icon}</span>
                                <div className="min-w-0">
                                    <p className="font-sans font-bold text-sm" style={{ color: "#111111" }}>{a.title}</p>
                                    <p className="font-sans text-xs mt-0.5" style={{ color: "#8A8678", lineHeight: 1.5 }}>{a.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ══════════════════════ Fleet (own, read-only) ══════════════════════ */
function TabFleet({ user, fleet }: { user: AuthUser; fleet: Vehicle[] }) {
    const { blockingReason, latestFor, assessmentsFor, raiseRequest, requests } = useFleet();
    const { toast } = useToast();

    const [search, setSearch] = useState("");
    const [expanded, setExpanded] = useState<string | null>(null);
    const [requesting, setRequesting] = useState<{ vehicle?: Vehicle; kind: RequestKind } | null>(null);
    const [detail, setDetail] = useState("");

    const visible = fleet.filter(
        (v) => !search || [v.plate, v.driverName, v.route, v.homeRank].join(" ").toLowerCase().includes(search.toLowerCase())
    );

    const myRequests = requests.filter((r) => r.operatorId === user?.id);

    function submitRequest() {
        if (!requesting) return;
        if (!detail.trim()) { toast("Say what you need so the fleet office can act on it", "error"); return; }
        raiseRequest({
            kind: requesting.kind,
            operatorId: user?.id ?? "",
            operatorName: user?.companyName || user?.name || "Operator",
            vehicleId: requesting.vehicle?.id,
            plate: requesting.vehicle?.plate,
            detail: detail.trim(),
        });
        toast("Sent to the fleet office", "success");
        setRequesting(null);
        setDetail("");
    }

    return (
        <div className="space-y-5">
            <div>
                <h2 className="font-sans font-black text-2xl" style={{ color: "#111111", letterSpacing: "-0.02em" }}>
                    My Fleet
                </h2>
                <p className="font-sans text-sm mt-1" style={{ color: "#8A8678", lineHeight: 1.6 }}>
                    Vehicles assigned to you. The Quallor fleet office adds vehicles and runs inspections, so anything you need from them goes through a request.
                </p>
            </div>

            <button
                onClick={() => { setRequesting({ kind: "add-vehicle" }); setDetail(""); }}
                className="w-full flex items-center gap-3 p-4 rounded-[16px] text-left"
                style={{ backgroundColor: "#EEF1EA", border: "1px dashed rgba(17,17,17,0.20)" }}
            >
                <span className="material-symbols-outlined flex-shrink-0" style={{ color: "#1D3686" }}>add_circle</span>
                <div className="flex-1">
                    <p className="font-sans font-bold text-sm" style={{ color: "#111111" }}>Need another vehicle on the road?</p>
                    <p className="font-sans text-xs" style={{ color: "#5C5A56" }}>Ask the fleet office to register and inspect it.</p>
                </div>
                <span className="material-symbols-outlined flex-shrink-0" style={{ color: "#AEA89C" }}>chevron_right</span>
            </button>

            {fleet.length > 0 && (
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#AEA89C" }}>search</span>
                    <input
                        className="q-input w-full pl-12"
                        placeholder="Search by plate, driver or route"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        aria-label="Search my fleet"
                    />
                </div>
            )}

            {visible.length === 0 ? (
                <div className="text-center py-14">
                    <span className="material-symbols-outlined text-5xl mb-3 block" style={{ color: "#CDDFF6" }}>local_taxi</span>
                    <p className="font-sans font-bold" style={{ color: "#111111" }}>
                        {fleet.length === 0 ? "No vehicles assigned to you yet" : "Nothing matches that search"}
                    </p>
                    <p className="font-sans text-sm mt-1 max-w-xs mx-auto" style={{ color: "#8A8678", lineHeight: 1.6 }}>
                        {fleet.length === 0
                            ? "Once the fleet office assigns a vehicle to your association it appears here."
                            : "Try a different plate or driver name."}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {visible.map((v) => {
                        const blocked = blockingReason(v);
                        const isOpen = expanded === v.id;
                        const last = latestFor(v.id);
                        const style = STATUS_STYLE[v.status];

                        return (
                            <div
                                key={v.id}
                                className="overflow-hidden rounded-[16px]"
                                style={{
                                    backgroundColor: "#FFFFFF",
                                    border: blocked ? "1px solid rgba(220,38,38,0.22)" : "1px solid rgba(17,17,17,0.07)",
                                    boxShadow: "0 2px 8px rgba(17,17,17,0.05)",
                                }}
                            >
                                <button
                                    className="w-full flex items-center gap-3 p-4 text-left"
                                    onClick={() => setExpanded(isOpen ? null : v.id)}
                                >
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
                                                style={{ backgroundColor: style.bg, color: style.color }}
                                            >
                                                {style.label}
                                            </span>
                                        </div>
                                        <p className="font-sans text-xs truncate mt-0.5" style={{ color: "#8A8678" }}>
                                            {v.driverName} · {v.route}
                                        </p>
                                    </div>
                                    <span
                                        className="material-symbols-outlined flex-shrink-0 transition-transform"
                                        style={{ color: "#AEA89C", transform: isOpen ? "rotate(180deg)" : undefined }}
                                    >
                                        expand_more
                                    </span>
                                </button>

                                {blocked && (
                                    <div className="mx-4 mb-4 px-3 py-2.5 rounded-[10px] flex gap-2 items-start" style={{ backgroundColor: "rgba(220,38,38,0.06)" }}>
                                        <span className="material-symbols-outlined text-base flex-shrink-0" style={{ color: "#DC2626" }}>block</span>
                                        <p className="font-sans text-xs" style={{ color: "rgba(17,17,17,0.78)", lineHeight: 1.5 }}>
                                            Taken off the road by the fleet office: {blocked}
                                        </p>
                                    </div>
                                )}

                                {isOpen && (
                                    <div className="px-4 pb-4" style={{ borderTop: "1px solid rgba(17,17,17,0.06)" }}>
                                        <div className="grid grid-cols-2 gap-y-3 py-4">
                                            {[
                                                { k: "Driver", v: v.driverName },
                                                { k: "Driver phone", v: v.driverPhone || "Not recorded" },
                                                { k: "Vehicle", v: `${v.model} ${v.year}` },
                                                { k: "Seats", v: String(v.capacity) },
                                                { k: "Home rank", v: v.homeRank },
                                                { k: "Odometer", v: `${v.odometer.toLocaleString("en-ZA")} km` },
                                                { k: "Operating licence", v: v.permitNumber },
                                                {
                                                    k: "Licence expiry",
                                                    v: v.licenceExpiry
                                                        ? new Date(v.licenceExpiry).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })
                                                        : "Not recorded",
                                                },
                                            ].map((row) => (
                                                <div key={row.k}>
                                                    <p className="font-mono text-[9px] font-bold uppercase tracking-wider" style={{ color: "#AEA89C" }}>{row.k}</p>
                                                    <p className="font-sans text-xs font-semibold mt-0.5" style={{ color: "#111111" }}>{row.v}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#AEA89C" }}>
                                            Latest Inspection
                                        </p>
                                        {last ? (
                                            <div
                                                className="p-3 rounded-[10px] mb-4 flex items-center gap-3"
                                                style={{ backgroundColor: "#FFFCF9", border: "1px solid rgba(17,17,17,0.06)" }}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-sans text-xs font-bold" style={{ color: "#111111" }}>{ASSESSMENT_LABELS[last.type]}</p>
                                                    <p className="font-mono text-[10px]" style={{ color: "#AEA89C" }}>
                                                        {new Date(last.assessedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })} · {last.assessor} · {assessmentsFor(v.id).length} on record
                                                    </p>
                                                </div>
                                                <span
                                                    className="font-sans font-black text-lg flex-shrink-0"
                                                    style={{ color: last.result === "pass" ? "#16A34A" : last.result === "conditional" ? "#D97706" : "#DC2626" }}
                                                >
                                                    {last.score}
                                                </span>
                                            </div>
                                        ) : (
                                            <p className="font-sans text-sm mb-4" style={{ color: "#8A8678" }}>
                                                This vehicle has not been inspected yet.
                                            </p>
                                        )}

                                        <div className="flex flex-wrap gap-2">
                                            <a
                                                href={`tel:${v.driverPhone.replace(/\s/g, "")}`}
                                                className="flex-1 min-w-[8rem] py-2.5 rounded-full font-sans text-xs font-bold text-center"
                                                style={{ backgroundColor: "#CDDFF6", color: "#111111" }}
                                            >
                                                Call driver
                                            </a>
                                            <button
                                                onClick={() => { setRequesting({ vehicle: v, kind: "assessment" }); setDetail(""); }}
                                                className="flex-1 min-w-[8rem] py-2.5 rounded-full font-sans text-xs font-bold"
                                                style={{ backgroundColor: "#EEF1EA", color: "#111111" }}
                                            >
                                                Request inspection
                                            </button>
                                            <button
                                                onClick={() => { setRequesting({ vehicle: v, kind: "repair" }); setDetail(""); }}
                                                className="flex-1 min-w-[8rem] py-2.5 rounded-full font-sans text-xs font-bold"
                                                style={{ backgroundColor: "rgba(220,38,38,0.08)", color: "#DC2626" }}
                                            >
                                                Report a defect
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Requests raised by this operator */}
            {myRequests.length > 0 && (
                <div>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#AEA89C" }}>
                        My Requests To The Fleet Office
                    </p>
                    <div
                        className="rounded-[16px] overflow-hidden"
                        style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(17,17,17,0.07)" }}
                    >
                        {myRequests.map((r, i) => (
                            <div
                                key={r.id}
                                className="flex items-start gap-3 p-4"
                                style={{ borderTop: i === 0 ? undefined : "1px solid rgba(17,17,17,0.06)" }}
                            >
                                <span
                                    className="material-symbols-outlined flex-shrink-0"
                                    style={{ color: r.status === "open" ? "#D97706" : "#16A34A" }}
                                >
                                    {r.status === "open" ? "hourglass_top" : "check_circle"}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-sans text-sm font-bold" style={{ color: "#111111" }}>
                                        {REQUEST_LABELS[r.kind]}{r.plate ? ` · ${r.plate}` : ""}
                                    </p>
                                    <p className="font-sans text-xs mt-0.5" style={{ color: "#8A8678", lineHeight: 1.5 }}>{r.detail}</p>
                                    <p className="font-mono text-[10px] mt-1" style={{ color: "#AEA89C" }}>
                                        {new Date(r.raisedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })} · {r.status}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Request dialog */}
            {requesting && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
                    style={{ backgroundColor: "rgba(17,17,17,0.45)" }}
                    onClick={() => setRequesting(null)}
                >
                    <div className="w-full max-w-md rounded-[18px] p-5" style={{ backgroundColor: "#FFFFFF" }} onClick={(e) => e.stopPropagation()}>
                        <h3 className="font-sans font-black text-lg mb-1" style={{ color: "#111111", letterSpacing: "-0.02em" }}>
                            {REQUEST_LABELS[requesting.kind]}
                        </h3>
                        <p className="font-sans text-sm mb-4" style={{ color: "#8A8678", lineHeight: 1.6 }}>
                            {requesting.vehicle
                                ? `About ${requesting.vehicle.plate}. The fleet office will pick this up.`
                                : "Tell the fleet office what you need. They register and inspect the vehicle before it can carry passengers."}
                        </p>
                        <textarea
                            className="q-input-lg mb-4"
                            style={{ height: "7rem", paddingTop: "0.9rem", resize: "vertical" }}
                            placeholder={requesting.kind === "add-vehicle"
                                ? "e.g. Toyota Quantum, plate EC 555-111, driver Andile M, to run Beacon Bay to Vincent"
                                : "Describe the problem or what you need"}
                            value={detail}
                            onChange={(e) => setDetail(e.target.value)}
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setRequesting(null)} className="q-btn-outline flex-1 justify-center">Cancel</button>
                            <button onClick={submitRequest} className="q-btn-dark flex-1 justify-center">Send request</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ══════════════════════ Analytics ══════════════════════ */
function TabAnalytics({ fleet }: { fleet: Vehicle[] }) {
    const max = Math.max(...WEEKLY_TRIPS.map((d) => d.trips));
    const totalTrips = WEEKLY_TRIPS.reduce((s, d) => s + d.trips, 0);
    const totalRevenue = WEEKLY_TRIPS.reduce((s, d) => s + d.revenue, 0);

    return (
        <div className="space-y-6">
            <h2 className="font-sans font-black text-2xl" style={{ color: "#111111", letterSpacing: "-0.02em" }}>Analytics</h2>

            <div className="grid grid-cols-2 gap-3">
                {[
                    { label: "Trips this week", value: totalTrips.toString() },
                    { label: "Revenue this week", value: `R ${totalRevenue.toLocaleString("en-ZA")}` },
                    { label: "Average per trip", value: `R ${Math.round(totalRevenue / totalTrips)}` },
                    { label: "Vehicles earning", value: String(fleet.filter((v) => v.status === "active").length) },
                ].map((s) => (
                    <div
                        key={s.label}
                        className="rounded-[16px] p-4"
                        style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(17,17,17,0.07)" }}
                    >
                        <p className="font-mono text-[10px] font-bold uppercase tracking-wider" style={{ color: "#8A8678" }}>{s.label}</p>
                        <p className="font-sans font-black text-xl mt-1" style={{ color: "#111111", letterSpacing: "-0.02em" }}>{s.value}</p>
                    </div>
                ))}
            </div>

            <div className="rounded-[18px] p-5" style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(17,17,17,0.07)" }}>
                <h3 className="font-sans font-black text-base mb-4" style={{ color: "#111111" }}>Trips by day</h3>
                <div className="flex items-end justify-between gap-2" style={{ height: "10rem" }}>
                    {WEEKLY_TRIPS.map((d) => (
                        <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                            <div
                                className="w-full rounded-t-[6px] transition-all"
                                style={{ height: `${(d.trips / max) * 100}%`, backgroundColor: d.trips === max ? "#1D3686" : "#CDDFF6" }}
                                title={`${d.trips} trips · R ${d.revenue.toLocaleString("en-ZA")}`}
                            />
                            <span className="font-mono text-[10px] font-bold uppercase" style={{ color: "#8A8678" }}>{d.day}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ══════════════════════ Settings ══════════════════════ */
type Section =
    | null | "company" | "fleet-settings" | "billing"
    | "routes" | "drivers" | "policies" | "notifications" | "support";

function TabSettings({ user, fleet, onLogout }: { user: AuthUser; fleet: Vehicle[]; onLogout: () => void }) {
    const [section, setSection] = useState<Section>(null);

    const groups: { title: string; items: { icon: string; label: string; sub: string; section: Section }[] }[] = [
        {
            title: "Company",
            items: [
                { icon: "business",   label: "Company Profile",   sub: user?.companyName || "Trading details and contacts", section: "company" },
                { icon: "local_taxi", label: "Fleet Settings",    sub: `${fleet.length} vehicle${fleet.length === 1 ? "" : "s"} assigned to you`, section: "fleet-settings" },
                { icon: "payments",   label: "Billing & Payouts", sub: "Bank account, payout schedule, invoices", section: "billing" },
            ],
        },
        {
            title: "Operations",
            items: [
                { icon: "route",      label: "Route Management",  sub: "Approved routes and fares",  section: "routes" },
                { icon: "person_add", label: "Driver Onboarding", sub: "Invite and manage drivers",  section: "drivers" },
                { icon: "shield",     label: "Safety Policies",   sub: "Speed limits, shifts, SOS",  section: "policies" },
            ],
        },
        {
            title: "Account",
            items: [
                { icon: "notifications", label: "Notifications", sub: "Alerts, reports, digests", section: "notifications" },
                { icon: "help",          label: "Support",       sub: "Help centre and contacts", section: "support" },
            ],
        },
    ];

    if (section) {
        return <SettingsDetail section={section} user={user} fleet={fleet} onBack={() => setSection(null)} />;
    }

    const initials = user?.name ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "OP";

    return (
        <div className="space-y-6">
            <div
                className="flex items-center gap-4 p-4 rounded-[16px]"
                style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(17,17,17,0.07)", boxShadow: "0 2px 8px rgba(17,17,17,0.05)" }}
            >
                <div className="w-16 h-16 rounded-[14px] flex items-center justify-center flex-shrink-0" style={{ background: "#111111" }}>
                    <span className="font-sans font-black text-[#CDDFF6] text-2xl" style={{ letterSpacing: "-0.02em" }}>{initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-sans font-black text-lg truncate" style={{ color: "#111111", letterSpacing: "-0.02em" }}>{user?.name || "Operator"}</p>
                    <p className="font-sans text-sm truncate" style={{ color: "#8A8678" }}>{user?.email}</p>
                    <p className="font-sans text-xs font-bold mt-0.5" style={{ color: "#5C5A56" }}>{user?.companyName || "Fleet Operator"}</p>
                </div>
                <span
                    className="font-mono text-[10px] font-bold uppercase px-2 py-1 rounded-full flex-shrink-0"
                    style={user?.operatorStatus === "verified"
                        ? { backgroundColor: "rgba(22,163,74,0.10)", color: "#16A34A" }
                        : { backgroundColor: "#EEF1EA", color: "#8A8678" }}
                >
                    {user?.operatorStatus || "pending"}
                </span>
            </div>

            {/* Who owns the register, stated plainly */}
            <div className="rounded-[16px] p-4 flex gap-3 items-start" style={{ backgroundColor: "#E1EDF5" }}>
                <span className="material-symbols-outlined flex-shrink-0" style={{ color: "#1D3686" }}>info</span>
                <p className="font-sans text-sm" style={{ color: "rgba(17,17,17,0.78)", lineHeight: 1.6 }}>
                    Vehicles are added, inspected and taken off the road by the Quallor fleet office. Use Fleet Settings to see what is assigned to you and to raise a request.
                </p>
            </div>

            {groups.map((group) => (
                <div key={group.title}>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-2 px-1" style={{ color: "#AEA89C" }}>
                        {group.title}
                    </p>
                    <div
                        className="rounded-[16px] overflow-hidden"
                        style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(17,17,17,0.07)", boxShadow: "0 2px 8px rgba(17,17,17,0.05)" }}
                    >
                        {group.items.map((item, i) => (
                            <button
                                key={item.label}
                                onClick={() => setSection(item.section)}
                                className="w-full flex items-center gap-4 p-4 text-left transition-colors"
                                style={{ borderTop: i === 0 ? undefined : "1px solid rgba(17,17,17,0.06)" }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#FFFCF9"; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = ""; }}
                            >
                                <div
                                    className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: "#EEF1EA", color: "#111111" }}
                                >
                                    <span className="material-symbols-outlined">{item.icon}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-sans font-semibold" style={{ color: "#111111" }}>{item.label}</p>
                                    <p className="font-sans text-xs" style={{ color: "#8A8678" }}>{item.sub}</p>
                                </div>
                                <span className="material-symbols-outlined flex-shrink-0" style={{ color: "#AEA89C" }}>chevron_right</span>
                            </button>
                        ))}
                    </div>
                </div>
            ))}

            <button
                onClick={onLogout}
                className="w-full py-4 rounded-full font-sans font-bold flex items-center justify-center gap-2"
                style={{ border: "2px solid rgba(220,38,38,0.22)", color: "#DC2626" }}
            >
                <span className="material-symbols-outlined">logout</span>
                Sign Out
            </button>
        </div>
    );
}

/* ── Settings detail panels ── */
function SettingsDetail({
    section, user, fleet, onBack,
}: {
    section: Section; user: AuthUser; fleet: Vehicle[]; onBack: () => void;
}) {
    const { updateUser } = useAuth();
    const {
        operator, updateOperator, addRoute, updateRoute, removeRoute, inviteDriver,
    } = useSettings();
    const { raiseRequest } = useFleet();
    const { toast } = useToast();

    const titles: Record<Exclude<Section, null>, string> = {
        company: "Company Profile",
        "fleet-settings": "Fleet Settings",
        billing: "Billing & Payouts",
        routes: "Route Management",
        drivers: "Driver Onboarding",
        policies: "Safety Policies",
        notifications: "Notifications",
        support: "Support",
    };

    return (
        <div>
            <button onClick={onBack} className="flex items-center gap-2 mb-5 font-sans text-sm font-bold" style={{ color: "#1D3686" }}>
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                Settings
            </button>
            <h2 className="font-sans font-black text-2xl mb-5" style={{ color: "#111111", letterSpacing: "-0.02em" }}>
                {titles[section as Exclude<Section, null>]}
            </h2>

            {section === "company" && <CompanyPanel user={user} updateUser={updateUser} operator={operator} updateOperator={updateOperator} toast={toast} />}
            {section === "fleet-settings" && <FleetSettingsPanel fleet={fleet} user={user} raiseRequest={raiseRequest} toast={toast} />}
            {section === "billing" && <BillingPanel operator={operator} updateOperator={updateOperator} toast={toast} />}
            {section === "routes" && <RoutesPanel routes={operator.routes} addRoute={addRoute} updateRoute={updateRoute} removeRoute={removeRoute} toast={toast} />}
            {section === "drivers" && <DriversPanel fleet={fleet} invites={operator.driverInvites} inviteDriver={inviteDriver} toast={toast} />}
            {section === "policies" && <PoliciesPanel operator={operator} updateOperator={updateOperator} toast={toast} />}
            {section === "notifications" && <NotificationsPanel operator={operator} updateOperator={updateOperator} toast={toast} />}
            {section === "support" && <SupportPanel />}
        </div>
    );
}

type ToastFn = (m: string, t?: "info" | "success" | "error") => void;
type OperatorSettingsShape = ReturnType<typeof useSettings>["operator"];

function Card({ children }: { children: React.ReactNode }) {
    return (
        <div className="rounded-[16px] p-5 mb-4" style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(17,17,17,0.07)" }}>
            {children}
        </div>
    );
}

function CompanyPanel({
    user, updateUser, operator, updateOperator, toast,
}: {
    user: AuthUser;
    updateUser: ReturnType<typeof useAuth>["updateUser"];
    operator: OperatorSettingsShape;
    updateOperator: (p: Partial<OperatorSettingsShape>) => void;
    toast: ToastFn;
}) {
    const [name, setName] = useState(user?.name ?? "");
    const [companyName, setCompanyName] = useState(user?.companyName ?? "");
    const [email, setEmail] = useState(user?.email ?? "");
    const [phone, setPhone] = useState(user?.phone ?? "");
    const [tradingName, setTradingName] = useState(operator.tradingName);
    const [registrationNumber, setRegistrationNumber] = useState(operator.registrationNumber);
    const [vatNumber, setVatNumber] = useState(operator.vatNumber);
    const [operatingRegion, setOperatingRegion] = useState(operator.operatingRegion);
    const [homeProvince, setHomeProvince] = useState<ProvinceId>(user?.homeProvince ?? DEFAULT_PROVINCE);
    const [error, setError] = useState("");

    return (
        <>
            {error && (
                <div
                    className="mb-4 px-4 py-3 rounded-[12px] font-sans text-sm font-semibold"
                    style={{ backgroundColor: "rgba(220,38,38,0.07)", border: "1.5px solid rgba(220,38,38,0.20)", color: "#DC2626" }}
                >
                    {error}
                </div>
            )}
            <Card>
                <Field label="Contact Name" value={name} onChange={setName} placeholder="Your full name" />
                <Field label="Company / Association" value={companyName} onChange={setCompanyName} placeholder="e.g. Border Alliance Taxi Association" />
                <Field label="Email Address" value={email} onChange={setEmail} type="email" placeholder="operator@example.com" hint="Also your sign-in address." />
                <Field label="Phone" value={phone} onChange={setPhone} type="tel" placeholder="082 123 4567" />
            </Card>
            <Card>
                <Field label="Trading Name" value={tradingName} onChange={setTradingName} placeholder="Name shown on invoices" />
                <Field label="Company Registration Number" value={registrationNumber} onChange={setRegistrationNumber} placeholder="2019/123456/07" />
                <Field label="VAT Number" value={vatNumber} onChange={setVatNumber} placeholder="4123456789 (leave blank if not registered)" />
                <Field label="Operating Region" value={operatingRegion} onChange={setOperatingRegion} placeholder="e.g. Buffalo City Metro" />
            </Card>

            {/* An operator never opens the passenger commute screens, so this is
                the only place they can set which network they run on. It decides
                which places Route Management will offer them. */}
            <Card>
                <p className="q-label">Network</p>
                <p className="font-sans text-xs mb-3" style={{ color: "#8A8678" }}>
                    The metro your association runs in. Approved routes can only use
                    places on this network.
                </p>
                <ProvinceOptions selected={homeProvince} onSelect={setHomeProvince} />
            </Card>

            <button
                onClick={async () => {
                    setError("");
                    if (!name.trim()) { setError("A contact name is required."); return; }
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("That does not look like a valid email address."); return; }
                    const res = await updateUser({ name: name.trim(), companyName: companyName.trim(), email: email.trim(), phone: phone.trim(), homeProvince });
                    if (!res.success) { setError(res.error || "Could not save."); return; }
                    updateOperator({ tradingName, registrationNumber, vatNumber, operatingRegion, contactEmail: email.trim(), contactPhone: phone.trim() });
                    toast("Company profile saved", "success");
                }}
                className="q-btn-dark w-full justify-center"
            >
                Save Changes
            </button>
        </>
    );
}

function FleetSettingsPanel({
    fleet, user, raiseRequest, toast,
}: {
    fleet: Vehicle[];
    user: AuthUser;
    raiseRequest: ReturnType<typeof useFleet>["raiseRequest"];
    toast: ToastFn;
}) {
    const [detail, setDetail] = useState("");
    const seats = fleet.reduce((s, v) => s + v.capacity, 0);

    return (
        <>
            <Card>
                <div className="grid grid-cols-2 gap-4">
                    {[
                        { k: "Vehicles assigned", v: String(fleet.length) },
                        { k: "Total seats", v: String(seats) },
                        { k: "On the road", v: String(fleet.filter((v) => v.status === "active").length) },
                        { k: "Off the road", v: String(fleet.filter((v) => v.status !== "active").length) },
                    ].map((row) => (
                        <div key={row.k}>
                            <p className="font-mono text-[10px] font-bold uppercase tracking-wider" style={{ color: "#AEA89C" }}>{row.k}</p>
                            <p className="font-sans font-black text-xl mt-0.5" style={{ color: "#111111" }}>{row.v}</p>
                        </div>
                    ))}
                </div>
            </Card>

            <Card>
                <p className="font-sans font-bold mb-1" style={{ color: "#111111" }}>Who changes the register</p>
                <p className="font-sans text-sm mb-4" style={{ color: "#8A8678", lineHeight: 1.6 }}>
                    Adding a vehicle, changing its assigned driver, or putting it back on the road after an inspection is done by the Quallor fleet office. Send them a note and it lands in their inbox.
                </p>
                <textarea
                    className="q-input-lg mb-3"
                    style={{ height: "6rem", paddingTop: "0.9rem", resize: "vertical" }}
                    placeholder="What do you need changed?"
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                />
                <button
                    onClick={() => {
                        if (!detail.trim()) { toast("Write what you need first", "error"); return; }
                        raiseRequest({
                            kind: "other",
                            operatorId: user?.id ?? "",
                            operatorName: user?.companyName || user?.name || "Operator",
                            detail: detail.trim(),
                        });
                        setDetail("");
                        toast("Sent to the fleet office", "success");
                    }}
                    className="q-btn-dark w-full justify-center"
                >
                    Send to fleet office
                </button>
            </Card>
        </>
    );
}

function BillingPanel({
    operator, updateOperator, toast,
}: {
    operator: OperatorSettingsShape;
    updateOperator: (p: Partial<OperatorSettingsShape>) => void;
    toast: ToastFn;
}) {
    const [bankName, setBankName] = useState(operator.payout.bankName);
    const [accountHolder, setAccountHolder] = useState(operator.payout.accountHolder);
    const [last4, setLast4] = useState(operator.payout.accountLast4);

    const invoices = [
        { id: "INV-2026-08", period: "August 2026", amount: 74400, status: "Open" },
        { id: "INV-2026-07", period: "July 2026",   amount: 81250, status: "Paid" },
        { id: "INV-2026-06", period: "June 2026",   amount: 69800, status: "Paid" },
    ];

    return (
        <>
            <Card>
                <p className="font-sans font-bold mb-1" style={{ color: "#111111" }}>Payout account</p>
                <p className="font-sans text-sm mb-4" style={{ color: "#8A8678", lineHeight: 1.6 }}>
                    Quallor never stores a full account number. Record the bank and the last four digits here; the full details are captured by the payment provider when payouts are set up.
                </p>
                <Field label="Bank" value={bankName} onChange={setBankName} placeholder="e.g. Capitec Business" />
                <Field label="Account Holder" value={accountHolder} onChange={setAccountHolder} placeholder="Registered account name" />
                <Field
                    label="Last 4 Digits"
                    value={last4}
                    onChange={(v) => setLast4(v.replace(/\D/g, "").slice(0, 4))}
                    placeholder="1234"
                    inputMode="numeric"
                />

                <label className="q-label">Payout Schedule</label>
                <div className="flex gap-2 mb-4">
                    {(["daily", "weekly", "monthly"] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => { updateOperator({ payout: { ...operator.payout, schedule: s } }); toast(`Payouts set to ${s}`, "success"); }}
                            className="flex-1 py-2.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider capitalize"
                            style={operator.payout.schedule === s
                                ? { backgroundColor: "#111111", color: "#FFFFFF" }
                                : { backgroundColor: "#EEF1EA", color: "#5C5A56" }}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => {
                        updateOperator({ payout: { ...operator.payout, bankName, accountHolder, accountLast4: last4 } });
                        toast("Payout details saved", "success");
                    }}
                    className="q-btn-dark w-full justify-center"
                >
                    Save payout details
                </button>
            </Card>

            <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-2 px-1" style={{ color: "#AEA89C" }}>
                Invoices
            </p>
            <div className="rounded-[16px] overflow-hidden mb-4" style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(17,17,17,0.07)" }}>
                {invoices.map((inv, i) => (
                    <div
                        key={inv.id}
                        className="flex items-center gap-3 p-4"
                        style={{ borderTop: i === 0 ? undefined : "1px solid rgba(17,17,17,0.06)" }}
                    >
                        <div className="flex-1 min-w-0">
                            <p className="font-sans font-semibold" style={{ color: "#111111" }}>{inv.period}</p>
                            <p className="font-mono text-[10px]" style={{ color: "#AEA89C" }}>{inv.id}</p>
                        </div>
                        <p className="font-sans font-black" style={{ color: "#111111" }}>R {inv.amount.toLocaleString("en-ZA")}</p>
                        <span
                            className="font-mono text-[10px] font-bold uppercase px-2.5 py-1 rounded-full flex-shrink-0"
                            style={inv.status === "Paid"
                                ? { backgroundColor: "rgba(22,163,74,0.10)", color: "#16A34A" }
                                : { backgroundColor: "rgba(217,119,6,0.10)", color: "#D97706" }}
                        >
                            {inv.status}
                        </span>
                    </div>
                ))}
            </div>
        </>
    );
}

function RoutesPanel({
    routes, addRoute, updateRoute, removeRoute, toast,
}: {
    routes: OperatorRoute[];
    addRoute: (r: Omit<OperatorRoute, "id">) => void;
    updateRoute: (id: string, p: Partial<OperatorRoute>) => void;
    removeRoute: (id: string) => void;
    toast: ToastFn;
}) {
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [fare, setFare] = useState("");

    // An operator approves routes on their own network. Offering them every
    // place in the country lets a Cape Town association approve a Mdantsane
    // run, which no taxi of theirs can serve.
    const { provinceId } = useProvince();
    const names = useMemo(
        () => PLACES.filter((p) => p.province === provinceId).map((p) => p.name),
        [provinceId]
    );

    return (
        <>
            <Card>
                <p className="font-sans font-bold mb-3" style={{ color: "#111111" }}>Add an approved route</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                        <label className="q-label">From</label>
                        <select className="q-input" value={from} onChange={(e) => setFrom(e.target.value)}>
                            <option value="">Choose</option>
                            {names.map((n) => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="q-label">To</label>
                        <select className="q-input" value={to} onChange={(e) => setTo(e.target.value)}>
                            <option value="">Choose</option>
                            {names.map((n) => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                </div>
                <Field label="Fare (R)" value={fare} onChange={setFare} type="number" placeholder="e.g. 22" />
                <button
                    onClick={() => {
                        if (!from || !to) { toast("Pick both ends of the route", "error"); return; }
                        if (from === to) { toast("A route needs two different places", "error"); return; }
                        if (routes.some((r) => r.from === from && r.to === to)) { toast("That route is already approved", "error"); return; }
                        addRoute({ from, to, fare: Number(fare) || 0, active: true });
                        toast(`${from} to ${to} added`, "success");
                        setFrom(""); setTo(""); setFare("");
                    }}
                    className="q-btn-dark w-full justify-center"
                >
                    Add route
                </button>
            </Card>

            <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-2 px-1" style={{ color: "#AEA89C" }}>
                {routes.length} Approved Route{routes.length === 1 ? "" : "s"}
            </p>
            <div className="rounded-[16px] overflow-hidden" style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(17,17,17,0.07)" }}>
                {routes.length === 0 ? (
                    <p className="font-sans text-sm p-4" style={{ color: "#8A8678" }}>No routes approved yet.</p>
                ) : routes.map((r, i) => (
                    <div
                        key={r.id}
                        className="flex items-center gap-3 p-4"
                        style={{ borderTop: i === 0 ? undefined : "1px solid rgba(17,17,17,0.06)", opacity: r.active ? 1 : 0.55 }}
                    >
                        <div className="flex-1 min-w-0">
                            <p className="font-sans font-semibold truncate" style={{ color: "#111111" }}>{r.from} → {r.to}</p>
                            <p className="font-mono text-[10px]" style={{ color: "#AEA89C" }}>R {r.fare}.00 fixed fare</p>
                        </div>
                        <Toggle
                            label={`${r.from} to ${r.to} active`}
                            checked={r.active}
                            onChange={(next) => { updateRoute(r.id, { active: next }); toast(next ? "Route reopened" : "Route paused", "success"); }}
                        />
                        <button
                            onClick={() => { removeRoute(r.id); toast("Route removed", "info"); }}
                            aria-label={`Remove ${r.from} to ${r.to}`}
                            className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0"
                            style={{ color: "#DC2626" }}
                        >
                            <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                    </div>
                ))}
            </div>
        </>
    );
}

function DriversPanel({
    fleet, invites, inviteDriver, toast,
}: {
    fleet: Vehicle[];
    invites: ReturnType<typeof useSettings>["operator"]["driverInvites"];
    inviteDriver: (name: string, phone: string) => unknown;
    toast: ToastFn;
}) {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");

    return (
        <>
            <Card>
                <p className="font-sans font-bold mb-1" style={{ color: "#111111" }}>Invite a driver</p>
                <p className="font-sans text-sm mb-4" style={{ color: "#8A8678", lineHeight: 1.6 }}>
                    They get a link to register. Once the fleet office verifies their vehicle it appears in your fleet.
                </p>
                <Field label="Driver Name" value={name} onChange={setName} placeholder="Full name" />
                <Field label="Mobile Number" value={phone} onChange={setPhone} type="tel" placeholder="082 123 4567" />
                <button
                    onClick={() => {
                        if (!name.trim()) { toast("Enter the driver's name", "error"); return; }
                        const digits = phone.replace(/[^\d+]/g, "");
                        if (!/^(\+?27|0)\d{9}$/.test(digits)) { toast("Enter a valid South African mobile number", "error"); return; }
                        inviteDriver(name.trim(), phone.trim());
                        toast(`Invite sent to ${name.trim()}`, "success");
                        setName(""); setPhone("");
                    }}
                    className="q-btn-dark w-full justify-center"
                >
                    Send invite
                </button>
            </Card>

            <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-2 px-1" style={{ color: "#AEA89C" }}>
                Drivers On My Vehicles
            </p>
            <div className="rounded-[16px] overflow-hidden mb-5" style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(17,17,17,0.07)" }}>
                {fleet.length === 0 ? (
                    <p className="font-sans text-sm p-4" style={{ color: "#8A8678" }}>No vehicles assigned to you yet.</p>
                ) : fleet.map((v, i) => (
                    <div
                        key={v.id}
                        className="flex items-center gap-3 p-4"
                        style={{ borderTop: i === 0 ? undefined : "1px solid rgba(17,17,17,0.06)" }}
                    >
                        <div
                            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-sans font-bold text-sm"
                            style={{ backgroundColor: "#EEF1EA", color: "#111111" }}
                        >
                            {v.driverName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-sans font-semibold truncate" style={{ color: "#111111" }}>{v.driverName}</p>
                            <p className="font-sans text-xs" style={{ color: "#8A8678" }}>{v.plate} · {v.driverPhone || "no number"}</p>
                        </div>
                        <a
                            href={`tel:${v.driverPhone.replace(/\s/g, "")}`}
                            className="font-mono text-[10px] font-bold uppercase px-3 py-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: "#CDDFF6", color: "#111111" }}
                        >
                            Call
                        </a>
                    </div>
                ))}
            </div>

            {invites.length > 0 && (
                <>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-2 px-1" style={{ color: "#AEA89C" }}>
                        Pending Invites
                    </p>
                    <div className="rounded-[16px] overflow-hidden" style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(17,17,17,0.07)" }}>
                        {invites.map((inv, i) => (
                            <div
                                key={inv.id}
                                className="flex items-center gap-3 p-4"
                                style={{ borderTop: i === 0 ? undefined : "1px solid rgba(17,17,17,0.06)" }}
                            >
                                <span className="material-symbols-outlined flex-shrink-0" style={{ color: "#D97706" }}>hourglass_top</span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-sans font-semibold truncate" style={{ color: "#111111" }}>{inv.name}</p>
                                    <p className="font-sans text-xs" style={{ color: "#8A8678" }}>
                                        {inv.phone} · invited {new Date(inv.sentAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </>
    );
}

function PoliciesPanel({
    operator, updateOperator, toast,
}: {
    operator: OperatorSettingsShape;
    updateOperator: (p: Partial<OperatorSettingsShape>) => void;
    toast: ToastFn;
}) {
    const p = operator.policies;

    function set(patch: Partial<typeof p>, message: string) {
        updateOperator({ policies: { ...p, ...patch } });
        toast(message, "success");
    }

    return (
        <>
            <Card>
                <label className="q-label">Maximum Speed (km/h)</label>
                <div className="flex gap-2 mb-5">
                    {[80, 100, 120].map((s) => (
                        <button
                            key={s}
                            onClick={() => set({ maxSpeed: s }, `Speed limit set to ${s} km/h`)}
                            className="flex-1 py-2.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider"
                            style={p.maxSpeed === s
                                ? { backgroundColor: "#111111", color: "#FFFFFF" }
                                : { backgroundColor: "#EEF1EA", color: "#5C5A56" }}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                <label className="q-label">Maximum Shift Length (hours)</label>
                <div className="flex gap-2">
                    {[8, 10, 12, 14].map((h) => (
                        <button
                            key={h}
                            onClick={() => set({ maxShiftHours: h }, `Shift limit set to ${h} hours`)}
                            className="flex-1 py-2.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider"
                            style={p.maxShiftHours === h
                                ? { backgroundColor: "#111111", color: "#FFFFFF" }
                                : { backgroundColor: "#EEF1EA", color: "#5C5A56" }}
                        >
                            {h}
                        </button>
                    ))}
                </div>
            </Card>

            <div className="rounded-[16px] overflow-hidden" style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(17,17,17,0.07)" }}>
                {[
                    { key: "nightDriving" as const,          label: "Allow night driving",        sub: "Trips after 20:00" },
                    { key: "sosAutoEscalate" as const,       label: "Escalate SOS to me",         sub: "Alert the operator on any passenger SOS" },
                    { key: "seatbeltCheckRequired" as const, label: "Seatbelt check before departure", sub: "Gaatjie must confirm before the taxi moves" },
                ].map((row, i) => (
                    <div
                        key={row.key}
                        className="flex items-center gap-4 p-4"
                        style={{ borderTop: i === 0 ? undefined : "1px solid rgba(17,17,17,0.06)" }}
                    >
                        <div className="flex-1 min-w-0">
                            <p className="font-sans font-semibold" style={{ color: "#111111" }}>{row.label}</p>
                            <p className="font-sans text-xs" style={{ color: "#8A8678" }}>{row.sub}</p>
                        </div>
                        <Toggle
                            label={row.label}
                            checked={p[row.key]}
                            onChange={(next) => set({ [row.key]: next } as Partial<typeof p>, next ? `${row.label} on` : `${row.label} off`)}
                        />
                    </div>
                ))}
            </div>
        </>
    );
}

function NotificationsPanel({
    operator, updateOperator, toast,
}: {
    operator: OperatorSettingsShape;
    updateOperator: (p: Partial<OperatorSettingsShape>) => void;
    toast: ToastFn;
}) {
    const n = operator.notifications;
    return (
        <div className="rounded-[16px] overflow-hidden" style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(17,17,17,0.07)" }}>
            {[
                { key: "dailyDigest" as const,      label: "Daily digest",       sub: "Trips, revenue and issues each evening" },
                { key: "incidentAlerts" as const,   label: "Incident alerts",    sub: "SOS, accidents and complaints, immediately" },
                { key: "complianceAlerts" as const, label: "Compliance alerts",  sub: "Failed inspections and expiring licences" },
                { key: "payoutAlerts" as const,     label: "Payout alerts",      sub: "When money lands in your account" },
            ].map((row, i) => (
                <div
                    key={row.key}
                    className="flex items-center gap-4 p-4"
                    style={{ borderTop: i === 0 ? undefined : "1px solid rgba(17,17,17,0.06)" }}
                >
                    <div className="flex-1 min-w-0">
                        <p className="font-sans font-semibold" style={{ color: "#111111" }}>{row.label}</p>
                        <p className="font-sans text-xs" style={{ color: "#8A8678" }}>{row.sub}</p>
                    </div>
                    <Toggle
                        label={row.label}
                        checked={n[row.key]}
                        onChange={(next) => {
                            updateOperator({ notifications: { ...n, [row.key]: next } });
                            toast(next ? `${row.label} on` : `${row.label} off`, "success");
                        }}
                    />
                </div>
            ))}
        </div>
    );
}

function SupportPanel() {
    const lines = [
        { icon: "call",  label: "Operator support line", sub: "043 000 0001 · 06:00 to 20:00", href: "tel:+27430000001" },
        { icon: "mail",  label: "Fleet office",          sub: "fleet@quallor.co.za",           href: "mailto:fleet@quallor.co.za" },
        { icon: "gavel", label: "Terms of Service",      sub: "Operator obligations",          href: "/terms" },
        { icon: "shield_lock", label: "Privacy Policy",  sub: "What we collect and why",       href: "/privacy" },
    ];
    return (
        <div className="rounded-[16px] overflow-hidden" style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(17,17,17,0.07)" }}>
            {lines.map((l, i) => (
                <a
                    key={l.label}
                    href={l.href}
                    className="flex items-center gap-4 p-4"
                    style={{ borderTop: i === 0 ? undefined : "1px solid rgba(17,17,17,0.06)" }}
                >
                    <div
                        className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: "#EEF1EA", color: "#111111" }}
                    >
                        <span className="material-symbols-outlined">{l.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-sans font-semibold" style={{ color: "#111111" }}>{l.label}</p>
                        <p className="font-sans text-xs" style={{ color: "#8A8678" }}>{l.sub}</p>
                    </div>
                    <span className="material-symbols-outlined flex-shrink-0" style={{ color: "#AEA89C" }}>chevron_right</span>
                </a>
            ))}
        </div>
    );
}

/* ══════════════════════ Console shell ══════════════════════ */
function OperatorConsoleContent() {
    const { user, logout } = useAuth();
    const { vehiclesForOperator } = useFleet();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>("dashboard");

    // Only this operator's vehicles, straight from the fleet register.
    const fleet = useMemo(
        () => vehiclesForOperator(user?.id ?? "", user?.companyName),
        [vehiclesForOperator, user?.id, user?.companyName]
    );

    function handleLogout() {
        logout();
        router.push("/");
    }

    const headerTitles: Record<Tab, string> = {
        dashboard: "Dashboard",
        fleet: "My Fleet",
        analytics: "Analytics",
        settings: "Settings",
    };

    return (
        <main className="min-h-screen flex flex-col" style={{ backgroundColor: "#FFFCF9" }}>
            <header
                className="sticky top-0 z-20 flex items-center justify-between px-4 py-3"
                style={{
                    backgroundColor: "rgba(255,255,255,0.96)",
                    borderBottom: "1px solid rgba(17,17,17,0.08)",
                    backdropFilter: "blur(12px)",
                }}
            >
                <div>
                    <h2 className="font-sans font-black text-base leading-tight" style={{ color: "#111111", letterSpacing: "-0.02em" }}>
                        {headerTitles[activeTab]}
                    </h2>
                    <p className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "#1D3686" }}>
                        {user?.companyName || "Operator Console"}
                    </p>
                </div>
                <button
                    onClick={() => setActiveTab("settings")}
                    aria-label="Notifications"
                    className="relative p-2 rounded-[10px]"
                    style={{ color: "#AEA89C" }}
                >
                    <span className="material-symbols-outlined">notifications</span>
                    <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#CDDFF6" }} />
                </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full pb-28">
                {activeTab === "dashboard" && <TabDashboard user={user} fleet={fleet} />}
                {activeTab === "fleet"     && <TabFleet user={user} fleet={fleet} />}
                {activeTab === "analytics" && <TabAnalytics fleet={fleet} />}
                {activeTab === "settings"  && <TabSettings user={user} fleet={fleet} onLogout={handleLogout} />}
            </div>

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
                                className="flex-1 flex flex-col items-center gap-0.5 py-1"
                            >
                                <div
                                    className="flex items-center justify-center w-12 h-8 rounded-[14px] transition-all duration-200"
                                    style={{ backgroundColor: isActive ? "#111111" : "transparent" }}
                                >
                                    <span
                                        className="material-symbols-outlined text-[22px]"
                                        style={{
                                            color: isActive ? "#CDDFF6" : "#AEA89C",
                                            fontVariationSettings: isActive ? "'FILL' 1, 'wght' 600" : "'FILL' 0, 'wght' 400",
                                        }}
                                    >
                                        {item.icon}
                                    </span>
                                </div>
                                <p
                                    className="font-mono text-[9px] font-bold uppercase tracking-widest"
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

export default function OperatorConsolePage() {
    return (
        <OperatorGate area="operator">
            <OperatorConsoleContent />
        </OperatorGate>
    );
}

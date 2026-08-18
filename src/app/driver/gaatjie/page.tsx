"use client";

/**
 * Gaatjie / Conductor Mode
 *
 * The screen used by the person riding alongside the driver, on the phone that
 * belongs to the taxi. Boarding is recorded against the booking itself rather
 * than in local component state, so the manifest survives a reload, matches what
 * the QR scanner records, and is still correct if the phone is handed over
 * mid-run.
 */

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useBooking, type BookingDetails } from "@/app/context/BookingContext";
import { useAuth } from "@/app/context/AuthContext";
import { useToast } from "@/components/Toast";
import AuthGuard from "@/components/AuthGuard";

const ROWS = ["A", "B", "C", "D"];
const COLS = [1, 2, 3, 4];
const TOTAL_SEATS = 14; // standard Quantum 16-seater minus driver and gaatjie

function GaatjieContent() {
    const router = useRouter();
    const { user } = useAuth();
    const { myBookings, setBoarded } = useBooking();
    const { toast } = useToast();

    const [activeTab, setActiveTab] = useState<"manifest" | "seats">("manifest");
    const [query, setQuery] = useState("");
    const [searchOpen, setSearchOpen] = useState(false);

    const today = new Date().toDateString();

    // Today's run on this taxi. Cancelled seats drop off the manifest.
    const todaysBookings = useMemo(
        () =>
            myBookings.filter(
                (b) => new Date(b.date).toDateString() === today && b.status !== "cancelled"
            ),
        [myBookings, today]
    );

    const appBookings = todaysBookings.filter((b) => !b.bookedByDriver);
    const walkUpBookings = todaysBookings.filter((b) => b.bookedByDriver);

    // Walk-ups are on board by definition, app bookings count once scanned or tapped.
    const boardedApp = appBookings.filter((b) => Boolean(b.boardedAt));
    const boardedCount = boardedApp.length + walkUpBookings.length;
    const fillPercent = Math.min(100, Math.round((boardedCount / TOTAL_SEATS) * 100));

    const visibleManifest = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return appBookings;
        return appBookings.filter((b) =>
            [b.passengerName, b.bookingId, b.seatNumber].join(" ").toLowerCase().includes(q)
        );
    }, [appBookings, query]);

    function toggleBoarded(b: BookingDetails) {
        const next = !b.boardedAt;
        setBoarded(b.bookingId, next);
        toast(
            next ? `${b.passengerName} boarded, seat ${b.seatNumber}` : `${b.passengerName} put back on the waiting list`,
            next ? "success" : "info"
        );
    }

    function boardEveryone() {
        const waiting = appBookings.filter((b) => !b.boardedAt);
        if (waiting.length === 0) {
            toast("Everyone on the manifest is already on board", "info");
            return;
        }
        waiting.forEach((b) => setBoarded(b.bookingId, true));
        toast(`${waiting.length} passenger${waiting.length === 1 ? "" : "s"} boarded`, "success");
    }

    function seatStatus(seatId: string): "boarded" | "booked" | "walkup" | "free" {
        const booking = todaysBookings.find((b) => b.seatNumber === seatId);
        if (!booking) return "free";
        if (booking.bookedByDriver) return "walkup";
        return booking.boardedAt ? "boarded" : "booked";
    }

    const routeFrom = todaysBookings[0]?.from ?? "Departure";
    const routeTo = todaysBookings[0]?.to ?? "Destination";
    const taxiId = user?.vehiclePlate ?? "Unassigned";

    return (
        <main className="h-screen w-full flex flex-col overflow-hidden bg-q-bg-page">
            {/* ── Header ── */}
            <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-q-stone-200 shadow-q-xs flex-shrink-0 z-10">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={() => router.back()}
                        aria-label="Go back"
                        className="w-9 h-9 flex items-center justify-center rounded-[10px] hover:bg-q-stone-100 transition-colors flex-shrink-0"
                    >
                        <span className="material-symbols-outlined text-q-stone-700 text-xl">arrow_back</span>
                    </button>
                    <div className="min-w-0">
                        <h1 className="font-sans text-base font-black leading-tight truncate" style={{ color: "#111111", letterSpacing: "-0.02em" }}>
                            Gaatjie Mode
                        </h1>
                        <p className="font-mono text-[10px] font-bold uppercase tracking-wider truncate" style={{ color: "#1D3686" }}>
                            Conductor · {taxiId}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                        onClick={() => { setSearchOpen(!searchOpen); if (searchOpen) setQuery(""); }}
                        aria-label={searchOpen ? "Close search" : "Search manifest"}
                        className="w-9 h-9 flex items-center justify-center rounded-[10px] transition-colors"
                        style={searchOpen ? { backgroundColor: "#111111", color: "#FFFFFF" } : { color: "#8A8678" }}
                    >
                        <span className="material-symbols-outlined text-xl">{searchOpen ? "close" : "search"}</span>
                    </button>
                    <div
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-sans text-xs font-bold"
                        style={fillPercent >= 90
                            ? { backgroundColor: "rgba(220,38,38,0.08)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.25)" }
                            : fillPercent >= 70
                            ? { backgroundColor: "rgba(217,119,6,0.08)", color: "#D97706", border: "1px solid rgba(217,119,6,0.25)" }
                            : { backgroundColor: "#E1EDF5", color: "#1D3686", border: "1px solid rgba(29,54,134,0.20)" }}
                    >
                        <span className="material-symbols-outlined text-sm">airline_seat_recline_normal</span>
                        {boardedCount}/{TOTAL_SEATS}
                    </div>
                </div>
            </header>

            {searchOpen && (
                <div className="px-4 py-2 bg-white border-b border-q-stone-200 flex-shrink-0">
                    <input
                        className="q-input w-full"
                        placeholder="Search passenger, reference or seat"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        aria-label="Search manifest"
                        autoFocus
                    />
                </div>
            )}

            {/* ── Route strip ── */}
            <div className="flex items-center gap-4 px-4 py-3 flex-shrink-0" style={{ backgroundColor: "#111111", color: "#FFFFFF" }}>
                <span className="material-symbols-outlined text-sm flex-shrink-0" style={{ color: "rgba(255,255,255,0.65)" }}>directions_bus</span>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="font-sans text-sm font-semibold truncate">{routeFrom}</span>
                    <span className="material-symbols-outlined text-base flex-shrink-0" style={{ color: "rgba(255,255,255,0.55)" }}>arrow_forward</span>
                    <span className="font-sans text-sm font-semibold truncate">{routeTo}</span>
                </div>
                <div className="text-right flex-shrink-0">
                    <p className="font-mono text-[10px] font-bold uppercase" style={{ color: "rgba(255,255,255,0.55)" }}>Boarded</p>
                    <p className="font-sans text-lg font-black leading-tight">{boardedCount}/{TOTAL_SEATS}</p>
                </div>
            </div>

            {/* ── Capacity bar ── */}
            <div className="px-4 pt-3 pb-1 bg-white border-b border-q-stone-200 flex-shrink-0">
                <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: "rgba(17,17,17,0.10)" }}>
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                            width: `${fillPercent}%`,
                            backgroundColor: fillPercent >= 90 ? "#DC2626" : fillPercent >= 70 ? "#D97706" : "#1D3686",
                        }}
                    />
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="flex border-b border-q-stone-200 bg-white flex-shrink-0">
                {(["manifest", "seats"] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className="flex-1 py-3 font-mono text-xs font-bold uppercase tracking-wider transition-colors"
                        style={activeTab === tab
                            ? { borderBottom: "2px solid #111111", color: "#111111" }
                            : { borderBottom: "2px solid transparent", color: "#AEA89C" }}
                    >
                        {tab === "manifest" ? "Passenger Manifest" : "Seat Map"}
                    </button>
                ))}
            </div>

            {/* ── Content ── */}
            <div className="flex-1 overflow-y-auto pb-28">

                {activeTab === "manifest" && (
                    <div className="px-4 pt-4 space-y-5">
                        {/* App bookings */}
                        <div>
                            <div className="flex items-center justify-between mb-3 gap-2">
                                <h2 className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: "#8A8678" }}>
                                    App Bookings
                                </h2>
                                <div className="flex items-center gap-2">
                                    <span className="font-sans text-xs font-bold" style={{ color: "#1D3686" }}>
                                        {boardedApp.length}/{appBookings.length} boarded
                                    </span>
                                    {appBookings.length > boardedApp.length && (
                                        <button
                                            onClick={boardEveryone}
                                            className="font-mono text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full"
                                            style={{ backgroundColor: "#EEF1EA", color: "#111111" }}
                                        >
                                            Board all
                                        </button>
                                    )}
                                </div>
                            </div>

                            {visibleManifest.length === 0 ? (
                                <div className="py-8 text-center">
                                    <span className="material-symbols-outlined text-4xl mb-2 block" style={{ color: "#CDDFF6" }}>
                                        {query ? "search_off" : "smartphone"}
                                    </span>
                                    <p className="font-sans text-sm" style={{ color: "#8A8678" }}>
                                        {query ? "Nobody on the manifest matches that search." : "No app bookings for this run yet."}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {visibleManifest.map((b) => {
                                        const isBoarded = Boolean(b.boardedAt);
                                        return (
                                            <div
                                                key={b.bookingId}
                                                className="flex items-center gap-3 p-3 rounded-[14px] transition-all"
                                                style={isBoarded
                                                    ? { backgroundColor: "rgba(22,163,74,0.07)", border: "1px solid rgba(22,163,74,0.28)" }
                                                    : { backgroundColor: "#FFFFFF", border: "1px solid rgba(17,17,17,0.08)" }}
                                            >
                                                <div
                                                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                                    style={isBoarded
                                                        ? { backgroundColor: "rgba(22,163,74,0.15)", color: "#16A34A" }
                                                        : { backgroundColor: "#EEF1EA", color: "#1D3686" }}
                                                >
                                                    <span className="material-symbols-outlined text-base">
                                                        {isBoarded ? "check_circle" : "person"}
                                                    </span>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <p
                                                        className="font-sans text-sm font-semibold truncate"
                                                        style={{ color: isBoarded ? "#15803D" : "#111111" }}
                                                    >
                                                        {b.passengerName}
                                                    </p>
                                                    <p className="font-mono text-[10px]" style={{ color: "#AEA89C" }}>
                                                        {b.bookingId}
                                                        {isBoarded && b.boardedAt &&
                                                            ` · ${new Date(b.boardedAt).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}`}
                                                    </p>
                                                </div>

                                                <div
                                                    className="w-10 h-10 rounded-[10px] flex items-center justify-center font-sans font-bold text-sm flex-shrink-0"
                                                    style={isBoarded
                                                        ? { backgroundColor: "#16A34A", color: "#FFFFFF" }
                                                        : { backgroundColor: "#E1EDF5", color: "#1D3686", border: "2px solid #1D3686" }}
                                                >
                                                    {b.seatNumber}
                                                </div>

                                                <button
                                                    onClick={() => toggleBoarded(b)}
                                                    className="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-[10px] font-sans text-xs font-bold transition-all active:scale-95"
                                                    style={isBoarded
                                                        ? { backgroundColor: "rgba(22,163,74,0.12)", color: "#16A34A", border: "1px solid rgba(22,163,74,0.25)" }
                                                        : { backgroundColor: "#111111", color: "#FFFFFF" }}
                                                >
                                                    <span className="material-symbols-outlined text-sm">
                                                        {isBoarded ? "undo" : "how_to_reg"}
                                                    </span>
                                                    {isBoarded ? "Undo" : "Board"}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Walk-ups */}
                        {walkUpBookings.length > 0 && (
                            <div>
                                <h2 className="font-mono text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "#8A8678" }}>
                                    Walk-Up Passengers
                                </h2>
                                <div className="space-y-2">
                                    {walkUpBookings.map((b) => (
                                        <div
                                            key={b.bookingId}
                                            className="flex items-center gap-3 p-3 rounded-[14px]"
                                            style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(17,17,17,0.08)" }}
                                        >
                                            <div
                                                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                                style={{ backgroundColor: "#E1EDF5", color: "#1D3686" }}
                                            >
                                                <span className="material-symbols-outlined text-base">person_add</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-sans text-sm font-semibold truncate" style={{ color: "#111111" }}>
                                                    {b.passengerName}
                                                </p>
                                                <p className="font-mono text-[10px]" style={{ color: "#AEA89C" }}>{b.bookingId}</p>
                                            </div>
                                            <div
                                                className="w-10 h-10 rounded-[10px] flex items-center justify-center font-sans font-bold text-sm flex-shrink-0"
                                                style={{ backgroundColor: "#CDDFF6", color: "#111111" }}
                                            >
                                                {b.seatNumber}
                                            </div>
                                            <span
                                                className="px-2.5 py-1 rounded-full font-mono text-[10px] font-bold uppercase flex-shrink-0"
                                                style={b.paymentMethod === "cash"
                                                    ? { backgroundColor: "rgba(22,163,74,0.12)", color: "#16A34A" }
                                                    : { backgroundColor: "rgba(29,54,134,0.10)", color: "#1D3686" }}
                                            >
                                                {b.paymentMethod ?? "cash"}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {todaysBookings.length === 0 && (
                            <div className="py-16 flex flex-col items-center text-center">
                                <span className="material-symbols-outlined text-5xl mb-3" style={{ color: "#CDDFF6" }}>groups</span>
                                <p className="font-sans font-bold mb-1" style={{ color: "#111111" }}>No passengers yet</p>
                                <p className="font-sans text-xs max-w-xs" style={{ color: "#8A8678", lineHeight: 1.6 }}>
                                    App bookings appear here automatically. Use Walk-Up to add passengers boarding with cash or card.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "seats" && (
                    <div className="px-4 pt-5">
                        {/* Legend */}
                        <div className="flex flex-wrap items-center gap-3 mb-5 font-sans text-xs font-semibold">
                            {[
                                { color: "#16A34A", border: "#16A34A", label: "Boarded", text: "#5C5A56" },
                                { color: "#E1EDF5", border: "#1D3686", label: "Awaiting", text: "#5C5A56" },
                                { color: "#CDDFF6", border: "#CDDFF6", label: "Walk-Up", text: "#5C5A56" },
                                { color: "#EEF1EA", border: "rgba(17,17,17,0.12)", label: "Free", text: "#AEA89C" },
                            ].map((l) => (
                                <div key={l.label} className="flex items-center gap-1.5">
                                    <div className="w-6 h-6 rounded-md" style={{ backgroundColor: l.color, border: `2px solid ${l.border}` }} />
                                    <span style={{ color: l.text }}>{l.label}</span>
                                </div>
                            ))}
                        </div>

                        <div
                            className="mb-4 py-2.5 rounded-[10px] text-center font-mono text-xs font-bold uppercase tracking-widest"
                            style={{ backgroundColor: "#EEF1EA", color: "#8A8678" }}
                        >
                            Front of Taxi · Driver
                        </div>

                        <div className="space-y-3">
                            {ROWS.map((row) => (
                                <div key={row} className="flex items-center gap-3">
                                    <span className="font-mono text-xs font-bold w-4 flex-shrink-0" style={{ color: "#AEA89C" }}>{row}</span>
                                    <div className="flex gap-3 flex-1">
                                        {COLS.map((col, idx) => {
                                            const seatId = `${row}${col}`;
                                            const status = seatStatus(seatId);
                                            const booking = todaysBookings.find((b) => b.seatNumber === seatId);

                                            const seatStyle =
                                                status === "boarded"
                                                    ? { backgroundColor: "#16A34A", borderColor: "#16A34A", color: "#FFFFFF" }
                                                    : status === "booked"
                                                    ? { backgroundColor: "#E1EDF5", borderColor: "#1D3686", color: "#1D3686" }
                                                    : status === "walkup"
                                                    ? { backgroundColor: "#CDDFF6", borderColor: "#CDDFF6", color: "#111111" }
                                                    : { backgroundColor: "#EEF1EA", borderColor: "rgba(17,17,17,0.10)", color: "#C7C4BB" };

                                            return (
                                                <React.Fragment key={col}>
                                                    {idx === 2 && <div className="w-5 flex-shrink-0" />}
                                                    <button
                                                        disabled={status === "free" || status === "walkup"}
                                                        onClick={() => booking && !booking.bookedByDriver && toggleBoarded(booking)}
                                                        title={booking ? `${booking.passengerName} · ${booking.bookingId}` : `Seat ${seatId} is free`}
                                                        className="flex-1 h-14 rounded-[10px] font-sans text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 active:scale-95"
                                                        style={{ ...seatStyle, borderWidth: 2, borderStyle: "solid", cursor: status === "booked" || status === "boarded" ? "pointer" : "default" }}
                                                    >
                                                        <span className="text-sm font-bold">{seatId}</span>
                                                        {status !== "free" && (
                                                            <span className="material-symbols-outlined text-[10px] leading-none">
                                                                {status === "boarded" ? "check_circle" : status === "walkup" ? "person_add" : "person"}
                                                            </span>
                                                        )}
                                                    </button>
                                                </React.Fragment>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Counts */}
                        <div className="mt-6 grid grid-cols-3 gap-3">
                            {[
                                { value: boardedApp.length + walkUpBookings.length, label: "Boarded", color: "#16A34A" },
                                { value: appBookings.length - boardedApp.length,    label: "Awaiting", color: "#1D3686" },
                                { value: Math.max(0, TOTAL_SEATS - boardedCount),   label: "Free Seats", color: "#8A8678" },
                            ].map((s) => (
                                <div key={s.label} className="q-card p-3 text-center">
                                    <p className="font-sans text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                                    <p className="font-mono text-[10px] font-bold uppercase mt-0.5" style={{ color: "#8A8678" }}>{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Fixed bottom actions ── */}
            <div
                className="fixed bottom-0 left-0 right-0 px-4 py-3 pb-6 flex gap-3 z-20"
                style={{ backgroundColor: "#FFFFFF", borderTop: "1px solid rgba(17,17,17,0.08)", boxShadow: "0 -8px 28px rgba(17,17,17,0.10)" }}
            >
                <Link
                    href="/driver/walk-up"
                    className="flex items-center justify-center gap-2 flex-1 py-3 rounded-[12px] font-sans font-semibold text-sm active:scale-95 transition-transform"
                    style={{ backgroundColor: "#EEF1EA", color: "#111111", border: "1px solid rgba(17,17,17,0.08)" }}
                >
                    <span className="material-symbols-outlined text-lg">person_add</span>
                    Add Walk-Up
                </Link>
                <Link
                    href="/driver/scan"
                    className="flex items-center justify-center gap-2 flex-1 py-3 rounded-[12px] font-sans font-bold text-sm active:scale-95 transition-transform"
                    style={{ backgroundColor: "#111111", color: "#FFFFFF" }}
                >
                    <span className="material-symbols-outlined text-lg">qr_code_scanner</span>
                    Scan Ticket
                </Link>
            </div>
        </main>
    );
}

export default function GaatjiePage() {
    return (
        <AuthGuard requiredRole="driver">
            <GaatjieContent />
        </AuthGuard>
    );
}

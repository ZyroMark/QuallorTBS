"use client";

/**
 * Gaatjie / Conductor Mode
 *
 * This screen is designed for the person riding alongside the driver -
 * the "gaatjie" - who manages passenger boarding using the Quallor-supplied
 * smartphone. Each taxi gets one device. The gaatjie uses this screen to:
 *   1. See all pre-booked passengers for the current run
 *   2. Confirm each passenger has boarded (tap to mark)
 *   3. Add walk-up passengers quickly
 *   4. Monitor seat capacity in real time
 */

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useBooking } from "@/app/context/BookingContext";
import { useAuth } from "@/app/context/AuthContext";
import AuthGuard from "@/components/AuthGuard";

const ROWS = ["A", "B", "C", "D"];
const COLS = [1, 2, 3, 4];
const TOTAL_SEATS = 14; // standard Quantum 16-seater minus driver + 1

function GaatjieContent() {
    const router = useRouter();
    const { user } = useAuth();
    const { myBookings } = useBooking();

    const [boardedIds, setBoardedIds] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<"manifest" | "seats">("manifest");

    const today = new Date().toDateString();

    // All bookings for today's run on this taxi
    const todaysBookings = myBookings.filter((b) => {
        const bDate = new Date(b.date).toDateString();
        return bDate === today;
    });

    const appBookings = todaysBookings.filter((b) => !b.bookedByDriver);
    const walkUpBookings = todaysBookings.filter((b) => b.bookedByDriver);

    const boardedCount = boardedIds.size + walkUpBookings.length;
    const fillPercent = Math.round((boardedCount / TOTAL_SEATS) * 100);

    // Seats occupied by confirmed bookings
    const bookedSeats = new Set(todaysBookings.map((b) => b.seatNumber).filter(Boolean));
    const boardedSeats = new Set(
        [...boardedIds]
            .map((id) => todaysBookings.find((b) => b.bookingId === id)?.seatNumber)
            .filter(Boolean)
    );

    function toggleBoarded(bookingId: string) {
        setBoardedIds((prev) => {
            const next = new Set(prev);
            if (next.has(bookingId)) next.delete(bookingId);
            else next.add(bookingId);
            return next;
        });
    }

    function seatStatus(seatId: string): "boarded" | "booked" | "walkup" | "free" {
        const booking = todaysBookings.find((b) => b.seatNumber === seatId);
        if (!booking) return "free";
        if (booking.bookedByDriver) return "walkup";
        if (boardedIds.has(booking.bookingId)) return "boarded";
        return "booked";
    }

    const routeFrom = todaysBookings[0]?.from ?? "Departure";
    const routeTo = todaysBookings[0]?.to ?? "Destination";
    const taxiId = user?.vehiclePlate ?? "-";

    return (
        <main className="h-screen w-full flex flex-col overflow-hidden bg-q-bg-page">
            {/* ── Header ─────────────────────────────────────────────── */}
            <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-q-stone-200 shadow-q-xs flex-shrink-0 z-10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="w-9 h-9 flex items-center justify-center rounded-[10px] hover:bg-q-stone-100 transition-colors"
                    >
                        <span className="material-symbols-outlined text-q-stone-700 text-xl">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="font-display text-base font-semibold text-q-stone-900 leading-tight">Gaatjie Mode</h1>
                        <p className="font-sans text-[10px] text-q-brown font-semibold uppercase tracking-wider">Conductor · {taxiId}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Capacity pill */}
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-sans text-xs font-bold ${
                        fillPercent >= 90
                            ? "bg-red-50 border-red-200 text-red-700"
                            : fillPercent >= 70
                            ? "bg-amber-50 border-amber-200 text-amber-700"
                            : "bg-q-brown-50 border-q-brown-200 text-q-brown"
                    }`}>
                        <span className="material-symbols-outlined text-sm">airline_seat_recline_normal</span>
                        {boardedCount}/{TOTAL_SEATS}
                    </div>
                </div>
            </header>

            {/* ── Route strip ────────────────────────────────────────── */}
            <div className="flex items-center gap-4 px-4 py-3 bg-q-brown text-white flex-shrink-0">
                <span className="material-symbols-outlined text-white/70 text-sm">directions_bus</span>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="font-sans text-sm font-semibold truncate">{routeFrom}</span>
                    <span className="material-symbols-outlined text-white/60 text-base">arrow_forward</span>
                    <span className="font-sans text-sm font-semibold truncate">{routeTo}</span>
                </div>
                <div className="text-right flex-shrink-0">
                    <p className="font-sans text-[10px] font-bold text-white/60 uppercase">Boarded</p>
                    <p className="font-display text-lg font-bold leading-tight">{boardedCount}/{TOTAL_SEATS}</p>
                </div>
            </div>

            {/* ── Capacity bar ────────────────────────────────────────── */}
            <div className="px-4 pt-3 pb-1 bg-white border-b border-q-stone-200 flex-shrink-0">
                <div className="h-2 w-full bg-q-stone-200 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${
                            fillPercent >= 90 ? "bg-red-500" : fillPercent >= 70 ? "bg-amber-500" : "bg-q-brown"
                        }`}
                        style={{ width: `${fillPercent}%` }}
                    />
                </div>
            </div>

            {/* ── Tab bar ─────────────────────────────────────────────── */}
            <div className="flex border-b border-q-stone-200 bg-white flex-shrink-0">
                {(["manifest", "seats"] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-3 font-sans text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                            activeTab === tab
                                ? "border-q-brown text-q-brown"
                                : "border-transparent text-q-stone-400 hover:text-q-stone-600"
                        }`}
                    >
                        {tab === "manifest" ? "Passenger Manifest" : "Seat Map"}
                    </button>
                ))}
            </div>

            {/* ── Content ─────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto pb-28">

                {/* ── MANIFEST TAB ─────────────────────────────────────── */}
                {activeTab === "manifest" && (
                    <div className="px-4 pt-4 space-y-5">

                        {/* App bookings */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-q-stone-500">
                                    App Bookings
                                </h2>
                                <span className="font-sans text-xs font-bold text-q-brown">
                                    {appBookings.filter((b) => boardedIds.has(b.bookingId)).length}/{appBookings.length} boarded
                                </span>
                            </div>

                            {appBookings.length === 0 ? (
                                <div className="py-8 text-center">
                                    <span className="material-symbols-outlined text-q-stone-300 text-4xl mb-2 block">smartphone</span>
                                    <p className="font-sans text-sm text-q-stone-400">No app bookings for this run yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {appBookings.map((b) => {
                                        const isBoarded = boardedIds.has(b.bookingId);
                                        return (
                                            <div
                                                key={b.bookingId}
                                                className={`flex items-center gap-3 p-3 rounded-[14px] border transition-all ${
                                                    isBoarded
                                                        ? "bg-green-50 border-green-200"
                                                        : "bg-white border-q-stone-200"
                                                }`}
                                            >
                                                {/* Avatar */}
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                    isBoarded ? "bg-green-100 text-green-600" : "bg-q-brown-100 text-q-brown"
                                                }`}>
                                                    <span className="material-symbols-outlined text-base">
                                                        {isBoarded ? "check_circle" : "person"}
                                                    </span>
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <p className={`font-sans text-sm font-semibold truncate ${isBoarded ? "text-green-800" : "text-q-stone-900"}`}>
                                                        {b.passengerName}
                                                    </p>
                                                    <p className="font-sans text-[10px] font-mono text-q-stone-400">{b.bookingId}</p>
                                                </div>

                                                {/* Seat */}
                                                <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center border-2 font-display font-bold text-sm flex-shrink-0 ${
                                                    isBoarded
                                                        ? "bg-green-600 border-green-600 text-white"
                                                        : "bg-q-brown-100 border-q-brown text-q-brown"
                                                }`}>
                                                    {b.seatNumber}
                                                </div>

                                                {/* Board / Unboard toggle */}
                                                <button
                                                    onClick={() => toggleBoarded(b.bookingId)}
                                                    className={`flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-[10px] font-sans text-xs font-bold transition-all active:scale-95 ${
                                                        isBoarded
                                                            ? "bg-green-100 text-green-700 border border-green-200"
                                                            : "bg-q-brown text-white shadow-q-sm"
                                                    }`}
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

                        {/* Walk-up passengers */}
                        {walkUpBookings.length > 0 && (
                            <div>
                                <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-q-stone-500 mb-3">
                                    Walk-Up Passengers
                                </h2>
                                <div className="space-y-2">
                                    {walkUpBookings.map((b) => (
                                        <div
                                            key={b.bookingId}
                                            className="flex items-center gap-3 p-3 rounded-[14px] bg-white border border-q-stone-200"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                                                <span className="material-symbols-outlined text-blue-600 text-base">person_add</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-sans text-sm font-semibold text-q-stone-900 truncate">
                                                    {b.passengerName}
                                                </p>
                                                <p className="font-sans text-[10px] font-mono text-q-stone-400">{b.bookingId}</p>
                                            </div>
                                            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center bg-blue-50 border-2 border-blue-200 font-display font-bold text-sm text-blue-600 flex-shrink-0">
                                                {b.seatNumber}
                                            </div>
                                            <span className={`px-2 py-1 rounded-full font-sans text-[9px] font-bold uppercase flex-shrink-0 ${
                                                b.paymentMethod === "cash"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-blue-100 text-blue-700"
                                            }`}>
                                                {b.paymentMethod ?? "cash"}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {todaysBookings.length === 0 && (
                            <div className="py-16 flex flex-col items-center text-center">
                                <span className="material-symbols-outlined text-q-stone-300 text-5xl mb-3">groups</span>
                                <p className="font-sans font-semibold text-q-stone-500 mb-1">No passengers yet</p>
                                <p className="font-sans text-xs text-q-stone-400 max-w-xs">
                                    App bookings will appear here automatically. Use Walk-Up to add passengers boarding with cash or card.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── SEAT MAP TAB ──────────────────────────────────────── */}
                {activeTab === "seats" && (
                    <div className="px-4 pt-5">
                        {/* Legend */}
                        <div className="flex flex-wrap items-center gap-3 mb-5 font-sans text-xs font-semibold">
                            <div className="flex items-center gap-1.5">
                                <div className="w-6 h-6 rounded-md bg-green-500" />
                                <span className="text-q-stone-600">Boarded</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-6 h-6 rounded-md bg-q-brown-100 border-2 border-q-brown" />
                                <span className="text-q-stone-600">Awaiting</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-6 h-6 rounded-md bg-blue-100 border-2 border-blue-300" />
                                <span className="text-q-stone-600">Walk-Up</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-6 h-6 rounded-md bg-q-stone-100 border-2 border-q-stone-200" />
                                <span className="text-q-stone-400">Free</span>
                            </div>
                        </div>

                        <div className="mb-4 py-2.5 rounded-[10px] bg-q-stone-100 text-center font-sans text-xs font-bold uppercase tracking-widest text-q-stone-500">
                            Front of Taxi · Driver
                        </div>

                        <div className="space-y-3">
                            {ROWS.map((row) => (
                                <div key={row} className="flex items-center gap-3">
                                    <span className="font-sans text-xs font-bold text-q-stone-400 w-4">{row}</span>
                                    <div className="flex gap-3 flex-1">
                                        {COLS.map((col, idx) => {
                                            const seatId = `${row}${col}`;
                                            const status = seatStatus(seatId);
                                            const booking = todaysBookings.find((b) => b.seatNumber === seatId);

                                            return (
                                                <React.Fragment key={col}>
                                                    {idx === 2 && <div className="w-5" />}
                                                    <button
                                                        disabled={status === "free"}
                                                        onClick={() => {
                                                            if (booking && !booking.bookedByDriver) {
                                                                toggleBoarded(booking.bookingId);
                                                            }
                                                        }}
                                                        className={`flex-1 h-14 rounded-[10px] font-sans text-xs font-bold border-2 transition-all flex flex-col items-center justify-center gap-0.5 active:scale-95 ${
                                                            status === "boarded"
                                                                ? "bg-green-500 border-green-500 text-white shadow-q-sm"
                                                                : status === "booked"
                                                                ? "bg-q-brown-100 border-q-brown text-q-brown"
                                                                : status === "walkup"
                                                                ? "bg-blue-50 border-blue-300 text-blue-600"
                                                                : "bg-q-stone-100 border-q-stone-200 text-q-stone-300 cursor-default"
                                                        }`}
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

                        {/* Counts summary */}
                        <div className="mt-6 grid grid-cols-3 gap-3">
                            <div className="q-card p-3 text-center">
                                <p className="font-display text-2xl font-bold text-green-600">{boardedIds.size}</p>
                                <p className="font-sans text-[10px] font-bold text-q-stone-500 uppercase mt-0.5">Boarded</p>
                            </div>
                            <div className="q-card p-3 text-center">
                                <p className="font-display text-2xl font-bold text-q-brown">{appBookings.length - boardedIds.size}</p>
                                <p className="font-sans text-[10px] font-bold text-q-stone-500 uppercase mt-0.5">Awaiting</p>
                            </div>
                            <div className="q-card p-3 text-center">
                                <p className="font-display text-2xl font-bold text-q-stone-500">{TOTAL_SEATS - boardedCount}</p>
                                <p className="font-sans text-[10px] font-bold text-q-stone-500 uppercase mt-0.5">Free Seats</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Fixed bottom actions ─────────────────────────────────── */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-q-stone-200 px-4 py-3 pb-6 shadow-q-lg flex gap-3 z-20">
                <Link
                    href="/driver/walk-up"
                    className="flex items-center justify-center gap-2 flex-1 py-3 rounded-[12px] bg-q-stone-100 text-q-stone-700 font-sans font-semibold text-sm border border-q-stone-200 active:scale-95 transition-transform"
                >
                    <span className="material-symbols-outlined text-lg">person_add</span>
                    Add Walk-Up
                </Link>
                <Link
                    href="/driver/scan"
                    className="flex items-center justify-center gap-2 flex-1 py-3 rounded-[12px] bg-q-brown text-white font-sans font-bold text-sm shadow-q-cta active:scale-95 transition-transform"
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

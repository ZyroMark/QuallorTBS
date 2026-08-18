"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useAuth } from "@/app/context/AuthContext";
import { useBooking } from "@/app/context/BookingContext";
import { useFleet } from "@/app/context/FleetContext";
import { useToast } from "@/components/Toast";
import AuthGuard from "@/components/AuthGuard";
import { coordsFor } from "@/lib/places";

// Leaflet needs window, so the map panel is client-only.
const MiniMap = dynamic(() => import("@/components/MiniMap"), { ssr: false });

function DriverDashboardContent() {
    const { user, logout } = useAuth();
    const { myBookings } = useBooking();
    const { vehicleForDriver, blockingReason } = useFleet();
    const { toast } = useToast();
    const router = useRouter();
    const [isOnline, setIsOnline] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("driver_online_status") !== "false";
        }
        return true;
    });

    // The driver's vehicle as the fleet office sees it. If the fleet manager
    // suspends it or an inspection fails, that lands here and the driver cannot
    // go online until it is cleared.
    const vehicle = vehicleForDriver(user?.id, user?.vehiclePlate);
    const blocked = vehicle ? blockingReason(vehicle) : null;
    const noVehicle = !vehicle;
    const canGoOnline = Boolean(vehicle) && !blocked;

    useEffect(() => {
        localStorage.setItem("driver_online_status", String(isOnline));
    }, [isOnline]);

    // Being taken off the road forces the driver offline straight away.
    useEffect(() => {
        if (!canGoOnline && isOnline) setIsOnline(false);
    }, [canGoOnline, isOnline]);

    function handleLogout() {
        logout();
        router.push("/");
    }

    const earnings = user?.driverEarnings ?? 0;
    const today = new Date().toDateString();
    const todaysPassengers = myBookings.filter((b) => {
        const bDate = new Date(b.date).toDateString();
        return bDate === today && (b.taxiId === user?.vehiclePlate || b.bookedByDriver);
    });

    // Centre the map on the first pickup of the day, otherwise on East London.
    const homeCoords = coordsFor(todaysPassengers[0]?.from ?? "East London");

    return (
        <main className="h-screen w-full flex flex-col overflow-hidden" style={{ backgroundColor: "#FFFCF9" }}>

            {/* ── Header ── */}
            <header
                className="z-20 flex items-center justify-between px-4 py-3"
                style={{
                    backgroundColor: "#FFFFFF",
                    borderBottom: "1px solid rgba(17,17,17,0.08)",
                    boxShadow: "0 1px 12px rgba(17,17,17,0.06)",
                }}
            >
                <div className="flex items-center gap-3">
                    <div>
                        <p
                            className="font-sans font-bold text-sm leading-tight"
                            style={{ color: "#111111", letterSpacing: "-0.01em" }}
                        >
                            {user?.name || "Quallor Driver"}
                        </p>
                        <button
                            onClick={() => {
                                if (!canGoOnline) {
                                    toast(blocked ?? "No vehicle is assigned to you yet", "error");
                                    return;
                                }
                                setIsOnline(!isOnline);
                            }}
                            className="flex items-center gap-1.5"
                        >
                            <span
                                className={`w-2 h-2 rounded-full ${isOnline ? "animate-pulse" : ""}`}
                                style={{ backgroundColor: isOnline ? "#16A34A" : canGoOnline ? "#AEA89C" : "#DC2626" }}
                            />
                            <span
                                className="font-sans text-[10px] font-bold uppercase tracking-wider"
                                style={{ color: isOnline ? "#16A34A" : canGoOnline ? "#AEA89C" : "#DC2626" }}
                            >
                                {isOnline ? "Online" : canGoOnline ? "Offline" : "Off the road"}
                            </span>
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div
                        className="px-4 py-2 rounded-[10px] text-right"
                        style={{ backgroundColor: "#CDDFF6" }}
                    >
                        <p className="font-sans text-[9px] font-bold uppercase tracking-wider" style={{ color: "rgba(17,17,17,0.55)" }}>
                            Today&apos;s Earnings
                        </p>
                        <p
                            className="font-sans font-black text-base leading-none"
                            style={{ color: "#111111", letterSpacing: "-0.02em" }}
                        >
                            R {earnings > 0 ? earnings.toFixed(2) : "0.00"}
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-9 h-9 flex items-center justify-center rounded-[10px] transition-colors"
                        style={{ color: "#AEA89C", border: "1px solid rgba(17,17,17,0.09)" }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(220,38,38,0.07)";
                            (e.currentTarget as HTMLElement).style.color = "#DC2626";
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.backgroundColor = "";
                            (e.currentTarget as HTMLElement).style.color = "#AEA89C";
                        }}
                    >
                        <span className="material-symbols-outlined">logout</span>
                    </button>
                </div>
            </header>

            {/* ── Compliance banner from the fleet office ── */}
            {(blocked || noVehicle) && (
                <div
                    className="flex items-start gap-3 px-4 py-3 flex-shrink-0"
                    style={{ backgroundColor: "rgba(220,38,38,0.08)", borderBottom: "1px solid rgba(220,38,38,0.20)" }}
                >
                    <span className="material-symbols-outlined flex-shrink-0" style={{ color: "#DC2626" }}>block</span>
                    <div className="flex-1 min-w-0">
                        <p className="font-sans font-bold text-sm" style={{ color: "#DC2626" }}>
                            {noVehicle ? "No vehicle assigned to you" : `${vehicle?.plate} is off the road`}
                        </p>
                        <p className="font-sans text-xs mt-0.5" style={{ color: "rgba(17,17,17,0.72)", lineHeight: 1.5 }}>
                            {noVehicle
                                ? "The fleet office needs to register and verify your taxi before you can carry passengers."
                                : `${blocked?.replace(/\.?$/, ".")} Contact the Quallor fleet office once it is corrected.`}
                        </p>
                    </div>
                </div>
            )}

            {/* ── Map area ── */}
            <div className="relative flex-1">
                <MiniMap center={homeCoords} zoom={13} interactive />

                {/* Top action buttons */}
                <div className="absolute top-4 left-4 right-4 z-[500] flex gap-2">
                    <Link
                        href="/driver/scan"
                        className="flex items-center justify-center gap-2 flex-1 py-3 px-4 rounded-[9999px] font-sans font-bold text-sm active:scale-95 transition-all"
                        style={{
                            backgroundColor: "#111111",
                            color: "#FFFFFF",
                            boxShadow: "0 4px 16px rgba(17,17,17,0.30)",
                        }}
                    >
                        <span className="material-symbols-outlined text-lg">qr_code_scanner</span>
                        Scan to Board
                    </Link>
                    <Link
                        href="/driver/walk-up"
                        className="flex items-center justify-center gap-2 py-3 px-4 rounded-[9999px] font-sans font-bold text-sm active:scale-95 transition-all"
                        style={{
                            backgroundColor: "#CDDFF6",
                            color: "#111111",
                            boxShadow: "0 4px 16px rgba(29, 54, 134,0.40)",
                        }}
                    >
                        <span className="material-symbols-outlined text-lg">person_add</span>
                        Walk-Up
                    </Link>
                </div>

                {/* Driver pin, drawn over the map centre */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-[500] pointer-events-none">
                    <div className="relative">
                        <div
                            className="absolute -inset-4 rounded-full animate-ping"
                            style={{ backgroundColor: "rgba(29, 54, 134,0.25)" }}
                        />
                        <div
                            className="relative w-10 h-10 rounded-full flex items-center justify-center"
                            style={{
                                background: "#CDDFF6",
                                boxShadow: "0 4px 20px rgba(29, 54, 134,0.50)",
                            }}
                        >
                            <span className="material-symbols-outlined" style={{ color: "#111111" }}>person_pin_circle</span>
                        </div>
                    </div>
                    <div
                        className="mt-2 rounded-full px-3 py-1.5"
                        style={{
                            backgroundColor: "rgba(255,255,255,0.92)",
                            backdropFilter: "blur(8px)",
                            boxShadow: "0 2px 12px rgba(17,17,17,0.15)",
                        }}
                    >
                        <p className="font-sans text-[10px] font-bold uppercase whitespace-nowrap" style={{ color: "#111111" }}>
                            {user?.vehiclePlate || "Pickup: 1.2 KM"}
                        </p>
                    </div>
                </div>

                {/* Gaatjie shortcut */}
                <div className="absolute right-4 bottom-4 z-[500]">
                    <Link
                        href="/driver/gaatjie"
                        className="flex items-center gap-2 px-4 py-3 rounded-full font-sans font-bold text-sm active:scale-95 transition-transform"
                        style={{ backgroundColor: "#FFFFFF", color: "#111111", boxShadow: "0 4px 16px rgba(17,17,17,0.22)" }}
                    >
                        <span className="material-symbols-outlined text-lg">groups</span>
                        Gaatjie Mode
                    </Link>
                </div>
            </div>

            {/* ── Bottom drawer ── */}
            <section
                className="z-30 flex flex-col overflow-hidden max-h-[45vh]"
                style={{
                    backgroundColor: "#FFFFFF",
                    borderTop: "1px solid rgba(17,17,17,0.08)",
                    borderRadius: "20px 20px 0 0",
                    boxShadow: "0 -8px 32px rgba(17,17,17,0.12)",
                }}
            >
                <div className="flex justify-center py-3 flex-shrink-0">
                    <div className="w-12 h-1.5 rounded-full" style={{ backgroundColor: "rgba(17,17,17,0.12)" }} />
                </div>

                {todaysPassengers.length > 0 ? (
                    <div className="overflow-y-auto px-4 pb-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3
                                className="font-sans text-xs font-bold uppercase tracking-widest"
                                style={{ color: "#8A8678" }}
                            >
                                Today&apos;s Passengers
                            </h3>
                            <span
                                className="font-sans text-xs font-bold px-3 py-1 rounded-full"
                                style={{ backgroundColor: "#CDDFF6", color: "#111111" }}
                            >
                                {todaysPassengers.length} booked
                            </span>
                        </div>
                        <div className="space-y-2">
                            {todaysPassengers.map((b) => (
                                <div
                                    key={b.bookingId}
                                    className="flex items-center gap-3 p-3 rounded-[12px]"
                                    style={{
                                        backgroundColor: "#FFFCF9",
                                        border: "1px solid rgba(17,17,17,0.06)",
                                    }}
                                >
                                    <div
                                        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                                        style={{
                                            backgroundColor: b.bookedByDriver ? "rgba(22,163,74,0.12)" : "#EEF1EA",
                                            color: b.bookedByDriver ? "#16A34A" : "#5C5A56",
                                        }}
                                    >
                                        <span className="material-symbols-outlined text-sm">
                                            {b.bookedByDriver ? "person_add" : "smartphone"}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p
                                            className="font-sans text-sm font-bold truncate"
                                            style={{ color: "#111111" }}
                                        >
                                            {b.passengerName}
                                        </p>
                                        <p className="font-sans text-[10px] font-mono" style={{ color: "#AEA89C" }}>
                                            {b.bookingId}
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="font-sans text-xs font-bold" style={{ color: "#111111" }}>
                                            Seat {b.seatNumber}
                                        </p>
                                        {b.bookedByDriver && (
                                            <span
                                                className="font-sans text-[9px] font-bold uppercase px-2 py-0.5 rounded-full"
                                                style={
                                                    b.paymentMethod === "cash"
                                                        ? { backgroundColor: "rgba(22,163,74,0.12)", color: "#16A34A" }
                                                        : { backgroundColor: "rgba(37,99,235,0.10)", color: "#1D3686" }
                                                }
                                            >
                                                {b.paymentMethod || "cash"}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="overflow-y-auto">
                        <div className="px-6 pb-2 flex items-center justify-between">
                            <div>
                                <h3
                                    className="font-sans font-black text-lg"
                                    style={{ color: "#111111", letterSpacing: "-0.02em" }}
                                >
                                    Ready to go
                                </h3>
                                <p className="font-sans text-sm" style={{ color: "#8A8678" }}>
                                    No passengers booked yet today.
                                </p>
                            </div>
                            <div
                                className="w-12 h-12 flex items-center justify-center rounded-full flex-shrink-0"
                                style={{ backgroundColor: "#EEF1EA" }}
                            >
                                <span className="material-symbols-outlined" style={{ color: "#5C5A56" }}>groups</span>
                            </div>
                        </div>

                        {/* Quick actions */}
                        <div className="px-4 pb-4 grid grid-cols-3 gap-2.5 mt-3">
                            {[
                                { icon: "explore",         label: "Gaatjie",      href: "/driver/gaatjie" },
                                { icon: "qr_code_scanner", label: "Scan",         href: "/driver/scan" },
                                { icon: "person",          label: "Profile",      href: "/profile" },
                            ].map((action) => (
                                <Link
                                    key={action.label}
                                    href={action.href}
                                    className="flex flex-col items-center gap-1.5 py-4 rounded-[14px] transition-all active:scale-95"
                                    style={{ backgroundColor: "#FFFCF9", border: "1px solid rgba(17,17,17,0.07)" }}
                                    onMouseEnter={(e) => {
                                        (e.currentTarget as HTMLElement).style.backgroundColor = "#EEF1EA";
                                    }}
                                    onMouseLeave={(e) => {
                                        (e.currentTarget as HTMLElement).style.backgroundColor = "#FFFCF9";
                                    }}
                                >
                                    <span className="material-symbols-outlined text-2xl" style={{ color: "#111111" }}>
                                        {action.icon}
                                    </span>
                                    <span className="font-sans text-xs font-bold" style={{ color: "#5C5A56" }}>
                                        {action.label}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}

export default function DriverDashboardPage() {
    return (
        <AuthGuard requiredRole="driver">
            <DriverDashboardContent />
        </AuthGuard>
    );
}

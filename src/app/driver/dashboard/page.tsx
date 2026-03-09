"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { useBooking } from "@/app/context/BookingContext";
import AuthGuard from "@/components/AuthGuard";

function DriverDashboardContent() {
    const { user, logout } = useAuth();
    const { myBookings } = useBooking();
    const router = useRouter();
    const [isOnline, setIsOnline] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("driver_online_status") !== "false";
        }
        return true;
    });

    useEffect(() => {
        localStorage.setItem("driver_online_status", String(isOnline));
    }, [isOnline]);

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

    const initials = user?.name
        ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
        : "DV";

    return (
        <main className="h-screen w-full flex flex-col overflow-hidden">
            {/* Header */}
            <header className="z-20 flex items-center justify-between px-4 py-3 bg-white border-b border-q-stone-200 shadow-q-xs">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-q-brown flex items-center justify-center flex-shrink-0">
                        <span className="font-display font-bold text-white text-base">{initials}</span>
                    </div>
                    <div>
                        <p className="font-sans text-sm font-semibold text-q-stone-900 leading-tight">{user?.name || "Quallor Driver"}</p>
                        <button onClick={() => setIsOnline(!isOnline)} className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-q-stone-400"}`} />
                            <span className={`font-sans text-[10px] font-bold uppercase tracking-wider ${isOnline ? "text-green-600" : "text-q-stone-500"}`}>
                                {isOnline ? "Online" : "Offline"}
                            </span>
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="font-sans text-[10px] font-bold text-q-stone-500 uppercase tracking-wider">Today&apos;s Earnings</p>
                        <p className="font-display text-lg font-bold text-q-brown">R {earnings > 0 ? earnings.toFixed(2) : "0.00"}</p>
                    </div>
                    <button onClick={handleLogout} className="w-9 h-9 flex items-center justify-center rounded-[10px] hover:bg-q-stone-100 transition-colors">
                        <span className="material-symbols-outlined text-q-stone-500">logout</span>
                    </button>
                </div>
            </header>

            {/* Map area */}
            <div
                className="relative flex-1 bg-cover bg-center"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1000')" }}
            >
                <div className="absolute inset-0 bg-q-stone-900/30" />

                {/* Top action buttons */}
                <div className="absolute top-4 left-4 right-4 z-10 flex gap-2">
                    <Link
                        href="/driver/scan"
                        className="flex items-center justify-center gap-2 flex-1 py-3 px-4 rounded-[12px] bg-q-brown text-white font-sans font-bold text-sm shadow-q-cta active:scale-95 transition-transform"
                    >
                        <span className="material-symbols-outlined text-lg">qr_code_scanner</span>
                        Scan to Board
                    </Link>
                    <Link
                        href="/driver/walk-up"
                        className="flex items-center justify-center gap-2 py-3 px-4 rounded-[12px] bg-white/90 border border-q-stone-200 text-q-brown font-sans font-bold text-sm shadow-q-sm active:scale-95 transition-transform"
                    >
                        <span className="material-symbols-outlined text-lg">person_add</span>
                        Walk-Up
                    </Link>
                </div>

                {/* Driver pin */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="relative">
                        <div className="absolute -inset-4 rounded-full bg-q-brown/20 animate-ping" />
                        <div className="relative w-10 h-10 rounded-full bg-q-brown flex items-center justify-center shadow-q-md">
                            <span className="material-symbols-outlined text-white">person_pin_circle</span>
                        </div>
                    </div>
                    <div className="mt-2 rounded-full bg-white/90 px-3 py-1.5 shadow-q-sm">
                        <p className="font-sans text-[10px] font-bold text-q-stone-900 whitespace-nowrap uppercase">
                            {user?.vehiclePlate || "Pickup: 1.2 KM"}
                        </p>
                    </div>
                </div>

                {/* Map controls */}
                <div className="absolute right-4 top-20 flex flex-col gap-2">
                    <button className="w-11 h-11 flex items-center justify-center rounded-[10px] bg-white border border-q-stone-200 shadow-q-sm text-q-stone-700">
                        <span className="material-symbols-outlined">add</span>
                    </button>
                    <button className="w-11 h-11 flex items-center justify-center rounded-[10px] bg-white border border-q-stone-200 shadow-q-sm text-q-stone-700">
                        <span className="material-symbols-outlined">remove</span>
                    </button>
                    <button className="mt-4 w-11 h-11 flex items-center justify-center rounded-[10px] bg-q-brown text-white shadow-q-md">
                        <span className="material-symbols-outlined">navigation</span>
                    </button>
                </div>
            </div>

            {/* Bottom drawer */}
            <section className="z-30 flex flex-col bg-white border-t border-q-stone-200 rounded-t-[20px] shadow-q-xl overflow-hidden max-h-[45vh]">
                <div className="flex justify-center py-3 flex-shrink-0">
                    <div className="w-12 h-1.5 rounded-full bg-q-stone-200" />
                </div>

                {todaysPassengers.length > 0 ? (
                    <div className="overflow-y-auto px-4 pb-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-q-stone-500">Today&apos;s Passengers</h3>
                            <span className="font-sans text-xs font-bold text-q-brown">{todaysPassengers.length} booked</span>
                        </div>
                        <div className="space-y-2">
                            {todaysPassengers.map((b) => (
                                <div key={b.bookingId} className="flex items-center gap-3 p-3 rounded-[12px] bg-q-stone-50 border border-q-stone-200">
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${b.bookedByDriver ? "bg-green-100 text-green-600" : "bg-q-brown-100 text-q-brown"}`}>
                                        <span className="material-symbols-outlined text-sm">
                                            {b.bookedByDriver ? "person_add" : "smartphone"}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-sans text-sm font-semibold text-q-stone-900 truncate">{b.passengerName}</p>
                                        <p className="font-sans text-[10px] text-q-stone-400 font-mono">{b.bookingId}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="font-sans text-xs font-bold text-q-brown">Seat {b.seatNumber}</p>
                                        {b.bookedByDriver && (
                                            <span className={`font-sans text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${b.paymentMethod === "cash" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
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
                        <div className="px-6 pb-2 flex items-center justify-between text-left">
                            <div>
                                <span className="inline-block px-2 py-0.5 rounded-full bg-q-brown-100 text-q-brown text-[10px] font-bold uppercase mb-1 tracking-wider">New Request</span>
                                <h2 className="font-display text-xl font-semibold text-q-stone-900">Thembeka M.</h2>
                                <div className="flex items-center gap-1 mt-0.5">
                                    <span className="material-symbols-outlined text-q-brown text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                    <span className="font-sans text-sm text-q-stone-500">4.9 · 2.4 km away</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-sans text-[10px] font-bold text-q-stone-500 uppercase">Estimated Fare</p>
                                <p className="font-display text-2xl font-bold text-q-brown">R 145.50</p>
                            </div>
                        </div>
                        <div className="mt-4 px-6 space-y-3 text-left">
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-q-brown mt-1">location_on</span>
                                <div>
                                    <p className="font-sans text-xs text-q-stone-500">Pickup</p>
                                    <p className="font-sans text-sm font-semibold text-q-stone-900">Beacon Bay Retail Park</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-q-stone-400 mt-1">flag</span>
                                <div>
                                    <p className="font-sans text-xs text-q-stone-500">Dropoff</p>
                                    <p className="font-sans text-sm font-semibold text-q-stone-900">Amalinda Main Road</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 px-6 pb-4 grid grid-cols-2 gap-3">
                            <button className="flex h-14 items-center justify-center gap-2 rounded-[12px] bg-q-stone-100 font-sans font-semibold text-q-stone-700 active:scale-95 transition-transform">
                                <span className="material-symbols-outlined text-lg">close</span>
                                Decline
                            </button>
                            <button className="flex h-14 items-center justify-center gap-2 rounded-[12px] bg-q-brown text-white font-sans font-bold shadow-q-cta active:scale-95 transition-transform">
                                <span className="material-symbols-outlined text-lg">electric_car</span>
                                Accept Ride
                            </button>
                        </div>
                    </div>
                )}
            </section>

            {/* Bottom Nav */}
            <nav className="flex h-20 w-full border-t border-q-stone-200 bg-white px-4 pb-4 pt-2 flex-shrink-0">
                <Link href="/driver/dashboard" className="flex flex-1 flex-col items-center justify-center gap-1 text-q-brown">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>explore</span>
                    <p className="font-sans text-[10px] font-bold uppercase tracking-tighter">Navigate</p>
                </Link>
                <Link href="/driver/scan" className="flex flex-1 flex-col items-center justify-center gap-1 text-q-stone-400">
                    <span className="material-symbols-outlined">qr_code_scanner</span>
                    <p className="font-sans text-[10px] font-bold uppercase tracking-tighter">Scan</p>
                </Link>
                <Link href="/driver/walk-up" className="flex flex-1 flex-col items-center justify-center gap-1 text-q-stone-400">
                    <span className="material-symbols-outlined">person_add</span>
                    <p className="font-sans text-[10px] font-bold uppercase tracking-tighter">Walk-Up</p>
                </Link>
                <Link href="/profile" className="flex flex-1 flex-col items-center justify-center gap-1 text-q-stone-400">
                    <span className="material-symbols-outlined">person</span>
                    <p className="font-sans text-[10px] font-bold uppercase tracking-tighter">Account</p>
                </Link>
            </nav>
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

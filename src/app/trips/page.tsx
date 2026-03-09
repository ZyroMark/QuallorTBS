"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/app/context/BookingContext";
import AppLayout from "@/components/layout/AppLayout";

export default function TripsPage() {
    const router = useRouter();
    const { myBookings } = useBooking();
    const [tab, setTab] = useState("recent");

    return (
        <AppLayout>
            <div className="q-container max-w-2xl py-8 pb-24">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="font-display text-3xl font-semibold text-q-stone-900">Ride History</h1>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-q-stone-100 rounded-[12px] mb-6">
                    {["recent", "scheduled"].map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`flex-1 py-2 rounded-[10px] font-sans text-sm font-semibold transition-all duration-200 capitalize ${
                                tab === t ? "bg-white text-q-stone-900 shadow-q-xs" : "text-q-stone-500 hover:text-q-stone-700"
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {tab === "recent" ? (
                    myBookings.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <span className="material-symbols-outlined text-6xl mb-4 text-q-brown-200">confirmation_number</span>
                            <h3 className="font-display text-xl font-semibold text-q-stone-900 mb-2">No trips yet</h3>
                            <p className="q-caption mb-6">Book your first ride and it will appear here</p>
                            <button onClick={() => router.push("/commute")} className="q-btn-primary">
                                Book Your First Ride
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {myBookings.map((booking, i) => (
                                <div
                                    key={booking.bookingId}
                                    className={`q-card overflow-hidden ${i === 0 ? "border-q-brown shadow-q-md" : ""}`}
                                >
                                    {i === 0 && (
                                        <div
                                            className="relative h-40 w-full bg-cover bg-center"
                                            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1000&auto=format&fit=crop')" }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-t from-q-stone-900/60 to-transparent" />
                                            <div className="absolute bottom-3 left-4">
                                                <span className="bg-q-brown text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                    {booking.tripType === "hiking" ? "Long Distance" : "Local Commute"}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-4 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-[12px] bg-q-brown-100 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-q-brown">directions_car</span>
                                                </div>
                                                <div>
                                                    <p className="font-sans font-semibold text-q-stone-900">{booking.taxiName}</p>
                                                    <p className="font-sans text-xs text-q-stone-500 flex items-center gap-1 mt-0.5">
                                                        <span className="material-symbols-outlined text-[12px] text-q-brown">event_seat</span>
                                                        Seat {booking.seatNumber} · {booking.taxiId}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-display font-bold text-q-brown text-lg">R {booking.fare}.00</p>
                                                <span className="q-badge-confirmed">Confirmed</span>
                                            </div>
                                        </div>

                                        <div className="pt-3 border-t border-q-stone-200 flex justify-between items-center">
                                            <p className="font-sans text-sm text-q-stone-500 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[14px]">location_on</span>
                                                {booking.from} → {booking.to}
                                            </p>
                                            <p className="font-sans text-xs text-q-stone-400">
                                                {new Date(booking.date).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <span className="material-symbols-outlined text-6xl mb-4 text-q-stone-300">event_busy</span>
                        <p className="q-caption">No scheduled rides</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

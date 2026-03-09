"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/app/context/BookingContext";

export default function BookingConfirmationPage() {
    const router = useRouter();
    const { currentBooking } = useBooking();

    const from = currentBooking?.from || "Beacon Bay";
    const to = currentBooking?.to || "Amalinda";
    const bookingId = currentBooking?.bookingId || "QLR-XXXX-XXXX";
    const fare = currentBooking?.fare || 20;

    return (
        <main className="min-h-screen bg-q-bg-page flex flex-col">
            {/* Header */}
            <header className="flex items-center bg-white px-4 py-3 sticky top-0 z-10 border-b border-q-stone-200 shadow-q-xs">
                <button onClick={() => router.back()} className="flex w-10 h-10 items-center justify-center rounded-[10px] hover:bg-q-stone-100 transition-colors">
                    <span className="material-symbols-outlined text-q-stone-700">arrow_back</span>
                </button>
                <h1 className="font-display text-lg font-semibold text-q-stone-900 flex-1 text-center pr-10">Booking Confirmed</h1>
            </header>

            <div className="flex-1 overflow-y-auto pb-24">
                {/* Success state */}
                <div className="flex flex-col items-center px-4 py-10 gap-6">
                    <div className="relative w-24 h-24 flex items-center justify-center">
                        <div className="absolute inset-0 bg-q-brown-100 rounded-full animate-pulse" />
                        <div className="relative bg-q-brown rounded-full w-16 h-16 flex items-center justify-center shadow-q-md">
                            <span className="material-symbols-outlined text-white text-3xl">check</span>
                        </div>
                    </div>

                    <div className="text-center">
                        <h2 className="font-display text-2xl font-semibold text-q-stone-900 mb-2">Booking Confirmed!</h2>
                        <p className="q-body max-w-xs mx-auto">
                            Your taxi from <span className="text-q-brown font-semibold">{from}</span> to{" "}
                            <span className="text-q-brown font-semibold">{to}</span> is confirmed.
                        </p>
                    </div>

                    <div className="w-full max-w-md q-card p-6 space-y-4">
                        <div className="flex justify-between items-center pb-4 border-b border-q-stone-200">
                            <span className="font-sans text-sm text-q-stone-500">Amount Paid</span>
                            <span className="font-display text-2xl font-bold text-q-brown">R {fare}.00</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-sans text-sm text-q-stone-500">Booking ID</span>
                            <span className="font-sans text-sm font-mono text-q-stone-900">#{bookingId}</span>
                        </div>
                        {currentBooking?.seatNumber && (
                            <div className="flex justify-between items-center">
                                <span className="font-sans text-sm text-q-stone-500">Seat Number</span>
                                <span className="font-display text-lg font-bold text-q-brown">{currentBooking.seatNumber}</span>
                            </div>
                        )}
                        {currentBooking?.taxiName && (
                            <div className="flex justify-between items-center">
                                <span className="font-sans text-sm text-q-stone-500">Taxi</span>
                                <span className="font-sans text-sm font-semibold text-q-stone-900">{currentBooking.taxiName}</span>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => router.push("/commute/ticket")}
                        className="q-btn-primary-lg w-full max-w-md justify-center"
                    >
                        <span className="material-symbols-outlined text-xl">confirmation_number</span>
                        View Digital Ticket
                    </button>
                </div>

                {/* Trip Summary */}
                <div className="px-4 pb-8">
                    <h3 className="font-display text-xl font-semibold text-q-stone-900 mb-4">Trip Summary</h3>
                    <div className="q-card p-4 space-y-4">
                        <div className="flex gap-4">
                            <div className="flex flex-col items-center py-1">
                                <div className="w-3 h-3 rounded-full border-2 border-q-brown" />
                                <div className="w-px flex-1 bg-q-stone-300 my-1" />
                                <div className="w-3 h-3 rounded-full bg-q-brown" />
                            </div>
                            <div className="flex-1 flex flex-col gap-5">
                                <div>
                                    <p className="font-sans text-[10px] font-bold text-q-stone-500 uppercase tracking-wider">Pickup</p>
                                    <p className="font-sans font-semibold text-q-stone-900">{from} Retail Park</p>
                                </div>
                                <div>
                                    <p className="font-sans text-[10px] font-bold text-q-stone-500 uppercase tracking-wider">Drop-off</p>
                                    <p className="font-sans font-semibold text-q-stone-900">{to} Main Road</p>
                                </div>
                            </div>
                        </div>

                        <div
                            className="w-full h-40 rounded-[12px] overflow-hidden relative bg-cover bg-center"
                            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=600')" }}
                        >
                            <div className="absolute inset-0 bg-q-stone-900/20" />
                            <button
                                onClick={() => router.push("/commute/tracking")}
                                className="absolute bottom-3 right-3 flex items-center gap-2 px-4 py-2 bg-white/90 rounded-full shadow-q-sm font-sans text-xs font-bold text-q-stone-900"
                            >
                                <span className="material-symbols-outlined text-sm">map</span>
                                Open Map
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

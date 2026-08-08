"use client";

import React, { useRef } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/app/context/BookingContext";
import AuthGuard from "@/components/AuthGuard";
import QRCode from "react-qr-code";

function WalkUpTicketContent() {
    const router = useRouter();
    const { currentBooking } = useBooking();

    const booking = currentBooking;

    if (!booking) {
        return (
            <main className="min-h-screen bg-q-bg-page flex flex-col items-center justify-center px-6 text-center">
                <span className="material-symbols-outlined text-q-stone-300 text-5xl mb-4">confirmation_number</span>
                <p className="q-caption">No booking found.</p>
                <button onClick={() => router.push("/driver/dashboard")} className="mt-4 font-sans text-sm font-semibold text-q-brown">
                    Back to Dashboard
                </button>
            </main>
        );
    }

    const isCash = booking.paymentMethod === "cash";
    const isCard = booking.paymentMethod === "card";
    const paymentLabel = isCash ? "PAID · CASH" : isCard ? "PAID · CARD" : "APP BOOKING";
    const paymentCls = isCash
        ? "bg-green-100 text-green-700 border-green-200"
        : isCard
        ? "bg-blue-100 text-blue-700 border-blue-200"
        : "bg-q-brown-100 text-q-brown border-q-brown-200";

    return (
        <main className="min-h-screen bg-q-bg-page flex flex-col">
            {/* Header */}
            <header className="flex items-center bg-white px-4 py-3 border-b border-q-stone-200 shadow-q-xs sticky top-0 z-10">
                <button onClick={() => router.back()} className="flex w-10 h-10 items-center justify-center rounded-[10px] hover:bg-q-stone-100 transition-colors">
                    <span className="material-symbols-outlined text-q-stone-700">arrow_back</span>
                </button>
                <div className="flex-1 px-3">
                    <h1 className="font-display text-lg font-semibold text-q-stone-900">Walk-Up Ticket</h1>
                    <p className="font-sans text-xs text-q-brown">Show this to confirm boarding</p>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-6 pb-32">
                {/* Ticket card */}
                <div className="w-full max-w-sm mx-auto q-card-raised overflow-hidden">
                    {/* Ticket header */}
                    <div className="bg-q-brown px-5 py-4 flex items-center justify-between">
                        <div>
                            <p className="font-sans text-[10px] font-bold text-white/70 uppercase tracking-widest mb-0.5">Walk-Up Boarding Pass</p>
                            <p className="font-display text-lg font-bold text-white leading-tight">{booking.from}</p>
                            <p className="font-sans text-sm font-semibold text-white/80">→ {booking.to}</p>
                        </div>
                        <div className="w-12 h-12 bg-white rounded-[10px] flex items-center justify-center">
                            <span className="material-symbols-outlined text-q-brown text-2xl">directions_bus</span>
                        </div>
                    </div>

                    {/* Seat + payment */}
                    <div className="px-5 py-4 flex items-center justify-between border-b border-q-stone-200">
                        <div>
                            <p className="font-sans text-[10px] font-bold text-q-stone-500 uppercase mb-1">Seat</p>
                            <p className="font-display text-5xl font-bold text-q-brown leading-none">{booking.seatNumber}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-sans text-[10px] font-bold text-q-stone-500 uppercase mb-1">Status</p>
                            <span className={`px-3 py-1.5 rounded-full font-sans text-xs font-bold uppercase border ${paymentCls}`}>
                                {paymentLabel}
                            </span>
                        </div>
                    </div>

                    {/* QR Code */}
                    <div className="flex flex-col items-center py-6 px-5 bg-white">
                        <QRCode value={booking.qrData} size={180} level="M" bgColor="#ffffff" fgColor="#1C1917" />
                        <p className="font-sans text-[10px] font-mono text-q-stone-400 mt-3 text-center">{booking.bookingId}</p>
                    </div>

                    {/* Details */}
                    <div className="px-5 py-4 space-y-3 bg-q-bg-section">
                        {booking.passengerName && booking.passengerName !== "Walk-Up Passenger" && (
                            <div className="flex justify-between items-center">
                                <span className="font-sans text-xs font-bold text-q-stone-500 uppercase">Passenger</span>
                                <span className="font-sans text-sm font-semibold text-q-stone-900">{booking.passengerName}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center">
                            <span className="font-sans text-xs font-bold text-q-stone-500 uppercase">Fare</span>
                            <span className="font-display font-bold text-q-brown">R {booking.fare}.00</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-sans text-xs font-bold text-q-stone-500 uppercase">Departure</span>
                            <span className="font-sans text-sm font-semibold text-q-stone-900">{booking.departureTime}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-sans text-xs font-bold text-q-stone-500 uppercase">Taxi</span>
                            <span className="font-sans text-sm font-semibold text-q-stone-900">{booking.taxiName}</span>
                        </div>
                    </div>

                    <div className="mx-5 border-t border-dashed border-q-stone-200" />

                    <div className="px-5 py-3 text-center bg-q-bg-section">
                        <p className="font-sans text-[10px] text-q-stone-400">
                            Booked by driver · {new Date(booking.date).toLocaleDateString("en-ZA")}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="w-full max-w-sm mx-auto mt-6 space-y-3">
                    <button
                        onClick={() => router.push("/driver/walk-up")}
                        className="q-btn-primary-lg w-full justify-center"
                    >
                        <span className="material-symbols-outlined">person_add</span>
                        Add Next Passenger
                    </button>
                    <button
                        onClick={() => router.push("/driver/scan")}
                        className="q-btn-outline w-full justify-center"
                    >
                        <span className="material-symbols-outlined">qr_code_scanner</span>
                        Scan to Board
                    </button>
                    <button
                        onClick={() => router.push("/driver/dashboard")}
                        className="w-full py-3 font-sans text-sm font-semibold text-q-stone-500 hover:text-q-brown transition-colors"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        </main>
    );
}

export default function WalkUpTicketPage() {
    return (
        <AuthGuard requiredRole="driver">
            <WalkUpTicketContent />
        </AuthGuard>
    );
}

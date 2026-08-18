"use client";

import React from "react";
import { useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import { useBooking } from "@/app/context/BookingContext";
import ShareButton from "@/components/ShareButton";
import { absoluteUrl, bookingShareText } from "@/lib/share";

export default function HikeBookingConfirmationPage() {
    const router = useRouter();
    const { currentBooking } = useBooking();

    const from = currentBooking?.from || "East London";
    const to = currentBooking?.to || "Port Elizabeth";
    const bookingId = currentBooking?.bookingId || "QLR-XXXX-XXXX";
    const fare = currentBooking?.fare || 250;
    const departureTime = currentBooking?.departureTime || "08:30 AM";
    const date = currentBooking?.date
        ? new Date(currentBooking.date).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" })
        : new Date().toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" });
    const qrData = currentBooking?.qrData || JSON.stringify({ bookingId, status: "valid" });

    return (
        <main className="min-h-screen bg-q-bg-page flex flex-col pb-24">
            <header className="flex items-center bg-white px-4 py-3 border-b border-q-stone-200 shadow-q-xs">
                <button onClick={() => router.back()} aria-label="Go back" className="flex w-10 h-10 items-center justify-center rounded-[10px] hover:bg-q-stone-100 transition-colors">
                    <span className="material-symbols-outlined text-q-stone-700">arrow_back</span>
                </button>
                <h1 className="font-display text-lg font-semibold text-q-stone-900 flex-1 text-center">Confirmation</h1>
                <ShareButton
                    title="My Quallor ticket"
                    text={currentBooking ? bookingShareText(currentBooking) : `Quallor trip ${bookingId}`}
                    url={absoluteUrl("/trips")}
                />
            </header>

            <div className="flex-1 overflow-y-auto">
                {/* Success hero */}
                <div className="flex flex-col items-center text-center px-6 py-10">
                    <div className="mb-6 w-20 h-20 rounded-full bg-q-brown-100 flex items-center justify-center">
                        <span className="material-symbols-outlined text-q-brown text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    </div>
                    <h1 className="font-display text-2xl font-semibold text-q-stone-900 mb-2">Booking Confirmed!</h1>
                    <p className="q-body max-w-xs">
                        Your seat from <span className="text-q-brown font-semibold">{from}</span> to{" "}
                        <span className="text-q-brown font-semibold">{to}</span> is secured. Get ready for your hike!
                    </p>
                </div>

                {/* QR code, with the boarding note read first */}
                <div className="px-4 mb-6">
                    <div className="q-card-raised overflow-hidden">
                        <div
                            className="flex gap-3 items-start px-5 py-4"
                            style={{ backgroundColor: "#E1EDF5", borderBottom: "1px solid rgba(17,17,17,0.07)" }}
                        >
                            <span className="material-symbols-outlined text-xl flex-shrink-0" style={{ color: "#1D3686" }}>info</span>
                            <p className="font-sans text-sm leading-snug" style={{ color: "rgba(17,17,17,0.80)" }}>
                                Present this screen to the driver when boarding. Maximise your screen brightness for best scanning results.
                            </p>
                        </div>
                        <div className="p-6 flex flex-col items-center">
                            <div className="p-4 bg-white rounded-[14px] border border-q-stone-200 shadow-q-xs mb-4">
                                <QRCode value={qrData} size={176} style={{ height: "auto", maxWidth: "100%", width: "100%" }} fgColor="#111111" />
                            </div>
                            <p className="font-mono text-xs font-bold text-q-stone-500 uppercase tracking-widest mb-1">Booking Reference</p>
                            <p className="font-sans text-xl font-black" style={{ color: "#111111" }}>{bookingId}</p>
                        </div>
                    </div>
                </div>

                {/* Trip details */}
                <div className="px-4 mb-6">
                    <div className="q-card overflow-hidden">
                        <div className="px-4 py-3 bg-q-bg-section border-b border-q-stone-200 flex items-center justify-between">
                            <h3 className="font-sans font-semibold text-q-stone-900">Trip Details</h3>
                            <span className="q-badge-confirmed">PAID</span>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="flex gap-4">
                                <div className="flex flex-col items-center py-1">
                                    <div className="w-3 h-3 rounded-full bg-q-brown" />
                                    <div className="w-px flex-1 bg-q-stone-300 my-1" />
                                    <div className="w-3 h-3 rounded-full border-2 border-q-brown" />
                                </div>
                                <div className="flex-1 space-y-3">
                                    <div>
                                        <p className="font-sans text-xs text-q-stone-500">Departure</p>
                                        <p className="font-sans font-semibold text-q-stone-900">{from} Taxi Rank</p>
                                    </div>
                                    <div>
                                        <p className="font-sans text-xs text-q-stone-500">Arrival</p>
                                        <p className="font-sans font-semibold text-q-stone-900">{to}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-q-stone-200">
                                <div>
                                    <p className="font-sans text-xs text-q-stone-500">Date &amp; Time</p>
                                    <p className="font-sans text-sm font-semibold text-q-stone-900">{date} · {departureTime}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-sans text-xs text-q-stone-500">Fare Total</p>
                                    <p className="font-display text-base font-bold text-q-brown">R{fare}.00</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="px-4 space-y-3 pb-8">
                    <button onClick={() => router.push("/trips")} className="q-btn-primary-lg w-full justify-center">
                        View My Trips
                    </button>
                    <button onClick={() => router.push("/dashboard")} className="q-btn-secondary w-full justify-center">
                        Return Home
                    </button>
                </div>
            </div>
        </main>
    );
}

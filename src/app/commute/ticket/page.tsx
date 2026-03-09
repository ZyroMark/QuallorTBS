"use client";

import React from "react";
import { useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import { useBooking } from "@/app/context/BookingContext";

export default function DigitalTicketPage() {
    const router = useRouter();
    const { currentBooking } = useBooking();

    const passengerName = currentBooking?.passengerName || "Passenger";
    const from = currentBooking?.from || "Beacon Bay";
    const to = currentBooking?.to || "Amalinda";
    const fare = currentBooking?.fare || 20;
    const seatNumber = currentBooking?.seatNumber || "A1";
    const bookingId = currentBooking?.bookingId || "QLR-XXXX-XXXX";
    const date = currentBooking?.date
        ? new Date(currentBooking.date).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" })
        : new Date().toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" });
    const qrData = currentBooking?.qrData || JSON.stringify({ bookingId, passengerName, status: "valid" });

    return (
        <main className="min-h-screen bg-q-bg-page flex flex-col">
            {/* Header */}
            <header className="flex items-center bg-white px-4 py-3 sticky top-0 z-10 border-b border-q-stone-200 shadow-q-xs">
                <button onClick={() => router.back()} className="flex w-10 h-10 items-center justify-center rounded-[10px] hover:bg-q-stone-100 transition-colors">
                    <span className="material-symbols-outlined text-q-stone-700">arrow_back</span>
                </button>
                <h1 className="font-display text-lg font-semibold text-q-stone-900 flex-1 text-center">Quallor Commute</h1>
                <button className="flex w-10 h-10 items-center justify-center rounded-[10px] hover:bg-q-stone-100 transition-colors">
                    <span className="material-symbols-outlined text-q-stone-500">share</span>
                </button>
            </header>

            <div className="flex-1 overflow-y-auto pb-24">
                <div className="flex flex-col items-center px-4 pt-6 pb-4">
                    <h2 className="font-display text-2xl font-semibold text-q-stone-900">Digital Ticket</h2>
                    <p className="font-sans text-xs font-semibold text-q-brown uppercase tracking-widest mt-1">Valid for Today</p>
                </div>

                {/* Ticket Card */}
                <div className="px-4 pb-4">
                    <div className="q-card-raised overflow-hidden">
                        {/* QR Section */}
                        <div className="w-full bg-white p-8 flex flex-col items-center border-b-2 border-dashed border-q-stone-200">
                            <div className="p-4 bg-white rounded-[14px] border border-q-stone-200 shadow-q-xs">
                                <QRCode
                                    value={qrData}
                                    size={192}
                                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                    fgColor="#1C1917"
                                />
                            </div>
                            <p className="font-sans text-xs text-q-stone-400 mt-4 tracking-tight">TRIP-ID: {bookingId}</p>
                        </div>

                        {/* Trip Info */}
                        <div className="p-6 space-y-5">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-sans text-[10px] font-bold text-q-stone-500 uppercase tracking-wider">From</p>
                                    <p className="font-display text-lg font-semibold text-q-stone-900">{from}</p>
                                </div>
                                <div className="flex flex-col items-center justify-center pt-3">
                                    <span className="material-symbols-outlined text-q-brown">directions_bus</span>
                                </div>
                                <div className="text-right">
                                    <p className="font-sans text-[10px] font-bold text-q-stone-500 uppercase tracking-wider">To</p>
                                    <p className="font-display text-lg font-semibold text-q-stone-900">{to}</p>
                                </div>
                            </div>

                            <div className="h-px w-full bg-q-stone-200" />

                            <div className="grid grid-cols-2 gap-y-5">
                                <div>
                                    <p className="font-sans text-[10px] font-bold text-q-stone-500 uppercase">Passenger</p>
                                    <p className="font-sans font-semibold text-q-stone-900">{passengerName}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-sans text-[10px] font-bold text-q-stone-500 uppercase">Fare</p>
                                    <p className="font-display text-xl font-bold text-q-brown">R {fare}.00</p>
                                </div>
                                <div>
                                    <p className="font-sans text-[10px] font-bold text-q-stone-500 uppercase">Date</p>
                                    <p className="font-sans font-semibold text-q-stone-900">{date}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-sans text-[10px] font-bold text-q-stone-500 uppercase">Seat No.</p>
                                    <p className="font-display text-xl font-bold text-q-brown">{seatNumber}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => router.push("/commute/tracking")}
                                className="q-btn-primary w-full justify-center"
                            >
                                <span className="material-symbols-outlined text-sm">map</span>
                                Track My Taxi
                            </button>
                        </div>
                    </div>
                </div>

                {/* Info banner */}
                <div className="px-4 pb-4">
                    <div className="bg-q-brown-50 border border-q-brown-200 rounded-[12px] p-4 flex gap-3 items-start">
                        <span className="material-symbols-outlined text-q-brown text-xl flex-shrink-0">info</span>
                        <p className="font-sans text-sm text-q-stone-700 leading-snug">
                            Present this screen to the driver when boarding. Maximise your screen brightness for best scanning results.
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}

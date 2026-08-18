"use client";

import React from "react";
import { useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import { useBooking } from "@/app/context/BookingContext";
import ShareButton from "@/components/ShareButton";
import { absoluteUrl, bookingShareText } from "@/lib/share";

export default function DigitalTicketPage() {
    const router = useRouter();
    const { currentBooking, journeyLegs, setCurrentBooking } = useBooking();

    const passengerName = currentBooking?.passengerName || "Passenger";
    const from = currentBooking?.from || "Beacon Bay";
    const to = currentBooking?.to || "Amalinda";
    const fare = currentBooking?.fare ?? 20;
    const seatNumber = currentBooking?.seatNumber || "A1";
    const bookingId = currentBooking?.bookingId || "QLR-XXXX-XXXX";
    const taxiName = currentBooking?.taxiName || "Khululeka Express";
    const date = currentBooking?.date
        ? new Date(currentBooking.date).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" })
        : new Date().toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" });
    const qrData = currentBooking?.qrData || JSON.stringify({ bookingId, passengerName, status: "valid" });

    const legs = currentBooking ? journeyLegs(currentBooking) : [];
    const isMultiLeg = legs.length > 1;
    const legIndex = currentBooking?.legIndex ?? 0;

    return (
        <main className="min-h-screen bg-q-bg-page flex flex-col">
            {/* Header */}
            <header className="flex items-center bg-white px-4 py-3 sticky top-0 z-10 border-b border-q-stone-200 shadow-q-xs">
                <button
                    onClick={() => router.back()}
                    aria-label="Go back"
                    className="flex w-10 h-10 items-center justify-center rounded-[10px] hover:bg-q-stone-100 transition-colors"
                >
                    <span className="material-symbols-outlined text-q-stone-700">arrow_back</span>
                </button>
                <h1 className="font-display text-lg font-semibold text-q-stone-900 flex-1 text-center">Quallor Commute</h1>
                <ShareButton
                    title="My Quallor ticket"
                    text={currentBooking ? bookingShareText(currentBooking) : `Quallor trip ${bookingId}`}
                    url={absoluteUrl("/trips")}
                />
            </header>

            <div className="flex-1 overflow-y-auto pb-24">
                <div className="flex flex-col items-center px-4 pt-6 pb-4">
                    <h2 className="font-display text-2xl font-semibold text-q-stone-900">Digital Ticket</h2>
                    <p className="font-mono text-xs font-semibold uppercase tracking-widest mt-1" style={{ color: "#1D3686" }}>
                        {isMultiLeg ? `Leg ${legIndex + 1} of ${legs.length}` : "Valid for Today"}
                    </p>
                </div>

                {/* Ticket Card */}
                <div className="px-4 pb-4">
                    <div className="q-card-raised overflow-hidden">

                        {/* Boarding note sits above the QR so it is read before the code is shown */}
                        <div
                            className="flex gap-3 items-start px-6 py-4"
                            style={{ backgroundColor: "#E1EDF5", borderBottom: "1px solid rgba(17,17,17,0.07)" }}
                        >
                            <span className="material-symbols-outlined text-xl flex-shrink-0" style={{ color: "#1D3686" }}>info</span>
                            <p className="font-sans text-sm leading-snug" style={{ color: "rgba(17,17,17,0.80)" }}>
                                Present this screen to the driver when boarding. Maximise your screen brightness for best scanning results.
                            </p>
                        </div>

                        {/* QR Section */}
                        <div className="w-full bg-white p-8 flex flex-col items-center border-b-2 border-dashed border-q-stone-200">
                            <div className="p-4 bg-white rounded-[14px] border border-q-stone-200 shadow-q-xs">
                                <QRCode
                                    value={qrData}
                                    size={192}
                                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                    fgColor="#111111"
                                />
                            </div>
                            <p className="font-mono text-xs text-q-stone-400 mt-4 tracking-tight">TRIP-ID: {bookingId}</p>
                        </div>

                        {/* Trip Info */}
                        <div className="p-6 space-y-5">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-mono text-[10px] font-bold text-q-stone-500 uppercase tracking-wider">From</p>
                                    <p className="font-display text-lg font-semibold text-q-stone-900">{from}</p>
                                </div>
                                <div className="flex flex-col items-center justify-center pt-3">
                                    <span className="material-symbols-outlined" style={{ color: "#1D3686" }}>directions_bus</span>
                                </div>
                                <div className="text-right">
                                    <p className="font-mono text-[10px] font-bold text-q-stone-500 uppercase tracking-wider">To</p>
                                    <p className="font-display text-lg font-semibold text-q-stone-900">{to}</p>
                                </div>
                            </div>

                            <div className="h-px w-full bg-q-stone-200" />

                            <div className="grid grid-cols-2 gap-y-5">
                                <div>
                                    <p className="font-mono text-[10px] font-bold text-q-stone-500 uppercase">Passenger</p>
                                    <p className="font-sans font-semibold text-q-stone-900">{passengerName}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-mono text-[10px] font-bold text-q-stone-500 uppercase">Fare</p>
                                    <p className="font-sans text-xl font-black" style={{ color: "#111111" }}>R {fare}.00</p>
                                </div>
                                <div>
                                    <p className="font-mono text-[10px] font-bold text-q-stone-500 uppercase">Date</p>
                                    <p className="font-sans font-semibold text-q-stone-900">{date}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-mono text-[10px] font-bold text-q-stone-500 uppercase">Seat No.</p>
                                    <p className="font-sans text-xl font-black" style={{ color: "#111111" }}>{seatNumber}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="font-mono text-[10px] font-bold text-q-stone-500 uppercase">Taxi</p>
                                    <p className="font-sans font-semibold text-q-stone-900">{taxiName}</p>
                                </div>
                            </div>

                            <button onClick={() => router.push("/commute/tracking")} className="q-btn-primary w-full justify-center">
                                <span className="material-symbols-outlined text-sm">map</span>
                                Track My Taxi
                            </button>
                        </div>
                    </div>
                </div>

                {/* Other legs of a connecting journey */}
                {isMultiLeg && (
                    <div className="px-4 pb-6">
                        <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-2 px-1" style={{ color: "#AEA89C" }}>
                            Rest of this journey
                        </p>
                        <div
                            className="rounded-[16px] overflow-hidden"
                            style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(17,17,17,0.07)" }}
                        >
                            {legs.map((leg, i) => {
                                const isCurrent = leg.bookingId === currentBooking?.bookingId;
                                return (
                                    <button
                                        key={leg.bookingId}
                                        disabled={isCurrent}
                                        onClick={() => setCurrentBooking(leg)}
                                        className="w-full flex items-center gap-3 p-4 text-left"
                                        style={{
                                            borderTop: i === 0 ? undefined : "1px solid rgba(17,17,17,0.06)",
                                            backgroundColor: isCurrent ? "#FFFCF9" : undefined,
                                        }}
                                    >
                                        <span
                                            className="w-7 h-7 rounded-full flex items-center justify-center font-mono text-[11px] font-bold flex-shrink-0"
                                            style={{ backgroundColor: isCurrent ? "#111111" : "#CDDFF6", color: isCurrent ? "#FFFFFF" : "#111111" }}
                                        >
                                            {i + 1}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-sans text-sm font-bold truncate" style={{ color: "#111111" }}>
                                                {leg.from} → {leg.to}
                                            </p>
                                            <p className="font-sans text-xs" style={{ color: "#8A8678" }}>
                                                {leg.taxiName} · Seat {leg.seatNumber} · {leg.departureTime}
                                            </p>
                                        </div>
                                        {isCurrent && (
                                            <span className="font-mono text-[10px] font-bold uppercase flex-shrink-0" style={{ color: "#1D3686" }}>
                                                Showing
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

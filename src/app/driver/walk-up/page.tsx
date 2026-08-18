"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useBooking } from "@/app/context/BookingContext";
import { popularRoutesFor } from "@/lib/places";
import { useProvince } from "@/lib/useProvince";
import AuthGuard from "@/components/AuthGuard";

const ROWS = ["A", "B", "C", "D"];
const COLS = [1, 2, 3, 4];
const TAKEN_SEATS = ["A1", "A3", "B2", "B4", "C1"];

function WalkUpContent() {
    const router = useRouter();
    const { user } = useAuth();
    const { addBooking } = useBooking();

    const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
    const [passengerName, setPassengerName] = useState("");
    const [passengerPhone, setPassengerPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // The driver's own network, so a Johannesburg gaatjie is not writing
    // tickets for an East London route.
    const { province } = useProvince();
    const headline = popularRoutesFor(province.id)[0];
    const from = province.commuteOrigin;
    const to = headline.to;
    const fare = headline.fare;
    const taxiId = user?.vehiclePlate || "TX-001";
    const taxiName = user?.vehicleModel || "Quallor Taxi";

    function generateBookingId() {
        const a = Math.random().toString(36).substr(2, 4).toUpperCase();
        const b = Math.random().toString(36).substr(2, 4).toUpperCase();
        return `QLR-${a}-${b}`;
    }

    async function handleConfirm() {
        if (!selectedSeat) { setError("Please select a seat."); return; }
        setError("");
        setLoading(true);
        const bookingId = generateBookingId();
        const name = passengerName.trim() || "Walk-Up Passenger";
        const booking = {
            bookingId,
            tripType: "commute" as const,
            from,
            to,
            taxiId,
            taxiName,
            departureTime: new Date().toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" }),
            seatNumber: selectedSeat,
            fare,
            passengerName: name,
            passengerId: passengerPhone.trim() || "WALK-UP",
            date: new Date().toISOString(),
            status: "confirmed" as const,
            paymentMethod,
            bookedByDriver: true,
            qrData: JSON.stringify({ bookingId, passengerName: name, from, to, seatNumber: selectedSeat, taxiId, fare, paymentMethod, bookedByDriver: true, date: new Date().toISOString(), status: "valid" }),
        };
        const result = await addBooking(booking);
        setLoading(false);
        if (!result.success) {
            setError(result.error || "Could not take this booking.");
            return;
        }
        router.push("/driver/walk-up/ticket");
    }

    return (
        <main className="min-h-screen bg-q-bg-page flex flex-col pb-8">
            {/* Header */}
            <header className="flex items-center bg-white px-4 py-3 border-b border-q-stone-200 shadow-q-xs sticky top-0 z-10">
                <button onClick={() => router.back()} className="flex w-10 h-10 items-center justify-center rounded-[10px] hover:bg-q-stone-100 transition-colors">
                    <span className="material-symbols-outlined text-q-stone-700">arrow_back</span>
                </button>
                <div className="flex-1 px-3">
                    <h1 className="font-display text-lg font-semibold text-q-stone-900">Walk-Up Passenger</h1>
                    <p className="font-sans text-xs text-q-brown">Book seat for cash / card payment</p>
                </div>
            </header>

            <div className="px-4 pt-5 space-y-6">
                {/* Route info */}
                <div className="q-card p-4 flex justify-between items-center">
                    <div>
                        <p className="font-sans text-[10px] font-bold text-q-stone-500 uppercase tracking-wider mb-1">Route</p>
                        <p className="font-sans font-semibold text-q-stone-900">{from} → {to}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-sans text-[10px] font-bold text-q-stone-500 uppercase tracking-wider mb-1">Fare</p>
                        <p className="font-display text-xl font-bold text-q-brown">R {fare}.00</p>
                    </div>
                </div>

                {/* Passenger info */}
                <div className="space-y-3">
                    <p className="font-sans text-xs font-bold text-q-stone-500 uppercase tracking-widest">Passenger Info (optional)</p>
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-q-stone-400 text-xl">person</span>
                        <input
                            className="q-input w-full pl-12"
                            placeholder="Passenger name"
                            value={passengerName}
                            onChange={(e) => setPassengerName(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-q-stone-400 text-xl">phone</span>
                        <input
                            className="q-input w-full pl-12"
                            placeholder="Phone number (optional)"
                            type="tel"
                            value={passengerPhone}
                            onChange={(e) => setPassengerPhone(e.target.value)}
                        />
                    </div>
                </div>

                {/* Payment method */}
                <div>
                    <p className="font-sans text-xs font-bold text-q-stone-500 uppercase tracking-widest mb-3">Payment Method</p>
                    <div className="grid grid-cols-2 gap-3">
                        {(["cash", "card"] as const).map((method) => (
                            <button
                                key={method}
                                type="button"
                                onClick={() => setPaymentMethod(method)}
                                className={`flex items-center justify-center gap-2 h-14 rounded-[12px] border-2 font-sans font-semibold text-sm transition-all ${
                                    paymentMethod === method
                                        ? "bg-q-brown border-q-brown text-white shadow-q-sm"
                                        : "bg-white border-q-stone-200 text-q-stone-600 hover:border-q-brown"
                                }`}
                            >
                                <span className="material-symbols-outlined text-lg">
                                    {method === "cash" ? "payments" : "credit_card"}
                                </span>
                                {method === "cash" ? "Cash" : "Card"}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Seat selection */}
                <div>
                    <p className="font-sans text-xs font-bold text-q-stone-500 uppercase tracking-widest mb-3">Select Seat</p>

                    <div className="flex items-center gap-5 mb-3 font-sans text-xs font-semibold text-q-stone-600">
                        <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-md bg-q-brown-100 border-2 border-q-brown" />
                            <span>Available</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-md bg-q-brown border-2 border-q-brown" />
                            <span className="text-q-brown">Selected</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-md bg-q-stone-200 border-2 border-q-stone-300" />
                            <span className="text-q-stone-400">Taken</span>
                        </div>
                    </div>

                    <div className="mb-3 py-2 rounded-[10px] bg-q-stone-100 text-center font-sans text-xs font-bold uppercase tracking-widest text-q-stone-500">
                        Front · Driver
                    </div>

                    <div className="space-y-3">
                        {ROWS.map((row) => (
                            <div key={row} className="flex items-center gap-3">
                                <span className="font-sans text-xs font-bold text-q-stone-400 w-4">{row}</span>
                                <div className="flex gap-3 flex-1">
                                    {COLS.map((col, colIdx) => {
                                        const seatId = `${row}${col}`;
                                        const isTaken = TAKEN_SEATS.includes(seatId);
                                        const isSelected = selectedSeat === seatId;
                                        return (
                                            <React.Fragment key={col}>
                                                {colIdx === 2 && <div className="w-5" />}
                                                <button
                                                    disabled={isTaken}
                                                    onClick={() => setSelectedSeat(isSelected ? null : seatId)}
                                                    className={`flex-1 h-12 rounded-[10px] font-sans text-sm font-bold border-2 transition-all active:scale-95 ${
                                                        isTaken
                                                            ? "bg-q-stone-200 border-q-stone-300 text-q-stone-400 cursor-not-allowed"
                                                            : isSelected
                                                            ? "bg-q-brown border-q-brown text-white shadow-q-sm"
                                                            : "bg-q-brown-100 border-q-brown text-q-brown hover:bg-q-brown-200"
                                                    }`}
                                                >
                                                    {seatId}
                                                </button>
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Summary */}
                {selectedSeat && (
                    <div className="q-card p-4 flex justify-between items-center">
                        <div>
                            <p className="font-sans text-[10px] font-bold text-q-stone-500 uppercase tracking-wider mb-0.5">Seat</p>
                            <p className="font-display text-3xl font-bold text-q-brown">{selectedSeat}</p>
                        </div>
                        <div className="text-center">
                            <p className="font-sans text-[10px] font-bold text-q-stone-500 uppercase tracking-wider mb-0.5">Payment</p>
                            <span className={`px-3 py-1 rounded-full font-sans text-xs font-bold uppercase ${paymentMethod === "cash" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                                {paymentMethod === "cash" ? "Cash" : "Card"}
                            </span>
                        </div>
                        <div className="text-right">
                            <p className="font-sans text-[10px] font-bold text-q-stone-500 uppercase tracking-wider mb-0.5">Fare</p>
                            <p className="font-display text-3xl font-bold text-q-brown">R {fare}.00</p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="px-4 py-3 rounded-[10px] bg-red-50 border border-red-200 text-red-700 font-sans text-sm font-medium">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleConfirm}
                    disabled={!selectedSeat || loading}
                    className="q-btn-primary-lg w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {loading
                        ? "Booking..."
                        : selectedSeat
                        ? `Confirm Seat ${selectedSeat} · Paid ${paymentMethod === "cash" ? "Cash" : "by Card"}`
                        : "Select a Seat to Continue"}
                </button>
            </div>
        </main>
    );
}

export default function WalkUpPage() {
    return (
        <AuthGuard requiredRole="driver">
            <WalkUpContent />
        </AuthGuard>
    );
}

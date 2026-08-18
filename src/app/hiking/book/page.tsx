"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useBooking } from "@/app/context/BookingContext";
import { featuredHikeFor } from "@/lib/places";
import { useProvince } from "@/lib/useProvince";

const TAKEN_SEATS = ["A1", "A3", "B2", "C4", "D1"];
const ROWS = ["A", "B", "C", "D"];
const COLS = [1, 2, 3, 4];

export default function HikeSeatSelectionPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { selectedRoute, selectedTaxi, confirmBooking } = useBooking();
    const [selectedSeat, setSelectedSeat] = useState<string | null>(null);

    const { province } = useProvince();
    const from = selectedRoute?.from || province.hikingOrigin;
    const to = selectedRoute?.to || featuredHikeFor(province.id).to;
    const taxi = selectedTaxi || { id: "HC-101", name: "Sibusiso M.", departureTime: "08:30 AM", fare: 250 };

    // Set when this seat is a later taxi of a connecting journey.
    const journeyId = selectedRoute?.journeyId;
    const legIndex = selectedRoute?.legIndex ?? 0;

    async function handleConfirm() {
        if (!selectedSeat) return;
        const booking = await confirmBooking({
            tripType: "hiking",
            from,
            to,
            taxiId: taxi.id,
            taxiName: taxi.name,
            departureTime: taxi.departureTime,
            seatNumber: selectedSeat,
            fare: taxi.fare,
            passengerName: user?.name || "Passenger",
            passengerId: user?.id || "GUEST",
            date: new Date().toISOString(),
            status: "confirmed",
            paymentMethod: "app",
            ...(journeyId ? { journeyId, legIndex, legCount: legIndex + 1 } : {}),
        });
        // The seat may have gone to someone else between listing and confirming.
        if (!booking) return;
        // A connecting leg returns to the shared confirmation screen so the whole
        // journey is shown, not just this taxi.
        router.push(journeyId ? "/commute/confirmation" : "/hiking/confirmation");
    }

    return (
        <main className="min-h-screen bg-q-bg-page flex flex-col">
            <header className="flex items-center bg-white px-4 py-3 sticky top-0 z-10 border-b border-q-stone-200 shadow-q-xs">
                <button onClick={() => router.back()} className="flex w-10 h-10 items-center justify-center rounded-[10px] hover:bg-q-stone-100 transition-colors">
                    <span className="material-symbols-outlined text-q-stone-700">arrow_back</span>
                </button>
                <h1 className="font-display text-lg font-semibold text-q-stone-900 flex-1 text-center pr-10">Select Your Seat</h1>
            </header>

            {journeyId && (
                <div className="flex items-center gap-2 px-4 py-2.5" style={{ backgroundColor: "#CDDFF6" }}>
                    <span className="material-symbols-outlined text-lg flex-shrink-0" style={{ color: "#111111" }}>alt_route</span>
                    <p className="font-sans text-xs font-bold" style={{ color: "#111111" }}>
                        Connecting taxi {legIndex + 1} of your journey · {from} to {to}
                    </p>
                </div>
            )}

            <div className="flex-1 overflow-y-auto pb-32">
                {/* Route strip */}
                <div className="px-4 py-4 bg-q-bg-section border-b border-q-stone-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-sans text-[10px] font-bold text-q-stone-500 uppercase tracking-wider">Route</p>
                            <p className="font-sans font-semibold text-q-stone-900">{from} → {to}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-sans text-[10px] font-bold text-q-stone-500 uppercase tracking-wider">Driver</p>
                            <p className="font-sans text-sm font-semibold text-q-brown">{taxi.name}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-sans text-[10px] font-bold text-q-stone-500 uppercase tracking-wider">Fare</p>
                            <p className="font-display text-sm font-bold text-q-brown">R{taxi.fare}.00</p>
                        </div>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-6 py-4 font-sans text-xs font-semibold text-q-stone-600">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-q-brown-100 border-2 border-q-brown" />
                        <span>Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-q-brown border-2 border-q-brown" />
                        <span className="text-q-brown">Selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-q-stone-200 border-2 border-q-stone-300" />
                        <span className="text-q-stone-400">Taken</span>
                    </div>
                </div>

                <div className="mx-4 mb-4 py-2 rounded-[10px] bg-q-stone-100 text-center font-sans text-xs font-bold uppercase tracking-widest text-q-stone-500">
                    Front of Taxi · Driver
                </div>

                <div className="px-8 space-y-3">
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

                {selectedSeat && (
                    <div className="mx-4 mt-6 p-4 rounded-[14px] bg-q-brown-50 border border-q-brown-200">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-sans text-[10px] font-bold text-q-stone-500 uppercase tracking-wider">Selected Seat</p>
                                <p className="font-display text-3xl font-bold text-q-brown">{selectedSeat}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-sans text-[10px] font-bold text-q-stone-500 uppercase tracking-wider">Total Fare</p>
                                <p className="font-display text-3xl font-bold text-q-brown">R{taxi.fare}.00</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-q-stone-200 p-4 pb-8 shadow-q-lg">
                <button
                    onClick={handleConfirm}
                    disabled={!selectedSeat}
                    className="q-btn-primary-lg w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {selectedSeat ? `Confirm Seat ${selectedSeat} · Pay R${taxi.fare}.00` : "Select a Seat"}
                </button>
            </div>
        </main>
    );
}

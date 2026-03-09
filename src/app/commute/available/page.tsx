"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/app/context/BookingContext";

export default function AvailableTaxisPage() {
    const router = useRouter();
    const { selectedRoute, setSelectedTaxi } = useBooking();

    const from = selectedRoute?.from || "Beacon Bay";
    const to = selectedRoute?.to || "Amalinda";

    const taxis = [
        {
            id: "TX-402",
            driver: "Khululeka Express",
            plate: "CA 123-456",
            fare: 20,
            seatsLeft: 4,
            totalSeats: 14,
            rule: "Next departure: 08:30 AM",
            departureTime: "08:30 AM",
            img: "https://images.unsplash.com/photo-1549423155-227364ac5d14?q=80&w=200",
            urgent: false,
            disabled: false,
        },
        {
            id: "TX-511",
            driver: "Border Star Shuttle",
            plate: "NCA 667-AZ",
            fare: 20,
            seatsLeft: 0,
            totalSeats: 14,
            rule: "Full — waiting for next run",
            departureTime: "08:45 AM",
            img: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?q=80&w=200",
            urgent: false,
            disabled: true,
        },
        {
            id: "TX-229",
            driver: "Imvusa Transit",
            plate: "EC 554-121",
            fare: 20,
            seatsLeft: 2,
            totalSeats: 14,
            rule: "Leaves when full",
            departureTime: "09:15 AM",
            img: "https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=200",
            urgent: true,
            disabled: false,
        },
    ];

    function handleTaxiClick(taxi: typeof taxis[0]) {
        setSelectedTaxi({ id: taxi.id, name: taxi.driver, departureTime: taxi.departureTime, fare: taxi.fare });
        router.push("/commute/book");
    }

    return (
        <main className="min-h-screen bg-q-bg-page flex flex-col">
            <header className="bg-white border-b border-q-stone-200 shadow-q-xs sticky top-0 z-10">
                <div className="flex items-center px-4 py-3">
                    <button onClick={() => router.back()} className="flex w-10 h-10 items-center justify-center rounded-[10px] hover:bg-q-stone-100 transition-colors">
                        <span className="material-symbols-outlined text-q-stone-700">arrow_back</span>
                    </button>
                    <div className="flex-1 px-3">
                        <h1 className="font-display text-lg font-semibold text-q-stone-900">Available Taxis</h1>
                        <p className="font-sans text-xs text-q-brown">Eastern Cape Transport</p>
                    </div>
                    <button className="flex w-10 h-10 items-center justify-center rounded-[10px] hover:bg-q-stone-100 transition-colors">
                        <span className="material-symbols-outlined text-q-stone-500">search</span>
                    </button>
                </div>
                <div className="px-4 pb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-q-brown text-sm">distance</span>
                    <p className="font-sans text-sm font-semibold text-q-stone-700">{from} → {to}</p>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-4">
                {taxis.map((taxi, i) => {
                    const percent = taxi.totalSeats > 0
                        ? Math.round(((taxi.totalSeats - taxi.seatsLeft) / taxi.totalSeats) * 100)
                        : 100;
                    const seatLabel = taxi.seatsLeft === 0
                        ? "No Seats Available"
                        : taxi.urgent
                            ? `Filling Up — ${taxi.seatsLeft} Seat${taxi.seatsLeft === 1 ? "" : "s"} Left`
                            : `${taxi.seatsLeft} Seats Available`;

                    return (
                        <div key={i} className={`q-card p-4 space-y-4 ${taxi.disabled ? "opacity-50" : ""}`}>
                            <div className="flex justify-between items-start gap-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <span className="material-symbols-outlined text-q-brown text-sm">schedule</span>
                                        <p className="font-sans text-xs font-bold text-q-brown uppercase tracking-wider">{taxi.rule}</p>
                                    </div>
                                    <h4 className="font-display text-base font-semibold text-q-stone-900">{taxi.driver}</h4>
                                    <p className="font-sans text-xs text-q-stone-500">Plate: {taxi.plate}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-display text-xl font-bold text-q-brown">R{taxi.fare}.00</p>
                                    <p className="font-sans text-[10px] font-bold text-q-stone-500 uppercase">Fixed Fare</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <div className={`flex items-center gap-1.5 ${taxi.urgent || taxi.disabled ? "text-red-600" : "text-q-stone-700"}`}>
                                        <span className="material-symbols-outlined text-lg">
                                            {taxi.disabled ? "block" : taxi.urgent ? "warning" : "event_seat"}
                                        </span>
                                        <span className="font-sans text-sm font-bold">{seatLabel}</span>
                                    </div>
                                    <div className="mt-2 flex items-center gap-2">
                                        <div className="h-1.5 w-24 bg-q-stone-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${taxi.disabled || taxi.urgent ? "bg-red-500" : "bg-q-brown"}`}
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>
                                        <span className="font-sans text-[10px] font-bold text-q-stone-400">{percent}% Full</span>
                                    </div>
                                </div>
                                <div
                                    className="w-24 h-16 rounded-[10px] overflow-hidden bg-cover bg-center border border-q-stone-200 flex-shrink-0"
                                    style={{ backgroundImage: `url("${taxi.img}")` }}
                                />
                            </div>

                            <button
                                disabled={taxi.disabled}
                                onClick={() => !taxi.disabled && handleTaxiClick(taxi)}
                                className={`q-btn-primary w-full justify-center ${taxi.disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                            >
                                <span className="material-symbols-outlined text-xl">confirmation_number</span>
                                {taxi.disabled ? "No Seats Available" : "Book Seat"}
                            </button>
                        </div>
                    );
                })}
            </div>
        </main>
    );
}

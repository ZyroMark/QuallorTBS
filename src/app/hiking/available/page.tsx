"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/app/context/BookingContext";

export default function AvailableHikingTaxisPage() {
    const router = useRouter();
    const { selectedRoute, setSelectedTaxi } = useBooking();

    const from = selectedRoute?.from || "East London";
    const to = selectedRoute?.to || "Port Elizabeth";

    const taxis = [
        {
            id: "HC-101",
            driver: "Sibusiso M.",
            plate: "CA 123-456",
            fare: 250,
            seats: "3 Seats Available",
            percent: 70,
            rule: "Leaves when full",
            img: "https://images.unsplash.com/photo-1549423155-227364ac5d14?q=80&w=200",
            departureTime: "08:30 AM",
            urgent: false,
        },
        {
            id: "HC-102",
            driver: "Phumzile K.",
            plate: "CB 987-654",
            fare: 250,
            seats: "Filling Up — 1 Seat Left",
            percent: 92,
            rule: "09:00 AM Departure",
            img: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?q=80&w=200",
            departureTime: "09:00 AM",
            urgent: true,
        },
        {
            id: "HC-103",
            driver: "Lwazi N.",
            plate: "EC 554-121",
            fare: 250,
            seats: "8 Seats Available",
            percent: 40,
            rule: "Leaves when full",
            img: "https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=200",
            departureTime: "10:00 AM",
            urgent: false,
        },
    ];

    function handleTaxiSelect(taxi: typeof taxis[0]) {
        setSelectedTaxi({ id: taxi.id, name: taxi.driver, departureTime: taxi.departureTime, fare: taxi.fare });
        router.push("/hiking/book");
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
                        <p className="font-sans text-xs text-q-brown">Long-Distance Travel</p>
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
                {taxis.map((taxi, i) => (
                    <div key={i} className="q-card p-4 space-y-4">
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
                                <div className={`flex items-center gap-1.5 ${taxi.urgent ? "text-red-600" : "text-q-stone-700"}`}>
                                    <span className="material-symbols-outlined text-lg">{taxi.urgent ? "warning" : "event_seat"}</span>
                                    <span className="font-sans text-sm font-bold">{taxi.seats}</span>
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                    <div className="h-1.5 w-24 bg-q-stone-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${taxi.urgent ? "bg-red-500" : "bg-q-brown"}`}
                                            style={{ width: `${taxi.percent}%` }}
                                        />
                                    </div>
                                    <span className="font-sans text-[10px] font-bold text-q-stone-400">{taxi.percent}% Full</span>
                                </div>
                            </div>
                            <div
                                className="w-24 h-16 rounded-[10px] overflow-hidden bg-cover bg-center border border-q-stone-200 flex-shrink-0"
                                style={{ backgroundImage: `url("${taxi.img}")` }}
                            />
                        </div>

                        <button
                            onClick={() => handleTaxiSelect(taxi)}
                            className="q-btn-primary w-full justify-center"
                        >
                            <span className="material-symbols-outlined text-xl">confirmation_number</span>
                            Book Seat
                        </button>
                    </div>
                ))}
            </div>
        </main>
    );
}

"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/app/context/BookingContext";
import { VehicleTile } from "@/components/RouteArt";
import { PLACE_BY_NAME, featuredHikeFor } from "@/lib/places";
import { useProvince } from "@/lib/useProvince";

interface HikeTaxi {
    id: string;
    driver: string;
    plate: string;
    fareOffset: number;
    seatsLeft: number;
    totalSeats: number;
    rule: string;
    departureTime: string;
    urgent: boolean;
}

const TAXIS: HikeTaxi[] = [
    { id: "HC-101", driver: "Sibusiso M.", plate: "CA 123-456", fareOffset: 0,   seatsLeft: 3, totalSeats: 14, rule: "Leaves when full",     departureTime: "08:30 AM", urgent: false },
    { id: "HC-102", driver: "Phumzile K.", plate: "CB 987-654", fareOffset: 20,  seatsLeft: 1, totalSeats: 14, rule: "09:00 AM Departure",   departureTime: "09:00 AM", urgent: true },
    { id: "HC-103", driver: "Lwazi N.",    plate: "EC 554-121", fareOffset: -30, seatsLeft: 8, totalSeats: 14, rule: "Leaves when full",     departureTime: "10:00 AM", urgent: false },
    { id: "HC-104", driver: "Anele T.",    plate: "EC 771-330", fareOffset: 40,  seatsLeft: 6, totalSeats: 22, rule: "Express · no stops",   departureTime: "11:30 AM", urgent: false },
];

type SortKey = "soonest" | "cheapest" | "emptiest";

export default function AvailableHikingTaxisPage() {
    const router = useRouter();
    const { selectedRoute, setSelectedTaxi } = useBooking();

    const [searchOpen, setSearchOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState<SortKey>("soonest");

    const { province } = useProvince();
    const from = selectedRoute?.from || province.hikingOrigin;
    const to = selectedRoute?.to || featuredHikeFor(province.id).to;
    const isConnecting = Boolean(selectedRoute?.journeyId);

    // Base fare comes from the destination, so the price matches the route picked.
    const baseFare = PLACE_BY_NAME[to]?.fare ?? 250;

    const taxis = useMemo(() => {
        const q = query.trim().toLowerCase();
        const list = TAXIS
            .map((t) => ({ ...t, fare: Math.max(50, baseFare + t.fareOffset) }))
            .filter((t) => !q || [t.driver, t.plate, t.id, t.departureTime].join(" ").toLowerCase().includes(q));

        return [...list].sort((a, b) => {
            if (sort === "cheapest") return a.fare - b.fare;
            if (sort === "emptiest") return b.seatsLeft - a.seatsLeft;
            return a.departureTime.localeCompare(b.departureTime);
        });
    }, [query, sort, baseFare]);

    function handleTaxiSelect(taxi: HikeTaxi & { fare: number }) {
        setSelectedTaxi({ id: taxi.id, name: taxi.driver, departureTime: taxi.departureTime, fare: taxi.fare });
        router.push("/hiking/book");
    }

    return (
        <main className="min-h-screen bg-q-bg-page flex flex-col">
            <header className="bg-white border-b border-q-stone-200 shadow-q-xs sticky top-0 z-10">
                <div className="flex items-center px-4 py-3">
                    <button
                        onClick={() => router.back()}
                        aria-label="Go back"
                        className="flex w-10 h-10 items-center justify-center rounded-[10px] hover:bg-q-stone-100 transition-colors"
                    >
                        <span className="material-symbols-outlined text-q-stone-700">arrow_back</span>
                    </button>
                    <div className="flex-1 px-3 min-w-0">
                        <h1 className="font-display text-lg font-semibold text-q-stone-900">Available Taxis</h1>
                        <p className="font-sans text-xs" style={{ color: "#1D3686" }}>
                            {taxis.length} of {TAXIS.length} shown · long distance
                        </p>
                    </div>
                    <button
                        onClick={() => { setSearchOpen(!searchOpen); if (searchOpen) setQuery(""); }}
                        aria-label={searchOpen ? "Close search" : "Search taxis"}
                        className="flex w-10 h-10 items-center justify-center rounded-[10px] transition-colors"
                        style={searchOpen ? { backgroundColor: "#111111", color: "#FFFFFF" } : { color: "#8A8678" }}
                    >
                        <span className="material-symbols-outlined">{searchOpen ? "close" : "search"}</span>
                    </button>
                </div>

                {searchOpen && (
                    <div className="px-4 pb-3">
                        <input
                            className="q-input w-full"
                            placeholder="Search by driver, plate or departure time"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            aria-label="Search taxis"
                            autoFocus
                        />
                        <div className="flex flex-wrap gap-2 mt-3">
                            {([
                                { id: "soonest",  label: "Soonest" },
                                { id: "cheapest", label: "Cheapest" },
                                { id: "emptiest", label: "Most seats" },
                            ] as { id: SortKey; label: string }[]).map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => setSort(s.id)}
                                    className="px-4 py-1.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider transition-all"
                                    style={sort === s.id
                                        ? { backgroundColor: "#111111", color: "#FFFFFF" }
                                        : { backgroundColor: "#EEF1EA", color: "#5C5A56" }}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="px-4 pb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm" style={{ color: "#1D3686" }}>distance</span>
                    <p className="font-sans text-sm font-semibold text-q-stone-700">{from} → {to}</p>
                </div>
            </header>

            {isConnecting && (
                <div className="flex items-center gap-2 px-4 py-2.5" style={{ backgroundColor: "#CDDFF6" }}>
                    <span className="material-symbols-outlined text-lg flex-shrink-0" style={{ color: "#111111" }}>alt_route</span>
                    <p className="font-sans text-xs font-bold" style={{ color: "#111111" }}>
                        Picking your connecting taxi from {from}
                    </p>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-4">
                {taxis.length === 0 ? (
                    <div className="py-16 flex flex-col items-center text-center">
                        <span className="material-symbols-outlined text-5xl mb-3" style={{ color: "#CDDFF6" }}>search_off</span>
                        <p className="font-sans font-bold" style={{ color: "#111111" }}>No taxis match that search</p>
                        <button onClick={() => setQuery("")} className="q-btn-outline mt-5">Clear search</button>
                    </div>
                ) : (
                    taxis.map((taxi) => {
                        const percent = Math.round(((taxi.totalSeats - taxi.seatsLeft) / taxi.totalSeats) * 100);
                        const seatLabel = taxi.urgent
                            ? `Filling Up · ${taxi.seatsLeft} Seat${taxi.seatsLeft === 1 ? "" : "s"} Left`
                            : `${taxi.seatsLeft} Seats Available`;

                        return (
                            <div key={taxi.id} className="q-card p-4 space-y-4">
                                <div className="flex justify-between items-start gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <span className="material-symbols-outlined text-sm" style={{ color: "#1D3686" }}>schedule</span>
                                            <p className="font-mono text-xs font-bold uppercase tracking-wider" style={{ color: "#1D3686" }}>{taxi.rule}</p>
                                        </div>
                                        <h4 className="font-sans text-base font-bold" style={{ color: "#111111" }}>{taxi.driver}</h4>
                                        <p className="font-sans text-xs text-q-stone-500">Plate: {taxi.plate} · {taxi.totalSeats} seater</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-sans text-xl font-black" style={{ color: "#111111", letterSpacing: "-0.02em" }}>R{taxi.fare}.00</p>
                                        <p className="font-mono text-[10px] font-bold text-q-stone-500 uppercase">Fixed Fare</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <div className={`flex items-center gap-1.5 ${taxi.urgent ? "text-red-600" : "text-q-stone-700"}`}>
                                            <span className="material-symbols-outlined text-lg">{taxi.urgent ? "warning" : "event_seat"}</span>
                                            <span className="font-sans text-sm font-bold">{seatLabel}</span>
                                        </div>
                                        <div className="mt-2 flex items-center gap-2">
                                            <div className="h-1.5 w-24 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(17,17,17,0.10)" }}>
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{ width: `${percent}%`, backgroundColor: taxi.urgent ? "#DC2626" : "#1D3686" }}
                                                />
                                            </div>
                                            <span className="font-mono text-[10px] font-bold text-q-stone-400">{percent}% Full</span>
                                        </div>
                                    </div>
                                    <VehicleTile
                                        tone="blue"
                                        className="w-24 h-16 rounded-[10px] flex-shrink-0"
                                        style={{ border: "1px solid rgba(17,17,17,0.07)" }}
                                    />
                                </div>

                                <button onClick={() => handleTaxiSelect(taxi)} className="q-btn-primary w-full justify-center">
                                    <span className="material-symbols-outlined text-xl">confirmation_number</span>
                                    Book Seat
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </main>
    );
}

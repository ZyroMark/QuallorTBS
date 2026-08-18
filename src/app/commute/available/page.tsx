"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/app/context/BookingContext";
import { useFleet } from "@/app/context/FleetContext";
import { VehicleTile } from "@/components/RouteArt";
import { PLACE_BY_NAME, popularRoutesFor } from "@/lib/places";
import { useProvince } from "@/lib/useProvince";

interface Taxi {
    id: string;
    driver: string;
    plate: string;
    fare: number;
    seatsLeft: number;
    totalSeats: number;
    rule: string;
    departureTime: string;
    urgent: boolean;
    disabled: boolean;
}

/** Departure slots handed out to whichever vehicles are cleared to run. */
const SLOTS = [
    { rule: "Next departure: 08:30 AM", departureTime: "08:30 AM", seatsLeft: 4, urgent: false },
    { rule: "Leaves when full",         departureTime: "09:15 AM", seatsLeft: 2, urgent: true },
    { rule: "Next departure: 09:40 AM", departureTime: "09:40 AM", seatsLeft: 9, urgent: false },
    { rule: "Next departure: 10:20 AM", departureTime: "10:20 AM", seatsLeft: 6, urgent: false },
];

type SortKey = "soonest" | "cheapest" | "emptiest";

export default function AvailableTaxisPage() {
    const router = useRouter();
    const { selectedRoute, setSelectedTaxi } = useBooking();
    const { vehicles, canCarryPassengers } = useFleet();

    const [searchOpen, setSearchOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState<SortKey>("soonest");
    const [hideFull, setHideFull] = useState(false);

    const { province } = useProvince();
    const from = selectedRoute?.from || province.commuteOrigin;
    const to = selectedRoute?.to || popularRoutesFor(province.id)[0].to;
    const isConnecting = Boolean(selectedRoute?.journeyId);

    // Only vehicles the fleet office has cleared can be booked. A suspended or
    // failed vehicle disappears from here the moment the fleet manager acts.
    const roadworthy = useMemo(() => vehicles.filter(canCarryPassengers), [vehicles, canCarryPassengers]);

    const allTaxis: Taxi[] = useMemo(() => {
        const baseFare = PLACE_BY_NAME[to]?.fare ?? 20;
        return roadworthy.map((v, i) => {
            const slot = SLOTS[i % SLOTS.length];
            return {
                id: v.id,
                driver: v.driverName,
                plate: v.plate,
                fare: baseFare,
                seatsLeft: slot.seatsLeft,
                totalSeats: v.capacity,
                rule: slot.rule,
                departureTime: slot.departureTime,
                urgent: slot.urgent,
                disabled: slot.seatsLeft === 0,
            };
        });
    }, [roadworthy, to]);

    const taxis = useMemo(() => {
        const q = query.trim().toLowerCase();
        let list = allTaxis.filter((t) =>
            !q || [t.driver, t.plate, t.id, t.departureTime].join(" ").toLowerCase().includes(q)
        );
        if (hideFull) list = list.filter((t) => !t.disabled);

        return [...list].sort((a, b) => {
            if (sort === "cheapest") return a.fare - b.fare;
            if (sort === "emptiest") return b.seatsLeft - a.seatsLeft;
            return a.departureTime.localeCompare(b.departureTime);
        });
    }, [allTaxis, query, sort, hideFull]);

    function handleTaxiClick(taxi: Taxi) {
        setSelectedTaxi({ id: taxi.id, name: taxi.driver, departureTime: taxi.departureTime, fare: taxi.fare });
        router.push("/commute/book");
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
                            {taxis.length} of {allTaxis.length} shown
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
                            placeholder="Search by operator, plate or departure time"
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
                            <button
                                onClick={() => setHideFull(!hideFull)}
                                className="px-4 py-1.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider transition-all"
                                style={hideFull
                                    ? { backgroundColor: "#1D3686", color: "#FFFFFF" }
                                    : { backgroundColor: "#EEF1EA", color: "#5C5A56" }}
                            >
                                Hide full
                            </button>
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
                        <span className="material-symbols-outlined text-5xl mb-3" style={{ color: "#CDDFF6" }}>
                            {allTaxis.length === 0 ? "no_transfer" : "search_off"}
                        </span>
                        <p className="font-sans font-bold" style={{ color: "#111111" }}>
                            {allTaxis.length === 0 ? "No taxis are running this route right now" : "No taxis match those filters"}
                        </p>
                        <p className="font-sans text-sm mt-1 mb-5 max-w-xs" style={{ color: "#8A8678", lineHeight: 1.6 }}>
                            {allTaxis.length === 0
                                ? "Every vehicle on this route is off the road for inspection or repair. Check again shortly."
                                : "Clear the search or turn off Hide full."}
                        </p>
                        {allTaxis.length > 0 && (
                            <button onClick={() => { setQuery(""); setHideFull(false); }} className="q-btn-outline">
                                Reset filters
                            </button>
                        )}
                    </div>
                ) : (
                    taxis.map((taxi) => {
                        const percent = taxi.totalSeats > 0
                            ? Math.round(((taxi.totalSeats - taxi.seatsLeft) / taxi.totalSeats) * 100)
                            : 100;
                        const seatLabel = taxi.seatsLeft === 0
                            ? "No Seats Available"
                            : taxi.urgent
                                ? `Filling Up · ${taxi.seatsLeft} Seat${taxi.seatsLeft === 1 ? "" : "s"} Left`
                                : `${taxi.seatsLeft} Seats Available`;

                        return (
                            <div key={taxi.id} className={`q-card p-4 space-y-4 ${taxi.disabled ? "opacity-50" : ""}`}>
                                <div className="flex justify-between items-start gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <span className="material-symbols-outlined text-sm" style={{ color: "#1D3686" }}>schedule</span>
                                            <p className="font-mono text-xs font-bold uppercase tracking-wider" style={{ color: "#1D3686" }}>{taxi.rule}</p>
                                        </div>
                                        <h4 className="font-sans text-base font-bold" style={{ color: "#111111" }}>{taxi.driver}</h4>
                                        <p className="font-sans text-xs text-q-stone-500">Plate: {taxi.plate}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-sans text-xl font-black" style={{ color: "#111111", letterSpacing: "-0.02em" }}>R{taxi.fare}.00</p>
                                        <p className="font-mono text-[10px] font-bold text-q-stone-500 uppercase">Fixed Fare</p>
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
                                            <div className="h-1.5 w-24 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(17,17,17,0.10)" }}>
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{ width: `${percent}%`, backgroundColor: taxi.disabled || taxi.urgent ? "#DC2626" : "#1D3686" }}
                                                />
                                            </div>
                                            <span className="font-mono text-[10px] font-bold text-q-stone-400">{percent}% Full</span>
                                        </div>
                                    </div>
                                    <VehicleTile
                                        tone="sage"
                                        className="w-24 h-16 rounded-[10px] flex-shrink-0"
                                        style={{ border: "1px solid rgba(17,17,17,0.07)" }}
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
                    })
                )}
            </div>
        </main>
    );
}

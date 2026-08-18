"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/app/context/BookingContext";
import AppLayout from "@/components/layout/AppLayout";
import RouteArt from "@/components/RouteArt";
import { placesFor, searchPlaces } from "@/lib/places";

const ORIGIN = "East London";

export default function HikingPage() {
    const router = useRouter();
    const { setSelectedRoute } = useBooking();
    const [query, setQuery] = useState("");
    const [showAll, setShowAll] = useState(false);

    const all = useMemo(() => placesFor("hiking").filter((p) => p.name !== ORIGIN), []);

    const results = useMemo(() => {
        const matches = query.trim()
            ? searchPlaces(query, "hiking").filter((p) => p.name !== ORIGIN)
            : all;
        return query.trim() || showAll ? matches : matches.slice(0, 5);
    }, [query, all, showAll]);

    function go(destination: string) {
        setSelectedRoute({ from: ORIGIN, to: destination, tripType: "hiking" });
        router.push("/hiking/available");
    }

    return (
        <AppLayout>
            <div className="q-container max-w-2xl py-8 pb-28">
                <div className="mb-6">
                    <h1 className="font-sans font-black text-3xl mb-1" style={{ color: "#111111", letterSpacing: "-0.03em" }}>
                        Hiking
                    </h1>
                    <p className="q-body">Long-distance inter-city travel across the Eastern Cape.</p>
                </div>

                {/* Search */}
                <div className="relative mb-3">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#AEA89C" }}>
                        search
                    </span>
                    <input
                        className="q-input-lg pl-12 pr-12 w-full"
                        placeholder="Where are you heading?"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        aria-label="Search long distance destinations"
                        onKeyDown={(e) => { if (e.key === "Enter" && results.length > 0) go(results[0].name); }}
                    />
                    {query && (
                        <button onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-4 top-1/2 -translate-y-1/2">
                            <span className="material-symbols-outlined" style={{ color: "#AEA89C" }}>close</span>
                        </button>
                    )}
                </div>

                {query && (
                    <p className="font-sans text-sm mb-5 px-1" style={{ color: "#8A8678" }}>
                        {results.length === 0
                            ? "No routes match that search."
                            : `${results.length} route${results.length === 1 ? "" : "s"} match "${query}". Press Enter to pick the first.`}
                    </p>
                )}

                {/* Departure info */}
                {!query && (
                    <div className="q-card p-4 flex items-center gap-3 mb-8">
                        <div
                            className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: "#E1EDF5", color: "#1D3686" }}
                        >
                            <span className="material-symbols-outlined">trip_origin</span>
                        </div>
                        <div>
                            <p className="font-mono text-[10px] font-bold uppercase tracking-wider" style={{ color: "#8A8678" }}>
                                Departure Point
                            </p>
                            <p className="font-sans font-semibold" style={{ color: "#111111" }}>East London Taxi Rank</p>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-sans font-black text-xl" style={{ color: "#111111", letterSpacing: "-0.02em" }}>
                        {query ? "Search Results" : "Popular Routes"}
                    </h2>
                    {!query && all.length > 5 && (
                        <button
                            onClick={() => setShowAll(!showAll)}
                            className="font-sans text-sm font-bold hover:underline"
                            style={{ color: "#1D3686" }}
                        >
                            {showAll ? "Show fewer" : `See all ${all.length}`}
                        </button>
                    )}
                </div>

                {results.length === 0 ? (
                    <div className="py-14 flex flex-col items-center text-center">
                        <span className="material-symbols-outlined text-5xl mb-3" style={{ color: "#CDDFF6" }}>search_off</span>
                        <p className="font-sans font-bold" style={{ color: "#111111" }}>Nothing found for &ldquo;{query}&rdquo;</p>
                        <p className="font-sans text-sm mt-1 mb-5" style={{ color: "#8A8678" }}>
                            Try a city such as Mthatha, Queenstown or Gqeberha.
                        </p>
                        <button onClick={() => setQuery("")} className="q-btn-outline">Clear search</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {results.map((route, i) => {
                            const wide = !query && results.length % 2 === 1 && i === results.length - 1;
                            return (
                                <button
                                    key={route.name}
                                    onClick={() => go(route.name)}
                                    className={`relative overflow-hidden group rounded-[18px] transition-all active:scale-95 ${wide ? "col-span-2 aspect-[16/6]" : "aspect-[4/5]"}`}
                                    style={{
                                        border: "1px solid rgba(17,17,17,0.07)",
                                        boxShadow: "0 2px 8px rgba(17,17,17,0.06)",
                                    }}
                                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 28px rgba(17,17,17,0.12)"; }}
                                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(17,17,17,0.06)"; }}
                                >
                                    <RouteArt labels={false} tone={i % 3 === 0 ? "blue" : i % 3 === 1 ? "sage" : "ink"} />
                                    <div className="absolute inset-0 flex flex-col justify-end p-4 text-left">
                                        <p
                                            className="font-sans font-black text-base leading-tight mb-0.5"
                                            style={{ color: i % 3 === 2 ? "#FFFCF9" : "#111111", letterSpacing: "-0.01em" }}
                                        >
                                            {route.name}
                                        </p>
                                        <p
                                            className="font-mono text-[10px] font-bold uppercase tracking-wider"
                                            style={{ color: i % 3 === 2 ? "rgba(255,252,249,0.70)" : "rgba(17,17,17,0.55)" }}
                                        >
                                            {route.region} · from R{route.fare}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

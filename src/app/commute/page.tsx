"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/app/context/BookingContext";
import AppLayout from "@/components/layout/AppLayout";
import RouteArt from "@/components/RouteArt";
import { placesFor, searchPlaces, type Place } from "@/lib/places";

const ORIGIN = "Beacon Bay";

export default function CommutePage() {
    const router = useRouter();
    const { setSelectedRoute, myBookings } = useBooking();
    const [query, setQuery] = useState("");

    const allDestinations = useMemo(
        () => placesFor("commute").filter((p) => p.name !== ORIGIN),
        []
    );

    const results = useMemo(() => {
        if (!query.trim()) return allDestinations;
        return searchPlaces(query, "commute").filter((p) => p.name !== ORIGIN);
    }, [query, allDestinations]);

    // Places this passenger has actually travelled to, newest first.
    const recent = useMemo(() => {
        const seen = new Set<string>();
        return myBookings
            .filter((b) => b.tripType === "commute" && b.status !== "cancelled")
            .map((b) => b.to)
            .filter((name) => {
                if (seen.has(name)) return false;
                seen.add(name);
                return true;
            })
            .slice(0, 3);
    }, [myBookings]);

    function go(name: string) {
        setSelectedRoute({ from: ORIGIN, to: name, tripType: "commute" });
        router.push("/commute/available");
    }

    return (
        <AppLayout>
            <div style={{ backgroundColor: "#FFFCF9", minHeight: "100vh" }}>

                {/* ── Hero band ── */}
                <div className="relative overflow-hidden" style={{ backgroundColor: "#EEF1EA", paddingTop: "3rem", paddingBottom: "3rem" }}>
                    <div className="q-container max-w-2xl">
                        <p className="q-eyebrow mb-3">Eastern Cape Network</p>
                        <h1
                            className="font-sans font-black mb-2"
                            style={{ fontSize: "clamp(2rem, 5vw, 3rem)", color: "#111111", letterSpacing: "-0.03em", lineHeight: 1.05 }}
                        >
                            Daily Commute
                        </h1>
                        <p className="font-sans text-base" style={{ color: "#5C5A56" }}>
                            Choose your destination on the Eastern Cape network.
                        </p>
                    </div>
                </div>

                <div className="q-container max-w-2xl py-8 pb-28">

                    {/* Search */}
                    <div className="relative mb-3">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#AEA89C" }}>
                            search
                        </span>
                        <input
                            className="q-input-lg pl-12 pr-12 w-full"
                            placeholder="Search destination in Eastern Cape"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            aria-label="Search destinations"
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && results.length > 0) go(results[0].name);
                            }}
                        />
                        {query && (
                            <button
                                onClick={() => setQuery("")}
                                aria-label="Clear search"
                                className="absolute right-4 top-1/2 -translate-y-1/2"
                            >
                                <span className="material-symbols-outlined" style={{ color: "#AEA89C" }}>close</span>
                            </button>
                        )}
                    </div>

                    {query && (
                        <p className="font-sans text-sm mb-5 px-1" style={{ color: "#8A8678" }}>
                            {results.length === 0
                                ? "No destinations match that search."
                                : `${results.length} destination${results.length === 1 ? "" : "s"} match "${query}". Press Enter to pick the first.`}
                        </p>
                    )}

                    {/* Current location banner */}
                    {!query && (
                        <div
                            className="relative rounded-[18px] overflow-hidden flex items-center justify-center mb-8"
                            style={{ height: "120px", border: "1px solid rgba(17,17,17,0.07)", boxShadow: "0 4px 16px rgba(17,17,17,0.08)" }}
                        >
                            <RouteArt labels={false} tone="blue" />
                            <div
                                className="relative flex items-center gap-2 px-4 py-2 rounded-full"
                                style={{ backgroundColor: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)" }}
                            >
                                <span className="material-symbols-outlined" style={{ color: "#111111" }}>my_location</span>
                                <span className="font-sans text-sm font-bold" style={{ color: "#111111" }}>
                                    Current Location: {ORIGIN}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Destinations */}
                    <h2 className="font-sans font-black text-xl mb-4" style={{ color: "#111111", letterSpacing: "-0.02em" }}>
                        {query ? "Search Results" : "Popular Destinations"}
                    </h2>

                    {results.length === 0 ? (
                        <div className="py-14 flex flex-col items-center text-center">
                            <span className="material-symbols-outlined text-5xl mb-3" style={{ color: "#CDDFF6" }}>search_off</span>
                            <p className="font-sans font-bold" style={{ color: "#111111" }}>Nothing found for &ldquo;{query}&rdquo;</p>
                            <p className="font-sans text-sm mt-1 mb-5" style={{ color: "#8A8678" }}>
                                Try a suburb name such as Vincent, Nahoon or Mdantsane.
                            </p>
                            <button onClick={() => setQuery("")} className="q-btn-outline">Clear search</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 mb-8">
                            {results.map((dest: Place, i) => {
                                const wide = !query && i === results.length - 1 && results.length % 2 === 1;
                                return (
                                    <button
                                        key={dest.name}
                                        onClick={() => go(dest.name)}
                                        className={`relative group cursor-pointer rounded-[16px] overflow-hidden active:scale-95 transition-all duration-200 ${wide ? "col-span-2" : ""}`}
                                        style={{
                                            aspectRatio: wide ? "16/5" : "4/3",
                                            border: "1px solid rgba(17,17,17,0.07)",
                                            boxShadow: "0 4px 16px rgba(17,17,17,0.07)",
                                        }}
                                        onMouseEnter={(e) => {
                                            (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                                            (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 28px rgba(17,17,17,0.12)";
                                        }}
                                        onMouseLeave={(e) => {
                                            (e.currentTarget as HTMLElement).style.transform = "";
                                            (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(17,17,17,0.07)";
                                        }}
                                    >
                                        <RouteArt labels={false} tone={i % 2 === 0 ? "blue" : "sage"} />
                                        <div className="absolute inset-0 flex flex-col justify-end p-4 text-left">
                                            <p className="font-sans font-black text-base" style={{ color: "#111111", letterSpacing: "-0.01em" }}>
                                                {dest.name}
                                            </p>
                                            <p className="font-mono text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(17,17,17,0.55)" }}>
                                                {dest.region} · from R{dest.fare}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Recent rides */}
                    {!query && recent.length > 0 && (
                        <>
                            <h2 className="font-sans font-black text-xl mb-4" style={{ color: "#111111", letterSpacing: "-0.02em" }}>
                                Recent Rides
                            </h2>
                            <div
                                className="rounded-[16px] overflow-hidden"
                                style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(17,17,17,0.07)", boxShadow: "0 2px 12px rgba(17,17,17,0.06)" }}
                            >
                                {recent.map((name, i) => (
                                    <button
                                        key={name}
                                        onClick={() => go(name)}
                                        className="w-full flex items-center gap-4 px-4 py-4 text-left transition-colors"
                                        style={{ borderTop: i === 0 ? undefined : "1px solid rgba(17,17,17,0.06)" }}
                                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#FFFCF9"; }}
                                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = ""; }}
                                    >
                                        <div
                                            className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
                                            style={{ backgroundColor: "#EEF1EA", color: "#5C5A56" }}
                                        >
                                            <span className="material-symbols-outlined">history</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-sans text-sm font-bold" style={{ color: "#111111" }}>{name}</p>
                                            <p className="font-sans text-xs" style={{ color: "#AEA89C" }}>Booked before from {ORIGIN}</p>
                                        </div>
                                        <span className="material-symbols-outlined" style={{ color: "#AEA89C" }}>chevron_right</span>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

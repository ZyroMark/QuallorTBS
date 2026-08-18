"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking, generateJourneyId } from "@/app/context/BookingContext";
import { useToast } from "@/components/Toast";
import RouteArt from "@/components/RouteArt";
import ShareButton from "@/components/ShareButton";
import { absoluteUrl, bookingShareText } from "@/lib/share";
import { onwardFrom, searchPlaces } from "@/lib/places";

export default function BookingConfirmationPage() {
    const router = useRouter();
    const { currentBooking, journeyLegs, setSelectedRoute, addBooking } = useBooking();
    const { toast } = useToast();

    const [addingLeg, setAddingLeg] = useState(false);
    const [legQuery, setLegQuery] = useState("");

    const bookingId = currentBooking?.bookingId || "QLR-XXXX-XXXX";
    const fare = currentBooking?.fare ?? 20;
    const tripType = currentBooking?.tripType ?? "commute";

    const legs = currentBooking ? journeyLegs(currentBooking) : [];
    const isMultiLeg = legs.length > 1;

    // The journey runs from the first leg's origin to the last leg's destination,
    // which is not the same as the leg that was just booked.
    const from = legs[0]?.from ?? currentBooking?.from ?? "Beacon Bay";
    const finalStop = legs[legs.length - 1]?.to ?? currentBooking?.to ?? "Amalinda";
    const journeyTotal = legs.reduce((sum, l) => sum + l.fare, 0) || fare;

    // Onward hotspots you can continue to from where this taxi drops you.
    const onwardOptions = useMemo(() => {
        const pool = onwardFrom(finalStop);
        const visited = new Set(legs.flatMap((l) => [l.from, l.to]));
        const matches = legQuery ? searchPlaces(legQuery) : pool;
        return matches.filter((p) => pool.some((o) => o.name === p.name) && !visited.has(p.name)).slice(0, 8);
    }, [finalStop, legs, legQuery]);

    function startConnectingLeg(destination: string, destinationKind: "commute" | "hiking") {
        if (!currentBooking) return;

        // Stamp the first leg with a journey id if it does not have one yet,
        // so both taxis read as a single trip in My Trips.
        let journeyId = currentBooking.journeyId;
        if (!journeyId) {
            journeyId = generateJourneyId();
            addBooking({ ...currentBooking, journeyId, legIndex: 0, legCount: 2 });
        }

        setSelectedRoute({
            from: finalStop,
            to: destination,
            tripType: destinationKind,
            journeyId,
            legIndex: legs.length,
        });

        toast(`Choosing your taxi from ${finalStop} to ${destination}`, "info");
        router.push(destinationKind === "hiking" ? "/hiking/available" : "/commute/available");
    }

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
                <h1 className="font-display text-lg font-semibold text-q-stone-900 flex-1 text-center">Booking Confirmed</h1>
                <ShareButton
                    title="My Quallor booking"
                    text={currentBooking ? legs.map(bookingShareText).join("\n\n") : `Quallor trip ${bookingId}`}
                    url={absoluteUrl("/trips")}
                />
            </header>

            <div className="flex-1 overflow-y-auto pb-24">
                {/* Success state */}
                <div className="flex flex-col items-center px-4 py-10 gap-6">
                    <div className="relative w-24 h-24 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full animate-pulse" style={{ backgroundColor: "#CDDFF6" }} />
                        <div
                            className="relative rounded-full w-16 h-16 flex items-center justify-center"
                            style={{ backgroundColor: "#111111", boxShadow: "0 4px 16px rgba(17,17,17,0.25)" }}
                        >
                            <span className="material-symbols-outlined text-white text-3xl">check</span>
                        </div>
                    </div>

                    <div className="text-center">
                        <h2 className="font-sans font-black text-2xl mb-2" style={{ color: "#111111", letterSpacing: "-0.02em" }}>
                            {isMultiLeg ? "Both seats are booked" : "Booking Confirmed"}
                        </h2>
                        <p className="q-body max-w-xs mx-auto">
                            Your taxi from <span className="font-semibold" style={{ color: "#1D3686" }}>{from}</span> to{" "}
                            <span className="font-semibold" style={{ color: "#1D3686" }}>{finalStop}</span> is confirmed.
                        </p>
                    </div>

                    <div className="w-full max-w-md q-card p-6 space-y-4">
                        <div className="flex justify-between items-center pb-4" style={{ borderBottom: "1px solid rgba(17,17,17,0.10)" }}>
                            <span className="font-sans text-sm" style={{ color: "#8A8678" }}>
                                {isMultiLeg ? `Total for ${legs.length} taxis` : "Amount Paid"}
                            </span>
                            <span className="font-sans text-2xl font-black" style={{ color: "#111111", letterSpacing: "-0.02em" }}>
                                R {journeyTotal}.00
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-sans text-sm" style={{ color: "#8A8678" }}>Booking ID</span>
                            <span className="font-mono text-sm" style={{ color: "#111111" }}>#{bookingId}</span>
                        </div>
                        {currentBooking?.seatNumber && (
                            <div className="flex justify-between items-center">
                                <span className="font-sans text-sm" style={{ color: "#8A8678" }}>Seat Number</span>
                                <span className="font-sans text-lg font-black" style={{ color: "#111111" }}>{currentBooking.seatNumber}</span>
                            </div>
                        )}
                        {currentBooking?.taxiName && (
                            <div className="flex justify-between items-center">
                                <span className="font-sans text-sm" style={{ color: "#8A8678" }}>Taxi</span>
                                <span className="font-sans text-sm font-semibold" style={{ color: "#111111" }}>{currentBooking.taxiName}</span>
                            </div>
                        )}
                    </div>

                    <button onClick={() => router.push("/commute/ticket")} className="q-btn-primary-lg w-full max-w-md justify-center">
                        <span className="material-symbols-outlined text-xl">confirmation_number</span>
                        View Digital Ticket
                    </button>
                </div>

                {/* ── Connecting taxi ── */}
                <div className="px-4 pb-8">
                    <div
                        className="rounded-[18px] overflow-hidden"
                        style={{ backgroundColor: "#EEF1EA", border: "1px solid rgba(17,17,17,0.07)" }}
                    >
                        <div className="p-5">
                            <div className="flex items-start gap-3 mb-4">
                                <span className="material-symbols-outlined flex-shrink-0" style={{ color: "#1D3686" }}>alt_route</span>
                                <div className="flex-1">
                                    <p className="font-sans font-black text-lg" style={{ color: "#111111", letterSpacing: "-0.02em" }}>
                                        Going further than {finalStop}?
                                    </p>
                                    <p className="font-sans text-sm mt-1" style={{ color: "#5C5A56", lineHeight: 1.6 }}>
                                        {isMultiLeg
                                            ? `Add another taxi from ${finalStop}. Every seat stays under this one journey, each with its own ticket.`
                                            : `Book a second taxi now from ${finalStop} onward. Both seats are held under one journey, each with its own ticket.`}
                                    </p>
                                </div>
                            </div>

                            {!addingLeg ? (
                                <button onClick={() => setAddingLeg(true)} className="q-btn-dark w-full justify-center">
                                    <span className="material-symbols-outlined text-lg">add</span>
                                    Add a connecting taxi
                                </button>
                            ) : (
                                <div>
                                    <div className="relative mb-3">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#AEA89C" }}>
                                            search
                                        </span>
                                        <input
                                            className="q-input-lg pl-12 w-full"
                                            placeholder={`Where to from ${finalStop}?`}
                                            value={legQuery}
                                            onChange={(e) => setLegQuery(e.target.value)}
                                            aria-label="Search onward destination"
                                            autoFocus
                                        />
                                    </div>

                                    {onwardOptions.length === 0 ? (
                                        <p className="font-sans text-sm py-4 text-center" style={{ color: "#8A8678" }}>
                                            No onward routes match that search.
                                        </p>
                                    ) : (
                                        <div
                                            className="rounded-[14px] overflow-hidden mb-3"
                                            style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(17,17,17,0.07)" }}
                                        >
                                            {onwardOptions.map((p, i) => (
                                                <button
                                                    key={p.name}
                                                    onClick={() => startConnectingLeg(p.name, p.kinds.includes("commute") ? "commute" : "hiking")}
                                                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                                                    style={{ borderTop: i === 0 ? undefined : "1px solid rgba(17,17,17,0.06)" }}
                                                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#FFFCF9"; }}
                                                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = ""; }}
                                                >
                                                    <div
                                                        className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
                                                        style={{ backgroundColor: "#E1EDF5", color: "#1D3686" }}
                                                    >
                                                        <span className="material-symbols-outlined text-lg">
                                                            {p.kinds.includes("hiking") && !p.kinds.includes("commute") ? "luggage" : "directions_bus"}
                                                        </span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-sans text-sm font-bold truncate" style={{ color: "#111111" }}>{p.name}</p>
                                                        <p className="font-sans text-xs" style={{ color: "#8A8678" }}>{p.region}</p>
                                                    </div>
                                                    <span className="font-sans text-sm font-black flex-shrink-0" style={{ color: "#111111" }}>
                                                        from R{p.fare}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <button onClick={() => { setAddingLeg(false); setLegQuery(""); }} className="q-btn-outline w-full justify-center">
                                        Not now
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Trip Summary */}
                <div className="px-4 pb-8">
                    <h3 className="font-sans font-black text-xl mb-4" style={{ color: "#111111", letterSpacing: "-0.02em" }}>
                        {isMultiLeg ? "Journey Summary" : "Trip Summary"}
                    </h3>
                    <div className="q-card p-4 space-y-4">
                        <div className="flex gap-4">
                            <div className="flex flex-col items-center py-1">
                                <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: "#111111" }} />
                                {legs.slice(1).map((_, i) => (
                                    <React.Fragment key={i}>
                                        <div className="w-px flex-1 my-1" style={{ backgroundColor: "rgba(17,17,17,0.20)", minHeight: "1.5rem" }} />
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#CDDFF6", border: "2px solid #1D3686" }} />
                                    </React.Fragment>
                                ))}
                                <div className="w-px flex-1 my-1" style={{ backgroundColor: "rgba(17,17,17,0.20)", minHeight: "1.5rem" }} />
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#111111" }} />
                            </div>
                            <div className="flex-1 flex flex-col gap-5">
                                <div>
                                    <p className="font-mono text-[10px] font-bold uppercase tracking-wider" style={{ color: "#8A8678" }}>Pickup</p>
                                    <p className="font-sans font-semibold" style={{ color: "#111111" }}>{from} Rank</p>
                                </div>
                                {legs.slice(1).map((leg) => (
                                    <div key={leg.bookingId}>
                                        <p className="font-mono text-[10px] font-bold uppercase tracking-wider" style={{ color: "#1D3686" }}>Change taxi</p>
                                        <p className="font-sans font-semibold" style={{ color: "#111111" }}>{leg.from} Rank</p>
                                        <p className="font-sans text-xs" style={{ color: "#8A8678" }}>
                                            {leg.taxiName} · Seat {leg.seatNumber} · {leg.departureTime}
                                        </p>
                                    </div>
                                ))}
                                <div>
                                    <p className="font-mono text-[10px] font-bold uppercase tracking-wider" style={{ color: "#8A8678" }}>Drop-off</p>
                                    <p className="font-sans font-semibold" style={{ color: "#111111" }}>{finalStop} Main Road</p>
                                </div>
                            </div>
                        </div>

                        <div className="w-full h-40 rounded-[12px] overflow-hidden relative">
                            <RouteArt from={from} to={finalStop} tone={tripType === "hiking" ? "blue" : "sage"} />
                            <button
                                onClick={() => router.push("/commute/tracking")}
                                className="absolute bottom-3 right-3 flex items-center gap-2 px-4 py-2 rounded-full font-sans text-xs font-bold"
                                style={{ backgroundColor: "rgba(255,255,255,0.94)", color: "#111111", boxShadow: "0 2px 8px rgba(17,17,17,0.15)" }}
                            >
                                <span className="material-symbols-outlined text-sm">map</span>
                                Open Map
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

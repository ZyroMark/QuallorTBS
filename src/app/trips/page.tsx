"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking, type BookingDetails } from "@/app/context/BookingContext";
import { useSettings } from "@/app/context/SettingsContext";
import { useToast } from "@/components/Toast";
import AppLayout from "@/components/layout/AppLayout";
import AuthGuard from "@/components/AuthGuard";
import RouteArt from "@/components/RouteArt";
import ShareButton from "@/components/ShareButton";
import { absoluteUrl, bookingShareText } from "@/lib/share";

type Tab = "upcoming" | "past" | "cancelled";

const TABS: { id: Tab; label: string }[] = [
    { id: "upcoming",  label: "Upcoming" },
    { id: "past",      label: "Past" },
    { id: "cancelled", label: "Cancelled" },
];

/** A trip is upcoming until the end of the day it departs. */
function isUpcoming(b: BookingDetails): boolean {
    if (b.status === "cancelled" || b.status === "completed") return false;
    const day = new Date(b.date);
    day.setHours(23, 59, 59, 999);
    return day.getTime() >= Date.now();
}

const CANCEL_WINDOW_MS = 30 * 60 * 1000;

function TripsContent() {
    const router = useRouter();
    const { myBookings, cancelBooking, setCurrentBooking, journeyLegs } = useBooking();
    const { topUp } = useSettings();
    const { toast } = useToast();

    const [tab, setTab] = useState<Tab>("upcoming");
    const [query, setQuery] = useState("");
    const [expanded, setExpanded] = useState<string | null>(null);
    const [confirming, setConfirming] = useState<string | null>(null);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return myBookings
            .filter((b) => {
                if (tab === "cancelled") return b.status === "cancelled";
                if (tab === "upcoming") return isUpcoming(b);
                return b.status !== "cancelled" && !isUpcoming(b);
            })
            .filter((b) => {
                if (!q) return true;
                return [b.from, b.to, b.taxiName, b.taxiId, b.bookingId, b.seatNumber]
                    .join(" ")
                    .toLowerCase()
                    .includes(q);
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [myBookings, tab, query]);

    // Count journeys rather than seats, so a two-taxi trip reads as one entry
    // and matches the number of cards actually shown.
    const counts = useMemo(() => {
        const leading = (b: BookingDetails) => !b.journeyId || (b.legIndex ?? 0) === 0;
        return {
            upcoming: myBookings.filter((b) => leading(b) && isUpcoming(b)).length,
            past: myBookings.filter((b) => leading(b) && b.status !== "cancelled" && !isUpcoming(b)).length,
            cancelled: myBookings.filter((b) => leading(b) && b.status === "cancelled").length,
        };
    }, [myBookings]);

    async function handleCancel(b: BookingDetails) {
        const departsAt = new Date(b.date).getTime();
        const refundable = departsAt - Date.now() > CANCEL_WINDOW_MS;

        // Await it: refunding before the cancellation lands would credit the
        // fare back for a trip that is still booked.
        await cancelBooking(b.bookingId);
        if (refundable) {
            topUp(b.fare, "Refund");
            toast(`Trip cancelled. R ${b.fare.toFixed(2)} returned to your credits.`, "success");
        } else {
            toast("Trip cancelled. Inside 30 minutes of departure the fare is not refunded.", "info");
        }
        setConfirming(null);
    }

    function openTicket(b: BookingDetails) {
        setCurrentBooking(b);
        router.push(b.tripType === "hiking" ? "/hiking/confirmation" : "/commute/ticket");
    }

    function rebook(b: BookingDetails) {
        setCurrentBooking(b);
        router.push(b.tripType === "hiking" ? "/hiking/available" : "/commute/available");
    }

    return (
        <AppLayout>
            <div className="q-container max-w-2xl py-8 pb-28">
                <div className="mb-6">
                    <h1 className="font-sans font-black text-3xl" style={{ color: "#111111", letterSpacing: "-0.03em" }}>
                        My Trips
                    </h1>
                    <p className="font-sans text-sm mt-1" style={{ color: "#8A8678" }}>
                        Every seat you have booked, with tickets you can reopen at any time.
                    </p>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#AEA89C" }}>
                        search
                    </span>
                    <input
                        className="q-input-lg pl-12 w-full"
                        placeholder="Search by route, taxi or booking reference"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        aria-label="Search trips"
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

                {/* Tabs */}
                <div className="flex gap-1 p-1 rounded-[12px] mb-6" style={{ backgroundColor: "#EEF1EA" }}>
                    {TABS.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className="flex-1 py-2.5 rounded-[10px] font-sans text-sm font-bold transition-all duration-200"
                            style={tab === t.id
                                ? { backgroundColor: "#FFFFFF", color: "#111111", boxShadow: "0 1px 3px rgba(17,17,17,0.08)" }
                                : { color: "#8A8678" }}
                        >
                            {t.label}
                            <span className="font-mono text-xs ml-1.5" style={{ color: tab === t.id ? "#1D3686" : "#AEA89C" }}>
                                {counts[t.id]}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Results */}
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <span className="material-symbols-outlined text-6xl mb-4" style={{ color: "#CDDFF6" }}>
                            {query ? "search_off" : tab === "cancelled" ? "event_busy" : "confirmation_number"}
                        </span>
                        <h3 className="font-sans font-black text-xl mb-2" style={{ color: "#111111" }}>
                            {query
                                ? "Nothing matches that search"
                                : tab === "upcoming"
                                ? "No upcoming trips"
                                : tab === "past"
                                ? "No past trips yet"
                                : "No cancelled trips"}
                        </h3>
                        <p className="font-sans text-sm mb-6 max-w-xs" style={{ color: "#8A8678", lineHeight: 1.6 }}>
                            {query
                                ? "Try a different route name or booking reference."
                                : "Book a seat and it appears here with its ticket."}
                        </p>
                        {!query && (
                            <button onClick={() => router.push("/commute")} className="q-btn-dark">
                                Book a ride
                                <span className="material-symbols-outlined text-lg">arrow_forward</span>
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filtered.map((b, i) => {
                            const legs = journeyLegs(b);
                            const isMultiLeg = legs.length > 1;
                            const isOpen = expanded === b.bookingId;
                            const cancelled = b.status === "cancelled";
                            // Only show the leading leg of a journey, the rest nest inside it.
                            if (isMultiLeg && (b.legIndex ?? 0) > 0) return null;

                            return (
                                <div
                                    key={b.bookingId}
                                    className="rounded-[18px] overflow-hidden"
                                    style={{
                                        backgroundColor: "#FFFFFF",
                                        border: i === 0 && tab === "upcoming" ? "1.5px solid #1D3686" : "1px solid rgba(17,17,17,0.07)",
                                        boxShadow: "0 2px 12px rgba(17,17,17,0.06)",
                                        opacity: cancelled ? 0.72 : 1,
                                    }}
                                >
                                    {/* Banner, only on the leading upcoming trip */}
                                    {i === 0 && tab === "upcoming" && (
                                        <div className="h-32">
                                            <RouteArt
                                                from={b.from}
                                                to={isMultiLeg ? legs[legs.length - 1].to : b.to}
                                                tone={b.tripType === "hiking" ? "blue" : "sage"}
                                                badge={b.tripType === "hiking" ? "Long Distance" : "Local Commute"}
                                            />
                                        </div>
                                    )}

                                    <div className="p-4 space-y-3">
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div
                                                    className="w-12 h-12 rounded-[12px] flex items-center justify-center flex-shrink-0"
                                                    style={{ backgroundColor: "#EEF1EA", color: "#111111" }}
                                                >
                                                    <span className="material-symbols-outlined">
                                                        {isMultiLeg ? "alt_route" : "directions_bus"}
                                                    </span>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-sans font-bold truncate" style={{ color: "#111111" }}>
                                                        {isMultiLeg ? `${legs.length}-taxi journey` : b.taxiName}
                                                    </p>
                                                    <p className="font-sans text-xs flex items-center gap-1 mt-0.5" style={{ color: "#8A8678" }}>
                                                        <span className="material-symbols-outlined text-[12px]">event_seat</span>
                                                        {isMultiLeg
                                                            ? legs.map((l) => `Seat ${l.seatNumber}`).join(" · ")
                                                            : `Seat ${b.seatNumber} · ${b.taxiId}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="font-sans font-black text-lg" style={{ color: "#111111", letterSpacing: "-0.02em" }}>
                                                    R {legs.reduce((sum, l) => sum + l.fare, 0).toFixed(2)}
                                                </p>
                                                <span
                                                    className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                                                    style={cancelled
                                                        ? { backgroundColor: "rgba(220,38,38,0.08)", color: "#DC2626" }
                                                        : b.status === "in-transit"
                                                        ? { backgroundColor: "rgba(22,163,74,0.10)", color: "#16A34A" }
                                                        : { backgroundColor: "rgba(29,54,134,0.08)", color: "#1D3686" }}
                                                >
                                                    {cancelled ? "Cancelled" : b.status === "in-transit" ? "On board" : "Confirmed"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Route line */}
                                        <div className="pt-3 flex justify-between items-center gap-3" style={{ borderTop: "1px solid rgba(17,17,17,0.07)" }}>
                                            <p className="font-sans text-sm flex items-center gap-1.5 min-w-0" style={{ color: "#5C5A56" }}>
                                                <span className="material-symbols-outlined text-[14px] flex-shrink-0">location_on</span>
                                                <span className="truncate">
                                                    {b.from} → {isMultiLeg ? legs[legs.length - 1].to : b.to}
                                                </span>
                                            </p>
                                            <p className="font-sans text-xs flex-shrink-0" style={{ color: "#AEA89C" }}>
                                                {new Date(b.date).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
                                            </p>
                                        </div>

                                        {/* Legs of a connecting journey */}
                                        {isMultiLeg && (
                                            <div className="rounded-[12px] p-3 space-y-2.5" style={{ backgroundColor: "#FFFCF9", border: "1px solid rgba(17,17,17,0.06)" }}>
                                                {legs.map((leg, li) => (
                                                    <div key={leg.bookingId} className="flex items-center gap-3">
                                                        <span
                                                            className="w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-bold flex-shrink-0"
                                                            style={{ backgroundColor: "#CDDFF6", color: "#111111" }}
                                                        >
                                                            {li + 1}
                                                        </span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-sans text-xs font-bold truncate" style={{ color: "#111111" }}>
                                                                {leg.from} → {leg.to}
                                                            </p>
                                                            <p className="font-sans text-[10px]" style={{ color: "#8A8678" }}>
                                                                {leg.taxiName} · Seat {leg.seatNumber} · {leg.departureTime}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => openTicket(leg)}
                                                            className="font-mono text-[10px] font-bold uppercase px-2.5 py-1.5 rounded-full flex-shrink-0"
                                                            style={{ backgroundColor: "#EEF1EA", color: "#111111" }}
                                                        >
                                                            Ticket
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Expanded detail */}
                                        {isOpen && (
                                            <div className="rounded-[12px] p-3 grid grid-cols-2 gap-y-3" style={{ backgroundColor: "#FFFCF9", border: "1px solid rgba(17,17,17,0.06)" }}>
                                                {[
                                                    { k: "Booking reference", v: b.bookingId },
                                                    { k: "Departure", v: b.departureTime || "Leaves when full" },
                                                    { k: "Passenger", v: b.passengerName },
                                                    { k: "Paid with", v: b.paymentMethod === "cash" ? "Cash on board" : b.paymentMethod === "card" ? "Card on board" : "Quallor credits" },
                                                    { k: "Service", v: b.tripType === "hiking" ? "Long distance" : "Daily commute" },
                                                    { k: "Boarded", v: b.boardedAt ? new Date(b.boardedAt).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" }) : "Not yet" },
                                                ].map((row) => (
                                                    <div key={row.k}>
                                                        <p className="font-mono text-[9px] font-bold uppercase tracking-wider" style={{ color: "#AEA89C" }}>{row.k}</p>
                                                        <p className="font-sans text-xs font-semibold mt-0.5" style={{ color: "#111111" }}>{row.v}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Cancel confirmation */}
                                        {confirming === b.bookingId ? (
                                            <div className="rounded-[12px] p-3" style={{ backgroundColor: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.22)" }}>
                                                <p className="font-sans text-sm font-bold mb-1" style={{ color: "#DC2626" }}>
                                                    Cancel this {isMultiLeg ? "leg" : "trip"}?
                                                </p>
                                                <p className="font-sans text-xs mb-3" style={{ color: "rgba(17,17,17,0.70)", lineHeight: 1.6 }}>
                                                    {new Date(b.date).getTime() - Date.now() > CANCEL_WINDOW_MS
                                                        ? `R ${b.fare.toFixed(2)} goes back to your Quallor credits.`
                                                        : "Departure is within 30 minutes, so the fare is not refunded."}
                                                </p>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setConfirming(null)}
                                                        className="flex-1 py-2.5 rounded-full font-sans text-xs font-bold"
                                                        style={{ backgroundColor: "#FFFFFF", color: "#111111", border: "1px solid rgba(17,17,17,0.14)" }}
                                                    >
                                                        Keep my seat
                                                    </button>
                                                    <button
                                                        onClick={() => handleCancel(b)}
                                                        className="flex-1 py-2.5 rounded-full font-sans text-xs font-bold"
                                                        style={{ backgroundColor: "#DC2626", color: "#FFFFFF" }}
                                                    >
                                                        Yes, cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {!cancelled && !isMultiLeg && (
                                                    <button
                                                        onClick={() => openTicket(b)}
                                                        className="flex-1 min-w-[7rem] py-2.5 rounded-full font-sans text-xs font-bold flex items-center justify-center gap-1.5"
                                                        style={{ backgroundColor: "#111111", color: "#FFFFFF" }}
                                                    >
                                                        <span className="material-symbols-outlined text-base">confirmation_number</span>
                                                        View Ticket
                                                    </button>
                                                )}
                                                {cancelled && (
                                                    <button
                                                        onClick={() => rebook(b)}
                                                        className="flex-1 min-w-[7rem] py-2.5 rounded-full font-sans text-xs font-bold flex items-center justify-center gap-1.5"
                                                        style={{ backgroundColor: "#111111", color: "#FFFFFF" }}
                                                    >
                                                        <span className="material-symbols-outlined text-base">refresh</span>
                                                        Book Again
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setExpanded(isOpen ? null : b.bookingId)}
                                                    className="flex-1 min-w-[6rem] py-2.5 rounded-full font-sans text-xs font-bold"
                                                    style={{ backgroundColor: "#EEF1EA", color: "#111111" }}
                                                >
                                                    {isOpen ? "Hide details" : "Details"}
                                                </button>
                                                <ShareButton
                                                    variant="pill"
                                                    label="Share"
                                                    className="flex-1 min-w-[6rem] justify-center !py-2.5 !text-xs"
                                                    title="My Quallor trip"
                                                    text={legs.map(bookingShareText).join("\n\n")}
                                                    url={absoluteUrl("/trips")}
                                                />
                                                {!cancelled && isUpcoming(b) && (
                                                    <button
                                                        onClick={() => setConfirming(b.bookingId)}
                                                        aria-label="Cancel trip"
                                                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                                        style={{ border: "1.5px solid rgba(220,38,38,0.22)", color: "#DC2626" }}
                                                    >
                                                        <span className="material-symbols-outlined text-lg">close</span>
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

export default function TripsPage() {
    return (
        <AuthGuard>
            <TripsContent />
        </AuthGuard>
    );
}

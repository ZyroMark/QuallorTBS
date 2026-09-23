"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useBooking } from "@/app/context/BookingContext";
import { useSettings } from "@/app/context/SettingsContext";
import { useToast } from "@/components/Toast";
import { share, absoluteUrl, bookingShareText } from "@/lib/share";
import type { Journey } from "@/lib/journeyClock";

const TrackingMap = dynamic(() => import("@/components/TrackingMap"), { ssr: false });

export default function TrackingPage() {
    const router = useRouter();
    const { currentBooking, isLoading: bookingLoading } = useBooking();
    const { triggerSos, contacts } = useSettings();
    const { toast } = useToast();
    const [journey, setJourney] = useState<Journey | null>(null);
    const [now, setNow] = useState(() => Date.now());
    const [sosArmed, setSosArmed] = useState(false);

    const from = currentBooking?.from || "Beacon Bay";
    const to = currentBooking?.to || "Amalinda";
    const taxiId = currentBooking?.taxiId || "TX-402";
    const taxiName = currentBooking?.taxiName || "Khululeka Express";
    // One saved clock per booking, so leaving this screen never restarts the trip.
    const journeyKey = currentBooking?.bookingId ?? `${from}|${to}|${taxiId}`;

    // The map owns the trip clock; this just re-renders so the ETA reads it.
    useEffect(() => {
        if (!journey) return;
        const timer = setInterval(() => {
            const t = Date.now();
            setNow(t);
            if (t >= journey.startedAt + journey.durationMs) clearInterval(timer);
        }, 250);
        return () => clearInterval(timer);
    }, [journey]);

    const remainingMs = journey
        ? Math.min(journey.durationMs, Math.max(0, journey.startedAt + journey.durationMs - now))
        : null;
    const progress = journey && journey.durationMs > 0
        ? Math.min(100, Math.round(((journey.durationMs - (remainingMs ?? 0)) / journey.durationMs) * 100))
        : 0;
    const arrived = remainingMs === 0;

    const pad = (n: number) => n.toString().padStart(2, "0");
    const formatEta = (ms: number | null) => {
        if (ms === null) return "--:--";
        const total = Math.ceil(ms / 1000);
        const h = Math.floor(total / 3600);
        const m = Math.floor((total % 3600) / 60);
        const s = total % 60;
        return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
    };

    return (
        <main className="h-screen w-full flex flex-col overflow-hidden">
            {/* Map - top 55% */}
            <div className="relative" style={{ height: "55%" }}>
                {bookingLoading ? (
                    // Wait for the booking so the map starts on the right trip, not the placeholder route.
                    <div className="w-full h-full" style={{ backgroundColor: "#E1EDF5" }} />
                ) : (
                    <TrackingMap from={from} to={to} taxiId={taxiId} journeyKey={journeyKey} onJourney={setJourney} />
                )}
                <button
                    onClick={() => router.back()}
                    className="absolute top-4 right-4 z-[1001] flex w-10 h-10 items-center justify-center rounded-[10px] bg-white border border-q-stone-200 shadow-q-sm text-q-stone-700"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>

            {/* Bottom sheet */}
            <div className="flex flex-col bg-white border-t-2 border-q-stone-200 rounded-t-[20px] shadow-q-xl overflow-y-auto" style={{ flex: 1 }}>
                {/* Drag handle */}
                <div className="flex justify-center pt-3 pb-1">
                    <div className="w-12 h-1.5 rounded-full bg-q-stone-200" />
                </div>

                <div className="px-5 pt-2 pb-6 flex-1">
                    {/* Destination & ETA */}
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="font-sans text-[10px] font-bold text-q-stone-500 uppercase tracking-widest">Heading to</p>
                            <h2 className="font-display text-2xl font-bold text-q-stone-900">{to}</h2>
                            <p className="font-sans text-xs font-semibold text-q-brown mt-0.5">{taxiName} · {taxiId}</p>
                        </div>
                        <div className="text-right bg-q-brown-50 border border-q-brown-200 rounded-[14px] px-4 py-3">
                            <p className="font-sans text-[10px] font-bold text-q-stone-500 uppercase">ETA</p>
                            <p className="font-display text-2xl font-bold text-q-brown tabular-nums">{formatEta(remainingMs)}</p>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-4">
                        <div className="flex justify-between font-sans text-xs font-semibold text-q-stone-500 mb-1.5">
                            <span>{from}</span>
                            <span>{to}</span>
                        </div>
                        <div className="h-2 w-full bg-q-stone-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-q-brown rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="font-sans text-[10px] text-q-stone-400 text-center mt-1">{progress}% of journey completed</p>
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        <button
                            onClick={async () => {
                                const outcome = await share({
                                    title: "Track my Quallor trip",
                                    text: currentBooking
                                        ? `${bookingShareText(currentBooking)}\nI am on my way, follow my taxi live.`
                                        : `I am travelling from ${from} to ${to} with Quallor.`,
                                    url: absoluteUrl("/commute/tracking"),
                                });
                                if (outcome === "copied") toast("Trip link copied to clipboard", "success");
                                else if (outcome === "shared") toast("Trip shared", "success");
                                else if (outcome === "failed") toast("Could not share on this device", "error");
                            }}
                            className="flex flex-col items-center gap-1.5 p-3 rounded-[12px] bg-q-brown-50 border border-q-brown-200 text-q-brown"
                        >
                            <span className="material-symbols-outlined">ios_share</span>
                            <span className="font-sans text-[10px] font-bold uppercase">Share</span>
                        </button>
                        <a
                            href="tel:+27430000000"
                            className="flex flex-col items-center gap-1.5 p-3 rounded-[12px] bg-blue-50 border border-blue-200 text-blue-600"
                        >
                            <span className="material-symbols-outlined">call</span>
                            <span className="font-sans text-[10px] font-bold uppercase">Contact</span>
                        </a>
                        <button
                            onClick={async () => {
                                if (!sosArmed) {
                                    setSosArmed(true);
                                    toast("Tap SOS again to confirm the alert", "info");
                                    setTimeout(() => setSosArmed(false), 5000);
                                    return;
                                }
                                const event = await triggerSos(`${from} to ${to}`);
                                setSosArmed(false);
                                if (!event) {
                                    toast("The SOS could not be recorded. Try again.", "error");
                                    return;
                                }
                                toast(
                                    event.notified.length
                                        ? `SOS sent to ${event.notified.join(", ")}`
                                        : "SOS recorded. Add a trusted contact so someone is alerted.",
                                    event.notified.length ? "success" : "error"
                                );
                            }}
                            className="flex flex-col items-center gap-1.5 p-3 rounded-[12px] border transition-colors"
                            style={sosArmed
                                ? { backgroundColor: "#DC2626", borderColor: "#DC2626", color: "#FFFFFF" }
                                : { backgroundColor: "rgba(220,38,38,0.06)", borderColor: "rgba(220,38,38,0.25)", color: "#DC2626" }}
                        >
                            <span className="material-symbols-outlined">emergency</span>
                            <span className="font-sans text-[10px] font-bold uppercase">
                                {sosArmed ? "Confirm" : "SOS"}
                            </span>
                        </button>
                    </div>

                    {contacts.filter((c) => c.canSeeLocation).length === 0 && (
                        <button
                            onClick={() => router.push("/safety/contacts")}
                            className="w-full flex items-center gap-2 p-3 mb-4 rounded-[12px] text-left"
                            style={{ backgroundColor: "#EEF1EA", border: "1px solid rgba(17,17,17,0.07)" }}
                        >
                            <span className="material-symbols-outlined text-lg flex-shrink-0" style={{ color: "#1D3686" }}>person_add</span>
                            <span className="font-sans text-xs flex-1" style={{ color: "#5C5A56" }}>
                                No trusted contact yet. Add one so an SOS reaches somebody.
                            </span>
                            <span className="material-symbols-outlined text-base flex-shrink-0" style={{ color: "#AEA89C" }}>chevron_right</span>
                        </button>
                    )}

                    {/* Route line */}
                    <div className="flex items-center gap-3 p-3 rounded-[12px] bg-q-bg-section border border-q-stone-200">
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <div className="w-px h-4 bg-q-stone-300" />
                            <div className="w-2 h-2 rounded-full bg-q-brown" />
                        </div>
                        <div className="flex-1">
                            <p className="font-sans text-xs text-q-stone-500">From: <span className="text-q-stone-900 font-semibold">{from}</span></p>
                            <p className="font-sans text-xs text-q-stone-500 mt-1">To: <span className="text-q-brown font-semibold">{to}</span></p>
                        </div>
                        <div className="text-right">
                            <p className="font-sans text-[10px] font-bold text-q-stone-500 uppercase">Status</p>
                            <span className="font-sans text-[10px] font-bold text-green-600 uppercase">{arrived ? "Arrived" : "In Transit"}</span>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

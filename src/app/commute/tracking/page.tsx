"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useBooking } from "@/app/context/BookingContext";
import { useSettings } from "@/app/context/SettingsContext";
import { useToast } from "@/components/Toast";
import { share, absoluteUrl, bookingShareText } from "@/lib/share";

const TrackingMap = dynamic(() => import("@/components/TrackingMap"), { ssr: false });

export default function TrackingPage() {
    const router = useRouter();
    const { currentBooking } = useBooking();
    const { triggerSos, contacts } = useSettings();
    const { toast } = useToast();
    const [minutes, setMinutes] = useState(12);
    const [seconds, setSeconds] = useState(0);
    const [mapProgress, setMapProgress] = useState(0);
    const [sosArmed, setSosArmed] = useState(false);

    const from = currentBooking?.from || "Beacon Bay";
    const to = currentBooking?.to || "Amalinda";
    const taxiId = currentBooking?.taxiId || "TX-402";
    const taxiName = currentBooking?.taxiName || "Khululeka Express";

    useEffect(() => {
        const timer = setInterval(() => {
            setSeconds((s) => {
                if (s > 0) return s - 1;
                setMinutes((m) => {
                    if (m <= 0) { clearInterval(timer); return 0; }
                    return m - 1;
                });
                return 59;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const pad = (n: number) => n.toString().padStart(2, "0");

    return (
        <main className="h-screen w-full flex flex-col overflow-hidden">
            {/* Map - top 55% */}
            <div className="relative" style={{ height: "55%" }}>
                <TrackingMap from={from} to={to} taxiId={taxiId} onProgress={setMapProgress} />
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
                            <p className="font-display text-2xl font-bold text-q-brown tabular-nums">{pad(minutes)}:{pad(seconds)}</p>
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
                                style={{ width: `${mapProgress}%` }}
                            />
                        </div>
                        <p className="font-sans text-[10px] text-q-stone-400 text-center mt-1">{mapProgress}% of journey completed</p>
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
                            onClick={() => {
                                if (!sosArmed) {
                                    setSosArmed(true);
                                    toast("Tap SOS again to confirm the alert", "info");
                                    setTimeout(() => setSosArmed(false), 5000);
                                    return;
                                }
                                const event = triggerSos(`${from} to ${to}`);
                                setSosArmed(false);
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
                            <span className="font-sans text-[10px] font-bold text-green-600 uppercase">In Transit</span>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

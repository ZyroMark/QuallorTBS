"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/app/context/BookingContext";
import AppLayout from "@/components/layout/AppLayout";

export default function CommutePage() {
    const router = useRouter();
    const { setSelectedRoute } = useBooking();

    const destinations = [
        { name: "Beacon Bay",  region: "East London",          img: "https://images.unsplash.com/photo-1549423155-227364ac5d14?q=80&w=400" },
        { name: "Amalinda",    region: "Residential District", img: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?q=80&w=400" },
        { name: "Vincent",     region: "Business Hub",         img: "https://images.unsplash.com/photo-1514565131-fce0801e5785?q=80&w=400" },
        { name: "Mdantsane",   region: "Main Township",        img: "https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=400" },
        { name: "Nahoon",      region: "Beach & Surf",         img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800", wide: true },
    ];

    function handleDestinationClick(name: string) {
        setSelectedRoute({ from: "Beacon Bay", to: name, tripType: "commute" });
        router.push("/commute/available");
    }

    return (
        <AppLayout>
            <div style={{ backgroundColor: "#FFFCF9", minHeight: "100vh" }}>

                {/* ── Hero band ── */}
                <div
                    className="relative overflow-hidden"
                    style={{ backgroundColor: "#EEF1EA", paddingTop: "3rem", paddingBottom: "3rem" }}
                >
                    <div className="q-container max-w-2xl">
                        <p
                            className="font-sans font-bold text-xs uppercase tracking-widest mb-3"
                            style={{ color: "#8A8678" }}
                        >
                            Eastern Cape Network
                        </p>
                        <h1
                            className="font-sans font-black mb-2"
                            style={{
                                fontSize: "clamp(2rem, 5vw, 3rem)",
                                color: "#111111",
                                letterSpacing: "-0.03em",
                                lineHeight: 1.05,
                            }}
                        >
                            Daily Commute
                        </h1>
                        <p className="font-sans text-base" style={{ color: "#5C5A56" }}>
                            Choose your destination on the Eastern Cape network.
                        </p>
                    </div>
                </div>

                <div className="q-container max-w-2xl py-8 pb-24">

                    {/* Search */}
                    <div className="relative mb-6">
                        <span
                            className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2"
                            style={{ color: "#AEA89C" }}
                        >
                            search
                        </span>
                        <input
                            className="q-input-lg pl-12 w-full"
                            placeholder="Search destination in Eastern Cape"
                        />
                    </div>

                    {/* Current location banner */}
                    <div
                        className="relative rounded-[18px] overflow-hidden flex items-center justify-center mb-8"
                        style={{
                            height: "120px",
                            backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=600')",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            border: "1px solid rgba(17,17,17,0.07)",
                            boxShadow: "0 4px 16px rgba(17,17,17,0.08)",
                        }}
                    >
                        <div className="absolute inset-0" style={{ backgroundColor: "rgba(17,17,17,0.40)" }} />
                        <div
                            className="relative flex items-center gap-2 px-4 py-2 rounded-full"
                            style={{
                                backgroundColor: "rgba(255,255,255,0.90)",
                                backdropFilter: "blur(8px)",
                            }}
                        >
                            <span className="material-symbols-outlined" style={{ color: "#111111" }}>my_location</span>
                            <span className="font-sans text-sm font-bold" style={{ color: "#111111" }}>
                                Current Location: Beacon Bay
                            </span>
                        </div>
                    </div>

                    {/* Popular Destinations */}
                    <h2
                        className="font-sans font-black text-xl mb-4"
                        style={{ color: "#111111", letterSpacing: "-0.02em" }}
                    >
                        Popular Destinations
                    </h2>
                    <div className="grid grid-cols-2 gap-3 mb-8">
                        {destinations.map((dest, i) => (
                            <button
                                key={i}
                                onClick={() => handleDestinationClick(dest.name)}
                                className={`relative group cursor-pointer rounded-[16px] overflow-hidden active:scale-95 transition-all duration-200 ${dest.wide ? "col-span-2" : ""}`}
                                style={{
                                    aspectRatio: dest.wide ? "16/5" : "4/3",
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
                                <div
                                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                                    style={{
                                        backgroundImage: `url("${dest.img}")`,
                                    }}
                                />
                                <div
                                    className="absolute inset-0"
                                    style={{
                                        background: "linear-gradient(to top, rgba(17,17,17,0.75) 0%, rgba(17,17,17,0.10) 60%)",
                                    }}
                                />
                                <div className="absolute bottom-0 left-0 p-4 text-left">
                                    <p
                                        className="font-sans font-black text-base"
                                        style={{ color: "#FFFFFF", letterSpacing: "-0.01em" }}
                                    >
                                        {dest.name}
                                    </p>
                                    <p
                                        className="font-sans text-[10px] font-bold uppercase tracking-wider"
                                        style={{ color: "rgba(255,255,255,0.65)" }}
                                    >
                                        {dest.region}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Recent Rides */}
                    <h2
                        className="font-sans font-black text-xl mb-4"
                        style={{ color: "#111111", letterSpacing: "-0.02em" }}
                    >
                        Recent Rides
                    </h2>
                    <div
                        className="rounded-[16px] overflow-hidden"
                        style={{
                            backgroundColor: "#FFFFFF",
                            border: "1px solid rgba(17,17,17,0.07)",
                            boxShadow: "0 2px 12px rgba(17,17,17,0.06)",
                        }}
                    >
                        {[
                            { name: "Hemingways Mall",     dist: "2.4 km away" },
                            { name: "East London Airport", dist: "12.1 km away" },
                        ].map((item, i) => (
                            <button
                                key={i}
                                className="w-full flex items-center gap-4 px-4 py-4 text-left transition-colors"
                                style={{
                                    borderBottom: i === 0 ? "1px solid rgba(17,17,17,0.06)" : "none",
                                }}
                                onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLElement).style.backgroundColor = "#FFFCF9";
                                }}
                                onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLElement).style.backgroundColor = "";
                                }}
                            >
                                <div
                                    className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: "#EEF1EA", color: "#5C5A56" }}
                                >
                                    <span className="material-symbols-outlined">history</span>
                                </div>
                                <div className="flex-1">
                                    <p className="font-sans text-sm font-bold" style={{ color: "#111111" }}>
                                        {item.name}
                                    </p>
                                    <p className="font-sans text-xs" style={{ color: "#AEA89C" }}>
                                        {item.dist}
                                    </p>
                                </div>
                                <span className="material-symbols-outlined" style={{ color: "#AEA89C" }}>
                                    chevron_right
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

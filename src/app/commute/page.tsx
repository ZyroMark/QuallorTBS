"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/app/context/BookingContext";
import AppLayout from "@/components/layout/AppLayout";

export default function CommutePage() {
    const router = useRouter();
    const { setSelectedRoute } = useBooking();

    const destinations = [
        { name: "Beacon Bay", region: "East London", img: "https://images.unsplash.com/photo-1549423155-227364ac5d14?q=80&w=400" },
        { name: "Amalinda", region: "Residential District", img: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?q=80&w=400" },
        { name: "Vincent", region: "Business Hub", img: "https://images.unsplash.com/photo-1514565131-fce0801e5785?q=80&w=400" },
        { name: "Mdantsane", region: "Main Township", img: "https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=400" },
        { name: "Nahoon", region: "Beach & Surf", img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800", wide: true },
    ];

    function handleDestinationClick(name: string) {
        setSelectedRoute({ from: "Beacon Bay", to: name, tripType: "commute" });
        router.push("/commute/available");
    }

    return (
        <AppLayout>
            <div className="q-container max-w-2xl py-8 pb-24">
                {/* Page header */}
                <div className="mb-6">
                    <h1 className="font-display text-3xl font-semibold text-q-stone-900 mb-1">Daily Commute</h1>
                    <p className="q-body">Choose your destination on the Eastern Cape network.</p>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-q-stone-400">search</span>
                    <input
                        className="q-input-lg pl-12 w-full"
                        placeholder="Search destination in Eastern Cape"
                    />
                </div>

                {/* Current location */}
                <div className="relative h-32 w-full rounded-[18px] overflow-hidden border border-q-stone-200 flex items-center justify-center bg-cover bg-center mb-8 shadow-q-md"
                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=600')" }}>
                    <div className="absolute inset-0 bg-q-stone-900/20" />
                    <div className="relative flex items-center gap-2 bg-white/90 px-4 py-2 rounded-full shadow-q-sm">
                        <span className="material-symbols-outlined text-q-brown">my_location</span>
                        <span className="font-sans text-sm font-semibold text-q-stone-900">Current Location: Beacon Bay</span>
                    </div>
                </div>

                {/* Popular Destinations */}
                <h2 className="font-display text-xl font-semibold text-q-stone-900 mb-4">Popular Destinations</h2>
                <div className="grid grid-cols-2 gap-4 mb-8">
                    {destinations.map((dest, i) => (
                        <button
                            key={i}
                            onClick={() => handleDestinationClick(dest.name)}
                            className={`relative group cursor-pointer aspect-[4/3] rounded-[18px] overflow-hidden border border-q-stone-200 shadow-q-sm transition-transform active:scale-95 hover:shadow-q-md ${dest.wide ? "col-span-2" : ""}`}
                        >
                            <div
                                className="absolute inset-0 bg-cover bg-center"
                                style={{ backgroundImage: `linear-gradient(to top, rgba(28,25,23,0.75) 0%, rgba(28,25,23,0) 60%), url("${dest.img}")` }}
                            />
                            <div className="absolute bottom-0 left-0 p-4 text-left">
                                <p className="font-display text-base font-semibold text-white">{dest.name}</p>
                                <p className="font-sans text-[10px] text-q-brown-300 font-medium uppercase tracking-wider">{dest.region}</p>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Recent Rides */}
                <h2 className="font-display text-xl font-semibold text-q-stone-900 mb-4">Recent Rides</h2>
                <div className="space-y-3">
                    {[
                        { name: "Hemingways Mall", dist: "2.4 km away" },
                        { name: "East London Airport", dist: "12.1 km away" },
                    ].map((item, i) => (
                        <button key={i} className="q-card-interactive w-full flex items-center gap-4 p-4 text-left">
                            <div className="w-10 h-10 rounded-[10px] bg-q-brown-100 flex items-center justify-center text-q-brown flex-shrink-0">
                                <span className="material-symbols-outlined">history</span>
                            </div>
                            <div className="flex-1">
                                <p className="font-sans text-sm font-semibold text-q-stone-900">{item.name}</p>
                                <p className="font-sans text-xs text-q-stone-500">{item.dist}</p>
                            </div>
                            <span className="material-symbols-outlined text-q-stone-400">chevron_right</span>
                        </button>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}

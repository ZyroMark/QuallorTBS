"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/app/context/BookingContext";
import AppLayout from "@/components/layout/AppLayout";

export default function HikingPage() {
    const router = useRouter();
    const { setSelectedRoute } = useBooking();

    const routes = [
        { name: "Port Elizabeth", price: "R450", img: "https://images.unsplash.com/photo-1549423155-227364ac5d14?q=80&w=400" },
        { name: "Mthatha", price: "R320", img: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?q=80&w=400" },
        { name: "Butterworth", price: "R280", img: "https://images.unsplash.com/photo-1514565131-fce0801e5785?q=80&w=400" },
        { name: "Queenstown", price: "R380", img: "https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=400" },
        { name: "Cape Town", price: "R850", img: "https://images.unsplash.com/photo-1580619305218-85e4e9952de0?q=80&w=800", wide: true },
    ];

    function handleRouteClick(destination: string) {
        setSelectedRoute({ from: "East London", to: destination, tripType: "hiking" });
        router.push("/hiking/available");
    }

    return (
        <AppLayout>
            <div className="q-container max-w-2xl py-8 pb-24">
                <div className="mb-6">
                    <h1 className="font-display text-3xl font-semibold text-q-stone-900 mb-1">Hiking</h1>
                    <p className="q-body">Long-distance inter-city travel across the Eastern Cape.</p>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-q-stone-400">search</span>
                    <input className="q-input-lg pl-12 w-full" placeholder="Where are you heading?" />
                </div>

                {/* Departure info */}
                <div className="q-card p-4 flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-[10px] bg-q-brown-100 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-q-brown">trip_origin</span>
                    </div>
                    <div>
                        <p className="font-sans text-xs font-bold text-q-stone-500 uppercase tracking-wider">Departure Point</p>
                        <p className="font-sans font-semibold text-q-stone-900">East London Taxi Rank</p>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-xl font-semibold text-q-stone-900">Popular Routes</h2>
                    <button className="font-sans text-sm font-semibold text-q-brown">See all</button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {routes.map((route, i) => (
                        <button
                            key={i}
                            onClick={() => handleRouteClick(route.name)}
                            className={`relative overflow-hidden group rounded-[18px] aspect-[4/5] shadow-q-sm border border-q-stone-200 transition-all active:scale-95 hover:shadow-q-md ${route.wide ? "col-span-2" : ""}`}
                        >
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                                style={{ backgroundImage: `linear-gradient(to top, rgba(28,25,23,0.85) 0%, rgba(28,25,23,0) 60%), url("${route.img}")` }}
                            />
                            <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
                                <p className="font-display text-base font-semibold text-white leading-tight mb-0.5">{route.name}</p>
                                <p className="font-sans text-xs font-semibold text-q-brown-300">From {route.price}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}

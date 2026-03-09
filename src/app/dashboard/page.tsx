"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useBooking } from "@/app/context/BookingContext";
import AuthGuard from "@/components/AuthGuard";
import AppLayout from "@/components/layout/AppLayout";

function DashboardContent() {
    const { user, logout } = useAuth();
    const { setSelectedRoute } = useBooking();
    const router = useRouter();

    const routes = [
        { from: "Beacon Bay", to: "Amalinda", region: "East London Local", price: "R 18.00" },
        { from: "Vincent", to: "Mdantsane", region: "Mdantsane Commuter", price: "R 22.00" },
        { from: "EL CBD", to: "Nahoon", region: "Coastal Route", price: "R 15.00" },
    ];

    function handleRouteClick(from: string, to: string) {
        setSelectedRoute({ from, to, tripType: "commute" });
        router.push("/commute/available");
    }

    return (
        <AppLayout>
            <div className="q-container max-w-2xl py-8">
                {/* Hero */}
                <div className="mb-8">
                    <h1 className="font-display text-3xl font-semibold text-q-stone-900 mb-1">
                        Welcome back, {user?.name?.split(" ")[0] || "Passenger"}
                    </h1>
                    <p className="q-body">Select your service type to get started.</p>
                </div>

                {/* Service Cards */}
                <div className="grid sm:grid-cols-2 gap-4 mb-10">
                    {/* Daily Commute */}
                    <div className="q-card-raised overflow-hidden cursor-pointer group" onClick={() => router.push("/commute")}>
                        <div
                            className="w-full aspect-[16/7] bg-cover bg-center opacity-90"
                            style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1549423155-227364ac5d14?q=80&w=1000&auto=format&fit=crop")' }}
                        />
                        <div className="p-5">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="font-display text-lg font-semibold text-q-stone-900">Daily Commute</p>
                                    <p className="font-sans text-sm text-q-stone-500">Local routes with fixed pricing</p>
                                </div>
                                <span className="bg-q-brown text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Popular</span>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); router.push("/commute"); }}
                                className="q-btn-primary w-full justify-center"
                            >
                                View Routes
                            </button>
                        </div>
                    </div>

                    {/* Hiking */}
                    <div className="q-card overflow-hidden cursor-pointer group" onClick={() => router.push("/hiking")}>
                        <div
                            className="w-full aspect-[16/7] bg-cover bg-center opacity-80"
                            style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?q=80&w=1000&auto=format&fit=crop")' }}
                        />
                        <div className="p-5">
                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="font-display text-lg font-semibold text-q-stone-900">Hiking</p>
                                    <p className="font-sans text-sm text-q-stone-500">Long distance / Inter-city</p>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); router.push("/hiking"); }}
                                    className="q-btn-outline"
                                >
                                    Select
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Popular Routes */}
                <div className="mb-2">
                    <h2 className="font-display text-xl font-semibold text-q-stone-900 mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-q-brown">location_on</span>
                        Popular Local Routes
                    </h2>
                    <div className="space-y-3">
                        {routes.map((route, i) => (
                            <button
                                key={i}
                                onClick={() => handleRouteClick(route.from, route.to)}
                                className="q-card-interactive w-full flex items-center justify-between p-4 text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-2 h-2 rounded-full bg-q-brown" />
                                        <div className="w-px h-4 bg-q-stone-300 my-0.5" />
                                        <div className="w-2 h-2 rounded-full border-2 border-q-brown" />
                                    </div>
                                    <div>
                                        <p className="font-sans text-sm font-semibold text-q-stone-900">{route.from} to {route.to}</p>
                                        <p className="font-sans text-xs text-q-stone-500">{route.region}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <p className="font-display font-semibold text-q-brown">{route.price}</p>
                                    <span className="material-symbols-outlined text-q-stone-400 text-xl">chevron_right</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

export default function DashboardPage() {
    return (
        <AuthGuard requiredRole="passenger">
            <DashboardContent />
        </AuthGuard>
    );
}

"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useBooking } from "@/app/context/BookingContext";
import AuthGuard from "@/components/AuthGuard";
import AppLayout from "@/components/layout/AppLayout";

function DashboardContent() {
    const { user } = useAuth();
    const { setSelectedRoute } = useBooking();
    const router = useRouter();

    const routes = [
        { from: "Beacon Bay",  to: "Amalinda",  region: "East London Local",    price: "R 18" },
        { from: "Vincent",     to: "Mdantsane", region: "Mdantsane Commuter",   price: "R 22" },
        { from: "EL CBD",      to: "Nahoon",    region: "Coastal Route",         price: "R 15" },
    ];

    function handleRouteClick(from: string, to: string) {
        setSelectedRoute({ from, to, tripType: "commute" });
        router.push("/commute/available");
    }

    return (
        <AppLayout>
            <div style={{ backgroundColor: "#FFFCF9", minHeight: "100vh" }}>

                {/* ── Hero band ── */}
                <div
                    className="relative overflow-hidden"
                    style={{ backgroundColor: "#E1EDF5", paddingTop: "3rem", paddingBottom: "3rem" }}
                >
                    <div className="q-container max-w-2xl">
                        <p
                            className="font-sans font-bold text-xs uppercase tracking-widest mb-3"
                            style={{ color: "rgba(17,17,17,0.50)" }}
                        >
                            Dashboard
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
                            Welcome back,{" "}
                            <span style={{ color: "#1D3686" }}>
                                {user?.name?.split(" ")[0] || "Passenger"}
                            </span>
                        </h1>
                        <p className="font-sans text-base" style={{ color: "rgba(17,17,17,0.60)" }}>
                            Select your service type to get started.
                        </p>
                    </div>
                </div>

                {/* ── Content ── */}
                <div className="q-container max-w-2xl py-8 pb-28">

                    {/* ── Service Cards ── */}
                    <div className="grid sm:grid-cols-2 gap-4 mb-10">

                        {/* Daily Commute */}
                        <div
                            className="overflow-hidden cursor-pointer rounded-[18px] transition-all duration-200"
                            style={{
                                backgroundColor: "#FFFFFF",
                                border: "1px solid rgba(17,17,17,0.07)",
                                boxShadow: "0 4px 16px rgba(17,17,17,0.07)",
                            }}
                            onClick={() => router.push("/commute")}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
                                (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 32px rgba(17,17,17,0.12)";
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.transform = "";
                                (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(17,17,17,0.07)";
                            }}
                        >
                            <div
                                className="w-full aspect-[16/7] bg-cover bg-center"
                                style={{
                                    backgroundImage: 'url("https://images.unsplash.com/photo-1549423155-227364ac5d14?q=80&w=1000&auto=format&fit=crop")',
                                }}
                            />
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p
                                            className="font-sans font-black text-lg mb-0.5"
                                            style={{ color: "#111111", letterSpacing: "-0.02em" }}
                                        >
                                            Daily Commute
                                        </p>
                                        <p className="font-sans text-sm" style={{ color: "#8A8678" }}>
                                            Local routes · fixed pricing
                                        </p>
                                    </div>
                                    <span className="q-tag">Popular</span>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); router.push("/commute"); }}
                                    className="q-btn-dark w-full justify-center"
                                >
                                    View Routes
                                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                                </button>
                            </div>
                        </div>

                        {/* Hiking */}
                        <div
                            className="overflow-hidden cursor-pointer rounded-[18px] transition-all duration-200"
                            style={{
                                backgroundColor: "#EEF1EA",
                                border: "1px solid rgba(17,17,17,0.06)",
                                boxShadow: "0 4px 16px rgba(17,17,17,0.05)",
                            }}
                            onClick={() => router.push("/hiking")}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
                                (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 32px rgba(17,17,17,0.10)";
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.transform = "";
                                (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(17,17,17,0.05)";
                            }}
                        >
                            <div
                                className="w-full aspect-[16/7] bg-cover bg-center"
                                style={{
                                    backgroundImage: 'url("https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?q=80&w=1000&auto=format&fit=crop")',
                                }}
                            />
                            <div className="p-5">
                                <div className="flex items-end justify-between">
                                    <div>
                                        <p
                                            className="font-sans font-black text-lg mb-0.5"
                                            style={{ color: "#111111", letterSpacing: "-0.02em" }}
                                        >
                                            Hiking
                                        </p>
                                        <p className="font-sans text-sm" style={{ color: "#5C5A56" }}>
                                            Long distance · inter-city
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); router.push("/hiking"); }}
                                        className="q-btn-secondary"
                                    >
                                        Select
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Popular Routes ── */}
                    <div
                        className="rounded-[20px] overflow-hidden"
                        style={{
                            backgroundColor: "#FFFFFF",
                            border: "1px solid rgba(17,17,17,0.07)",
                            boxShadow: "0 2px 12px rgba(17,17,17,0.06)",
                        }}
                    >
                        {/* Header */}
                        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                            <h2
                                className="font-sans font-black text-xl"
                                style={{ color: "#111111", letterSpacing: "-0.02em" }}
                            >
                                Popular Routes
                            </h2>
                            <span
                                className="material-symbols-outlined text-xl"
                                style={{ color: "#AEA89C" }}
                            >
                                location_on
                            </span>
                        </div>
                        <div className="q-divider" />

                        {/* Routes */}
                        {routes.map((route, i) => (
                            <button
                                key={i}
                                onClick={() => handleRouteClick(route.from, route.to)}
                                className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors"
                                style={{
                                    borderBottom: i < routes.length - 1 ? "1px solid rgba(17,17,17,0.06)" : "none",
                                }}
                                onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLElement).style.backgroundColor = "#FFFCF9";
                                }}
                                onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLElement).style.backgroundColor = "";
                                }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-center flex-shrink-0">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#111111" }} />
                                        <div className="w-px h-5 my-0.5" style={{ backgroundColor: "rgba(17,17,17,0.18)" }} />
                                        <div className="w-2 h-2 rounded-full border-2" style={{ borderColor: "#111111" }} />
                                    </div>
                                    <div>
                                        <p className="font-sans font-bold text-sm" style={{ color: "#111111" }}>
                                            {route.from} → {route.to}
                                        </p>
                                        <p className="font-sans text-xs" style={{ color: "#8A8678" }}>
                                            {route.region}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span
                                        className="font-sans font-black text-base"
                                        style={{ color: "#111111", letterSpacing: "-0.02em" }}
                                    >
                                        {route.price}
                                    </span>
                                    <span className="material-symbols-outlined text-xl" style={{ color: "#AEA89C" }}>
                                        chevron_right
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* ── Yellow CTA band ── */}
                    <div
                        className="mt-6 rounded-[20px] px-6 py-7 flex items-center justify-between gap-4"
                        style={{ backgroundColor: "#CDDFF6" }}
                    >
                        <div>
                            <p
                                className="font-sans font-black text-xl mb-1"
                                style={{ color: "#111111", letterSpacing: "-0.02em" }}
                            >
                                Safety First
                            </p>
                            <p className="font-sans text-sm" style={{ color: "rgba(17,17,17,0.60)" }}>
                                View your emergency contacts and safety features.
                            </p>
                        </div>
                        <button
                            onClick={() => router.push("/safety")}
                            className="q-btn-dark flex-shrink-0"
                        >
                            Safety Hub
                        </button>
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

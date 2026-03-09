"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

export default function DriverStatusPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [status, setStatus] = useState<"pending" | "verified">("pending");

    useEffect(() => {
        const timer = setTimeout(() => {
            setStatus("verified");
        }, 4000);
        return () => clearTimeout(timer);
    }, []);

    const driverName = user?.name || "New Driver";
    const vehicleModel = user?.vehicleModel || "Toyota Quantum";
    const vehiclePlate = user?.vehiclePlate || "—";

    return (
        <main className="min-h-screen bg-q-bg-page flex flex-col">
            <nav className="flex items-center bg-white px-4 py-3 justify-between border-b border-q-stone-200 shadow-q-xs sticky top-0 z-10">
                <div className="flex w-10 h-10 items-center justify-center rounded-[10px] bg-q-brown-100">
                    <span className="material-symbols-outlined text-q-brown">verified_user</span>
                </div>
                <h2 className="font-display text-lg font-semibold text-q-stone-900 flex-1 text-center pr-10">
                    {status === "pending" ? "Verification Pending" : "Verification Complete"}
                </h2>
            </nav>

            <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 pt-12">
                <div className="flex flex-col items-center pb-8 text-center">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${status === "pending" ? "bg-q-brown-100 animate-pulse" : "bg-green-100"}`}>
                        {status === "pending" ? (
                            <span className="material-symbols-outlined text-q-brown" style={{ fontSize: "3rem" }}>hourglass_empty</span>
                        ) : (
                            <span className="material-symbols-outlined text-green-600" style={{ fontSize: "3rem", fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        )}
                    </div>
                    <h1 className="font-display text-3xl font-semibold text-q-stone-900 mb-3">
                        {status === "pending" ? "Documents Under Review" : "Driver Verified!"}
                    </h1>
                    <p className="font-sans text-q-stone-500 max-w-sm leading-relaxed">
                        {status === "pending"
                            ? "Our team is currently reviewing your documents. This usually takes 24-48 hours."
                            : "You have been successfully verified and are ready to start taking rides."}
                    </p>
                </div>

                {/* Summary Card */}
                <div className="q-card p-6 mb-6">
                    <h3 className="font-display text-lg font-semibold text-q-stone-900 mb-4">Driver Summary</h3>

                    <div className="flex items-center gap-4 py-4 border-b border-q-stone-100">
                        <div className="w-14 h-14 rounded-full bg-q-brown-100 border-2 border-q-brown-200 flex items-center justify-center flex-shrink-0">
                            <span className="font-display text-xl font-bold text-q-brown">
                                {driverName.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="flex-1">
                            <p className="font-sans font-semibold text-q-stone-900">{driverName}</p>
                            <p className="font-sans text-xs text-q-brown font-medium">Driver ID: {user?.id?.slice(0, 8) || "QT-NEW"}</p>
                        </div>
                        <span className={`font-sans text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${status === "pending" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                            {status === "pending" ? "Pending" : "Verified"}
                        </span>
                    </div>

                    <div className="flex items-center gap-4 pt-4">
                        <div className="w-14 h-14 rounded-[12px] bg-q-brown-100 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-q-brown">directions_car</span>
                        </div>
                        <div className="flex-1">
                            <p className="font-sans font-semibold text-q-stone-900">{vehicleModel}</p>
                            <div className="flex items-center gap-2">
                                <p className="font-sans text-xs text-q-stone-500">Plate: {vehiclePlate}</p>
                                <span className="text-q-stone-300">•</span>
                                <p className="font-sans text-xs text-q-brown font-medium">Commuter</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 pb-12">
                    {status === "verified" && (
                        <button
                            onClick={() => router.push("/driver/dashboard")}
                            className="q-btn-primary-lg w-full justify-center"
                        >
                            <span className="material-symbols-outlined">dashboard</span>
                            Go to Driver Dashboard
                        </button>
                    )}
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="q-btn-outline w-full justify-center"
                    >
                        <span className="material-symbols-outlined">home</span>
                        Return to Dashboard
                    </button>
                </div>
            </div>
        </main>
    );
}

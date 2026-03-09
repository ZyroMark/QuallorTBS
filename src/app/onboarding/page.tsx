"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
    const router = useRouter();

    return (
        <main className="relative min-h-screen flex flex-col items-center justify-between overflow-hidden bg-q-bg-page antialiased">
            {/* Dot grid texture */}
            <div
                className="absolute inset-0 z-0 opacity-40 pointer-events-none"
                style={{ backgroundImage: "radial-gradient(circle at 2px 2px, #C4A882 1px, transparent 0)", backgroundSize: "32px 32px" }}
            />

            <header className="w-full pt-12 pb-6 px-6 flex flex-col items-center z-10">
                <div className="w-20 h-20 mb-6 bg-white rounded-[18px] flex items-center justify-center border-2 border-q-brown-200 shadow-q-md">
                    <span className="font-display text-5xl font-bold text-q-brown leading-none">Q</span>
                </div>
                <p className="font-sans text-xs font-bold text-q-brown uppercase tracking-widest">Quallor</p>
            </header>

            <div className="w-full flex-1 flex flex-col items-center justify-center px-6 text-center z-10">
                <div className="w-full max-w-lg">
                    <div
                        className="relative mb-10 mx-auto w-full aspect-video rounded-[18px] overflow-hidden shadow-q-md border border-q-stone-200 bg-cover bg-center"
                        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1549423155-227364ac5d14?q=80&w=1000&auto=format&fit=crop')" }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-q-stone-900/60 via-transparent to-transparent" />
                        <div className="absolute bottom-4 left-4 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-q-brown animate-pulse" />
                            <span className="font-sans text-xs font-semibold text-white uppercase tracking-widest">Platform Live</span>
                        </div>
                    </div>

                    <h1 className="font-display text-4xl md:text-5xl font-semibold text-q-stone-900 tracking-tight mb-4 leading-tight">
                        Faster Rides.<br />Higher Incomes.<br />Organized Operations.
                    </h1>
                    <p className="font-sans text-lg text-q-stone-500 max-w-xs mx-auto mb-10">
                        The smart taxi platform for <span className="text-q-brown font-semibold">South Africa</span>.
                    </p>

                    <div className="flex flex-col gap-4 w-full max-w-sm mx-auto">
                        <button
                            onClick={() => router.push("/auth/login")}
                            className="q-btn-primary-lg w-full justify-center"
                        >
                            Get Started
                            <span className="material-symbols-outlined">arrow_forward</span>
                        </button>
                        <button
                            onClick={() => router.push("/auth/signup?role=operator")}
                            className="q-btn-secondary w-full justify-center"
                        >
                            Become a Partner
                        </button>
                    </div>
                </div>
            </div>

            <footer className="w-full p-8 flex justify-center items-center gap-6 z-10">
                <div className="flex items-center gap-2 font-sans text-sm text-q-stone-400">
                    <span className="material-symbols-outlined text-sm">shield</span>
                    <span>Secure Payments</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-q-stone-300" />
                <div className="flex items-center gap-2 font-sans text-sm text-q-stone-400">
                    <span className="material-symbols-outlined text-sm">public</span>
                    <span>Nationwide Network</span>
                </div>
            </footer>
        </main>
    );
}

"use client";

import Link from "next/link";

export default function OfflinePage() {
    return (
        <main className="min-h-screen bg-q-bg-page flex flex-col items-center justify-center px-6 text-center">
            <div className="w-24 h-24 rounded-[20px] bg-q-brown-50 border-2 border-q-brown-200 flex items-center justify-center relative mb-8 shadow-q-md">
                <span className="font-display text-5xl font-bold text-q-brown leading-none">Q</span>
                <div className="absolute bottom-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
            </div>

            <h1 className="font-display text-3xl font-semibold text-q-stone-900 mb-3">You&apos;re Offline</h1>
            <p className="q-body mb-8 max-w-sm">
                No internet connection detected. Previously viewed pages and tickets are available below.
            </p>

            <div className="w-full max-w-sm space-y-3">
                <Link
                    href="/trips"
                    className="q-card-interactive flex items-center justify-between w-full px-5 py-4"
                >
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-q-brown">confirmation_number</span>
                        <span className="font-sans font-semibold text-q-stone-900">My Tickets</span>
                    </div>
                    <span className="material-symbols-outlined text-q-stone-400 text-sm">chevron_right</span>
                </Link>

                <Link
                    href="/dashboard"
                    className="q-card-interactive flex items-center justify-between w-full px-5 py-4"
                >
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-q-brown">home</span>
                        <span className="font-sans font-semibold text-q-stone-900">Dashboard</span>
                    </div>
                    <span className="material-symbols-outlined text-q-stone-400 text-sm">chevron_right</span>
                </Link>
            </div>

            <div className="mt-12 flex items-center gap-2 font-sans text-sm text-q-stone-500">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span>Waiting for connection...</span>
            </div>
        </main>
    );
}

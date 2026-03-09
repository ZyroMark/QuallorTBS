"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function SafetyPage() {
    const router = useRouter();

    const sections = [
        {
            title: "Emergency Tools",
            items: [
                { icon: "emergency_share", label: "Emergency SOS Settings", sub: "Configure rapid response and alerts" },
                { icon: "group", label: "Trusted Contacts", sub: "Manage people who can see your location" },
            ]
        },
        {
            title: "Privacy & Sharing",
            items: [
                { icon: "share_location", label: "Trip Sharing Preferences", sub: "Automate sharing with your circle" },
            ]
        },
        {
            title: "Account Security",
            items: [
                { icon: "lock", label: "Change Password", sub: "Last changed 3 months ago" },
                { icon: "fingerprint", label: "Biometric Authentication", sub: "Use Face ID or Fingerprint", toggle: true },
            ]
        }
    ];

    return (
        <main className="min-h-screen bg-q-bg-page flex flex-col pb-24">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-white border-b border-q-stone-200 shadow-q-xs">
                <div className="flex items-center px-4 py-3 justify-between max-w-md mx-auto w-full">
                    <button onClick={() => router.back()} className="flex w-10 h-10 items-center justify-center rounded-[10px] hover:bg-q-stone-100 transition-colors">
                        <span className="material-symbols-outlined text-q-stone-700">arrow_back</span>
                    </button>
                    <h1 className="font-display text-lg font-semibold text-q-stone-900 flex-1 text-center pr-10">Safety & Security</h1>
                </div>
            </header>

            <div className="flex-1 max-w-md mx-auto w-full px-4 overflow-y-auto">
                {sections.map((section, idx) => (
                    <div key={idx} className="mt-6 text-left">
                        <h2 className="font-sans text-xs font-bold text-q-brown uppercase tracking-widest mb-3 px-1">{section.title}</h2>
                        <div className="q-card divide-y divide-q-stone-100">
                            {section.items.map((item, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 cursor-pointer hover:bg-q-stone-50 transition-colors first:rounded-t-[14px] last:rounded-b-[14px]">
                                    <div className="w-10 h-10 rounded-[10px] bg-q-brown-100 flex items-center justify-center flex-shrink-0">
                                        <span className="material-symbols-outlined text-q-brown" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-sans font-semibold text-q-stone-900">{item.label}</p>
                                        <p className="font-sans text-sm text-q-stone-500">{item.sub}</p>
                                    </div>
                                    {item.toggle ? (
                                        <div className="w-10 h-6 bg-q-brown rounded-full relative flex-shrink-0">
                                            <div className="absolute right-1 top-1 bg-white w-4 h-4 rounded-full shadow-sm" />
                                        </div>
                                    ) : (
                                        <span className="material-symbols-outlined text-q-stone-400 flex-shrink-0">chevron_right</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Safety Checkup Card */}
                <div className="mt-8 p-6 rounded-[18px] bg-q-brown-50 border border-q-brown-200 text-left">
                    <div className="flex items-start gap-4">
                        <span className="material-symbols-outlined text-q-brown text-3xl flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                        <div>
                            <h3 className="font-display text-lg font-semibold text-q-stone-900 mb-1">Safety Checkup</h3>
                            <p className="font-sans text-sm text-q-stone-600 mb-4 leading-relaxed">Review your core safety settings to ensure you&apos;re protected during every commute.</p>
                            <button className="q-btn-primary">
                                Start Checkup
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

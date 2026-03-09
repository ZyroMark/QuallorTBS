"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import AuthGuard from "@/components/AuthGuard";
import AppLayout from "@/components/layout/AppLayout";

function ProfileContent() {
    const { user, logout } = useAuth();
    const router = useRouter();

    function handleLogout() {
        logout();
        router.push("/");
    }

    const initials = user?.name
        ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
        : "?";

    const menuSections = [
        {
            title: "Profile & Security",
            items: [
                { icon: "person", label: "Personal Info", sub: "Edit your profile and data" },
                { icon: "payments", label: "Payments", sub: "Manage cards & digital wallet", href: "/wallet" },
                { icon: "history", label: "Activity", sub: "View your ride history", href: "/trips" },
                { icon: "shield", label: "Safety & Security", sub: "Emergency contacts, SOS settings", href: "/safety" },
            ],
        },
        {
            title: "Preferences",
            items: [
                { icon: "help", label: "Support", sub: "Help centre, FAQs, live chat" },
                { icon: "tune", label: "App Settings", sub: "Notifications, Language, Privacy" },
            ],
        },
    ];

    return (
        <AppLayout>
            <div className="q-container max-w-2xl py-8 pb-24">
                {/* Profile header */}
                <div className="flex flex-col items-center mb-8">
                    <div className="relative mb-4">
                        <div className="w-24 h-24 rounded-full bg-q-brown flex items-center justify-center shadow-q-md">
                            <span className="font-display text-3xl font-bold text-white">{initials}</span>
                        </div>
                        <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white border border-q-stone-200 shadow-q-xs flex items-center justify-center text-q-brown">
                            <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                    </div>
                    <h2 className="font-display text-2xl font-semibold text-q-stone-900">{user?.name || "User"}</h2>
                    <p className="font-sans text-sm text-q-stone-500 mt-0.5">{user?.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="material-symbols-outlined text-q-brown text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="font-sans text-sm text-q-stone-600">4.9 Rating</span>
                        <span className="text-q-stone-300">·</span>
                        <span className="font-sans text-sm text-q-stone-600 capitalize">{user?.role}</span>
                    </div>
                </div>

                {/* Wallet balance */}
                <div className="q-card p-4 flex items-center justify-between mb-6 border-q-brown-200 bg-q-brown-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[10px] bg-q-brown flex items-center justify-center">
                            <span className="material-symbols-outlined text-white">account_balance_wallet</span>
                        </div>
                        <div>
                            <p className="font-sans text-xs font-bold text-q-stone-500 uppercase tracking-wider">Quallor Credits</p>
                            <p className="font-display text-lg font-bold text-q-brown">R 142.50</p>
                        </div>
                    </div>
                    <button className="q-btn-ghost text-sm px-4 py-2">Top Up</button>
                </div>

                {/* Menu sections */}
                {menuSections.map((section, idx) => (
                    <div key={idx} className="mb-6">
                        <p className="font-sans text-xs font-bold uppercase tracking-widest text-q-stone-500 mb-2 px-1">{section.title}</p>
                        <div className="q-card divide-y divide-q-stone-100">
                            {section.items.map((item, i) => (
                                <button
                                    key={i}
                                    onClick={() => item.href && router.push(item.href)}
                                    className="w-full flex items-center gap-4 p-4 hover:bg-q-stone-50 transition-colors text-left"
                                >
                                    <div className="w-10 h-10 rounded-[10px] bg-q-brown-100 text-q-brown flex items-center justify-center flex-shrink-0">
                                        <span className="material-symbols-outlined">{item.icon}</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-sans font-semibold text-q-stone-900">{item.label}</p>
                                        <p className="font-sans text-xs text-q-stone-500">{item.sub}</p>
                                    </div>
                                    <span className="material-symbols-outlined text-q-stone-400">chevron_right</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="w-full py-4 rounded-[14px] border border-red-200 text-red-600 font-sans font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-outlined">logout</span>
                    Log Out
                </button>
                <p className="font-sans text-center text-[10px] text-q-stone-400 mt-6">Quallor v2.4.1 (Build 890)</p>
            </div>
        </AppLayout>
    );
}

export default function ProfilePage() {
    return (
        <AuthGuard>
            <ProfileContent />
        </AuthGuard>
    );
}

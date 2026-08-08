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
                { icon: "person",    label: "Personal Info",      sub: "Edit your profile and data",          href: undefined },
                { icon: "payments",  label: "Payments",           sub: "Manage cards & digital wallet",        href: "/wallet" },
                { icon: "history",   label: "Activity",           sub: "View your ride history",               href: "/trips" },
                { icon: "shield",    label: "Safety & Security",  sub: "Emergency contacts, SOS settings",     href: "/safety" },
            ],
        },
        {
            title: "Preferences",
            items: [
                { icon: "help",  label: "Support",       sub: "Help centre, FAQs, live chat", href: undefined },
                { icon: "tune",  label: "App Settings",  sub: "Notifications, Language, Privacy", href: undefined },
            ],
        },
    ];

    return (
        <AppLayout>
            <div style={{ backgroundColor: "#FFFCF9", minHeight: "100vh" }}>

                {/* ── Hero banner ── */}
                <div style={{ backgroundColor: "#E1EDF5", paddingTop: "2.5rem", paddingBottom: "2.5rem" }}>
                    <div className="q-container max-w-2xl">
                        {/* Avatar */}
                        <div className="flex flex-col items-center">
                            <div className="relative mb-4">
                                <div
                                    className="w-24 h-24 rounded-full flex items-center justify-center"
                                    style={{ background: "#111111", boxShadow: "0 8px 28px rgba(17,17,17,0.25)" }}
                                >
                                    <span
                                        className="font-sans font-black text-[#CDDFF6] text-3xl"
                                        style={{ letterSpacing: "-0.02em" }}
                                    >
                                        {initials}
                                    </span>
                                </div>
                                <button
                                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                                    style={{ backgroundColor: "#FFFFFF", boxShadow: "0 2px 8px rgba(17,17,17,0.15)" }}
                                >
                                    <span className="material-symbols-outlined text-sm" style={{ color: "#111111" }}>edit</span>
                                </button>
                            </div>
                            <h2
                                className="font-sans font-black text-2xl"
                                style={{ color: "#111111", letterSpacing: "-0.02em" }}
                            >
                                {user?.name || "User"}
                            </h2>
                            <p className="font-sans text-sm mt-0.5" style={{ color: "rgba(17,17,17,0.55)" }}>
                                {user?.email}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                                <span
                                    className="material-symbols-outlined text-sm"
                                    style={{ color: "#111111", fontVariationSettings: "'FILL' 1" }}
                                >
                                    star
                                </span>
                                <span className="font-sans text-sm font-semibold" style={{ color: "rgba(17,17,17,0.65)" }}>4.9 Rating</span>
                                <span style={{ color: "rgba(17,17,17,0.30)" }}>·</span>
                                <span className="font-sans text-sm capitalize font-semibold" style={{ color: "rgba(17,17,17,0.65)" }}>{user?.role}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Content ── */}
                <div className="q-container max-w-2xl py-6 pb-24">

                    {/* Wallet balance */}
                    <div
                        className="p-4 flex items-center justify-between mb-6 rounded-[18px]"
                        style={{ backgroundColor: "#CDDFF6" }}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-[10px] flex items-center justify-center"
                                style={{ background: "#111111" }}
                            >
                                <span className="material-symbols-outlined" style={{ color: "#CDDFF6" }}>account_balance_wallet</span>
                            </div>
                            <div>
                                <p className="font-sans text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(17,17,17,0.55)" }}>
                                    Quallor Credits
                                </p>
                                <p
                                    className="font-sans font-black text-lg"
                                    style={{ color: "#111111", letterSpacing: "-0.02em" }}
                                >
                                    R 142.50
                                </p>
                            </div>
                        </div>
                        <button
                            className="font-sans font-bold text-sm px-5 py-2 rounded-full transition-colors"
                            style={{ backgroundColor: "#111111", color: "#FFFFFF" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#2A2A28"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#111111"; }}
                        >
                            Top Up
                        </button>
                    </div>

                    {/* Menu sections */}
                    {menuSections.map((section, idx) => (
                        <div key={idx} className="mb-6">
                            <p
                                className="font-sans text-xs font-bold uppercase tracking-widest mb-2 px-1"
                                style={{ color: "#AEA89C" }}
                            >
                                {section.title}
                            </p>
                            <div
                                className="rounded-[16px] overflow-hidden"
                                style={{
                                    backgroundColor: "#FFFFFF",
                                    border: "1px solid rgba(17,17,17,0.07)",
                                    boxShadow: "0 2px 8px rgba(17,17,17,0.05)",
                                }}
                            >
                                {section.items.map((item, i) => (
                                    <button
                                        key={i}
                                        onClick={() => item.href && router.push(item.href)}
                                        className="w-full flex items-center gap-4 p-4 transition-colors text-left"
                                        style={{ borderTop: i > 0 ? "1px solid rgba(17,17,17,0.06)" : undefined }}
                                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#FFFCF9"; }}
                                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = ""; }}
                                    >
                                        <div
                                            className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
                                            style={{ backgroundColor: "#EEF1EA", color: "#111111" }}
                                        >
                                            <span className="material-symbols-outlined">{item.icon}</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-sans font-semibold" style={{ color: "#111111" }}>{item.label}</p>
                                            <p className="font-sans text-xs" style={{ color: "#8A8678" }}>{item.sub}</p>
                                        </div>
                                        <span className="material-symbols-outlined" style={{ color: "#AEA89C" }}>chevron_right</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="w-full py-4 rounded-[9999px] font-sans font-bold flex items-center justify-center gap-2 transition-colors"
                        style={{ border: "2px solid rgba(220,38,38,0.22)", color: "#DC2626", backgroundColor: "transparent" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(220,38,38,0.06)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = ""; }}
                    >
                        <span className="material-symbols-outlined">logout</span>
                        Log Out
                    </button>

                    <p className="font-sans text-center text-[10px] mt-6" style={{ color: "#AEA89C" }}>
                        Quallor v2.4.1 (Build 890)
                    </p>
                </div>
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

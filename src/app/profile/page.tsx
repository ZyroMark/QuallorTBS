"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useBooking } from "@/app/context/BookingContext";
import { useSettings } from "@/app/context/SettingsContext";
import AuthGuard from "@/components/AuthGuard";
import AppLayout from "@/components/layout/AppLayout";

function ProfileContent() {
    const { user, logout } = useAuth();
    const { myBookings } = useBooking();
    const { wallet, contacts, checkupScore } = useSettings();
    const router = useRouter();

    function handleLogout() {
        logout();
        router.push("/");
    }

    const initials = user?.name
        ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
        : "?";

    const isDriver = user?.role === "driver";
    const isOperator = user?.role === "operator";
    const checkup = checkupScore();
    const completedTrips = myBookings.filter((b) => b.status !== "cancelled").length;

    const menuSections = [
        {
            title: "Profile & Security",
            items: [
                { icon: "person",   label: "Personal Info",     sub: "Edit your profile and data",       href: "/profile/personal-info" },
                { icon: "payments", label: "Payments",          sub: `R ${wallet.balance.toFixed(2)} in credits`, href: "/wallet" },
                { icon: "history",  label: "Activity",          sub: completedTrips === 0 ? "No trips yet" : `${completedTrips} trip${completedTrips === 1 ? "" : "s"} on record`, href: "/trips" },
                {
                    icon: "shield",
                    label: "Safety & Security",
                    sub: `${checkup.done} of ${checkup.total} safety steps done${contacts.length ? ` · ${contacts.length} trusted contact${contacts.length === 1 ? "" : "s"}` : ""}`,
                    href: "/safety",
                },
            ],
        },
        {
            title: "Preferences",
            items: [
                { icon: "help", label: "Support",      sub: "Help centre, FAQs, contact us",       href: "/profile/support" },
                { icon: "tune", label: "App Settings", sub: "Notifications, language, accessibility", href: "/profile/settings" },
            ],
        },
        ...(isDriver
            ? [{
                title: "Driver Tools",
                items: [
                    { icon: "groups",          label: "Gaatjie Mode",   sub: "Manifest and boarding for this run", href: "/driver/gaatjie" },
                    { icon: "qr_code_scanner", label: "Scan Passenger", sub: "Verify QR tickets at boarding",      href: "/driver/scan" },
                    { icon: "person_add",      label: "Walk-Up Fare",   sub: "Book a passenger boarding on board", href: "/driver/walk-up" },
                ],
            }]
            : []),
        ...(isOperator
            ? [{
                title: "Operations",
                items: [
                    { icon: "grid_view",  label: "Operator Console",  sub: "Live fleet, analytics and settings", href: "/operator" },
                    { icon: "local_taxi", label: "Fleet Management",  sub: "Vehicle register and assessments",   href: "/fleet" },
                ],
            }]
            : []),
        {
            title: "Legal",
            items: [
                { icon: "gavel",       label: "Terms of Service", sub: "How the network operates", href: "/terms" },
                { icon: "shield_lock", label: "Privacy Policy",   sub: "What we collect and why",  href: "/privacy" },
            ],
        },
    ];

    return (
        <AppLayout>
            <div style={{ backgroundColor: "#FFFCF9", minHeight: "100vh" }}>

                {/* ── Hero banner ── */}
                <div style={{ backgroundColor: "#E1EDF5", paddingTop: "2.5rem", paddingBottom: "2.5rem" }}>
                    <div className="q-container max-w-2xl">
                        <div className="flex flex-col items-center">
                            <div className="relative mb-4">
                                <div
                                    className="w-24 h-24 rounded-full flex items-center justify-center"
                                    style={{ background: "#111111", boxShadow: "0 8px 28px rgba(17,17,17,0.25)" }}
                                >
                                    <span className="font-sans font-black text-[#CDDFF6] text-3xl" style={{ letterSpacing: "-0.02em" }}>
                                        {initials}
                                    </span>
                                </div>
                                <button
                                    onClick={() => router.push("/profile/personal-info")}
                                    aria-label="Edit profile"
                                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                                    style={{ backgroundColor: "#FFFFFF", boxShadow: "0 2px 8px rgba(17,17,17,0.15)" }}
                                >
                                    <span className="material-symbols-outlined text-sm" style={{ color: "#111111" }}>edit</span>
                                </button>
                            </div>
                            <h2 className="font-sans font-black text-2xl" style={{ color: "#111111", letterSpacing: "-0.02em" }}>
                                {user?.name || "User"}
                            </h2>
                            <p className="font-sans text-sm mt-0.5" style={{ color: "rgba(17,17,17,0.55)" }}>
                                {user?.email}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="material-symbols-outlined text-sm" style={{ color: "#111111", fontVariationSettings: "'FILL' 1" }}>
                                    star
                                </span>
                                <span className="font-sans text-sm font-semibold" style={{ color: "rgba(17,17,17,0.65)" }}>4.9 Rating</span>
                                <span style={{ color: "rgba(17,17,17,0.30)" }}>·</span>
                                <span className="font-sans text-sm capitalize font-semibold" style={{ color: "rgba(17,17,17,0.65)" }}>{user?.role}</span>
                            </div>
                            {isDriver && user?.vehiclePlate && (
                                <p className="font-mono text-xs font-bold uppercase tracking-wider mt-2" style={{ color: "#1D3686" }}>
                                    {user.vehicleModel || "Vehicle"} · {user.vehiclePlate}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Content ── */}
                <div className="q-container max-w-2xl py-6 pb-28">

                    {/* Wallet balance */}
                    <button
                        onClick={() => router.push("/wallet")}
                        className="w-full p-4 flex items-center justify-between mb-6 rounded-[18px] text-left"
                        style={{ backgroundColor: "#CDDFF6" }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center" style={{ background: "#111111" }}>
                                <span className="material-symbols-outlined" style={{ color: "#CDDFF6" }}>account_balance_wallet</span>
                            </div>
                            <div>
                                <p className="font-mono text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(17,17,17,0.55)" }}>
                                    Quallor Credits
                                </p>
                                <p className="font-sans font-black text-lg" style={{ color: "#111111", letterSpacing: "-0.02em" }}>
                                    R {wallet.balance.toFixed(2)}
                                </p>
                            </div>
                        </div>
                        <span
                            className="font-sans font-bold text-sm px-5 py-2 rounded-full"
                            style={{ backgroundColor: "#111111", color: "#FFFFFF" }}
                        >
                            Top Up
                        </span>
                    </button>

                    {/* Safety nudge */}
                    {checkup.done < checkup.total && (
                        <button
                            onClick={() => router.push("/safety")}
                            className="w-full flex items-center gap-3 p-4 mb-6 rounded-[16px] text-left"
                            style={{ backgroundColor: "#EEF1EA", border: "1px solid rgba(17,17,17,0.07)" }}
                        >
                            <span className="material-symbols-outlined flex-shrink-0" style={{ color: "#1D3686" }}>shield</span>
                            <div className="flex-1">
                                <p className="font-sans font-bold text-sm" style={{ color: "#111111" }}>
                                    Finish your safety checkup
                                </p>
                                <p className="font-sans text-xs" style={{ color: "#5C5A56" }}>
                                    {checkup.total - checkup.done} step{checkup.total - checkup.done === 1 ? "" : "s"} left, including adding a trusted contact.
                                </p>
                            </div>
                            <span className="material-symbols-outlined flex-shrink-0" style={{ color: "#AEA89C" }}>chevron_right</span>
                        </button>
                    )}

                    {/* Menu sections */}
                    {menuSections.map((section) => (
                        <div key={section.title} className="mb-6">
                            <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-2 px-1" style={{ color: "#AEA89C" }}>
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
                                        key={item.label}
                                        onClick={() => router.push(item.href)}
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
                                        <div className="flex-1 min-w-0">
                                            <p className="font-sans font-semibold" style={{ color: "#111111" }}>{item.label}</p>
                                            <p className="font-sans text-xs" style={{ color: "#8A8678" }}>{item.sub}</p>
                                        </div>
                                        <span className="material-symbols-outlined flex-shrink-0" style={{ color: "#AEA89C" }}>chevron_right</span>
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

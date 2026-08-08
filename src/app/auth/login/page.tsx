"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        const result = login(email, password);
        setLoading(false);
        if (!result.success) {
            setError(result.error || "Login failed.");
            return;
        }
        const stored = localStorage.getItem("quallor_current_user");
        const user = stored ? JSON.parse(stored) : null;
        if (user?.role === "driver") {
            router.push("/driver/dashboard");
        } else if (user?.role === "operator") {
            router.push("/operator/dashboard");
        } else {
            router.push("/dashboard");
        }
    };

    return (
        <div
            className="min-h-screen grid lg:grid-cols-2"
            style={{ backgroundColor: "#FFFCF9" }}
        >
            {/* ── Left panel - warm hero ── */}
            <div
                className="hidden lg:flex flex-col px-16 py-20 relative overflow-hidden"
                style={{ backgroundColor: "#E1EDF5" }}
            >
                {/* Subtle texture pattern */}
                <div
                    className="absolute inset-0 opacity-[0.06]"
                    style={{
                        backgroundImage: "radial-gradient(circle at 1px 1px, #111 1px, transparent 0)",
                        backgroundSize: "32px 32px",
                    }}
                />

                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 mb-20 relative z-10">
                    <span
                        className="q-wordmark text-2xl"
                        style={{ color: "#111111" }}
                    >
                        Quallor
                    </span>
                </Link>

                {/* Hero text */}
                <div className="relative z-10 flex-1 flex flex-col justify-center">
                    {/* Eyebrow */}
                    <p
                        className="font-sans font-bold text-xs uppercase tracking-widest mb-6"
                        style={{ color: "rgba(17,17,17,0.55)" }}
                    >
                        Eastern Cape Network
                    </p>

                    <h2
                        className="font-sans font-black mb-6 leading-none"
                        style={{
                            fontSize: "clamp(2.5rem, 5vw, 4rem)",
                            color: "#111111",
                            letterSpacing: "-0.03em",
                        }}
                    >
                        The smarter<br />way to travel<br />the Eastern<br />Cape.
                    </h2>

                    <p
                        className="font-sans text-base leading-relaxed mb-12"
                        style={{ color: "rgba(17,17,17,0.60)", maxWidth: "340px" }}
                    >
                        Book a confirmed seat, track your taxi in real time, and board
                        with a digital QR ticket, even when you&apos;re offline.
                    </p>

                    {/* Stats row */}
                    <div className="flex flex-wrap gap-3">
                        {[
                            { label: "Active Routes", value: "24+" },
                            { label: "Daily Passengers", value: "1 200+" },
                            { label: "Works Offline", value: "100%" },
                        ].map((stat) => (
                            <div
                                key={stat.label}
                                className="px-5 py-4 rounded-[14px]"
                                style={{
                                    backgroundColor: "rgba(255,255,255,0.55)",
                                    backdropFilter: "blur(8px)",
                                }}
                            >
                                <p
                                    className="font-sans font-black text-2xl leading-none mb-1"
                                    style={{ color: "#111111", letterSpacing: "-0.03em" }}
                                >
                                    {stat.value}
                                </p>
                                <p className="font-sans text-xs font-semibold" style={{ color: "rgba(17,17,17,0.55)" }}>
                                    {stat.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Right panel - form ── */}
            <div
                className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 min-h-screen"
                style={{ backgroundColor: "#FFFCF9" }}
            >
                <div className="w-full max-w-sm mx-auto">

                    {/* Mobile logo */}
                    <Link href="/" className="flex items-center mb-10 lg:hidden">
                        <span className="q-wordmark text-2xl" style={{ color: "#111111" }}>
                            Quallor
                        </span>
                    </Link>

                    <h1
                        className="font-sans font-black text-4xl mb-2"
                        style={{ color: "#111111", letterSpacing: "-0.03em", lineHeight: 1.05 }}
                    >
                        Welcome back
                    </h1>
                    <p className="font-sans text-sm mb-8" style={{ color: "#8A8678" }}>
                        Sign in to your Quallor account to continue.
                    </p>

                    {/* Error */}
                    {error && (
                        <div
                            className="mb-6 px-4 py-3 rounded-[12px] font-sans text-sm font-semibold"
                            style={{
                                background: "rgba(220,38,38,0.07)",
                                border: "1.5px solid rgba(220,38,38,0.20)",
                                color: "#DC2626",
                            }}
                        >
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="q-label">Email or Phone</label>
                            <input
                                type="text"
                                className="q-input-lg"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="q-label">Password</label>
                            <div className="flex">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="q-input-lg flex-1"
                                    style={{ borderRadius: "12px 0 0 12px", borderRight: "none" }}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="h-14 px-4 transition-colors flex-shrink-0"
                                    style={{
                                        backgroundColor: "#FFFFFF",
                                        border: "1.5px solid rgba(17,17,17,0.12)",
                                        borderLeft: "none",
                                        borderRadius: "0 12px 12px 0",
                                        color: "#AEA89C",
                                    }}
                                    onMouseEnter={(e) => {
                                        (e.currentTarget as HTMLElement).style.color = "#111111";
                                    }}
                                    onMouseLeave={(e) => {
                                        (e.currentTarget as HTMLElement).style.color = "#AEA89C";
                                    }}
                                >
                                    <span className="material-symbols-outlined text-xl">
                                        {showPassword ? "visibility_off" : "visibility"}
                                    </span>
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="q-btn-dark-lg w-full mt-2"
                        >
                            {loading ? "Signing in…" : "Sign In"}
                            {!loading && (
                                <span className="material-symbols-outlined text-xl">arrow_forward</span>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-7">
                        <div className="flex-1 h-px" style={{ backgroundColor: "rgba(17,17,17,0.09)" }} />
                        <span className="font-sans text-sm font-semibold" style={{ color: "#AEA89C" }}>or</span>
                        <div className="flex-1 h-px" style={{ backgroundColor: "rgba(17,17,17,0.09)" }} />
                    </div>

                    <Link href="/auth/signup?role=driver" className="q-btn-secondary w-full justify-center">
                        <span className="material-symbols-outlined text-xl">directions_car</span>
                        Register as a Driver
                    </Link>

                    <p className="font-sans text-sm text-center mt-8" style={{ color: "#8A8678" }}>
                        Don&apos;t have an account?{" "}
                        <Link
                            href="/auth/signup"
                            className="font-bold hover:underline"
                            style={{ color: "#111111" }}
                        >
                            Sign Up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

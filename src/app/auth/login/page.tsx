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
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Left panel — warm branding */}
            <div className="hidden lg:flex flex-col bg-q-bg-section px-16 py-20 border-r border-q-stone-200 relative overflow-hidden">
                <div
                    className="absolute inset-0 opacity-40"
                    style={{
                        backgroundImage: "radial-gradient(#C9B49A 1px, transparent 1px)",
                        backgroundSize: "24px 24px",
                    }}
                />
                <Link href="/" className="flex items-center gap-3 mb-16 relative">
                    <div className="w-10 h-10 rounded-[10px] bg-q-brown flex items-center justify-center shadow-q-sm">
                        <span className="font-display font-bold text-white text-xl leading-none">Q</span>
                    </div>
                    <span className="font-display text-xl font-semibold text-q-stone-900">Quallor</span>
                </Link>
                <div className="relative flex-1 flex flex-col justify-center">
                    <h2 className="font-display text-3xl font-semibold text-q-stone-900 mb-6 leading-snug">
                        The Eastern Cape&apos;s<br />digital taxi network.
                    </h2>
                    <p className="q-body mb-10">
                        Book a confirmed seat, track your taxi in real time, and board with a digital QR ticket — even when you&apos;re offline.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: "Active Routes", value: "24+" },
                            { label: "Daily Passengers", value: "1,200+" },
                            { label: "Works Offline", value: "100%" },
                            { label: "Walk-Up Friendly", value: "Always" },
                        ].map((stat) => (
                            <div key={stat.label} className="q-card p-4">
                                <p className="font-display text-2xl font-semibold text-q-brown mb-1">{stat.value}</p>
                                <p className="font-sans text-xs text-q-stone-500 font-medium">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right panel — form */}
            <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 bg-white min-h-screen">
                <div className="w-full max-w-sm mx-auto">
                    <Link href="/" className="flex items-center gap-2.5 mb-10 lg:hidden">
                        <div className="w-9 h-9 rounded-[10px] bg-q-brown flex items-center justify-center">
                            <span className="font-display font-bold text-white text-lg leading-none">Q</span>
                        </div>
                        <span className="font-display font-semibold text-q-stone-900 text-lg">Quallor</span>
                    </Link>

                    <h1 className="font-display text-2xl font-semibold text-q-stone-900 mb-2">Welcome back</h1>
                    <p className="font-sans text-sm text-q-stone-500 mb-8">Sign in to your Quallor account to continue.</p>

                    {error && (
                        <div className="mb-6 px-4 py-3 rounded-[10px] bg-red-50 border border-red-200 text-red-700 font-sans text-sm font-medium">
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
                                    className="q-input-lg rounded-r-none border-r-0 flex-1"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="h-14 px-4 border border-q-stone-200 bg-q-bg-input rounded-[10px] rounded-l-none border-l-0 text-q-stone-400 hover:text-q-brown transition-colors"
                                >
                                    <span className="material-symbols-outlined text-xl">
                                        {showPassword ? "visibility_off" : "visibility"}
                                    </span>
                                </button>
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="q-btn-primary-lg w-full mt-2">
                            {loading ? "Signing in..." : "Sign In"}
                            {!loading && <span className="material-symbols-outlined text-xl">arrow_forward</span>}
                        </button>
                    </form>

                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-q-stone-200" />
                        <span className="font-sans text-sm text-q-stone-400">or</span>
                        <div className="flex-1 h-px bg-q-stone-200" />
                    </div>

                    <Link href="/auth/signup?role=driver" className="q-btn-secondary w-full justify-center">
                        <span className="material-symbols-outlined text-xl">directions_car</span>
                        Register as a Driver
                    </Link>

                    <p className="font-sans text-sm text-q-stone-500 text-center mt-8">
                        Don&apos;t have an account?{" "}
                        <Link href="/auth/signup" className="text-q-brown font-semibold hover:underline">
                            Sign Up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

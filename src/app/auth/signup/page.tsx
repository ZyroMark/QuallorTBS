"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

type Role = "passenger" | "driver" | "operator";

const ROLE_DETAILS = {
    passenger: {
        icon: "person",
        label: "Passenger",
        tagline: "Book rides, track taxis, travel smart.",
        description: "Access all Eastern Cape routes, get QR tickets, and track your taxi in real time.",
    },
    driver: {
        icon: "directions_car",
        label: "Driver",
        tagline: "Manage your taxi, earn more.",
        description: "View your manifest, scan passengers, handle walk-up fares and sync when offline.",
    },
    operator: {
        icon: "business",
        label: "Operator",
        tagline: "Run your fleet, grow your business.",
        description: "Monitor all vehicles, manage routes, and track revenue across your entire operation.",
    },
};

function SignupForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { signup } = useAuth();

    const [role, setRole] = useState<Role>((searchParams.get("role") as Role) || "passenger");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [licenseNumber, setLicenseNumber] = useState("");
    const [vehicleModel, setVehicleModel] = useState("");
    const [vehiclePlate, setVehiclePlate] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [fleetSize, setFleetSize] = useState("");
    const [agreed, setAgreed] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (!agreed) {
            setError("Please accept the terms and conditions.");
            return;
        }
        setLoading(true);
        const result = signup({
            name,
            email,
            phone,
            password,
            role,
            ...(role === "driver" ? { licenseNumber, vehicleModel, vehiclePlate } : {}),
            ...(role === "operator" ? { companyName, fleetSize: parseInt(fleetSize) || 0 } : {}),
        });
        setLoading(false);
        if (!result.success) {
            setError(result.error || "Registration failed.");
            return;
        }
        if (role === "driver") router.push("/driver/dashboard");
        else if (role === "operator") router.push("/operator/dashboard");
        else router.push("/dashboard");
    };

    const activeDetail = ROLE_DETAILS[role];

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Left panel */}
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
                    <h2 className="font-display text-3xl font-semibold text-q-stone-900 mb-4 leading-snug">
                        Join the Eastern Cape&apos;s<br />digital taxi network.
                    </h2>
                    <p className="q-body mb-10">
                        Whether you&apos;re a passenger, a driver, or an operator — Quallor connects you to every route in the region.
                    </p>

                    <div className="space-y-4">
                        {(Object.entries(ROLE_DETAILS) as [Role, typeof ROLE_DETAILS.passenger][]).map(([key, detail]) => (
                            <div
                                key={key}
                                className={`q-card p-4 flex items-start gap-4 transition-all duration-200 ${role === key ? "border-q-brown shadow-q-md" : ""}`}
                            >
                                <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 ${role === key ? "bg-q-brown text-white" : "bg-q-stone-100 text-q-stone-500"}`}>
                                    <span className="material-symbols-outlined text-xl">{detail.icon}</span>
                                </div>
                                <div>
                                    <p className="font-display font-semibold text-q-stone-900 text-base">{detail.label}</p>
                                    <p className="font-sans text-sm text-q-stone-500 mt-0.5">{detail.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right panel */}
            <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 bg-white min-h-screen">
                <div className="w-full max-w-sm mx-auto">
                    <Link href="/" className="flex items-center gap-2.5 mb-10 lg:hidden">
                        <div className="w-9 h-9 rounded-[10px] bg-q-brown flex items-center justify-center">
                            <span className="font-display font-bold text-white text-lg leading-none">Q</span>
                        </div>
                        <span className="font-display font-semibold text-q-stone-900 text-lg">Quallor</span>
                    </Link>

                    <h1 className="font-display text-2xl font-semibold text-q-stone-900 mb-2">Create your account</h1>
                    <p className="font-sans text-sm text-q-stone-500 mb-6">Join Quallor and start travelling smarter today.</p>

                    {/* Role toggle */}
                    <div className="flex gap-1 p-1 bg-q-stone-100 rounded-[12px] mb-6">
                        {(Object.entries(ROLE_DETAILS) as [Role, typeof ROLE_DETAILS.passenger][]).map(([key, detail]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setRole(key)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] font-sans text-xs font-semibold transition-all duration-200 ${
                                    role === key
                                        ? "bg-q-brown text-white shadow-q-sm"
                                        : "text-q-stone-500 hover:text-q-stone-700"
                                }`}
                            >
                                <span className="material-symbols-outlined text-base">{detail.icon}</span>
                                {detail.label}
                            </button>
                        ))}
                    </div>

                    {error && (
                        <div className="mb-5 px-4 py-3 rounded-[10px] bg-red-50 border border-red-200 text-red-700 font-sans text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="q-label">Full Name</label>
                            <input type="text" className="q-input-lg" placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} required />
                        </div>
                        <div>
                            <label className="q-label">Email Address</label>
                            <input type="email" className="q-input-lg" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <div>
                            <label className="q-label">Phone Number</label>
                            <input type="tel" className="q-input-lg" placeholder="+27 xx xxx xxxx" value={phone} onChange={(e) => setPhone(e.target.value)} />
                        </div>

                        {/* Driver-specific fields */}
                        {role === "driver" && (
                            <>
                                <div>
                                    <label className="q-label">Drivers Licence Number</label>
                                    <input type="text" className="q-input-lg" placeholder="e.g. DL1234567" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
                                </div>
                                <div>
                                    <label className="q-label">Vehicle Model</label>
                                    <input type="text" className="q-input-lg" placeholder="e.g. Toyota Quantum" value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} />
                                </div>
                                <div>
                                    <label className="q-label">Number Plate</label>
                                    <input type="text" className="q-input-lg" placeholder="e.g. CA 123-456" value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value)} />
                                </div>
                            </>
                        )}

                        {/* Operator-specific fields */}
                        {role === "operator" && (
                            <>
                                <div>
                                    <label className="q-label">Company / Association Name</label>
                                    <input type="text" className="q-input-lg" placeholder="e.g. Eastern Cape Taxis" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                                </div>
                                <div>
                                    <label className="q-label">Fleet Size</label>
                                    <input type="number" className="q-input-lg" placeholder="Number of vehicles" min="1" value={fleetSize} onChange={(e) => setFleetSize(e.target.value)} />
                                </div>
                            </>
                        )}

                        <div>
                            <label className="q-label">Password</label>
                            <div className="flex">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="q-input-lg rounded-r-none border-r-0 flex-1"
                                    placeholder="Create a password"
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
                        <div>
                            <label className="q-label">Confirm Password</label>
                            <input
                                type="password"
                                className="q-input-lg"
                                placeholder="Repeat your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>

                        <label className="flex items-start gap-3 cursor-pointer mt-2">
                            <input
                                type="checkbox"
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                                className="mt-1 w-4 h-4 rounded border-q-stone-300 accent-[#8C6A4A]"
                            />
                            <span className="font-sans text-sm text-q-stone-600">
                                I agree to the{" "}
                                <Link href="/terms" className="text-q-brown font-semibold hover:underline">Terms of Service</Link>
                                {" "}and{" "}
                                <Link href="/privacy" className="text-q-brown font-semibold hover:underline">Privacy Policy</Link>
                            </span>
                        </label>

                        <button type="submit" disabled={loading} className="q-btn-primary-lg w-full mt-2">
                            {loading ? "Creating account..." : "Create Account"}
                            {!loading && <span className="material-symbols-outlined text-xl">arrow_forward</span>}
                        </button>
                    </form>

                    <p className="font-sans text-sm text-q-stone-500 text-center mt-8">
                        Already have an account?{" "}
                        <Link href="/auth/login" className="text-q-brown font-semibold hover:underline">
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-q-bg-page flex items-center justify-center"><span className="font-sans text-q-stone-500">Loading...</span></div>}>
            <SignupForm />
        </Suspense>
    );
}

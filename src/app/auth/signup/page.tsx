"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { ProvinceOptions } from "@/components/ProvincePicker";
import { DEFAULT_PROVINCE, type ProvinceId } from "@/lib/places";

type Role = "passenger" | "driver" | "operator" | "fleet";

/**
 * Only passenger and driver sign-up is offered publicly. Operator accounts are
 * issued by Quallor once an association's licences are verified, and the
 * operator console lives behind /operator. The operator branch below is still
 * reachable with ?role=operator for that internal onboarding.
 */
const PUBLIC_ROLES: Role[] = ["passenger", "driver"];

const ROLE_DETAILS: Record<Role, { icon: string; label: string; tagline: string; description: string }> = {
    passenger: {
        icon: "person",
        label: "Passenger",
        tagline: "Book rides, track taxis, travel smart.",
        description: "Access every route on your metro network, get QR tickets, and track your taxi in real time.",
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
        description: "See your own vehicles and drivers, manage routes, and track revenue across your operation.",
    },
    fleet: {
        icon: "local_taxi",
        label: "Fleet",
        tagline: "Keep every taxi roadworthy.",
        description: "Register vehicles across every operator, run inspections, and take unsafe taxis off the road.",
    },
};

function SignupForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { signup } = useAuth();

    const requestedRole = (searchParams.get("role") as Role) || "passenger";
    const [role, setRole] = useState<Role>(requestedRole);
    const [homeProvince, setHomeProvince] = useState<ProvinceId>(DEFAULT_PROVINCE);

    // Back-office tabs only appear when asked for by URL.
    const visibleRoles: Role[] =
        requestedRole === "operator" ? [...PUBLIC_ROLES, "operator"]
        : requestedRole === "fleet" ? [...PUBLIC_ROLES, "fleet"]
        : PUBLIC_ROLES;

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
    const [staffNumber, setStaffNumber] = useState("");
    const [agreed, setAgreed] = useState(false);
    const [error, setError] = useState("");
    /** Account created, but it needs an emailed confirmation before first sign in. */
    const [notice, setNotice] = useState("");
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
        const result = await signup({
            name,
            email,
            phone,
            password,
            role,
            homeProvince,
            ...(role === "driver" ? { licenseNumber, vehicleModel, vehiclePlate } : {}),
            ...(role === "operator" ? { companyName, fleetSize: parseInt(fleetSize) || 0 } : {}),
            ...(role === "fleet" ? { staffNumber } : {}),
        });
        setLoading(false);
        if (!result.success) {
            setError(result.error || "Registration failed.");
            return;
        }
        // Email confirmation is on for this project, so the account exists but
        // has no session yet. Routing into the app would only bounce to login.
        if (result.notice) {
            setNotice(result.notice);
            return;
        }
        if (role === "driver") router.push("/driver/dashboard");
        else if (role === "operator") router.push("/operator");
        else if (role === "fleet") router.push("/fleet");
        else router.push("/dashboard");
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2" style={{ backgroundColor: "#FFFCF9" }}>
            {/* Left panel - warm branding */}
            <div
                className="hidden lg:flex flex-col px-16 py-20 relative overflow-hidden"
                style={{ backgroundColor: "#E1EDF5" }}
            >
                <div
                    className="absolute inset-0 opacity-[0.07]"
                    style={{
                        backgroundImage: "radial-gradient(circle at 1px 1px, #111 1px, transparent 0)",
                        backgroundSize: "24px 24px",
                    }}
                />

                <Link href="/" className="flex items-center mb-16 relative">
                    <span className="q-wordmark text-2xl" style={{ color: "#111111" }}>Quallor</span>
                </Link>

                <div className="relative flex-1 flex flex-col justify-center">
                    <h2
                        className="font-sans font-black text-3xl mb-4 leading-none"
                        style={{ color: "#111111", letterSpacing: "-0.03em" }}
                    >
                        Join South Africa&apos;s<br />digital taxi network.
                    </h2>
                    <p className="font-sans text-base mb-10" style={{ color: "rgba(17,17,17,0.60)", lineHeight: 1.65 }}>
                        Whether you&apos;re a passenger, a driver, or an operator, Quallor connects you to every route in the region.
                    </p>

                    <div className="space-y-3">
                        {visibleRoles.map((key) => {
                            const detail = ROLE_DETAILS[key];
                            return (
                            <div
                                key={key}
                                className="p-4 flex items-start gap-4 rounded-[14px] transition-all duration-200"
                                style={role === key
                                    ? { backgroundColor: "#FFFFFF", boxShadow: "0 4px 20px rgba(17,17,17,0.12)" }
                                    : { backgroundColor: "rgba(255,255,255,0.40)" }
                                }
                            >
                                <div
                                    className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
                                    style={role === key
                                        ? { backgroundColor: "#111111", color: "#CDDFF6" }
                                        : { backgroundColor: "rgba(17,17,17,0.10)", color: "#5C5A56" }
                                    }
                                >
                                    <span className="material-symbols-outlined text-xl">{detail.icon}</span>
                                </div>
                                <div>
                                    <p className="font-sans font-black text-base" style={{ color: "#111111", letterSpacing: "-0.01em" }}>{detail.label}</p>
                                    <p className="font-sans text-sm" style={{ color: "rgba(17,17,17,0.55)" }}>{detail.description}</p>
                                </div>
                            </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Right panel - form */}
            <div
                className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 min-h-screen"
                style={{ backgroundColor: "#FFFCF9" }}
            >
                <div className="w-full max-w-sm mx-auto">
                    {/* Mobile logo */}
                    <Link href="/" className="flex items-center mb-10 lg:hidden">
                        <span className="q-wordmark text-2xl" style={{ color: "#111111" }}>Quallor</span>
                    </Link>

                    <h1 className="font-sans font-black text-3xl mb-2" style={{ color: "#111111", letterSpacing: "-0.03em", lineHeight: 1.05 }}>
                        Create your account
                    </h1>
                    <p className="font-sans text-sm mb-6" style={{ color: "#8A8678" }}>
                        Join Quallor and start travelling smarter today.
                    </p>

                    {/* Role toggle */}
                    <div
                        className="flex gap-1 p-1 rounded-[14px] mb-6"
                        style={{ backgroundColor: "#EEF1EA" }}
                    >
                        {visibleRoles.map((key) => {
                            const detail = ROLE_DETAILS[key];
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setRole(key)}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] font-sans text-xs font-bold transition-all duration-200"
                                    style={role === key
                                        ? { backgroundColor: "#111111", color: "#FFFFFF" }
                                        : { color: "#8A8678" }
                                    }
                                >
                                    <span className="material-symbols-outlined text-base">{detail.icon}</span>
                                    {detail.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Error */}
                    {error && (
                        <div
                            className="mb-5 px-4 py-3 rounded-[12px] font-sans text-sm font-semibold"
                            style={{ backgroundColor: "rgba(220,38,38,0.07)", border: "1.5px solid rgba(220,38,38,0.20)", color: "#DC2626" }}
                        >
                            {error}
                        </div>
                    )}

                    {notice && (
                        <div
                            className="mb-5 px-4 py-3 rounded-[12px] font-sans text-sm font-semibold"
                            style={{ backgroundColor: "rgba(29,54,134,0.07)", border: "1.5px solid rgba(29,54,134,0.20)", color: "#1D3686" }}
                        >
                            {notice}{" "}
                            <Link href="/auth/login" className="underline">
                                Go to sign in
                            </Link>
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

                        {/* The three metros run separate networks, so this decides
                            which routes and ranks the account sees from here on. */}
                        <div>
                            <label className="q-label">Where do you travel?</label>
                            <ProvinceOptions selected={homeProvince} onSelect={setHomeProvince} />
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

                        {/* Fleet manager */}
                        {role === "fleet" && (
                            <div>
                                <label className="q-label">Staff Number</label>
                                <input
                                    type="text"
                                    className="q-input-lg"
                                    placeholder="e.g. QF-0142"
                                    value={staffNumber}
                                    onChange={(e) => setStaffNumber(e.target.value)}
                                />
                                <p className="font-sans text-xs mt-1.5" style={{ color: "#8A8678" }}>
                                    Shown on every assessment you sign off.
                                </p>
                            </div>
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
                                    className="q-input-lg flex-1"
                                    style={{ borderRadius: "12px 0 0 12px", borderRight: "none" }}
                                    placeholder="Create a password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="h-14 px-4 flex-shrink-0 transition-colors"
                                    style={{
                                        backgroundColor: "#FFFFFF",
                                        border: "1.5px solid rgba(17,17,17,0.12)",
                                        borderLeft: "none",
                                        borderRadius: "0 12px 12px 0",
                                        color: "#AEA89C",
                                    }}
                                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#111111"; }}
                                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#AEA89C"; }}
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
                                className="mt-1 w-4 h-4 rounded"
                                style={{ accentColor: "#111111" }}
                            />
                            <span className="font-sans text-sm" style={{ color: "#5C5A56" }}>
                                I agree to the{" "}
                                <Link href="/terms" className="font-bold hover:underline" style={{ color: "#111111" }}>Terms of Service</Link>
                                {" "}and{" "}
                                <Link href="/privacy" className="font-bold hover:underline" style={{ color: "#111111" }}>Privacy Policy</Link>
                            </span>
                        </label>

                        <button type="submit" disabled={loading} className="q-btn-dark-lg w-full mt-2">
                            {loading ? "Creating account..." : "Create Account"}
                            {!loading && <span className="material-symbols-outlined text-xl">arrow_forward</span>}
                        </button>
                    </form>

                    <p className="font-sans text-sm text-center mt-8" style={{ color: "#8A8678" }}>
                        Already have an account?{" "}
                        <Link href="/auth/login" className="font-bold hover:underline" style={{ color: "#111111" }}>
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
        <Suspense>
            <SignupForm />
        </Suspense>
    );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, type UserRole } from "@/app/context/AuthContext";

/**
 * Gate for the two back-office areas. Neither is linked from passenger or
 * driver navigation: whoever needs one types the URL.
 *
 *   /operator  requires the "operator" role  - runs one fleet
 *   /fleet     requires the "fleet"    role  - the fleet manager, owns the
 *                                              register across every operator
 *
 * An operator hitting /fleet is turned away exactly like a passenger would be,
 * because adding and assessing vehicles is not their job.
 */

interface AreaConfig {
    title: string;
    eyebrow: string;
    signInHeading: string;
    signInBlurb: string;
    /** Shown to a signed-in account that holds the wrong role. */
    deniedBlurb: string;
    contactEmail: string;
    registerHref: string;
    registerLabel: string;
}

const AREAS: Record<UserRole & ("operator" | "fleet"), AreaConfig> = {
    operator: {
        title: "Operator Console",
        eyebrow: "Operator Console",
        signInHeading: "Operator sign in",
        signInBlurb: "Restricted to registered operators and associations.",
        deniedBlurb:
            "The operator console is for registered taxi operators and associations. Your account does not have access.",
        contactEmail: "operators@quallor.co.za",
        registerHref: "/auth/signup?role=operator",
        registerLabel: "Register an operator account",
    },
    fleet: {
        title: "Fleet Management",
        eyebrow: "Fleet Office",
        signInHeading: "Fleet manager sign in",
        signInBlurb: "Restricted to Quallor fleet management staff.",
        deniedBlurb:
            "Fleet management is handled by the Quallor fleet office, not by operators. Vehicles are added, assessed and taken off the road there. Your own fleet is visible in the operator console.",
        contactEmail: "fleet@quallor.co.za",
        registerHref: "/auth/signup?role=fleet",
        registerLabel: "Register a fleet manager account",
    },
};

export default function OperatorGate({
    children,
    area,
}: {
    children: React.ReactNode;
    /** Which back-office area is being guarded. */
    area: "operator" | "fleet";
}) {
    const router = useRouter();
    const { user, login, isLoading } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const config = AREAS[area];

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FFFCF9" }}>
                <div
                    className="w-10 h-10 rounded-full animate-spin"
                    style={{ border: "3px solid rgba(29,54,134,0.20)", borderTopColor: "#1D3686" }}
                />
            </div>
        );
    }

    // Signed in, but holding the wrong role for this area.
    if (user && user.role !== area) {
        const home =
            user.role === "driver" ? "/driver/dashboard"
            : user.role === "operator" ? "/operator"
            : user.role === "fleet" ? "/fleet"
            : "/dashboard";

        return (
            <main className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: "#FFFCF9" }}>
                <div className="max-w-sm w-full text-center">
                    <span className="material-symbols-outlined text-5xl mb-4 block" style={{ color: "#CDDFF6" }}>lock</span>
                    <h1 className="font-sans font-black text-2xl mb-2" style={{ color: "#111111", letterSpacing: "-0.02em" }}>
                        Not available on this account
                    </h1>
                    <p className="font-sans text-sm mb-8" style={{ color: "#8A8678", lineHeight: 1.7 }}>
                        {config.deniedBlurb}
                    </p>
                    <button onClick={() => router.push(home)} className="q-btn-dark w-full justify-center">
                        {user.role === "operator" && area === "fleet" ? "Back to my console" : "Back to my dashboard"}
                    </button>
                </div>
            </main>
        );
    }

    // Not signed in: a sign-in reachable only by URL.
    if (!user) {
        return (
            <main className="min-h-screen flex items-center justify-center px-6 py-16" style={{ backgroundColor: "#FFFCF9" }}>
                <div className="max-w-sm w-full">
                    <Link href="/" className="q-wordmark text-2xl block mb-2" style={{ color: "#111111" }}>Quallor</Link>
                    <p className="q-eyebrow mb-6">{config.eyebrow}</p>

                    <h1 className="font-sans font-black text-2xl mb-2" style={{ color: "#111111", letterSpacing: "-0.03em" }}>
                        {config.signInHeading}
                    </h1>
                    <p className="font-sans text-sm mb-6" style={{ color: "#8A8678", lineHeight: 1.6 }}>
                        {config.signInBlurb}
                    </p>

                    {error && (
                        <div
                            className="mb-5 px-4 py-3 rounded-[12px] font-sans text-sm font-semibold"
                            style={{ backgroundColor: "rgba(220,38,38,0.07)", border: "1.5px solid rgba(220,38,38,0.20)", color: "#DC2626" }}
                        >
                            {error}
                        </div>
                    )}

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            setError("");
                            setBusy(true);
                            const result = login(email.trim(), password);
                            setBusy(false);
                            if (!result.success) setError(result.error || "Sign in failed.");
                            // A wrong-role account falls through to the panel above.
                        }}
                    >
                        <div className="mb-4">
                            <label className="q-label">Email Address</label>
                            <input
                                type="email"
                                className="q-input-lg"
                                placeholder={area === "fleet" ? "you@quallor.co.za" : "operator@example.com"}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="username"
                            />
                        </div>
                        <div className="mb-6">
                            <label className="q-label">Password</label>
                            <input
                                type="password"
                                className="q-input-lg"
                                placeholder="Your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                            />
                        </div>
                        <button type="submit" disabled={busy} className="q-btn-dark-lg w-full justify-center">
                            {busy ? "Signing in..." : "Sign In"}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 text-center" style={{ borderTop: "1px solid rgba(17,17,17,0.08)" }}>
                        <p className="font-sans text-xs mb-4" style={{ color: "#8A8678", lineHeight: 1.7 }}>
                            {area === "fleet"
                                ? "Fleet manager accounts are issued by the Quallor fleet office. Email "
                                : "Operator accounts are issued by Quallor once your association and operating licences are verified. Email "}
                            <a href={`mailto:${config.contactEmail}`} className="font-bold hover:underline" style={{ color: "#1D3686" }}>
                                {config.contactEmail}
                            </a>
                            {area === "fleet" ? " to request access." : " to register a fleet."}
                        </p>
                        {/* Not linked publicly: the onboarding door for somebody sent here directly. */}
                        <Link
                            href={config.registerHref}
                            className="font-mono text-[10px] font-bold uppercase tracking-wider hover:underline"
                            style={{ color: "#1D3686" }}
                        >
                            {config.registerLabel}
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    return <>{children}</>;
}

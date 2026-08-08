"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Reveal, WordReveal } from "@/components/motion";

/* Shared marketing-site pieces: floating pill nav, footer, photo block,
   and the closing CTA band. Used by the landing page and the
   How it works / Why Quallor / Network pages. */

export const NAV_LINKS = [
    { label: "How it works", href: "/how-it-works" },
    { label: "Why Quallor", href: "/why-quallor" },
    { label: "Network", href: "/network" },
];

/* ── Photo block: image when present, colour block otherwise ── */
export function Photo({
    src,
    label,
    className = "",
    rounded = "24px",
    fallback = "#E1EDF5",
}: {
    src: string;
    label: string;
    className?: string;
    rounded?: string;
    fallback?: string;
}) {
    return (
        <div
            className={`relative overflow-hidden ${className}`}
            role="img"
            aria-label={label}
            style={{
                borderRadius: rounded,
                backgroundColor: fallback,
                backgroundImage: `url('${src}')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
        />
    );
}

/* ── Floating white pill nav ── */
export function SiteNav() {
    const [menuOpen, setMenuOpen] = useState(false);
    const pathname = usePathname();

    return (
        <header className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] max-w-3xl">
            <div
                className="flex items-center justify-between gap-4 h-14 pl-4 pr-2 rounded-2xl"
                style={{ backgroundColor: "#FFFFFF", boxShadow: "0 10px 40px rgba(17,17,17,0.16)" }}
            >
                <Link href="/" className="flex items-center flex-shrink-0">
                    <span className="q-wordmark text-2xl" style={{ color: "#111111" }}>
                        Quallor
                    </span>
                </Link>

                <nav className="hidden md:flex items-center gap-6">
                    {NAV_LINKS.map((item) => {
                        const active = pathname === item.href;
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className="font-sans text-sm font-medium transition-colors hover:text-black"
                                style={{ color: active ? "#111111" : "#4D4B47", fontWeight: active ? 700 : 500 }}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                    <Link href="/auth/login" className="font-sans text-sm font-medium transition-colors hover:text-black" style={{ color: "#4D4B47" }}>
                        Sign in
                    </Link>
                </nav>

                <div className="flex items-center gap-1">
                    <Link
                        href="/auth/signup"
                        className="hidden md:inline-flex items-center justify-center h-10 px-5 rounded-xl font-sans font-bold text-sm transition-colors"
                        style={{ backgroundColor: "#1D3686", color: "#FFFFFF" }}
                    >
                        Get started
                    </Link>
                    <button
                        className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl"
                        style={{ color: "#111111" }}
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Menu"
                    >
                        <span className="material-symbols-outlined">{menuOpen ? "close" : "menu"}</span>
                    </button>
                </div>
            </div>

            {menuOpen && (
                <div
                    className="md:hidden mt-2 px-5 py-4 space-y-3 rounded-2xl"
                    style={{ backgroundColor: "#FFFFFF", boxShadow: "0 10px 40px rgba(17,17,17,0.16)" }}
                >
                    {NAV_LINKS.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="block font-sans text-base font-medium py-1.5"
                            style={{ color: "#111111" }}
                            onClick={() => setMenuOpen(false)}
                        >
                            {item.label}
                        </Link>
                    ))}
                    <div className="flex flex-col gap-2 pt-3" style={{ borderTop: "1px solid rgba(17,17,17,0.08)" }}>
                        <Link href="/auth/login" className="q-btn-secondary w-full justify-center">Sign in</Link>
                        <Link
                            href="/auth/signup"
                            className="inline-flex items-center justify-center h-12 rounded-xl font-sans font-bold text-sm"
                            style={{ backgroundColor: "#1D3686", color: "#FFFFFF" }}
                        >
                            Get started
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
}

/* ── Closing CTA band ── */
export function CtaBand({
    eyebrow = "The rank is moving on",
    heading = "Step into Quallor",
    body = "Book your next trip with a confirmed seat and a ticket that never runs out of signal.",
}: {
    eyebrow?: string;
    heading?: string;
    body?: string;
}) {
    return (
        <section className="py-28" style={{ backgroundColor: "#CDDFF6" }}>
            <div className="max-w-4xl mx-auto px-6 text-center">
                <Reveal className="mb-4">
                    <p className="q-eyebrow" style={{ color: "#1D3686" }}>{eyebrow}</p>
                </Reveal>
                <h2 className="q-display mb-8" style={{ fontSize: "clamp(2.6rem, 5.5vw, 4.5rem)" }}>
                    <WordReveal text={heading} />
                </h2>
                <Reveal delay={200}>
                    <p className="q-prose mb-12 mx-auto" style={{ maxWidth: "38ch" }}>{body}</p>
                </Reveal>
                <Reveal delay={320} className="flex flex-wrap gap-4 justify-center">
                    <Link href="/auth/signup" className="q-btn-dark-lg">
                        Get started
                        <span className="material-symbols-outlined text-xl">arrow_forward</span>
                    </Link>
                    <Link href="/auth/login" className="q-btn-outline" style={{ height: "3.5rem", paddingLeft: "2rem", paddingRight: "2rem" }}>
                        Sign in
                    </Link>
                </Reveal>
            </div>
        </section>
    );
}

/* ── Footer ── */
export function SiteFooter() {
    return (
        <footer className="py-16" style={{ backgroundColor: "#111111" }}>
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
                    <div>
                        <Link href="/" className="flex items-center mb-4">
                            <span className="q-wordmark text-2xl" style={{ color: "#FFFFFF" }}>Quallor</span>
                        </Link>
                        <p className="font-sans text-sm leading-relaxed" style={{ color: "#8A8884" }}>
                            Taxi booking and fleet management for the Eastern Cape.
                        </p>
                    </div>
                    {[
                        {
                            title: "Explore",
                            links: [
                                { label: "How it works", href: "/how-it-works" },
                                { label: "Why Quallor", href: "/why-quallor" },
                                { label: "The network", href: "/network" },
                                { label: "Book a ride", href: "/auth/signup" },
                            ],
                        },
                        {
                            title: "For business",
                            links: [
                                { label: "Driver app", href: "/auth/signup?role=driver" },
                                { label: "Operator dashboard", href: "/auth/signup?role=operator" },
                                { label: "Fleet analytics", href: "/why-quallor" },
                                { label: "API access", href: "#" },
                            ],
                        },
                        {
                            title: "Company",
                            links: [
                                { label: "About us", href: "#" },
                                { label: "Careers", href: "#" },
                                { label: "Privacy policy", href: "#" },
                                { label: "Terms of service", href: "#" },
                            ],
                        },
                    ].map((col) => (
                        <div key={col.title}>
                            <p className="font-mono text-xs uppercase tracking-widest mb-4" style={{ color: "#FFFFFF" }}>{col.title}</p>
                            <ul className="space-y-2">
                                {col.links.map((link) => (
                                    <li key={link.label}>
                                        <Link href={link.href} className="font-sans text-sm transition-colors hover:text-white" style={{ color: "#8A8884" }}>
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <p className="font-mono text-xs" style={{ color: "#5C5A56" }}>© 2026 Quallor. Built for the Eastern Cape.</p>
                    <div className="flex items-center gap-4">
                        {["alternate_email", "photo_camera", "work"].map((icon) => (
                            <a
                                key={icon}
                                href="#"
                                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                                style={{ backgroundColor: "rgba(255,255,255,0.07)", color: "#8A8884" }}
                            >
                                <span className="material-symbols-outlined text-sm">{icon}</span>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}

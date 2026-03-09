"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

// ─── NAV ─────────────────────────────────────────────────────────────────────
function NavBar() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const fn = () => setScrolled(window.scrollY > 40);
        window.addEventListener("scroll", fn, { passive: true });
        return () => window.removeEventListener("scroll", fn);
    }, []);

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-q-sm border-b border-q-stone-200" : "bg-transparent"}`}>
            <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[10px] bg-q-brown flex items-center justify-center shadow-q-sm">
                        <span className="font-display font-bold text-white text-lg leading-none">Q</span>
                    </div>
                    <span className="font-display text-xl font-semibold text-q-stone-900">Quallor</span>
                </Link>

                <nav className="hidden md:flex items-center gap-8">
                    {["Routes", "For Drivers", "For Operators", "About"].map((item) => (
                        <a key={item} href="#" className="font-sans text-sm font-medium text-q-stone-600 hover:text-q-brown transition-colors">
                            {item}
                        </a>
                    ))}
                </nav>

                <div className="hidden md:flex items-center gap-3">
                    <Link href="/auth/login" className="q-btn-ghost text-sm px-4 py-2">
                        Sign In
                    </Link>
                    <Link href="/auth/signup" className="q-btn-primary text-sm">
                        Get Started
                    </Link>
                </div>

                <button
                    className="md:hidden flex items-center justify-center w-10 h-10 rounded-[10px] text-q-stone-700 hover:bg-q-stone-100 transition-colors"
                    onClick={() => setMenuOpen(!menuOpen)}
                >
                    <span className="material-symbols-outlined">{menuOpen ? "close" : "menu"}</span>
                </button>
            </div>

            {menuOpen && (
                <div className="md:hidden bg-white border-t border-q-stone-200 px-6 py-4 space-y-3">
                    {["Routes", "For Drivers", "For Operators", "About"].map((item) => (
                        <a key={item} href="#" className="block font-sans text-base font-medium text-q-stone-700 py-2">
                            {item}
                        </a>
                    ))}
                    <div className="flex flex-col gap-2 pt-2 border-t border-q-stone-200">
                        <Link href="/auth/login" className="q-btn-secondary w-full justify-center">Sign In</Link>
                        <Link href="/auth/signup" className="q-btn-primary w-full justify-center">Get Started</Link>
                    </div>
                </div>
            )}
        </header>
    );
}

// ─── HERO ─────────────────────────────────────────────────────────────────────
function Hero() {
    return (
        <section className="relative min-h-screen flex items-center bg-q-bg-page overflow-hidden pt-16">
            {/* Dot grid texture */}
            <div
                className="absolute inset-0 opacity-50"
                style={{
                    backgroundImage: "radial-gradient(#C9B49A 1px, transparent 1px)",
                    backgroundSize: "28px 28px",
                }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-q-bg-page via-transparent to-q-bg-page" />

            <div className="relative max-w-6xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-16 items-center">
                <div className="animate-q-fade-up">
                    <div className="flex items-center gap-2 mb-6">
                        <span className="w-2 h-2 rounded-full bg-q-brown animate-pulse" />
                        <span className="font-sans text-xs font-bold text-q-brown uppercase tracking-widest">Eastern Cape&apos;s Digital Taxi Network</span>
                    </div>

                    <h1 className="font-display text-5xl lg:text-6xl font-semibold text-q-stone-900 mb-6 leading-[1.1]">
                        Book your taxi.<br />
                        <span className="text-q-brown">Track it live.</span><br />
                        Board with a QR.
                    </h1>

                    <p className="q-body text-lg mb-10 max-w-md">
                        Quallor connects passengers, drivers, and operators across the Eastern Cape — with seamless bookings, real-time tracking, and offline support.
                    </p>

                    <div className="flex flex-wrap gap-4">
                        <Link href="/auth/signup" className="q-btn-primary-lg">
                            <span className="material-symbols-outlined text-xl">confirmation_number</span>
                            Book a Ride
                        </Link>
                        <Link href="/auth/signup?role=driver" className="q-btn-secondary">
                            <span className="material-symbols-outlined text-xl">directions_car</span>
                            Register as a Driver
                        </Link>
                    </div>

                    <div className="flex items-center gap-8 mt-12">
                        {[
                            { value: "24+", label: "Active Routes" },
                            { value: "1,200+", label: "Daily Passengers" },
                            { value: "100%", label: "Offline Ready" },
                        ].map((stat) => (
                            <div key={stat.label}>
                                <p className="font-display text-2xl font-bold text-q-brown">{stat.value}</p>
                                <p className="font-sans text-xs font-medium text-q-stone-500">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="hidden lg:block animate-q-scale-in">
                    <div className="relative">
                        {/* Phone mockup */}
                        <div className="mx-auto w-72 bg-white rounded-[40px] shadow-q-2xl border border-q-stone-200 overflow-hidden">
                            <div className="bg-q-bg-section px-6 pt-10 pb-6">
                                <p className="font-sans text-xs font-bold text-q-stone-500 uppercase tracking-wider mb-1">Your Taxi</p>
                                <p className="font-display text-2xl font-semibold text-q-stone-900">Khululeka Express</p>
                                <p className="font-sans text-sm text-q-brown mt-0.5">Arriving in 4 min · Seat A2</p>
                            </div>
                            <div className="h-40 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=600')" }} />
                            <div className="px-6 py-5">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="font-sans text-xs text-q-stone-500">Beacon Bay</p>
                                        <p className="font-sans text-xs text-q-brown font-semibold">→ Amalinda</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-display text-xl font-bold text-q-brown">R 20.00</p>
                                    </div>
                                </div>
                                <div className="w-full h-1.5 bg-q-stone-200 rounded-full overflow-hidden mb-4">
                                    <div className="h-full bg-q-brown rounded-full w-[35%]" />
                                </div>
                                <button className="w-full py-3 rounded-[14px] bg-q-brown text-white font-sans font-semibold text-sm flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-base">qr_code</span>
                                    View Boarding Pass
                                </button>
                            </div>
                        </div>

                        {/* Floating badge */}
                        <div className="absolute -top-4 -right-4 bg-white rounded-[14px] px-4 py-3 shadow-q-lg border border-q-stone-200">
                            <p className="font-sans text-xs font-bold text-green-600 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                Live tracking active
                            </p>
                        </div>

                        {/* Offline badge */}
                        <div className="absolute -bottom-4 -left-4 bg-white rounded-[14px] px-4 py-3 shadow-q-lg border border-q-stone-200">
                            <p className="font-sans text-xs font-bold text-q-brown flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-base">offline_bolt</span>
                                Works offline
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ─── FEATURES ─────────────────────────────────────────────────────────────────
function Features() {
    const features = [
        {
            icon: "confirmation_number",
            title: "Confirmed Seats",
            desc: "Book your exact seat in advance. No more uncertainty at the taxi rank — just a QR code and a confirmed spot.",
        },
        {
            icon: "location_on",
            title: "Real-Time Tracking",
            desc: "See your taxi on the map as it moves toward you. Share your ETA with family or colleagues with one tap.",
        },
        {
            icon: "offline_bolt",
            title: "Works Offline",
            desc: "Your digital ticket is always accessible — even without internet. Perfect for areas with patchy signal.",
        },
        {
            icon: "qr_code_scanner",
            title: "QR Boarding",
            desc: "Board with a simple QR scan. Drivers verify in seconds, keeping queues short and departures on time.",
        },
        {
            icon: "payments",
            title: "Flexible Payment",
            desc: "Pay via app, card, or cash. Drivers can process walk-up passengers and sync later when online.",
        },
        {
            icon: "monitoring",
            title: "Fleet Insights",
            desc: "Operators get a live dashboard of every vehicle, route, and revenue figure — across the entire fleet.",
        },
    ];

    return (
        <section className="bg-white py-24">
            <div className="max-w-6xl mx-auto px-6">
                <div className="text-center mb-16">
                    <p className="font-sans text-xs font-bold text-q-brown uppercase tracking-widest mb-3">Built for the Eastern Cape</p>
                    <h2 className="font-display text-4xl font-semibold text-q-stone-900 mb-4">Everything you need,<br />on every journey.</h2>
                    <p className="q-body max-w-lg mx-auto">From urban commutes to inter-city hikes — Quallor handles the complexity so you can focus on the road.</p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((f, i) => (
                        <div key={i} className="q-card-interactive p-6">
                            <div className="w-12 h-12 rounded-[12px] bg-q-brown-100 flex items-center justify-center mb-5">
                                <span className="material-symbols-outlined text-q-brown text-2xl">{f.icon}</span>
                            </div>
                            <h3 className="font-display text-lg font-semibold text-q-stone-900 mb-2">{f.title}</h3>
                            <p className="font-sans text-sm text-q-stone-500 leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── HOW IT WORKS ─────────────────────────────────────────────────────────────
function HowItWorks() {
    const steps = [
        { num: "01", title: "Choose your route", desc: "Browse daily commute routes or long-distance hikes across the Eastern Cape." },
        { num: "02", title: "Pick your seat", desc: "Select your exact seat on a live seat map. Pay by app, card, or cash." },
        { num: "03", title: "Track & board", desc: "Watch your taxi approach in real time, then board with a QR scan." },
    ];

    return (
        <section className="bg-q-bg-section py-24">
            <div className="max-w-6xl mx-auto px-6">
                <div className="text-center mb-16">
                    <p className="font-sans text-xs font-bold text-q-brown uppercase tracking-widest mb-3">Simple by design</p>
                    <h2 className="font-display text-4xl font-semibold text-q-stone-900">How Quallor works</h2>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {steps.map((step, i) => (
                        <div key={i} className="relative">
                            {i < steps.length - 1 && (
                                <div className="hidden lg:block absolute top-10 left-full w-full h-px bg-q-brown-200 -translate-x-1/2 z-0" />
                            )}
                            <div className="relative q-card p-8 text-center">
                                <div className="w-16 h-16 rounded-full bg-q-brown flex items-center justify-center mx-auto mb-6 shadow-q-md">
                                    <span className="font-display text-xl font-bold text-white">{step.num}</span>
                                </div>
                                <h3 className="font-display text-xl font-semibold text-q-stone-900 mb-3">{step.title}</h3>
                                <p className="font-sans text-sm text-q-stone-500 leading-relaxed">{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── ROLES ────────────────────────────────────────────────────────────────────
function Roles() {
    const roles = [
        {
            role: "Passenger",
            icon: "person",
            headline: "Travel smarter across the Eastern Cape",
            points: [
                "Book any route with a confirmed seat",
                "Real-time taxi tracking on the map",
                "Digital QR boarding pass — works offline",
                "Transparent fixed fares, no surprises",
            ],
            cta: "Book a Ride",
            href: "/auth/signup",
        },
        {
            role: "Driver",
            icon: "directions_car",
            headline: "Manage your passengers, grow your earnings",
            points: [
                "View your full passenger manifest",
                "Scan QR codes to verify boarding",
                "Add walk-up passengers with cash/card",
                "Offline mode with automatic sync",
            ],
            cta: "Register as Driver",
            href: "/auth/signup?role=driver",
            featured: true,
        },
        {
            role: "Operator",
            icon: "business",
            headline: "Run your fleet with full visibility",
            points: [
                "Live dashboard for every vehicle",
                "Revenue and trip analytics",
                "Driver management and onboarding",
                "Safety alerts and fleet compliance",
            ],
            cta: "Register as Operator",
            href: "/auth/signup?role=operator",
        },
    ];

    return (
        <section className="bg-white py-24">
            <div className="max-w-6xl mx-auto px-6">
                <div className="text-center mb-16">
                    <p className="font-sans text-xs font-bold text-q-brown uppercase tracking-widest mb-3">For everyone on the road</p>
                    <h2 className="font-display text-4xl font-semibold text-q-stone-900">One platform.<br />Three roles.</h2>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {roles.map((r, i) => (
                        <div
                            key={i}
                            className={`rounded-[24px] p-8 flex flex-col ${r.featured ? "bg-q-brown text-white shadow-q-2xl" : "bg-q-bg-section border border-q-stone-200"}`}
                        >
                            <div className={`w-12 h-12 rounded-[12px] flex items-center justify-center mb-6 ${r.featured ? "bg-white/20" : "bg-q-brown-100"}`}>
                                <span className={`material-symbols-outlined text-2xl ${r.featured ? "text-white" : "text-q-brown"}`}>{r.icon}</span>
                            </div>

                            <p className={`font-sans text-xs font-bold uppercase tracking-widest mb-2 ${r.featured ? "text-white/70" : "text-q-brown"}`}>{r.role}</p>
                            <h3 className={`font-display text-xl font-semibold mb-5 leading-snug ${r.featured ? "text-white" : "text-q-stone-900"}`}>{r.headline}</h3>

                            <ul className="space-y-3 flex-1 mb-8">
                                {r.points.map((p, j) => (
                                    <li key={j} className="flex items-start gap-3">
                                        <span className={`material-symbols-outlined text-base flex-shrink-0 mt-0.5 ${r.featured ? "text-white/80" : "text-q-brown"}`} style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                        <span className={`font-sans text-sm ${r.featured ? "text-white/90" : "text-q-stone-600"}`}>{p}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href={r.href}
                                className={`flex items-center justify-center gap-2 py-3 rounded-[14px] font-sans font-semibold text-sm transition-all ${
                                    r.featured
                                        ? "bg-white text-q-brown hover:bg-q-stone-50"
                                        : "bg-q-brown text-white hover:bg-q-brown-600"
                                }`}
                            >
                                {r.cta}
                                <span className="material-symbols-outlined text-base">arrow_forward</span>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── TESTIMONIALS ─────────────────────────────────────────────────────────────
function Testimonials() {
    const quotes = [
        { name: "Thabo M.", role: "Daily Commuter, East London", text: "Before Quallor I never knew if the taxi was coming. Now I book my seat the night before and track it on my phone. Changed everything." },
        { name: "Sipho N.", role: "Taxi Driver, Beacon Bay Route", text: "The walk-up feature is perfect for days when internet is poor. I can still process cash passengers and sync later. My boss can see everything." },
        { name: "Nolwazi K.", role: "Fleet Operator, EC Commuters Association", text: "The analytics dashboard alone saved us hours every week. We can see which routes are profitable and respond quickly to driver issues." },
    ];

    return (
        <section className="bg-q-bg-section py-24">
            <div className="max-w-6xl mx-auto px-6">
                <div className="text-center mb-16">
                    <p className="font-sans text-xs font-bold text-q-brown uppercase tracking-widest mb-3">Trusted by commuters</p>
                    <h2 className="font-display text-4xl font-semibold text-q-stone-900">Real people, real routes.</h2>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {quotes.map((q, i) => (
                        <div key={i} className="q-card p-8">
                            <div className="flex gap-0.5 mb-6">
                                {Array(5).fill(0).map((_, j) => (
                                    <span key={j} className="material-symbols-outlined text-q-brown text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                ))}
                            </div>
                            <p className="font-sans text-base text-q-stone-700 leading-relaxed mb-6 italic">&ldquo;{q.text}&rdquo;</p>
                            <div>
                                <p className="font-sans font-semibold text-q-stone-900">{q.name}</p>
                                <p className="font-sans text-xs text-q-stone-500">{q.role}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────
function CTA() {
    return (
        <section className="bg-q-brown py-24">
            <div className="max-w-3xl mx-auto px-6 text-center">
                <h2 className="font-display text-4xl lg:text-5xl font-semibold text-white mb-6 leading-tight">
                    Ready to travel smarter<br />in the Eastern Cape?
                </h2>
                <p className="font-sans text-lg text-white/80 mb-10 max-w-lg mx-auto">
                    Join thousands of passengers, drivers and operators who have made Quallor part of their daily commute.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                    <Link
                        href="/auth/signup"
                        className="flex items-center gap-2 px-8 py-4 rounded-[14px] bg-white text-q-brown font-sans font-bold text-base hover:bg-q-stone-50 transition-colors shadow-q-cta"
                    >
                        <span className="material-symbols-outlined">confirmation_number</span>
                        Get Started Free
                    </Link>
                    <Link
                        href="/auth/login"
                        className="flex items-center gap-2 px-8 py-4 rounded-[14px] bg-white/10 text-white font-sans font-semibold text-base hover:bg-white/20 transition-colors border border-white/20"
                    >
                        Sign In
                    </Link>
                </div>
            </div>
        </section>
    );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
function Footer() {
    return (
        <footer className="bg-q-stone-900 text-q-stone-400 py-16">
            <div className="max-w-6xl mx-auto px-6">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
                    <div>
                        <Link href="/" className="flex items-center gap-3 mb-4">
                            <div className="w-9 h-9 rounded-[10px] bg-q-brown flex items-center justify-center">
                                <span className="font-display font-bold text-white text-lg leading-none">Q</span>
                            </div>
                            <span className="font-display text-xl font-semibold text-white">Quallor</span>
                        </Link>
                        <p className="font-sans text-sm text-q-stone-500 leading-relaxed">
                            The Eastern Cape&apos;s digital taxi booking and management platform.
                        </p>
                    </div>
                    {[
                        { title: "Product", links: ["Book a Ride", "Track My Taxi", "Digital Tickets", "Offline Mode"] },
                        { title: "For Business", links: ["Driver App", "Operator Dashboard", "Fleet Analytics", "API Access"] },
                        { title: "Company", links: ["About Us", "Careers", "Privacy Policy", "Terms of Service"] },
                    ].map((col) => (
                        <div key={col.title}>
                            <p className="font-sans text-sm font-bold text-white uppercase tracking-widest mb-4">{col.title}</p>
                            <ul className="space-y-2">
                                {col.links.map((link) => (
                                    <li key={link}>
                                        <a href="#" className="font-sans text-sm text-q-stone-500 hover:text-q-brown transition-colors">{link}</a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="border-t border-q-stone-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="font-sans text-sm text-q-stone-600">© 2026 Quallor. Built for the Eastern Cape.</p>
                    <div className="flex items-center gap-4">
                        {["twitter", "instagram", "linkedin"].map((s) => (
                            <a key={s} href="#" className="w-9 h-9 rounded-full bg-q-stone-800 flex items-center justify-center hover:bg-q-brown transition-colors text-q-stone-400 hover:text-white">
                                <span className="material-symbols-outlined text-sm">{s === "twitter" ? "alternate_email" : s === "instagram" ? "photo_camera" : "work"}</span>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
    return (
        <>
            <NavBar />
            <Hero />
            <Features />
            <HowItWorks />
            <Roles />
            <Testimonials />
            <CTA />
            <Footer />
        </>
    );
}

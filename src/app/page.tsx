"use client";

import React from "react";
import Link from "next/link";
import { Reveal, WordReveal } from "@/components/motion";
import { SiteNav, SiteFooter, CtaBand, Photo } from "@/components/marketing";

/*
  Landing page, styled after godaylight.com:
  big serif headlines that reveal word by word, mono uppercase eyebrows,
  full-bleed photography, alternating light and dark bands, one idea per screen.

  Nav, footer, CTA band, and the Photo block live in components/marketing.tsx
  and are shared with /how-it-works, /why-quallor, and /network.
*/

/* ── HERO: full-bleed photo, white serif headline over the image ── */
function Hero() {
    return (
        <section className="relative min-h-screen flex flex-col justify-end overflow-hidden">
            {/* Background photograph */}
            <div
                className="absolute inset-0"
                role="img"
                aria-label="Minibus taxis lined up at the rank"
                style={{
                    backgroundImage: "url('/images/quantum4.jpg')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            />
            {/* Legibility overlay */}
            <div
                className="absolute inset-0"
                style={{
                    background:
                        "linear-gradient(100deg, rgba(10,8,4,0.68) 0%, rgba(10,8,4,0.34) 55%, rgba(10,8,4,0.45) 100%)",
                }}
            />

            {/* Hairline grid, like Daylight's */}
            <div className="absolute top-0 bottom-0 hidden lg:block" style={{ left: "64%", width: 1, backgroundColor: "rgba(255,255,255,0.22)" }} />
            <div className="absolute left-0 right-0 hidden lg:block" style={{ top: "42%", height: 1, backgroundColor: "rgba(255,255,255,0.22)" }} />

            {/* Content */}
            <div className="relative w-full max-w-[1400px] mx-auto px-6 sm:px-10 pb-14 pt-40">
                <Reveal delay={200} className="mb-6">
                    <span
                        className="font-mono text-xs font-medium uppercase"
                        style={{ color: "rgba(255,255,255,0.9)", letterSpacing: "0.3em" }}
                    >
                        Rides you control
                    </span>
                </Reveal>

                <h1
                    className="mb-10"
                    style={{
                        fontFamily: '"Fraunces", Georgia, serif',
                        fontWeight: 400,
                        fontSize: "clamp(3.2rem, 7.5vw, 6.8rem)",
                        lineHeight: 1.08,
                        letterSpacing: "-0.02em",
                        color: "#FFF7E9",
                        maxWidth: "13ch",
                    }}
                >
                    <WordReveal text="Ride the rank on your terms" delay={300} stagger={90} />
                </h1>

                <Reveal delay={800} className="mb-12">
                    <p
                        className="font-sans text-xl sm:text-2xl leading-snug"
                        style={{ color: "rgba(255,255,255,0.92)", maxWidth: "26ch" }}
                    >
                        Confirmed seats and live tracking. A QR ticket that works without signal.
                    </p>
                </Reveal>

                <Reveal delay={950} className="flex flex-wrap gap-4">
                    <Link href="/auth/signup" className="q-btn-primary-lg">
                        Book a seat
                        <span className="material-symbols-outlined text-xl">arrow_forward</span>
                    </Link>
                    <Link
                        href="/auth/signup?role=driver"
                        className="inline-flex items-center justify-center h-14 px-8 rounded-full font-mono text-sm font-medium uppercase tracking-wider transition-colors hover:bg-white/10"
                        style={{ color: "#FFFFFF", border: "1.5px solid rgba(255,255,255,0.55)" }}
                    >
                        Drive with Quallor
                    </Link>
                </Reveal>
            </div>
        </section>
    );
}

/* ── THREE PILLARS: BOOK / TRACK / BOARD ── */
function Pillars() {
    const pillars = [
        {
            eyebrow: "Book",
            statement: "Pick your seat before you leave the house",
            src: "/images/quantum1.jpg",
            label: "Quallor minibus taxi ready for booking",
            fallback: "#EEF1EA",
        },
        {
            eyebrow: "Track",
            statement: "Watch your taxi move on the map in real time",
            src: "/images/quantum5.jpg",
            label: "Minibus taxi on the road",
            fallback: "#E1EDF5",
        },
        {
            eyebrow: "Board",
            statement: "Scan one QR code and take your seat",
            src: "/images/quantum6.jpg",
            label: "Gaatjie opening the taxi door for boarding",
            fallback: "#EEF1EA",
        },
    ];

    return (
        <section className="py-24" style={{ backgroundColor: "#FFFCF9" }}>
            <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-6">
                {pillars.map((p, i) => (
                    <Reveal key={p.eyebrow} delay={i * 140}>
                        <div
                            className="relative overflow-hidden h-[520px] lg:h-[560px]"
                            style={{ borderRadius: "28px", backgroundColor: p.fallback }}
                        >
                            {/* Photo */}
                            <div
                                className="absolute inset-0"
                                role="img"
                                aria-label={p.label}
                                style={{
                                    backgroundImage: `url('${p.src}')`,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                }}
                            />
                            {/* Soft darkening so the glass panel reads */}
                            <div
                                className="absolute inset-0"
                                style={{ background: "linear-gradient(180deg, rgba(10,8,4,0.10) 0%, rgba(10,8,4,0.30) 100%)" }}
                            />

                            {/* Frosted glass panel, sized to its text, centred in the card */}
                            <div
                                className="absolute left-5 right-5 sm:left-6 sm:right-6 top-1/2 -translate-y-1/2 p-6"
                                style={{
                                    borderRadius: "20px",
                                    backgroundColor: "rgba(28,26,22,0.38)",
                                    backdropFilter: "blur(14px)",
                                    WebkitBackdropFilter: "blur(14px)",
                                    border: "1px solid rgba(255,255,255,0.14)",
                                }}
                            >
                                <p
                                    className="font-mono text-[0.66rem] font-medium uppercase mb-4"
                                    style={{ color: "#CDDFF6", letterSpacing: "0.22em" }}
                                >
                                    {p.eyebrow}
                                </p>
                                <h3
                                    style={{
                                        fontFamily: '"Fraunces", Georgia, serif',
                                        fontWeight: 500,
                                        fontSize: "clamp(1.5rem, 2vw, 1.9rem)",
                                        lineHeight: 1.18,
                                        letterSpacing: "-0.01em",
                                        color: "#FFF7E9",
                                    }}
                                >
                                    {p.statement}
                                </h3>
                                <div className="flex items-center justify-between mt-6">
                                    <span className="font-sans text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
                                        Step 0{i + 1}
                                    </span>
                                    <span className="material-symbols-outlined text-xl" style={{ color: "rgba(255,255,255,0.75)" }}>
                                        arrow_outward
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Reveal>
                ))}
            </div>
        </section>
    );
}

/* ── HOW QUALLOR WORKS: intro + 3 steps ── */
function HowItWorks() {
    const steps = [
        {
            num: "Step 1",
            title: "Choose your route",
            eyebrow: "Every route, one app",
            body: "Browse daily commutes and long-distance hikes across the Eastern Cape. Fixed fares are shown upfront, so the price you see is the price you pay.",
            src: "/images/quantum3.jpg",
            label: "Minibus taxi on a city route",
        },
        {
            num: "Step 2",
            title: "Pick your seat",
            eyebrow: "A confirmed spot, not a queue",
            body: "Choose your exact seat on a live seat map and pay by app, card, or cash. Your ticket is issued instantly and stored on your phone.",
            src: "/images/quantum2.jpg",
            label: "Freshly washed minibus taxi",
        },
        {
            num: "Step 3",
            title: "Track and board",
            eyebrow: "Rides you control",
            body: "Watch the taxi approach in real time, walk out as it arrives, and board with a single QR scan. The ticket keeps working even with no signal.",
            src: "/images/quantum6.jpg",
            label: "Boarding through the sliding door",
        },
    ];

    return (
        <section id="how" className="py-28" style={{ backgroundColor: "#FFFFFF" }}>
            <div className="max-w-7xl mx-auto px-6">
                <Reveal className="mb-4">
                    <p className="q-eyebrow">How Quallor works</p>
                </Reveal>
                <h2 className="q-display mb-8" style={{ fontSize: "clamp(2.4rem, 5vw, 4.2rem)", maxWidth: "18ch" }}>
                    <WordReveal text="A new way to ride the routes you already know" />
                </h2>
                <Reveal delay={200} className="mb-20">
                    <p className="q-prose" style={{ maxWidth: "48ch" }}>
                        Quallor connects passengers, drivers, and operators on the same trips.
                        You book the seat, the driver sees the manifest, and the operator sees the fleet.
                    </p>
                </Reveal>

                <div className="space-y-24">
                    {steps.map((s, i) => (
                        <div key={s.num} className={`grid lg:grid-cols-2 gap-10 lg:gap-16 items-center`}>
                            <Reveal className={i % 2 === 1 ? "lg:order-2" : ""}>
                                <p className="q-eyebrow mb-4" style={{ color: "#1D3686" }}>{s.num}</p>
                                <h3 className="q-heading mb-3" style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)" }}>{s.title}</h3>
                                <p className="font-mono text-xs uppercase tracking-widest mb-5" style={{ color: "#8A8884" }}>{s.eyebrow}</p>
                                <p className="q-body" style={{ maxWidth: "46ch" }}>{s.body}</p>
                            </Reveal>
                            <Reveal variant="media" delay={120} className={i % 2 === 1 ? "lg:order-1" : ""}>
                                <Photo src={s.src} label={s.label} className="h-[340px] lg:h-[420px]" fallback={i % 2 === 0 ? "#EEF1EA" : "#E1EDF5"} />
                            </Reveal>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ── WHY QUALLOR: dark band ── */
function Why() {
    const risks = [
        "Waiting at the rank with no idea when the taxi fills up",
        "Cash-only fares with no record and no receipt",
        "Operators running whole fleets on paper and phone calls",
    ];

    return (
        <section id="why" className="py-28" style={{ backgroundColor: "#1F1F1F" }}>
            <div className="max-w-7xl mx-auto px-6">
                <Reveal className="mb-4">
                    <p className="q-eyebrow" style={{ color: "rgba(255,255,255,0.45)" }}>Why Quallor</p>
                </Reveal>
                <h2 className="q-display mb-16" style={{ fontSize: "clamp(2.4rem, 5vw, 4.2rem)", color: "#FFFCF9", maxWidth: "18ch" }}>
                    <WordReveal text="The rank was built for yesterday's commute" />
                </h2>

                <div className="grid lg:grid-cols-2 gap-14">
                    <div>
                        <Reveal>
                            <p className="font-mono text-xs uppercase tracking-widest mb-6" style={{ color: "#CDDFF6" }}>The problem</p>
                        </Reveal>
                        <ul className="space-y-6">
                            {risks.map((r, i) => (
                                <Reveal key={i} delay={i * 120} as="li" className="flex items-start gap-4 pb-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                                    <span className="font-mono text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>0{i + 1}</span>
                                    <p className="q-prose" style={{ color: "rgba(255,252,249,0.85)", fontSize: "1.05rem" }}>{r}</p>
                                </Reveal>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <Reveal>
                            <p className="font-mono text-xs uppercase tracking-widest mb-6" style={{ color: "#CDDFF6" }}>One route at a time</p>
                        </Reveal>
                        <Reveal delay={120}>
                            <p className="q-prose mb-10" style={{ color: "#FFFCF9", fontSize: "1.35rem", maxWidth: "34ch" }}>
                                Quallor puts the whole trip on one screen: the passenger&apos;s seat, the driver&apos;s
                                manifest, and the operator&apos;s fleet.
                            </p>
                        </Reveal>
                        <div className="grid grid-cols-3 gap-6">
                            {[
                                { value: "24+", label: "Active routes" },
                                { value: "1,200+", label: "Daily passengers" },
                                { value: "100%", label: "Offline ready" },
                            ].map((stat, i) => (
                                <Reveal key={stat.label} delay={200 + i * 100}>
                                    <p className="font-sans font-black text-3xl mb-1" style={{ color: "#CDDFF6", letterSpacing: "-0.03em" }}>{stat.value}</p>
                                    <p className="font-mono text-[0.62rem] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>{stat.label}</p>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ── NETWORK: marquee + statement ── */
function Network() {
    const routes = [
        "East London", "Mdantsane", "Beacon Bay", "Amalinda", "King William's Town",
        "Gqeberha", "Mthatha", "Butterworth", "Komani", "Zwelitsha",
    ];

    return (
        <section id="network" className="py-28 overflow-hidden" style={{ backgroundColor: "#E1EDF5" }}>
            <div className="max-w-7xl mx-auto px-6 mb-14">
                <Reveal className="mb-4">
                    <p className="q-eyebrow" style={{ color: "#1D3686" }}>A growing network</p>
                </Reveal>
                <h2 className="q-display mb-8" style={{ fontSize: "clamp(2.4rem, 5vw, 4.2rem)", maxWidth: "16ch" }}>
                    <WordReveal text="Every trip makes the network stronger" />
                </h2>
                <Reveal delay={200}>
                    <p className="q-prose" style={{ maxWidth: "46ch" }}>
                        Each booked seat gives drivers a fuller manifest and operators a clearer
                        picture of their routes. The more the network carries, the better it runs.
                    </p>
                </Reveal>
            </div>

            {/* Route marquee */}
            <div className="q-marquee mb-14" aria-hidden>
                <div className="q-marquee__track" style={{ color: "#1D3686" }}>
                    {[...routes, ...routes].map((r, i) => (
                        <span key={i} className="flex items-center gap-10">
                            {r}
                            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: "#1D3686" }} />
                        </span>
                    ))}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6">
                <Reveal variant="media">
                    <Photo
                        src="/images/quantum4.jpg"
                        label="Taxis across the Eastern Cape network"
                        className="w-full h-[40vh] min-h-[280px]"
                        fallback="#CDDFF6"
                    />
                </Reveal>
            </div>
        </section>
    );
}

/* ── ROLES ── */
function Roles() {
    const roles = [
        {
            role: "Passengers",
            headline: "Travel with a confirmed seat",
            points: ["Book any route in advance", "Track the taxi on a live map", "QR ticket that works offline", "Fixed fares with no surprises"],
            cta: "Book a seat",
            href: "/auth/signup",
        },
        {
            role: "Drivers",
            headline: "Run fuller trips with less admin",
            points: ["See your passenger manifest", "Scan QR codes to verify boarding", "Add walk-up passengers in seconds", "Offline mode that syncs later"],
            cta: "Drive with Quallor",
            href: "/auth/signup?role=driver",
        },
        {
            role: "Operators",
            headline: "See your whole fleet at once",
            points: ["Live dashboard for every vehicle", "Revenue and trip analytics", "Driver onboarding and management", "Safety alerts across the fleet"],
            cta: "Register a fleet",
            href: "/auth/signup?role=operator",
        },
    ];

    return (
        <section className="py-28" style={{ backgroundColor: "#FFFCF9" }}>
            <div className="max-w-7xl mx-auto px-6">
                <Reveal className="mb-4">
                    <p className="q-eyebrow">Built for everyone on the road</p>
                </Reveal>
                <h2 className="q-display mb-16" style={{ fontSize: "clamp(2.4rem, 5vw, 4rem)", maxWidth: "16ch" }}>
                    <WordReveal text="One platform, three seats at the table" />
                </h2>

                <div className="grid lg:grid-cols-3 gap-6">
                    {roles.map((r, i) => (
                        <Reveal key={r.role} delay={i * 130} className="q-card p-8 flex flex-col">
                            <p className="q-eyebrow mb-3" style={{ color: "#1D3686" }}>{r.role}</p>
                            <h3 className="q-heading mb-6" style={{ fontSize: "1.5rem" }}>{r.headline}</h3>
                            <ul className="space-y-3 flex-1 mb-8">
                                {r.points.map((p) => (
                                    <li key={p} className="flex items-start gap-3">
                                        <span className="material-symbols-outlined text-base flex-shrink-0 mt-0.5" style={{ color: "#1D3686" }}>
                                            check
                                        </span>
                                        <span className="q-body text-sm">{p}</span>
                                    </li>
                                ))}
                            </ul>
                            <Link href={r.href} className="q-btn-secondary w-full justify-center">
                                {r.cta}
                            </Link>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default function HomePage() {
    return (
        <>
            <SiteNav />
            <Hero />
            <Pillars />
            <HowItWorks />
            <Why />
            <Network />
            <Roles />
            <CtaBand
                eyebrow="The rank is moving on"
                heading="Step into Quallor"
                body="Ready to control your ride? Book your next trip with a confirmed seat and a ticket that never runs out of signal."
            />
            <SiteFooter />
        </>
    );
}

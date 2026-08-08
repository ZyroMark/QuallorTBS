"use client";

import React from "react";
import { Reveal, WordReveal } from "@/components/motion";
import { SiteNav, SiteFooter, CtaBand, Photo, SceneBanner } from "@/components/marketing";

const STEPS = [
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

const DETAILS = [
    {
        icon: "qr_code_2",
        title: "QR tickets",
        body: "Every booking becomes a QR boarding pass. Drivers scan it in seconds, and it stays valid with no signal at all.",
    },
    {
        icon: "payments",
        title: "Pay your way",
        body: "Pay in the app, by card, or hand cash to the gaatjie. Walk-up passengers get the same digital ticket.",
    },
    {
        icon: "offline_bolt",
        title: "Built for low signal",
        body: "Tickets, manifests, and bookings keep working offline and sync automatically once the connection returns.",
    },
];

export default function HowItWorksPage() {
    return (
        <>
            <SiteNav />

            {/* Banner */}
            <SceneBanner
                eyebrow="How Quallor works"
                skyLines={["Book,"]}
                fieldLines={["track,", "hop", "in."]}
                body="Quallor puts the passenger, the driver, and the operator on the same trip. You book the seat, the driver sees the manifest, and the fleet stays in view."
            />

            {/* Steps */}
            <section className="py-24" style={{ backgroundColor: "#FFFFFF" }}>
                <div className="max-w-7xl mx-auto px-6 space-y-24">
                    {STEPS.map((s, i) => (
                        <div key={s.num} className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                            <Reveal className={i % 2 === 1 ? "lg:order-2" : ""}>
                                <p className="q-eyebrow mb-4" style={{ color: "#1D3686" }}>{s.num}</p>
                                <h2 className="q-heading mb-3" style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)" }}>{s.title}</h2>
                                <p className="font-mono text-xs uppercase tracking-widest mb-5" style={{ color: "#8A8884" }}>{s.eyebrow}</p>
                                <p className="q-body" style={{ maxWidth: "46ch" }}>{s.body}</p>
                            </Reveal>
                            <Reveal variant="media" delay={120} className={i % 2 === 1 ? "lg:order-1" : ""}>
                                <Photo src={s.src} label={s.label} className="h-[340px] lg:h-[420px]" fallback={i % 2 === 0 ? "#EEF1EA" : "#E1EDF5"} />
                            </Reveal>
                        </div>
                    ))}
                </div>
            </section>

            {/* Detail cards */}
            <section className="py-24" style={{ backgroundColor: "#EEF1EA" }}>
                <div className="max-w-7xl mx-auto px-6">
                    <Reveal className="mb-4">
                        <p className="q-eyebrow">The details</p>
                    </Reveal>
                    <h2 className="q-display mb-14" style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", maxWidth: "18ch" }}>
                        <WordReveal text="Small things that make the trip smooth" />
                    </h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {DETAILS.map((d, i) => (
                            <Reveal key={d.title} delay={i * 130} className="q-card p-8">
                                <span className="material-symbols-outlined text-3xl mb-5 inline-block" style={{ color: "#1D3686" }}>{d.icon}</span>
                                <h3 className="q-heading mb-3" style={{ fontSize: "1.35rem" }}>{d.title}</h3>
                                <p className="q-body text-sm">{d.body}</p>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            <CtaBand
                eyebrow="Ready when you are"
                heading="Book your first seat"
                body="Set up your account in a minute and your next trip starts with a confirmed seat."
            />
            <SiteFooter />
        </>
    );
}

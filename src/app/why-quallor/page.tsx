"use client";

import React from "react";
import { Reveal, WordReveal } from "@/components/motion";
import { SiteNav, SiteFooter, CtaBand, Photo, SceneBanner } from "@/components/marketing";

const PROBLEMS = [
    "Waiting at the rank with no idea when the taxi fills up",
    "Cash-only fares with no record and no receipt",
    "Operators running whole fleets on paper and phone calls",
];

const ANSWERS = [
    {
        role: "For passengers",
        title: "Certainty before you leave home",
        body: "A booked seat, a fixed fare, and a live map of the taxi on its way. No guessing at the rank.",
    },
    {
        role: "For drivers",
        title: "Fuller trips with less admin",
        body: "The manifest fills itself as passengers book. Walk-ups are added in seconds, and everything syncs when signal returns.",
    },
    {
        role: "For operators",
        title: "The whole fleet on one screen",
        body: "Live vehicle status, route revenue, and driver management in a single dashboard instead of a stack of notebooks.",
    },
];

export default function WhyQuallorPage() {
    return (
        <>
            <SiteNav />

            {/* Banner */}
            <SceneBanner
                eyebrow="Why Quallor"
                skyLines={["Come,"]}
                fieldLines={["take", "a", "seat."]}
                body="Minibus taxis carry most of South Africa every single day, and almost all of it still runs on queues, cash, and guesswork. Quallor keeps what works and fixes what does not."
            />

            {/* Dark problem band */}
            <section className="py-28" style={{ backgroundColor: "#1F1F1F" }}>
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-14">
                        <div>
                            <Reveal>
                                <p className="font-mono text-xs uppercase tracking-widest mb-6" style={{ color: "#CDDFF6" }}>The problem</p>
                            </Reveal>
                            <ul className="space-y-6">
                                {PROBLEMS.map((r, i) => (
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
                                    Quallor puts the whole trip on one screen: the passenger&apos;s seat,
                                    the driver&apos;s manifest, and the operator&apos;s fleet.
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

            {/* Answers per role */}
            <section className="py-24" style={{ backgroundColor: "#FFFCF9" }}>
                <div className="max-w-7xl mx-auto px-6">
                    <Reveal className="mb-4">
                        <p className="q-eyebrow">What changes with Quallor</p>
                    </Reveal>
                    <h2 className="q-display mb-14" style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", maxWidth: "18ch" }}>
                        <WordReveal text="One trip, three people, zero guesswork" />
                    </h2>
                    <div className="grid md:grid-cols-3 gap-6 mb-16">
                        {ANSWERS.map((a, i) => (
                            <Reveal key={a.role} delay={i * 130} className="q-card p-8">
                                <p className="q-eyebrow mb-3" style={{ color: "#1D3686" }}>{a.role}</p>
                                <h3 className="q-heading mb-3" style={{ fontSize: "1.4rem" }}>{a.title}</h3>
                                <p className="q-body text-sm">{a.body}</p>
                            </Reveal>
                        ))}
                    </div>
                    <Reveal variant="media">
                        <Photo
                            src="/images/quantum5.jpg"
                            label="Minibus taxi on the road"
                            className="w-full h-[40vh] min-h-[280px]"
                        />
                    </Reveal>
                </div>
            </section>

            <CtaBand
                eyebrow="See it for yourself"
                heading="Ride with certainty"
                body="Join the passengers, drivers, and operators already running their trips through Quallor."
            />
            <SiteFooter />
        </>
    );
}

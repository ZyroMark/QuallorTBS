"use client";

import React from "react";
import { Reveal, WordReveal } from "@/components/motion";
import { SiteNav, SiteFooter, CtaBand, Photo } from "@/components/marketing";

const ROUTES = [
    "East London", "Mdantsane", "Beacon Bay", "Amalinda", "King William's Town",
    "Gqeberha", "Mthatha", "Butterworth", "Komani", "Zwelitsha",
];

const CORRIDORS = [
    { from: "East London", to: "Mdantsane", kind: "Daily commute" },
    { from: "Beacon Bay", to: "Amalinda", kind: "Daily commute" },
    { from: "East London", to: "King William's Town", kind: "Daily commute" },
    { from: "East London", to: "Mthatha", kind: "Long distance" },
    { from: "East London", to: "Gqeberha", kind: "Long distance" },
    { from: "Komani", to: "Butterworth", kind: "Long distance" },
];

export default function NetworkPage() {
    return (
        <>
            <SiteNav />

            {/* Intro */}
            <section className="pt-44 pb-20 overflow-hidden" style={{ backgroundColor: "#E1EDF5" }}>
                <div className="max-w-7xl mx-auto px-6 mb-14">
                    <Reveal className="mb-4">
                        <p className="q-eyebrow" style={{ color: "#1D3686" }}>A growing network</p>
                    </Reveal>
                    <h1 className="q-display mb-8" style={{ fontSize: "clamp(2.8rem, 6.5vw, 5.5rem)", maxWidth: "16ch" }}>
                        <WordReveal text="Every trip makes the network stronger" />
                    </h1>
                    <Reveal delay={250}>
                        <p className="q-prose" style={{ maxWidth: "46ch" }}>
                            Each booked seat gives drivers a fuller manifest and operators a clearer
                            picture of their routes. The more the network carries, the better it runs.
                        </p>
                    </Reveal>
                </div>

                {/* Route marquee */}
                <div className="q-marquee" aria-hidden>
                    <div className="q-marquee__track" style={{ color: "#1D3686" }}>
                        {[...ROUTES, ...ROUTES].map((r, i) => (
                            <span key={i} className="flex items-center gap-10">
                                {r}
                                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: "#1D3686" }} />
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* Photo band */}
            <section className="py-24" style={{ backgroundColor: "#FFFCF9" }}>
                <div className="max-w-7xl mx-auto px-6">
                    <Reveal variant="media">
                        <Photo
                            src="/images/quantum4.jpg"
                            label="Taxis across the Eastern Cape network"
                            className="w-full h-[50vh] min-h-[320px]"
                            fallback="#CDDFF6"
                        />
                    </Reveal>
                </div>
            </section>

            {/* Corridors */}
            <section className="py-24" style={{ backgroundColor: "#FFFFFF" }}>
                <div className="max-w-7xl mx-auto px-6">
                    <Reveal className="mb-4">
                        <p className="q-eyebrow">Where we run</p>
                    </Reveal>
                    <h2 className="q-display mb-14" style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", maxWidth: "18ch" }}>
                        <WordReveal text="Commutes by day, hikes across the province" />
                    </h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {CORRIDORS.map((c, i) => (
                            <Reveal key={`${c.from}-${c.to}`} delay={i * 100} className="q-card p-6">
                                <p className="font-mono text-[0.62rem] uppercase tracking-widest mb-4" style={{ color: "#8A8884" }}>{c.kind}</p>
                                <p className="q-heading" style={{ fontSize: "1.25rem" }}>{c.from}</p>
                                <p className="font-mono text-xs my-1.5" style={{ color: "#1D3686" }}>↓</p>
                                <p className="q-heading" style={{ fontSize: "1.25rem" }}>{c.to}</p>
                            </Reveal>
                        ))}
                    </div>
                    <Reveal delay={200} className="mt-12">
                        <p className="q-body" style={{ maxWidth: "50ch" }}>
                            New routes join as operators come on board. If your route is not listed yet,
                            it is on the way.
                        </p>
                    </Reveal>
                </div>
            </section>

            <CtaBand
                eyebrow="Grow with us"
                heading="Put your route on the map"
                body="Passengers ride with certainty. Drivers fill their seats. Operators see everything."
            />
            <SiteFooter />
        </>
    );
}

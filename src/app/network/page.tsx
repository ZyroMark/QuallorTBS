"use client";

import React from "react";
import { Reveal, WordReveal } from "@/components/motion";
import { SiteNav, SiteFooter, CtaBand, Photo, SceneBanner } from "@/components/marketing";

const ROUTES = [
    "East London", "Mdantsane", "Beacon Bay", "King William's Town", "Mthatha",
    "Cape Town", "Khayelitsha", "Gugulethu", "Bellville", "Atlantis",
    "Johannesburg", "Soweto", "Alexandra", "Tembisa", "Randburg",
];

const CORRIDORS = [
    { from: "East London", to: "Mdantsane", kind: "Daily commute" },
    { from: "Beacon Bay", to: "Amalinda", kind: "Daily commute" },
    { from: "Cape Town CBD", to: "Khayelitsha", kind: "Daily commute" },
    { from: "Bellville", to: "Kraaifontein", kind: "Daily commute" },
    { from: "Johannesburg CBD", to: "Soweto", kind: "Daily commute" },
    { from: "MTN Noord Rank", to: "Alexandra", kind: "Daily commute" },
    { from: "East London", to: "Mthatha", kind: "Long distance" },
    { from: "Cape Town", to: "Johannesburg", kind: "Long distance" },
];

export default function NetworkPage() {
    return (
        <>
            <SiteNav />

            {/* Banner */}
            <SceneBanner
                eyebrow="A growing network"
                skyLines={["From"]}
                fieldLines={["here", "to", "there."]}
                body="Each booked seat gives drivers a fuller manifest and operators a clearer picture of their routes. The more the network carries, the better it runs."
            >
                {/* Route marquee */}
                <div className="q-marquee relative mt-16" aria-hidden>
                    <div className="q-marquee__track" style={{ color: "#CDDFF6" }}>
                        {[...ROUTES, ...ROUTES].map((r, i) => (
                            <span key={i} className="flex items-center gap-10">
                                {r}
                                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: "#CDDFF6" }} />
                            </span>
                        ))}
                    </div>
                </div>
            </SceneBanner>

            {/* Photo band */}
            <section className="py-24" style={{ backgroundColor: "#FFFCF9" }}>
                <div className="max-w-7xl mx-auto px-6">
                    <Reveal variant="media">
                        <Photo
                            src="/images/quantum4.jpg"
                            label="Taxis across the Quallor network"
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

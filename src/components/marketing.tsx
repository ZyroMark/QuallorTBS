"use client";

import React, { useEffect, useRef, useState, type ReactNode } from "react";
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

/* ── Scene banner: giant stacked headline straddling a sky/field horizon ──
   Words above the horizon are navy on soft-blue sky, words below are
   warm-white on a navy field, with a lone minibus parked in the field. */
/* Animated Quantum minibus (ported from the "Animated Quantum braking icon"
   design): drives in from the left, dips as it brakes, wheels spin, skid
   marks + tyre smoke + speed streaks. Click replays the animation.
   Keyframes (q-tx-*) live in globals.css. */
function BannerTaxi() {
    const [run, setRun] = useState(0);
    const [started, setStarted] = useState(false);
    const hostRef = useRef<HTMLDivElement>(null);

    // The boot loader covers the screen for roughly 1.7s, which outlasts the
    // 1.5s drive, so an animation started on mount finishes before anyone can
    // see it. Wait until the taxi is on screen and the loader has cleared.
    useEffect(() => {
        const el = hostRef.current;
        if (!el) return;
        let done = false;

        const inView = () => {
            const r = el.getBoundingClientRect();
            return r.top < window.innerHeight * 0.85 && r.bottom > 0;
        };
        const start = () => {
            if (done) return;
            done = true;
            setStarted(true);
            cleanup();
        };
        const onScroll = () => {
            if (inView()) start();
        };

        // Already on screen at load: drive once the loader is out of the way.
        const bootTimer = setTimeout(() => {
            if (inView()) start();
        }, 1900);
        // Scrolled to later: drive on arrival.
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        // Whatever happens above, the scene must never stay invisible.
        const failsafe = setTimeout(start, 6000);

        function cleanup() {
            clearTimeout(bootTimer);
            clearTimeout(failsafe);
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
        }
        return cleanup;
    }, []);

    // Until it starts, the scene must not paint: the keyframes carry the
    // opening state (taxi off to the left, skid marks and smoke invisible), so
    // the raw artwork would otherwise show parked with full skid marks drawn.
    const anim = (value: string): React.CSSProperties => (started ? { animation: value } : {});

    return (
        <div
            ref={hostRef}
            onClick={() => setRun((r) => r + 1)}
            title="Click to replay"
            style={{ cursor: "pointer" }}
        >
            <svg
                key={run}
                className="q-tx"
                viewBox="0 0 660 300"
                style={{
                    width: "clamp(190px, 34vw, 430px)",
                    height: "auto",
                    display: "block",
                    opacity: started ? 1 : 0,
                }}
                fill="none"
                aria-hidden
            >
                <defs>
                    <linearGradient id="qtxBody" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#ffffff" />
                        <stop offset="0.62" stopColor="#f6f8fd" />
                        <stop offset="1" stopColor="#dfe7f6" />
                    </linearGradient>
                    <linearGradient id="qtxGlass" x1="0" y1="0" x2="0.35" y2="1">
                        <stop offset="0" stopColor="#2a3350" />
                        <stop offset="0.55" stopColor="#141a2c" />
                        <stop offset="1" stopColor="#0b0f1c" />
                    </linearGradient>
                    <linearGradient id="qtxRoof" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0" stopColor="#1a1f2f" />
                        <stop offset="0.5" stopColor="#0d1120" />
                        <stop offset="1" stopColor="#1c2233" />
                    </linearGradient>
                </defs>

                {/* Speed streaks */}
                <g className="q-tx-fx" style={{ ...anim("q-tx-streak 0.9s cubic-bezier(.2,.7,.3,1) 0.06s both") }}>
                    <rect x="120" y="132" width="120" height="4" rx="2" fill="#8fb0ff" opacity="0.5" />
                    <rect x="70" y="164" width="170" height="4" rx="2" fill="#8fb0ff" opacity="0.35" />
                    <rect x="150" y="196" width="90" height="4" rx="2" fill="#8fb0ff" opacity="0.45" />
                </g>

                {/* Skid marks */}
                <g className="q-tx-fx" style={{ transformBox: "fill-box", transformOrigin: "right center", ...anim("q-tx-skid 3.4s cubic-bezier(.16,.85,.2,1) 0.06s both") }}>
                    <rect x="34" y="238" width="198" height="7" rx="3.5" fill="#0b1130" />
                    <rect x="272" y="238" width="198" height="7" rx="3.5" fill="#0b1130" />
                </g>

                {/* Ground shadow */}
                <ellipse
                    cx="352" cy="245" rx="150" ry="9" fill="#101a4d" opacity="0.4"
                    style={{ transformBox: "fill-box", transformOrigin: "center", ...anim("q-tx-shadow 1.5s cubic-bezier(.14,.86,.16,1) 0.06s both") }}
                />

                {/* Minibus */}
                <g style={{ ...anim("q-tx-drive 1.5s cubic-bezier(.14,.86,.16,1) 0.06s both") }}>
                    <g style={{ transformBox: "fill-box", transformOrigin: "20% 92%", ...anim("q-tx-dip 1.5s cubic-bezier(.3,.8,.3,1) 0.06s both") }}>
                        <path d="M170 216 L170 152 C170 132 178 118 196 110 C214 102 246 98 300 98 L420 98 C440 98 454 103 465 114 L508 154 C516 162 521 172 521 183 L521 205 C521 211 517 216 511 216 Z" fill="url(#qtxBody)" />
                        <path d="M198 105 C216 99 248 96 300 96 L418 96 C428 96 436 98 442 102 L438 108 C430 104 420 102 410 102 L300 102 C250 102 218 106 202 111 Z" fill="url(#qtxRoof)" />
                        <path d="M203 152 C203 137 210 126 224 121 C238 116 262 114 296 114 L336 114 C340 114 342 116 342 120 L342 152 C342 156 340 158 336 158 L209 158 C205 158 203 156 203 152 Z" fill="url(#qtxGlass)" />
                        <path d="M210 149 C210 137 217 128 230 124 C242 120 262 118 292 118 L300 118 L300 126 C266 126 246 128 236 132 C226 136 220 142 220 150 Z" fill="#4d5878" opacity="0.55" />
                        <path d="M356 114 L404 114 C408 114 410 116 410 120 L410 152 C410 156 408 158 404 158 L356 158 C352 158 350 156 350 152 L350 120 C350 116 352 114 356 114 Z" fill="url(#qtxGlass)" />
                        <path d="M424 114 L438 114 C446 114 452 117 458 123 L484 148 C488 152 486 158 480 158 L424 158 C420 158 418 156 418 152 L418 120 C418 116 420 114 424 114 Z" fill="url(#qtxGlass)" />
                        <path d="M424 120 L434 120 L434 152 L424 152 Z" fill="#39425e" opacity="0.4" />
                        <rect x="344" y="106" width="4" height="104" rx="2" fill="#cfdaf0" />
                        <rect x="412" y="108" width="4" height="94" rx="2" fill="#cfdaf0" />
                        <path d="M344 160 L344 210" stroke="#c2cee8" strokeWidth="2" />
                        <rect x="330" y="164" width="16" height="5" rx="2.5" fill="#8e9ab8" />
                        <rect x="398" y="164" width="16" height="5" rx="2.5" fill="#8e9ab8" />
                        <path d="M176 178 C176 176 178 174 181 174 L404 174 C407 174 409 176 409 179 L409 182 C409 185 407 187 404 187 L181 187 C178 187 176 185 176 183 Z" fill="#e2e9f7" opacity="0.85" />
                        <path d="M170 196 L521 196 L521 205 C521 211 517 216 511 216 L170 216 Z" fill="#cad6ee" />
                        <path d="M170 196 L521 196 L521 199 L170 199 Z" fill="#b6c5e4" />
                        <rect x="171" y="160" width="8" height="20" rx="4" fill="#f2f5fc" />
                        <rect x="170" y="163" width="5" height="14" rx="2.5" fill="#dbe4f5" />
                        <rect x="490" y="163" width="30" height="9" rx="4.5" fill="#f6e7c0" />
                        <rect x="490" y="163" width="30" height="4" rx="2" fill="#fff6dd" />
                        <circle cx="232" cy="216" r="30" fill="#0d1120" />
                        <circle cx="470" cy="216" r="30" fill="#0d1120" />
                        <path d="M202 216 a30 30 0 0 1 60 0 Z" fill="#1a2033" opacity="0.7" />
                        <path d="M440 216 a30 30 0 0 1 60 0 Z" fill="#1a2033" opacity="0.7" />
                        <path d="M196 216 C196 195 212 180 232 180 C252 180 268 195 268 216 L262 216 C262 199 249 186 232 186 C215 186 202 199 202 216 Z" fill="#eef2fb" />
                        <path d="M434 216 C434 195 450 180 470 180 C490 180 506 195 506 216 L500 216 C500 199 487 186 470 186 C453 186 440 199 440 216 Z" fill="#eef2fb" />
                        <g style={{ transformBox: "fill-box", transformOrigin: "center", ...anim("q-tx-spin 1.5s cubic-bezier(.14,.86,.16,1) 0.06s both") }}>
                            <circle cx="232" cy="216" r="14" fill="#f7f9ff" />
                            <circle cx="232" cy="216" r="5" fill="#c7d3ee" />
                            <rect x="230.5" y="202" width="3" height="28" rx="1.5" fill="#ccd8f2" />
                            <rect x="218" y="214.5" width="28" height="3" rx="1.5" fill="#ccd8f2" />
                        </g>
                        <g style={{ transformBox: "fill-box", transformOrigin: "center", ...anim("q-tx-spin 1.5s cubic-bezier(.14,.86,.16,1) 0.06s both") }}>
                            <circle cx="470" cy="216" r="14" fill="#f7f9ff" />
                            <circle cx="470" cy="216" r="5" fill="#c7d3ee" />
                            <rect x="468.5" y="202" width="3" height="28" rx="1.5" fill="#ccd8f2" />
                            <rect x="456" y="214.5" width="28" height="3" rx="1.5" fill="#ccd8f2" />
                        </g>
                        <rect x="492" y="182" width="26" height="6" rx="3" fill="#12182c" />
                        <rect x="494" y="184" width="22" height="2" rx="1" fill="#e9eefb" />
                    </g>
                </g>

                {/* Tyre smoke */}
                <g className="q-tx-fx" fill="#aebfe8">
                    <circle cx="248" cy="236" r="12" style={{ transformBox: "fill-box", transformOrigin: "center", ...anim("q-tx-smoke 1.6s ease-out 0.5s both") }} />
                    <circle cx="286" cy="240" r="9" style={{ transformBox: "fill-box", transformOrigin: "center", ...anim("q-tx-smoke 1.7s ease-out 0.62s both") }} />
                    <circle cx="486" cy="238" r="10" style={{ transformBox: "fill-box", transformOrigin: "center", ...anim("q-tx-smoke 1.5s ease-out 0.56s both") }} />
                </g>
            </svg>
        </div>
    );
}

export function SceneBanner({
    eyebrow,
    skyLines,
    fieldLines,
    body,
    children,
}: {
    eyebrow: string;
    /** Headline words shown above the horizon, one per line, in navy */
    skyLines: string[];
    /** Headline words shown below the horizon, one per line, in warm white */
    fieldLines: string[];
    body: string;
    /** Optional full-width extras rendered at the bottom of the field */
    children?: ReactNode;
}) {
    const lineStyle: React.CSSProperties = {
        fontSize: "clamp(3.4rem, 10vw, 7.5rem)",
        lineHeight: 0.95,
        letterSpacing: "-0.03em",
    };
    return (
        <section className="relative overflow-hidden">
            <h1 className="sr-only">{[...skyLines, ...fieldLines].join(" ")}</h1>

            {/* Sky */}
            <div className="pt-44" style={{ background: "linear-gradient(180deg, #E1EDF5 0%, #EDF5FA 100%)" }}>
                <div className="relative z-10 max-w-7xl mx-auto px-6" aria-hidden>
                    <Reveal className="mb-8">
                        <p className="q-eyebrow" style={{ color: "#1D3686" }}>{eyebrow}</p>
                    </Reveal>
                    {skyLines.map((line, i) => (
                        <Reveal key={line} delay={i * 110}>
                            <p className="q-display" style={{ ...lineStyle, color: "#1D3686" }}>{line}</p>
                        </Reveal>
                    ))}
                </div>
            </div>

            {/* Field */}
            <div
                className="relative pb-24"
                style={{ background: "linear-gradient(180deg, #2A47A0 0%, #1D3686 12%)" }}
            >
                <div
                    className="absolute"
                    style={{ left: "56%", top: "clamp(0rem, 1.5vw, 1.25rem)", zIndex: 10 }}
                    aria-hidden
                >
                    <BannerTaxi />
                </div>
                <div className="relative max-w-7xl mx-auto px-6" aria-hidden>
                    {fieldLines.map((line, i) => (
                        <Reveal key={line} delay={(skyLines.length + i) * 110}>
                            <p className="q-display" style={{ ...lineStyle, color: "#FFFCF9" }}>{line}</p>
                        </Reveal>
                    ))}
                </div>
                <div className="relative max-w-7xl mx-auto px-6">
                    <Reveal delay={(skyLines.length + fieldLines.length) * 110 + 150}>
                        <p className="q-prose mt-12" style={{ color: "rgba(255,252,249,0.85)", maxWidth: "44ch" }}>
                            {body}
                        </p>
                    </Reveal>
                </div>
                {children}
            </div>
        </section>
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

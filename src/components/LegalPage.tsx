"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface LegalSection {
    heading: string;
    /** Paragraphs and bullet lists, rendered in order. */
    blocks: Array<string | string[]>;
}

interface LegalPageProps {
    title: string;
    subtitle: string;
    effective: string;
    sections: LegalSection[];
    /** The other legal page, linked at the foot. */
    sibling: { label: string; href: string };
}

export default function LegalPage({ title, subtitle, effective, sections, sibling }: LegalPageProps) {
    const router = useRouter();

    return (
        <main className="min-h-screen" style={{ backgroundColor: "#FFFCF9" }}>
            {/* Header */}
            <header
                className="sticky top-0 z-20"
                style={{ backgroundColor: "#FFFFFF", borderBottom: "1px solid rgba(17,17,17,0.08)" }}
            >
                <div className="q-container max-w-3xl flex items-center gap-3 py-3">
                    <button
                        onClick={() => router.back()}
                        aria-label="Go back"
                        className="flex w-10 h-10 items-center justify-center rounded-[10px] transition-colors hover:bg-q-stone-100"
                    >
                        <span className="material-symbols-outlined" style={{ color: "#111111" }}>arrow_back</span>
                    </button>
                    <Link href="/" className="q-wordmark text-xl" style={{ color: "#111111" }}>Quallor</Link>
                </div>
            </header>

            {/* Title band */}
            <div style={{ backgroundColor: "#E1EDF5", paddingTop: "3rem", paddingBottom: "3rem" }}>
                <div className="q-container max-w-3xl">
                    <p className="q-eyebrow mb-3">Legal</p>
                    <h1
                        className="font-sans font-black mb-3"
                        style={{ fontSize: "clamp(2rem, 5vw, 3rem)", color: "#111111", letterSpacing: "-0.03em", lineHeight: 1.05 }}
                    >
                        {title}
                    </h1>
                    <p className="font-sans text-base" style={{ color: "rgba(17,17,17,0.65)", maxWidth: "42ch" }}>
                        {subtitle}
                    </p>
                    <p className="font-mono text-xs uppercase tracking-wider mt-5" style={{ color: "rgba(17,17,17,0.50)" }}>
                        Effective {effective}
                    </p>
                </div>
            </div>

            {/* Contents */}
            <div className="q-container max-w-3xl py-10 pb-28">
                <nav
                    className="rounded-[16px] p-5 mb-10"
                    style={{ backgroundColor: "#EEF1EA", border: "1px solid rgba(17,17,17,0.06)" }}
                >
                    <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "#5C5A56" }}>
                        On this page
                    </p>
                    <ol className="space-y-1.5">
                        {sections.map((s, i) => (
                            <li key={s.heading} className="flex gap-3">
                                <span className="font-mono text-xs font-bold flex-shrink-0" style={{ color: "#1D3686" }}>
                                    {String(i + 1).padStart(2, "0")}
                                </span>
                                <a
                                    href={`#section-${i + 1}`}
                                    className="font-sans text-sm hover:underline"
                                    style={{ color: "#111111" }}
                                >
                                    {s.heading}
                                </a>
                            </li>
                        ))}
                    </ol>
                </nav>

                <div className="space-y-10">
                    {sections.map((section, i) => (
                        <section key={section.heading} id={`section-${i + 1}`} className="scroll-mt-24">
                            <div className="flex items-baseline gap-3 mb-3">
                                <span className="font-mono text-xs font-bold" style={{ color: "#1D3686" }}>
                                    {String(i + 1).padStart(2, "0")}
                                </span>
                                <h2
                                    className="font-sans font-black text-xl"
                                    style={{ color: "#111111", letterSpacing: "-0.02em" }}
                                >
                                    {section.heading}
                                </h2>
                            </div>
                            <div className="space-y-3 pl-8">
                                {section.blocks.map((block, bi) =>
                                    Array.isArray(block) ? (
                                        <ul key={bi} className="space-y-2">
                                            {block.map((item, ii) => (
                                                <li key={ii} className="flex gap-3">
                                                    <span
                                                        className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2"
                                                        style={{ backgroundColor: "#1D3686" }}
                                                    />
                                                    <span
                                                        className="font-sans text-[15px]"
                                                        style={{ color: "rgba(17,17,17,0.78)", lineHeight: 1.7 }}
                                                    >
                                                        {item}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p
                                            key={bi}
                                            className="font-sans text-[15px]"
                                            style={{ color: "rgba(17,17,17,0.78)", lineHeight: 1.75 }}
                                        >
                                            {block}
                                        </p>
                                    )
                                )}
                            </div>
                        </section>
                    ))}
                </div>

                {/* Footer links */}
                <div
                    className="mt-14 pt-8 flex flex-wrap items-center justify-between gap-4"
                    style={{ borderTop: "1px solid rgba(17,17,17,0.08)" }}
                >
                    <p className="font-sans text-sm" style={{ color: "#8A8678" }}>
                        Questions about this document? Email{" "}
                        <a href="mailto:legal@quallor.co.za" className="font-bold hover:underline" style={{ color: "#1D3686" }}>
                            legal@quallor.co.za
                        </a>
                    </p>
                    <Link href={sibling.href} className="q-btn-outline">
                        {sibling.label}
                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </Link>
                </div>
            </div>
        </main>
    );
}

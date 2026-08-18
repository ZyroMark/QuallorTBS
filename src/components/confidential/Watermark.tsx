"use client";

import React, { useEffect, useState } from "react";
import { WATERMARK_TEXT, getSessionRef, readAcknowledgement, viewerLabel } from "@/lib/confidential";

/**
 * Tiled ownership watermark drawn over the whole application.
 *
 * The tiles are deliberately drawn in the page itself rather than as a CSS
 * background image, so that they carry the viewer reference. A photograph taken
 * with an external camera therefore carries the same mark, and the reference
 * identifies the session the photograph was taken from.
 */
export default function Watermark({ email }: { email?: string | null }) {
    const [stamp, setStamp] = useState<{ ref: string; who: string } | null>(null);
    const [clock, setClock] = useState("");

    useEffect(() => {
        const ack = readAcknowledgement();
        setStamp({ ref: getSessionRef(), who: viewerLabel(ack, email) });
    }, [email]);

    useEffect(() => {
        const tick = () =>
            setClock(
                new Date().toLocaleString("en-ZA", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                })
            );
        tick();
        const id = setInterval(tick, 30_000);
        return () => clearInterval(id);
    }, []);

    // 60 tiles covers an oversized, rotated plane on every viewport we support.
    const tiles = Array.from({ length: 60 });

    return (
        <>
            <div className="q-watermark" aria-hidden="true" data-html2canvas-ignore="true">
                <div className="q-watermark-plane">
                    {tiles.map((_, i) => (
                        <div className="q-watermark-tile" key={i}>
                            <span className="q-watermark-main">{WATERMARK_TEXT}</span>
                            <span className="q-watermark-sub">
                                {stamp ? `${stamp.who} · ${stamp.ref}` : "\u00A0"}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Corner stamp. Legible in a photograph, and the reference is the
                thread back to the person who was granted access. */}
            <div className="q-watermark-badge" aria-hidden="true" data-html2canvas-ignore="true">
                <span className="q-watermark-badge-title">{WATERMARK_TEXT}</span>
                <span className="q-watermark-badge-meta">
                    {stamp?.who ?? ""} {stamp ? `· ${stamp.ref}` : ""} {clock ? `· ${clock}` : ""}
                </span>
                <span className="q-watermark-badge-meta">Confidential. Viewing rights only.</span>
            </div>
        </>
    );
}

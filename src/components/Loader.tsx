"use client";

import React, { useEffect, useState } from "react";

/** The honeycomb spinner on its own, for inline loading states. */
export function Honeycomb({ ink = false }: { ink?: boolean }) {
    return (
        <div className={ink ? "honeycomb honeycomb--ink" : "honeycomb"}>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
        </div>
    );
}

/**
 * Full-page boot loader. Covers the screen on first paint, then fades out
 * once the page has loaded (with a short minimum so the animation reads).
 */
export default function PageLoader() {
    const [done, setDone] = useState(false);
    const [gone, setGone] = useState(false);

    useEffect(() => {
        const minDelay = new Promise((r) => setTimeout(r, 1100));
        const loaded = new Promise<void>((r) => {
            if (document.readyState === "complete") r();
            else window.addEventListener("load", () => r(), { once: true });
        });
        let unmountTimer: ReturnType<typeof setTimeout>;
        Promise.all([minDelay, loaded]).then(() => {
            setDone(true);
            unmountTimer = setTimeout(() => setGone(true), 600);
        });
        return () => clearTimeout(unmountTimer);
    }, []);

    if (gone) return null;

    return (
        <div className={`q-loader-overlay ${done ? "is-done" : ""}`} aria-hidden={done}>
            <Honeycomb />
            <span className="q-loader-brand">Quallor</span>
        </div>
    );
}

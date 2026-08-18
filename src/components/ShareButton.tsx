"use client";

import React, { useState } from "react";
import { share, type SharePayload } from "@/lib/share";
import { useToast } from "@/components/Toast";

interface ShareButtonProps extends SharePayload {
    /** "icon" for header buttons, "pill" for inline actions. */
    variant?: "icon" | "pill";
    label?: string;
    className?: string;
    style?: React.CSSProperties;
}

export default function ShareButton({
    title,
    text,
    url,
    variant = "icon",
    label = "Share",
    className = "",
    style,
}: ShareButtonProps) {
    const { toast } = useToast();
    const [busy, setBusy] = useState(false);

    async function handleShare(e: React.MouseEvent) {
        e.stopPropagation();
        if (busy) return;
        setBusy(true);
        const outcome = await share({ title, text, url });
        setBusy(false);

        if (outcome === "copied") toast("Trip details copied to clipboard", "success");
        else if (outcome === "shared") toast("Shared", "success");
        else if (outcome === "failed") toast("Could not share on this device", "error");
        // "cancelled" stays silent - the user backed out on purpose.
    }

    if (variant === "pill") {
        return (
            <button
                type="button"
                onClick={handleShare}
                aria-label={label}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full font-sans text-sm font-bold transition-colors ${className}`}
                style={{
                    border: "1.5px solid rgba(17,17,17,0.14)",
                    color: "#111111",
                    backgroundColor: "transparent",
                    ...style,
                }}
            >
                <span className="material-symbols-outlined text-lg">ios_share</span>
                {label}
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={handleShare}
            aria-label={label}
            title={label}
            className={`flex w-10 h-10 items-center justify-center rounded-[10px] transition-colors hover:bg-q-stone-100 ${className}`}
            style={style}
        >
            <span className="material-symbols-outlined" style={{ color: "#8A8678" }}>ios_share</span>
        </button>
    );
}

"use client";

import React from "react";

/**
 * RouteArt - the clean banner that replaced the stock world-map photo.
 *
 * It draws a route line between two stops using the Quallor palette, so a trip
 * card carries a picture of the actual journey instead of a generic photo. It
 * is pure SVG, so it never fails to load and stays sharp at any size.
 */

type Tone = "blue" | "sage" | "ink";

const TONES: Record<Tone, { bg: string; line: string; ink: string; soft: string }> = {
    blue: { bg: "#E1EDF5", line: "#1D3686", ink: "#111111", soft: "rgba(29,54,134,0.16)" },
    sage: { bg: "#EEF1EA", line: "#1D3686", ink: "#111111", soft: "rgba(29,54,134,0.14)" },
    ink:  { bg: "#1F1F1F", line: "#CDDFF6", ink: "#FFFCF9", soft: "rgba(205,223,246,0.20)" },
};

interface RouteArtProps {
    from?: string;
    to?: string;
    tone?: Tone;
    /** Small badge in the top-left, e.g. "Long Distance". */
    badge?: string;
    className?: string;
    style?: React.CSSProperties;
    /** Hide the place names, leaving just the line work. */
    labels?: boolean;
}

export default function RouteArt({
    from,
    to,
    tone = "blue",
    badge,
    className = "",
    style,
    labels = true,
}: RouteArtProps) {
    const t = TONES[tone];
    const showLabels = labels && Boolean(from && to);

    return (
        <div
            className={`relative w-full h-full overflow-hidden ${className}`}
            style={{ backgroundColor: t.bg, ...style }}
            aria-hidden={!showLabels}
        >
            <svg
                viewBox="0 0 400 160"
                preserveAspectRatio="xMidYMid slice"
                className="absolute inset-0 w-full h-full"
            >
                {/* hairline grid, echoes the marketing pages */}
                <defs>
                    <pattern id="ra-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M20 0H0V20" fill="none" stroke={t.soft} strokeWidth="0.5" />
                    </pattern>
                </defs>
                <rect width="400" height="160" fill="url(#ra-grid)" />

                {/* the route itself */}
                <path
                    d="M46 116 C 120 116, 130 52, 200 52 S 286 106, 354 44"
                    fill="none"
                    stroke={t.line}
                    strokeWidth="3"
                    strokeLinecap="round"
                    opacity="0.9"
                />
                {/* origin stop */}
                <circle cx="46" cy="116" r="9" fill={t.bg} stroke={t.line} strokeWidth="3" />
                {/* midpoint marker */}
                <circle cx="200" cy="52" r="4" fill={t.line} opacity="0.45" />
                {/* destination stop */}
                <circle cx="354" cy="44" r="9" fill={t.line} />
                <circle cx="354" cy="44" r="3.4" fill={t.bg} />
            </svg>

            {badge && (
                <span
                    className="absolute top-3 left-3 font-mono text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: t.ink, color: t.bg }}
                >
                    {badge}
                </span>
            )}

            {showLabels && (
                <div className="absolute bottom-3 left-4 right-4 flex items-center gap-2">
                    <span
                        className="font-sans text-xs font-bold truncate"
                        style={{ color: t.ink }}
                    >
                        {from}
                    </span>
                    <span className="material-symbols-outlined text-sm flex-shrink-0" style={{ color: t.line }}>
                        arrow_forward
                    </span>
                    <span
                        className="font-sans text-xs font-bold truncate"
                        style={{ color: t.ink }}
                    >
                        {to}
                    </span>
                </div>
            )}
        </div>
    );
}

/**
 * Compact square variant used where a thumbnail used to sit (taxi list rows,
 * fleet cards). Shows a vehicle glyph on a tinted tile.
 */
export function VehicleTile({
    tone = "sage",
    icon = "airport_shuttle",
    className = "",
    style,
}: {
    tone?: Tone;
    icon?: string;
    className?: string;
    style?: React.CSSProperties;
}) {
    const t = TONES[tone];
    return (
        <div
            className={`flex items-center justify-center ${className}`}
            style={{ backgroundColor: t.bg, ...style }}
        >
            <span className="material-symbols-outlined text-3xl" style={{ color: t.line }}>
                {icon}
            </span>
        </div>
    );
}

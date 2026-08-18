"use client";

import React, { useState } from "react";
import { PROVINCES, type ProvinceId } from "@/lib/places";
import { useProvince } from "@/lib/useProvince";

/**
 * Where the passenger travels.
 *
 * The three metros do not share routes, so this is not a filter, it decides
 * what the rest of the screen is even able to show. It sits at the top of the
 * commute and hiking flows rather than being buried in settings, because
 * picking the wrong one makes every destination below it wrong.
 */

/** The list of provinces as cards. Used inside the sheet and on signup. */
export function ProvinceOptions({
    selected,
    onSelect,
    disabled,
}: {
    selected: ProvinceId;
    onSelect: (id: ProvinceId) => void;
    disabled?: boolean;
}) {
    return (
        <div className="flex flex-col gap-2.5">
            {PROVINCES.map((p) => {
                const active = p.id === selected;
                return (
                    <button
                        key={p.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => onSelect(p.id)}
                        className="w-full text-left rounded-[14px] px-4 py-3.5 transition-colors disabled:opacity-60"
                        style={{
                            backgroundColor: active ? "#CDDFF6" : "#FFFFFF",
                            border: active ? "1.5px solid #1D3686" : "1.5px solid rgba(0,0,0,0.10)",
                        }}
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p
                                    className="font-mono text-[11px] font-bold uppercase tracking-wider mb-1"
                                    style={{ color: active ? "#1D3686" : "#5C5A56" }}
                                >
                                    {p.name}
                                </p>
                                <p
                                    className="font-display text-lg font-semibold leading-tight"
                                    style={{ color: "#111111" }}
                                >
                                    {p.metro}
                                </p>
                                <p className="font-sans text-xs mt-1" style={{ color: "#5C5A56" }}>
                                    {p.blurb}
                                </p>
                            </div>
                            <span
                                className="material-symbols-outlined shrink-0"
                                style={{ color: active ? "#1D3686" : "rgba(0,0,0,0.25)" }}
                            >
                                {active ? "check_circle" : "radio_button_unchecked"}
                            </span>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

/**
 * The compact bar shown above a destination list, with a sheet for changing.
 */
export default function ProvincePicker() {
    const { province, provinceId, setProvince, isReady } = useProvince();
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    async function choose(next: ProvinceId) {
        if (next === provinceId) {
            setOpen(false);
            return;
        }
        setSaving(true);
        setError("");
        const ok = await setProvince(next);
        setSaving(false);
        if (!ok) {
            setError("Could not save that. Check your connection and try again.");
            return;
        }
        setOpen(false);
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                disabled={!isReady}
                className="flex items-center gap-2.5 rounded-full px-4 py-2 transition-colors disabled:opacity-60"
                style={{ backgroundColor: "#FFFFFF", border: "1.5px solid rgba(0,0,0,0.12)" }}
            >
                <span className="material-symbols-outlined text-lg" style={{ color: "#1D3686" }}>
                    location_on
                </span>
                <span className="text-left">
                    <span
                        className="block font-mono text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: "#5C5A56" }}
                    >
                        Travelling in
                    </span>
                    <span className="block font-sans text-sm font-bold" style={{ color: "#111111" }}>
                        {province.metro}
                    </span>
                </span>
                <span className="material-symbols-outlined text-lg" style={{ color: "#5C5A56" }}>
                    expand_more
                </span>
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4"
                    style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
                    onClick={() => !saving && setOpen(false)}
                >
                    <div
                        className="w-full max-w-md rounded-[20px] p-5"
                        style={{ backgroundColor: "#FFFCF9" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-3 mb-1">
                            <h2 className="font-display text-xl font-semibold" style={{ color: "#111111" }}>
                                Where do you travel?
                            </h2>
                            <button
                                type="button"
                                onClick={() => !saving && setOpen(false)}
                                className="flex w-8 h-8 items-center justify-center rounded-full"
                                style={{ color: "#5C5A56" }}
                                aria-label="Close"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <p className="font-sans text-sm mb-4" style={{ color: "#5C5A56" }}>
                            Each network runs its own routes and ranks. Pick the one you are in and we
                            will only show taxis that can actually reach you.
                        </p>

                        {error && (
                            <div
                                className="mb-3 px-4 py-3 rounded-[12px] font-sans text-sm font-semibold"
                                style={{
                                    backgroundColor: "rgba(220,38,38,0.07)",
                                    border: "1.5px solid rgba(220,38,38,0.20)",
                                    color: "#DC2626",
                                }}
                            >
                                {error}
                            </div>
                        )}

                        <ProvinceOptions selected={provinceId} onSelect={choose} disabled={saving} />
                    </div>
                </div>
            )}
        </>
    );
}

"use client";

import React from "react";
import { useRouter } from "next/navigation";

/** Shared chrome for the settings-style sub-pages under /profile and /safety. */
export function SettingsShell({
    title,
    subtitle,
    children,
    action,
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    action?: React.ReactNode;
}) {
    const router = useRouter();

    return (
        <main className="min-h-screen" style={{ backgroundColor: "#FFFCF9" }}>
            <header
                className="sticky top-0 z-20"
                style={{ backgroundColor: "#FFFFFF", borderBottom: "1px solid rgba(17,17,17,0.08)" }}
            >
                <div className="max-w-2xl mx-auto w-full flex items-center gap-2 px-4 py-3">
                    <button
                        onClick={() => router.back()}
                        aria-label="Go back"
                        className="flex w-10 h-10 items-center justify-center rounded-[10px] transition-colors hover:bg-q-stone-100 flex-shrink-0"
                    >
                        <span className="material-symbols-outlined" style={{ color: "#111111" }}>arrow_back</span>
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="font-sans font-black text-base truncate" style={{ color: "#111111", letterSpacing: "-0.02em" }}>
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="font-sans text-xs truncate" style={{ color: "#8A8678" }}>{subtitle}</p>
                        )}
                    </div>
                    {action}
                </div>
            </header>

            <div className="max-w-2xl mx-auto w-full px-4 py-6 pb-28">{children}</div>
        </main>
    );
}

/** Section wrapper with a mono eyebrow label. */
export function SettingsGroup({
    label,
    children,
    footnote,
}: {
    label: string;
    children: React.ReactNode;
    footnote?: string;
}) {
    return (
        <section className="mb-7">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-2 px-1" style={{ color: "#AEA89C" }}>
                {label}
            </p>
            <div
                className="rounded-[16px] overflow-hidden"
                style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid rgba(17,17,17,0.07)",
                    boxShadow: "0 2px 8px rgba(17,17,17,0.05)",
                }}
            >
                {children}
            </div>
            {footnote && (
                <p className="font-sans text-xs mt-2 px-1" style={{ color: "#8A8678", lineHeight: 1.6 }}>
                    {footnote}
                </p>
            )}
        </section>
    );
}

interface RowProps {
    icon?: string;
    label: string;
    sub?: string;
    /** Renders as a button when provided. */
    onClick?: () => void;
    right?: React.ReactNode;
    danger?: boolean;
    first?: boolean;
}

export function SettingsRow({ icon, label, sub, onClick, right, danger, first }: RowProps) {
    const content = (
        <>
            {icon && (
                <div
                    className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
                    style={{
                        backgroundColor: danger ? "rgba(220,38,38,0.08)" : "#EEF1EA",
                        color: danger ? "#DC2626" : "#111111",
                    }}
                >
                    <span className="material-symbols-outlined">{icon}</span>
                </div>
            )}
            <div className="flex-1 min-w-0 text-left">
                <p className="font-sans font-semibold" style={{ color: danger ? "#DC2626" : "#111111" }}>{label}</p>
                {sub && <p className="font-sans text-xs mt-0.5" style={{ color: "#8A8678" }}>{sub}</p>}
            </div>
            {right ?? (onClick && (
                <span className="material-symbols-outlined flex-shrink-0" style={{ color: "#AEA89C" }}>chevron_right</span>
            ))}
        </>
    );

    const style: React.CSSProperties = {
        borderTop: first ? undefined : "1px solid rgba(17,17,17,0.06)",
    };

    if (onClick) {
        return (
            <button
                type="button"
                onClick={onClick}
                className="w-full flex items-center gap-4 p-4 transition-colors"
                style={style}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#FFFCF9"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = ""; }}
            >
                {content}
            </button>
        );
    }

    return (
        <div className="w-full flex items-center gap-4 p-4" style={style}>
            {content}
        </div>
    );
}

export function Toggle({
    checked,
    onChange,
    label,
}: {
    checked: boolean;
    onChange: (next: boolean) => void;
    label: string;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            onClick={() => onChange(!checked)}
            className="relative w-12 h-7 rounded-full flex-shrink-0 transition-colors"
            style={{ backgroundColor: checked ? "#111111" : "rgba(17,17,17,0.16)" }}
        >
            <span
                className="absolute top-1 w-5 h-5 rounded-full transition-all"
                style={{
                    left: checked ? "calc(100% - 1.5rem)" : "0.25rem",
                    backgroundColor: "#FFFFFF",
                    boxShadow: "0 1px 4px rgba(17,17,17,0.28)",
                }}
            />
        </button>
    );
}

export function Field({
    label,
    value,
    onChange,
    type = "text",
    placeholder,
    hint,
    error,
    ...rest
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
    placeholder?: string;
    hint?: string;
    error?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type">) {
    return (
        <div className="mb-4">
            <label className="q-label">{label}</label>
            <input
                {...rest}
                type={type}
                className="q-input-lg"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={error ? { borderColor: "rgba(220,38,38,0.55)" } : undefined}
            />
            {error ? (
                <p className="font-sans text-xs mt-1.5" style={{ color: "#DC2626" }}>{error}</p>
            ) : hint ? (
                <p className="font-sans text-xs mt-1.5" style={{ color: "#8A8678" }}>{hint}</p>
            ) : null}
        </div>
    );
}

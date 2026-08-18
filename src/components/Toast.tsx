"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

type ToastTone = "info" | "success" | "error";

interface ToastItem {
    id: number;
    message: string;
    tone: ToastTone;
}

interface ToastContextValue {
    toast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_STYLES: Record<ToastTone, { bg: string; fg: string; icon: string }> = {
    info:    { bg: "#111111", fg: "#FFFFFF", icon: "info" },
    success: { bg: "#16A34A", fg: "#FFFFFF", icon: "check_circle" },
    error:   { bg: "#DC2626", fg: "#FFFFFF", icon: "error" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<ToastItem[]>([]);

    const toast = useCallback((message: string, tone: ToastTone = "info") => {
        const id = Date.now() + Math.random();
        setItems((prev) => [...prev, { id, message, tone }]);
    }, []);

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div
                className="fixed left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none"
                style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 6.5rem)" }}
            >
                {items.map((item) => (
                    <ToastPill
                        key={item.id}
                        item={item}
                        onDone={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

function ToastPill({ item, onDone }: { item: ToastItem; onDone: () => void }) {
    const [leaving, setLeaving] = useState(false);

    useEffect(() => {
        const hide = setTimeout(() => setLeaving(true), 2600);
        const remove = setTimeout(onDone, 3000);
        return () => {
            clearTimeout(hide);
            clearTimeout(remove);
        };
    }, [onDone]);

    const tone = TONE_STYLES[item.tone];

    return (
        <div
            className="flex items-center gap-2.5 px-4 py-3 rounded-full font-sans text-sm font-semibold max-w-[90vw]"
            style={{
                backgroundColor: tone.bg,
                color: tone.fg,
                boxShadow: "0 8px 28px rgba(17,17,17,0.28)",
                opacity: leaving ? 0 : 1,
                transform: leaving ? "translateY(8px)" : "translateY(0)",
                transition: "opacity 380ms ease, transform 380ms ease",
            }}
        >
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                {tone.icon}
            </span>
            <span>{item.message}</span>
        </div>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    // A missing provider should never break a page, so degrade to a no-op.
    return ctx ?? { toast: () => {} };
}

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { OWNER, logAccess } from "@/lib/confidential";

/**
 * Capture deterrent layer.
 *
 * A browser cannot stop the operating system from taking a screenshot or
 * recording the screen. What this layer does is remove every capture route the
 * page itself controls, obscure the content the moment the window stops being
 * the active window (which is what most capture tools cause), overwrite the
 * clipboard on a print screen press, and record each attempt against the
 * viewer's session reference.
 */

const CLIPBOARD_NOTICE = `Copying is not permitted. This material is the confidential property of ${OWNER}.`;

export default function CaptureGuard() {
    const [obscured, setObscured] = useState(false);
    const [reason, setReason] = useState<"focus" | "hidden" | "capture">("focus");
    const releaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const obscure = useCallback((why: "focus" | "hidden" | "capture", detail: string) => {
        setReason(why);
        setObscured(true);
        logAccess("capture_attempt", detail);
        if (releaseTimer.current) clearTimeout(releaseTimer.current);
        if (why === "capture") {
            releaseTimer.current = setTimeout(() => setObscured(false), 2500);
        }
    }, []);

    const scrubClipboard = useCallback(() => {
        try {
            navigator.clipboard?.writeText(CLIPBOARD_NOTICE).catch(() => undefined);
        } catch {
            /* clipboard permission denied; the shield is still shown */
        }
    }, []);

    useEffect(() => {
        const onBlur = () => obscure("focus", "window lost focus");
        const onFocus = () => setObscured(false);

        const onVisibility = () => {
            if (document.visibilityState === "hidden") obscure("hidden", "document hidden");
            else setObscured(false);
        };

        const onKeyDown = (e: KeyboardEvent) => {
            const k = e.key;
            const lower = k.toLowerCase();
            const meta = e.metaKey;
            const ctrl = e.ctrlKey;
            const shift = e.shiftKey;

            // Print screen, and the macOS and Windows capture combinations.
            const isPrintScreen = k === "PrintScreen" || lower === "printscreen" || k === "F13";
            const isMacCapture = meta && shift && ["3", "4", "5", "6"].includes(k);
            const isWinSnip = (meta || e.getModifierState?.("Meta")) && shift && lower === "s";
            const isGameBar = meta && (lower === "g" || (shift && lower === "r"));

            if (isPrintScreen || isMacCapture || isWinSnip || isGameBar) {
                e.preventDefault();
                e.stopPropagation();
                scrubClipboard();
                obscure("capture", `capture key: ${meta ? "Meta+" : ""}${shift ? "Shift+" : ""}${k}`);
                return;
            }

            // Print, save, copy, cut, select all, view source and developer tools.
            const blockedWithModifier =
                (ctrl || meta) && ["p", "s", "c", "x", "a", "u"].includes(lower);
            const devTools =
                k === "F12" ||
                ((ctrl || meta) && shift && ["i", "j", "c"].includes(lower));

            if (blockedWithModifier || devTools) {
                e.preventDefault();
                e.stopPropagation();
                if (["c", "x"].includes(lower)) scrubClipboard();
                obscure("capture", `blocked shortcut: ${lower}`);
            }
        };

        const onKeyUp = (e: KeyboardEvent) => {
            // Some platforms only surface print screen on release.
            if (e.key === "PrintScreen") {
                scrubClipboard();
                obscure("capture", "capture key released: PrintScreen");
            }
        };

        const swallow = (e: Event) => {
            e.preventDefault();
            return false;
        };

        const onCopy = (e: ClipboardEvent) => {
            e.preventDefault();
            e.clipboardData?.setData("text/plain", CLIPBOARD_NOTICE);
            logAccess("capture_attempt", "clipboard copy");
        };

        const onBeforePrint = () => {
            logAccess("capture_attempt", "print dialog");
            obscure("capture", "print dialog");
        };

        window.addEventListener("blur", onBlur);
        window.addEventListener("focus", onFocus);
        window.addEventListener("beforeprint", onBeforePrint);
        document.addEventListener("visibilitychange", onVisibility);
        document.addEventListener("keydown", onKeyDown, true);
        document.addEventListener("keyup", onKeyUp, true);
        document.addEventListener("contextmenu", swallow);
        document.addEventListener("dragstart", swallow);
        document.addEventListener("copy", onCopy as EventListener);
        document.addEventListener("cut", onCopy as EventListener);

        document.body.classList.add("q-noselect");

        return () => {
            window.removeEventListener("blur", onBlur);
            window.removeEventListener("focus", onFocus);
            window.removeEventListener("beforeprint", onBeforePrint);
            document.removeEventListener("visibilitychange", onVisibility);
            document.removeEventListener("keydown", onKeyDown, true);
            document.removeEventListener("keyup", onKeyUp, true);
            document.removeEventListener("contextmenu", swallow);
            document.removeEventListener("dragstart", swallow);
            document.removeEventListener("copy", onCopy as EventListener);
            document.removeEventListener("cut", onCopy as EventListener);
            document.body.classList.remove("q-noselect");
            if (releaseTimer.current) clearTimeout(releaseTimer.current);
        };
    }, [obscure, scrubClipboard]);

    if (!obscured) return null;

    return (
        <div className="q-capture-shield" role="alertdialog" aria-live="assertive">
            <span className="material-symbols-outlined q-capture-shield-icon">visibility_off</span>
            <p className="q-capture-shield-title">Content hidden</p>
            <p className="q-capture-shield-body">
                {reason === "capture"
                    ? "Screen capture is not permitted on this site. The attempt has been recorded against your session reference."
                    : "The content is hidden while this window is not in front. Return to the window to continue."}
            </p>
            <p className="q-capture-shield-owner">PROPERTY OF {OWNER}</p>
        </div>
    );
}

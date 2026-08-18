/**
 * One share helper for every share button in the app.
 *
 * Tries the native share sheet first (phones and most modern browsers), then
 * falls back to copying the text to the clipboard, then to a legacy execCommand
 * copy for older desktop browsers. The caller gets back what actually happened
 * so it can show the right confirmation.
 */

export type ShareOutcome = "shared" | "copied" | "cancelled" | "failed";

export interface SharePayload {
    title: string;
    text: string;
    url?: string;
}

function buildClipboardText({ title, text, url }: SharePayload): string {
    return [title, text, url].filter(Boolean).join("\n");
}

async function copyToClipboard(value: string): Promise<boolean> {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(value);
            return true;
        }
    } catch {
        // fall through to the legacy path
    }

    try {
        const ta = document.createElement("textarea");
        ta.value = value;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        return ok;
    } catch {
        return false;
    }
}

export async function share(payload: SharePayload): Promise<ShareOutcome> {
    const { title, text, url } = payload;

    if (typeof navigator !== "undefined" && navigator.share) {
        try {
            await navigator.share({ title, text, ...(url ? { url } : {}) });
            return "shared";
        } catch (err) {
            // The user dismissing the sheet is not an error worth reporting.
            if (err instanceof DOMException && err.name === "AbortError") return "cancelled";
            // Anything else (unsupported payload, permission policy) falls back to copy.
        }
    }

    const ok = await copyToClipboard(buildClipboardText(payload));
    return ok ? "copied" : "failed";
}

/** Absolute URL for a path, safe to call during SSR. */
export function absoluteUrl(path: string): string {
    if (typeof window === "undefined") return path;
    return new URL(path, window.location.origin).toString();
}

/** Standard message body for sharing a booking. */
export function bookingShareText(b: {
    bookingId: string;
    from: string;
    to: string;
    seatNumber: string;
    taxiName: string;
    departureTime?: string;
    date?: string;
}): string {
    const when = b.date
        ? new Date(b.date).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })
        : "";
    return [
        `Quallor trip ${b.bookingId}`,
        `${b.from} to ${b.to}`,
        `Taxi: ${b.taxiName}${b.departureTime ? ` · departs ${b.departureTime}` : ""}`,
        `Seat: ${b.seatNumber}`,
        when && `Date: ${when}`,
    ]
        .filter(Boolean)
        .join("\n");
}

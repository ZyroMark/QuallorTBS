/**
 * Confidentiality, access control and POPIA record keeping for Zyromark (Pty) Ltd.
 *
 * Everything in this module is client side. It records who acknowledged the
 * confidentiality undertaking, when, and what they viewed afterwards, so that a
 * disclosure can be traced back to the person who was granted access.
 */

export const OWNER = "ZYROMARK PTY LTD";
export const OWNER_LEGAL = "Zyromark (Pty) Ltd";
export const WATERMARK_TEXT = `PROPERTY OF ${OWNER}`;

/** Bump this when the wording of the undertaking changes, to force re-acceptance. */
export const AGREEMENT_VERSION = "1.0";

const KEY_ACK = "zyromark_confidentiality_ack";
const KEY_ACK_LOG = "zyromark_confidentiality_ack_log";
const KEY_ACCESS_LOG = "zyromark_access_log";
const KEY_SESSION = "zyromark_session_ref";

export interface Acknowledgement {
    version: string;
    fullName: string;
    organisation: string;
    email: string;
    acceptedConfidentiality: boolean;
    acceptedPopia: boolean;
    acceptedAt: string;
    sessionRef: string;
    userAgent: string;
    platform: string;
    language: string;
    timeZone: string;
    screen: string;
}

/** A short, human readable reference stamped onto every watermark. */
export function getSessionRef(): string {
    if (typeof window === "undefined") return "";
    let ref = sessionStorage.getItem(KEY_SESSION);
    if (!ref) {
        const stamp = Date.now().toString(36).toUpperCase();
        const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
        ref = `ZM-${stamp}-${rand}`;
        sessionStorage.setItem(KEY_SESSION, ref);
    }
    return ref;
}

export function readAcknowledgement(): Acknowledgement | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(KEY_ACK);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Acknowledgement;
        if (parsed.version !== AGREEMENT_VERSION) return null;
        return parsed;
    } catch {
        return null;
    }
}

export function saveAcknowledgement(input: {
    fullName: string;
    organisation: string;
    email: string;
}): Acknowledgement {
    const record: Acknowledgement = {
        version: AGREEMENT_VERSION,
        fullName: input.fullName.trim(),
        organisation: input.organisation.trim(),
        email: input.email.trim(),
        acceptedConfidentiality: true,
        acceptedPopia: true,
        acceptedAt: new Date().toISOString(),
        sessionRef: getSessionRef(),
        userAgent: navigator.userAgent,
        platform: navigator.platform ?? "",
        language: navigator.language ?? "",
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "",
        screen: `${window.screen.width}x${window.screen.height}@${window.devicePixelRatio}`,
    };

    localStorage.setItem(KEY_ACK, JSON.stringify(record));

    // Append to the permanent register. The register is never overwritten, so a
    // person who accepts on several devices leaves several entries.
    try {
        const log: Acknowledgement[] = JSON.parse(localStorage.getItem(KEY_ACK_LOG) ?? "[]");
        log.push(record);
        localStorage.setItem(KEY_ACK_LOG, JSON.stringify(log.slice(-200)));
    } catch {
        localStorage.setItem(KEY_ACK_LOG, JSON.stringify([record]));
    }

    return record;
}

export interface AccessEvent {
    at: string;
    sessionRef: string;
    event: string;
    detail: string;
}

/** Records page views and attempted captures against the current session. */
export function logAccess(event: string, detail = ""): void {
    if (typeof window === "undefined") return;
    try {
        const log: AccessEvent[] = JSON.parse(localStorage.getItem(KEY_ACCESS_LOG) ?? "[]");
        log.push({ at: new Date().toISOString(), sessionRef: getSessionRef(), event, detail });
        localStorage.setItem(KEY_ACCESS_LOG, JSON.stringify(log.slice(-500)));
    } catch {
        /* storage full or unavailable; access control must not break the app */
    }
}

export function readAccessLog(): AccessEvent[] {
    if (typeof window === "undefined") return [];
    try {
        return JSON.parse(localStorage.getItem(KEY_ACCESS_LOG) ?? "[]") as AccessEvent[];
    } catch {
        return [];
    }
}

/** Short label identifying the viewer, stamped into the watermark. */
export function viewerLabel(ack: Acknowledgement | null, authEmail?: string | null): string {
    const who = authEmail || ack?.email || ack?.fullName || "UNIDENTIFIED VIEWER";
    return who.toUpperCase();
}

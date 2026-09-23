/**
 * Confidentiality, access control and POPIA record keeping for Zyromark (Pty) Ltd.
 *
 * It records who acknowledged the confidentiality undertaking, when, and what
 * they viewed afterwards, so that a disclosure can be traced back to the person
 * who was granted access.
 *
 * Every record is written twice: to `localStorage`, which is what the gate
 * itself reads on the next visit, and to Supabase, which is the register that
 * actually survives the viewer clearing their browser. The local write is
 * synchronous and always happens first, so a Supabase outage can never lock a
 * legitimate viewer out of the site; the remote write is awaited where a caller
 * cares and fired and forgotten where it does not.
 */

export const OWNER = "ZYROMARK PTY LTD";
export const OWNER_LEGAL = "Zyromark (Pty) Ltd";
export const WATERMARK_TEXT = `PROPERTY OF ${OWNER}`;

/** Bump this when the wording of the undertaking changes, to force re-acceptance. */
export const AGREEMENT_VERSION = "1.1";

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

/**
 * Writes to the Supabase register. Never throws: the confidentiality gate is a
 * shutter over the whole application, so a failure here must degrade to a local
 * only record rather than deny access to someone who has just accepted the
 * undertaking. Failures are reported to the console so they are visible in
 * development instead of vanishing.
 */
async function persist(
    table: "confidentiality_acknowledgements" | "access_log",
    row: Record<string, unknown>
): Promise<void> {
    if (typeof window === "undefined") return;

    try {
        const { createClient, isSupabaseConfigured } = await import("@/lib/supabase/client");
        if (!isSupabaseConfigured()) return;

        const supabase = createClient();

        // The gate runs ahead of the sign-in screen, so most rows are filed
        // anonymously. When the viewer does already hold a session, stamp their
        // profile onto the row so the register ties back to an account.
        const {
            data: { user },
        } = await supabase.auth.getUser();

        const { error } = await supabase.from(table).insert({ ...row, user_id: user?.id ?? null });
        if (error) console.error(`[confidential] could not record to ${table}:`, error.message);
    } catch (err) {
        console.error(`[confidential] could not record to ${table}:`, err);
    }
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

export async function saveAcknowledgement(input: {
    fullName: string;
    organisation: string;
    email: string;
}): Promise<Acknowledgement> {
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

    await persist("confidentiality_acknowledgements", {
        version: record.version,
        full_name: record.fullName,
        organisation: record.organisation,
        email: record.email,
        accepted_confidentiality: record.acceptedConfidentiality,
        accepted_popia: record.acceptedPopia,
        accepted_at: record.acceptedAt,
        session_ref: record.sessionRef,
        user_agent: record.userAgent,
        platform: record.platform,
        language: record.language,
        time_zone: record.timeZone,
        screen: record.screen,
    });

    return record;
}

export interface AccessEvent {
    at: string;
    sessionRef: string;
    event: string;
    detail: string;
}

/**
 * Records page views and attempted captures against the current session.
 *
 * Deliberately not awaited by its callers: these fire on every navigation and
 * on every capture attempt, and the viewer must never wait on the network to
 * turn a page.
 */
export function logAccess(event: string, detail = ""): void {
    if (typeof window === "undefined") return;

    const at = new Date().toISOString();
    const sessionRef = getSessionRef();

    try {
        const log: AccessEvent[] = JSON.parse(localStorage.getItem(KEY_ACCESS_LOG) ?? "[]");
        log.push({ at, sessionRef, event, detail });
        localStorage.setItem(KEY_ACCESS_LOG, JSON.stringify(log.slice(-500)));
    } catch {
        /* storage full or unavailable; access control must not break the app */
    }

    void persist("access_log", { session_ref: sessionRef, event, detail, occurred_at: at });
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

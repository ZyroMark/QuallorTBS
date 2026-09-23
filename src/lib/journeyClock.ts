/**
 * Remembers when each trip started, on this device.
 *
 * The live tracking screen resumes from wherever the taxi actually is instead
 * of restarting the trip each time the passenger opens another page, reloads,
 * or closes the site and comes back later.
 */

const STORAGE_KEY = "quallor_journeys";

/** How long a finished trip is kept, so reopening it still shows "Arrived". */
const KEEP_AFTER_ARRIVAL_MS = 6 * 60 * 60 * 1000;

/**
 * The single clock a trip runs on. The map moves the taxi against it and the
 * tracking screen counts the ETA down against it, so the two always agree.
 */
export interface Journey {
    /** Epoch ms when the taxi left the pickup. */
    startedAt: number;
    /** Total trip time in ms. */
    durationMs: number;
}

type Store = Record<string, Journey>;

function isJourney(value: unknown): value is Journey {
    const j = value as Journey | null;
    return !!j && Number.isFinite(j.startedAt) && Number.isFinite(j.durationMs) && j.durationMs > 0;
}

function read(): Store {
    try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
        return parsed && typeof parsed === "object" ? (parsed as Store) : {};
    } catch {
        return {};
    }
}

function write(store: Store) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
        // Storage blocked or full: tracking still works, it just won't survive a reload.
    }
}

/**
 * Returns the clock for this trip, carrying on from the saved one if the trip
 * is already under way. A new clock is only started for a trip that has never
 * run here, or one that finished long enough ago to have been cleared.
 */
export function resumeOrStartJourney(key: string, durationMs: number, now = Date.now()): Journey {
    const store = read();

    for (const [k, j] of Object.entries(store)) {
        if (!isJourney(j) || now > j.startedAt + j.durationMs + KEEP_AFTER_ARRIVAL_MS) delete store[k];
    }

    const journey = store[key] ?? { startedAt: now, durationMs };
    store[key] = journey;
    write(store);
    return journey;
}

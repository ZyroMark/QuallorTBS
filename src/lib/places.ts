/**
 * Shared place registry for the Eastern Cape network.
 *
 * Every search box, destination grid and connecting-leg picker reads from this
 * one list so a place typed on one screen resolves the same way everywhere.
 */

export type PlaceKind = "commute" | "hiking";

export interface Place {
    name: string;
    region: string;
    /** Which service can reach it. Some hubs serve both. */
    kinds: PlaceKind[];
    /** Base fare in rand for a single leg. */
    fare: number;
    lat: number;
    lng: number;
    /** Extra words people search by. */
    aliases?: string[];
}

export const PLACES: Place[] = [
    // ── East London metro (daily commute) ──
    { name: "Beacon Bay",          region: "East London",           kinds: ["commute", "hiking"], fare: 18, lat: -32.9836, lng: 27.9196 },
    { name: "Amalinda",            region: "Residential District",  kinds: ["commute"],           fare: 18, lat: -32.9611, lng: 27.8771 },
    { name: "Vincent",             region: "Business Hub",          kinds: ["commute"],           fare: 20, lat: -32.9729, lng: 27.8934 },
    { name: "Mdantsane",           region: "Main Township",         kinds: ["commute", "hiking"], fare: 22, lat: -32.9299, lng: 27.8049, aliases: ["ndantsane"] },
    { name: "Nahoon",              region: "Beach & Surf",          kinds: ["commute"],           fare: 15, lat: -32.9992, lng: 27.9471 },
    { name: "Southernwood",        region: "Inner City",            kinds: ["commute"],           fare: 15, lat: -32.9902, lng: 27.8878 },
    { name: "Gonubie",             region: "Coastal Suburb",        kinds: ["commute"],           fare: 24, lat: -32.9386, lng: 28.0333 },
    { name: "Hemingways Mall",     region: "Retail Hub",            kinds: ["commute"],           fare: 16, lat: -32.9799, lng: 27.8790, aliases: ["mall", "hemingway"] },
    { name: "East London Airport", region: "Airport Transfer",      kinds: ["commute", "hiking"], fare: 35, lat: -33.0356, lng: 27.8259, aliases: ["ELS", "airport"] },
    { name: "EL CBD",              region: "City Centre",           kinds: ["commute"],           fare: 15, lat: -32.9859, lng: 27.8546, aliases: ["city centre", "town"] },

    // ── Inter-city (hiking / long distance) ──
    { name: "East London",         region: "Departure Hub",         kinds: ["hiking"],            fare: 0,   lat: -32.9859, lng: 27.8546, aliases: ["monti", "eL"] },
    { name: "King William's Town", region: "Amathole District",     kinds: ["hiking"],            fare: 60,  lat: -32.8885, lng: 27.4054, aliases: ["kwt", "qonce"] },
    { name: "Butterworth",         region: "Gcuwa",                 kinds: ["hiking"],            fare: 120, lat: -32.3314, lng: 28.1508, aliases: ["gcuwa"] },
    { name: "Queenstown",          region: "Komani",                kinds: ["hiking"],            fare: 180, lat: -31.8998, lng: 26.8770, aliases: ["komani"] },
    { name: "Mthatha",             region: "OR Tambo District",     kinds: ["hiking"],            fare: 320, lat: -31.5888, lng: 28.7847, aliases: ["umtata"] },
    { name: "Port Elizabeth",      region: "Gqeberha",              kinds: ["hiking"],            fare: 450, lat: -33.9608, lng: 25.6022, aliases: ["gqeberha", "pe"] },
    { name: "Motherwell",          region: "Gqeberha North",        kinds: ["hiking"],            fare: 460, lat: -33.8178, lng: 25.5609 },
    { name: "Cape Town",           region: "Western Cape",          kinds: ["hiking"],            fare: 650, lat: -33.9249, lng: 18.4241, aliases: ["kapa"] },
];

export const PLACE_BY_NAME: Record<string, Place> = Object.fromEntries(
    PLACES.map((p) => [p.name, p])
);

export function placesFor(kind: PlaceKind): Place[] {
    return PLACES.filter((p) => p.kinds.includes(kind));
}

/** Case and accent tolerant search across name, region and aliases. */
export function searchPlaces(query: string, kind?: PlaceKind): Place[] {
    const pool = kind ? placesFor(kind) : PLACES;
    const q = query.trim().toLowerCase();
    if (!q) return pool;
    return pool.filter((p) => {
        const haystack = [p.name, p.region, ...(p.aliases ?? [])].join(" ").toLowerCase();
        return haystack.includes(q);
    });
}

/** Coordinates for a place name, falling back to East London. */
export function coordsFor(name: string): { lat: number; lng: number } {
    const p = PLACE_BY_NAME[name];
    return p ? { lat: p.lat, lng: p.lng } : { lat: -32.9859, lng: 27.8546 };
}

/**
 * Onward hotspots reachable from a given place, used by the connecting-leg
 * picker. Excludes the place you are already arriving at.
 */
export function onwardFrom(name: string, kind?: PlaceKind): Place[] {
    const pool = kind ? placesFor(kind) : PLACES;
    return pool.filter((p) => p.name !== name);
}

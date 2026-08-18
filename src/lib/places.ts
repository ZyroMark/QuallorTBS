/**
 * Shared place registry for the Quallor network.
 *
 * Every search box, destination grid and connecting-leg picker reads from this
 * one list so a place typed on one screen resolves the same way everywhere.
 *
 * Places are grouped by province. A passenger picks the province they travel in
 * and from then on only sees places they can actually reach: a Khayelitsha
 * commuter is not offered Mdantsane. Long-distance ("hiking") routes are the
 * exception, since those are how you cross between provinces.
 */

export type PlaceKind = "commute" | "hiking";

export type ProvinceId = "eastern-cape" | "western-cape" | "gauteng";

export interface Province {
    id: ProvinceId;
    /** Province name, used on headings and the picker. */
    name: string;
    /** The metro the network runs in, which is what passengers actually recognise. */
    metro: string;
    /** Short line for the picker card. */
    blurb: string;
    /** Where the daily commute flow starts from by default. */
    commuteOrigin: string;
    /** Where the long-distance flow departs from. */
    hikingOrigin: string;
    /** Map centre when nothing else is known. */
    centre: { lat: number; lng: number };
}

export const PROVINCES: Province[] = [
    {
        id: "eastern-cape",
        name: "Eastern Cape",
        metro: "East London",
        blurb: "Buffalo City, Mdantsane and the Amathole corridor.",
        commuteOrigin: "Beacon Bay",
        hikingOrigin: "East London",
        centre: { lat: -32.9859, lng: 27.8546 },
    },
    {
        id: "western-cape",
        name: "Western Cape",
        metro: "Cape Town",
        blurb: "Khayelitsha, Gugulethu and the Cape Flats into the city bowl.",
        commuteOrigin: "Cape Town CBD",
        hikingOrigin: "Cape Town",
        centre: { lat: -33.9249, lng: 18.4241 },
    },
    {
        id: "gauteng",
        name: "Gauteng",
        metro: "Johannesburg",
        blurb: "Soweto, Alexandra and Tembisa into the inner-city ranks.",
        commuteOrigin: "Johannesburg CBD",
        hikingOrigin: "Johannesburg",
        centre: { lat: -26.2041, lng: 28.0473 },
    },
];

export const PROVINCE_BY_ID: Record<ProvinceId, Province> = Object.fromEntries(
    PROVINCES.map((p) => [p.id, p])
) as Record<ProvinceId, Province>;

export const DEFAULT_PROVINCE: ProvinceId = "eastern-cape";

/** Narrows an arbitrary string to a known province, falling back to the default. */
export function toProvinceId(value: string | undefined | null): ProvinceId {
    return PROVINCES.some((p) => p.id === value) ? (value as ProvinceId) : DEFAULT_PROVINCE;
}

export interface Place {
    name: string;
    region: string;
    province: ProvinceId;
    /** Which service can reach it. Some hubs serve both. */
    kinds: PlaceKind[];
    /** Base fare in rand for a single leg. */
    fare: number;
    lat: number;
    lng: number;
    /** Extra words people search by. */
    aliases?: string[];
    /**
     * Set on the big interchanges. These are the places people name when they
     * say where they are going, so they sort to the top of a destination list.
     */
    isRank?: boolean;
}

export const PLACES: Place[] = [
    // ═══ EASTERN CAPE ═══════════════════════════════════════════════════════
    // ── East London metro (daily commute) ──
    { name: "Beacon Bay",          region: "East London",           province: "eastern-cape", kinds: ["commute", "hiking"], fare: 18, lat: -32.9836, lng: 27.9196 },
    { name: "Amalinda",            region: "Residential District",  province: "eastern-cape", kinds: ["commute"],           fare: 18, lat: -32.9611, lng: 27.8771 },
    { name: "Vincent",             region: "Business Hub",          province: "eastern-cape", kinds: ["commute"],           fare: 20, lat: -32.9729, lng: 27.8934 },
    { name: "Mdantsane",           region: "Main Township",         province: "eastern-cape", kinds: ["commute", "hiking"], fare: 22, lat: -32.9299, lng: 27.8049, aliases: ["ndantsane"] },
    { name: "Nahoon",              region: "Beach & Surf",          province: "eastern-cape", kinds: ["commute"],           fare: 15, lat: -32.9992, lng: 27.9471 },
    { name: "Southernwood",        region: "Inner City",            province: "eastern-cape", kinds: ["commute"],           fare: 15, lat: -32.9902, lng: 27.8878 },
    { name: "Gonubie",             region: "Coastal Suburb",        province: "eastern-cape", kinds: ["commute"],           fare: 24, lat: -32.9386, lng: 28.0333 },
    { name: "Hemingways Mall",     region: "Retail Hub",            province: "eastern-cape", kinds: ["commute"],           fare: 16, lat: -32.9799, lng: 27.8790, aliases: ["mall", "hemingway"] },
    { name: "East London Airport", region: "Airport Transfer",      province: "eastern-cape", kinds: ["commute", "hiking"], fare: 35, lat: -33.0356, lng: 27.8259, aliases: ["ELS", "airport"] },
    { name: "EL CBD",              region: "City Centre",           province: "eastern-cape", kinds: ["commute"],           fare: 15, lat: -32.9859, lng: 27.8546, aliases: ["city centre", "town"] },

    // ── Inter-city (hiking / long distance) ──
    { name: "East London",         region: "Departure Hub",         province: "eastern-cape", kinds: ["hiking"],            fare: 0,   lat: -32.9859, lng: 27.8546, aliases: ["monti", "eL"], isRank: true },
    { name: "King William's Town", region: "Amathole District",     province: "eastern-cape", kinds: ["hiking"],            fare: 60,  lat: -32.8885, lng: 27.4054, aliases: ["kwt", "qonce"] },
    { name: "Butterworth",         region: "Gcuwa",                 province: "eastern-cape", kinds: ["hiking"],            fare: 120, lat: -32.3314, lng: 28.1508, aliases: ["gcuwa"] },
    { name: "Queenstown",          region: "Komani",                province: "eastern-cape", kinds: ["hiking"],            fare: 180, lat: -31.8998, lng: 26.8770, aliases: ["komani"] },
    { name: "Mthatha",             region: "OR Tambo District",     province: "eastern-cape", kinds: ["hiking"],            fare: 320, lat: -31.5888, lng: 28.7847, aliases: ["umtata"] },
    { name: "Port Elizabeth",      region: "Gqeberha",              province: "eastern-cape", kinds: ["hiking"],            fare: 450, lat: -33.9608, lng: 25.6022, aliases: ["gqeberha", "pe"] },
    { name: "Motherwell",          region: "Gqeberha North",        province: "eastern-cape", kinds: ["hiking"],            fare: 460, lat: -33.8178, lng: 25.5609 },

    // ═══ WESTERN CAPE ═══════════════════════════════════════════════════════
    // Township and dense settlement demand: HSRC puts minibus dependence above
    // 50% of residents in Khayelitsha, Gugulethu and Atlantis.
    { name: "Khayelitsha",         region: "Main Township",         province: "western-cape", kinds: ["commute", "hiking"], fare: 22, lat: -34.0403, lng: 18.6920, aliases: ["kasi", "site b", "khayalitsha"], isRank: true },
    { name: "Gugulethu",           region: "Cape Flats",            province: "western-cape", kinds: ["commute"],           fare: 20, lat: -33.9803, lng: 18.5764, aliases: ["gugs"] },
    { name: "Atlantis",            region: "West Coast",            province: "western-cape", kinds: ["commute", "hiking"], fare: 35, lat: -33.5667, lng: 18.4833 },

    // Northern and industrial hubs: the Bellville and Kraaifontein corridor
    // into the central city.
    { name: "Bellville",           region: "Northern Transit Hub",  province: "western-cape", kinds: ["commute", "hiking"], fare: 20, lat: -33.9022, lng: 18.6292, aliases: ["bellstar", "bellville rank"], isRank: true },
    { name: "Kraaifontein",        region: "Northern Suburbs",      province: "western-cape", kinds: ["commute"],           fare: 24, lat: -33.8500, lng: 18.7167 },
    { name: "Klipheuwel",          region: "Rural North",           province: "western-cape", kinds: ["commute"],           fare: 28, lat: -33.7167, lng: 18.7000 },

    // Coastal and outer suburbs with heavy taxi dependence.
    { name: "Hout Bay",            region: "Atlantic Seaboard",     province: "western-cape", kinds: ["commute"],           fare: 25, lat: -34.0392, lng: 18.3550, aliases: ["imizamo yethu"] },
    { name: "Kommetjie",           region: "Far South",             province: "western-cape", kinds: ["commute"],           fare: 30, lat: -34.1394, lng: 18.3286 },
    { name: "Scarborough",         region: "Far South Coast",       province: "western-cape", kinds: ["commute"],           fare: 32, lat: -34.1975, lng: 18.3736 },

    // City centre ranks: Grand Parade on Adderley Street and the upper deck of
    // Cape Town Station are the two main pickup points.
    { name: "Cape Town CBD",       region: "City Centre",           province: "western-cape", kinds: ["commute"],           fare: 15, lat: -33.9249, lng: 18.4241, aliases: ["town", "city bowl", "kaapstad"] },
    { name: "Grand Parade",        region: "Adderley Street Rank",  province: "western-cape", kinds: ["commute"],           fare: 15, lat: -33.9258, lng: 18.4234, aliases: ["adderley", "parade"], isRank: true },
    { name: "Cape Town Station",   region: "Upper Deck Rank",       province: "western-cape", kinds: ["commute", "hiking"], fare: 15, lat: -33.9222, lng: 18.4256, aliases: ["station deck", "ct station"], isRank: true },

    // Long distance out of the Cape.
    { name: "Cape Town",           region: "Departure Hub",         province: "western-cape", kinds: ["hiking"],            fare: 0,   lat: -33.9249, lng: 18.4241, aliases: ["kapa", "ekapa"], isRank: true },

    // ═══ GAUTENG ════════════════════════════════════════════════════════════
    // Inner-city interchanges. These are the anchors of the Joburg network.
    { name: "Johannesburg CBD",    region: "City Centre",           province: "gauteng", kinds: ["commute"],           fare: 15, lat: -26.2041, lng: 28.0473, aliases: ["joburg", "jozi", "town"] },
    { name: "MTN Noord Rank",      region: "Plein & Noord Street",  province: "gauteng", kinds: ["commute"],           fare: 15, lat: -26.1980, lng: 28.0500, aliases: ["noord", "mtn rank"], isRank: true },
    { name: "Bree Taxi Rank",      region: "Lilian Ngoyi Street",   province: "gauteng", kinds: ["commute"],           fare: 15, lat: -26.2016, lng: 28.0400, aliases: ["bree", "lilian ngoyi"], isRank: true },
    { name: "Wanderers Rank",      region: "Park Station",          province: "gauteng", kinds: ["commute", "hiking"], fare: 15, lat: -26.1966, lng: 28.0430, aliases: ["park station", "wanderers"], isRank: true },
    { name: "Faraday Rank",        region: "Southern Suburbs",      province: "gauteng", kinds: ["commute"],           fare: 16, lat: -26.2130, lng: 28.0430, aliases: ["faraday"], isRank: true },
    { name: "Braamfontein",        region: "Inner City",            province: "gauteng", kinds: ["commute"],           fare: 15, lat: -26.1929, lng: 28.0305, aliases: ["braam"] },

    // Townships feeding the inner city. Soweto's flows are channelled through
    // the Baragwanath rank in Diepkloof.
    { name: "Soweto",              region: "Main Township",         province: "gauteng", kinds: ["commute", "hiking"], fare: 22, lat: -26.2678, lng: 27.8585, aliases: ["kasi"], isRank: true },
    { name: "Baragwanath Rank",    region: "Diepkloof",             province: "gauteng", kinds: ["commute"],           fare: 22, lat: -26.2606, lng: 27.9436, aliases: ["bara", "diepkloof"], isRank: true },
    { name: "Orlando",             region: "Soweto",                province: "gauteng", kinds: ["commute"],           fare: 22, lat: -26.2372, lng: 27.9231, aliases: ["orlando east", "orlando west"] },
    { name: "Alexandra",           region: "Township",              province: "gauteng", kinds: ["commute"],           fare: 20, lat: -26.1036, lng: 28.1000, aliases: ["alex"] },
    { name: "Yeoville",            region: "Inner City Suburb",     province: "gauteng", kinds: ["commute"],           fare: 16, lat: -26.1858, lng: 28.0553 },

    // West Rand commuter corridors.
    { name: "Randburg",            region: "West Rand Corridor",    province: "gauteng", kinds: ["commute"],           fare: 22, lat: -26.0936, lng: 28.0064 },
    { name: "Roodepoort",          region: "West Rand Corridor",    province: "gauteng", kinds: ["commute"],           fare: 25, lat: -26.1625, lng: 27.8725 },

    // East Rand connection zones.
    { name: "Tembisa",             region: "East Rand",             province: "gauteng", kinds: ["commute"],           fare: 26, lat: -25.9964, lng: 28.2294 },
    { name: "Kempton Park",        region: "East Rand",             province: "gauteng", kinds: ["commute", "hiking"], fare: 28, lat: -26.1000, lng: 28.2333, aliases: ["kempton"] },

    // Northern routes run on hand signals rather than fixed ranks.
    { name: "Sandton",             region: "Northern Suburbs",      province: "gauteng", kinds: ["commute"],           fare: 24, lat: -26.1076, lng: 28.0567 },
    { name: "Fourways",            region: "Far North",             province: "gauteng", kinds: ["commute"],           fare: 30, lat: -26.0167, lng: 28.0111 },
    { name: "Diepsloot",           region: "Far North Township",    province: "gauteng", kinds: ["commute"],           fare: 30, lat: -25.9333, lng: 28.0000 },
    { name: "City Deep",           region: "Southern Industrial",   province: "gauteng", kinds: ["commute"],           fare: 20, lat: -26.2400, lng: 28.0800 },

    // Long distance out of Johannesburg.
    { name: "Johannesburg",        region: "Departure Hub",         province: "gauteng", kinds: ["hiking"],            fare: 0,   lat: -26.2041, lng: 28.0473, aliases: ["joburg", "jozi", "egoli"], isRank: true },
];

export const PLACE_BY_NAME: Record<string, Place> = Object.fromEntries(
    PLACES.map((p) => [p.name, p])
);

/** A headline route for the dashboard, per province. */
export interface PopularRoute {
    from: string;
    to: string;
    region: string;
    fare: number;
}

/**
 * The three routes shown on the dashboard. Hand-picked rather than derived,
 * because "popular" means the corridors people actually queue for, which is not
 * something a sort over the place list can work out.
 */
const POPULAR_ROUTES: Record<ProvinceId, PopularRoute[]> = {
    "eastern-cape": [
        { from: "Beacon Bay", to: "Amalinda", region: "East London Local", fare: 18 },
        { from: "Vincent", to: "Mdantsane", region: "Mdantsane Commuter", fare: 22 },
        { from: "EL CBD", to: "Nahoon", region: "Coastal Route", fare: 15 },
    ],
    "western-cape": [
        { from: "Cape Town CBD", to: "Khayelitsha", region: "Cape Flats Commuter", fare: 22 },
        { from: "Grand Parade", to: "Gugulethu", region: "Adderley Street Rank", fare: 20 },
        { from: "Bellville", to: "Kraaifontein", region: "Northern Corridor", fare: 24 },
    ],
    gauteng: [
        { from: "Johannesburg CBD", to: "Soweto", region: "Baragwanath Corridor", fare: 22 },
        { from: "MTN Noord Rank", to: "Alexandra", region: "Alex Commuter", fare: 20 },
        { from: "Bree Taxi Rank", to: "Randburg", region: "West Rand Corridor", fare: 22 },
    ],
};

export function popularRoutesFor(province: ProvinceId = DEFAULT_PROVINCE): PopularRoute[] {
    return POPULAR_ROUTES[province] ?? POPULAR_ROUTES[DEFAULT_PROVINCE];
}

/**
 * The long-distance route used as the hiking card's artwork. The Eastern Cape
 * has enough inter-city depth to stay inside the province; the other two are
 * shown as the cross-country runs they actually are.
 */
const FEATURED_HIKE: Record<ProvinceId, { from: string; to: string }> = {
    "eastern-cape": { from: "East London", to: "Mthatha" },
    "western-cape": { from: "Cape Town", to: "Johannesburg" },
    gauteng: { from: "Johannesburg", to: "Cape Town" },
};

export function featuredHikeFor(province: ProvinceId = DEFAULT_PROVINCE): { from: string; to: string } {
    return FEATURED_HIKE[province] ?? FEATURED_HIKE[DEFAULT_PROVINCE];
}

/**
 * Long-distance links between the provinces. A hiking passenger is crossing the
 * country, so these are offered on top of whatever is in their own province.
 */
const INTERCITY_FARES: Record<string, number> = {
    "eastern-cape:western-cape": 650,
    "eastern-cape:gauteng": 700,
    "western-cape:eastern-cape": 650,
    "western-cape:gauteng": 800,
    "gauteng:eastern-cape": 700,
    "gauteng:western-cape": 800,
};

/** The other provinces' departure hubs, priced as a cross-country trip. */
function interProvincialHubs(from: ProvinceId): Place[] {
    return PROVINCES.filter((p) => p.id !== from).map((p) => {
        const hub = PLACE_BY_NAME[p.hikingOrigin];
        return {
            ...hub,
            region: `${p.name} · long distance`,
            fare: INTERCITY_FARES[`${from}:${p.id}`] ?? hub.fare,
        };
    });
}

/**
 * Places of a given kind within one province.
 *
 * Commute is strictly local: those taxis do not leave the metro. Long distance
 * additionally offers the other provinces' hubs, since crossing between them is
 * the whole point of that service.
 */
export function placesFor(kind: PlaceKind, province: ProvinceId = DEFAULT_PROVINCE): Place[] {
    const local = PLACES.filter((p) => p.kinds.includes(kind) && p.province === province);
    return kind === "hiking" ? [...local, ...interProvincialHubs(province)] : local;
}

/** Case and accent tolerant search across name, region and aliases. */
export function searchPlaces(
    query: string,
    kind?: PlaceKind,
    province: ProvinceId = DEFAULT_PROVINCE
): Place[] {
    const pool = kind
        ? placesFor(kind, province)
        : [...PLACES.filter((p) => p.province === province), ...interProvincialHubs(province)];
    const q = query.trim().toLowerCase();
    if (!q) return pool;
    return pool.filter((p) => {
        const haystack = [p.name, p.region, ...(p.aliases ?? [])].join(" ").toLowerCase();
        return haystack.includes(q);
    });
}

/** Coordinates for a place name, falling back to the province centre. */
export function coordsFor(
    name: string,
    province: ProvinceId = DEFAULT_PROVINCE
): { lat: number; lng: number } {
    const p = PLACE_BY_NAME[name];
    return p ? { lat: p.lat, lng: p.lng } : PROVINCE_BY_ID[province].centre;
}

/** Which province a place belongs to, for when only the name is to hand. */
export function provinceOf(name: string): ProvinceId {
    return PLACE_BY_NAME[name]?.province ?? DEFAULT_PROVINCE;
}

/**
 * Onward hotspots reachable from a given place, used by the connecting-leg
 * picker. Excludes the place you are already arriving at.
 *
 * The province is taken from where you are actually standing, not from your
 * home setting: a Joburg passenger who has just arrived in Cape Town needs Cape
 * Town's onward taxis.
 */
export function onwardFrom(name: string, kind?: PlaceKind): Place[] {
    const province = provinceOf(name);
    const pool = kind
        ? placesFor(kind, province)
        : [...PLACES.filter((p) => p.province === province), ...interProvincialHubs(province)];
    return pool.filter((p) => p.name !== name);
}

"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, Marker, Polyline, LatLngExpression } from "leaflet";
import { coordsFor } from "@/lib/places";

/**
 * Live tracking map built on OpenStreetMap.
 *
 * Tiles come from the OSM raster service and the road geometry from the public
 * OSRM routing service, so nothing here needs an API key or a billing account.
 * If routing is unreachable the map still renders and falls back to a direct
 * line between the two stops.
 */

const OSM_TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const OSRM_ENDPOINT = "https://router.project-osrm.org/route/v1/driving";

const ZOOM_3D_THRESHOLD = 16;
/** How often the taxi's position is refreshed. Its speed comes from the trip clock, not this. */
const TICK_MS = 250;
/** Shortest trip we will ever show, so tiny hops don't finish instantly. */
const MIN_JOURNEY_SEC = 120;
/** Fallback average taxi speed (about 40 km/h) when routing gives no drive time. */
const FALLBACK_SPEED_MPS = 40_000 / 3600;
/** Roads are longer than the straight line between two stops. */
const ROAD_DETOUR_FACTOR = 1.3;

type Coord = [number, number]; // [lat, lng]

// ── Bearing in degrees, clockwise from north ──────────────────────────────
function computeBearing(from: Coord, to: Coord): number {
    const lat1 = (from[0] * Math.PI) / 180;
    const lat2 = (to[0] * Math.PI) / 180;
    const dLng = ((to[1] - from[1]) * Math.PI) / 180;
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    return (Math.atan2(y, x) * 180) / Math.PI;
}

// ── Top-down minibus, nose pointing up at 0 degrees ───────────────────────
function topDownBusSvg(): string {
    return `
    <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 64 64">
      <rect x="19" y="14" width="26" height="38" rx="10" fill="#000" opacity="0.22"/>
      <rect x="19" y="12" width="26" height="38" rx="10" fill="#ffffff" stroke="#1D3686" stroke-width="1.8"/>
      <rect x="22" y="15" width="20" height="9" rx="5" fill="#0a0c10"/>
      <rect x="22" y="38" width="20" height="8" rx="4" fill="#0a0c10"/>
      <rect x="16" y="19" width="3.2" height="6" rx="1.6" fill="#111315"/>
      <rect x="44.8" y="19" width="3.2" height="6" rx="1.6" fill="#111315"/>
      <rect x="16" y="37" width="3.2" height="6" rx="1.6" fill="#111315"/>
      <rect x="44.8" y="37" width="3.2" height="6" rx="1.6" fill="#111315"/>
      <rect x="22" y="13" width="4" height="1.4" rx="0.7" fill="#E1EDF5"/>
      <rect x="38" y="13" width="4" height="1.4" rx="0.7" fill="#E1EDF5"/>
    </svg>`;
}

// ── Close-up marker used once the user zooms right in ─────────────────────
function perspectiveBusSvg(): string {
    return `
    <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 112 112">
      <defs>
        <radialGradient id="qhalo" cx="50%" cy="55%" r="50%">
          <stop offset="0%" stop-color="#1D3686" stop-opacity="0.35"/>
          <stop offset="60%" stop-color="#1D3686" stop-opacity="0.10"/>
          <stop offset="100%" stop-color="#1D3686" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="qbody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="55%" stop-color="#E1EDF5"/>
          <stop offset="100%" stop-color="#D6E0EC"/>
        </linearGradient>
        <linearGradient id="qglass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1a1d22"/>
          <stop offset="100%" stop-color="#0a0c10"/>
        </linearGradient>
      </defs>
      <circle cx="56" cy="56" r="48" fill="url(#qhalo)">
        <animate attributeName="r" values="40;52;40" dur="2.2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.9;0.4;0.9" dur="2.2s" repeatCount="indefinite"/>
      </circle>
      <ellipse cx="56" cy="90" rx="26" ry="5" fill="#000" opacity="0.3"/>
      <rect x="32" y="22" width="48" height="68" rx="18" fill="url(#qbody)" stroke="#1D3686" stroke-width="1.8"/>
      <rect x="36" y="27" width="40" height="15" rx="8" fill="url(#qglass)"/>
      <rect x="38" y="48" width="7" height="22" rx="2" fill="#ffffff" opacity="0.55"/>
      <rect x="36" y="70" width="40" height="14" rx="7" fill="url(#qglass)"/>
      <rect x="26" y="34" width="7" height="14" rx="3.5" fill="#111315"/>
      <rect x="79" y="34" width="7" height="14" rx="3.5" fill="#111315"/>
      <rect x="26" y="64" width="7" height="14" rx="3.5" fill="#111315"/>
      <rect x="79" y="64" width="7" height="14" rx="3.5" fill="#111315"/>
      <polygon points="56,14 49,22 63,22" fill="#1D3686"/>
    </svg>`;
}

function stopDotHtml(color: string): string {
    return `<span style="display:block;width:18px;height:18px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 2px 6px rgba(17,17,17,0.35)"></span>`;
}

// ── Great-circle distance in metres ───────────────────────────────────────
function distanceM(a: Coord, b: Coord): number {
    const R = 6371000;
    const dLat = ((b[0] - a[0]) * Math.PI) / 180;
    const dLng = ((b[1] - a[1]) * Math.PI) / 180;
    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Fallback trip time when routing is unreachable: straight-line distance, a
 * detour allowance for real roads and an average taxi speed.
 */
function estimateDurationSec(from: Coord, to: Coord): number {
    const roadM = distanceM(from, to) * ROAD_DETOUR_FACTOR;
    return Math.max(MIN_JOURNEY_SEC, roadM / FALLBACK_SPEED_MPS);
}

/** Ask OSRM for the real road geometry and drive time. Returns null if it is unavailable. */
async function fetchRoad(from: Coord, to: Coord): Promise<{ path: Coord[]; durationSec: number } | null> {
    try {
        const url = `${OSRM_ENDPOINT}/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        const route = data?.routes?.[0];
        const line = route?.geometry?.coordinates;
        if (!Array.isArray(line) || line.length < 2) return null;
        // GeoJSON is [lng, lat]; Leaflet wants [lat, lng].
        const path = line.map((c: [number, number]) => [c[1], c[0]] as Coord);
        const durationSec = typeof route.duration === "number" && route.duration > 0
            ? Math.max(MIN_JOURNEY_SEC, route.duration)
            : estimateDurationSec(from, to);
        return { path, durationSec };
    } catch {
        return null;
    }
}

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

interface TrackingMapProps {
    from: string;
    to: string;
    taxiId: string;
    /** Called once the route is known, with the clock the trip runs on. */
    onJourney?: (journey: Journey) => void;
}

export default function TrackingMap({ from, to, taxiId, onJourney }: TrackingMapProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<LeafletMap | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

    useEffect(() => {
        let cancelled = false;
        const el = containerRef.current;
        if (!el) return;

        const fromCoord: Coord = [coordsFor(from).lat, coordsFor(from).lng];
        const toCoord: Coord = [coordsFor(to).lat, coordsFor(to).lng];

        const reportJourney = (durationSec: number): Journey => {
            const journey = { startedAt: Date.now(), durationMs: Math.round(durationSec * 1000) };
            onJourney?.(journey);
            return journey;
        };

        (async () => {
            const L = (await import("leaflet")).default;
            if (cancelled || !containerRef.current) return;

            const map = L.map(el, {
                zoomControl: false,
                attributionControl: true,
                scrollWheelZoom: true,
            });
            mapRef.current = map;

            L.tileLayer(OSM_TILES, {
                maxZoom: 19,
                attribution: OSM_ATTRIBUTION,
            }).addTo(map);

            L.control.zoom({ position: "bottomright" }).addTo(map);

            const road = await fetchRoad(fromCoord, toCoord);
            if (cancelled) return;

            const path = road?.path ?? [fromCoord, toCoord];
            const durationSec = road?.durationSec ?? estimateDurationSec(fromCoord, toCoord);
            setStatus("ready");

            const remaining: Polyline = L.polyline(path as LatLngExpression[], {
                color: "#1D3686",
                weight: 6,
                opacity: 1,
                lineCap: "round",
            }).addTo(map);

            const completed: Polyline = L.polyline([path[0]] as LatLngExpression[], {
                color: "#1D3686",
                weight: 6,
                opacity: 0.45,
                lineCap: "round",
            }).addTo(map);

            L.marker(path[0] as LatLngExpression, {
                icon: L.divIcon({
                    html: stopDotHtml("#22c55e"),
                    className: "q-stop-dot",
                    iconSize: [18, 18],
                    iconAnchor: [9, 9],
                }),
                title: `Pickup: ${from}`,
            }).addTo(map);

            L.marker(path[path.length - 1] as LatLngExpression, {
                icon: L.divIcon({
                    html: stopDotHtml("#111111"),
                    className: "q-stop-dot",
                    iconSize: [18, 18],
                    iconAnchor: [9, 9],
                }),
                title: `Drop-off: ${to}`,
            }).addTo(map);

            let heading = path.length > 1 ? computeBearing(path[0], path[1]) : 0;

            function busIcon(zoom: number, deg: number) {
                const is3D = zoom >= ZOOM_3D_THRESHOLD;
                const size = is3D ? 96 : 56;
                const svg = is3D ? perspectiveBusSvg() : topDownBusSvg();
                return L.divIcon({
                    html: `<div style="width:${size}px;height:${size}px;transform:rotate(${deg.toFixed(1)}deg);transform-origin:50% 50%;transition:transform 120ms linear">${svg}</div>`,
                    className: "q-taxi-marker",
                    iconSize: [size, size],
                    iconAnchor: [size / 2, size / 2],
                });
            }

            const taxi: Marker = L.marker(path[0] as LatLngExpression, {
                icon: busIcon(map.getZoom() || 13, heading),
                title: `Taxi ${taxiId}`,
                zIndexOffset: 1000,
            }).addTo(map);

            map.fitBounds(remaining.getBounds(), { padding: [48, 48] });

            map.on("zoomend", () => {
                taxi.setIcon(busIcon(map.getZoom(), heading));
            });

            // Cumulative distance along the route, so the taxi moves at an even
            // speed however densely or sparsely the road geometry is sampled.
            const cumulative: number[] = [0];
            for (let i = 1; i < path.length; i++) {
                cumulative.push(cumulative[i - 1] + distanceM(path[i - 1], path[i]));
            }
            const totalM = cumulative[cumulative.length - 1];
            const last = path.length - 1;

            const { startedAt, durationMs } = reportJourney(durationSec);
            let seg = 0;
            let lastZoom = map.getZoom();
            let lastHeading = heading;

            const tick = () => {
                const fraction = Math.min(1, (Date.now() - startedAt) / durationMs);

                if (fraction >= 1 || totalM === 0) {
                    taxi.setLatLng(path[last] as LatLngExpression);
                    completed.setLatLngs(path as LatLngExpression[]);
                    remaining.setLatLngs([path[last]] as LatLngExpression[]);
                    if (timerRef.current) clearInterval(timerRef.current);
                    return;
                }

                // Find the segment the taxi is on and interpolate within it.
                const travelled = fraction * totalM;
                while (seg < last - 1 && cumulative[seg + 1] < travelled) seg++;
                const segLen = cumulative[seg + 1] - cumulative[seg];
                const t = segLen > 0 ? (travelled - cumulative[seg]) / segLen : 0;
                const a = path[seg];
                const b = path[seg + 1];
                const pos: Coord = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

                heading = computeBearing(a, path[Math.min(last, seg + 2)]);

                const zoom = map.getZoom();
                taxi.setLatLng(pos as LatLngExpression);
                if (zoom !== lastZoom || Math.abs(heading - lastHeading) > 2) {
                    taxi.setIcon(busIcon(zoom, heading));
                    lastZoom = zoom;
                    lastHeading = heading;
                }
                completed.setLatLngs([...path.slice(0, seg + 1), pos] as LatLngExpression[]);
                remaining.setLatLngs([pos, ...path.slice(seg + 1)] as LatLngExpression[]);

                if (zoom >= ZOOM_3D_THRESHOLD) map.panTo(pos as LatLngExpression, { animate: true, duration: TICK_MS / 1000 });
                else if (!map.getBounds().pad(-0.2).contains(pos as LatLngExpression)) map.panTo(pos as LatLngExpression, { animate: true });
            };

            tick();
            timerRef.current = setInterval(tick, TICK_MS);
        })().catch(() => {
            if (cancelled) return;
            setStatus("error");
            // Keep the ETA honest even when the map itself cannot load.
            reportJourney(estimateDurationSec(fromCoord, toCoord));
        });

        return () => {
            cancelled = true;
            if (timerRef.current) clearInterval(timerRef.current);
            mapRef.current?.remove();
            mapRef.current = null;
        };
    }, [from, to, taxiId]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div style={{ position: "relative", width: "100%", height: "100%", backgroundColor: "#E1EDF5" }}>
            <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
            {status === "loading" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
                    <div
                        className="w-8 h-8 rounded-full animate-spin"
                        style={{ border: "3px solid rgba(29,54,134,0.25)", borderTopColor: "#1D3686" }}
                    />
                    <p className="font-sans text-xs font-bold uppercase tracking-wider" style={{ color: "#1D3686" }}>
                        Plotting your route
                    </p>
                </div>
            )}
            {status === "error" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
                    <span className="material-symbols-outlined text-3xl" style={{ color: "#1D3686" }}>map</span>
                    <p className="font-sans text-sm font-bold" style={{ color: "#111111" }}>Map unavailable offline</p>
                    <p className="font-sans text-xs" style={{ color: "#8A8678" }}>
                        Your ticket and seat are still confirmed. Tracking resumes when you are back online.
                    </p>
                </div>
            )}
        </div>
    );
}

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
const STEP_MS = 120;

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

/** Ask OSRM for the real road geometry. Returns null if it is unavailable. */
async function fetchRoadPath(from: Coord, to: Coord): Promise<Coord[] | null> {
    try {
        const url = `${OSRM_ENDPOINT}/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        const line = data?.routes?.[0]?.geometry?.coordinates;
        if (!Array.isArray(line) || line.length < 2) return null;
        // GeoJSON is [lng, lat]; Leaflet wants [lat, lng].
        return line.map((c: [number, number]) => [c[1], c[0]] as Coord);
    } catch {
        return null;
    }
}

/** Insert extra points so short routes still animate smoothly. */
function densify(path: Coord[], minPoints = 120): Coord[] {
    if (path.length >= minPoints) return path;
    const factor = Math.ceil(minPoints / (path.length - 1));
    const out: Coord[] = [];
    for (let i = 0; i < path.length - 1; i++) {
        const [aLat, aLng] = path[i];
        const [bLat, bLng] = path[i + 1];
        for (let s = 0; s < factor; s++) {
            const t = s / factor;
            out.push([aLat + (bLat - aLat) * t, aLng + (bLng - aLng) * t]);
        }
    }
    out.push(path[path.length - 1]);
    return out;
}

interface TrackingMapProps {
    from: string;
    to: string;
    taxiId: string;
    onProgress?: (pct: number) => void;
}

export default function TrackingMap({ from, to, taxiId, onProgress }: TrackingMapProps) {
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

            const road = await fetchRoadPath(fromCoord, toCoord);
            if (cancelled) return;

            const path = densify(road ?? [fromCoord, toCoord]);
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

            const total = path.length - 1;
            let step = 0;
            timerRef.current = setInterval(() => {
                step++;
                if (step >= total) {
                    taxi.setLatLng(path[total] as LatLngExpression);
                    completed.setLatLngs(path as LatLngExpression[]);
                    remaining.setLatLngs([path[total]] as LatLngExpression[]);
                    onProgress?.(100);
                    if (timerRef.current) clearInterval(timerRef.current);
                    return;
                }

                const pos = path[step];
                const prev = path[Math.max(0, step - 1)];
                const lookahead = path[Math.min(total, step + 2)];
                heading = computeBearing(prev, lookahead);

                const zoom = map.getZoom();
                taxi.setLatLng(pos as LatLngExpression);
                taxi.setIcon(busIcon(zoom, heading));
                completed.setLatLngs(path.slice(0, step + 1) as LatLngExpression[]);
                remaining.setLatLngs(path.slice(step) as LatLngExpression[]);

                if (zoom >= ZOOM_3D_THRESHOLD) map.panTo(pos as LatLngExpression, { animate: true, duration: 0.12 });
                else if (step % 10 === 0) map.panTo(pos as LatLngExpression, { animate: true });

                onProgress?.(Math.round((step / total) * 100));
            }, STEP_MS);
        })().catch(() => {
            if (!cancelled) setStatus("error");
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

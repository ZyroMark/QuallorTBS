"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap } from "leaflet";

/**
 * Small OpenStreetMap panel used wherever a map backdrop is needed but full
 * turn-by-turn tracking is not: the driver's home screen, the operator fleet
 * view, trip summaries. No API key, no billing.
 */

const OSM_TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export interface MiniMapMarker {
    lat: number;
    lng: number;
    label?: string;
    color?: string;
}

interface MiniMapProps {
    center: { lat: number; lng: number };
    zoom?: number;
    markers?: MiniMapMarker[];
    /** Pans and zooms are disabled by default so the panel behaves like art. */
    interactive?: boolean;
    className?: string;
    style?: React.CSSProperties;
}

export default function MiniMap({
    center,
    zoom = 12,
    markers = [],
    interactive = false,
    className = "",
    style,
}: MiniMapProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<LeafletMap | null>(null);

    useEffect(() => {
        let cancelled = false;
        const el = containerRef.current;
        if (!el) return;

        (async () => {
            const L = (await import("leaflet")).default;
            if (cancelled || !containerRef.current) return;

            const map = L.map(el, {
                center: [center.lat, center.lng],
                zoom,
                zoomControl: false,
                attributionControl: true,
                dragging: interactive,
                scrollWheelZoom: interactive,
                doubleClickZoom: interactive,
                touchZoom: interactive,
                boxZoom: interactive,
                keyboard: interactive,
            });
            mapRef.current = map;

            L.tileLayer(OSM_TILES, { maxZoom: 19, attribution: OSM_ATTRIBUTION }).addTo(map);

            markers.forEach((m) => {
                const color = m.color ?? "#1D3686";
                L.marker([m.lat, m.lng], {
                    icon: L.divIcon({
                        className: "q-minimap-pin",
                        html: `
                          <div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-6px)">
                            <span style="width:26px;height:26px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 2px 8px rgba(17,17,17,0.3);display:flex;align-items:center;justify-content:center">
                              <span class="material-symbols-outlined" style="font-size:15px;color:#fff">local_taxi</span>
                            </span>
                            ${m.label ? `<span style="margin-top:2px;font-family:'Azeret Mono',monospace;font-size:8px;font-weight:700;color:#fff;background:rgba(17,17,17,0.78);padding:1px 4px;border-radius:3px;white-space:nowrap">${m.label}</span>` : ""}
                          </div>`,
                        iconSize: [26, 26],
                        iconAnchor: [13, 13],
                    }),
                }).addTo(map);
            });

            // Leaflet mis-measures when it mounts inside a container that is
            // still being laid out, so nudge it once on the next frame.
            requestAnimationFrame(() => map.invalidateSize());
        })().catch(() => { /* map is decorative here; failing quietly is fine */ });

        return () => {
            cancelled = true;
            mapRef.current?.remove();
            mapRef.current = null;
        };
    }, [center.lat, center.lng, zoom, interactive]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div
            ref={containerRef}
            className={className}
            style={{ width: "100%", height: "100%", backgroundColor: "#E1EDF5", ...style }}
        />
    );
}

"use client";

import { useEffect, useRef } from "react";
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";

// ── Coordinate registry ────────────────────────────────────────────────────
const COORDS: Record<string, { lat: number; lng: number }> = {
  "Beacon Bay":          { lat: -32.9836, lng: 27.9196 },
  "Amalinda":            { lat: -32.9611, lng: 27.8771 },
  "Vincent":             { lat: -32.9729, lng: 27.8934 },
  "Mdantsane":           { lat: -32.9299, lng: 27.8049 },
  "Nahoon":              { lat: -32.9992, lng: 27.9471 },
  "East London":         { lat: -32.9859, lng: 27.8546 },
  "EL CBD":              { lat: -32.9859, lng: 27.8546 },
  "Gqeberha":            { lat: -33.9608, lng: 25.6022 },
  "Port Elizabeth":      { lat: -33.9608, lng: 25.6022 },
  "Motherwell":          { lat: -33.8178, lng: 25.5609 },
  "Mthatha":             { lat: -31.5888, lng: 28.7847 },
  "Butterworth":         { lat: -32.3314, lng: 28.1508 },
  "Queenstown":          { lat: -31.8998, lng: 26.8770 },
  "Cape Town":           { lat: -33.9249, lng: 18.4241 },
  "King William's Town": { lat: -32.8885, lng: 27.4054 },
};

const DEFAULT_COORD = { lat: -32.9859, lng: 27.8546 };

// ── Map style - clean Uber/Bolt light theme ────────────────────────────────
const MAP_STYLE = [
  { featureType: "all",             elementType: "geometry.fill",        stylers: [{ lightness: 5 }] },
  { featureType: "road",            elementType: "geometry",             stylers: [{ color: "#ffffff" }] },
  { featureType: "road.highway",    elementType: "geometry",             stylers: [{ color: "#F3EFE9" }, { weight: 2 }] },
  { featureType: "water",           elementType: "geometry",             stylers: [{ color: "#D6E4F0" }] },
  { featureType: "landscape",       elementType: "geometry",             stylers: [{ color: "#FFFCF9" }] },
  { featureType: "poi",             elementType: "labels",               stylers: [{ visibility: "off" }] },
  { featureType: "transit",         elementType: "labels",               stylers: [{ visibility: "off" }] },
  { featureType: "administrative",  elementType: "labels.text.fill",     stylers: [{ color: "#666666" }] },
];

// ── Zoom threshold at which we swap to the 3D "tracking" marker ────────────
const ZOOM_3D_THRESHOLD = 16;

// ── Bearing helper (degrees, clockwise from North) ─────────────────────────
function computeBearing(from: google.maps.LatLng, to: google.maps.LatLng): number {
  const lat1 = (from.lat() * Math.PI) / 180;
  const lat2 = (to.lat() * Math.PI) / 180;
  const dLng = ((to.lng() - from.lng()) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180) / Math.PI;
}

// ── Top-down bus icon - clean silhouette that rotates 360° smoothly ───────
// Used at normal zoom levels. Nose of the bus points UP in the SVG (0°).
function topDownBusIcon(heading: number) {
  const h = heading.toFixed(1);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      <g transform="rotate(${h} 32 32)">
        <!-- drop shadow -->
        <rect x="19" y="14" width="26" height="38" rx="10" fill="#000" opacity="0.22"/>
        <!-- body -->
        <rect x="19" y="12" width="26" height="38" rx="10"
              fill="#ffffff" stroke="#1D3686" stroke-width="1.8"/>
        <!-- front windshield (points forward = top) -->
        <rect x="22" y="15" width="20" height="9" rx="5" fill="#0a0c10"/>
        <!-- rear window -->
        <rect x="22" y="38" width="20" height="8" rx="4" fill="#0a0c10"/>
        <!-- roof seam -->
        <line x1="22" y1="31" x2="42" y2="31" stroke="#1D3686" stroke-width="0.5" opacity="0.35"/>
        <!-- wheels at four corners -->
        <rect x="16" y="19" width="3.2" height="6" rx="1.6" fill="#111315"/>
        <rect x="44.8" y="19" width="3.2" height="6" rx="1.6" fill="#111315"/>
        <rect x="16" y="37" width="3.2" height="6" rx="1.6" fill="#111315"/>
        <rect x="44.8" y="37" width="3.2" height="6" rx="1.6" fill="#111315"/>
        <!-- headlight accents (front) -->
        <rect x="22" y="13" width="4" height="1.4" rx="0.7" fill="#E1EDF5"/>
        <rect x="38" y="13" width="4" height="1.4" rx="0.7" fill="#E1EDF5"/>
      </g>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

// ── Perspective "3D" tracking icon - Uber-style close-up marker ───────────
// Used when the user zooms in past ZOOM_3D_THRESHOLD. Larger, richer depth
// cues (halo shadow, gloss, headlight glow) and still rotates with heading.
function perspectiveBusIcon(heading: number) {
  const h = heading.toFixed(1);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="112" height="112" viewBox="0 0 112 112">
      <defs>
        <radialGradient id="halo" cx="50%" cy="55%" r="50%">
          <stop offset="0%"   stop-color="#1D3686" stop-opacity="0.35"/>
          <stop offset="60%"  stop-color="#1D3686" stop-opacity="0.10"/>
          <stop offset="100%" stop-color="#1D3686" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="body3d" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#ffffff"/>
          <stop offset="55%"  stop-color="#E1EDF5"/>
          <stop offset="100%" stop-color="#D6E0EC"/>
        </linearGradient>
        <linearGradient id="glass3d" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#1a1d22"/>
          <stop offset="100%" stop-color="#0a0c10"/>
        </linearGradient>
      </defs>

      <!-- live-tracking halo (pulses via CSS-free inline animate) -->
      <circle cx="56" cy="56" r="48" fill="url(#halo)">
        <animate attributeName="r" values="40;52;40" dur="2.2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.9;0.4;0.9" dur="2.2s" repeatCount="indefinite"/>
      </circle>

      <g transform="rotate(${h} 56 56)">
        <!-- contact shadow under the vehicle -->
        <ellipse cx="56" cy="90" rx="26" ry="5" fill="#000" opacity="0.3"/>

        <!-- body (nose up) -->
        <rect x="32" y="22" width="48" height="68" rx="18"
              fill="url(#body3d)" stroke="#1D3686" stroke-width="1.8"/>

        <!-- windshield (front) -->
        <rect x="36" y="27" width="40" height="15" rx="8" fill="url(#glass3d)"/>

        <!-- roof ridge lines -->
        <line x1="40" y1="50" x2="72" y2="50" stroke="#1D3686" stroke-width="0.8" opacity="0.35"/>
        <line x1="40" y1="60" x2="72" y2="60" stroke="#1D3686" stroke-width="0.8" opacity="0.35"/>

        <!-- gloss highlight -->
        <rect x="38" y="48" width="7" height="22" rx="2" fill="#ffffff" opacity="0.55"/>

        <!-- rear window -->
        <rect x="36" y="70" width="40" height="14" rx="7" fill="url(#glass3d)"/>

        <!-- side window strips -->
        <rect x="34" y="46" width="3" height="20" rx="1.5" fill="url(#glass3d)"/>
        <rect x="75" y="46" width="3" height="20" rx="1.5" fill="url(#glass3d)"/>

        <!-- wheels -->
        <rect x="26" y="34" width="7" height="14" rx="3.5" fill="#111315"/>
        <rect x="79" y="34" width="7" height="14" rx="3.5" fill="#111315"/>
        <rect x="26" y="64" width="7" height="14" rx="3.5" fill="#111315"/>
        <rect x="79" y="64" width="7" height="14" rx="3.5" fill="#111315"/>

        <!-- headlight beams -->
        <rect x="38" y="23" width="6" height="2" rx="1" fill="#E1EDF5"/>
        <rect x="68" y="23" width="6" height="2" rx="1" fill="#E1EDF5"/>

        <!-- front direction chevron -->
        <polygon points="56,14 49,22 63,22" fill="#1D3686"/>
      </g>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

// Combined helper - picks the right icon for a given zoom + heading
function busIconForZoom(zoom: number, heading: number) {
  if (zoom >= ZOOM_3D_THRESHOLD) {
    return {
      url: perspectiveBusIcon(heading),
      size: 112,
    };
  }
  return {
    url: topDownBusIcon(heading),
    size: 64,
  };
}

// ── Dot marker factory ────────────────────────────────────────────────────
function dotIcon(color: string, border = "#ffffff") {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: 10,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: border,
    strokeWeight: 2.5,
  };
}

// ── Route layer - uses Directions API for real road paths ─────────────────
interface RouteLayerProps {
  from: string;
  to: string;
  taxiId: string;
  onProgress?: (pct: number) => void;
}

function RouteLayer({ from, to, taxiId, onProgress }: RouteLayerProps) {
  const map = useMap();
  const remainingPolyRef = useRef<google.maps.Polyline | null>(null);
  const completedPolyRef = useRef<google.maps.Polyline | null>(null);
  const taxiMarkerRef   = useRef<google.maps.Marker | null>(null);
  const intervalRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepRef         = useRef(0);
  const pathRef         = useRef<google.maps.LatLng[]>([]);
  const headingRef      = useRef(0);
  const zoomListenerRef = useRef<google.maps.MapsEventListener | null>(null);

  const fromCoord = COORDS[from] ?? DEFAULT_COORD;
  const toCoord   = COORDS[to]   ?? DEFAULT_COORD;

  useEffect(() => {
    if (!map) return;
    const gmap = map; // non-null capture for the closures below

    const directionsService = new google.maps.DirectionsService();

    directionsService.route(
      {
        origin: fromCoord,
        destination: toCoord,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status !== google.maps.DirectionsStatus.OK || !result) {
          // Fallback: straight line if Directions API fails
          pathRef.current = [
            new google.maps.LatLng(fromCoord.lat, fromCoord.lng),
            new google.maps.LatLng(toCoord.lat,   toCoord.lng),
          ];
          drawRoute();
          return;
        }

        // Use the detailed step-by-step path for smooth animation
        const legs = result.routes[0].legs;
        const fullPath: google.maps.LatLng[] = [];
        legs.forEach((leg) => {
          leg.steps.forEach((step) => {
            step.path.forEach((pt) => fullPath.push(pt));
          });
        });
        pathRef.current = fullPath;
        drawRoute();
      }
    );

    function drawRoute() {
      const path = pathRef.current;
      if (!path.length) return;

      // Remaining route - bold Quallor navy line
      remainingPolyRef.current = new google.maps.Polyline({
        path,
        strokeColor:   "#1D3686",
        strokeOpacity: 1,
        strokeWeight:  6,
        map,
      });

      // Completed route - same Quallor navy, drawn on top as bus moves
      completedPolyRef.current = new google.maps.Polyline({
        path: [path[0]],
        strokeColor:   "#1D3686",
        strokeOpacity: 0.55,
        strokeWeight:  6,
        map,
        zIndex: 2,
      });

      // Pickup dot (green)
      new google.maps.Marker({
        position: path[0],
        map,
        icon: dotIcon("#22c55e"),
        title: `Pickup: ${from}`,
        zIndex: 5,
      });

      // Drop-off dot (black)
      new google.maps.Marker({
        position: path[path.length - 1],
        map,
        icon: dotIcon("#111111"),
        title: `Drop-off: ${to}`,
        zIndex: 5,
      });

      // Initial heading (first two points of the route)
      const initialHeading = path.length > 1 ? computeBearing(path[0], path[1]) : 0;
      headingRef.current = initialHeading;

      // 3D bus marker (Quallor branded minibus) - icon picked by current zoom
      const initialZoom = gmap.getZoom() ?? 13;
      const initialIcon = busIconForZoom(initialZoom, initialHeading);

      taxiMarkerRef.current = new google.maps.Marker({
        position: path[0],
        map,
        icon: {
          url: initialIcon.url,
          scaledSize: new google.maps.Size(initialIcon.size, initialIcon.size),
          anchor:     new google.maps.Point(initialIcon.size / 2, initialIcon.size / 2),
        },
        title:  `Taxi ${taxiId}`,
        zIndex: 10,
        optimized: false, // needed for inline SVG <animate> (halo pulse) to render
      });

      // Re-render the icon whenever the user zooms in/out so the 3D swap is instant
      zoomListenerRef.current = gmap.addListener("zoom_changed", () => {
        if (!taxiMarkerRef.current) return;
        const z = gmap.getZoom() ?? 13;
        const next = busIconForZoom(z, headingRef.current);
        taxiMarkerRef.current.setIcon({
          url: next.url,
          scaledSize: new google.maps.Size(next.size, next.size),
          anchor:     new google.maps.Point(next.size / 2, next.size / 2),
        });
      });

      // Fit map to show full route with padding
      const bounds = new google.maps.LatLngBounds();
      path.forEach((p) => bounds.extend(p));
      gmap.fitBounds(bounds, { top: 80, right: 40, bottom: 260, left: 40 });

      // Animate taxi along real road path
      const TOTAL = path.length - 1;
      stepRef.current = 0;
      intervalRef.current = setInterval(() => {
        stepRef.current++;
        if (stepRef.current >= TOTAL) {
          taxiMarkerRef.current?.setPosition(path[TOTAL]);
          completedPolyRef.current?.setPath(path);
          remainingPolyRef.current?.setPath([path[TOTAL]]);
          onProgress?.(100);
          clearInterval(intervalRef.current!);
          return;
        }

        const i = stepRef.current;
        const pos = path[i];
        const prev = path[Math.max(0, i - 1)];

        // ── Direction-aware rotation (look 1–2 steps ahead for smoother turns) ──
        const lookahead = path[Math.min(TOTAL, i + 2)];
        const heading = computeBearing(prev, lookahead);
        headingRef.current = heading;

        // ── Pick icon for current zoom (Uber-style 3D when zoomed in) ─────────
        const currentZoom = gmap.getZoom() ?? 13;
        const is3D = currentZoom >= ZOOM_3D_THRESHOLD;
        const bus = busIconForZoom(currentZoom, heading);

        // Move + re-orient taxi
        taxiMarkerRef.current?.setPosition(pos);
        taxiMarkerRef.current?.setIcon({
          url: bus.url,
          scaledSize: new google.maps.Size(bus.size, bus.size),
          anchor:     new google.maps.Point(bus.size / 2, bus.size / 2),
        });

        // Update completed (traveled) segment
        completedPolyRef.current?.setPath(path.slice(0, i + 1));

        // Update remaining segment
        remainingPolyRef.current?.setPath(path.slice(i));

        // Camera follow - tight in 3D mode, relaxed in normal mode
        if (is3D) {
          gmap.panTo(pos);            // every frame - locked on the bus
        } else if (i % 8 === 0) {
          gmap.panTo(pos);            // gentle follow
        }

        onProgress?.(Math.round((i / TOTAL) * 100));
      }, 120); // ~120 ms per step = smooth animation
    }

    return () => {
      clearInterval(intervalRef.current ?? undefined);
      zoomListenerRef.current?.remove();
      zoomListenerRef.current = null;
      remainingPolyRef.current?.setMap(null);
      completedPolyRef.current?.setMap(null);
      taxiMarkerRef.current?.setMap(null);
    };
  }, [map, from, to, taxiId]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

// ── Public component ───────────────────────────────────────────────────────
interface TrackingMapProps {
  from: string;
  to: string;
  taxiId: string;
  onProgress?: (pct: number) => void;
}

export default function TrackingMap({ from, to, taxiId, onProgress }: TrackingMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  const fromCoord = COORDS[from] ?? DEFAULT_COORD;
  const toCoord   = COORDS[to]   ?? DEFAULT_COORD;
  const center = {
    lat: (fromCoord.lat + toCoord.lat) / 2,
    lng: (fromCoord.lng + toCoord.lng) / 2,
  };

  if (!apiKey) {
    return (
      <div style={{
        position: "relative", width: "100%", height: "100%",
        background: "#FFFCF9", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 12,
      }}>
        <span style={{ fontSize: 40 }}>🗺️</span>
        <p style={{ fontFamily: "sans-serif", fontWeight: 700, fontSize: 14, color: "#57554F", textAlign: "center", padding: "0 24px" }}>
          Live Map Tracking
        </p>
        <p style={{ fontFamily: "sans-serif", fontSize: 12, color: "#87857F", textAlign: "center", padding: "0 24px" }}>
          Add <code style={{ background: "#F1EDE7", padding: "2px 6px", borderRadius: 4 }}>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to{" "}
          <code style={{ background: "#F1EDE7", padding: "2px 6px", borderRadius: 4 }}>.env.local</code> to enable maps.
        </p>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={center}
          defaultZoom={13}
          gestureHandling="greedy"
          disableDefaultUI
          styles={MAP_STYLE as google.maps.MapTypeStyle[]}
          style={{ width: "100%", height: "100%" }}
        >
          <RouteLayer from={from} to={to} taxiId={taxiId} onProgress={onProgress} />
        </Map>
      </APIProvider>
    </div>
  );
}

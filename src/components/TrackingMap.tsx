"use client";
import { useEffect, useRef, useState } from "react";

const COORDS: Record<string, [number, number]> = {
  "Beacon Bay":          [-32.9836, 27.9196],
  "Amalinda":            [-32.9611, 27.8771],
  "Vincent":             [-32.9729, 27.8934],
  "Mdantsane":           [-32.9299, 27.8049],
  "Nahoon":              [-32.9992, 27.9471],
  "East London":         [-32.9859, 27.8546],
  "EL CBD":              [-32.9859, 27.8546],
  "Port Elizabeth":      [-33.9608, 25.6022],
  "Mthatha":             [-31.5888, 28.7847],
  "Butterworth":         [-32.3314, 28.1508],
  "Queenstown":          [-31.8998, 26.8770],
  "Cape Town":           [-33.9249, 18.4241],
  "King William's Town": [-32.8885, 27.4054],
};

interface TrackingMapProps {
  from: string;
  to: string;
  taxiId: string;
  onProgress?: (percent: number) => void;
}

export default function TrackingMap({ from, to, taxiId, onProgress }: TrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    import("leaflet").then((L) => {
      if (!mapRef.current || mapInstanceRef.current) return;

      // Fix broken default icon paths in Next.js/webpack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const fromCoords = COORDS[from] ?? [-32.9859, 27.8546];
      const toCoords   = COORDS[to]   ?? [-32.9611, 27.8771];
      const midLat = (fromCoords[0] + toCoords[0]) / 2;
      const midLng = (fromCoords[1] + toCoords[1]) / 2;

      const map = L.map(mapRef.current!, {
        center: [midLat, midLng],
        zoom: 12,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
      }).addTo(map);

      L.polyline([fromCoords, toCoords], {
        color: "#8C6A4A",
        weight: 4,
        opacity: 0.9,
        dashArray: "8, 4",
      }).addTo(map);

      L.circleMarker(fromCoords, { radius: 8, fillColor: "#22c55e", color: "#fff", weight: 2, fillOpacity: 1 })
        .addTo(map).bindPopup(`<b>Pickup: ${from}</b>`);
      L.circleMarker(toCoords, { radius: 8, fillColor: "#ef4444", color: "#fff", weight: 2, fillOpacity: 1 })
        .addTo(map).bindPopup(`<b>Drop-off: ${to}</b>`);

      const taxiIcon = L.divIcon({
        className: "",
        html: `<div style="background:#8C6A4A;border:3px solid white;border-radius:50%;width:38px;height:38px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(140,106,74,0.5);font-size:20px;">🚐</div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
      });

      const taxiMarker = L.marker(fromCoords, { icon: taxiIcon })
        .addTo(map)
        .bindPopup(`<b>Taxi ${taxiId}</b> — En route to ${to}`);

      mapInstanceRef.current = map;

      let step = 0;
      const totalSteps = 180;
      intervalRef.current = setInterval(() => {
        if (!mapInstanceRef.current) { clearInterval(intervalRef.current!); return; }
        step++;
        if (step > totalSteps) { clearInterval(intervalRef.current!); return; }
        const t = step / totalSteps;
        const lat = fromCoords[0] + (toCoords[0] - fromCoords[0]) * t;
        const lng = fromCoords[1] + (toCoords[1] - fromCoords[1]) * t;
        taxiMarker.setLatLng([lat, lng]);
        try { map.panTo([lat, lng], { animate: true, duration: 0.4 }); } catch { /* map unmounted */ }
        const pct = Math.round(t * 100);
        setProgress(pct);
        onProgress?.(pct);
      }, 500);
    });

    return () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      if (mapInstanceRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapInstanceRef.current as any).remove();
        mapInstanceRef.current = null;
      }
    };
  }, [from, to, taxiId, onProgress]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} style={{ width: "100%", height: "100%", borderRadius: "inherit" }} />
      <div style={{
        position: "absolute", top: 12, left: 12, zIndex: 1000,
        background: "rgba(255,255,255,0.92)", border: "1px solid #DFD0BB",
        borderRadius: 8, padding: "6px 12px", color: "#8C6A4A",
        fontSize: 11, fontWeight: 700, letterSpacing: "0.05em",
      }}>
        🚐 {progress}% of route completed
      </div>
    </div>
  );
}

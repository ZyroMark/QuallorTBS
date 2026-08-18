"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/app/context/BookingContext";
import { useToast } from "@/components/Toast";
import AuthGuard from "@/components/AuthGuard";

/**
 * Scan to Board.
 *
 * The camera is started explicitly by the user rather than on mount. Browsers
 * only grant getUserMedia in response to a gesture on many setups, and a laptop
 * webcam needs the same permission prompt a phone does, so the screen leads with
 * a Start Camera button and reports exactly why access failed.
 */

interface ScannedTicket {
    bookingId: string;
    passengerName: string;
    from: string;
    to: string;
    seatNumber: string;
    taxiId: string;
    date: string;
    fare: number;
    status: string;
    paymentMethod?: "cash" | "card" | "app";
    bookedByDriver?: boolean;
}

interface Boarding {
    name: string;
    ticketId: string;
    time: string;
    seat: string;
    isWalkUp?: boolean;
    paymentMethod?: string;
}

interface CameraDevice {
    id: string;
    label: string;
}

type ScannerState = "idle" | "starting" | "running" | "denied" | "unavailable" | "insecure";

const TOTAL_SEATS = 14;
const READER_ID = "quallor-qr-reader";

// html5-qrcode's controller surface, kept narrow so we do not depend on its types.
interface Html5QrcodeLike {
    start: (
        cameraIdOrConfig: string | { facingMode: string },
        config: { fps: number; qrbox: { width: number; height: number }; aspectRatio?: number },
        onSuccess: (decodedText: string) => void,
        onFailure: (message: string) => void
    ) => Promise<void>;
    stop: () => Promise<void>;
    clear: () => void;
    scanFile: (file: File, showImage?: boolean) => Promise<string>;
}

function ScanToBoardContent() {
    const router = useRouter();
    const { myBookings, setBoarded } = useBooking();
    const { toast } = useToast();

    const scannerRef = useRef<Html5QrcodeLike | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [state, setState] = useState<ScannerState>("idle");
    const [errorDetail, setErrorDetail] = useState("");
    const [cameras, setCameras] = useState<CameraDevice[]>([]);
    const [activeCamera, setActiveCamera] = useState<string>("");
    const [scanResult, setScanResult] = useState<ScannedTicket | null>(null);
    const [scanError, setScanError] = useState<string | null>(null);
    const [manualId, setManualId] = useState("");
    const [showManual, setShowManual] = useState(false);

    const [recentBoardings, setRecentBoardings] = useState<Boarding[]>([]);

    const boardedCount = recentBoardings.length;
    const fillPercent = Math.min(100, Math.round((boardedCount / TOTAL_SEATS) * 100));

    // Secure-context check: getUserMedia is blocked on plain http except localhost.
    useEffect(() => {
        if (typeof window === "undefined") return;
        const secure = window.isSecureContext || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
        if (!secure) {
            setState("insecure");
            setErrorDetail("Cameras are only available over https, or on localhost during development.");
            return;
        }
        if (!navigator.mediaDevices?.getUserMedia) {
            setState("unavailable");
            setErrorDetail("This browser does not expose a camera API.");
        }
    }, []);

    const acceptTicket = useCallback((decodedText: string) => {
        let ticket: ScannedTicket;
        try {
            ticket = JSON.parse(decodedText);
        } catch {
            setScanResult(null);
            setScanError("Unrecognised QR code. Please scan a valid Quallor digital ticket.");
            return;
        }

        if (!ticket.bookingId || !ticket.passengerName) {
            setScanResult(null);
            setScanError("Invalid ticket. This QR code is not a Quallor boarding pass.");
            return;
        }

        // Reject a ticket already scanned onto this run.
        if (recentBoardings.some((b) => b.ticketId === ticket.bookingId)) {
            setScanResult(null);
            setScanError(`Ticket ${ticket.bookingId} has already boarded on this run.`);
            return;
        }

        setScanResult(ticket);
        setScanError(null);
        setBoarded(ticket.bookingId, true);
        setRecentBoardings((prev) => [
            {
                name: ticket.passengerName,
                ticketId: ticket.bookingId,
                time: "Just now",
                seat: ticket.seatNumber || "-",
                isWalkUp: ticket.bookedByDriver,
                paymentMethod: ticket.paymentMethod,
            },
            ...prev,
        ].slice(0, 8));
        toast(`${ticket.passengerName} boarded`, "success");
    }, [recentBoardings, setBoarded, toast]);

    async function startCamera(cameraId?: string) {
        setState("starting");
        setErrorDetail("");

        try {
            const { Html5Qrcode } = await import("html5-qrcode");

            // Asking for the stream first is what triggers the browser permission
            // prompt, and it is also how device labels become readable.
            const probe = await navigator.mediaDevices.getUserMedia({ video: true });
            probe.getTracks().forEach((t) => t.stop());

            const devices = await Html5Qrcode.getCameras();
            if (!devices.length) {
                setState("unavailable");
                setErrorDetail("No camera was found on this device.");
                return;
            }

            const list = devices.map((d: { id: string; label: string }, i: number) => ({
                id: d.id,
                label: d.label || `Camera ${i + 1}`,
            }));
            setCameras(list);

            // Prefer a rear camera on a phone, otherwise take the first one.
            const chosen =
                cameraId ??
                list.find((d) => /back|rear|environment/i.test(d.label))?.id ??
                list[0].id;
            setActiveCamera(chosen);

            if (scannerRef.current) {
                await scannerRef.current.stop().catch(() => null);
                scannerRef.current.clear();
            }

            const scanner = new Html5Qrcode(READER_ID) as unknown as Html5QrcodeLike;
            scannerRef.current = scanner;

            await scanner.start(
                chosen,
                { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1.4 },
                (decodedText: string) => acceptTicket(decodedText),
                () => { /* per-frame misses are normal while aiming */ }
            );

            setState("running");
        } catch (err) {
            const name = err instanceof DOMException ? err.name : "";
            if (name === "NotAllowedError" || name === "SecurityError") {
                setState("denied");
                setErrorDetail("Camera permission was blocked. Click the padlock in the address bar, set Camera to Allow, then try again.");
            } else if (name === "NotFoundError" || name === "OverconstrainedError") {
                setState("unavailable");
                setErrorDetail("No usable camera was found. Plug in a webcam or use manual entry.");
            } else if (name === "NotReadableError") {
                setState("unavailable");
                setErrorDetail("The camera is already in use by another app. Close it and try again.");
            } else {
                setState("unavailable");
                setErrorDetail(err instanceof Error ? err.message : "The camera could not be started.");
            }
        }
    }

    async function stopCamera() {
        try {
            await scannerRef.current?.stop();
            scannerRef.current?.clear();
        } catch {
            // Already stopped.
        }
        scannerRef.current = null;
        setState("idle");
    }

    useEffect(() => {
        return () => {
            scannerRef.current?.stop().catch(() => null);
        };
    }, []);

    async function handleImageFile(file: File) {
        try {
            const { Html5Qrcode } = await import("html5-qrcode");
            const reader = new Html5Qrcode(READER_ID) as unknown as Html5QrcodeLike;
            const decoded = await reader.scanFile(file, false);
            acceptTicket(decoded);
        } catch {
            setScanError("No QR code could be read from that image.");
        }
    }

    function handleManualEntry(e: React.FormEvent) {
        e.preventDefault();
        const ref = manualId.trim().toUpperCase();
        if (!ref) return;

        const booking = myBookings.find((b) => b.bookingId.toUpperCase() === ref);
        if (!booking) {
            setScanError(`No booking found for ${ref}. Check the reference on the passenger's ticket.`);
            return;
        }
        acceptTicket(booking.qrData);
        setManualId("");
        setShowManual(false);
    }

    const paymentBadge = scanResult?.bookedByDriver
        ? scanResult.paymentMethod === "cash"
            ? { label: "Walk-Up · Cash", bg: "rgba(22,163,74,0.10)", color: "#16A34A" }
            : { label: "Walk-Up · Card", bg: "rgba(29,54,134,0.10)", color: "#1D3686" }
        : { label: "App Booking", bg: "rgba(29,54,134,0.08)", color: "#1D3686" };

    return (
        <main className="min-h-screen bg-q-bg-page flex flex-col pb-24">
            {/* Header */}
            <header className="flex items-center bg-white px-4 py-3 border-b border-q-stone-200 shadow-q-xs sticky top-0 z-10">
                <button
                    onClick={() => router.back()}
                    aria-label="Go back"
                    className="flex w-10 h-10 items-center justify-center rounded-[10px] hover:bg-q-stone-100 transition-colors"
                >
                    <span className="material-symbols-outlined text-q-stone-700">arrow_back</span>
                </button>
                <div className="flex-1 px-3 min-w-0">
                    <h1 className="font-display text-lg font-semibold text-q-stone-900">Scan to Board</h1>
                    <p className="font-sans text-xs" style={{ color: "#1D3686" }}>Verify passenger QR tickets</p>
                </div>
                <div className="text-right flex-shrink-0">
                    <p className="font-mono text-[10px] font-bold text-q-stone-500 uppercase">Boarded</p>
                    <p className="font-sans text-lg font-black" style={{ color: "#111111" }}>{boardedCount}/{TOTAL_SEATS}</p>
                </div>
            </header>

            {/* Capacity bar */}
            <div className="px-4 pt-4 pb-2">
                <div className="flex justify-between font-mono text-[10px] font-bold text-q-stone-500 uppercase tracking-wider mb-1.5">
                    <span>Taxi Capacity</span>
                    <span>{fillPercent}% Full</span>
                </div>
                <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: "rgba(17,17,17,0.10)" }}>
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                            width: `${fillPercent}%`,
                            backgroundColor: fillPercent >= 90 ? "#DC2626" : fillPercent >= 70 ? "#D97706" : "#1D3686",
                        }}
                    />
                </div>
            </div>

            {/* Scanner surface */}
            <div className="px-4 py-4">
                <div
                    className="rounded-[16px] overflow-hidden relative"
                    style={{ border: "1px solid rgba(17,17,17,0.10)", backgroundColor: "#1F1F1F", minHeight: "18rem" }}
                >
                    <style>{`
                        #${READER_ID} { background: transparent !important; border: none !important; }
                        #${READER_ID} video { width: 100% !important; border-radius: 12px !important; display: block; }
                        #${READER_ID} img { display: none !important; }
                        #${READER_ID}__dashboard { display: none !important; }
                    `}</style>
                    <div id={READER_ID} className="w-full" />

                    {state !== "running" && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
                            {state === "starting" ? (
                                <>
                                    <div
                                        className="w-9 h-9 rounded-full animate-spin"
                                        style={{ border: "3px solid rgba(205,223,246,0.25)", borderTopColor: "#CDDFF6" }}
                                    />
                                    <p className="font-sans text-sm font-bold" style={{ color: "#FFFCF9" }}>
                                        Waiting for camera permission
                                    </p>
                                    <p className="font-sans text-xs max-w-xs" style={{ color: "rgba(255,252,249,0.60)", lineHeight: 1.6 }}>
                                        Your browser should be asking to use the camera. Choose Allow.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-4xl" style={{ color: "#CDDFF6" }}>
                                        {state === "denied" ? "videocam_off" : state === "idle" ? "photo_camera" : "error"}
                                    </span>
                                    <p className="font-sans font-bold" style={{ color: "#FFFCF9" }}>
                                        {state === "idle" ? "Camera is off" : state === "denied" ? "Camera blocked" : "Camera unavailable"}
                                    </p>
                                    <p className="font-sans text-xs max-w-xs" style={{ color: "rgba(255,252,249,0.60)", lineHeight: 1.6 }}>
                                        {errorDetail || "Start the camera to scan a passenger's QR ticket. This works on a phone or a laptop webcam."}
                                    </p>
                                    {state !== "insecure" && (
                                        <button
                                            onClick={() => startCamera()}
                                            className="px-6 py-3 rounded-full font-mono text-xs font-bold uppercase tracking-wider"
                                            style={{ backgroundColor: "#CDDFF6", color: "#111111" }}
                                        >
                                            {state === "idle" ? "Start Camera" : "Try Again"}
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Camera controls */}
                <div className="flex flex-wrap gap-2 mt-3">
                    {state === "running" && (
                        <button
                            onClick={stopCamera}
                            className="px-4 py-2 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider"
                            style={{ backgroundColor: "#111111", color: "#FFFFFF" }}
                        >
                            Stop Camera
                        </button>
                    )}
                    {cameras.length > 1 && state === "running" && (
                        <select
                            value={activeCamera}
                            onChange={(e) => startCamera(e.target.value)}
                            aria-label="Choose camera"
                            className="px-4 py-2 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider"
                            style={{ backgroundColor: "#EEF1EA", color: "#5C5A56", border: "none" }}
                        >
                            {cameras.map((c) => (
                                <option key={c.id} value={c.id}>{c.label}</option>
                            ))}
                        </select>
                    )}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider"
                        style={{ backgroundColor: "#EEF1EA", color: "#5C5A56" }}
                    >
                        Scan an image
                    </button>
                    <button
                        onClick={() => setShowManual(!showManual)}
                        className="px-4 py-2 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider"
                        style={showManual
                            ? { backgroundColor: "#1D3686", color: "#FFFFFF" }
                            : { backgroundColor: "#EEF1EA", color: "#5C5A56" }}
                    >
                        Enter reference
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageFile(file);
                            e.target.value = "";
                        }}
                    />
                </div>

                {/* Manual entry, the fallback when no camera exists at all */}
                {showManual && (
                    <form
                        onSubmit={handleManualEntry}
                        className="mt-3 p-4 rounded-[14px]"
                        style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(17,17,17,0.08)" }}
                    >
                        <label className="q-label">Booking Reference</label>
                        <div className="flex gap-2">
                            <input
                                className="q-input flex-1"
                                placeholder="QLR-XXXX-XXXX"
                                value={manualId}
                                onChange={(e) => setManualId(e.target.value)}
                            />
                            <button type="submit" className="q-btn-dark flex-shrink-0">Board</button>
                        </div>
                        <p className="font-sans text-xs mt-2" style={{ color: "#8A8678" }}>
                            Use this when a passenger's screen is broken or the code will not scan.
                        </p>
                    </form>
                )}
            </div>

            {/* Scan result */}
            {scanResult && (
                <div className="mx-4 mb-4 rounded-[14px] p-4" style={{ backgroundColor: "rgba(22,163,74,0.07)", border: "1px solid rgba(22,163,74,0.28)" }}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(22,163,74,0.15)" }}>
                            <span className="material-symbols-outlined" style={{ color: "#16A34A", fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-mono text-[10px] font-bold uppercase tracking-wider" style={{ color: "#16A34A" }}>Boarding Confirmed</p>
                            <p className="font-sans text-lg font-bold truncate" style={{ color: "#111111" }}>{scanResult.passengerName}</p>
                        </div>
                        <span
                            className="flex-shrink-0 px-2.5 py-1 rounded-full font-mono text-[10px] font-bold uppercase"
                            style={{ backgroundColor: paymentBadge.bg, color: paymentBadge.color }}
                        >
                            {paymentBadge.label}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 font-sans text-xs">
                        <div className="rounded-[10px] p-2" style={{ backgroundColor: "#FFFFFF" }}>
                            <p className="font-mono font-bold text-q-stone-500 uppercase mb-0.5">Ticket ID</p>
                            <p className="font-mono font-semibold" style={{ color: "#111111" }}>{scanResult.bookingId}</p>
                        </div>
                        <div className="rounded-[10px] p-2" style={{ backgroundColor: "#FFFFFF" }}>
                            <p className="font-mono font-bold text-q-stone-500 uppercase mb-0.5">Seat</p>
                            <p className="font-bold" style={{ color: "#1D3686" }}>{scanResult.seatNumber || "-"}</p>
                        </div>
                        <div className="rounded-[10px] p-2 col-span-2" style={{ backgroundColor: "#FFFFFF" }}>
                            <p className="font-mono font-bold text-q-stone-500 uppercase mb-0.5">Route</p>
                            <p className="font-semibold" style={{ color: "#111111" }}>{scanResult.from} → {scanResult.to}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setScanResult(null)}
                        className="w-full mt-3 py-2.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider"
                        style={{ backgroundColor: "rgba(22,163,74,0.15)", color: "#16A34A" }}
                    >
                        Scan Next Passenger
                    </button>
                </div>
            )}

            {scanError && (
                <div className="mx-4 mb-4 rounded-[14px] p-4" style={{ backgroundColor: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.25)" }}>
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-3xl flex-shrink-0" style={{ color: "#DC2626", fontVariationSettings: "'FILL' 1" }}>cancel</span>
                        <div>
                            <p className="font-mono text-[10px] font-bold uppercase" style={{ color: "#DC2626" }}>Scan Failed</p>
                            <p className="font-sans text-xs mt-0.5" style={{ color: "rgba(17,17,17,0.72)" }}>{scanError}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setScanError(null)}
                        className="w-full mt-3 py-2.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider"
                        style={{ backgroundColor: "rgba(220,38,38,0.10)", color: "#DC2626" }}
                    >
                        Dismiss and try again
                    </button>
                </div>
            )}

            {/* Recent boardings */}
            <div className="px-4 pb-4">
                <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-q-stone-500 mb-3">Recent Boardings</h3>
                {recentBoardings.length === 0 ? (
                    <p className="font-sans text-sm py-6 text-center" style={{ color: "#8A8678" }}>
                        Nobody has boarded on this run yet.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {recentBoardings.map((b) => (
                            <div
                                key={b.ticketId}
                                className="flex items-center gap-3 p-3 rounded-[12px]"
                                style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(17,17,17,0.07)" }}
                            >
                                <div
                                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={b.isWalkUp
                                        ? { backgroundColor: "rgba(22,163,74,0.12)", color: "#16A34A" }
                                        : { backgroundColor: "#EEF1EA", color: "#1D3686" }}
                                >
                                    <span className="material-symbols-outlined text-sm">{b.isWalkUp ? "person_add" : "person"}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-sans text-sm font-semibold truncate" style={{ color: "#111111" }}>{b.name}</p>
                                    <p className="font-mono text-[10px]" style={{ color: "#AEA89C" }}>{b.ticketId}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="font-sans text-[10px]" style={{ color: "#AEA89C" }}>{b.time}</p>
                                    <p className="font-sans text-xs font-bold" style={{ color: "#111111" }}>Seat {b.seat}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}

export default function ScanToBoardPage() {
    return (
        <AuthGuard requiredRole="driver">
            <ScanToBoardContent />
        </AuthGuard>
    );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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

export default function ScanToBoardPage() {
    const router = useRouter();
    const scannerRef = useRef<{ clear: () => Promise<void> } | null>(null);
    const [scanResult, setScanResult] = useState<ScannedTicket | null>(null);
    const [scanError, setScanError] = useState<string | null>(null);
    const [boardedCount, setBoardedCount] = useState(8);
    const totalSeats = 15;
    const [recentBoardings, setRecentBoardings] = useState<Boarding[]>([
        { name: "Sarah Williams", ticketId: "QLR-8821-AA", time: "2 mins ago", seat: "B2" },
        { name: "Michael Chen", ticketId: "QLR-8818-BB", time: "5 mins ago", seat: "A4" },
    ]);

    useEffect(() => {
        import("html5-qrcode").then(({ Html5QrcodeScanner }) => {
            const scanner = new Html5QrcodeScanner(
                "qr-reader",
                { fps: 10, qrbox: { width: 240, height: 240 }, rememberLastUsedCamera: true },
                false
            );
            scanner.render(
                (decodedText: string) => {
                    try {
                        const ticket: ScannedTicket = JSON.parse(decodedText);
                        if (ticket.bookingId && ticket.passengerName && ticket.status === "valid") {
                            setScanResult(ticket);
                            setScanError(null);
                            setBoardedCount((prev) => Math.min(prev + 1, totalSeats));
                            setRecentBoardings((prev) => [
                                {
                                    name: ticket.passengerName,
                                    ticketId: ticket.bookingId,
                                    time: "Just now",
                                    seat: ticket.seatNumber || "—",
                                    isWalkUp: ticket.bookedByDriver,
                                    paymentMethod: ticket.paymentMethod,
                                },
                                ...prev.slice(0, 4),
                            ]);
                        } else {
                            setScanResult(null);
                            setScanError("INVALID TICKET — This QR code is not a valid Quallor boarding pass.");
                        }
                    } catch {
                        setScanResult(null);
                        setScanError("UNRECOGNISED QR CODE — Please scan a valid Quallor digital ticket.");
                    }
                },
                () => { /* Ignore continuous scan errors */ }
            );
            scannerRef.current = scanner;
        });
        return () => { scannerRef.current?.clear().catch(() => null); };
    }, []);

    const fillPercent = Math.round((boardedCount / totalSeats) * 100);

    const paymentBadge = scanResult?.bookedByDriver
        ? scanResult.paymentMethod === "cash"
            ? { label: "Walk-Up — Cash", cls: "bg-green-50 text-green-700 border-green-200" }
            : { label: "Walk-Up — Card", cls: "bg-blue-50 text-blue-700 border-blue-200" }
        : { label: "App Booking", cls: "bg-q-brown-100 text-q-brown border-q-brown-200" };

    return (
        <main className="min-h-screen bg-q-bg-page flex flex-col pb-24">
            {/* Header */}
            <header className="flex items-center bg-white px-4 py-3 border-b border-q-stone-200 shadow-q-xs sticky top-0 z-10">
                <button onClick={() => router.back()} className="flex w-10 h-10 items-center justify-center rounded-[10px] hover:bg-q-stone-100 transition-colors">
                    <span className="material-symbols-outlined text-q-stone-700">arrow_back</span>
                </button>
                <div className="flex-1 px-3">
                    <h1 className="font-display text-lg font-semibold text-q-stone-900">Scan to Board</h1>
                    <p className="font-sans text-xs text-q-brown">Verify passenger QR tickets</p>
                </div>
                <div className="text-right">
                    <p className="font-sans text-[10px] font-bold text-q-stone-500 uppercase">Boarded</p>
                    <p className="font-display text-lg font-bold text-q-brown">{boardedCount}/{totalSeats}</p>
                </div>
            </header>

            {/* Capacity bar */}
            <div className="px-4 pt-4 pb-2">
                <div className="flex justify-between font-sans text-[10px] font-bold text-q-stone-500 uppercase tracking-wider mb-1.5">
                    <span>Taxi Capacity</span>
                    <span>{fillPercent}% Full</span>
                </div>
                <div className="h-2 w-full bg-q-stone-200 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${
                            fillPercent >= 90 ? "bg-red-500" : fillPercent >= 70 ? "bg-amber-500" : "bg-q-brown"
                        }`}
                        style={{ width: `${fillPercent}%` }}
                    />
                </div>
            </div>

            {/* Scanner */}
            <div className="px-4 py-4">
                <div className="rounded-[14px] overflow-hidden border border-q-stone-200 bg-q-stone-900">
                    <style>{`
                        #qr-reader { background: transparent !important; border: none !important; }
                        #qr-reader__header_message { display: none !important; }
                        #qr-reader__dashboard_section_swaplink { display: none !important; }
                        #qr-reader__status_span { color: #C9B49A !important; font-size: 11px !important; font-family: "DM Sans", sans-serif !important; }
                        #qr-reader video { border-radius: 8px !important; }
                        #qr-reader img { display: none !important; }
                    `}</style>
                    <div id="qr-reader" className="w-full" />
                </div>
            </div>

            {/* Scan result */}
            {scanResult && (
                <div className="mx-4 mb-4 rounded-[14px] bg-green-50 border border-green-200 p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-sans text-xs font-bold text-green-700 uppercase tracking-wider">Boarding Confirmed</p>
                            <p className="font-display text-lg font-semibold text-q-stone-900 truncate">{scanResult.passengerName}</p>
                        </div>
                        <span className={`flex-shrink-0 px-2 py-1 rounded-full font-sans text-[10px] font-bold uppercase border ${paymentBadge.cls}`}>
                            {paymentBadge.label}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 font-sans text-xs">
                        <div className="bg-white rounded-[10px] p-2 border border-green-100">
                            <p className="font-bold text-q-stone-500 uppercase mb-0.5">Ticket ID</p>
                            <p className="font-mono font-semibold text-q-stone-900">{scanResult.bookingId}</p>
                        </div>
                        <div className="bg-white rounded-[10px] p-2 border border-green-100">
                            <p className="font-bold text-q-stone-500 uppercase mb-0.5">Seat</p>
                            <p className="font-bold text-q-brown">{scanResult.seatNumber || "—"}</p>
                        </div>
                        <div className="bg-white rounded-[10px] p-2 border border-green-100 col-span-2">
                            <p className="font-bold text-q-stone-500 uppercase mb-0.5">Route</p>
                            <p className="font-semibold text-q-stone-900">{scanResult.from} → {scanResult.to}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setScanResult(null)}
                        className="w-full mt-3 py-2 rounded-[10px] bg-green-100 text-green-700 font-sans text-xs font-bold uppercase"
                    >
                        Scan Next Passenger
                    </button>
                </div>
            )}

            {scanError && (
                <div className="mx-4 mb-4 rounded-[14px] bg-red-50 border border-red-200 p-4">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-red-500 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
                        <div>
                            <p className="font-sans text-xs font-bold text-red-700 uppercase">Scan Failed</p>
                            <p className="font-sans text-xs text-q-stone-600 mt-0.5">{scanError}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setScanError(null)}
                        className="w-full mt-3 py-2 rounded-[10px] bg-red-100 text-red-700 font-sans text-xs font-bold uppercase"
                    >
                        Dismiss &amp; Try Again
                    </button>
                </div>
            )}

            {/* Recent boardings */}
            <div className="px-4 pb-4">
                <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-q-stone-500 mb-3">Recent Boardings</h3>
                <div className="space-y-2">
                    {recentBoardings.map((b, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-[12px] bg-white border border-q-stone-200">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${b.isWalkUp ? "bg-green-100 text-green-600" : "bg-q-brown-100 text-q-brown"}`}>
                                <span className="material-symbols-outlined text-sm">
                                    {b.isWalkUp ? "person_add" : "person"}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-sans text-sm font-semibold text-q-stone-900 truncate">{b.name}</p>
                                <p className="font-sans text-[10px] text-q-stone-400 font-mono">{b.ticketId}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="font-sans text-[10px] text-q-stone-400">{b.time}</p>
                                <p className="font-sans text-xs font-bold text-q-brown">Seat {b.seat}</p>
                                {b.isWalkUp && (
                                    <span className={`font-sans text-[9px] font-bold uppercase ${b.paymentMethod === "cash" ? "text-green-600" : "text-blue-600"}`}>
                                        {b.paymentMethod || "cash"}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}

"use client";

import { useEffect, useState } from "react";

export default function OfflineBanner() {
    const [isOffline, setIsOffline] = useState(false);
    const [showReconnected, setShowReconnected] = useState(false);

    useEffect(() => {
        const handleOffline = () => setIsOffline(true);
        const handleOnline = () => {
            setIsOffline(false);
            setShowReconnected(true);
            setTimeout(() => setShowReconnected(false), 3000);
        };
        setIsOffline(!navigator.onLine);
        window.addEventListener("offline", handleOffline);
        window.addEventListener("online", handleOnline);
        return () => {
            window.removeEventListener("offline", handleOffline);
            window.removeEventListener("online", handleOnline);
        };
    }, []);

    if (showReconnected) {
        return (
            <div className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 py-2.5 px-4 bg-green-600 text-white text-sm font-sans font-semibold shadow-q-md">
                <span className="material-symbols-outlined text-sm">wifi</span>
                Back online. Your data is syncing
            </div>
        );
    }

    if (!isOffline) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-600 text-white text-sm font-sans font-semibold shadow-q-md">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse inline-block flex-shrink-0"></span>
            <span>No internet connection. Working offline</span>
        </div>
    );
}

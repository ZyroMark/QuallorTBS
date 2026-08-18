"use client";

import React, { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { logAccess, readAcknowledgement } from "@/lib/confidential";
import ConfidentialGate from "./ConfidentialGate";
import Watermark from "./Watermark";
import CaptureGuard from "./CaptureGuard";
import PrintBlock from "./PrintBlock";

/**
 * Wraps the whole application. Nothing inside is rendered until the viewer has
 * read and accepted the confidentiality and POPIA notice, after which the
 * watermark and the capture deterrents stay in place for the rest of the visit.
 */
export default function ConfidentialLayer({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const pathname = usePathname();
    const [granted, setGranted] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (readAcknowledgement()) setGranted(true);
    }, []);

    const handleAccepted = useCallback(() => setGranted(true), []);

    // Every screen the viewer opens is recorded against the session reference.
    useEffect(() => {
        if (!granted || !pathname) return;
        logAccess("page_view", pathname);
    }, [granted, pathname]);

    // Server render and first client paint must match, so hold the shutter
    // closed until we know whether this viewer has already accepted.
    if (!mounted) {
        return (
            <>
                <PrintBlock />
                <div className="q-gate-overlay" aria-hidden="true" />
            </>
        );
    }

    return (
        <>
            <PrintBlock />
            <ConfidentialGate onAccepted={handleAccepted} />
            {granted ? (
                <>
                    {children}
                    <Watermark email={user?.email} />
                    <CaptureGuard />
                </>
            ) : null}
        </>
    );
}

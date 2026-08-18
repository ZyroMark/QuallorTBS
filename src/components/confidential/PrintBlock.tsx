"use client";

import React from "react";
import { OWNER, OWNER_LEGAL } from "@/lib/confidential";

/**
 * Replaces the page when a print or "save as PDF" is attempted. The stylesheet
 * hides the application in print media and shows this notice instead.
 */
export default function PrintBlock() {
    return (
        <div className="q-print-block" aria-hidden="true">
            <p className="q-print-block-title">PROPERTY OF {OWNER}</p>
            <p className="q-print-block-body">
                This material is confidential and may not be printed, exported or saved. Access is granted for viewing
                only. The print attempt has been recorded.
            </p>
            <p className="q-print-block-body">{OWNER_LEGAL}. All rights reserved.</p>
        </div>
    );
}

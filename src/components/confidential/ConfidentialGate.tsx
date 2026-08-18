"use client";

import React, { useEffect, useRef, useState } from "react";
import {
    AGREEMENT_VERSION,
    OWNER,
    OWNER_LEGAL,
    getSessionRef,
    logAccess,
    readAcknowledgement,
    saveAcknowledgement,
} from "@/lib/confidential";

interface Clause {
    heading: string;
    blocks: Array<string | string[]>;
}

const CLAUSES: Clause[] = [
    {
        heading: "1. Confidential material",
        blocks: [
            `Everything presented on this site is confidential information belonging to ${OWNER_LEGAL}. This includes the concept, the product idea, the service model, the screens and their layout, the routes and flows between them, the naming, the branding, the data structures, the commercial approach and any figures shown.`,
            "The material is unpublished and has not been released. It is shown to you for evaluation only.",
        ],
    },
    {
        heading: "2. Undertaking not to disclose",
        blocks: [
            `By continuing you undertake that you will not disclose, describe, summarise, reproduce, publish, demonstrate, transmit or otherwise share this concept or any part of it with any other person or entity, unless you have been instructed to do so in writing by an authorised member of ${OWNER_LEGAL}.`,
            "This undertaking applies whether the disclosure would be made in person, in writing, by message, by presentation, by recording or by any other means, and it applies to partial disclosure as much as to a full one. It remains in force after you leave this site.",
        ],
    },
    {
        heading: "3. Viewing rights only",
        blocks: [
            "You are granted a limited, personal, revocable and non transferable right to view this material. No other right is granted to you.",
            "In particular, you are not granted the right to:",
            [
                "Copy, download, export, print or store the material in any form.",
                "Take screenshots, screen recordings, photographs or any other capture of the material.",
                "Adapt, translate, reverse engineer or create anything derived from the material.",
                "Use the concept, in whole or in part, in your own product, business, pitch, proposal or research.",
                "Grant, sell or pass your access to anyone else.",
            ],
            `Access may be withdrawn at any time and for any reason by ${OWNER_LEGAL}, without notice.`,
        ],
    },
    {
        heading: "4. Capture controls and watermarking",
        blocks: [
            "The site carries a visible ownership watermark on every screen. The watermark also carries a reference that identifies your viewing session, so any image of this material, including a photograph taken with a separate camera, can be traced back to the session it was taken from.",
            "Copying, printing, right click, keyboard capture shortcuts and developer tools are disabled, and the content is hidden whenever this window is not the active window. Attempts to capture the screen are recorded.",
        ],
    },
    {
        heading: "5. Information we record, and your consent under POPIA",
        blocks: [
            `${OWNER_LEGAL} is the responsible party for the personal information described here, as that term is used in the Protection of Personal Information Act 4 of 2013.`,
            "When you accept this notice and while you use the site, the following is recorded and stored on our system:",
            [
                "The name, organisation and email address you provide below.",
                "The date and time you accepted this notice, and the version of the notice you accepted.",
                "Your session reference, device type, operating system, browser, screen size, language and time zone.",
                "The pages and screens you open, and the time you open them.",
                "Any attempt to copy, print, capture or record the material.",
            ],
            "This information is processed so that we can control who has access to confidential material, prove who gave this undertaking and when, and identify the source if the material is disclosed without permission. We rely on your consent for the details you enter below, and on our legitimate interest in protecting confidential material for the access and capture records.",
            "The records are retained for as long as the material remains confidential and for a further three years after that, or for longer where the law requires it. They are not sold, and they are not used for marketing.",
            "Under POPIA you may ask us what personal information we hold about you, ask us to correct or delete it, object to the processing, withdraw your consent, and lodge a complaint with the Information Regulator of South Africa. Withdrawing consent will end your access to this site, because access cannot be granted without a record of who was granted it.",
        ],
    },
    {
        heading: "6. Breach",
        blocks: [
            `Disclosure or use of this material in breach of this notice may cause ${OWNER_LEGAL} loss that money alone cannot repair. ${OWNER_LEGAL} may apply for an interdict to stop the breach, may claim damages, and may pursue any other remedy available in law, including under the Copyright Act 98 of 1978 and the common law of confidence.`,
            "This notice is governed by the law of the Republic of South Africa.",
        ],
    },
];

export default function ConfidentialGate({ onAccepted }: { onAccepted: () => void }) {
    const [ready, setReady] = useState(false);
    const [visible, setVisible] = useState(false);
    const [declined, setDeclined] = useState(false);
    const [fullName, setFullName] = useState("");
    const [organisation, setOrganisation] = useState("");
    const [email, setEmail] = useState("");
    const [agreeConfidentiality, setAgreeConfidentiality] = useState(false);
    const [agreePopia, setAgreePopia] = useState(false);
    const [error, setError] = useState("");
    const [sessionRef, setSessionRef] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const existing = readAcknowledgement();
        setSessionRef(getSessionRef());
        if (existing) {
            logAccess("session_start", `returning viewer: ${existing.email}`);
            onAccepted();
        } else {
            setVisible(true);
            logAccess("gate_shown", `agreement v${AGREEMENT_VERSION}`);
        }
        setReady(true);
    }, [onAccepted]);

    // The gate owns the screen while it is open.
    useEffect(() => {
        if (!visible) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [visible]);

    function handleAccept() {
        if (!fullName.trim()) {
            setError("Enter your full name so the acknowledgement can be attributed to you.");
            return;
        }
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
            setError("Enter a valid email address.");
            return;
        }
        if (!agreeConfidentiality) {
            setError("You must accept the confidentiality undertaking and the viewing terms to continue.");
            return;
        }
        if (!agreePopia) {
            setError("You must consent to your details being recorded to continue.");
            return;
        }

        setError("");
        saveAcknowledgement({ fullName, organisation, email });
        logAccess("gate_accepted", `${email.trim()} (${organisation.trim() || "no organisation"})`);
        setVisible(false);
        onAccepted();
    }

    function handleDecline() {
        logAccess("gate_declined", email.trim() || "anonymous");
        setDeclined(true);
        setVisible(false);
    }

    if (!ready) return null;

    if (declined) {
        return (
            <div className="q-gate-overlay">
                <div className="q-gate-declined">
                    <span className="material-symbols-outlined" style={{ fontSize: 40, color: "#DC2626" }}>
                        lock
                    </span>
                    <h1 className="q-gate-title" style={{ marginTop: "1rem" }}>
                        Access not granted
                    </h1>
                    <p className="q-gate-body">
                        You have declined the confidentiality undertaking, so this material cannot be shown to you. You
                        may close this tab. If you believe you should have access, contact the member of {OWNER_LEGAL}{" "}
                        who sent you the link.
                    </p>
                    <button
                        className="q-btn-dark"
                        style={{ marginTop: "1.5rem" }}
                        onClick={() => window.location.reload()}
                    >
                        Review the notice again
                    </button>
                </div>
            </div>
        );
    }

    if (!visible) return null;

    return (
        <div className="q-gate-overlay" role="dialog" aria-modal="true" aria-labelledby="q-gate-title">
            <div className="q-gate-panel">
                <header className="q-gate-header">
                    <p className="q-eyebrow" style={{ color: "#1D3686" }}>
                        Confidential
                    </p>
                    <h1 id="q-gate-title" className="q-gate-title">
                        Confidentiality and access notice
                    </h1>
                    <p className="q-gate-lede">
                        This site is confidential and is not open to the public. Read this notice in full. You must
                        accept it before any part of the site is shown to you.
                    </p>
                    <p className="q-gate-meta">
                        {OWNER_LEGAL} · Version {AGREEMENT_VERSION} · Session {sessionRef}
                    </p>
                </header>

                <div className="q-gate-scroll" ref={scrollRef}>
                    {CLAUSES.map((clause) => (
                        <section key={clause.heading} className="q-gate-clause">
                            <h2 className="q-gate-clause-heading">{clause.heading}</h2>
                            {clause.blocks.map((block, i) =>
                                Array.isArray(block) ? (
                                    <ul key={i} className="q-gate-list">
                                        {block.map((item) => (
                                            <li key={item}>{item}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p key={i} className="q-gate-para">
                                        {block}
                                    </p>
                                )
                            )}
                        </section>
                    ))}

                    <p className="q-gate-para" style={{ opacity: 0.7 }}>
                        Our full privacy policy and terms of use remain available inside the site and form part of this
                        notice.
                    </p>
                </div>

                <div className="q-gate-form">
                    <div className="q-gate-fields">
                        <label className="q-gate-field">
                            <span className="q-label">Full name</span>
                            <input
                                className="q-input"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="As it appears on your identity document"
                                autoComplete="off"
                            />
                        </label>
                        <label className="q-gate-field">
                            <span className="q-label">Organisation (optional)</span>
                            <input
                                className="q-input"
                                value={organisation}
                                onChange={(e) => setOrganisation(e.target.value)}
                                placeholder="Company or institution"
                                autoComplete="off"
                            />
                        </label>
                        <label className="q-gate-field">
                            <span className="q-label">Email address</span>
                            <input
                                className="q-input"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                autoComplete="off"
                            />
                        </label>
                    </div>

                    <label className="q-gate-check">
                        <input
                            type="checkbox"
                            checked={agreeConfidentiality}
                            onChange={(e) => setAgreeConfidentiality(e.target.checked)}
                        />
                        <span>
                            I have read this notice. I undertake not to share this concept or any part of it with anyone
                            unless instructed in writing by a member of {OWNER_LEGAL}, I accept that I have viewing
                            rights only, and I accept the privacy policy and the terms of use.
                        </span>
                    </label>

                    <label className="q-gate-check">
                        <input
                            type="checkbox"
                            checked={agreePopia}
                            onChange={(e) => setAgreePopia(e.target.checked)}
                        />
                        <span>
                            I consent, in terms of the Protection of Personal Information Act 4 of 2013, to{" "}
                            {OWNER_LEGAL} recording and storing the details I have entered above, my device and session
                            information, and a record of the pages I view, for the purposes set out in clause 5.
                        </span>
                    </label>

                    {error ? <p className="q-gate-error">{error}</p> : null}

                    <div className="q-gate-actions">
                        <button className="q-btn-primary" onClick={handleAccept}>
                            Accept and continue
                        </button>
                        <button className="q-btn-outline" onClick={handleDecline}>
                            Decline
                        </button>
                    </div>

                    <p className="q-gate-foot">PROPERTY OF {OWNER}. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
}

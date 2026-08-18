"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { useBooking } from "@/app/context/BookingContext";
import { useToast } from "@/components/Toast";
import AuthGuard from "@/components/AuthGuard";
import { SettingsShell, SettingsGroup, SettingsRow, Field } from "@/components/SettingsUI";

const FAQS = [
    {
        q: "What happens if the taxi is full when I arrive?",
        a: "Your seat is held by booking reference, so a booked seat cannot be sold to a walk-up passenger. Show your QR ticket to the gaatjie and they will board you against the manifest. If the seat was sold in error, the fare is refunded in full.",
    },
    {
        q: "My route says it leaves when full. When does it actually go?",
        a: "Many Eastern Cape routes fill before they depart. The time shown on a leaves-when-full route is an estimate based on how quickly that taxi has filled recently. You will get a notification when boarding starts.",
    },
    {
        q: "Can I book two taxis for one journey?",
        a: "Yes. On the confirmation screen tap Add a connecting taxi, then pick where you are going on from your first drop-off. Both legs share one journey reference, and each leg has its own ticket and seat.",
    },
    {
        q: "How do I get a refund?",
        a: "Cancel from My Trips more than 30 minutes before departure and the fare returns to your Quallor credits straight away. Inside 30 minutes the fare is not refunded, unless the operator cancels the trip.",
    },
    {
        q: "The scanner will not open my camera.",
        a: "Your browser needs camera permission. Tap the padlock in the address bar, set Camera to Allow, then reload. On a laptop any built-in webcam works. If no camera is available, use the manual ticket entry option on the scan screen.",
    },
    {
        q: "What is gaatjie mode?",
        a: "It is the conductor screen used on board. It shows the manifest for the current run, lets the gaatjie board passengers by tapping or scanning, and records walk-up fares taken in cash or by card.",
    },
];

const CONTACT_LINES = [
    { icon: "call",  label: "Call support",  sub: "043 000 0000 · 06:00 to 20:00 daily", href: "tel:+27430000000" },
    { icon: "sms",   label: "WhatsApp",      sub: "060 000 0000",                        href: "https://wa.me/27600000000" },
    { icon: "mail",  label: "Email",         sub: "support@quallor.co.za",               href: "mailto:support@quallor.co.za" },
];

function SupportContent() {
    const { user } = useAuth();
    const { myBookings } = useBooking();
    const { toast } = useToast();

    const [open, setOpen] = useState<number | null>(null);
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [reference, setReference] = useState("");
    const [sent, setSent] = useState(false);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (!subject.trim() || !message.trim()) {
            toast("Add a subject and a message", "error");
            return;
        }
        // Support tickets are queued locally and sync when the device is online.
        const ticket = {
            id: `SUP-${Date.now().toString(36).toUpperCase()}`,
            from: user?.email,
            subject: subject.trim(),
            message: message.trim(),
            reference: reference || null,
            createdAt: new Date().toISOString(),
        };
        const queue = JSON.parse(localStorage.getItem("quallor_support_queue") || "[]");
        localStorage.setItem("quallor_support_queue", JSON.stringify([ticket, ...queue]));

        setSent(true);
        setSubject("");
        setMessage("");
        setReference("");
        toast(`Message queued as ${ticket.id}`, "success");
    }

    return (
        <SettingsShell title="Support" subtitle="Help centre, FAQs, contact">
            <SettingsGroup label="Talk To A Person">
                {CONTACT_LINES.map((c, i) => (
                    <a key={c.label} href={c.href} className="block">
                        <SettingsRow first={i === 0} icon={c.icon} label={c.label} sub={c.sub} onClick={() => {}} />
                    </a>
                ))}
            </SettingsGroup>

            <SettingsGroup label="Common Questions">
                {FAQS.map((f, i) => (
                    <div key={f.q} style={{ borderTop: i === 0 ? undefined : "1px solid rgba(17,17,17,0.06)" }}>
                        <button
                            onClick={() => setOpen(open === i ? null : i)}
                            className="w-full flex items-center gap-3 p-4 text-left"
                        >
                            <span className="flex-1 font-sans font-semibold text-sm" style={{ color: "#111111" }}>{f.q}</span>
                            <span
                                className="material-symbols-outlined flex-shrink-0 transition-transform"
                                style={{ color: "#AEA89C", transform: open === i ? "rotate(180deg)" : undefined }}
                            >
                                expand_more
                            </span>
                        </button>
                        {open === i && (
                            <p className="px-4 pb-4 font-sans text-sm" style={{ color: "rgba(17,17,17,0.72)", lineHeight: 1.7 }}>
                                {f.a}
                            </p>
                        )}
                    </div>
                ))}
            </SettingsGroup>

            <SettingsGroup label="Send A Message">
                <div className="p-4">
                    {sent ? (
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined flex-shrink-0" style={{ color: "#16A34A", fontVariationSettings: "'FILL' 1" }}>
                                check_circle
                            </span>
                            <div className="flex-1">
                                <p className="font-sans font-bold text-sm" style={{ color: "#111111" }}>Message received</p>
                                <p className="font-sans text-xs mt-1" style={{ color: "#8A8678", lineHeight: 1.6 }}>
                                    We reply to {user?.email} within one working day.
                                </p>
                                <button onClick={() => setSent(false)} className="q-btn-outline mt-4">Send another</button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={submit}>
                            <Field label="Subject" value={subject} onChange={setSubject} placeholder="What is this about?" />

                            {myBookings.length > 0 && (
                                <div className="mb-4">
                                    <label className="q-label">Related Trip (optional)</label>
                                    <select
                                        className="q-input-lg"
                                        value={reference}
                                        onChange={(e) => setReference(e.target.value)}
                                    >
                                        <option value="">No specific trip</option>
                                        {myBookings.slice(0, 12).map((b) => (
                                            <option key={b.bookingId} value={b.bookingId}>
                                                {b.bookingId} · {b.from} to {b.to}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="mb-4">
                                <label className="q-label">Message</label>
                                <textarea
                                    className="q-input-lg"
                                    style={{ height: "8rem", paddingTop: "0.9rem", resize: "vertical" }}
                                    placeholder="Tell us what happened"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                />
                            </div>

                            <button type="submit" className="q-btn-dark w-full justify-center">
                                <span className="material-symbols-outlined text-lg">send</span>
                                Send Message
                            </button>
                        </form>
                    )}
                </div>
            </SettingsGroup>

            <div className="flex gap-3">
                <Link href="/terms" className="q-btn-outline flex-1 justify-center">Terms</Link>
                <Link href="/privacy" className="q-btn-outline flex-1 justify-center">Privacy</Link>
            </div>
        </SettingsShell>
    );
}

export default function SupportPage() {
    return (
        <AuthGuard>
            <SupportContent />
        </AuthGuard>
    );
}

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useBooking } from "@/app/context/BookingContext";
import { useSettings } from "@/app/context/SettingsContext";
import { useToast } from "@/components/Toast";
import { SettingsShell, SettingsGroup, SettingsRow, Toggle } from "@/components/SettingsUI";

export default function SafetyPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { currentBooking } = useBooking();
    const { contacts, safety, updateSafety, triggerSos, sosHistory, resolveSos, checkupScore } = useSettings();
    const { toast } = useToast();

    const [countdown, setCountdown] = useState<number | null>(null);
    const checkup = checkupScore();
    const isDriver = user?.role === "driver";

    // SOS hold: a countdown the user can still cancel before the alert fires.
    useEffect(() => {
        if (countdown === null) return;
        if (countdown <= 0) {
            const where = currentBooking ? `${currentBooking.from} to ${currentBooking.to}` : "Location unavailable";
            const event = triggerSos(where);
            setCountdown(null);
            toast(
                event.notified.length
                    ? `SOS sent to ${event.notified.length} trusted contact${event.notified.length === 1 ? "" : "s"}`
                    : "SOS recorded. Add a trusted contact so someone is alerted next time.",
                event.notified.length ? "success" : "error"
            );
            return;
        }
        const t = setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 1000);
        return () => clearTimeout(t);
    }, [countdown]); // eslint-disable-line react-hooks/exhaustive-deps

    const activeSos = sosHistory.find((e) => !e.resolved);

    return (
        <SettingsShell
            title="Safety & Security"
            subtitle={isDriver ? "Driver safety tools" : "Emergency tools and account security"}
        >
            {/* ── Active alert banner ── */}
            {activeSos && (
                <div
                    className="mb-6 rounded-[16px] p-4"
                    style={{ backgroundColor: "rgba(220,38,38,0.07)", border: "1.5px solid rgba(220,38,38,0.30)" }}
                >
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined flex-shrink-0" style={{ color: "#DC2626", fontVariationSettings: "'FILL' 1" }}>
                            emergency_home
                        </span>
                        <div className="flex-1">
                            <p className="font-sans font-bold text-sm" style={{ color: "#DC2626" }}>SOS alert active</p>
                            <p className="font-sans text-xs mt-0.5" style={{ color: "rgba(17,17,17,0.70)" }}>
                                Raised {new Date(activeSos.triggeredAt).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
                                {activeSos.notified.length > 0 && ` · ${activeSos.notified.join(", ")} notified`}
                            </p>
                        </div>
                        <button
                            onClick={() => { resolveSos(activeSos.id); toast("Alert marked as resolved", "success"); }}
                            className="font-sans text-xs font-bold px-3 py-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: "#DC2626", color: "#FFFFFF" }}
                        >
                            I am safe
                        </button>
                    </div>
                </div>
            )}

            {/* ── SOS button ── */}
            <div
                className="mb-7 rounded-[18px] p-6 flex flex-col items-center text-center"
                style={{ backgroundColor: "#1F1F1F" }}
            >
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "rgba(255,252,249,0.55)" }}>
                    Emergency
                </p>

                {countdown === null ? (
                    <button
                        onClick={() => {
                            if (!safety.sosEnabled) {
                                toast("Turn Emergency SOS on first", "error");
                                return;
                            }
                            setCountdown(safety.sosCountdown);
                        }}
                        className="w-28 h-28 rounded-full flex flex-col items-center justify-center gap-1 transition-transform active:scale-95"
                        style={{
                            backgroundColor: safety.sosEnabled ? "#DC2626" : "rgba(255,252,249,0.16)",
                            color: "#FFFFFF",
                            boxShadow: safety.sosEnabled ? "0 8px 32px rgba(220,38,38,0.45)" : "none",
                        }}
                    >
                        <span className="material-symbols-outlined text-3xl">emergency</span>
                        <span className="font-mono text-xs font-bold tracking-wider">SOS</span>
                    </button>
                ) : (
                    <button
                        onClick={() => { setCountdown(null); toast("SOS cancelled"); }}
                        className="w-28 h-28 rounded-full flex flex-col items-center justify-center gap-0.5 animate-pulse"
                        style={{ backgroundColor: "#DC2626", color: "#FFFFFF", boxShadow: "0 8px 32px rgba(220,38,38,0.55)" }}
                    >
                        <span className="font-sans font-black text-4xl leading-none">{countdown}</span>
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Tap to cancel</span>
                    </button>
                )}

                <p className="font-sans text-sm mt-5 max-w-xs" style={{ color: "rgba(255,252,249,0.72)", lineHeight: 1.6 }}>
                    {safety.sosEnabled
                        ? `Holds for ${safety.sosCountdown} seconds, then alerts ${contacts.filter((c) => c.canSeeLocation).length || "your"} trusted contact${contacts.filter((c) => c.canSeeLocation).length === 1 ? "" : "s"} with your live location.`
                        : "Emergency SOS is currently switched off."}
                </p>
                <p className="font-sans text-xs mt-3" style={{ color: "rgba(255,252,249,0.45)" }}>
                    In a real emergency call 10111 or 112 directly.
                </p>
            </div>

            {/* ── Safety checkup ── */}
            <div
                className="mb-7 rounded-[16px] p-5"
                style={{ backgroundColor: "#E1EDF5", border: "1px solid rgba(17,17,17,0.06)" }}
            >
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <p className="font-sans font-black text-lg" style={{ color: "#111111", letterSpacing: "-0.02em" }}>
                            Safety Checkup
                        </p>
                        <p className="font-sans text-sm" style={{ color: "rgba(17,17,17,0.60)" }}>
                            {checkup.done} of {checkup.total} steps complete
                        </p>
                    </div>
                    <div
                        className="w-14 h-14 rounded-full flex items-center justify-center font-sans font-black"
                        style={{
                            backgroundColor: checkup.done === checkup.total ? "#16A34A" : "#111111",
                            color: "#FFFFFF",
                        }}
                    >
                        {Math.round((checkup.done / checkup.total) * 100)}%
                    </div>
                </div>

                <div className="h-2 w-full rounded-full overflow-hidden mb-4" style={{ backgroundColor: "rgba(17,17,17,0.10)" }}>
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                            width: `${(checkup.done / checkup.total) * 100}%`,
                            backgroundColor: checkup.done === checkup.total ? "#16A34A" : "#1D3686",
                        }}
                    />
                </div>

                <ul className="space-y-2">
                    {checkup.items.map((item) => (
                        <li key={item.label}>
                            <button
                                onClick={() => item.href && router.push(item.href)}
                                className="w-full flex items-center gap-3 text-left"
                            >
                                <span
                                    className="material-symbols-outlined text-lg flex-shrink-0"
                                    style={{ color: item.done ? "#16A34A" : "rgba(17,17,17,0.30)", fontVariationSettings: item.done ? "'FILL' 1" : "'FILL' 0" }}
                                >
                                    {item.done ? "check_circle" : "radio_button_unchecked"}
                                </span>
                                <span
                                    className="font-sans text-sm flex-1"
                                    style={{ color: item.done ? "rgba(17,17,17,0.55)" : "#111111", textDecoration: item.done ? "line-through" : undefined }}
                                >
                                    {item.label}
                                </span>
                                {!item.done && (
                                    <span className="material-symbols-outlined text-base flex-shrink-0" style={{ color: "#1D3686" }}>chevron_right</span>
                                )}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* ── Emergency tools ── */}
            <SettingsGroup label="Emergency Tools">
                <SettingsRow
                    first
                    icon="emergency_share"
                    label="Emergency SOS Settings"
                    sub={safety.sosEnabled ? `On · ${safety.sosCountdown}s hold` : "Off"}
                    onClick={() => router.push("/safety/sos")}
                />
                <SettingsRow
                    icon="group"
                    label="Trusted Contacts"
                    sub={contacts.length === 0 ? "No contacts added yet" : `${contacts.length} contact${contacts.length === 1 ? "" : "s"} · ${contacts.filter((c) => c.canSeeLocation).length} can see your location`}
                    onClick={() => router.push("/safety/contacts")}
                />
            </SettingsGroup>

            {/* ── Privacy ── */}
            <SettingsGroup label="Privacy & Sharing">
                <SettingsRow
                    first
                    icon="share_location"
                    label="Trip Sharing Preferences"
                    sub={safety.shareTripAutomatically ? "Every trip is shared automatically" : "Sharing is manual"}
                    onClick={() => router.push("/safety/sharing")}
                />
            </SettingsGroup>

            {/* ── Account security ── */}
            <SettingsGroup
                label="Account Security"
                footnote="Biometric sign-in uses your device's own Face ID or fingerprint. Quallor never receives the biometric itself."
            >
                <SettingsRow
                    first
                    icon="lock"
                    label="Change Password"
                    sub={safety.passwordChangedAt
                        ? `Last changed ${new Date(safety.passwordChangedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}`
                        : "Never changed on this account"}
                    onClick={() => router.push("/safety/password")}
                />
                <SettingsRow
                    icon="fingerprint"
                    label="Biometric Authentication"
                    sub="Use Face ID or fingerprint to sign in"
                    right={
                        <Toggle
                            label="Biometric authentication"
                            checked={safety.biometricEnabled}
                            onChange={(next) => {
                                updateSafety({ biometricEnabled: next });
                                toast(next ? "Biometric sign-in turned on" : "Biometric sign-in turned off", "success");
                            }}
                        />
                    }
                />
            </SettingsGroup>

            {/* ── Alert history ── */}
            {sosHistory.length > 0 && (
                <SettingsGroup label="Alert History">
                    {sosHistory.map((e, i) => (
                        <SettingsRow
                            key={e.id}
                            first={i === 0}
                            icon={e.resolved ? "history" : "emergency_home"}
                            danger={!e.resolved}
                            label={new Date(e.triggeredAt).toLocaleString("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            sub={`${e.location} · ${e.notified.length ? e.notified.join(", ") : "no contacts alerted"}`}
                            right={
                                <span
                                    className="font-mono text-[10px] font-bold uppercase px-2 py-1 rounded-full flex-shrink-0"
                                    style={e.resolved
                                        ? { backgroundColor: "rgba(22,163,74,0.10)", color: "#16A34A" }
                                        : { backgroundColor: "rgba(220,38,38,0.10)", color: "#DC2626" }}
                                >
                                    {e.resolved ? "Resolved" : "Open"}
                                </span>
                            }
                        />
                    ))}
                </SettingsGroup>
            )}
        </SettingsShell>
    );
}

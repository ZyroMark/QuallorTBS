"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useSettings } from "@/app/context/SettingsContext";
import { useToast } from "@/components/Toast";
import { SettingsShell, SettingsGroup, SettingsRow, Toggle } from "@/components/SettingsUI";

const COUNTDOWNS = [0, 3, 5, 10];

export default function SosSettingsPage() {
    const router = useRouter();
    const { safety, updateSafety, contacts } = useSettings();
    const { toast } = useToast();

    return (
        <SettingsShell title="Emergency SOS" subtitle="Configure rapid response and alerts">
            <SettingsGroup
                label="SOS Button"
                footnote="When SOS fires, your trusted contacts receive your name, your live location and the details of the taxi you are on."
            >
                <SettingsRow
                    first
                    icon="emergency"
                    label="Emergency SOS"
                    sub={safety.sosEnabled ? "The SOS button is active" : "The SOS button is disabled"}
                    right={
                        <Toggle
                            label="Emergency SOS"
                            checked={safety.sosEnabled}
                            onChange={(next) => {
                                updateSafety({ sosEnabled: next });
                                toast(next ? "Emergency SOS turned on" : "Emergency SOS turned off", next ? "success" : "info");
                            }}
                        />
                    }
                />
                <SettingsRow
                    icon="local_hospital"
                    label="Also prompt an emergency call"
                    sub="Opens a call to 10111 when the alert fires"
                    right={
                        <Toggle
                            label="Prompt an emergency call"
                            checked={safety.sosCallsEmergencyServices}
                            onChange={(next) => {
                                updateSafety({ sosCallsEmergencyServices: next });
                                toast(next ? "Emergency call prompt enabled" : "Emergency call prompt disabled", "success");
                            }}
                        />
                    }
                />
            </SettingsGroup>

            <SettingsGroup
                label="Cancel Window"
                footnote="A longer window gives you more time to cancel an accidental press. Zero seconds fires the alert immediately."
            >
                <div className="p-4">
                    <p className="font-sans text-sm mb-4" style={{ color: "rgba(17,17,17,0.70)" }}>
                        How long the button holds before the alert is sent.
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                        {COUNTDOWNS.map((s) => {
                            const active = safety.sosCountdown === s;
                            return (
                                <button
                                    key={s}
                                    onClick={() => {
                                        updateSafety({ sosCountdown: s });
                                        toast(s === 0 ? "SOS will fire immediately" : `Cancel window set to ${s} seconds`, "success");
                                    }}
                                    className="py-3 rounded-[12px] font-sans font-bold text-sm transition-all"
                                    style={active
                                        ? { backgroundColor: "#111111", color: "#FFFFFF" }
                                        : { backgroundColor: "#EEF1EA", color: "#5C5A56" }}
                                >
                                    {s === 0 ? "None" : `${s}s`}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </SettingsGroup>

            <SettingsGroup label="Who Gets Alerted">
                {contacts.filter((c) => c.canSeeLocation).length === 0 ? (
                    <SettingsRow
                        first
                        icon="person_alert"
                        label="No one is set to receive alerts"
                        sub="Add a trusted contact and allow them to see your location"
                        onClick={() => router.push("/safety/contacts")}
                    />
                ) : (
                    contacts
                        .filter((c) => c.canSeeLocation)
                        .map((c, i) => (
                            <SettingsRow
                                key={c.id}
                                first={i === 0}
                                icon="person"
                                label={c.name}
                                sub={`${c.relationship} · ${c.phone}`}
                            />
                        ))
                )}
            </SettingsGroup>

            <button onClick={() => router.push("/safety/contacts")} className="q-btn-outline w-full justify-center">
                <span className="material-symbols-outlined text-lg">group</span>
                Manage trusted contacts
            </button>
        </SettingsShell>
    );
}

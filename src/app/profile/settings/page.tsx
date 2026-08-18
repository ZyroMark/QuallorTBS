"use client";

import React from "react";
import Link from "next/link";
import { useSettings, type AppPreferences } from "@/app/context/SettingsContext";
import { useToast } from "@/components/Toast";
import AuthGuard from "@/components/AuthGuard";
import { SettingsShell, SettingsGroup, SettingsRow, Toggle } from "@/components/SettingsUI";

const LANGUAGES: AppPreferences["language"][] = ["English", "isiXhosa", "Afrikaans"];

function AppSettingsContent() {
    const { preferences, updatePreferences } = useSettings();
    const { toast } = useToast();

    return (
        <SettingsShell title="App Settings" subtitle="Notifications, language, privacy">
            <SettingsGroup label="Notifications">
                <SettingsRow
                    first
                    icon="notifications"
                    label="Push Notifications"
                    sub="Booking confirmations and taxi updates"
                    right={
                        <Toggle
                            label="Push notifications"
                            checked={preferences.pushNotifications}
                            onChange={(next) => { updatePreferences({ pushNotifications: next }); toast(next ? "Push notifications on" : "Push notifications off", "success"); }}
                        />
                    }
                />
                <SettingsRow
                    icon="sms"
                    label="SMS Notifications"
                    sub="Useful when data is low"
                    right={
                        <Toggle
                            label="SMS notifications"
                            checked={preferences.smsNotifications}
                            onChange={(next) => { updatePreferences({ smsNotifications: next }); toast(next ? "SMS notifications on" : "SMS notifications off", "success"); }}
                        />
                    }
                />
                <SettingsRow
                    icon="alarm"
                    label="Trip Reminders"
                    sub="A nudge 15 minutes before departure"
                    right={
                        <Toggle
                            label="Trip reminders"
                            checked={preferences.tripReminders}
                            onChange={(next) => { updatePreferences({ tripReminders: next }); toast(next ? "Trip reminders on" : "Trip reminders off", "success"); }}
                        />
                    }
                />
            </SettingsGroup>

            <SettingsGroup label="Language">
                <div className="p-4">
                    <div className="flex flex-wrap gap-2">
                        {LANGUAGES.map((lang) => (
                            <button
                                key={lang}
                                onClick={() => { updatePreferences({ language: lang }); toast(`Language set to ${lang}`, "success"); }}
                                className="px-5 py-2.5 rounded-full font-sans text-sm font-bold transition-all"
                                style={preferences.language === lang
                                    ? { backgroundColor: "#111111", color: "#FFFFFF" }
                                    : { backgroundColor: "#EEF1EA", color: "#5C5A56" }}
                            >
                                {lang}
                            </button>
                        ))}
                    </div>
                </div>
            </SettingsGroup>

            <SettingsGroup label="Accessibility">
                <SettingsRow
                    first
                    icon="motion_photos_off"
                    label="Reduce Motion"
                    sub="Turn off page animations and reveals"
                    right={
                        <Toggle
                            label="Reduce motion"
                            checked={preferences.reduceMotion}
                            onChange={(next) => { updatePreferences({ reduceMotion: next }); toast(next ? "Motion reduced" : "Animations restored", "success"); }}
                        />
                    }
                />
            </SettingsGroup>

            <SettingsGroup label="Legal">
                <Link href="/terms" className="block">
                    <SettingsRow first icon="gavel" label="Terms of Service" sub="How the network operates" onClick={() => {}} />
                </Link>
                <Link href="/privacy" className="block">
                    <SettingsRow icon="shield_lock" label="Privacy Policy" sub="What we collect and why" onClick={() => {}} />
                </Link>
            </SettingsGroup>

            <p className="font-sans text-center text-[10px]" style={{ color: "#AEA89C" }}>
                Quallor v2.4.1 (Build 890)
            </p>
        </SettingsShell>
    );
}

export default function AppSettingsPage() {
    return (
        <AuthGuard>
            <AppSettingsContent />
        </AuthGuard>
    );
}

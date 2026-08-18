"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useSettings } from "@/app/context/SettingsContext";
import { useToast } from "@/components/Toast";
import { SettingsShell, Field } from "@/components/SettingsUI";

/** Rough strength read-out so people pick something better than "123456". */
function strengthOf(pw: string): { score: number; label: string; color: string } {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (pw.length === 0) return { score: 0, label: "", color: "transparent" };
    if (score <= 1) return { score: 1, label: "Weak", color: "#DC2626" };
    if (score <= 3) return { score: 2, label: "Fair", color: "#D97706" };
    if (score === 4) return { score: 3, label: "Strong", color: "#16A34A" };
    return { score: 4, label: "Very strong", color: "#16A34A" };
}

export default function ChangePasswordPage() {
    const router = useRouter();
    const { changePassword } = useAuth();
    const { safety, updateSafety } = useSettings();
    const { toast } = useToast();

    const [current, setCurrent] = useState("");
    const [next, setNext] = useState("");
    const [confirm, setConfirm] = useState("");
    const [show, setShow] = useState(false);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const strength = strengthOf(next);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        if (next !== confirm) {
            setError("The new passwords do not match.");
            return;
        }

        setSaving(true);
        const result = changePassword(current, next);
        setSaving(false);

        if (!result.success) {
            setError(result.error || "Could not change your password.");
            return;
        }

        updateSafety({ passwordChangedAt: new Date().toISOString() });
        toast("Password updated", "success");
        router.push("/safety");
    }

    return (
        <SettingsShell title="Change Password" subtitle="Keep your account secure">
            <form onSubmit={handleSubmit}>
                {error && (
                    <div
                        className="mb-5 px-4 py-3 rounded-[12px] font-sans text-sm font-semibold"
                        style={{ backgroundColor: "rgba(220,38,38,0.07)", border: "1.5px solid rgba(220,38,38,0.20)", color: "#DC2626" }}
                    >
                        {error}
                    </div>
                )}

                <div
                    className="rounded-[16px] p-5 mb-6"
                    style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(17,17,17,0.07)" }}
                >
                    <Field
                        label="Current Password"
                        value={current}
                        onChange={setCurrent}
                        type={show ? "text" : "password"}
                        placeholder="Your current password"
                        required
                        autoComplete="current-password"
                    />

                    <Field
                        label="New Password"
                        value={next}
                        onChange={setNext}
                        type={show ? "text" : "password"}
                        placeholder="At least 6 characters"
                        required
                        autoComplete="new-password"
                    />

                    {next && (
                        <div className="-mt-2 mb-4">
                            <div className="flex gap-1 mb-1.5">
                                {[1, 2, 3, 4].map((i) => (
                                    <div
                                        key={i}
                                        className="h-1 flex-1 rounded-full transition-colors"
                                        style={{ backgroundColor: i <= strength.score ? strength.color : "rgba(17,17,17,0.10)" }}
                                    />
                                ))}
                            </div>
                            <p className="font-sans text-xs font-bold" style={{ color: strength.color }}>{strength.label}</p>
                        </div>
                    )}

                    <Field
                        label="Confirm New Password"
                        value={confirm}
                        onChange={setConfirm}
                        type={show ? "text" : "password"}
                        placeholder="Repeat the new password"
                        required
                        autoComplete="new-password"
                    />

                    <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={show}
                            onChange={(e) => setShow(e.target.checked)}
                            className="w-4 h-4 rounded"
                            style={{ accentColor: "#111111" }}
                        />
                        <span className="font-sans text-sm" style={{ color: "#5C5A56" }}>Show passwords</span>
                    </label>
                </div>

                {safety.passwordChangedAt && (
                    <p className="font-sans text-xs mb-5 px-1" style={{ color: "#8A8678" }}>
                        Last changed{" "}
                        {new Date(safety.passwordChangedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}.
                    </p>
                )}

                <button type="submit" disabled={saving} className="q-btn-dark-lg w-full justify-center">
                    {saving ? "Updating..." : "Update Password"}
                </button>
            </form>
        </SettingsShell>
    );
}

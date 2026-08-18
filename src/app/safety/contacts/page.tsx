"use client";

import React, { useState } from "react";
import { useSettings, type TrustedContact } from "@/app/context/SettingsContext";
import { useToast } from "@/components/Toast";
import { SettingsShell, SettingsGroup, SettingsRow, Toggle, Field } from "@/components/SettingsUI";

const RELATIONSHIPS = ["Family", "Partner", "Friend", "Colleague", "Neighbour", "Other"];

export default function TrustedContactsPage() {
    const { contacts, addContact, updateContact, removeContact } = useSettings();
    const { toast } = useToast();

    const [editing, setEditing] = useState<TrustedContact | "new" | null>(null);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [relationship, setRelationship] = useState(RELATIONSHIPS[0]);
    const [canSeeLocation, setCanSeeLocation] = useState(true);
    const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

    function openNew() {
        setEditing("new");
        setName("");
        setPhone("");
        setRelationship(RELATIONSHIPS[0]);
        setCanSeeLocation(true);
        setErrors({});
    }

    function openEdit(c: TrustedContact) {
        setEditing(c);
        setName(c.name);
        setPhone(c.phone);
        setRelationship(c.relationship);
        setCanSeeLocation(c.canSeeLocation);
        setErrors({});
    }

    function validate() {
        const next: { name?: string; phone?: string } = {};
        if (!name.trim()) next.name = "Give this contact a name.";
        // South African numbers, with or without the country code.
        const digits = phone.replace(/[^\d+]/g, "");
        if (!digits) next.phone = "A mobile number is required.";
        else if (!/^(\+?27|0)\d{9}$/.test(digits)) next.phone = "Enter a South African mobile number, for example 082 123 4567.";
        setErrors(next);
        return Object.keys(next).length === 0;
    }

    function save() {
        if (!validate()) return;
        const payload = { name: name.trim(), phone: phone.trim(), relationship, canSeeLocation };
        if (editing === "new") {
            addContact(payload);
            toast(`${payload.name} added as a trusted contact`, "success");
        } else if (editing) {
            updateContact(editing.id, payload);
            toast("Contact updated", "success");
        }
        setEditing(null);
    }

    return (
        <SettingsShell
            title="Trusted Contacts"
            subtitle="People who can see your location"
            action={
                <button
                    onClick={openNew}
                    aria-label="Add contact"
                    className="flex w-10 h-10 items-center justify-center rounded-full flex-shrink-0"
                    style={{ backgroundColor: "#111111", color: "#FFFFFF" }}
                >
                    <span className="material-symbols-outlined">add</span>
                </button>
            }
        >
            {contacts.length === 0 && !editing && (
                <div className="py-16 flex flex-col items-center text-center">
                    <span className="material-symbols-outlined text-5xl mb-3" style={{ color: "#CDDFF6" }}>group_add</span>
                    <h3 className="font-sans font-black text-lg mb-1" style={{ color: "#111111" }}>No trusted contacts yet</h3>
                    <p className="font-sans text-sm mb-6 max-w-xs" style={{ color: "#8A8678", lineHeight: 1.6 }}>
                        Add someone who should be told where you are if you raise an SOS or share a trip.
                    </p>
                    <button onClick={openNew} className="q-btn-dark">
                        <span className="material-symbols-outlined text-lg">person_add</span>
                        Add your first contact
                    </button>
                </div>
            )}

            {contacts.length > 0 && (
                <SettingsGroup
                    label={`${contacts.length} Contact${contacts.length === 1 ? "" : "s"}`}
                    footnote="Only contacts with location sharing on are alerted when you press SOS."
                >
                    {contacts.map((c, i) => (
                        <div key={c.id} style={{ borderTop: i === 0 ? undefined : "1px solid rgba(17,17,17,0.06)" }}>
                            <div className="flex items-center gap-4 p-4">
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-sans font-bold text-sm"
                                    style={{ backgroundColor: "#EEF1EA", color: "#111111" }}
                                >
                                    {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-sans font-semibold truncate" style={{ color: "#111111" }}>{c.name}</p>
                                    <p className="font-sans text-xs" style={{ color: "#8A8678" }}>{c.relationship} · {c.phone}</p>
                                </div>
                                <Toggle
                                    label={`Share location with ${c.name}`}
                                    checked={c.canSeeLocation}
                                    onChange={(next) => {
                                        updateContact(c.id, { canSeeLocation: next });
                                        toast(next ? `${c.name} can now see your live trips` : `${c.name} no longer sees your location`, "success");
                                    }}
                                />
                            </div>
                            <div className="flex gap-2 px-4 pb-4">
                                <button
                                    onClick={() => openEdit(c)}
                                    className="flex-1 py-2 rounded-[10px] font-sans text-xs font-bold"
                                    style={{ backgroundColor: "#EEF1EA", color: "#111111" }}
                                >
                                    Edit
                                </button>
                                <a
                                    href={`tel:${c.phone.replace(/\s/g, "")}`}
                                    className="flex-1 py-2 rounded-[10px] font-sans text-xs font-bold text-center"
                                    style={{ backgroundColor: "#CDDFF6", color: "#111111" }}
                                >
                                    Call
                                </a>
                                <button
                                    onClick={() => { removeContact(c.id); toast(`${c.name} removed`, "info"); }}
                                    className="flex-1 py-2 rounded-[10px] font-sans text-xs font-bold"
                                    style={{ backgroundColor: "rgba(220,38,38,0.08)", color: "#DC2626" }}
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </SettingsGroup>
            )}

            {/* ── Add / edit form ── */}
            {editing && (
                <div
                    className="rounded-[16px] p-5 mt-2"
                    style={{ backgroundColor: "#FFFFFF", border: "1.5px solid rgba(17,17,17,0.12)", boxShadow: "0 8px 28px rgba(17,17,17,0.10)" }}
                >
                    <h3 className="font-sans font-black text-lg mb-4" style={{ color: "#111111", letterSpacing: "-0.02em" }}>
                        {editing === "new" ? "Add a trusted contact" : "Edit contact"}
                    </h3>

                    <Field label="Full Name" value={name} onChange={setName} placeholder="e.g. Nomsa Skura" error={errors.name} />
                    <Field label="Mobile Number" value={phone} onChange={setPhone} type="tel" placeholder="082 123 4567" error={errors.phone} />

                    <div className="mb-4">
                        <label className="q-label">Relationship</label>
                        <div className="flex flex-wrap gap-2">
                            {RELATIONSHIPS.map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => setRelationship(r)}
                                    className="px-4 py-2 rounded-full font-sans text-xs font-bold transition-all"
                                    style={relationship === r
                                        ? { backgroundColor: "#111111", color: "#FFFFFF" }
                                        : { backgroundColor: "#EEF1EA", color: "#5C5A56" }}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-between py-3 mb-4" style={{ borderTop: "1px solid rgba(17,17,17,0.07)" }}>
                        <div className="pr-4">
                            <p className="font-sans font-semibold text-sm" style={{ color: "#111111" }}>Can see my live location</p>
                            <p className="font-sans text-xs" style={{ color: "#8A8678" }}>Also receives SOS alerts</p>
                        </div>
                        <Toggle label="Can see my live location" checked={canSeeLocation} onChange={setCanSeeLocation} />
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => setEditing(null)} className="q-btn-outline flex-1 justify-center">Cancel</button>
                        <button onClick={save} className="q-btn-dark flex-1 justify-center">
                            {editing === "new" ? "Add Contact" : "Save Changes"}
                        </button>
                    </div>
                </div>
            )}
        </SettingsShell>
    );
}

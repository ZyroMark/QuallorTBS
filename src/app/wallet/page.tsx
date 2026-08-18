"use client";

import React, { useState } from "react";
import { useSettings } from "@/app/context/SettingsContext";
import { useToast } from "@/components/Toast";
import AuthGuard from "@/components/AuthGuard";
import { SettingsShell, SettingsGroup, SettingsRow, Field } from "@/components/SettingsUI";

const TOP_UP_AMOUNTS = [50, 100, 200, 500];

function WalletContent() {
    const {
        wallet,
        topUp,
        addPaymentMethod,
        removePaymentMethod,
        setDefaultPaymentMethod,
    } = useSettings();
    const { toast } = useToast();

    const [amount, setAmount] = useState(100);
    const [customAmount, setCustomAmount] = useState("");
    const [addingCard, setAddingCard] = useState(false);
    const [cardName, setCardName] = useState("");
    const [cardLast4, setCardLast4] = useState("");
    const [cardError, setCardError] = useState("");

    const defaultMethod = wallet.methods.find((m) => m.isDefault) ?? wallet.methods[0];
    const effectiveAmount = customAmount ? Number(customAmount) : amount;

    function handleTopUp() {
        if (!effectiveAmount || effectiveAmount <= 0) {
            toast("Enter an amount to top up", "error");
            return;
        }
        topUp(effectiveAmount, defaultMethod?.label ?? "Card");
        setCustomAmount("");
        toast(`R ${effectiveAmount.toFixed(2)} added to your credits`, "success");
    }

    function handleAddCard() {
        setCardError("");
        if (!cardName.trim()) {
            setCardError("Give the card a name, for example Standard Bank Debit.");
            return;
        }
        if (!/^\d{4}$/.test(cardLast4)) {
            setCardError("Enter only the last four digits of the card.");
            return;
        }
        addPaymentMethod({
            kind: "card",
            label: cardName.trim(),
            last4: cardLast4,
            isDefault: wallet.methods.length === 0,
        });
        setAddingCard(false);
        setCardName("");
        setCardLast4("");
        toast("Payment method added", "success");
    }

    return (
        <SettingsShell title="Payments" subtitle="Credits, cards and history">
            {/* ── Balance ── */}
            <div
                className="rounded-[18px] p-6 mb-7"
                style={{ backgroundColor: "#CDDFF6" }}
            >
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(17,17,17,0.55)" }}>
                    Quallor Credits
                </p>
                <p className="font-sans font-black text-4xl" style={{ color: "#111111", letterSpacing: "-0.03em" }}>
                    R {wallet.balance.toFixed(2)}
                </p>
                <p className="font-sans text-sm mt-2" style={{ color: "rgba(17,17,17,0.60)" }}>
                    Credits pay for fares in the app and cover refunds when a trip is cancelled.
                </p>
            </div>

            {/* ── Top up ── */}
            <SettingsGroup
                label="Top Up"
                footnote={defaultMethod ? `Charged to ${defaultMethod.label}${defaultMethod.last4 ? ` ending ${defaultMethod.last4}` : ""}.` : "Add a payment method first."}
            >
                <div className="p-4">
                    <div className="grid grid-cols-4 gap-2 mb-4">
                        {TOP_UP_AMOUNTS.map((a) => (
                            <button
                                key={a}
                                onClick={() => { setAmount(a); setCustomAmount(""); }}
                                className="py-3 rounded-[12px] font-sans font-bold text-sm transition-all"
                                style={!customAmount && amount === a
                                    ? { backgroundColor: "#111111", color: "#FFFFFF" }
                                    : { backgroundColor: "#EEF1EA", color: "#5C5A56" }}
                            >
                                R{a}
                            </button>
                        ))}
                    </div>

                    <Field
                        label="Or another amount"
                        value={customAmount}
                        onChange={setCustomAmount}
                        type="number"
                        placeholder="e.g. 75"
                        min={1}
                    />

                    <button onClick={handleTopUp} className="q-btn-dark w-full justify-center">
                        <span className="material-symbols-outlined text-lg">add_card</span>
                        Top up R {(effectiveAmount || 0).toFixed(2)}
                    </button>
                </div>
            </SettingsGroup>

            {/* ── Payment methods ── */}
            <SettingsGroup label="Payment Methods">
                {wallet.methods.map((m, i) => (
                    <div key={m.id} style={{ borderTop: i === 0 ? undefined : "1px solid rgba(17,17,17,0.06)" }}>
                        <div className="flex items-center gap-4 p-4">
                            <div
                                className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: "#EEF1EA", color: "#111111" }}
                            >
                                <span className="material-symbols-outlined">{m.kind === "cash" ? "payments" : "credit_card"}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-sans font-semibold truncate" style={{ color: "#111111" }}>{m.label}</p>
                                <p className="font-sans text-xs" style={{ color: "#8A8678" }}>
                                    {m.last4 ? `Ending ${m.last4}` : "Paid to the gaatjie on board"}
                                </p>
                            </div>
                            {m.isDefault ? (
                                <span
                                    className="font-mono text-[10px] font-bold uppercase px-2.5 py-1 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: "#111111", color: "#FFFFFF" }}
                                >
                                    Default
                                </span>
                            ) : (
                                <button
                                    onClick={() => { setDefaultPaymentMethod(m.id); toast(`${m.label} is now your default`, "success"); }}
                                    className="font-sans text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: "#EEF1EA", color: "#111111" }}
                                >
                                    Make default
                                </button>
                            )}
                            {m.kind === "card" && (
                                <button
                                    onClick={() => { removePaymentMethod(m.id); toast("Payment method removed", "info"); }}
                                    aria-label={`Remove ${m.label}`}
                                    className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0"
                                    style={{ color: "#DC2626" }}
                                >
                                    <span className="material-symbols-outlined text-lg">delete</span>
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {addingCard ? (
                    <div className="p-4" style={{ borderTop: "1px solid rgba(17,17,17,0.06)" }}>
                        {cardError && (
                            <p className="font-sans text-xs mb-3" style={{ color: "#DC2626" }}>{cardError}</p>
                        )}
                        <Field label="Card Name" value={cardName} onChange={setCardName} placeholder="e.g. Capitec Debit" />
                        <Field
                            label="Last 4 Digits"
                            value={cardLast4}
                            onChange={(v) => setCardLast4(v.replace(/\D/g, "").slice(0, 4))}
                            placeholder="1234"
                            inputMode="numeric"
                            hint="Quallor never stores a full card number. The full details are captured by the payment provider at checkout."
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setAddingCard(false)} className="q-btn-outline flex-1 justify-center">Cancel</button>
                            <button onClick={handleAddCard} className="q-btn-dark flex-1 justify-center">Add Card</button>
                        </div>
                    </div>
                ) : (
                    <SettingsRow icon="add" label="Add a payment method" onClick={() => setAddingCard(true)} />
                )}
            </SettingsGroup>

            {/* ── History ── */}
            <SettingsGroup label="Recent Activity">
                {wallet.transactions.length === 0 ? (
                    <SettingsRow first icon="receipt_long" label="No activity yet" sub="Top ups and fares appear here" />
                ) : (
                    wallet.transactions.map((t, i) => (
                        <div
                            key={t.id}
                            className="flex items-center gap-4 p-4"
                            style={{ borderTop: i === 0 ? undefined : "1px solid rgba(17,17,17,0.06)" }}
                        >
                            <div
                                className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
                                style={{
                                    backgroundColor: t.amount > 0 ? "rgba(22,163,74,0.10)" : "#EEF1EA",
                                    color: t.amount > 0 ? "#16A34A" : "#111111",
                                }}
                            >
                                <span className="material-symbols-outlined">{t.amount > 0 ? "add" : "directions_bus"}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-sans font-semibold truncate" style={{ color: "#111111" }}>{t.description}</p>
                                <p className="font-sans text-xs" style={{ color: "#8A8678" }}>
                                    {new Date(t.at).toLocaleString("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · {t.method}
                                </p>
                            </div>
                            <p
                                className="font-sans font-black flex-shrink-0"
                                style={{ color: t.amount > 0 ? "#16A34A" : "#111111" }}
                            >
                                {t.amount > 0 ? "+" : "-"} R {Math.abs(t.amount).toFixed(2)}
                            </p>
                        </div>
                    ))
                )}
            </SettingsGroup>
        </SettingsShell>
    );
}

export default function WalletPage() {
    return (
        <AuthGuard>
            <WalletContent />
        </AuthGuard>
    );
}

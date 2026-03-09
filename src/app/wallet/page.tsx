"use client";

import React from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";

export default function WalletPage() {
    const router = useRouter();

    const savedMethods = [
        { type: "Visa", last4: "1234", expiry: "12/26", icon: "credit_card", isDefault: false },
        { type: "Digital Wallet", last4: "", expiry: "", icon: "account_balance_wallet", isDefault: true },
        { type: "Mastercard", last4: "8892", expiry: "05/25", icon: "credit_card", isDefault: false },
    ];

    const transactions = [
        { label: "Commute to Downtown", date: "Today, 08:45 AM", amount: "-R 12.50", positive: false, icon: "directions_car" },
        { label: "EV Charging Station #42", date: "Yesterday, 06:12 PM", amount: "-R 8.20", positive: false, icon: "electric_bolt" },
        { label: "Wallet Top-up", date: "Oct 24, 02:30 PM", amount: "+R 50.00", positive: true, icon: "payments" },
        { label: "City Parking — Zone A", date: "Oct 23, 11:15 AM", amount: "-R 4.00", positive: false, icon: "local_parking" },
    ];

    return (
        <AppLayout>
            <div className="q-container max-w-2xl py-8 pb-24">
                <h1 className="font-display text-3xl font-semibold text-q-stone-900 mb-8">Payments</h1>

                {/* Balance card */}
                <div className="q-card-raised bg-q-brown p-6 mb-8 text-white">
                    <p className="font-sans text-sm font-semibold opacity-80 mb-1">Available Balance</p>
                    <p className="font-display text-4xl font-bold">R 142.50</p>
                    <div className="flex gap-3 mt-6">
                        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[10px] bg-white/20 font-sans text-sm font-semibold hover:bg-white/30 transition-colors">
                            <span className="material-symbols-outlined text-sm">add</span>Top Up
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[10px] bg-white/20 font-sans text-sm font-semibold hover:bg-white/30 transition-colors">
                            <span className="material-symbols-outlined text-sm">send</span>Send
                        </button>
                    </div>
                </div>

                {/* Saved methods */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-display text-xl font-semibold text-q-stone-900">Payment Methods</h2>
                        <button className="font-sans text-sm font-semibold text-q-brown flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">add_circle</span>Add New
                        </button>
                    </div>
                    <div className="space-y-3">
                        {savedMethods.map((method, i) => (
                            <div key={i} className="q-card-interactive flex items-center gap-4 p-4">
                                <div className="w-12 h-10 rounded-[10px] bg-q-brown-100 flex items-center justify-center flex-shrink-0">
                                    <span className="material-symbols-outlined text-q-brown">{method.icon}</span>
                                </div>
                                <div className="flex-1">
                                    <p className="font-sans font-semibold text-q-stone-900">
                                        {method.type}{method.last4 ? ` ending in ${method.last4}` : ""}
                                    </p>
                                    {method.isDefault ? (
                                        <p className="font-sans text-xs font-bold text-q-brown uppercase tracking-tight">Default method</p>
                                    ) : (
                                        <p className="font-sans text-xs text-q-stone-500">Expires {method.expiry}</p>
                                    )}
                                </div>
                                <span className="material-symbols-outlined text-q-stone-400">chevron_right</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Transactions */}
                <div>
                    <h2 className="font-display text-xl font-semibold text-q-stone-900 mb-4">Transaction History</h2>
                    <div className="q-card divide-y divide-q-stone-100">
                        {transactions.map((t, i) => (
                            <div key={i} className="flex items-center gap-4 p-4">
                                <div className="w-10 h-10 rounded-full bg-q-brown-100 flex items-center justify-center flex-shrink-0">
                                    <span className="material-symbols-outlined text-q-brown">{t.icon}</span>
                                </div>
                                <div className="flex-1">
                                    <p className="font-sans text-sm font-semibold text-q-stone-900">{t.label}</p>
                                    <p className="font-sans text-xs text-q-stone-500">{t.date}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`font-sans text-sm font-bold ${t.positive ? "text-green-600" : "text-q-stone-900"}`}>{t.amount}</p>
                                    <p className="font-sans text-[10px] text-q-stone-500">Completed</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-4 py-3 font-sans text-sm font-semibold text-q-brown hover:bg-q-brown-50 rounded-[10px] transition-colors">
                        View Full Statement
                    </button>
                </div>
            </div>
        </AppLayout>
    );
}

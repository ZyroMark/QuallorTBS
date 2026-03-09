"use client";

import React from "react";

export default function PartnerDashboardPage() {
    const stats = [
        { label: "Trips Today", value: "42", trend: "+12%", up: true, icon: "route" },
        { label: "Active Taxis", value: "18", trend: "-2%", up: false, icon: "electric_car" },
        { label: "Total Revenue", value: "R 12,450", trend: "+5%", up: true, icon: "payments" },
    ];

    const alerts = [
        { title: "Vehicle Maintenance", time: "2m ago", desc: "Vehicle Y: Brake pad replacement due immediately.", icon: "warning", borderColor: "border-amber-400", iconColor: "text-amber-500" },
        { title: "Driver Offline", time: "15m ago", desc: "Driver X: Signal lost near Pretoria Central.", icon: "signal_disconnected", borderColor: "border-blue-400", iconColor: "text-blue-500" },
        { title: "Speeding Alert", time: "42m ago", desc: "Vehicle Z: Exceeded 120km/h on N1 North.", icon: "speed", borderColor: "border-red-400", iconColor: "text-red-500" },
        { title: "Shift Completed", time: "1h ago", desc: "Driver M has successfully signed off shift.", icon: "check_circle", borderColor: "border-green-400", iconColor: "text-green-500" },
    ];

    return (
        <main className="min-h-screen bg-q-bg-page flex flex-col pb-24">
            <header className="flex items-center bg-white sticky top-0 z-10 px-4 py-3 border-b border-q-stone-200 shadow-q-xs justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-q-brown-100 rounded-[10px] flex items-center justify-center">
                        <span className="material-symbols-outlined text-q-brown">local_taxi</span>
                    </div>
                    <h2 className="font-display text-lg font-semibold text-q-stone-900">Fleet Overview</h2>
                </div>
                <div className="flex items-center gap-3">
                    <button className="relative flex w-10 h-10 items-center justify-center rounded-[10px] hover:bg-q-stone-100 transition-colors">
                        <span className="material-symbols-outlined text-q-stone-500">notifications</span>
                        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-q-brown" />
                    </button>
                    <div className="w-9 h-9 rounded-full bg-q-brown-100 border-2 border-q-brown-200 flex items-center justify-center">
                        <span className="font-display text-sm font-bold text-q-brown">P</span>
                    </div>
                </div>
            </header>

            <div className="flex-1 p-4 space-y-6 max-w-7xl mx-auto w-full overflow-y-auto">
                {/* Stats */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {stats.map((stat, i) => (
                        <div key={i} className="q-card p-6 text-left">
                            <div className="flex justify-between items-start mb-3">
                                <p className="font-sans text-xs font-bold text-q-stone-500 uppercase tracking-wider">{stat.label}</p>
                                <span className="material-symbols-outlined text-q-brown">{stat.icon}</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <p className="font-display text-3xl font-semibold text-q-stone-900">{stat.value}</p>
                                <p className={`font-sans text-sm font-semibold flex items-center gap-0.5 ${stat.up ? "text-green-600" : "text-red-500"}`}>
                                    <span className="material-symbols-outlined text-sm">{stat.up ? "trending_up" : "trending_down"}</span>
                                    {stat.trend}
                                </p>
                            </div>
                        </div>
                    ))}
                </section>

                {/* Map + Alerts */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-display text-lg font-semibold text-q-stone-900">Live Fleet Distribution</h3>
                            <div className="flex gap-2">
                                <button className="font-sans px-3 py-1 text-xs rounded-full bg-q-brown text-white font-bold">Map</button>
                                <button className="font-sans px-3 py-1 text-xs rounded-full bg-q-stone-100 text-q-stone-600">Satellite</button>
                            </div>
                        </div>
                        <div
                            className="relative w-full aspect-video rounded-[18px] overflow-hidden border border-q-stone-200 shadow-q-md bg-cover bg-center"
                            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1000')" }}
                        >
                            <div className="absolute inset-0 bg-q-stone-900/30" />
                            <div className="absolute bottom-4 left-4">
                                <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full border border-q-stone-200 shadow-q-sm flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-q-brown animate-pulse" />
                                    <span className="font-sans text-xs font-semibold text-q-stone-900">12 Vehicles in Sandton</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-display text-lg font-semibold text-q-stone-900">Recent Alerts</h3>
                        <div className="flex flex-col gap-3">
                            {alerts.map((alert, i) => (
                                <div key={i} className={`q-card border-l-4 ${alert.borderColor} p-4 text-left`}>
                                    <div className="flex items-start gap-3">
                                        <span className={`material-symbols-outlined ${alert.iconColor} flex-shrink-0`}>{alert.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <p className="font-sans text-sm font-semibold text-q-stone-900">{alert.title}</p>
                                                <span className="font-sans text-[10px] text-q-stone-400 uppercase tracking-wider whitespace-nowrap">{alert.time}</span>
                                            </div>
                                            <p className="font-sans text-xs text-q-stone-500 mt-1 leading-relaxed">{alert.desc}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            <nav className="fixed bottom-0 left-0 right-0 z-10 flex border-t border-q-stone-200 bg-white px-4 pb-6 pt-2">
                <a className="flex flex-1 flex-col items-center justify-center gap-1 text-q-brown" href="#">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>grid_view</span>
                    <p className="font-sans text-[10px] font-bold uppercase tracking-widest">Dashboard</p>
                </a>
                <a className="flex flex-1 flex-col items-center justify-center gap-1 text-q-stone-400" href="#">
                    <span className="material-symbols-outlined text-2xl">local_taxi</span>
                    <p className="font-sans text-[10px] font-bold uppercase tracking-widest">Fleet</p>
                </a>
                <a className="flex flex-1 flex-col items-center justify-center gap-1 text-q-stone-400" href="#">
                    <span className="material-symbols-outlined text-2xl">monitoring</span>
                    <p className="font-sans text-[10px] font-bold uppercase tracking-widest">Analytics</p>
                </a>
                <a className="flex flex-1 flex-col items-center justify-center gap-1 text-q-stone-400" href="/profile">
                    <span className="material-symbols-outlined text-2xl">settings</span>
                    <p className="font-sans text-[10px] font-bold uppercase tracking-widest">Settings</p>
                </a>
            </nav>
        </main>
    );
}

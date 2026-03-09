"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const passengerNav = [
    { icon: "home",                   label: "Home",    href: "/dashboard" },
    { icon: "directions_bus",         label: "Commute", href: "/commute" },
    { icon: "history",                label: "Trips",   href: "/trips" },
    { icon: "account_balance_wallet", label: "Wallet",  href: "/wallet" },
    { icon: "person",                 label: "Account", href: "/profile" },
];

// Driver and operator have their own nav built in
const HIDE_ON_PATHS = ["/auth", "/", "/driver", "/commute/tracking", "/operator"];

export function BottomNav() {
    const pathname = usePathname();

    const shouldHide = HIDE_ON_PATHS.some((p) =>
        pathname === p || pathname.startsWith(p + "/") || pathname.startsWith("/auth")
    );
    if (shouldHide) return null;
    if (pathname === "/") return null;

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-20 lg:hidden border-t border-q-stone-200 bg-white/95 backdrop-blur-md px-2 pb-6 pt-2 shadow-[0_-4px_16px_rgba(28,25,23,0.06)]">
            <div className="flex justify-between items-center max-w-md mx-auto">
                {passengerNav.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center gap-1 flex-1 py-1 rounded-[10px] transition-colors ${
                                isActive ? "text-q-brown" : "text-q-stone-400 hover:text-q-stone-600"
                            }`}
                        >
                            <span
                                className="material-symbols-outlined text-2xl"
                                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                            >
                                {item.icon}
                            </span>
                            <p className="text-[10px] font-sans font-semibold uppercase tracking-tight">{item.label}</p>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

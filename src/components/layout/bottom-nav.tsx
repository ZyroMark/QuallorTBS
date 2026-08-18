"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const passengerNav = [
    { icon: "home",           label: "Home",    href: "/dashboard" },
    { icon: "directions_bus", label: "Commute", href: "/commute" },
    { icon: "luggage",        label: "Hiking",  href: "/hiking" },
    { icon: "history",        label: "Trips",   href: "/trips" },
    { icon: "person",         label: "Account", href: "/profile" },
];

const HIDE_ON_PATHS = [
    "/auth", "/", "/driver", "/commute/tracking",
    // Back-office areas keep the passenger tab bar out of the way.
    "/operator", "/fleet",
    "/terms", "/privacy",
    "/how-it-works", "/why-quallor", "/network",
    // Seat selection is a checkout step: its own confirm bar owns the bottom
    // of the screen, and two stacked bars leave the confirm button untappable.
    "/commute/book", "/hiking/book",
];

export function BottomNav() {
    const pathname = usePathname();

    const shouldHide =
        pathname === "/" ||
        HIDE_ON_PATHS.some(
            (p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith("/auth")
        );

    // Pages cannot see this component, so tell them the bar is there and let
    // globals.css reserve the space. Without it the bar sits on top of whatever
    // ends the page, and those controls cannot be tapped.
    useEffect(() => {
        document.body.classList.toggle("q-has-tabbar", !shouldHide);
        return () => document.body.classList.remove("q-has-tabbar");
    }, [shouldHide]);

    if (shouldHide) return null;

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-20 lg:hidden px-3 pb-6 pt-2 backdrop-blur-md"
            style={{
                backgroundColor: "rgba(255,255,255,0.95)",
                borderTop: "1px solid rgba(17,17,17,0.08)",
                boxShadow: "0 -4px 20px rgba(17,17,17,0.07)",
            }}
        >
            <div className="flex justify-between items-center max-w-md mx-auto">
                {passengerNav.map((item) => {
                    const isActive =
                        pathname === item.href ||
                        (item.href !== "/dashboard" && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex flex-col items-center gap-1 flex-1 py-1 rounded-[10px] transition-colors"
                            style={{ color: isActive ? "#111111" : "#AEA89C" }}
                        >
                            <span
                                className="material-symbols-outlined text-2xl"
                                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                            >
                                {item.icon}
                            </span>
                            <p
                                className="text-[10px] font-sans font-bold uppercase tracking-tight"
                                style={{ color: isActive ? "#111111" : "#AEA89C" }}
                            >
                                {item.label}
                            </p>
                            {isActive && (
                                <span
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{ backgroundColor: "#CDDFF6" }}
                                />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

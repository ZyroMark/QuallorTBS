"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";

const PASSENGER_LINKS = [
    { icon: "home",            label: "Home",      href: "/dashboard" },
    { icon: "directions_bus",  label: "Commute",   href: "/commute" },
    { icon: "luggage",         label: "Hiking",    href: "/hiking" },
    { icon: "history",         label: "My Trips",  href: "/trips" },
    { icon: "person",          label: "Profile",   href: "/profile" },
    { icon: "shield",          label: "Safety",    href: "/safety" },
];

const DRIVER_LINKS = [
    { icon: "explore",         label: "Dashboard",      href: "/driver/dashboard" },
    { icon: "groups",          label: "Gaatjie Mode",   href: "/driver/gaatjie" },
    { icon: "qr_code_scanner", label: "Scan Passenger", href: "/driver/scan" },
    { icon: "person_add",      label: "Walk-Up",        href: "/driver/walk-up" },
    { icon: "person",          label: "Account",        href: "/profile" },
];

const OPERATOR_LINKS = [
    { icon: "grid_view",       label: "Dashboard",  href: "/operator/dashboard" },
    { icon: "local_taxi",      label: "Fleet",      href: "/operator/dashboard" },
    { icon: "monitoring",      label: "Analytics",  href: "/operator/dashboard" },
    { icon: "manage_accounts", label: "Settings",   href: "/operator/dashboard" },
];

export default function Sidebar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    const links = user?.role === "driver"
        ? DRIVER_LINKS
        : user?.role === "operator"
            ? OPERATOR_LINKS
            : PASSENGER_LINKS;

    const initials = user?.name
        ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
        : "Q";

    function handleLogout() {
        logout();
        router.push("/");
    }

    return (
        <div className="flex flex-col h-full py-7 px-4">

            {/* Logo */}
            <Link href="/" className="flex items-center px-2 mb-9">
                <span
                    className="q-wordmark text-2xl"
                    style={{ color: "#111111" }}
                >
                    Quallor
                </span>
            </Link>

            {/* User profile card */}
            <div
                className="flex items-center gap-3 px-3 py-3 mb-6 rounded-[12px]"
                style={{
                    backgroundColor: "#EEF1EA",
                    border: "1px solid rgba(17,17,17,0.07)",
                }}
            >
                <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "#111111" }}
                >
                    <span className="font-sans font-bold text-[#CDDFF6] text-sm">{initials}</span>
                </div>
                <div className="min-w-0">
                    <p className="font-sans font-bold text-sm truncate" style={{ color: "#111111", letterSpacing: "-0.01em" }}>
                        {user?.name || "User"}
                    </p>
                    <p className="font-sans text-xs capitalize" style={{ color: "#8A8678" }}>
                        {user?.role || "passenger"}
                    </p>
                </div>
            </div>

            {/* Nav links */}
            <nav className="flex-1 space-y-0.5">
                {links.map((link) => {
                    const isActive =
                        pathname === link.href ||
                        (link.href !== "/dashboard" &&
                            link.href !== "/driver/dashboard" &&
                            link.href !== "/operator/dashboard" &&
                            pathname.startsWith(link.href));

                    return (
                        <Link
                            key={link.label}
                            href={link.href}
                            className="flex items-center gap-3 px-4 py-2.5 rounded-[10px] font-sans text-sm font-semibold transition-all duration-150"
                            style={
                                isActive
                                    ? {
                                          background: "#111111",
                                          color: "#FFFFFF",
                                      }
                                    : {
                                          color: "#5C5A56",
                                      }
                            }
                            onMouseEnter={(e) => {
                                if (!isActive) {
                                    (e.currentTarget as HTMLElement).style.background = "rgba(17,17,17,0.06)";
                                    (e.currentTarget as HTMLElement).style.color = "#111111";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) {
                                    (e.currentTarget as HTMLElement).style.background = "";
                                    (e.currentTarget as HTMLElement).style.color = "#5C5A56";
                                }
                            }}
                        >
                            <span
                                className="material-symbols-outlined text-xl"
                                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                            >
                                {link.icon}
                            </span>
                            <span>{link.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="pt-4" style={{ borderTop: "1px solid rgba(17,17,17,0.07)" }}>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2.5 rounded-[10px] font-sans text-sm font-semibold transition-all duration-150"
                    style={{ color: "#8A8678" }}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(220,38,38,0.07)";
                        (e.currentTarget as HTMLElement).style.color = "#DC2626";
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "";
                        (e.currentTarget as HTMLElement).style.color = "#8A8678";
                    }}
                >
                    <span className="material-symbols-outlined text-xl">logout</span>
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
    );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";

const PASSENGER_LINKS = [
    { icon: "home",                   label: "Home",      href: "/dashboard" },
    { icon: "directions_bus",         label: "Commute",   href: "/commute" },
    { icon: "luggage",                label: "Hiking",    href: "/hiking" },
    { icon: "history",                label: "My Trips",  href: "/trips" },
    { icon: "account_balance_wallet", label: "Wallet",    href: "/wallet" },
    { icon: "person",                 label: "Profile",   href: "/profile" },
    { icon: "shield",                 label: "Safety",    href: "/safety" },
];

const DRIVER_LINKS = [
    { icon: "explore",                label: "Dashboard",     href: "/driver/dashboard" },
    { icon: "qr_code_scanner",        label: "Scan Passenger", href: "/driver/scan" },
    { icon: "person_add",             label: "Walk-Up",        href: "/driver/walk-up" },
    { icon: "account_balance_wallet", label: "Earnings",       href: "/driver/earnings" },
    { icon: "person",                 label: "Account",        href: "/profile" },
];

const OPERATOR_LINKS = [
    { icon: "grid_view",              label: "Dashboard",  href: "/operator/dashboard" },
    { icon: "local_taxi",             label: "Fleet",      href: "/operator/dashboard" },
    { icon: "monitoring",             label: "Analytics",  href: "/operator/dashboard" },
    { icon: "manage_accounts",        label: "Settings",   href: "/operator/dashboard" },
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
        <div className="flex flex-col h-full py-6 px-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 px-2 mb-8">
                <div className="w-9 h-9 rounded-[10px] bg-q-brown flex items-center justify-center shadow-q-sm flex-shrink-0">
                    <span className="font-display font-bold text-white text-lg leading-none">Q</span>
                </div>
                <span className="font-display font-semibold text-q-stone-900 text-lg tracking-tight">
                    Quallor
                </span>
            </Link>

            {/* User profile */}
            <div className="flex items-center gap-3 px-2 mb-6 pb-6 border-b border-q-stone-200">
                <div className="w-10 h-10 rounded-full bg-q-brown flex items-center justify-center flex-shrink-0">
                    <span className="font-sans font-bold text-white text-sm">{initials}</span>
                </div>
                <div className="min-w-0">
                    <p className="font-sans font-semibold text-q-stone-900 text-sm truncate">{user?.name || "User"}</p>
                    <p className="font-sans text-xs text-q-stone-400 capitalize">{user?.role || "passenger"}</p>
                </div>
            </div>

            {/* Nav links */}
            <nav className="flex-1 space-y-1">
                {links.map((link) => {
                    const isActive = pathname === link.href || (link.href !== "/dashboard" && link.href !== "/driver/dashboard" && link.href !== "/operator/dashboard" && pathname.startsWith(link.href));
                    return (
                        <Link
                            key={link.label}
                            href={link.href}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-[10px] font-sans text-sm font-medium transition-all duration-150 ${
                                isActive
                                    ? "bg-q-brown text-white shadow-q-sm"
                                    : "text-q-stone-600 hover:bg-q-stone-100 hover:text-q-stone-900"
                            }`}
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
            <div className="pt-4 border-t border-q-stone-200">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2.5 rounded-[10px] font-sans text-sm font-medium text-q-stone-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150"
                >
                    <span className="material-symbols-outlined text-xl">logout</span>
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
    );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Wallet is a future feature - PayFast payment gateway integration planned.
// Redirect visitors back to dashboard for now.
export default function WalletPage() {
    const router = useRouter();
    useEffect(() => { router.replace("/dashboard"); }, [router]);
    return null;
}

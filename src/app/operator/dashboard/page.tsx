"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// The operator console now lives at /operator. This path is kept so existing
// links and bookmarks keep working.
export default function OperatorDashboardRedirect() {
    const router = useRouter();
    useEffect(() => { router.replace("/operator"); }, [router]);
    return null;
}

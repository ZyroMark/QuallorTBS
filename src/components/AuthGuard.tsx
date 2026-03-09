"use client";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthGuard({ children, requiredRole }: {
    children: React.ReactNode;
    requiredRole?: "passenger" | "driver" | "operator";
}) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;
        if (!user) { router.replace("/auth/login"); return; }
        if (requiredRole && user.role !== requiredRole) {
            if (user.role === "driver") router.replace("/driver/dashboard");
            else if (user.role === "operator") router.replace("/operator/dashboard");
            else router.replace("/dashboard");
        }
    }, [user, isLoading, requiredRole, router]);

    if (isLoading || !user) {
        return (
            <div className="min-h-screen bg-q-bg-page flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-q-brown border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }
    return <>{children}</>;
}

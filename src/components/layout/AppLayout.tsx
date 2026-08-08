"use client";

import Sidebar from "./Sidebar";

interface AppLayoutProps {
    children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    return (
        <div className="flex min-h-screen" style={{ backgroundColor: "#FFFCF9" }}>
            {/* Sidebar - fixed, visible on desktop */}
            <aside
                className="hidden lg:flex w-[260px] flex-shrink-0 flex-col fixed top-0 bottom-0 left-0 overflow-y-auto z-30"
                style={{
                    backgroundColor: "#FFFFFF",
                    borderRight: "1px solid rgba(17,17,17,0.07)",
                    boxShadow: "1px 0 12px rgba(17,17,17,0.05)",
                }}
            >
                <Sidebar />
            </aside>

            {/* Main content - offset by sidebar on desktop */}
            <main className="flex-1 lg:ml-[260px] min-h-screen" style={{ backgroundColor: "#FFFCF9" }}>
                {children}
            </main>
        </div>
    );
}

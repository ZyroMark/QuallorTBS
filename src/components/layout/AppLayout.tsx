"use client";

import Sidebar from "./Sidebar";

interface AppLayoutProps {
    children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    return (
        <div className="flex min-h-screen bg-q-bg-page">
            {/* Sidebar — fixed, visible on desktop */}
            <aside className="hidden lg:flex w-[260px] flex-shrink-0 border-r border-q-stone-200 bg-white flex-col fixed top-0 bottom-0 left-0 overflow-y-auto z-30">
                <Sidebar />
            </aside>

            {/* Main content — offset by sidebar on desktop */}
            <main className="flex-1 lg:ml-[260px] min-h-screen">
                {children}
            </main>
        </div>
    );
}

import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { BottomNav } from "@/components/layout/bottom-nav";
import OfflineBanner from "@/components/OfflineBanner";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import PageLoader from "@/components/Loader";

export const metadata: Metadata = {
  title: "Quallor | Eastern Cape Taxi Booking",
  description: "Book a confirmed seat on any taxi route in the Eastern Cape. Digital tickets, live tracking, offline support.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FFFCF9" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Quallor" />
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Solaria-inspired type system: Fraunces (serif display) · Schibsted Grotesk (UI/body) · Azeret Mono (labels/buttons) */}
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=Schibsted+Grotesk:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400&family=Azeret+Mono:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
        {/* DM Sans kept as a graceful fallback for any unmigrated styles */}
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <PageLoader />
        <ServiceWorkerRegistrar />
        <AuthProvider>
          <OfflineBanner />
          {children}
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}

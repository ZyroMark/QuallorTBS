"use client";

import { AuthProvider as AuthContextProvider } from "@/app/context/AuthContext";
import { BookingProvider } from "@/app/context/BookingContext";
import { SettingsProvider } from "@/app/context/SettingsContext";
import { FleetProvider } from "@/app/context/FleetContext";
import { ToastProvider } from "@/components/Toast";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthContextProvider>
        <SettingsProvider>
          <BookingProvider>
            <FleetProvider>
              {children}
            </FleetProvider>
          </BookingProvider>
        </SettingsProvider>
      </AuthContextProvider>
    </ToastProvider>
  );
}

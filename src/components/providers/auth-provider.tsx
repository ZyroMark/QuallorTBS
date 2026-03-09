"use client";

import { AuthProvider as AuthContextProvider } from "@/app/context/AuthContext";
import { BookingProvider } from "@/app/context/BookingContext";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthContextProvider>
      <BookingProvider>
        {children}
      </BookingProvider>
    </AuthContextProvider>
  );
}

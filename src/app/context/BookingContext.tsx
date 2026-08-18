"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

export type BookingStatus = "confirmed" | "in-transit" | "completed" | "cancelled" | "pending-sync";

export interface BookingDetails {
  bookingId: string;
  tripType: "commute" | "hiking";
  from: string;
  to: string;
  taxiId: string;
  taxiName: string;
  departureTime: string;
  seatNumber: string;
  fare: number;
  passengerName: string;
  passengerId: string;
  date: string;
  status: BookingStatus;
  qrData: string;
  paymentMethod?: "cash" | "card" | "app";
  bookedByDriver?: boolean;
  /** Groups the legs of one journey, so a two-taxi trip reads as a single trip. */
  journeyId?: string;
  legIndex?: number;
  legCount?: number;
  /** Set by the gaatjie or the QR scanner when the passenger actually boards. */
  boardedAt?: string;
}

export interface SelectedTaxi {
  id: string;
  name: string;
  departureTime: string;
  fare: number;
}

export interface RouteSelection {
  from: string;
  to: string;
  tripType: "commute" | "hiking";
  /** Set when this selection is the second taxi of a connecting journey. */
  journeyId?: string;
  legIndex?: number;
}

interface BookingContextType {
  selectedRoute: RouteSelection | null;
  setSelectedRoute: (r: RouteSelection) => void;
  selectedTaxi: SelectedTaxi | null;
  setSelectedTaxi: (t: SelectedTaxi) => void;
  currentBooking: BookingDetails | null;
  confirmBooking: (details: Omit<BookingDetails, "bookingId" | "qrData">) => BookingDetails;
  addBooking: (booking: BookingDetails) => void;
  myBookings: BookingDetails[];
  clearCurrentBooking: () => void;
  cancelBooking: (bookingId: string) => void;
  setBoarded: (bookingId: string, boarded: boolean) => void;
  /** Every leg of the journey a booking belongs to, in travel order. */
  journeyLegs: (booking: BookingDetails) => BookingDetails[];
  setCurrentBooking: (booking: BookingDetails) => void;
}

const BookingContext = createContext<BookingContextType | null>(null);

function generateBookingId(): string {
  const a = Math.random().toString(36).slice(2, 6).toUpperCase();
  const b = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `QLR-${a}-${b}`;
}

export function generateJourneyId(): string {
  return `JRN-${Date.now().toString(36).toUpperCase()}`;
}

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [selectedRoute, setSelectedRoute] = useState<RouteSelection | null>(null);
  const [selectedTaxi, setSelectedTaxi] = useState<SelectedTaxi | null>(null);
  const [currentBooking, setCurrentBooking] = useState<BookingDetails | null>(null);
  const [myBookings, setMyBookings] = useState<BookingDetails[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("quallor_bookings");
    if (stored) setMyBookings(JSON.parse(stored));
    const current = localStorage.getItem("quallor_current_booking");
    if (current) setCurrentBooking(JSON.parse(current));
  }, []);

  function persist(next: BookingDetails[]) {
    setMyBookings(next);
    localStorage.setItem("quallor_bookings", JSON.stringify(next));
  }

  function confirmBooking(details: Omit<BookingDetails, "bookingId" | "qrData">): BookingDetails {
    const bookingId = generateBookingId();
    const booking: BookingDetails = {
      ...details,
      bookingId,
      qrData: JSON.stringify({ ...details, bookingId, status: "valid" }),
    };
    setCurrentBooking(booking);
    localStorage.setItem("quallor_current_booking", JSON.stringify(booking));
    persist([booking, ...myBookings]);
    return booking;
  }

  function addBooking(booking: BookingDetails) {
    setCurrentBooking(booking);
    localStorage.setItem("quallor_current_booking", JSON.stringify(booking));
    persist([booking, ...myBookings.filter((b) => b.bookingId !== booking.bookingId)]);
  }

  function clearCurrentBooking() {
    setCurrentBooking(null);
    localStorage.removeItem("quallor_current_booking");
  }

  function cancelBooking(bookingId: string) {
    const next = myBookings.map((b) =>
      b.bookingId === bookingId ? { ...b, status: "cancelled" as const } : b
    );
    persist(next);
    if (currentBooking?.bookingId === bookingId) {
      const updated = next.find((b) => b.bookingId === bookingId) ?? null;
      setCurrentBooking(updated);
      if (updated) localStorage.setItem("quallor_current_booking", JSON.stringify(updated));
    }
  }

  function setBoarded(bookingId: string, boarded: boolean) {
    const next = myBookings.map((b) =>
      b.bookingId === bookingId
        ? { ...b, boardedAt: boarded ? new Date().toISOString() : undefined, status: boarded ? ("in-transit" as const) : b.status }
        : b
    );
    persist(next);
  }

  function journeyLegs(booking: BookingDetails): BookingDetails[] {
    if (!booking.journeyId) return [booking];
    return myBookings
      .filter((b) => b.journeyId === booking.journeyId)
      .sort((a, b) => (a.legIndex ?? 0) - (b.legIndex ?? 0));
  }

  function selectCurrentBooking(booking: BookingDetails) {
    setCurrentBooking(booking);
    localStorage.setItem("quallor_current_booking", JSON.stringify(booking));
  }

  return (
    <BookingContext.Provider value={{
      selectedRoute, setSelectedRoute,
      selectedTaxi, setSelectedTaxi,
      currentBooking, confirmBooking,
      addBooking, myBookings, clearCurrentBooking,
      cancelBooking, setBoarded, journeyLegs,
      setCurrentBooking: selectCurrentBooking,
    }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used within BookingProvider");
  return ctx;
}

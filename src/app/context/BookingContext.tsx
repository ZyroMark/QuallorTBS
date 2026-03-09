"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

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
  status: "confirmed" | "in-transit" | "completed" | "pending-sync";
  qrData: string;
  paymentMethod?: "cash" | "card" | "app";
  bookedByDriver?: boolean;
}

export interface SelectedTaxi {
  id: string;
  name: string;
  departureTime: string;
  fare: number;
}

interface BookingContextType {
  selectedRoute: { from: string; to: string; tripType: "commute" | "hiking" } | null;
  setSelectedRoute: (r: { from: string; to: string; tripType: "commute" | "hiking" }) => void;
  selectedTaxi: SelectedTaxi | null;
  setSelectedTaxi: (t: SelectedTaxi) => void;
  currentBooking: BookingDetails | null;
  confirmBooking: (details: Omit<BookingDetails, "bookingId" | "qrData">) => BookingDetails;
  addBooking: (booking: BookingDetails) => void;
  myBookings: BookingDetails[];
  clearCurrentBooking: () => void;
}

const BookingContext = createContext<BookingContextType | null>(null);

function generateBookingId(): string {
  const a = Math.random().toString(36).substr(2, 4).toUpperCase();
  const b = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `QLR-${a}-${b}`;
}

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [selectedRoute, setSelectedRoute] = useState<BookingContextType["selectedRoute"]>(null);
  const [selectedTaxi, setSelectedTaxi] = useState<SelectedTaxi | null>(null);
  const [currentBooking, setCurrentBooking] = useState<BookingDetails | null>(null);
  const [myBookings, setMyBookings] = useState<BookingDetails[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("quallor_bookings");
    if (stored) setMyBookings(JSON.parse(stored));
    const current = localStorage.getItem("quallor_current_booking");
    if (current) setCurrentBooking(JSON.parse(current));
  }, []);

  function confirmBooking(details: Omit<BookingDetails, "bookingId" | "qrData">): BookingDetails {
    const bookingId = generateBookingId();
    const booking: BookingDetails = {
      ...details,
      bookingId,
      qrData: JSON.stringify({ ...details, bookingId, status: "valid" }),
    };
    setCurrentBooking(booking);
    localStorage.setItem("quallor_current_booking", JSON.stringify(booking));
    const updated = [booking, ...myBookings];
    setMyBookings(updated);
    localStorage.setItem("quallor_bookings", JSON.stringify(updated));
    return booking;
  }

  function addBooking(booking: BookingDetails) {
    setCurrentBooking(booking);
    localStorage.setItem("quallor_current_booking", JSON.stringify(booking));
    const updated = [booking, ...myBookings.filter((b) => b.bookingId !== booking.bookingId)];
    setMyBookings(updated);
    localStorage.setItem("quallor_bookings", JSON.stringify(updated));
  }

  function clearCurrentBooking() {
    setCurrentBooking(null);
    localStorage.removeItem("quallor_current_booking");
  }

  return (
    <BookingContext.Provider value={{
      selectedRoute, setSelectedRoute,
      selectedTaxi, setSelectedTaxi,
      currentBooking, confirmBooking,
      addBooking, myBookings, clearCurrentBooking,
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

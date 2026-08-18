"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/context/AuthContext";

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
  /**
   * The vehicles row this booking is on, when the taxi is a real registered
   * vehicle rather than one of the mock listings. RLS uses this to decide which
   * driver may see the booking.
   */
  vehicleId?: string;
  passengerPhone?: string;
}

export interface SelectedTaxi {
  id: string;
  name: string;
  departureTime: string;
  fare: number;
  /** Present once the listing comes from the vehicles register. */
  vehicleId?: string;
}

export interface RouteSelection {
  from: string;
  to: string;
  tripType: "commute" | "hiking";
  /** Set when this selection is the second taxi of a connecting journey. */
  journeyId?: string;
  legIndex?: number;
}

export interface BookingResult {
  success: boolean;
  error?: string;
  booking?: BookingDetails;
}

interface BookingContextType {
  selectedRoute: RouteSelection | null;
  setSelectedRoute: (r: RouteSelection) => void;
  selectedTaxi: SelectedTaxi | null;
  setSelectedTaxi: (t: SelectedTaxi) => void;
  currentBooking: BookingDetails | null;
  confirmBooking: (
    details: Omit<BookingDetails, "bookingId" | "qrData">
  ) => Promise<BookingDetails | null>;
  addBooking: (booking: BookingDetails) => Promise<BookingResult>;
  myBookings: BookingDetails[];
  clearCurrentBooking: () => void;
  cancelBooking: (bookingId: string) => Promise<void>;
  setBoarded: (bookingId: string, boarded: boolean) => Promise<void>;
  /** Every leg of the journey a booking belongs to, in travel order. */
  journeyLegs: (booking: BookingDetails) => BookingDetails[];
  setCurrentBooking: (booking: BookingDetails) => void;
  /** Re-reads bookings from the server. */
  refresh: () => Promise<void>;
  isLoading: boolean;
  /** Set when the last write failed, so a page can surface it. */
  error: string | null;
}

const BookingContext = createContext<BookingContextType | null>(null);

/** Which booking the ticket and confirmation screens are showing, across reloads. */
const CURRENT_REF_KEY = "quallor_current_booking_ref";

function generateBookingRef(): string {
  const a = Math.random().toString(36).slice(2, 6).toUpperCase();
  const b = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `QLR-${a}-${b}`;
}

export function generateJourneyId(): string {
  return `JRN-${Date.now().toString(36).toUpperCase()}`;
}

/** A public.bookings row as PostgREST returns it. */
interface BookingRow {
  id: string;
  booking_ref: string;
  trip_type: "commute" | "hiking";
  from_location: string;
  to_location: string;
  taxi_id: string;
  taxi_name: string;
  vehicle_id: string | null;
  departure_time: string;
  seat_number: string;
  fare: number | string;
  passenger_id: string | null;
  passenger_name: string;
  passenger_phone: string | null;
  trip_date: string;
  status: BookingStatus;
  qr_data: string;
  payment_method: "cash" | "card" | "app" | null;
  booked_by_driver: boolean;
  journey_id: string | null;
  leg_index: number | null;
  leg_count: number | null;
  boarded_at: string | null;
}

function fromRow(row: BookingRow): BookingDetails {
  return {
    bookingId: row.booking_ref,
    tripType: row.trip_type,
    from: row.from_location,
    to: row.to_location,
    taxiId: row.taxi_id,
    taxiName: row.taxi_name,
    vehicleId: row.vehicle_id ?? undefined,
    departureTime: row.departure_time,
    seatNumber: row.seat_number,
    // numeric(10,2) comes back as a string.
    fare: Number(row.fare),
    passengerId: row.passenger_id ?? "",
    passengerName: row.passenger_name,
    passengerPhone: row.passenger_phone ?? undefined,
    date: row.trip_date,
    status: row.status,
    qrData: row.qr_data,
    paymentMethod: row.payment_method ?? undefined,
    bookedByDriver: row.booked_by_driver,
    journeyId: row.journey_id ?? undefined,
    legIndex: row.leg_index ?? undefined,
    legCount: row.leg_count ?? undefined,
    boardedAt: row.boarded_at ?? undefined,
  };
}

/** A uuid, or null. Mock listings use ids like "TX-402", which is not one. */
function asUuid(value: string | undefined): string | null {
  if (!value) return null;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuid.test(value) ? value : null;
}

/** trip_date is a Postgres date, so only the calendar day travels. */
function toDateOnly(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? new Date().toISOString().slice(0, 10)
    : d.toISOString().slice(0, 10);
}

function toRow(booking: BookingDetails, userId: string | null): Record<string, unknown> {
  return {
    booking_ref: booking.bookingId,
    trip_type: booking.tripType,
    from_location: booking.from,
    to_location: booking.to,
    taxi_id: booking.taxiId,
    taxi_name: booking.taxiName,
    vehicle_id: asUuid(booking.vehicleId),
    departure_time: booking.departureTime,
    seat_number: booking.seatNumber,
    fare: booking.fare,
    // A walk-up has no account, so the seat belongs to nobody in auth terms.
    passenger_id: booking.bookedByDriver ? asUuid(booking.passengerId) : userId,
    passenger_name: booking.passengerName,
    passenger_phone: booking.passengerPhone ?? null,
    trip_date: toDateOnly(booking.date),
    status: booking.status,
    qr_data: booking.qrData,
    payment_method: booking.paymentMethod ?? null,
    booked_by_driver: booking.bookedByDriver ?? false,
    created_by: userId,
    journey_id: booking.journeyId ?? null,
    leg_index: booking.legIndex ?? null,
    leg_count: booking.legCount ?? null,
    boarded_at: booking.boardedAt ?? null,
  };
}

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const { user, isLoading: authLoading } = useAuth();

  const [selectedRoute, setSelectedRoute] = useState<RouteSelection | null>(null);
  const [selectedTaxi, setSelectedTaxi] = useState<SelectedTaxi | null>(null);
  const [currentBooking, setCurrentBooking] = useState<BookingDetails | null>(null);
  const [myBookings, setMyBookings] = useState<BookingDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Reads whatever RLS lets this account see: a passenger gets their own
   * bookings, a driver additionally gets the manifest for the vehicle assigned
   * to them. No role branching is needed here, the policies do it.
   */
  const refresh = useCallback(async () => {
    if (!user) {
      setMyBookings([]);
      setCurrentBooking(null);
      setIsLoading(false);
      return;
    }

    const { data, error: err } = await supabase
      .from("bookings")
      .select("*")
      .order("trip_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (err) {
      setError(err.message);
      setIsLoading(false);
      return;
    }

    const bookings = (data as BookingRow[]).map(fromRow);
    setMyBookings(bookings);

    const ref = typeof window !== "undefined" ? localStorage.getItem(CURRENT_REF_KEY) : null;
    if (ref) setCurrentBooking(bookings.find((b) => b.bookingId === ref) ?? null);

    setError(null);
    setIsLoading(false);
  }, [supabase, user]);

  useEffect(() => {
    if (authLoading) return;
    // Deferred: refresh() resets state synchronously on its signed-out path,
    // and doing that inside the effect body cascades an extra render.
    queueMicrotask(() => void refresh());
  }, [authLoading, refresh]);

  function rememberCurrent(booking: BookingDetails | null) {
    setCurrentBooking(booking);
    if (typeof window === "undefined") return;
    if (booking) localStorage.setItem(CURRENT_REF_KEY, booking.bookingId);
    else localStorage.removeItem(CURRENT_REF_KEY);
  }

  async function confirmBooking(
    details: Omit<BookingDetails, "bookingId" | "qrData">
  ): Promise<BookingDetails | null> {
    if (!user) {
      setError("Sign in before booking a seat.");
      return null;
    }

    const bookingId = generateBookingRef();
    const draft: BookingDetails = {
      ...details,
      bookingId,
      qrData: JSON.stringify({ ...details, bookingId, status: "valid" }),
    };

    const { data, error: err } = await supabase
      .from("bookings")
      .insert(toRow(draft, user.id))
      .select()
      .single();

    if (err) {
      // The partial unique index on (taxi_id, trip_date, seat_number) is what
      // stops two passengers holding the same seat.
      setError(
        err.code === "23505"
          ? "That seat has just been taken. Choose another."
          : err.message
      );
      return null;
    }

    const saved = fromRow(data as BookingRow);
    rememberCurrent(saved);
    setMyBookings((prev) => [saved, ...prev]);
    setError(null);
    return saved;
  }

  /**
   * Takes a booking that was built elsewhere: a gaatjie's walk-up, or an
   * existing booking being re-stamped with a journey id when a second leg is
   * added. An upsert rather than an insert, because the second case is an edit
   * of a row that already exists and would otherwise trip booking_ref's unique
   * index.
   */
  async function addBooking(booking: BookingDetails): Promise<BookingResult> {
    if (!user) return { success: false, error: "Sign in before taking a booking." };

    const { data, error: err } = await supabase
      .from("bookings")
      .upsert(toRow(booking, user.id), { onConflict: "booking_ref" })
      .select()
      .single();

    if (err) {
      const message =
        err.code === "23505"
          ? "That seat is already taken on this run."
          : err.code === "42501"
            ? "This taxi is not assigned to you."
            : err.message;
      setError(message);
      return { success: false, error: message };
    }

    const saved = fromRow(data as BookingRow);
    rememberCurrent(saved);
    setMyBookings((prev) => [saved, ...prev.filter((b) => b.bookingId !== saved.bookingId)]);
    setError(null);
    return { success: true, booking: saved };
  }

  function clearCurrentBooking() {
    rememberCurrent(null);
  }

  async function cancelBooking(bookingId: string): Promise<void> {
    const { data, error: err } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("booking_ref", bookingId)
      .select()
      .single();

    if (err) {
      setError(err.message);
      return;
    }

    const updated = fromRow(data as BookingRow);
    setMyBookings((prev) => prev.map((b) => (b.bookingId === bookingId ? updated : b)));
    if (currentBooking?.bookingId === bookingId) setCurrentBooking(updated);
    setError(null);
  }

  async function setBoarded(bookingId: string, boarded: boolean): Promise<void> {
    const { data, error: err } = await supabase
      .from("bookings")
      .update({
        boarded_at: boarded ? new Date().toISOString() : null,
        ...(boarded ? { status: "in-transit" as const } : {}),
      })
      .eq("booking_ref", bookingId)
      .select()
      .single();

    if (err) {
      setError(
        err.code === "42501"
          ? "Only the driver of this taxi can board a passenger."
          : err.message
      );
      return;
    }

    const updated = fromRow(data as BookingRow);
    setMyBookings((prev) => prev.map((b) => (b.bookingId === bookingId ? updated : b)));
    setError(null);
  }

  function journeyLegs(booking: BookingDetails): BookingDetails[] {
    if (!booking.journeyId) return [booking];
    return myBookings
      .filter((b) => b.journeyId === booking.journeyId)
      .sort((a, b) => (a.legIndex ?? 0) - (b.legIndex ?? 0));
  }

  return (
    <BookingContext.Provider
      value={{
        selectedRoute,
        setSelectedRoute,
        selectedTaxi,
        setSelectedTaxi,
        currentBooking,
        confirmBooking,
        addBooking,
        myBookings,
        clearCurrentBooking,
        cancelBooking,
        setBoarded,
        journeyLegs,
        setCurrentBooking: rememberCurrent,
        refresh,
        isLoading,
        error,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used within BookingProvider");
  return ctx;
}

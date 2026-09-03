import { supabase, isSupabaseConfigured } from "./supabase";
import { DbBooking } from "./supabaseService";

/**
 * Subscribe in real-time to incoming dispatches for a specific technician.
 * Receives instantaneous notifications whenever a customer books the worker.
 */
export function subscribeToWorkerDispatches(
  workerId: string,
  onNewJob: (booking: DbBooking) => void,
  onJobUpdate?: (booking: DbBooking) => void
): () => void {
  if (!isSupabaseConfigured() || !supabase) {
    return () => {};
  }

  const channel = supabase
    .channel(`worker-dispatches-${workerId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "bookings",
      },
      (payload) => {
        const newBooking = payload.new as DbBooking;
        if (!newBooking.worker_id || newBooking.worker_id === workerId) {
          onNewJob(newBooking);
        }
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "bookings",
      },
      (payload) => {
        const updatedBooking = payload.new as DbBooking;
        if (updatedBooking.worker_id === workerId && onJobUpdate) {
          onJobUpdate(updatedBooking);
        }
      }
    )
    .subscribe();

  return () => {
    supabase?.removeChannel(channel);
  };
}

/**
 * Subscribe in real-time to a customer's active booking.
 * Receives immediate status changes when worker accepts, arrives, or completes.
 */
export function subscribeToBookingStatus(
  bookingId: string,
  onStatusChange: (updatedBooking: DbBooking) => void
): () => void {
  if (!isSupabaseConfigured() || !supabase || !bookingId) {
    return () => {};
  }

  const channel = supabase
    .channel(`booking-${bookingId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "bookings",
        filter: `id=eq.${bookingId}`,
      },
      (payload) => {
        onStatusChange(payload.new as DbBooking);
      }
    )
    .subscribe();

  return () => {
    supabase?.removeChannel(channel);
  };
}

/**
 * Subscribe in real-time to all dispatches for the Cooperative Federation live radar.
 */
export function subscribeToFederationBookings(
  onEvent: (booking: DbBooking, eventType: "INSERT" | "UPDATE") => void
): () => void {
  if (!isSupabaseConfigured() || !supabase) {
    return () => {};
  }

  const channel = supabase
    .channel("federation-dispatch-radar")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "bookings",
      },
      (payload) => {
        onEvent(payload.new as DbBooking, payload.eventType as any);
      }
    )
    .subscribe();

  return () => {
    supabase?.removeChannel(channel);
  };
}

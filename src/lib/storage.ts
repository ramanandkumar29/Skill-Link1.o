import { WorkerProfile, INITIAL_WORKERS, ServiceBooking } from "./seedData";

const WORKERS_KEY = "skilllink_workers_v2";
const BOOKINGS_KEY = "skilllink_bookings_v2";

export function getStoredWorkers(): WorkerProfile[] {
  if (typeof window === "undefined") return INITIAL_WORKERS;

  try {
    const data = localStorage.getItem(WORKERS_KEY);
    if (!data) {
      localStorage.setItem(WORKERS_KEY, JSON.stringify(INITIAL_WORKERS));
      return INITIAL_WORKERS;
    }
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading workers from localStorage", err);
    return INITIAL_WORKERS;
  }
}

export function saveWorker(newWorker: Omit<WorkerProfile, "id"> & { id?: string }): WorkerProfile {
  const workers = getStoredWorkers();
  const worker: WorkerProfile = {
    ...newWorker,
    id: newWorker.id || `w-${Date.now()}`,
    avatarUrl: newWorker.avatarUrl || newWorker.avatar || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80",
    avatar: newWorker.avatar || newWorker.avatarUrl || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80",
  };

  const updated = [worker, ...workers];
  if (typeof window !== "undefined") {
    localStorage.setItem(WORKERS_KEY, JSON.stringify(updated));
  }
  return worker;
}

export function getStoredBookings(): ServiceBooking[] {
  if (typeof window === "undefined") return [];

  try {
    const data = localStorage.getItem(BOOKINGS_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading bookings from localStorage", err);
    return [];
  }
}

export function saveBooking(bookingData: Omit<ServiceBooking, "id">): ServiceBooking {
  const bookings = getStoredBookings();
  const newBooking: ServiceBooking = {
    ...bookingData,
    id: `bk-${Date.now()}`,
  };

  const updated = [newBooking, ...bookings];
  if (typeof window !== "undefined") {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(updated));
  }
  return newBooking;
}

export function updateBookingStatus(bookingId: string, status: "Pending" | "Confirmed" | "In-Progress" | "Completed" | "Cancelled"): ServiceBooking | null {
  const bookings = getStoredBookings();
  const idx = bookings.findIndex((b) => b.id === bookingId);
  if (idx === -1) return null;

  bookings[idx].status = status as any;
  if (typeof window !== "undefined") {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
  }
  return bookings[idx];
}

export function updateBookingPhoto(bookingId: string, photoUrl: string, finalAmount: number): ServiceBooking | null {
  const bookings = getStoredBookings();
  const idx = bookings.findIndex((b) => b.id === bookingId);
  if (idx === -1) return null;

  bookings[idx].status = "Completed";
  bookings[idx].completionPhotoUrl = photoUrl;
  bookings[idx].finalBillAmount = finalAmount;

  if (typeof window !== "undefined") {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
  }
  return bookings[idx];
}

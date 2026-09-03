import { WorkerProfile, INITIAL_WORKERS, ServiceBooking } from "./seedData";

const WORKERS_KEY = "skilllink_workers_coop_v2";
const BOOKINGS_KEY = "skilllink_bookings_coop_v1";

export function getStoredWorkers(): WorkerProfile[] {
  if (typeof window === "undefined") return INITIAL_WORKERS;

  try {
    const data = localStorage.getItem(WORKERS_KEY);
    if (!data) {
      localStorage.setItem(WORKERS_KEY, JSON.stringify(INITIAL_WORKERS));
      return INITIAL_WORKERS;
    }
    const parsed: WorkerProfile[] = JSON.parse(data);
    // Ensure newly added initial workers (like Ramanand Kumar) are included
    const existingIds = new Set(parsed.map((w) => w.id));
    const missing = INITIAL_WORKERS.filter((w) => !existingIds.has(w.id));
    if (missing.length > 0) {
      const merged = [...missing, ...parsed];
      localStorage.setItem(WORKERS_KEY, JSON.stringify(merged));
      return merged;
    }
    return parsed;
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

export function updateBookingPhoto(bookingId: string, photoUrl: string, finalAmount: number = 499): ServiceBooking | null {
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

// ─── WORK ESTIMATES PERSISTENCE (Part 15 & 16) ─────────────────────────────
export interface WorkEstimate {
  id: string;
  bookingId: string;
  workerId: string;
  workerName: string;
  visitingFee: number;
  laborCost: number;
  materialsCost: number;
  platformFee: number;
  totalEstimatedAmount: number;
  workScopeDescription: string;
  materialsBreakdown?: string;
  status: "pending" | "approved" | "revision_requested" | "declined";
  createdAt: string;
  approvedAt?: string;
}

const ESTIMATES_KEY = "skilllink_work_estimates_v1";

export function getStoredEstimates(): WorkEstimate[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(ESTIMATES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveWorkEstimate(estimate: Omit<WorkEstimate, "id" | "createdAt">): WorkEstimate {
  const estimates = getStoredEstimates();
  const newEstimate: WorkEstimate = {
    ...estimate,
    id: `est-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const updated = [newEstimate, ...estimates.filter((e) => e.bookingId !== estimate.bookingId)];
  if (typeof window !== "undefined") {
    localStorage.setItem(ESTIMATES_KEY, JSON.stringify(updated));
  }
  return newEstimate;
}

export function getWorkEstimateForBooking(bookingId: string): WorkEstimate | null {
  const estimates = getStoredEstimates();
  return estimates.find((e) => e.bookingId === bookingId) || null;
}

export function updateEstimateStatus(
  estimateId: string,
  status: "pending" | "approved" | "revision_requested" | "declined"
): WorkEstimate | null {
  const estimates = getStoredEstimates();
  const idx = estimates.findIndex((e) => e.id === estimateId);
  if (idx === -1) return null;

  estimates[idx].status = status;
  if (status === "approved") {
    estimates[idx].approvedAt = new Date().toISOString();
  }
  if (typeof window !== "undefined") {
    localStorage.setItem(ESTIMATES_KEY, JSON.stringify(estimates));
  }
  return estimates[idx];
}

// ─── DISPUTES PERSISTENCE (Part 21) ─────────────────────────────────────────
export interface DisputeRecord {
  id: string;
  bookingId: string;
  raisedBy: "customer" | "worker";
  reason: string;
  description: string;
  status: "UNDER_REVIEW" | "RESOLVED" | "REJECTED";
  createdAt: string;
  resolutionNotes?: string;
}

const DISPUTES_KEY = "skilllink_disputes_v1";

export function getStoredDisputes(): DisputeRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(DISPUTES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveDispute(dispute: Omit<DisputeRecord, "id" | "createdAt" | "status">): DisputeRecord {
  const disputes = getStoredDisputes();
  const newDispute: DisputeRecord = {
    ...dispute,
    id: `disp-${Date.now()}`,
    status: "UNDER_REVIEW",
    createdAt: new Date().toISOString(),
  };
  const updated = [newDispute, ...disputes];
  if (typeof window !== "undefined") {
    localStorage.setItem(DISPUTES_KEY, JSON.stringify(updated));
  }
  return newDispute;
}

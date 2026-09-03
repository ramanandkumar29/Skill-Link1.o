import { supabase, isSupabaseConfigured } from "./supabase";
import { WorkerProfile, INITIAL_WORKERS, COOPERATIVE_SOCIETIES } from "./seedData";

// ── Database Types ──

export type UserRole = "customer" | "worker" | "cooperative_admin" | "super_admin";

export interface DbProfile {
  id: string; // references auth.users.id
  full_name: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DbCooperative {
  id: string;
  name: string;
  registration_number: string;
  district: string;
  state: string;
  active_workers_count?: number;
  welfare_fund_balance?: number;
  president_name?: string;
  contact_email?: string;
  contact_phone?: string;
  created_at?: string;
}

export interface DbService {
  id: string;
  name: string;
  slug: string;
  category?: string;
  description?: string;
  icon?: string;
  base_price?: number;
  visiting_fee?: number;
  is_active: boolean;
  created_at?: string;
}

export type BookingStatus =
  | "requested"
  | "assigned"
  | "accepted"
  | "on_the_way"
  | "arrived"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface DbBooking {
  id: string;
  customer_id: string;
  worker_id: string | null;
  service_id?: string | null;
  service_name: string;
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  problem_description?: string;
  scheduled_date: string;
  scheduled_time?: string;
  status: BookingStatus;
  visiting_fee: number;
  is_fee_paid: boolean;
  final_amount?: number;
  emergency?: boolean;
  notes?: string;
  completion_photo_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DbWorker {
  id: string;
  profile_id: string;
  primary_skill: string;
  experience_years?: number | string;
  verification_status: "VERIFIED" | "PENDING" | "REJECTED";
  is_available: boolean;
  rating: number;
  total_jobs: number;
  trust_score?: number;
  cooperative_id?: string | null;
  hourly_rate?: number;
  visiting_fee?: number;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  skills?: string[];
  profiles?: DbProfile;
  cooperatives?: DbCooperative;
  created_at?: string;
}

// ── Service Helpers ──

/**
 * Fetch list of services from Supabase `services` table.
 * Falls back to default category list if table is empty or connection is offline.
 */
export async function fetchServicesFromDb(): Promise<{
  success: boolean;
  data: DbService[];
  error?: string;
}> {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, data: [], error: "Supabase not configured" };
  }

  try {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      console.warn("Supabase fetchServices warning:", error.message);
      return { success: false, data: [], error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (err: any) {
    console.warn("fetchServicesFromDb network error:", err?.message || err);
    return { success: false, data: [], error: err?.message || "Network error" };
  }
}

/**
 * Fetch profile by user UUID from `profiles` table.
 */
export async function fetchProfileFromDb(userId: string): Promise<DbProfile | null> {
  if (!isSupabaseConfigured() || !supabase || !userId) return null;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.warn("fetchProfileFromDb error:", error.message);
      return null;
    }
    return data as DbProfile;
  } catch (err) {
    console.warn("fetchProfileFromDb network exception:", err);
    return null;
  }
}

/**
 * Upsert user profile in `profiles` table.
 */
export async function upsertProfileInDb(profile: Partial<DbProfile> & { id: string }): Promise<DbProfile | null> {
  if (!isSupabaseConfigured() || !supabase) return null;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: profile.id,
          full_name: profile.full_name || "User",
          email: profile.email || null,
          phone: profile.phone || null,
          role: profile.role || "customer",
          avatar_url: profile.avatar_url || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )
      .select()
      .single();

    if (error) {
      console.warn("upsertProfileInDb error:", error.message);
      return null;
    }
    return data as DbProfile;
  } catch (err) {
    console.warn("upsertProfileInDb exception:", err);
    return null;
  }
}

/**
 * Fetch workers from `workers` table with joined profile & cooperative data.
 */
export async function fetchWorkersFromDb(category?: string): Promise<{
  success: boolean;
  data: WorkerProfile[];
  error?: string;
}> {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, data: INITIAL_WORKERS, error: "Supabase not configured" };
  }

  try {
    let query = supabase
      .from("workers")
      .select(`
        *,
        profiles:profile_id (*),
        cooperatives:cooperative_id (*)
      `);

    if (category && category !== "All") {
      query = query.ilike("primary_skill", `%${category}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.warn("fetchWorkersFromDb error:", error.message);
      return { success: false, data: INITIAL_WORKERS, error: error.message };
    }

    if (!data || data.length === 0) {
      return { success: true, data: INITIAL_WORKERS };
    }

    // Map DB worker shape to frontend WorkerProfile
    const mapped: WorkerProfile[] = data.map((w: any) => ({
      id: w.id,
      name: w.profiles?.full_name || "Verified Technician",
      occupation: w.primary_skill || "Technician",
      category: (w.primary_skill?.toLowerCase() || "technician") as any,
      rating: Number(w.rating) || 4.8,
      jobsCompleted: Number(w.total_jobs) || 0,
      trustScore: Number(w.trust_score) || 92,
      badge: w.verification_status === "VERIFIED" ? "Verified" : "Top Rated",
      location: w.profiles?.address || "Chandigarh Tricity",
      experience: typeof w.experience_years === "number" ? `${w.experience_years} Years` : w.experience_years || "3+ Years",
      phone: w.phone || w.profiles?.phone || "+91 98000 00000",
      avatarUrl: w.avatar_url || w.profiles?.avatar_url || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80",
      avatar: w.avatar_url || w.profiles?.avatar_url || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80",
      bio: w.bio || undefined,
      skills: w.skills || [w.primary_skill],
      isAvailable: w.is_available ?? true,
      visitingFee: Number(w.visiting_fee) || 149,
      hourlyRate: Number(w.hourly_rate) || 299,
      cooperativeSociety: w.cooperatives?.name || "Tricity Labour & Household Services Cooperative Society Ltd.",
      cooperativeMemberId: w.cooperatives?.registration_number || "TLCS-2022-041",
      kycStatus: w.verification_status || "VERIFIED",
    }));

    return { success: true, data: mapped };
  } catch (err: any) {
    console.warn("fetchWorkersFromDb network error:", err?.message || err);
    return { success: false, data: INITIAL_WORKERS, error: err?.message || "Network error" };
  }
}

/**
 * Fetch cooperative societies from `cooperatives` table.
 */
export async function fetchCooperativesFromDb(): Promise<{
  success: boolean;
  data: DbCooperative[];
  error?: string;
}> {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, data: COOPERATIVE_SOCIETIES as any, error: "Supabase not configured" };
  }

  try {
    const { data, error } = await supabase
      .from("cooperatives")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.warn("fetchCooperativesFromDb error:", error.message);
      return { success: false, data: COOPERATIVE_SOCIETIES as any, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (err: any) {
    return { success: false, data: COOPERATIVE_SOCIETIES as any, error: err?.message || "Network error" };
  }
}

/**
 * Create a new booking in `bookings` table.
 */
export async function createBookingInDb(booking: {
  customerId: string;
  workerId?: string | null;
  serviceName: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  problemDescription?: string;
  scheduledDate: string;
  scheduledTime?: string;
  visitingFee?: number;
  isFeePaid?: boolean;
  emergency?: boolean;
  notes?: string;
}): Promise<{ success: boolean; data?: DbBooking; error?: string }> {
  const newBookingPayload = {
    customer_id: booking.customerId,
    worker_id: booking.workerId || null,
    service_name: booking.serviceName,
    customer_name: booking.customerName,
    customer_phone: booking.customerPhone,
    customer_address: booking.customerAddress || "Address on file",
    problem_description: booking.problemDescription || booking.notes || "Service inspection requested",
    scheduled_date: booking.scheduledDate,
    scheduled_time: booking.scheduledTime || "ASAP",
    status: (booking.workerId ? "assigned" : "requested") as BookingStatus,
    visiting_fee: booking.visitingFee || 149,
    is_fee_paid: booking.isFeePaid ?? true,
    emergency: booking.emergency ?? false,
    notes: booking.notes || "",
  };

  if (!isSupabaseConfigured() || !supabase) {
    // Generate local mock record if database key is pending
    const localId = `bk-${Date.now()}`;
    return {
      success: true,
      data: {
        id: localId,
        ...newBookingPayload,
        created_at: new Date().toISOString(),
      } as DbBooking,
    };
  }

  try {
    const { data, error } = await supabase
      .from("bookings")
      .insert([newBookingPayload])
      .select()
      .single();

    if (error) {
      console.warn("createBookingInDb error:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as DbBooking };
  } catch (err: any) {
    console.warn("createBookingInDb exception:", err);
    return { success: false, error: err?.message || "Booking submission failed" };
  }
}

/**
 * Fetch bookings for a customer.
 */
export async function fetchCustomerBookingsFromDb(customerId: string): Promise<DbBooking[]> {
  if (!isSupabaseConfigured() || !supabase || !customerId) return [];

  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("fetchCustomerBookingsFromDb error:", error.message);
      return [];
    }

    return (data as DbBooking[]) || [];
  } catch (err) {
    console.warn("fetchCustomerBookingsFromDb exception:", err);
    return [];
  }
}

/**
 * Fetch bookings for a worker.
 */
export async function fetchWorkerBookingsFromDb(workerId: string): Promise<DbBooking[]> {
  if (!isSupabaseConfigured() || !supabase || !workerId) return [];

  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("worker_id", workerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("fetchWorkerBookingsFromDb error:", error.message);
      return [];
    }

    return (data as DbBooking[]) || [];
  } catch (err) {
    console.warn("fetchWorkerBookingsFromDb exception:", err);
    return [];
  }
}

/**
 * Update booking status in `bookings` table.
 */
export async function updateBookingStatusInDb(
  bookingId: string,
  status: BookingStatus,
  extra?: { finalAmount?: number; completionPhotoUrl?: string }
): Promise<{ success: boolean; data?: DbBooking; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: true };
  }

  try {
    const updatePayload: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (extra?.finalAmount !== undefined) updatePayload.final_amount = extra.finalAmount;
    if (extra?.completionPhotoUrl) updatePayload.completion_photo_url = extra.completionPhotoUrl;

    const { data, error } = await supabase
      .from("bookings")
      .update(updatePayload)
      .eq("id", bookingId)
      .select()
      .single();

    if (error) {
      console.warn("updateBookingStatusInDb error:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as DbBooking };
  } catch (err: any) {
    console.warn("updateBookingStatusInDb exception:", err);
    return { success: false, error: err?.message || "Failed to update booking" };
  }
}

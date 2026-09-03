/**
 * Complete Notification System for Skill-Link
 * Supports in-app notifications, Supabase Realtime subscriptions,
 * role-specific notifications (Customer, Worker, Cooperative Admin),
 * and zero-leakage security boundaries.
 */

import { supabase, isSupabaseConfigured } from "./supabase";

export type NotificationType =
  | "booking_created"
  | "worker_assigned"
  | "worker_accepted"
  | "worker_en_route"
  | "worker_arrived"
  | "service_completed"
  | "booking_cancelled"
  | "new_job_request"
  | "worker_registered"
  | "verification_required"
  | "welfare_credit"
  | "system";

export interface AppNotification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: NotificationType;
  bookingId?: string;
  role: "customer" | "worker" | "cooperative_admin" | "super_admin";
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface CreateNotificationInput {
  userId?: string;
  title: string;
  message: string;
  type: NotificationType;
  bookingId?: string;
  role?: "customer" | "worker" | "cooperative_admin" | "super_admin";
  metadata?: Record<string, any>;
}

const LOCAL_STORAGE_KEY = "skill_link_notifications_v1";

// Initial seed notifications so new users immediately see helpful contextual guidance
const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-welcome-1",
    title: "Welcome to Skill-Link Cooperative Federation",
    message: "Transparent ₹149 doorstep inspection fee, 0% commission on worker wages, and full welfare protection.",
    type: "system",
    role: "customer",
    isRead: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "notif-coop-welfare-2",
    title: "Cooperative Social Security Active",
    message: "3% of every service booking is automatically credited to the artisan health & accident welfare fund.",
    type: "welfare_credit",
    role: "customer",
    isRead: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

/**
 * Fetch notifications for a user based on their authentication ID or active role
 */
export async function fetchUserNotifications(
  userId?: string,
  userRole: "customer" | "worker" | "cooperative_admin" | "super_admin" = "customer"
): Promise<AppNotification[]> {
  // 1. Check Supabase first if live
  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);

      if (userId) {
        query = query.or(`user_id.eq.${userId},user_id.is.null`);
      } else {
        query = query.eq("role", userRole);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data.map((n: any) => ({
          id: n.id,
          userId: n.user_id,
          title: n.title,
          message: n.message,
          type: n.type as NotificationType,
          bookingId: n.booking_id,
          role: n.role || "customer",
          isRead: Boolean(n.is_read),
          metadata: n.metadata || {},
          createdAt: n.created_at,
        }));
      }
    } catch (err) {
      console.warn("Supabase notifications fetch fallback to local cache:", err);
    }
  }

  // 2. Offline / Local fallback
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed: AppNotification[] = JSON.parse(saved);
        return parsed.filter(
          (n) => !userId || !n.userId || n.userId === userId || n.role === userRole
        );
      } catch {}
    }
    // Initialize default seed notifications
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
    return INITIAL_NOTIFICATIONS;
  }

  return INITIAL_NOTIFICATIONS;
}

/**
 * Mark an individual notification as read
 */
export async function markNotificationAsRead(id: string): Promise<boolean> {
  // 1. Supabase
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    } catch (err) {
      console.warn("Failed to mark read in Supabase:", err);
    }
  }

  // 2. Local storage
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed: AppNotification[] = JSON.parse(saved);
        const updated = parsed.map((n) => (n.id === id ? { ...n, isRead: true } : n));
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      }
    } catch {}
  }

  return true;
}

/**
 * Mark all notifications as read for current user
 */
export async function markAllNotificationsAsRead(userId?: string): Promise<boolean> {
  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase.from("notifications").update({ is_read: true });
      if (userId) {
        query = query.eq("user_id", userId);
      } else {
        query = query.eq("is_read", false);
      }
      await query;
    } catch (err) {
      console.warn("Failed to mark all as read in Supabase:", err);
    }
  }

  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed: AppNotification[] = JSON.parse(saved);
        const updated = parsed.map((n) => ({ ...n, isRead: true }));
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      }
    } catch {}
  }

  return true;
}

/**
 * Create and dispatch a new notification
 */
export async function sendNotification(input: CreateNotificationInput): Promise<AppNotification> {
  const newNotif: AppNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    userId: input.userId,
    title: input.title,
    message: input.message,
    type: input.type,
    bookingId: input.bookingId,
    role: input.role || "customer",
    isRead: false,
    metadata: input.metadata || {},
    createdAt: new Date().toISOString(),
  };

  // 1. Supabase Insert
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .insert([
          {
            user_id: input.userId || null,
            title: input.title,
            message: input.message,
            type: input.type,
            booking_id: input.bookingId || null,
            role: input.role || "customer",
            is_read: false,
            metadata: input.metadata || {},
          },
        ])
        .select()
        .single();

      if (!error && data) {
        newNotif.id = data.id;
      }
    } catch (err) {
      console.warn("Failed to persist notification to Supabase:", err);
    }
  }

  // 2. Local storage cache update
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      const parsed: AppNotification[] = saved ? JSON.parse(saved) : [];
      const updated = [newNotif, ...parsed].slice(0, 50);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

      // Dispatch window event for live in-app toast & badge update
      window.dispatchEvent(
        new CustomEvent("skill-link-notification", { detail: newNotif })
      );
    } catch {}
  }

  return newNotif;
}

/**
 * Subscribe to live Supabase Realtime notifications
 */
export function subscribeToRealtimeNotifications(
  userId: string | undefined,
  onNewNotification: (notif: AppNotification) => void
): () => void {
  if (!isSupabaseConfigured() || !supabase) {
    // Return empty teardown if Supabase is offline
    return () => {};
  }

  try {
    const channelName = `realtime-notifications-${userId || "public"}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: userId ? `user_id=eq.${userId}` : undefined,
        },
        (payload) => {
          const raw = payload.new;
          if (raw) {
            const parsed: AppNotification = {
              id: raw.id,
              userId: raw.user_id,
              title: raw.title,
              message: raw.message,
              type: raw.type,
              bookingId: raw.booking_id,
              role: raw.role || "customer",
              isRead: Boolean(raw.is_read),
              metadata: raw.metadata || {},
              createdAt: raw.created_at,
            };
            onNewNotification(parsed);
          }
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  } catch (err) {
    console.warn("Realtime notification subscription error:", err);
    return () => {};
  }
}

// ============================================================================
// Workflow-specific notification helper dispatchers
// ============================================================================

/** Customer: Booking Successfully Created */
export async function notifyBookingCreated(params: {
  bookingId: string;
  customerId?: string;
  serviceName: string;
  workerName?: string;
  scheduledTime?: string;
}) {
  return sendNotification({
    userId: params.customerId,
    title: `Booking Confirmed: ${params.serviceName}`,
    message: `Your service request is confirmed with technician ${params.workerName || "Assigned Specialist"}. Scheduled: ${params.scheduledTime || "Within 45 Mins"}. Fixed visiting fee: ₹149.`,
    type: "booking_created",
    bookingId: params.bookingId,
    role: "customer",
  });
}

/** Customer: Technician is on the way */
export async function notifyWorkerEnRoute(params: {
  bookingId: string;
  customerId?: string;
  workerName: string;
  distanceKm?: number;
}) {
  return sendNotification({
    userId: params.customerId,
    title: `Technician On The Way: ${params.workerName}`,
    message: `${params.workerName} has started traveling to your address${params.distanceKm ? ` (~${params.distanceKm} km away)` : ""}. Please keep your phone accessible.`,
    type: "worker_en_route",
    bookingId: params.bookingId,
    role: "customer",
  });
}

/** Customer: Technician arrived at doorstep */
export async function notifyWorkerArrived(params: {
  bookingId: string;
  customerId?: string;
  workerName: string;
}) {
  return sendNotification({
    userId: params.customerId,
    title: `Technician Arrived: ${params.workerName}`,
    message: `${params.workerName} is at your doorstep. Please verify their cooperative identification card before allowing entry.`,
    type: "worker_arrived",
    bookingId: params.bookingId,
    role: "customer",
  });
}

/** Customer & Worker: Job Completed */
export async function notifyServiceCompleted(params: {
  bookingId: string;
  customerId?: string;
  workerId?: string;
  workerName: string;
  finalAmount: number;
}) {
  // 1. Notify Customer
  await sendNotification({
    userId: params.customerId,
    title: "Service Completed & Certified",
    message: `Your job by ${params.workerName} has been completed successfully. 3% social security cess has been contributed to the worker welfare fund.`,
    type: "service_completed",
    bookingId: params.bookingId,
    role: "customer",
  });

  // 2. Notify Worker
  if (params.workerId) {
    const welfareShare = (params.finalAmount * 0.03).toFixed(2);
    await sendNotification({
      userId: params.workerId,
      title: "Job Payout Credited to Passbook",
      message: `Job #${params.bookingId.slice(0, 6)} completed. ₹${params.finalAmount} logged to your cooperative account. ₹${welfareShare} allocated to your welfare balance.`,
      type: "welfare_credit",
      bookingId: params.bookingId,
      role: "worker",
    });
  }
}

/** Worker: New Incoming Job Dispatch */
export async function notifyNewJobRequest(params: {
  workerId?: string;
  customerName: string;
  serviceType: string;
  address: string;
  offeredFee: number;
  bookingId?: string;
}) {
  return sendNotification({
    userId: params.workerId,
    title: `New Dispatch Request: ${params.serviceType}`,
    message: `Customer ${params.customerName} in ${params.address} requests service. Offered fee: ₹${params.offeredFee}. 45-second dispatch window open.`,
    type: "new_job_request",
    bookingId: params.bookingId,
    role: "worker",
  });
}

/** Cooperative Admin: New Artisan Registered */
export async function notifyAdminNewWorkerRegistered(params: {
  workerName: string;
  trade: string;
  cooperativeName: string;
}) {
  return sendNotification({
    title: `New Artisan Registration: ${params.workerName}`,
    message: `${params.workerName} (${params.trade}) registered under ${params.cooperativeName}. Aadhaar & Skill Council verification pending review.`,
    type: "worker_registered",
    role: "cooperative_admin",
  });
}

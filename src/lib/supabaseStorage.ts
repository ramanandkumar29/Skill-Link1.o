import { supabase, isSupabaseConfigured } from "./supabase";

export const BUCKETS = {
  JOB_PHOTOS: "job-photos",
  WORKER_DOCS: "worker-documents",
  AVATARS: "avatars",
};

/**
 * Upload a service completion or inspection photo to Supabase Storage.
 */
export async function uploadJobPhoto(
  file: File | Blob,
  bookingId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    // Return a placeholder demo URL when storage is offline
    return {
      success: true,
      url: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=80",
    };
  }

  try {
    const fileExt = file instanceof File ? file.name.split(".").pop() : "jpg";
    const filePath = `booking_${bookingId}_${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(BUCKETS.JOB_PHOTOS)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.warn("Storage upload warning:", error.message);
      return {
        success: false,
        error: error.message,
        url: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=80",
      };
    }

    // Retrieve public URL
    const { data: publicUrlData } = supabase.storage
      .from(BUCKETS.JOB_PHOTOS)
      .getPublicUrl(data.path);

    return {
      success: true,
      url: publicUrlData.publicUrl,
    };
  } catch (err: any) {
    console.warn("uploadJobPhoto exception:", err);
    return {
      success: false,
      error: err?.message || "Storage upload failed",
    };
  }
}

/**
 * Upload a worker KYC document / trade certification to Supabase Storage.
 */
export async function uploadWorkerDocument(
  file: File,
  workerId: string,
  docType: "certificate" | "aadhaar" | "id"
): Promise<{ success: boolean; url?: string; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      success: true,
      url: `https://example.com/mock-doc-${docType}.pdf`,
    };
  }

  try {
    const fileExt = file.name.split(".").pop();
    const filePath = `${workerId}/${docType}_${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(BUCKETS.WORKER_DOCS)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.warn("Worker doc upload warning:", error.message);
      return { success: false, error: error.message };
    }

    const { data: publicUrlData } = supabase.storage
      .from(BUCKETS.WORKER_DOCS)
      .getPublicUrl(data.path);

    return {
      success: true,
      url: publicUrlData.publicUrl,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || "Document upload failed" };
  }
}

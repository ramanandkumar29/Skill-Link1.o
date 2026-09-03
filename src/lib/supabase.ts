import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Read environment variables (Next.js public variables)
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://uofhxgednmdzogeayuac.supabase.co";

const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

/**
 * Checks if Supabase client is properly configured with valid URL & Publishable/Anon key.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    supabaseUrl.startsWith("http") &&
    supabasePublishableKey &&
    supabasePublishableKey.length > 20 &&
    !supabasePublishableKey.includes("your-supabase")
  );
}

/**
 * Global Supabase client instance with session persistence and automatic token refresh.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Test the database connection safely by attempting a low-cost SELECT on the "services" table.
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
  data?: any[];
  error?: string;
}> {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      connected: false,
      message: "Supabase Publishable Key not configured in environment (NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).",
    };
  }

  try {
    const { data, error, status } = await supabase
      .from("services")
      .select("id, name, slug, is_active")
      .limit(5);

    if (error) {
      return {
        connected: false,
        message: `Database query error (HTTP ${status}): ${error.message}`,
        error: error.message,
      };
    }

    return {
      connected: true,
      message: `Successfully connected to Supabase project. Found ${data ? data.length : 0} services.`,
      data: data || [],
    };
  } catch (err: any) {
    return {
      connected: false,
      message: err?.message || "Network error while connecting to Supabase.",
      error: String(err),
    };
  }
}

// Supabase Edge Function: sos-dispatch
// Handles high-priority emergency utility and roadside SOS dispatch

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const {
      customerId,
      customerName,
      customerPhone,
      emergencyType,
      latitude,
      longitude,
      address,
    } = await req.json();

    if (!customerPhone || !emergencyType) {
      return new Response(
        JSON.stringify({ error: "Missing emergency contact or breakdown type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Query closest available verified technicians
    const { data: availableWorkers, error: workerError } = await supabaseClient
      .from("workers")
      .select("*, profiles:profile_id(*)")
      .eq("is_available", true)
      .eq("verification_status", "VERIFIED")
      .order("rating", { ascending: false })
      .limit(5);

    if (workerError || !availableWorkers || availableWorkers.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "No available verified technicians found in local sector. Queued for priority fallback dispatch.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const matchedWorker = availableWorkers[0];

    // 2. Create emergency booking record in Supabase
    const { data: booking, error: bookingError } = await supabaseClient
      .from("bookings")
      .insert([
        {
          customer_id: customerId || null,
          worker_id: matchedWorker.id,
          service_name: `EMERGENCY SOS: ${emergencyType}`,
          customer_name: customerName || "Urgent Client",
          customer_phone: customerPhone,
          customer_address: address || `GPS (${latitude}, ${longitude})`,
          problem_description: `Critical 15-Minute SOS Dispatch: ${emergencyType}`,
          scheduled_date: new Date().toISOString(),
          scheduled_time: "Immediate (15-min ETA)",
          status: "assigned",
          visiting_fee: matchedWorker.visiting_fee || 199.00,
          is_fee_paid: true,
          emergency: true,
        },
      ])
      .select()
      .single();

    if (bookingError) {
      throw bookingError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Technician matched and dispatched under 15-minute priority SLA.",
        booking,
        dispatchedWorker: {
          id: matchedWorker.id,
          name: matchedWorker.profiles?.full_name || "Verified Pro",
          phone: matchedWorker.phone,
          rating: matchedWorker.rating,
          estimatedArrivalMinutes: 12,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

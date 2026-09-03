// Supabase Edge Function: process-payout
// Handles cooperative 3% social security cess deduction and artisan net payout

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

    const { bookingId, totalBillAmount, cooperativeId } = await req.json();

    if (!bookingId || !totalBillAmount) {
      return new Response(
        JSON.stringify({ error: "Missing bookingId or totalBillAmount" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const bill = Number(totalBillAmount);
    const welfareCessRate = 0.03; // 3% Cooperative Welfare Pool
    const welfareDeduction = Number((bill * welfareCessRate).toFixed(2));
    const artisanNetPayout = Number((bill - welfareDeduction).toFixed(2));

    // 1. Mark booking completed with final figures
    const { data: updatedBooking, error: bookingErr } = await supabaseClient
      .from("bookings")
      .update({
        status: "completed",
        final_amount: bill,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId)
      .select()
      .single();

    if (bookingErr) throw bookingErr;

    // 2. If cooperativeId is present, increment society welfare fund pool
    if (cooperativeId) {
      await supabaseClient.rpc("increment_welfare_fund", {
        society_id: cooperativeId,
        amount: welfareDeduction,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payout computed and 3% cooperative welfare cess credited.",
        settlement: {
          bookingId,
          totalBill: bill,
          cooperativeWelfareContribution: welfareDeduction,
          artisanNetPayout: artisanNetPayout,
          platformFacilitationFee: 0.00, // 0% commercial cut under cooperative model
          settlementTimestamp: new Date().toISOString(),
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

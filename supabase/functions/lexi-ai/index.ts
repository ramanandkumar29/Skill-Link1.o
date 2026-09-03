// Supabase Edge Function: lexi-ai
// Provides serverless domain-specific AI execution for Skill-Link

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

    const { message, conversationHistory = [], userRole = "customer" } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lower = message.toLowerCase();
    let service = "General";
    let urgency = "LOW";
    let reply = "Namaste! Main LEXI hoon, Skill-Link ka intelligent assistant.";

    if (lower.includes("pipe") || lower.includes("leak") || lower.includes("pani")) {
      service = "Plumber";
      urgency = "HIGH";
      reply = "Maine aapka plumbing issue identify kiya hai. Hamare certified cooperative master plumber Ramanand Sharma (4.9★) available hain. Fixed inspection visiting fee ₹149 hai. Kya aap booking confirm karna chahte hain?";
    } else if (lower.includes("spark") || lower.includes("bijli") || lower.includes("electric")) {
      service = "Electrician";
      urgency = "CRITICAL_EMERGENCY";
      reply = "🚨 Electrical Hazard Alert! Kripya pehle main MCB switch band karein. Hamare licensed wireman Anil Kumar Maurya dispatch ke liye available hain. Kya aap visit confirm karna chahte hain?";
    }

    return new Response(
      JSON.stringify({
        success: true,
        reply,
        structuredAnalysis: {
          service,
          urgency,
          confidence: "High",
          recommended_action: "Confirm Booking",
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

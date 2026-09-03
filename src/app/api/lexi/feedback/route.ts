import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      messageId,
      query,
      response,
      feedback, // "helpful" | "not_helpful"
      reason,
      serviceIdentified,
      userRole = "customer",
    } = body;

    const auditRecord = {
      message_id: messageId || `msg-${Date.now()}`,
      query: query || "",
      response: response || "",
      feedback: feedback || "helpful",
      reason: reason || null,
      service_identified: serviceIdentified || null,
      user_role: userRole,
      created_at: new Date().toISOString(),
    };

    // If Supabase is live, persist feedback to `ai_feedback` table safely
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from("ai_feedback").insert([auditRecord]);
      if (error) {
        console.warn("Could not insert to ai_feedback table, recording to memory log:", error.message);
      }
    }

    console.log("LEXI AI Quality Audit Feedback Recorded:", {
      feedback: auditRecord.feedback,
      service: auditRecord.service_identified,
      query: auditRecord.query.slice(0, 50),
    });

    return NextResponse.json({
      success: true,
      message: "Thank you for your feedback! This helps improve LEXI's domain accuracy.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to record feedback" },
      { status: 500 }
    );
  }
}

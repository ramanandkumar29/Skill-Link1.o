import { NextRequest, NextResponse } from "next/server";
import { runLexiEngine } from "@/lib/lexiEngine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      message,
      conversationHistory = [],
      userRole = "customer",
      userLocation,
      userId,
    } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message text is required" },
        { status: 400 }
      );
    }

    // Run the domain-specific LEXI reasoning engine
    const output = await runLexiEngine({
      message,
      conversationHistory,
      userRole,
      userLocation,
      userId,
    });

    return NextResponse.json({
      success: true,
      reply: output.reply,
      structuredAnalysis: output.structuredAnalysis,
      richPayload: output.richPayload,
      safetyWarning: output.safetyWarning,
      retrievedKnowledge: output.retrievedKnowledge,
    });
  } catch (error: any) {
    console.error("LEXI API Route error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal LEXI processing error" },
      { status: 500 }
    );
  }
}

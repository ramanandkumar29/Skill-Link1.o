import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Verify webhook signature if secret is configured
    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      if (expectedSignature !== signature) {
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
      }
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;

    console.log(`Payment Webhook Event Received: ${event}`, {
      id: paymentEntity?.id,
      order_id: paymentEntity?.order_id,
      amount: paymentEntity?.amount ? paymentEntity.amount / 100 : null,
    });

    if (isSupabaseConfigured() && supabase && paymentEntity?.order_id) {
      if (event === "payment.captured") {
        await supabase
          .from("payments")
          .update({
            payment_status: "successful",
            provider_payment_id: paymentEntity.id,
            updated_at: new Date().toISOString(),
          })
          .eq("provider_order_id", paymentEntity.order_id);
      } else if (event === "payment.failed") {
        await supabase
          .from("payments")
          .update({
            payment_status: "failed",
            provider_payment_id: paymentEntity.id,
            updated_at: new Date().toISOString(),
          })
          .eq("provider_order_id", paymentEntity.order_id);
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return NextResponse.json(
      { error: err?.message || "Webhook processing failed" },
      { status: 500 }
    );
  }
}

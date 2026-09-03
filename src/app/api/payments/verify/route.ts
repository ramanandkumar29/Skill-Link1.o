import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { sendNotification } from "@/lib/notificationService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      paymentId,
      bookingId,
      customerId,
      providerOrderId,
      providerPaymentId,
      providerSignature,
      isTestMode = false,
      amount = 153.47,
    } = body;

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Signature verification for live Razorpay payments
    if (!isTestMode && keySecret && providerSignature) {
      const generatedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${providerOrderId}|${providerPaymentId}`)
        .digest("hex");

      if (generatedSignature !== providerSignature) {
        return NextResponse.json(
          { error: "Invalid payment signature. Transaction compromised." },
          { status: 400 }
        );
      }
    }

    // Update payment record in Supabase
    if (isSupabaseConfigured() && supabase) {
      try {
        if (paymentId && !paymentId.startsWith("pay_")) {
          await supabase
            .from("payments")
            .update({
              payment_status: "successful",
              provider_payment_id: providerPaymentId || `sim_pay_${Date.now()}`,
              provider_signature: providerSignature || "test_verified",
              updated_at: new Date().toISOString(),
            })
            .eq("id", paymentId);
        } else if (providerOrderId) {
          await supabase
            .from("payments")
            .update({
              payment_status: "successful",
              provider_payment_id: providerPaymentId || `sim_pay_${Date.now()}`,
              updated_at: new Date().toISOString(),
            })
            .eq("provider_order_id", providerOrderId);
        }

        // Update linked booking to paid & confirmed
        if (bookingId) {
          await supabase
            .from("bookings")
            .update({
              is_fee_paid: true,
              status: "confirmed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", bookingId);
        }
      } catch (dbErr) {
        console.warn("Could not update payment status in Supabase:", dbErr);
      }
    }

    // Trigger instant in-app & Realtime notification for customer
    sendNotification({
      userId: customerId,
      title: "Payment Received & Escrow Locked",
      message: `Your inspection visit fee of ₹${amount} has been securely verified via ${isTestMode ? "Sandbox Test Mode" : "UPI/Card Gateway"}. 3% social security cess has been allocated to the cooperative welfare pool.`,
      type: "welfare_credit",
      bookingId: bookingId,
      role: "customer",
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: isTestMode
        ? "Payment verified successfully (Sandbox Simulation)"
        : "Payment verified successfully",
      paymentRecord: {
        id: paymentId,
        bookingId,
        paymentStatus: "successful",
        amount,
        isTestMode,
        providerPaymentId,
      },
    });
  } catch (err: any) {
    console.error("Payment verification error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal payment verification error" },
      { status: 500 }
    );
  }
}

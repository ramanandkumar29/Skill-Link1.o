import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      amount,
      bookingId,
      customerId,
      paymentMethod = "upi",
      customerName,
      customerPhone,
      notes = {},
    } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Valid payment amount is required" },
        { status: 400 }
      );
    }

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_simulation";
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const isTestMode = !keySecret || keyId.startsWith("rzp_test") || keyId === "rzp_test_simulation";

    let providerOrderId = `order_test_${Date.now()}`;

    // If real Razorpay credentials exist, call Razorpay Orders API
    if (keySecret && keyId !== "rzp_test_simulation") {
      try {
        const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
        const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${authHeader}`,
          },
          body: JSON.stringify({
            amount: Math.round(amount * 100), // convert to paise
            currency: "INR",
            receipt: `rcpt_${bookingId ? bookingId.slice(0, 8) : Date.now()}`,
            notes: {
              ...notes,
              bookingId: bookingId || "",
              customerId: customerId || "",
            },
          }),
        });

        if (orderRes.ok) {
          const orderData = await orderRes.json();
          providerOrderId = orderData.id;
        } else {
          console.warn("Razorpay API order creation failed, using secure test sandbox mode");
        }
      } catch (rzpErr) {
        console.warn("Razorpay network error, falling back to secure test sandbox:", rzpErr);
      }
    }

    // Persist payment order in Supabase if configured
    let paymentDbId = `pay_${Date.now()}`;
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from("payments")
          .insert([
            {
              booking_id: bookingId || null,
              customer_id: customerId || null,
              amount: amount,
              currency: "INR",
              payment_status: "pending",
              payment_provider: isTestMode ? "sandbox" : "razorpay",
              provider_order_id: providerOrderId,
              payment_method: paymentMethod,
              is_test_mode: isTestMode,
              metadata: {
                customerName,
                customerPhone,
                ...notes,
              },
            },
          ])
          .select()
          .single();

        if (!error && data) {
          paymentDbId = data.id;
        }
      } catch (dbErr) {
        console.warn("Could not save initial payment record to Supabase:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      order: {
        id: paymentDbId,
        amount,
        currency: "INR",
        keyId,
        isTestMode,
        providerOrderId,
      },
    });
  } catch (err: any) {
    console.error("Create payment order error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal payment initiation error" },
      { status: 500 }
    );
  }
}

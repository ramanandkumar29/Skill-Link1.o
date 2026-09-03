"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Worker } from "@/lib/seedData";
import { saveBooking } from "@/lib/storage";
import { createBookingInDb, updateBookingStatusInDb } from "@/lib/supabaseService";
import { getStoredAuthSession } from "@/lib/auth";
import { notifyBookingCreated, notifyNewJobRequest } from "@/lib/notificationService";
import { initiatePaymentOrder, verifyPaymentTransaction } from "@/lib/paymentService";
import {
  calculateHaversineDistance,
  estimateTravelTimeMinutes,
  getBrowserLocation,
  reverseGeocode,
  getNavigationUrl,
} from "@/lib/geo";
import {
  CheckCircle,
  AlertCircle,
  MapPin,
  Navigation,
  CreditCard,
  QrCode,
  Banknote,
  ArrowRight,
  ShieldCheck,
  Zap,
  X,
  Calendar,
  Clock,
  Download,
  Star,
  Building,
  HeartHandshake,
  IndianRupee,
  CheckCircle2,
} from "lucide-react";

const SkillLinkMap = dynamic(() => import("./SkillLinkMap"), { ssr: false });

interface PaymentModalProps {
  worker: Worker | null;
  onClose: () => void;
  onSuccess: (bookingId: string) => void;
}

export default function PaymentModal({ worker, onClose, onSuccess }: PaymentModalProps) {
  const [step, setStep] = useState<"SCHEDULE" | "PAYMENT" | "CONFIRMED" | "FEEDBACK">("SCHEDULE");
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "CARD" | "NETBANKING" | "CASH">("UPI");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [isSandboxMode, setIsSandboxMode] = useState(true);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [preferredDate, setPreferredDate] = useState("Today (ASAP)");
  const [preferredSlot, setPreferredSlot] = useState("Within 45 Mins");
  const [customNotes, setCustomNotes] = useState("");
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);

  // Geolocation & Map state
  const [serviceLat, setServiceLat] = useState<number>(30.7333);
  const [serviceLng, setServiceLng] = useState<number>(76.7794);
  const [isLocating, setIsLocating] = useState(false);
  const [showMap, setShowMap] = useState(false);

  // Post-service rating & invoice
  const [rating, setRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  if (!worker) return null;

  const visitFee = worker.visitingFee || 149;
  const welfareCess = Number((visitFee * 0.03).toFixed(1)); // 3% Cooperative Welfare Pool
  const totalPayable = Math.round(visitFee + welfareCess);

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim()) {
      alert("Please enter your name and phone number.");
      return;
    }
    setStep("PAYMENT");
  };

  const handleConfirmBookingPayment = async () => {
    setIsProcessingPayment(true);
    setPaymentError(null);

    const session = getStoredAuthSession();
    const customerId = session?.id || `anon-${Date.now()}`;

    const distanceKm = calculateHaversineDistance(
      serviceLat,
      serviceLng,
      worker.latitude || 30.7333,
      worker.longitude || 76.7794
    );

    // 1. Initiate Secure Order via Server-Side API
    const orderRes = await initiatePaymentOrder({
      amount: totalPayable,
      paymentMethod: paymentMethod.toLowerCase() as any,
      customerName: clientName,
      customerPhone: clientPhone,
      bookingId: `bk_${Date.now().toString(36)}`,
    });

    if (!orderRes.success || !orderRes.order) {
      setIsProcessingPayment(false);
      setPaymentError(orderRes.error || "Payment order creation failed. Please try again.");
      return;
    }

    setIsSandboxMode(orderRes.order.isTestMode);

    // 2. Server-side payment verification (Sandbox or Live HMAC)
    const verifyRes = await verifyPaymentTransaction({
      paymentId: orderRes.order.id,
      providerOrderId: orderRes.order.providerOrderId,
      providerPaymentId: `pay_${Date.now()}`,
      isTestMode: orderRes.order.isTestMode,
    });

    const finalTxnId = verifyRes.paymentRecord?.providerPaymentId || orderRes.order.id;
    setTransactionId(finalTxnId);

    // 3. Persist real booking to Supabase `bookings` table
    createBookingInDb({
      customerId,
      workerId: worker.id,
      serviceName: worker.occupation || "Home Service",
      customerName: clientName,
      customerPhone: clientPhone,
      customerAddress: clientAddress,
      serviceLatitude: serviceLat,
      serviceLongitude: serviceLng,
      distanceKm: distanceKm,
      problemDescription: customNotes,
      scheduledDate: preferredDate,
      scheduledTime: preferredSlot,
      visitingFee: totalPayable,
      isFeePaid: true,
      notes: customNotes,
    }).then((res) => {
      if (res.data?.id) {
        setActiveBookingId(res.data.id);
      }
    }).catch((e) => console.warn("Supabase booking creation notice:", e));

    const newBooking = saveBooking({
      workerId: worker.id,
      workerName: worker.name,
      occupation: worker.occupation,
      clientName,
      clientPhone,
      clientAddress,
      serviceType: `${worker.occupation} - ${preferredSlot}`,
      bookingDate: `${preferredDate}, ${preferredSlot}`,
      status: "Confirmed",
      visitFeePaid: true,
      visitFeeAmount: totalPayable,
      arrivalOtp: "4821",
    });

    setActiveBookingId(newBooking.id);

    // 4. Instant Notifications for Customer & Artisan
    notifyBookingCreated({
      bookingId: newBooking.id,
      serviceName: worker.occupation,
      workerName: worker.name,
      scheduledTime: `${preferredDate}, ${preferredSlot}`,
    }).catch(() => {});

    notifyNewJobRequest({
      workerId: worker.id,
      customerName: clientName,
      serviceType: worker.occupation,
      address: clientAddress,
      offeredFee: totalPayable,
      bookingId: newBooking.id,
    }).catch(() => {});

    setIsProcessingPayment(false);
    setStep("CONFIRMED");
  };

  const handleDownloadInvoice = () => {
    const invoiceContent = `
=====================================================
SKILL-LINK COOPERATIVE SERVICES PLATFORM
Ministry of Cooperation Certified Gig Ecosystem
Invoice Reference: INV-${activeBookingId || "9941"}
Date: ${new Date().toLocaleString("en-IN")}
=====================================================
Cooperative Society: ${worker.cooperativeSociety || "Tricity Labour & Household Services Cooperative Society Ltd."}
Society Reg No: ${worker.cooperativeMemberId || "TLCS-2022-041"}

Customer Name:    ${clientName || "Customer"}
Customer Phone:   ${clientPhone || "Phone"}
Service Address:  ${clientAddress || "Address On File"}
Assigned Artisan: ${worker.name} (${worker.occupation})

LINE ITEMS:
1. Doorstep Inspection & Visit Fee:        ₹${visitFee}.00
2. 3% Cooperative Worker Welfare Cess:     ₹${welfareCess}
3. Platform Facilitation Commission:       ₹0.00 (Coop 0% Cut)
-----------------------------------------------------
TOTAL AMOUNT PAID:                         ₹${totalPayable}.00
Payment Mode:                              ${paymentMethod} (${isSandboxMode ? "Sandbox Test Verified" : "Live Escrow"})
Transaction Ref:                           ${transactionId || `TXN-${Date.now()}`}
Tax Status:                                Society Cess Exempt
=====================================================
Thank you for supporting Labour Cooperative Societies!
    `.trim();

    const blob = new Blob([invoiceContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SkillLink_Receipt_${activeBookingId || "INV"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in text-slate-900">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1">
              <Building className="w-3 h-3" />
              Cooperative Certified Booking &amp; Escrow
            </span>
            <h3 className="text-base font-bold text-slate-900">
              {step === "SCHEDULE" && "Schedule Service & Slot"}
              {step === "PAYMENT" && "Digital Payment & Welfare Breakdown"}
              {step === "CONFIRMED" && "Booking Confirmed & Dispatched"}
              {step === "FEEDBACK" && "Rate Service & Download Invoice"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: SCHEDULE & CONTACT DETAILS */}
        {step === "SCHEDULE" && (
          <form onSubmit={handleProceedToPayment} className="space-y-4 pt-3">
            {/* Selected Worker Mini-Card */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <img
                src={worker.avatarUrl || worker.avatar || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150"}
                alt={worker.name}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-slate-900">{worker.name}</h4>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Coop Verified
                  </span>
                </div>
                <p className="text-xs text-blue-600 font-semibold">{worker.occupation}</p>
                <p className="text-[11px] text-slate-500 truncate">{worker.cooperativeSociety || worker.location}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Pooja Sharma"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="e.g. 9814022910"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold uppercase text-slate-600">
                  Service Address &amp; Sector
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={async () => {
                      setIsLocating(true);
                      const res = await getBrowserLocation();
                      setIsLocating(false);
                      if (res.location) {
                        setServiceLat(res.location.lat);
                        setServiceLng(res.location.lng);
                        setClientAddress(res.location.address);
                      }
                    }}
                    disabled={isLocating}
                    className="text-[10px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <Navigation className="w-2.5 h-2.5" />
                    {isLocating ? "Locating..." : "Auto GPS"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMap(!showMap)}
                    className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <MapPin className="w-2.5 h-2.5 text-emerald-600" />
                    {showMap ? "Hide Map" : "Pin on Map"}
                  </button>
                </div>
              </div>
              <input
                type="text"
                required
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                placeholder="e.g. House 412, Sector 18-B, Chandigarh"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:border-blue-500"
              />

              {/* Interactive Map Picker & Distance Preview */}
              {showMap && (
                <div className="mt-2.5 space-y-1.5 animate-in fade-in duration-200">
                  <SkillLinkMap
                    center={{ lat: serviceLat, lng: serviceLng }}
                    zoom={13}
                    height="200px"
                    interactiveSelect={true}
                    onLocationSelect={async (pos) => {
                      setServiceLat(pos.lat);
                      setServiceLng(pos.lng);
                      const addr = await reverseGeocode(pos.lat, pos.lng);
                      setClientAddress(addr);
                    }}
                    markers={[
                      {
                        id: "client-pin",
                        lat: serviceLat,
                        lng: serviceLng,
                        title: "Your Service Location",
                        isCustomer: true,
                      },
                      {
                        id: worker.id,
                        lat: worker.latitude || 30.7333,
                        lng: worker.longitude || 76.7794,
                        title: worker.name,
                        subtitle: worker.occupation,
                        rating: worker.rating,
                        distanceKm: calculateHaversineDistance(
                          serviceLat,
                          serviceLng,
                          worker.latitude || 30.7333,
                          worker.longitude || 76.7794
                        ),
                      },
                    ]}
                  />
                  <div className="flex items-center justify-between text-[10px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                    <span className="flex items-center gap-1 text-slate-700 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Technician Distance:{" "}
                      <strong>
                        {calculateHaversineDistance(
                          serviceLat,
                          serviceLng,
                          worker.latitude || 30.7333,
                          worker.longitude || 76.7794
                        )}{" "}
                        km
                      </strong>{" "}
                      (~
                      {estimateTravelTimeMinutes(
                        calculateHaversineDistance(
                          serviceLat,
                          serviceLng,
                          worker.latitude || 30.7333,
                          worker.longitude || 76.7794
                        )
                      )}{" "}
                      min ETA)
                    </span>
                    <span className="text-blue-600 font-medium">Tap map to drag pin</span>
                  </div>
                </div>
              )}
            </div>

            {/* Date & Time Slot Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  Preferred Date
                </label>
                <select
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value="Today (ASAP)">Today (ASAP Dispatch)</option>
                  <option value="Tomorrow">Tomorrow</option>
                  <option value="This Weekend">This Weekend</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  Preferred Time Slot
                </label>
                <select
                  value={preferredSlot}
                  onChange={(e) => setPreferredSlot(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value="Within 45 Mins">Within 45 Mins (Immediate)</option>
                  <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</option>
                  <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM</option>
                  <option value="05:00 PM - 07:00 PM">05:00 PM - 07:00 PM</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Describe Problem or Specific Notes
              </label>
              <textarea
                rows={2}
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="e.g. Water leaking under the washbasin pipe..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
            >
              <span>Continue to Payment (₹{totalPayable})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STEP 2: PAYMENT & 3% COOPERATIVE WELFARE BREAKDOWN */}
        {step === "PAYMENT" && (
          <div className="space-y-4 pt-3">
            {/* Price Itemized Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Standard Doorstep Visit &amp; Inspection</span>
                <span className="font-bold text-slate-900">₹{visitFee}.00</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span className="flex items-center gap-1">
                  <HeartHandshake className="w-3.5 h-3.5" />
                  3% Cooperative Worker Welfare Pool
                </span>
                <span className="font-bold">+ ₹{welfareCess}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Commercial Platform Commission</span>
                <span className="font-bold text-emerald-600">₹0.00 (Coop 100% Fair Wage)</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-slate-900 text-sm">
                <span>Total Due Now</span>
                <span className="text-blue-600">₹{totalPayable}</span>
              </div>
            </div>

            {/* Sandbox / Test Mode Banner */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span className="font-bold">
                  {isSandboxMode ? "🧪 Sandbox Test Payment Active" : "🔒 Live Encrypted Escrow"}
                </span>
              </div>
              <span className="text-[10px] font-semibold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded">
                {isSandboxMode ? "Zero Real Money Charged" : "SSL Verified"}
              </span>
            </div>

            {paymentError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold">
                {paymentError}
              </div>
            )}

            {/* Payment Method Selector (4 Options: UPI, Card, NetBanking, Cash) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Select Payment Mode
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("UPI")}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    paymentMethod === "UPI"
                      ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" /> UPI / QR
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("CARD")}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    paymentMethod === "CARD"
                      ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" /> Cards
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("NETBANKING")}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    paymentMethod === "NETBANKING"
                      ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Building className="w-3.5 h-3.5" /> NetBanking
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("CASH")}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    paymentMethod === "CASH"
                      ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <IndianRupee className="w-3.5 h-3.5" /> Cash
                </button>
              </div>
            </div>

            {/* UPI Option Preview */}
            {paymentMethod === "UPI" && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
                <div className="w-28 h-28 bg-white border-2 border-slate-300 rounded-xl mx-auto flex items-center justify-center p-2 shadow-inner">
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=upi://pay?pa=coop.skilllink@sbi&pn=SkillLinkCoop&am=153.50&cu=INR"
                    alt="UPI QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-[11px] text-slate-600 font-mono">
                  GPay • PhonePe • Paytm • BHIM | UPI ID: <span className="font-bold">coop.skilllink@sbi</span>
                </p>
              </div>
            )}

            {/* Card Option Preview */}
            {paymentMethod === "CARD" && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                <div className="flex justify-between items-center text-[11px] text-slate-500">
                  <span>RuPay / Visa / Mastercard / Maestro</span>
                  <span className="font-mono text-emerald-700 font-bold">Sandbox Test Enabled</span>
                </div>
                <input
                  type="text"
                  disabled
                  value="4000 0000 0000 0002 (Razorpay Test Card)"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono text-xs text-slate-700"
                />
                <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                  <input
                    type="text"
                    disabled
                    value="Exp: 12/28"
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700"
                  />
                  <input
                    type="text"
                    disabled
                    value="CVV: 123"
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700"
                  />
                </div>
              </div>
            )}

            {/* NetBanking Option Preview */}
            {paymentMethod === "NETBANKING" && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                <div className="text-[11px] font-bold text-slate-600">Select Partner Indian Bank:</div>
                <div className="grid grid-cols-3 gap-1.5 text-[11px] font-semibold">
                  <span className="p-2 bg-white border border-blue-200 rounded-lg text-center text-blue-700 font-bold">
                    SBI
                  </span>
                  <span className="p-2 bg-white border border-slate-200 rounded-lg text-center text-slate-700">
                    HDFC
                  </span>
                  <span className="p-2 bg-white border border-slate-200 rounded-lg text-center text-slate-700">
                    ICICI
                  </span>
                </div>
              </div>
            )}

            {/* Cash on Visit Preview */}
            {paymentMethod === "CASH" && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed">
                💵 Pay ₹{totalPayable} directly to the verified artisan upon doorstep arrival. The 3% social security welfare pool is automatically settled by the cooperative society.
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setStep("SCHEDULE")}
                disabled={isProcessingPayment}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmBookingPayment}
                disabled={isProcessingPayment}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessingPayment ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Verifying Escrow Payment...</span>
                  </>
                ) : (
                  <span>
                    Pay ₹{totalPayable} &amp; Dispatch Worker
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: BOOKING CONFIRMED */}
        {step === "CONFIRMED" && (
          <div className="space-y-4 pt-4 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Dispatch Order Created
              </span>
              <h4 className="text-lg font-bold text-slate-900 mt-1">Booking Confirmed!</h4>
              <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                <span className="font-semibold text-slate-900">{worker.name}</span> has accepted your request. Arriving in ~{preferredSlot.toLowerCase()}.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Booking ID:</span>
                <span className="font-mono font-bold text-slate-900">{activeBookingId || "BK-4412"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Scheduled For:</span>
                <span className="font-semibold text-slate-800">{preferredDate}, {preferredSlot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Worker Contact:</span>
                <span className="font-semibold text-slate-800">{worker.phone}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Payment Status:</span>
                <span className="font-bold text-emerald-700">
                  ₹{totalPayable}.00 Verified ({isSandboxMode ? "Sandbox Test" : "Escrow"})
                </span>
              </div>
              {transactionId && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction Ref:</span>
                  <span className="font-mono text-[11px] text-blue-700 font-semibold">{transactionId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">3% Welfare Pool:</span>
                <span className="font-semibold text-emerald-700">+₹{welfareCess} Credited</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={handleDownloadInvoice}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Download Society Invoice</span>
              </button>

              <button
                type="button"
                onClick={() => setStep("FEEDBACK")}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                Rate &amp; Review
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: RATE & REVIEW (SIH Feature 9) */}
        {step === "FEEDBACK" && (
          <div className="space-y-4 pt-3 text-center">
            <div>
              <h4 className="text-base font-bold text-slate-900">How was your service experience?</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Your rating helps {worker.name} maintain top cooperative trust standing.
              </p>
            </div>

            {/* Star Rating */}
            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-300"
                    }`}
                  />
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Write a quick note on punctuality, quality, and behavior..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:border-blue-500 text-slate-900"
            />

            {feedbackSubmitted ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200">
                ✓ Thank you! Feedback recorded in Cooperative Registry.
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setFeedbackSubmitted(true);
                  if (activeBookingId) {
                    updateBookingStatusInDb(activeBookingId, "completed", { finalAmount: totalPayable });
                  }
                  setTimeout(() => {
                    if (activeBookingId) onSuccess(activeBookingId);
                    onClose();
                  }, 1200);
                }}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                Submit Feedback &amp; Finish
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

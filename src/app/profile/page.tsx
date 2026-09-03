"use client";

import React, { useState, useEffect } from "react";
import {
  getStoredBookings,
  getStoredWorkers,
  getStoredEstimates,
  saveWorkEstimate,
  updateEstimateStatus,
  getStoredDisputes,
  saveDispute,
  updateBookingPhoto,
  WorkEstimate,
  DisputeRecord,
} from "@/lib/storage";
import { ServiceBooking, Worker } from "@/lib/seedData";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import {
  UserCheck,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Download,
  Printer,
  FileText,
  AlertTriangle,
  ChevronRight,
  Key,
  X,
  CreditCard,
  Building,
  ArrowRight,
  Phone,
  HelpCircle,
  Camera,
  Check,
} from "lucide-react";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<"BOOKINGS" | "PAYMENTS" | "DISPUTES">("BOOKINGS");
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [estimates, setEstimates] = useState<WorkEstimate[]>([]);
  const [disputes, setDisputes] = useState<DisputeRecord[]>([]);

  // Selected Booking for Invoice Viewer
  const [invoiceBooking, setInvoiceBooking] = useState<ServiceBooking | null>(null);

  // Selected Booking for Dispute Modal
  const [disputeBooking, setDisputeBooking] = useState<ServiceBooking | null>(null);
  const [disputeReason, setDisputeReason] = useState("POOR_SERVICE_QUALITY");
  const [disputeDesc, setDisputeDesc] = useState("");

  // Photo upload
  const [uploadingBookingId, setUploadingBookingId] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [finalBill, setFinalBill] = useState<number>(499);

  const refreshData = () => {
    const bks = getStoredBookings();
    setBookings(bks);
    setEstimates(getStoredEstimates());
    setDisputes(getStoredDisputes());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleApproveEstimate = (bookingId: string) => {
    const est = estimates.find((e) => e.bookingId === bookingId);
    if (est) {
      updateEstimateStatus(est.id, "approved");
    }
    // Update local booking status to Estimate-Approved / In-Progress
    const bks = getStoredBookings();
    const idx = bks.findIndex((b) => b.id === bookingId);
    if (idx !== -1) {
      bks[idx].status = "In-Progress";
      bks[idx].estimateStatus = "approved";
      localStorage.setItem("skilllink_bookings_coop_v1", JSON.stringify(bks));
    }
    refreshData();
  };

  const handleDeclineEstimate = (bookingId: string) => {
    const est = estimates.find((e) => e.bookingId === bookingId);
    if (est) {
      updateEstimateStatus(est.id, "declined");
    }
    const bks = getStoredBookings();
    const idx = bks.findIndex((b) => b.id === bookingId);
    if (idx !== -1) {
      bks[idx].status = "Cancelled";
      bks[idx].estimateStatus = "declined";
      localStorage.setItem("skilllink_bookings_coop_v1", JSON.stringify(bks));
    }
    refreshData();
  };

  const handleFileDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeBooking || !disputeDesc.trim()) return;

    saveDispute({
      bookingId: disputeBooking.id,
      raisedBy: "customer",
      reason: disputeReason,
      description: disputeDesc.trim(),
    });

    // Mark booking as disputed
    const bks = getStoredBookings();
    const idx = bks.findIndex((b) => b.id === disputeBooking.id);
    if (idx !== -1) {
      bks[idx].status = "Disputed";
      bks[idx].disputeStatus = "UNDER_REVIEW";
      bks[idx].disputeReason = disputeReason;
      localStorage.setItem("skilllink_bookings_coop_v1", JSON.stringify(bks));
    }

    setDisputeBooking(null);
    setDisputeDesc("");
    refreshData();
    setActiveTab("DISPUTES");
  };

  const handleSavePhotoProof = (bookingId: string) => {
    if (photoPreview) {
      updateBookingPhoto(bookingId, photoPreview, finalBill);
      setUploadingBookingId(null);
      setPhotoPreview(null);
      refreshData();
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 pb-24 text-slate-900 min-h-screen bg-slate-50/60">
      <Header activeSection="PROFILE" />

      <div className="max-w-5xl mx-auto px-4 space-y-6">
        {/* User Profile Banner & High-Level Metrics */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Customer Portal &amp; Protected Orders
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verified Cooperative Appointments, Final Estimates &amp; Service Invoices
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Protected Escrow-Style Billing</span>
              </span>
            </div>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Scheduled Bookings</span>
              <span className="text-base font-extrabold text-slate-900 mt-0.5 block">{bookings.length}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Initial Visit Fees Paid</span>
              <span className="text-base font-extrabold text-slate-900 mt-0.5 block">
                ₹{bookings.reduce((sum, b) => sum + (b.visitFeeAmount || 154), 0)}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Welfare Cess (3%)</span>
              <span className="text-base font-extrabold text-emerald-700 mt-0.5 block">
                ₹{Math.round(bookings.length * 4.5)}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Active Disputes</span>
              <span className="text-base font-extrabold text-amber-700 mt-0.5 block">{disputes.length}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab("BOOKINGS")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === "BOOKINGS"
                ? "border-blue-600 text-blue-700 bg-white shadow-xs rounded-t-xl"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Active &amp; Scheduled Bookings ({bookings.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("PAYMENTS")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === "PAYMENTS"
                ? "border-blue-600 text-blue-700 bg-white shadow-xs rounded-t-xl"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Payment History &amp; Invoices</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("DISPUTES")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === "DISPUTES"
                ? "border-blue-600 text-blue-700 bg-white shadow-xs rounded-t-xl"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Disputes &amp; Support ({disputes.length})</span>
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: ACTIVE & SCHEDULED BOOKINGS                                  */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "BOOKINGS" && (
          <div className="space-y-4">
            {bookings.length === 0 ? (
              <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-2">
                <Clock className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800">No bookings scheduled yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Browse verified artisans on the Skill-Link marketplace to book doorstep inspections with transparent visiting charges.
                </p>
              </div>
            ) : (
              bookings.map((b) => {
                const bookingEstimate = estimates.find((e) => e.bookingId === b.id);
                const hasPendingEstimate =
                  b.status === "Estimate-Pending" ||
                  (bookingEstimate && bookingEstimate.status === "pending");

                return (
                  <div
                    key={b.id}
                    className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 transition-all"
                  >
                    {/* Booking Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">{b.serviceType}</h3>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                              b.status === "Completed"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                : b.status === "Disputed"
                                ? "bg-rose-50 text-rose-700 border-rose-300"
                                : "bg-blue-50 text-blue-700 border-blue-300"
                            }`}
                          >
                            {b.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 font-mono">
                          Order ID: <strong>{b.id}</strong> • Artisan: <span className="font-semibold text-slate-800">{b.workerName}</span> ({b.occupation})
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">
                          Inspection Visiting Charge
                        </span>
                        <span className="text-sm font-extrabold text-slate-900">
                          ₹{b.visitFeeAmount || 154} (Authorized)
                        </span>
                      </div>
                    </div>

                    {/* Stage 1: Doorstep Arrival OTP Banner (Part 19) */}
                    {(b.status === "Confirmed" || b.status === "En-Route" || b.status === "Pending") && (
                      <div className="p-3.5 bg-blue-50/80 rounded-xl border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-start gap-2.5">
                          <Key className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-blue-900 block">
                              Doorstep Arrival Confirmation OTP: <strong className="font-mono text-sm bg-white px-2 py-0.5 rounded border border-blue-300 ml-1">4821</strong>
                            </span>
                            <span className="text-[11px] text-blue-700 mt-0.5 block">
                              Share this 4-digit OTP only after the verified artisan physically reaches your doorstep. This prevents false arrival claims.
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold text-blue-800 bg-white px-2.5 py-1 rounded-lg border border-blue-200 self-start sm:self-auto shrink-0">
                          Protected Step
                        </span>
                      </div>
                    )}

                    {/* Stage 2: Itemized Work Estimate Review & Approval (Part 15 & 16) */}
                    {hasPendingEstimate && (
                      <div className="p-4 bg-amber-50 rounded-xl border border-amber-300 space-y-3 animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                              Artisan Work Estimate Requires Your Approval
                            </h4>
                          </div>
                          <span className="text-[10px] font-bold text-amber-800 bg-white px-2 py-0.5 rounded border border-amber-300">
                            Estimate Pending
                          </span>
                        </div>

                        <p className="text-xs text-amber-800 leading-relaxed">
                          Your artisan has inspected the issue and proposed the following itemized bill. The artisan will not begin billable work until you approve this quote.
                        </p>

                        <div className="p-3 bg-white rounded-lg border border-amber-200 text-xs space-y-1.5">
                          <div className="flex justify-between text-slate-600">
                            <span>Initial Visiting &amp; Inspection Charge:</span>
                            <span className="font-mono font-semibold">₹149</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Labor &amp; Service Charge:</span>
                            <span className="font-mono font-semibold">₹{bookingEstimate?.laborCost || 500}</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Parts / Materials Required:</span>
                            <span className="font-mono font-semibold">₹{bookingEstimate?.materialsCost || 250}</span>
                          </div>
                          <div className="flex justify-between text-slate-900 font-bold pt-1.5 border-t border-slate-100 text-sm">
                            <span>Total Estimated Payable:</span>
                            <span className="font-mono text-emerald-700">
                              ₹{(bookingEstimate?.totalEstimatedAmount || 899)}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleApproveEstimate(b.id)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve Estimate &amp; Start Work</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => alert("Please call artisan to discuss revision: " + b.workerName)}
                            className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-colors"
                          >
                            ✎ Request Changes
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeclineEstimate(b.id)}
                            className="px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs rounded-xl border border-rose-300 transition-colors"
                          >
                            ✕ Decline Work
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Completion Photo & Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="flex items-center gap-2">
                        {b.status === "Completed" && (
                          <button
                            type="button"
                            onClick={() => setInvoiceBooking(b)}
                            className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition-colors flex items-center gap-1.5"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View Service Invoice</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setDisputeBooking(b)}
                          className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-600 hover:text-rose-700 font-semibold text-xs rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                          <span>Report Issue / Dispute</span>
                        </button>
                      </div>

                      <div className="text-xs text-slate-500">
                        Scheduled: <span className="font-semibold text-slate-700">{b.bookingDate}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: PAYMENT HISTORY & SERVICE INVOICES (Part 23 & 24)           */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "PAYMENTS" && (
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  Service Payment History &amp; Official Invoices
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Download or print verified tax-compliant receipts and cooperative settlement vouchers.
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
              {bookings.map((b) => (
                <div
                  key={b.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-700">#{b.id}</span>
                      <span className="font-bold text-slate-900">{b.serviceType}</span>
                    </div>
                    <p className="text-slate-500 text-[11px]">
                      Technician: <strong className="text-slate-700">{b.workerName}</strong> • Date: {b.bookingDate}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 sm:text-right">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Paid</span>
                      <span className="font-bold text-slate-900 text-sm">
                        ₹{b.finalBillAmount || b.visitFeeAmount || 154}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setInvoiceBooking(b)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Invoice</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 3: DISPUTES & COOPERATIVE RESOLUTION (Part 21)                  */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "DISPUTES" && (
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Dispute Review &amp; Customer Protection
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Disputed payments remain locked on the platform until reviewed by your Cooperative Society Administrator.
                </p>
              </div>
            </div>

            {disputes.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-slate-800">No active disputes</h4>
                <p className="text-slate-500">All your completed bookings are in good standing.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {disputes.map((d) => (
                  <div key={d.id} className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-900 font-mono">Dispute ID: {d.id}</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold text-[10px]">
                        {d.status}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">
                      <strong>Reason:</strong> {d.reason.replace(/_/g, " ")} — &ldquo;{d.description}&rdquo;
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Filed on: {d.createdAt} • A cooperative administrator will contact you within 24 hours.
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── MODAL: PROFESSIONAL SERVICE INVOICE (Part 24) ───────────────── */}
      {invoiceBooking && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
            {/* Invoice Top Action Bar */}
            <div className="px-5 py-3 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <span className="text-xs font-bold font-mono">Invoice #{invoiceBooking.id}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInvoiceBooking(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs text-slate-800 bg-white">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-lg font-black tracking-tight text-blue-600">SKILL-LINK</h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Cooperative Skilled Marketplace Federation
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">Reg: COOP-PB-4402/2021</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900 uppercase">Tax Invoice</span>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">Date: {invoiceBooking.bookingDate}</p>
                </div>
              </div>

              {/* Customer & Technician Info */}
              <div className="grid grid-cols-2 gap-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Customer Details</span>
                  <strong className="text-slate-900 block mt-0.5">{invoiceBooking.clientName || "Valued Customer"}</strong>
                  <span className="text-slate-600 font-mono text-[11px]">{invoiceBooking.clientPhone || "+91 98000 00000"}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Verified Technician</span>
                  <strong className="text-slate-900 block mt-0.5">{invoiceBooking.workerName}</strong>
                  <span className="text-slate-600 text-[11px]">{invoiceBooking.occupation}</span>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 text-[11px] text-slate-600 uppercase font-bold">
                    <tr>
                      <th className="p-2.5">Service Description</th>
                      <th className="p-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-2.5">Initial Visiting &amp; Doorstep Diagnostic Charge</td>
                      <td className="p-2.5 text-right font-mono">₹149.00</td>
                    </tr>
                    <tr>
                      <td className="p-2.5">3% PMSBY Cooperative Social Security Pool</td>
                      <td className="p-2.5 text-right font-mono">₹4.50</td>
                    </tr>
                    <tr>
                      <td className="p-2.5">Skilled Labor / Service Repair Execution</td>
                      <td className="p-2.5 text-right font-mono">
                        ₹{invoiceBooking.finalBillAmount ? invoiceBooking.finalBillAmount - 154 : 450}.00
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-sm">
                    <tr>
                      <td className="p-2.5 text-slate-900">Total Settled Amount:</td>
                      <td className="p-2.5 text-right font-mono text-emerald-700">
                        ₹{invoiceBooking.finalBillAmount || 603}.50
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Payment Proof Confirmation */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold">Payment Status: Verified &amp; Settled</span>
                </div>
                <span className="font-mono text-[11px] font-bold">UPI / Card Gateway</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: FILE DISPUTE (Part 21) ────────────────────────────────── */}
      {disputeBooking && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Raise Issue / Dispute</h3>
                <p className="text-xs text-slate-500">Order #{disputeBooking.id}</p>
              </div>
            </div>

            <form onSubmit={handleFileDispute} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-600 block mb-1">Reason for Dispute</label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none"
                >
                  <option value="WORKER_DID_NOT_ARRIVE">Worker did not arrive</option>
                  <option value="WORKER_ARRIVED_NO_WORK">Worker arrived but refused work</option>
                  <option value="INCORRECT_AMOUNT">Incorrect estimate or charged excess</option>
                  <option value="POOR_SERVICE_QUALITY">Poor service quality / problem recurred</option>
                  <option value="WORK_NOT_COMPLETED">Work left incomplete</option>
                  <option value="PAYMENT_ISSUE">Payment gateway error</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Problem Details</label>
                <textarea
                  value={disputeDesc}
                  onChange={(e) => setDisputeDesc(e.target.value)}
                  placeholder="Describe what occurred with as much detail as possible..."
                  rows={3}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none resize-none"
                />
              </div>

              <p className="text-[11px] text-slate-500">
                ℹ️ Once submitted, funds remain protected on the platform and a cooperative mediator will inspect the job report.
              </p>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDisputeBooking(null)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Submit Dispute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomNav activeSection="PROFILE" />
    </div>
  );
}

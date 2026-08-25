"use client";

import React, { useState } from "react";
import { Worker } from "../lib/seedData";
import { saveBooking, updateBookingPhoto } from "../lib/storage";
import { CheckCircle2, QrCode, Upload, ShieldCheck, IndianRupee, Sparkles, ArrowRight, Camera, X } from "lucide-react";

interface PaymentModalProps {
  worker: Worker | null;
  onClose: () => void;
  onSuccess: (bookingId: string) => void;
}

export default function PaymentModal({ worker, onClose, onSuccess }: PaymentModalProps) {
  const [step, setStep] = useState<"VISIT_FEE" | "CONFIRMED" | "POST_SERVICE">("VISIT_FEE");
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "CASH">("UPI");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [finalBill, setFinalBill] = useState<number>(499);

  if (!worker) return null;

  const handlePayVisitFee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientPhone) {
      alert("Please provide your name and contact phone number.");
      return;
    }

    const newBooking = saveBooking({
      workerId: worker.id,
      workerName: worker.name,
      occupation: worker.occupation,
      clientName,
      clientPhone,
      serviceType: `${worker.occupation} Home Inspection`,
      bookingDate: new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "Confirmed",
      visitFeePaid: true,
      visitFeeAmount: 149,
    });

    setActiveBookingId(newBooking.id);
    setStep("CONFIRMED");
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

  const handleCompleteService = () => {
    if (activeBookingId) {
      updateBookingPhoto(activeBookingId, photoPreview || "", finalBill);
      onSuccess(activeBookingId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-lg glass-panel-3d bg-slate-950 border border-white/20 rounded-3xl p-6 shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {step === "VISIT_FEE" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-emerald-400 to-cyan-300 p-0.5 shadow-md flex items-center justify-center text-slate-950 font-black">
                <IndianRupee className="w-6 h-6 text-slate-950" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Book Inspection Visit</h3>
                <p className="text-xs text-slate-400 font-medium">
                  Fixed Pre-Service Inspection Guarantee Fee
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-cyan-300 font-black">
                    Technician Allocated
                  </span>
                  <h4 className="text-lg font-black text-white flex items-center gap-2 mt-0.5">
                    {worker.name}
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                      {worker.occupation}
                    </span>
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Visit Fee</span>
                  <span className="text-2xl font-black text-emerald-400">₹149</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 mt-3 pt-3 border-t border-white/10 flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Fee deducted from final bill upon completion of service.
              </p>
            </div>

            <form onSubmit={handlePayVisitFee} className="space-y-3">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Priyanshu Sharma"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="e.g. +91 98765 12345"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-1">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("UPI")}
                    className={`py-3 px-4 rounded-2xl border font-black text-xs flex items-center justify-center gap-2 transition-all ${
                      paymentMethod === "UPI"
                        ? "bg-indigo-950 border-indigo-500 text-cyan-300 shadow-md ring-2 ring-indigo-500/40"
                        : "bg-slate-900 border-white/10 text-slate-400"
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-cyan-400" /> Instant UPI / GPay
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("CASH")}
                    className={`py-3 px-4 rounded-2xl border font-black text-xs flex items-center justify-center gap-2 transition-all ${
                      paymentMethod === "CASH"
                        ? "bg-emerald-950 border-emerald-500 text-emerald-300 shadow-md ring-2 ring-emerald-500/40"
                        : "bg-slate-900 border-white/10 text-slate-400"
                    }`}
                  >
                    <IndianRupee className="w-4 h-4 text-emerald-400" /> Pay Cash on Arrival
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 btn-3d-emerald-shine text-xs font-black shine-overlay mt-2"
              >
                Confirm Booking & Pay ₹149 <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {step === "CONFIRMED" && (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.5)] border border-emerald-500/40">
              <CheckCircle2 className="w-10 h-10 animate-bounce text-emerald-400" />
            </div>

            <h3 className="text-2xl font-black text-white">
              Booking Confirmed!
            </h3>
            <p className="text-xs text-slate-300 max-w-xs mx-auto font-medium">
              <span className="font-bold text-cyan-300">{worker.name}</span> has been dispatched. Expected arrival in <span className="font-black text-white">25 minutes</span>.
            </p>

            <button
              onClick={() => setStep("POST_SERVICE")}
              className="w-full py-3.5 btn-3d-tactile text-xs font-black mt-4"
            >
              Simulate Job Completion & Post Photo <Camera className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === "POST_SERVICE" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                <Camera className="w-5 h-5 text-cyan-300" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Work Completion Proof</h3>
                <p className="text-xs text-slate-400">Upload work photo and clear remaining bill</p>
              </div>
            </div>

            <div className="border-2 border-dashed border-white/20 hover:border-indigo-500 rounded-2xl p-4 text-center cursor-pointer bg-slate-900 relative overflow-hidden">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              {photoPreview ? (
                <div className="relative">
                  <img src={photoPreview} alt="Work Proof" className="w-full h-36 object-cover rounded-xl shadow-md" />
                  <span className="absolute bottom-2 right-2 bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Photo Attached
                  </span>
                </div>
              ) : (
                <div className="py-4 flex flex-col items-center gap-1 text-slate-400">
                  <Upload className="w-8 h-8 text-cyan-400 animate-pulse" />
                  <span className="text-xs font-black text-white">Click or Drag Work Photo</span>
                  <span className="text-[10px] text-slate-400">Captures proof before final payment</span>
                </div>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between border border-white/10">
              <div className="space-y-1">
                <span className="text-[10px] text-cyan-300 uppercase font-black tracking-wider">
                  Final Work Invoice
                </span>
                <div className="text-xs text-slate-300">
                  Total Cost: <span className="font-black text-white">₹{finalBill}</span>
                </div>
                <div className="text-xs text-emerald-400 font-bold">
                  Pre-Paid Fee Deducted: -₹149
                </div>
                <div className="text-base font-black text-amber-300">
                  Net Balance: ₹{finalBill - 149}
                </div>
              </div>

              <div className="w-20 h-20 bg-white p-2 rounded-xl shadow-2xl flex flex-col items-center justify-center border-2 border-emerald-400">
                <QrCode className="w-14 h-14 text-slate-950" />
              </div>
            </div>

            <button
              onClick={handleCompleteService}
              className="w-full py-3.5 btn-3d-emerald-shine text-xs font-black shine-overlay"
            >
              Finish Job & Save Receipt <Sparkles className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

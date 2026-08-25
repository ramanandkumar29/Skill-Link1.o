"use client";

import React, { useState, useEffect } from "react";
import { DEFAULT_WORKERS, Worker } from "@/lib/seedData";
import { saveBooking } from "@/lib/storage";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Zap, AlertTriangle, ShieldCheck, Clock, CheckCircle2, MapPin, PhoneCall, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function QuickFixPage() {
  const [isSearching, setIsSearching] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const [matchedWorker, setMatchedWorker] = useState<Worker | null>(null);
  const [emergencyType, setEmergencyType] = useState<string>("Pipe Burst / Major Leakage");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const emergencyOptions = [
    { label: "Pipe Burst / Major Leakage", icon: "💧" },
    { label: "Main Power Trip / Wiring Burn", icon: "⚡" },
    { label: "Gas Leakage / Heater Failure", icon: "🔥" },
    { label: "Lockout / Door Fitting", icon: "🔐" },
  ];

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSearching && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (isSearching && countdown === 0) {
      const worker = DEFAULT_WORKERS.find((w) => w.isAvailable) || DEFAULT_WORKERS[0];
      setMatchedWorker(worker);
      setIsSearching(false);
    }
    return () => clearInterval(timer);
  }, [isSearching, countdown]);

  const handleTriggerSOS = () => {
    setIsSearching(true);
    setCountdown(15);
    setMatchedWorker(null);
    setBookingConfirmed(false);
  };

  const handleConfirmEmergencyBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedWorker || !clientName || !clientPhone) return;

    saveBooking({
      workerId: matchedWorker.id,
      workerName: matchedWorker.name,
      occupation: matchedWorker.occupation,
      clientName,
      clientPhone,
      serviceType: `EMERGENCY SOS: ${emergencyType}`,
      bookingDate: new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "In-Progress",
      visitFeePaid: true,
      visitFeeAmount: 149,
      emergencySos: true,
    });

    setBookingConfirmed(true);
  };

  return (
    <div className="space-y-6 pb-20">
      <Header activeSection="QUICKFIX" />

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Banner */}
        <div className="glass-panel-3d p-6 sm:p-8 text-white rounded-3xl relative overflow-hidden border border-rose-500/40 shadow-2xl">
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
              <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
              24/7 SOS Emergency Priority Dispatch
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white">
              QuickFix Utility Breakdown SOS
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-xl">
              Immediate 15-minute priority dispatch for critical utility failures, pipe bursts, short circuits, or gas leakages.
            </p>
          </div>
        </div>

        {/* Emergency Category Selector */}
        <div className="glass-panel-3d p-6 border border-white/10 space-y-4">
          <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider">
            1. Select Emergency Breakdown Type
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {emergencyOptions.map((opt) => (
              <button
                key={opt.label}
                onClick={() => setEmergencyType(opt.label)}
                className={`p-4 rounded-2xl border text-xs font-black text-left flex items-center gap-3 transition-all ${
                  emergencyType === opt.label
                    ? "bg-rose-950/80 border-rose-500 text-rose-200 shadow-lg ring-2 ring-rose-500/40 scale-105"
                    : "bg-slate-900 border-white/10 text-slate-300 hover:bg-slate-800"
                }`}
              >
                <span className="text-2xl">{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>

          {/* SOS Big Pulsating Trigger */}
          {!isSearching && !matchedWorker && (
            <div className="mt-8 text-center space-y-4 py-4">
              <button
                onClick={handleTriggerSOS}
                className="w-36 h-36 rounded-full bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 text-white font-black text-lg shadow-[0_0_50px_rgba(225,29,72,0.6)] border-4 border-white/80 mx-auto flex flex-col items-center justify-center gap-1 hover:scale-105 active:scale-95 transition-transform cursor-pointer shine-overlay"
              >
                <Zap className="w-10 h-10 animate-bounce text-white" />
                <span className="text-xs uppercase tracking-wider font-black">DISPATCH SOS</span>
              </button>
              <p className="text-xs font-bold text-slate-400">
                Press to instantly broadcast SOS to 5 nearest technicians
              </p>
            </div>
          )}

          {/* Countdown */}
          {isSearching && (
            <div className="mt-8 text-center space-y-4 py-8 bg-slate-900/90 rounded-2xl border border-rose-500/40">
              <div className="w-20 h-20 rounded-full bg-rose-600 text-white flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(225,29,72,0.8)] animate-pulse">
                <Clock className="w-10 h-10 animate-spin" />
              </div>
              <h3 className="text-xl font-black text-white">
                Searching Nearby Priority Technicians...
              </h3>
              <div className="text-4xl font-black text-rose-400">{countdown}s</div>
              <p className="text-xs text-slate-400 font-medium">
                Broadcasting GPS coordinates for <span className="font-bold text-white">{emergencyType}</span>
              </p>
            </div>
          )}

          {/* Matched Worker Form */}
          {matchedWorker && !bookingConfirmed && (
            <div className="mt-6 p-5 rounded-2xl bg-slate-900 border border-indigo-500/40 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-300 bg-emerald-950 px-3 py-1 rounded-full border border-emerald-500/40 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> SOS Priority Match Found
                </span>
                <span className="text-xs font-black text-cyan-300">10 Min ETA</span>
              </div>

              <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-2xl border border-white/10">
                <img
                  src={matchedWorker.avatarUrl || matchedWorker.avatar}
                  alt={matchedWorker.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-400"
                />
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-1">
                    {matchedWorker.name}
                    <ShieldCheck className="w-4.5 h-4.5 text-cyan-400" />
                  </h3>
                  <p className="text-xs font-black text-emerald-400">{matchedWorker.occupation}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {matchedWorker.location}
                  </p>
                </div>
              </div>

              <form onSubmit={handleConfirmEmergencyBooking} className="space-y-3">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-1">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-1">
                    Mobile Number (Immediate Callback)
                  </label>
                  <input
                    type="tel"
                    required
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-2xl shadow-lg border-b-4 border-rose-950 transition-all active:translate-y-1 active:border-b-0 flex items-center justify-center gap-2"
                >
                  Confirm SOS Dispatch & Worker Call <PhoneCall className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {bookingConfirmed && matchedWorker && (
            <div className="mt-6 text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.5)] border border-emerald-500/40">
                <CheckCircle2 className="w-10 h-10 animate-bounce text-emerald-400" />
              </div>
              <h3 className="text-2xl font-black text-white">
                Technician Dispatched!
              </h3>
              <p className="text-xs text-slate-300">
                <span className="font-bold text-cyan-300">{matchedWorker.name}</span> is en route. Phone: <span className="font-bold text-white">{matchedWorker.phone}</span>.
              </p>
              <Link href="/profile" className="inline-block px-5 py-2.5 btn-3d-tactile text-xs font-black mt-2">
                View Active Dispatch Status <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>

      <BottomNav activeSection="QUICKFIX" />
    </div>
  );
}

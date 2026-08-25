"use client";

import React from "react";
import { Worker } from "../lib/seedData";
import { ShieldCheck, CheckCircle2, XCircle, X, Sparkles } from "lucide-react";

interface TrustModalProps {
  worker: Worker | null;
  onClose: () => void;
}

export default function TrustModal({ worker, onClose }: TrustModalProps) {
  if (!worker) return null;

  const { trustBreakdown, trustScore, name, badge } = worker;

  const breakdownItems = [
    {
      title: "Government Identity Verified (Aadhaar/OTP)",
      points: 40,
      verified: trustBreakdown?.identityVerified ?? true,
      description: "Biometric and Aadhaar verification linked with OTP.",
    },
    {
      title: "High Customer Rating (4.5+ Stars)",
      points: 30,
      verified: trustBreakdown?.ratingHigh ?? worker.rating >= 4.5,
      description: "Consistently rated 4.5 or higher by past clients.",
    },
    {
      title: "Completed Milestone (50+ Verified Jobs)",
      points: 20,
      verified: trustBreakdown?.jobsThreshold ?? worker.jobsCompleted >= 50,
      description: "Successfully finished over 50 jobs with zero disputes.",
    },
    {
      title: "98% On-Time Arrival Record",
      points: 10,
      verified: trustBreakdown?.onTimeRecord ?? true,
      description: "Arrives at the client location within agreed time slots.",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-md glass-panel-3d bg-slate-950 border border-white/20 rounded-3xl p-6 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-emerald-400 to-cyan-300 p-0.5 shadow-lg flex items-center justify-center text-slate-950 font-extrabold">
              <ShieldCheck className="w-7 h-7 text-slate-950" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-1.5">
                Trust Score: {trustScore}%
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Verified Profile for <span className="font-bold text-white">{name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Meter */}
        <div className="my-5 p-4 rounded-2xl bg-slate-900 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
              Verification Tier
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-black text-amber-300 bg-amber-950/80 border border-amber-400/40 rounded-full">
              <Sparkles className="w-3 h-3 text-amber-400" />
              {badge} Badge
            </span>
          </div>
          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-white/10">
            <div
              className="bg-gradient-to-r from-indigo-500 via-emerald-400 to-cyan-300 h-full rounded-full transition-all duration-700 shadow-[0_0_15px_rgba(16,185,129,0.6)]"
              style={{ width: `${trustScore}%` }}
            />
          </div>
        </div>

        {/* Breakdown Items */}
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
            Point Calculation Breakdown
          </h4>
          {breakdownItems.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900 border border-white/10"
            >
              {item.verified ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-white">{item.title}</span>
                  <span className="text-xs font-black text-cyan-300 bg-indigo-950 px-2 py-0.5 rounded-md border border-indigo-500/30">
                    +{item.points} pts
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-5 py-3.5 btn-3d-tactile text-xs font-black"
        >
          Close Modal
        </button>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { Worker } from "../lib/seedData";
import { ShieldCheck, CheckCircle2, XCircle, X } from "lucide-react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                Trust Score: {trustScore}%
              </h3>
              <p className="text-xs text-slate-500">
                Verified Profile for <span className="font-semibold text-slate-800">{name}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="py-4 space-y-2">
          <div className="flex justify-between text-xs font-semibold text-slate-700">
            <span>Overall Verification Score</span>
            <span className="text-emerald-700 font-bold">{trustScore}/100</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${trustScore}%` }}
            />
          </div>
        </div>

        {/* Breakdown Items List */}
        <div className="space-y-3 pt-1">
          {breakdownItems.map((item, i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3"
            >
              {item.verified ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                    +{item.points} pts
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Button */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
          >
            Close Trust Breakdown
          </button>
        </div>
      </div>
    </div>
  );
}

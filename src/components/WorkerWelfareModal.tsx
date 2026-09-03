"use client";

import React from "react";
import { ShieldCheck, CheckCircle2, Heart, Award, X, DollarSign, Umbrella, FileText } from "lucide-react";

interface WorkerWelfareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WorkerWelfareModal({ isOpen, onClose }: WorkerWelfareModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in text-slate-900">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                Ministry of Cooperation Model
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                Cooperative Worker Welfare &amp; Social Security Ecosystem
              </h2>
              <p className="text-xs text-slate-500">
                How Skill-Link protects gig workers through cooperative federation safety nets.
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

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Umbrella className="w-4 h-4 text-emerald-700" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">PMSBY ₹2 Lakh Accidental Cover</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every verified cooperative worker is enrolled in the Pradhan Mantri Suraksha Bima Yojana. Full coverage during travel and on-site dispatches, with annual ₹20 premium subsidized by the Cooperative Society.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                <Heart className="w-4 h-4 text-blue-700" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Instant Medical Relief Grant</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Up to ₹50,000 emergency hospitalization reimbursement for workers or their dependents, approved within 2 hours by the District Cooperative Society Board.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-purple-700" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Transparent 3% Welfare Pool</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Commercial gig platforms charge workers 25-30% commissions. Skill-Link eliminates profit-siphoning middlemen: exactly 3% is set aside into the worker&apos;s own cooperative welfare corpus.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                <Award className="w-4 h-4 text-amber-700" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Artisan Tool Microfinance</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Zero-collateral microloans up to ₹25,000 for acquiring high-grade testing gauges, safety harnesses, and modern equipment via Primary Agricultural &amp; Credit Societies (PACS).
            </p>
          </div>
        </div>

        {/* Verification & E-Shram Integration Note */}
        <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span>Integrated with Ministry of Labour &amp; Employment E-Shram Portal</span>
          </div>
          <p className="text-xs text-blue-800 leading-relaxed">
            All registered workers have their 12-digit Universal Account Number (UAN) synced, ensuring universal portable social security across Indian states.
          </p>
        </div>

        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}

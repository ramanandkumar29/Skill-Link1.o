"use client";

import React from "react";
import { WorkerProfile } from "../lib/seedData";
import { speakFemaleHindiText } from "../lib/voice";
import { Star, ShieldCheck, MapPin, Briefcase, Volume2, Sparkles, PhoneCall, CheckCircle2 } from "lucide-react";

interface WorkerCardProps {
  worker: WorkerProfile;
  onOpenTrustModal: (worker: WorkerProfile) => void;
  onBookService: (worker: WorkerProfile) => void;
}

export default function WorkerCard({ worker, onOpenTrustModal, onBookService }: WorkerCardProps) {
  const getBadgeStyle = (badge: WorkerProfile["badge"]) => {
    switch (badge) {
      case "Legendary":
        return "bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.5)] font-black";
      case "Top Rated":
        return "bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-500 text-white border-indigo-300 font-extrabold shadow-[0_0_20px_rgba(79,70,229,0.5)]";
      case "Expert":
        return "bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 text-slate-950 border-emerald-300 font-extrabold shadow-[0_0_20px_rgba(16,185,129,0.5)]";
      default:
        return "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 border-cyan-300 font-extrabold shadow-sm";
    }
  };

  const playVoiceSnippet = () => {
    if (worker.audioSnippetUrl) {
      const audio = new Audio(worker.audioSnippetUrl);
      audio.play();
    } else {
      const text = `Namaste! Main ${worker.name} hoon, ${worker.occupation}. Mujhey ${worker.experience} ka experience hai. Sahayak Female Voice AI Verified Profile.`;
      speakFemaleHindiText(text);
    }
  };

  const avatar = worker.avatarUrl || worker.avatar || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80";

  return (
    <div className="glass-panel-3d glass-card-hover p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden group border border-white/15 shadow-2xl rounded-3xl">
      {/* Background glow */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />

      <div>
        {/* Top Badge & Voice Preview */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <span
            className={`px-3 py-1 text-[11px] rounded-full border flex items-center gap-1 uppercase tracking-wider ${getBadgeStyle(
              worker.badge
            )}`}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            {worker.badge}
          </span>

          <button
            onClick={playVoiceSnippet}
            title="Listen to Worker Sahayak Female AI Voice Intro"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 rounded-full border border-indigo-500/40 shadow-sm transition-all active:scale-95 min-h-[36px]"
          >
            <Volume2 className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
            Voice Intro
          </button>
        </div>

        {/* Worker Info Row */}
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <img
              src={avatar}
              alt={worker.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-400/40 shadow-xl group-hover:scale-105 transition-transform"
            />
            <span
              className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-slate-950 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]"
              title="Available Now"
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-black text-white truncate flex items-center gap-1.5">
              {worker.name}
              <span title="Verified SkillLink Pro">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 fill-emerald-400/20 shrink-0" />
              </span>
            </h3>
            <p className="text-xs font-black text-emerald-400 uppercase tracking-wide flex items-center gap-1 truncate">
              <Briefcase className="w-3.5 h-3.5 shrink-0" />
              {worker.occupation} • {worker.experience}
            </p>
            <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-1 font-medium">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {worker.location}
            </p>
          </div>
        </div>

        {/* Rating & Jobs Row */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-black text-amber-300 bg-amber-950/60 px-3 py-1 rounded-xl border border-amber-500/30">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>{worker.rating.toFixed(1)}</span>
            <span className="text-slate-400 font-normal">/ 5.0</span>
          </div>

          <div className="font-bold text-slate-300 bg-slate-950/60 px-3 py-1 rounded-xl border border-white/10">
            <span className="font-black text-white">{worker.jobsCompleted}</span> Jobs Done
          </div>
        </div>

        {/* Interactive Trust Meter */}
        <div
          onClick={() => onOpenTrustModal(worker)}
          className="mt-3 p-3 rounded-2xl bg-slate-950/60 border border-white/10 cursor-pointer hover:border-cyan-500/40 transition-colors group/trust"
          title="Click to view full Trust Score breakdown"
        >
          <div className="flex items-center justify-between text-xs font-black mb-1.5">
            <span className="text-slate-300 flex items-center gap-1 group-hover/trust:text-cyan-400 transition-colors">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Trust Score:
            </span>
            <span className="text-cyan-300 font-black">{worker.trustScore}%</span>
          </div>
          <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden p-0.5 border border-white/10">
            <div
              className="bg-gradient-to-r from-indigo-500 via-emerald-400 to-cyan-300 h-full rounded-full transition-all duration-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
              style={{ width: `${worker.trustScore}%` }}
            />
          </div>
        </div>

        <p className="text-xs text-slate-300 mt-3 line-clamp-2 italic font-medium">
          &ldquo;{worker.bio || `Professional ${worker.occupation} serving ${worker.location}. Verified SkillLink Profile.`}&rdquo;
        </p>
      </div>

      {/* Primary Action Buttons */}
      <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
        <div className="text-left shrink-0">
          <span className="text-[10px] uppercase font-black text-slate-400 block">Rate</span>
          <span className="text-sm sm:text-base font-black text-white flex items-center">
            ₹{worker.hourlyRate || 399}
            <span className="text-[10px] text-slate-400 font-normal">/hr</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`tel:${worker.phone}`}
            className="p-2.5 rounded-xl bg-slate-900 border border-white/10 text-emerald-400 hover:bg-emerald-950 hover:border-emerald-500/50 flex items-center justify-center transition-all min-h-[44px] min-w-[44px]"
            title={`Call ${worker.name} directly (${worker.phone})`}
          >
            <PhoneCall className="w-4 h-4" />
          </a>

          <button
            onClick={() => onBookService(worker)}
            className="px-4 py-2.5 btn-3d-emerald-shine text-xs font-black tracking-wide shine-overlay min-h-[44px]"
          >
            Book Service (₹149 Visit)
          </button>
        </div>
      </div>
    </div>
  );
}

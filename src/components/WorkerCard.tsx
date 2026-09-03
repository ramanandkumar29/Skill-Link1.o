"use client";

import React from "react";
import { WorkerProfile } from "../lib/seedData";
import { speakFemaleHindiText } from "../lib/voice";
import { Star, ShieldCheck, MapPin, CheckCircle2, Award, Volume2, Clock, Eye, Sparkles, Building } from "lucide-react";

interface WorkerCardProps {
  worker: WorkerProfile;
  aiMatchScore?: number;
  aiMatchReason?: string;
  onOpenTrustModal: (worker: WorkerProfile) => void;
  onBookService: (worker: WorkerProfile) => void;
}

export default function WorkerCard({
  worker,
  aiMatchScore,
  aiMatchReason,
  onOpenTrustModal,
  onBookService,
}: WorkerCardProps) {
  const playVoiceSnippet = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (worker.audioSnippetUrl) {
      const audio = new Audio(worker.audioSnippetUrl);
      audio.play();
    } else {
      const text = `Namaste! Main ${worker.name} hoon, ${worker.occupation}. Main ${worker.cooperativeSociety?.split(" ")[0] || "Cooperative Society"} se certified hoon. Mujhey ${worker.experience} ka experience hai.`;
      speakFemaleHindiText(text);
    }
  };

  const avatar = worker.avatarUrl || worker.avatar || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80";

  // Cooperative Verification Badge
  const coopBadgeLabel = worker.cooperativeMemberId
    ? `Coop Member: ${worker.cooperativeMemberId}`
    : "Cooperative Certified";

  const effectiveScore = aiMatchScore ?? worker.aiMatchScore ?? Math.min(99, Math.round(worker.trustScore * 0.95 + worker.rating * 1.5));
  const effectiveReason = aiMatchReason ?? worker.aiMatchReason ?? `Verified ${worker.occupation} with ${worker.experience} exp, registered under ${worker.cooperativeSociety?.split(" ")[0] || "Cooperative"}.`;

  return (
    <div className="bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 shadow-sm hover:shadow-md group relative">
      <div>
        {/* Top Header Row: Cooperative Affiliation & Audio Intro */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{coopBadgeLabel}</span>
            </span>

            {effectiveScore >= 85 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200">
                <Sparkles className="w-3 h-3 text-purple-600" />
                <span>{effectiveScore}% AI Match</span>
              </span>
            )}

            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200" title="Cooperative Fair Opportunity Work Rotation">
              <span>⚖️ Fair Rotation</span>
            </span>
          </div>

          <button
            onClick={playVoiceSnippet}
            title="Listen to audio introduction"
            className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors shrink-0"
          >
            <Volume2 className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Audio</span>
          </button>
        </div>

        {/* Worker Profile Info Row */}
        <div className="flex items-start gap-3.5">
          <div className="relative shrink-0">
            <img
              src={avatar}
              alt={worker.name}
              className="w-14 h-14 rounded-xl object-cover border border-slate-200 shadow-sm"
            />
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                worker.isAvailable ? "bg-emerald-500" : "bg-slate-400"
              }`}
              title={worker.isAvailable ? "Available now" : "Offline"}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-bold text-slate-900 truncate">
                {worker.name}
              </h3>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            </div>

            <p className="text-xs font-semibold text-blue-600 mt-0.5 truncate">
              {worker.occupation} • {worker.experience}
            </p>

            <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-1 font-normal">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              {worker.location} • <span className="font-semibold text-slate-700">~1.8 km away</span>
            </p>
          </div>
        </div>

        {/* Trade Skills Chips */}
        {worker.skills && worker.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {worker.skills.slice(0, 3).map((skill, idx) => (
              <span
                key={idx}
                className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/80"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* Metric Strip: Rating, Jobs Done, Response */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-center gap-0.5 text-amber-700 font-bold text-xs">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              <span>{worker.rating.toFixed(1)}</span>
            </div>
            <span className="text-[10px] text-slate-500">Rating</span>
          </div>

          <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
            <div className="font-bold text-slate-900 text-xs">{worker.jobsCompleted}</div>
            <span className="text-[10px] text-slate-500">Jobs Done</span>
          </div>

          <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
            <div className="font-bold text-emerald-700 text-xs flex items-center justify-center gap-0.5">
              <Clock className="w-2.5 h-2.5" /> ~5 min
            </div>
            <span className="text-[10px] text-slate-500">Response</span>
          </div>
        </div>

        {/* AI Recommendation Explanation Reason */}
        <div
          onClick={() => onOpenTrustModal(worker)}
          className="mt-3 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-100 cursor-pointer transition-colors space-y-1.5"
          title="Click to view verified Trust breakdown"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-700 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Cooperative Trust Score
            </span>
            <span className="font-extrabold text-slate-900">{worker.trustScore}%</span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${worker.trustScore}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200/80 font-medium leading-relaxed">
            <span className="font-bold text-purple-700">AI Match:</span> {effectiveReason}
          </p>
        </div>
      </div>

      {/* Action Footer: Visiting Fee + 3% Welfare Cess breakdown + Buttons */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2.5">
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400">Fixed Visit</div>
          <div className="text-base font-extrabold text-slate-900">₹{worker.visitingFee || 149}</div>
          <div className="text-[9px] text-emerald-700 font-semibold">+3% Welfare Pool</div>
        </div>

        <div className="flex items-center gap-2 flex-1 justify-end">
          <button
            onClick={() => onOpenTrustModal(worker)}
            className="py-2 px-3 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all flex items-center gap-1"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Profile</span>
          </button>
          <button
            onClick={() => onBookService(worker)}
            className="py-2 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all shadow-sm text-center"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import {
  LexiWorkerCardData,
  LexiServiceCardData,
  LexiBookingCardData,
  LexiSOSCardData,
  LexiRateEstimateData,
} from "./types";
import {
  Star,
  ShieldCheck,
  MapPin,
  Clock,
  PhoneCall,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowRight,
  Sparkles,
  Zap,
} from "lucide-react";

// ─── 1. WORKER CARD ─────────────────────────────────────────────────────────

interface WorkerCardProps {
  worker: LexiWorkerCardData;
  onBook?: (worker: LexiWorkerCardData) => void;
}

export function LexiWorkerCard({ worker, onBook }: WorkerCardProps) {
  const [showWhy, setShowWhy] = React.useState(false);

  const avatar =
    worker.avatarUrl ||
    "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80";

  const isTopRanked = worker.rank === 1 || worker.rankingBadge?.includes("#1");

  return (
    <div
      className={`w-full sm:max-w-sm rounded-2xl bg-white p-4 shadow-sm space-y-3 transition-all border ${
        isTopRanked
          ? "border-amber-300 bg-amber-50/30 shadow-md"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      {/* Ranking Badge */}
      {worker.rankingBadge && (
        <div className="flex items-center justify-between gap-1 pb-2 border-b border-slate-100">
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 ${
              isTopRanked
                ? "bg-amber-100 text-amber-800 border border-amber-200"
                : "bg-slate-100 text-slate-700 border border-slate-200"
            }`}
          >
            {isTopRanked && <span>🏆</span>}
            <span>{worker.rankingBadge}</span>
          </span>

          {worker.recommendationScore && (
            <span className="text-[11px] font-bold text-emerald-700">
              {worker.recommendationScore}% Match
            </span>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3">
        <img
          src={avatar}
          alt={worker.name}
          className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 shadow-sm"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <h4 className="text-sm font-bold text-slate-900 truncate">{worker.name}</h4>
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold shrink-0">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              <span>{worker.rating}</span>
            </div>
          </div>
          <p className="text-xs font-semibold text-blue-600 truncate">{worker.occupation}</p>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
            {worker.location && (
              <span className="flex items-center gap-0.5 truncate">
                <MapPin className="w-3 h-3 text-slate-400" />
                {worker.location}
              </span>
            )}
            {worker.distanceKm && (
              <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px] font-medium">
                {worker.distanceKm} km away
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Skills chips */}
      {worker.skills && worker.skills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {worker.skills.slice(0, 3).map((skill, i) => (
            <span
              key={i}
              className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* Why Recommended Accordion */}
      {worker.whyRecommended && worker.whyRecommended.length > 0 && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowWhy((prev) => !prev)}
            className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
          >
            <span>{showWhy ? "▾ Hide factors" : "▸ Why recommended?"}</span>
          </button>

          {showWhy && (
            <div className="mt-1.5 p-2 rounded-lg bg-slate-50 border border-slate-200 space-y-1 animate-in fade-in duration-200">
              {worker.whyRecommended.map((reason, idx) => (
                <div key={idx} className="flex items-start gap-1.5 text-[10px] text-slate-600 font-medium">
                  <span className="text-emerald-600 font-bold shrink-0">✓</span>
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Price & Action */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div>
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Visiting Fee</span>
          <span className="text-sm font-bold text-slate-900">₹{worker.visitingFee}</span>
        </div>

        <button
          type="button"
          onClick={() => onBook?.(worker)}
          className="py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all active:scale-95 flex items-center gap-1 shadow-sm"
        >
          <span>Select Pro</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ─── 2. SERVICE CARD ────────────────────────────────────────────────────────

interface ServiceCardProps {
  service: LexiServiceCardData;
  onSelect?: (service: LexiServiceCardData) => void;
}

export function LexiServiceCard({ service, onSelect }: ServiceCardProps) {
  return (
    <div className="w-full sm:max-w-xs rounded-2xl bg-white border border-slate-200 p-4 shadow-sm space-y-2.5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-lg shrink-0">
          {service.icon || "🔧"}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-slate-900 truncate">{service.name}</h4>
          {service.nameHi && (
            <p className="text-xs font-medium text-slate-500 truncate">{service.nameHi}</p>
          )}
        </div>
      </div>

      {service.description && (
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{service.description}</p>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div>
          <span className="text-[10px] text-slate-400 font-medium uppercase block">Inspection Fee</span>
          <span className="text-xs font-bold text-slate-900">₹{service.baseVisitFee}</span>
        </div>
        <button
          type="button"
          onClick={() => onSelect?.(service)}
          className="py-1 px-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition-all"
        >
          View Pros
        </button>
      </div>
    </div>
  );
}

// ─── 2.5 BOOKING PREVIEW DRAFT CARD ────────────────────────────────────────

interface BookingPreviewCardProps {
  preview: {
    workerId: string;
    workerName: string;
    occupation: string;
    serviceType: string;
    date: string;
    time: string;
    location: string;
    visitingFee: number;
    estimatedLabor?: string;
  };
  onConfirm?: () => void;
  onModify?: () => void;
  onCancel?: () => void;
}

export function LexiBookingPreviewCard({ preview, onConfirm, onModify, onCancel }: BookingPreviewCardProps) {
  return (
    <div className="w-full sm:max-w-sm rounded-2xl bg-white border border-blue-200 p-4 shadow-md space-y-3.5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5 text-blue-700 font-semibold text-xs uppercase tracking-wider">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>Booking Summary</span>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
          Pending Confirmation
        </span>
      </div>

      {/* Details Grid */}
      <div className="space-y-2 text-xs">
        <div className="flex justify-between items-center py-1 border-b border-slate-50">
          <span className="text-slate-500">Professional:</span>
          <span className="font-bold text-slate-900">{preview.workerName}</span>
        </div>
        <div className="flex justify-between items-center py-1 border-b border-slate-50">
          <span className="text-slate-500">Service:</span>
          <span className="font-semibold text-slate-800">{preview.serviceType}</span>
        </div>
        <div className="flex justify-between items-center py-1 border-b border-slate-50">
          <span className="text-slate-500">Scheduled Date:</span>
          <span className="font-semibold text-blue-600">{preview.date}</span>
        </div>
        <div className="flex justify-between items-center py-1 border-b border-slate-50">
          <span className="text-slate-500">Time Slot:</span>
          <span className="font-semibold text-blue-600">{preview.time}</span>
        </div>
        <div className="flex justify-between items-center py-1 border-b border-slate-50">
          <span className="text-slate-500">Location:</span>
          <span className="font-medium text-slate-700 truncate max-w-[180px]">{preview.location}</span>
        </div>
        <div className="flex justify-between items-center py-1">
          <span className="text-slate-500">Inspection Fee:</span>
          <span className="font-bold text-emerald-700 text-sm">₹{preview.visitingFee}</span>
        </div>
      </div>

      {/* Trust Notice */}
      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 space-y-1">
        <div className="flex items-center gap-1 font-semibold text-slate-900">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Zero-Risk Guarantee</span>
        </div>
        <p className="leading-relaxed">Cancel anytime before the technician arrives for an instant refund.</p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-all"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Confirm Booking</span>
        </button>
      </div>
    </div>
  );
}

// ─── 3. BOOKING CONFIRMED CARD ──────────────────────────────────────────────

interface BookingCardProps {
  booking: LexiBookingCardData;
}

export function LexiBookingCard({ booking }: BookingCardProps) {
  return (
    <div className="w-full sm:max-w-sm rounded-2xl bg-white border border-emerald-200 p-4 shadow-md space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Booking Confirmed</span>
        </div>
        <span className="text-[11px] font-mono font-bold text-slate-700">
          #{booking.bookingId}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-500">Professional:</span>
          <span className="font-bold text-slate-900">{booking.workerName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Service:</span>
          <span className="font-medium text-slate-800">{booking.serviceType}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Date & Time:</span>
          <span className="font-medium text-blue-600">{booking.date}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Inspection Fee:</span>
          <span className="font-bold text-emerald-700">₹{booking.totalEstimate}</span>
        </div>
      </div>

      {/* Escrow OTP Box */}
      {booking.otpSecret && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
          <span className="text-[10px] uppercase font-semibold text-emerald-800 tracking-wider block">
            Escrow Completion OTP
          </span>
          <div className="text-xl font-mono font-bold text-emerald-700 tracking-widest">
            {booking.otpSecret}
          </div>
          <p className="text-[10px] text-emerald-700">
            Share this OTP with the technician only after satisfactory completion.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── 4. EMERGENCY SOS DISPATCH CARD ─────────────────────────────────────────

interface SOSCardProps {
  sos: LexiSOSCardData;
}

export function LexiSOSCard({ sos }: SOSCardProps) {
  return (
    <div className="w-full sm:max-w-sm rounded-2xl bg-white border border-rose-200 p-4 shadow-md space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs uppercase tracking-wider">
          <Zap className="w-4 h-4 text-rose-600" />
          <span>Roadside Rescue Dispatched</span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
          {sos.eta || "15 Mins"} ETA
        </span>
      </div>

      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-500">Assigned Mechanic:</span>
          <span className="font-bold text-slate-900">{sos.assignedWorkerName || "Nearest Verified Pro"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Emergency Type:</span>
          <span className="font-medium text-slate-800">{sos.issueType}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Fixed Priority Fee:</span>
          <span className="font-bold text-rose-700">₹{sos.priceLock || 199} (Locked)</span>
        </div>
      </div>
    </div>
  );
}

// ─── 5. RATE ESTIMATE CARD ──────────────────────────────────────────────────

interface RateCardProps {
  estimate?: LexiRateEstimateData;
  rate?: LexiRateEstimateData;
}

export function LexiRateEstimateCard({ estimate, rate }: RateCardProps) {
  const data = estimate || rate;
  if (!data) return null;
  return (
    <div className="w-full sm:max-w-xs rounded-2xl bg-white border border-slate-200 p-4 shadow-sm space-y-2.5">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Rate Estimate
        </h4>
        <span className="text-xs font-bold text-emerald-700">₹{data.visitFee} Visit</span>
      </div>

      <div className="space-y-1 text-xs text-slate-600">
        <div className="flex justify-between">
          <span className="text-slate-500">Base Visit:</span>
          <span className="font-semibold text-slate-900">₹{data.visitFee}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Service:</span>
          <span className="font-medium text-slate-900">{data.serviceName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Labor Range:</span>
          <span className="font-medium text-slate-900">{data.laborRange}</span>
        </div>
      </div>
    </div>
  );
}

// Alias export for backward compatibility
export const LexiRateCard = LexiRateEstimateCard;

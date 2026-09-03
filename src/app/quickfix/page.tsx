"use client";

import React, { useState, useEffect } from "react";
import { DEFAULT_WORKERS, Worker } from "@/lib/seedData";
import { saveBooking } from "@/lib/storage";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Zap, AlertTriangle, ShieldCheck, Clock, CheckCircle2, MapPin, PhoneCall, ArrowRight, HelpCircle, RefreshCw } from "lucide-react";
import Link from "next/link";

interface QuickFixStep {
  question: string;
  options: Array<{
    label: string;
    nextStep?: number;
    diagnosis?: {
      cause: string;
      difficulty: "Easy DIY" | "Moderate" | "Critical Danger - Call Pro";
      safetyRec: string;
      recommendPro: boolean;
    };
  }>;
}

const DIAGNOSTIC_STEPS: Record<string, QuickFixStep[]> = {
  "AC Breakdown": [
    {
      question: "Is your AC unit turning on at all?",
      options: [
        { label: "Yes, indoor unit turns on but blows warm air", nextStep: 1 },
        { label: "No, unit is completely dead / no display", nextStep: 2 },
      ],
    },
    {
      question: "Are you hearing any unusual buzzing noise from outdoor compressor?",
      options: [
        {
          label: "Yes, loud buzzing or clicking noise",
          diagnosis: {
            cause: "Capacitor failure or locked compressor motor.",
            difficulty: "Moderate",
            safetyRec: "Turn off AC switch immediately to prevent compressor burn.",
            recommendPro: true,
          },
        },
        {
          label: "No, outdoor fan is silent",
          diagnosis: {
            cause: "Refrigerant gas leak or PCB mainboard fuse blown.",
            difficulty: "Critical Danger - Call Pro",
            safetyRec: "Do not open outer electronics panel yourself.",
            recommendPro: true,
          },
        },
      ],
    },
    {
      question: "Has the main home MCB tripped?",
      options: [
        {
          label: "Yes, MCB trips every time AC turns on",
          diagnosis: {
            cause: "Short circuit in power cord or grounded compressor winding.",
            difficulty: "Critical Danger - Call Pro",
            safetyRec: "Keep MCB OFF until electrician inspects.",
            recommendPro: true,
          },
        },
        {
          label: "No, MCB is fine, socket has no power",
          diagnosis: {
            cause: "Burnt 16A power socket or stabilizer fuse blown.",
            difficulty: "Moderate",
            safetyRec: "Test socket with lamp before replacing fuse.",
            recommendPro: true,
          },
        },
      ],
    },
  ],
  "Pipe Burst / Major Leakage": [
    {
      question: "Where is water leaking from?",
      options: [
        { label: "Under sink / bathroom tap valve", nextStep: 1 },
        { label: "Wall pipe or main overhead tank line", nextStep: 2 },
      ],
    },
    {
      question: "Can you turn off the local angle valve stopcock?",
      options: [
        {
          label: "Yes, turning stopcock stopped the flow",
          diagnosis: {
            cause: "Worn rubber washer or loose braided hose connector.",
            difficulty: "Easy DIY",
            safetyRec: "Replace washer or tighten hose nut with wrench.",
            recommendPro: false,
          },
        },
        {
          label: "No, valve is rusted or stuck open",
          diagnosis: {
            cause: "Seized gate valve require pipe replacement.",
            difficulty: "Moderate",
            safetyRec: "Shut main terrace tank valve immediately.",
            recommendPro: true,
          },
        },
      ],
    },
    {
      question: "Is water gushing inside wall or near electrical sockets?",
      options: [
        {
          label: "Yes, near electrical sockets / light switchboard",
          diagnosis: {
            cause: "High-risk concealed pipe burst touching wiring conduit.",
            difficulty: "Critical Danger - Call Pro",
            safetyRec: "TURN OFF MAIN POWER BREAKER IMMEDIATELY!",
            recommendPro: true,
          },
        },
        {
          label: "No, main line leaking outdoors",
          diagnosis: {
            cause: "CPVC joint crack or tank outlet failure.",
            difficulty: "Moderate",
            safetyRec: "Tie cloth around leak as temporary buffer.",
            recommendPro: true,
          },
        },
      ],
    },
  ],
};

export default function QuickFixPage() {
  const [activeCategory, setActiveCategory] = useState<string>("AC Breakdown");
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [completedDiagnosis, setCompletedDiagnosis] = useState<{
    cause: string;
    difficulty: "Easy DIY" | "Moderate" | "Critical Danger - Call Pro";
    safetyRec: string;
    recommendPro: boolean;
  } | null>(null);

  const [isSearching, setIsSearching] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const [matchedWorker, setMatchedWorker] = useState<Worker | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

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

  const handleOptionSelect = (opt: any) => {
    if (opt.diagnosis) {
      setCompletedDiagnosis(opt.diagnosis);
    } else if (opt.nextStep !== undefined) {
      setCurrentStepIdx(opt.nextStep);
    }
  };

  const handleResetDiagnostic = () => {
    setCurrentStepIdx(0);
    setCompletedDiagnosis(null);
    setIsSearching(false);
    setMatchedWorker(null);
    setBookingConfirmed(false);
  };

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
      serviceType: `QUICKFIX DISPATCH: ${activeCategory}`,
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

    setBookingConfirmed(true);
  };

  const stepsList = DIAGNOSTIC_STEPS[activeCategory] || DIAGNOSTIC_STEPS["AC Breakdown"];
  const currentStep = stepsList[currentStepIdx] || stepsList[0];

  return (
    <div className="space-y-6 pb-20 text-slate-900">
      <Header activeSection="QUICKFIX" />

      <div className="max-w-3xl mx-auto space-y-6 px-4">
        {/* Banner */}
        <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-sm space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Zap className="w-4 h-4 text-blue-600" />
            QuickFix Guided Diagnostic Flow
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Troubleshoot &amp; Book Priority Pro
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Answer step-by-step diagnostic questions to identify home appliance or utility breakdown causes, get safety recommendations, and dispatch a verified expert.
          </p>
        </div>

        {/* Category Switcher */}
        <div className="flex gap-2 p-1 bg-slate-100 border border-slate-200 rounded-xl">
          {Object.keys(DIAGNOSTIC_STEPS).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                handleResetDiagnostic();
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                activeCategory === cat ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Diagnostic Form / Results Container */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          {!completedDiagnosis ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase text-slate-400">
                  Question {currentStepIdx + 1} of {stepsList.length}
                </span>
                <button onClick={handleResetDiagnostic} className="text-xs font-medium text-slate-500 hover:text-blue-600 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Restart
                </button>
              </div>

              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600 shrink-0" />
                {currentStep.question}
              </h2>

              <div className="space-y-2.5 pt-2">
                {currentStep.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleOptionSelect(opt)}
                    className="w-full p-4 rounded-xl bg-slate-50 hover:bg-blue-50/80 border border-slate-200 hover:border-blue-300 text-slate-900 text-xs font-bold text-left transition-all flex items-center justify-between group"
                  >
                    <span>{opt.label}</span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Diagnostic Result Ready
                </span>
                <button onClick={handleResetDiagnostic} className="text-xs font-medium text-slate-500 hover:text-blue-600">
                  Try Another Diagnosis
                </button>
              </div>

              {/* Diagnosis Summary Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px] block">Possible Cause</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{completedDiagnosis.cause}</p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className="font-bold text-slate-500">Difficulty Level:</span>
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                      completedDiagnosis.difficulty.includes("Danger")
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : completedDiagnosis.difficulty.includes("Moderate")
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    {completedDiagnosis.difficulty}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-medium">
                  <strong className="block text-[11px] font-bold text-amber-800">Safety Recommendation:</strong>
                  {completedDiagnosis.safetyRec}
                </div>
              </div>

              {/* Technician Dispatch CTA */}
              {!isSearching && !matchedWorker && (
                <div className="pt-2 text-center space-y-3">
                  <p className="text-xs text-slate-600">
                    We recommend professional technician repair for safe resolution.
                  </p>

                  <button
                    onClick={handleTriggerSOS}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    <span>Find &amp; Dispatch Technician Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {isSearching && (
                <div className="mt-4 text-center space-y-3 py-6 bg-slate-50 rounded-xl border border-blue-200">
                  <Clock className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                  <h3 className="text-sm font-bold text-slate-900">Locating Nearest Available Verified Technician...</h3>
                  <div className="text-2xl font-bold text-blue-600 font-mono">{countdown}s</div>
                </div>
              )}

              {matchedWorker && !bookingConfirmed && (
                <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-blue-200 space-y-3">
                  <div className="flex items-center gap-3">
                    <img src={matchedWorker.avatarUrl || matchedWorker.avatar} alt={matchedWorker.name} className="w-12 h-12 rounded-xl object-cover border border-slate-200" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{matchedWorker.name}</h3>
                      <p className="text-xs text-blue-600 font-semibold">{matchedWorker.occupation}</p>
                      <p className="text-[11px] text-slate-500">Visit Fee: ₹149 (Fixed Inspection)</p>
                    </div>
                  </div>

                  <form onSubmit={handleConfirmEmergencyBooking} className="space-y-2.5">
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Your Full Name"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="tel"
                      required
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="Mobile Number"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                    />
                    <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all">
                      Confirm Pro Booking
                    </button>
                  </form>
                </div>
              )}

              {bookingConfirmed && matchedWorker && (
                <div className="mt-4 text-center py-5 space-y-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h3 className="text-base font-bold text-slate-900">Technician Booked Successfully!</h3>
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-900">{matchedWorker.name}</span> will arrive shortly.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <BottomNav activeSection="QUICKFIX" />
    </div>
  );
}

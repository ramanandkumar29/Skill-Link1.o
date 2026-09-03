"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Phone,
  MapPin,
  Clock,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Share2,
  Car,
  Wrench,
  Battery,
  Fuel,
  Truck,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Eye,
} from "lucide-react";
import { useOfflineSOS, SOSIssueType } from "@/lib/useOfflineSOS";

interface AssignedMechanic {
  name: string;
  phone: string;
  distanceKm?: string | number;
  rating?: number;
  occupation?: string;
  etaMinutes?: number;
}

interface SOSDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  issueType?: SOSIssueType;
  customerPhone?: string;
  customerName?: string;
  lat?: number;
  lng?: number;
  pickupAddress?: string;
}

const EMERGENCY_ISSUES: Array<{ id: SOSIssueType; label: string; icon: React.ElementType; desc: string }> = [
  { id: "TYRE_PUNCTURE", label: "Flat Tyre / Puncture", icon: Wrench, desc: "On-site puncture repair or stepney change" },
  { id: "BATTERY_JUMPSTART", label: "Dead Battery / Jumpstart", icon: Battery, desc: "Quick jumper cables boost or replacement" },
  { id: "FUEL_DELIVERY", label: "Empty Fuel Delivery", icon: Fuel, desc: "2-5 Litres emergency petrol / diesel delivery" },
  { id: "ENGINE_BREAKDOWN", label: "Engine Breakdown", icon: Car, desc: "Engine smoke, stalling, or overheating check" },
  { id: "TOWING", label: "Flatbed Towing Service", icon: Truck, desc: "Safe vehicle recovery to nearest service station" },
  { id: "OTHER", label: "Other Roadside Emergency", icon: AlertTriangle, desc: "Key lockout, brake issue, or electrical fault" },
];

export default function SOSDispatchModal({
  isOpen,
  onClose,
  issueType = "TYRE_PUNCTURE",
  customerPhone = "+91 98765 43210",
  customerName = "Ramanand Sharma",
  lat,
  lng,
  pickupAddress = "NH-44 Highway near Sector 17, Chandigarh",
}: SOSDispatchModalProps) {
  // Step State: 1 = Stranded Check, 2 = Issue Select, 3 = Location, 4 = Road Safety, 5 = Dispatch Live
  const [sosStep, setSosStep] = useState<number>(1);
  const [selectedIssue, setSelectedIssue] = useState<SOSIssueType>(issueType);
  const [currentAddress, setCurrentAddress] = useState(pickupAddress || "NH-44 Highway near Sector 17, Chandigarh");
  const [landmark, setLandmark] = useState("Opposite Indian Oil Pump");
  const [dispatchStatus, setDispatchStatus] = useState<"FINDING" | "CONTACTED" | "ACCEPTED" | "ON_THE_WAY">("FINDING");
  const [dispatchCountdown, setDispatchCountdown] = useState(15);
  const [assignedMechanic, setAssignedMechanic] = useState<AssignedMechanic | null>(null);
  const [sharedToast, setSharedToast] = useState(false);

  const { isOffline, triggerOfflineSOS, gpsCoords } = useOfflineSOS();
  const effectiveLat = lat ?? gpsCoords?.lat ?? 30.7333;
  const effectiveLng = lng ?? gpsCoords?.lng ?? 76.7794;

  // Reset states on open
  useEffect(() => {
    if (isOpen) {
      setSosStep(1);
      setDispatchStatus("FINDING");
      setDispatchCountdown(15);
      setAssignedMechanic(null);
    }
  }, [isOpen]);

  // Dispatch progress timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen && sosStep === 5 && dispatchStatus === "FINDING") {
      timer = setInterval(() => {
        setDispatchCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Assign specialized emergency shop related directly to the user's issue
            const issueMechanicMap: Record<string, AssignedMechanic> = {
              TYRE_PUNCTURE: {
                name: "Verma 24x7 Tyre Puncture & Stepney Works",
                phone: "9876543220",
                distanceKm: "1.2",
                rating: 4.8,
                occupation: "Emergency Tyre Puncture & Tube Specialist",
                etaMinutes: 10,
              },
              BATTERY_JUMPSTART: {
                name: "Apex 24/7 Car Battery Jumpstart & Electricals",
                phone: "9876543221",
                distanceKm: "0.8",
                rating: 4.9,
                occupation: "Battery Booster Jumpstart & Auto Electrician",
                etaMinutes: 8,
              },
              FUEL_DELIVERY: {
                name: "QuickFuel Highway Emergency Petrol & Diesel Service",
                phone: "9876543224",
                distanceKm: "2.2",
                rating: 4.9,
                occupation: "Emergency Fuel Courier & Air Purge Tech",
                etaMinutes: 14,
              },
              ENGINE_BREAKDOWN: {
                name: "Express Highway Car Engine Breakdown & Mechanical Garage",
                phone: "9876543223",
                distanceKm: "1.8",
                rating: 4.8,
                occupation: "Certified Engine Overheat & Mechanical Specialist",
                etaMinutes: 15,
              },
              TOWING: {
                name: "Speedo Flatbed Towing & Crane Recovery Services",
                phone: "9876543222",
                distanceKm: "3.1",
                rating: 4.7,
                occupation: "Hydraulic Flatbed Towing & Crane Squad",
                etaMinutes: 18,
              },
              OTHER: {
                name: "Tricity Highway Emergency Auto Rescue & Garage",
                phone: "9876543220",
                distanceKm: "1.5",
                rating: 4.8,
                occupation: "24x7 Roadside Emergency Technician",
                etaMinutes: 12,
              },
            };
            const mockMechanic = issueMechanicMap[selectedIssue] || issueMechanicMap.OTHER;
            setAssignedMechanic(mockMechanic);
            setDispatchStatus("ACCEPTED");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, sosStep, dispatchStatus, selectedIssue]);

  const handleShareLocation = () => {
    if (navigator.share) {
      navigator.share({
        title: "My Roadside Emergency Location (Skill-Link)",
        text: `Emergency SOS: Stranded at ${currentAddress}. Need assistance. GPS: ${effectiveLat}, ${effectiveLng}`,
        url: `https://maps.google.com/?q=${effectiveLat},${effectiveLng}`,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`Emergency SOS at ${currentAddress} (GPS: ${effectiveLat}, ${effectiveLng})`);
      setSharedToast(true);
      setTimeout(() => setSharedToast(false), 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl my-auto text-slate-900 overflow-hidden">
        {/* Header Bar */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              Roadside Assistance <span className="text-[10px] text-rose-700 font-semibold uppercase bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">Priority SOS</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* STEP 1: ARE YOU STRANDED? */}
          {sosStep === 1 && (
            <div className="text-center space-y-4 py-2">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto shadow-sm">
                <AlertTriangle className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">Are you stranded on the road?</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  We target priority mechanic dispatch within 15 minutes across Tricity highways &amp; city roads.
                </p>
              </div>

              <div className="pt-2 space-y-2.5">
                <button
                  onClick={() => setSosStep(2)}
                  className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <span>Yes, Get Emergency Assistance</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={onClose}
                  className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  I am safe, cancel
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: WHAT HAPPENED? (ISSUE SELECTION) */}
          {sosStep === 2 && (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Step 2 of 4</span>
                <h3 className="text-base font-bold text-slate-900">What happened with your vehicle?</h3>
                <p className="text-xs text-slate-500">Select the issue so we dispatch the right equipped technician.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {EMERGENCY_ISSUES.map((issue) => {
                  const Icon = issue.icon;
                  const isSelected = selectedIssue === issue.id;
                  return (
                    <button
                      key={issue.id}
                      onClick={() => setSelectedIssue(issue.id)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                        isSelected
                          ? "bg-blue-50 border-blue-500 ring-1 ring-blue-500 text-slate-900"
                          : "bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-700"
                      }`}
                    >
                      <div className={`p-2 rounded-lg shrink-0 ${isSelected ? "bg-blue-600 text-white" : "bg-white text-slate-600 border border-slate-200"}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold">{issue.label}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">{issue.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setSosStep(1)}
                  className="w-1/3 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Back
                </button>
                <button
                  onClick={() => setSosStep(3)}
                  className="w-2/3 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1"
                >
                  <span>Confirm Issue &amp; Location</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: LOCATION CONFIRMATION */}
          {sosStep === 3 && (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Step 3 of 4</span>
                <h3 className="text-base font-bold text-slate-900">Confirm Your Location on Road</h3>
                <p className="text-xs text-slate-500">Accurate location ensures fastest dispatch.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" /> Current Road / Highway
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Accuracy ±12m
                  </span>
                </div>

                <input
                  type="text"
                  value={currentAddress}
                  onChange={(e) => setCurrentAddress(e.target.value)}
                  placeholder="e.g. NH-44 Highway near Sector 17, Chandigarh"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500"
                />

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Nearest Landmark (e.g. Petrol pump, Flyover, Toll)
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="e.g. Opposite Indian Oil Petrol Pump"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setSosStep(2)}
                  className="w-1/3 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Back
                </button>
                <button
                  onClick={() => setSosStep(4)}
                  className="w-2/3 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1"
                >
                  <span>Safety Check &amp; Dispatch</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: ROAD SAFETY MODE */}
          {sosStep === 4 && (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Step 4 of 4</span>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600" /> Road Safety Guidelines
                </h3>
                <p className="text-xs text-slate-500">Please follow these safety steps while help arrives:</p>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-2 text-xs text-amber-900">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-amber-700">1.</span>
                  <span><strong>Move away from live traffic</strong> to a safe sidewalk or roadside barrier.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-amber-700">2.</span>
                  <span>Turn on your vehicle&apos;s <strong>hazard lights (blinkers)</strong> to stay visible.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-amber-700">3.</span>
                  <span>Do not stand behind or in front of the vehicle.</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleShareLocation}
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Share2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Share Location</span>
                </button>

                <a
                  href="tel:112"
                  className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Phone className="w-3.5 h-3.5 text-rose-600" />
                  <span>Call Police (112)</span>
                </a>
              </div>

              {sharedToast && (
                <p className="text-[11px] font-bold text-emerald-700 text-center">
                  Location copied to clipboard! Share it with family.
                </p>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setSosStep(3)}
                  className="w-1/3 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Back
                </button>
                <button
                  onClick={() => setSosStep(5)}
                  className="w-2/3 py-3 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Dispatch Priority Mechanic Now</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: PRIORITY DISPATCH STATUS & TRACKING */}
          {sosStep === 5 && (
            <div className="space-y-4">
              {dispatchStatus === "FINDING" ? (
                <div className="text-center space-y-4 py-4">
                  <div className="relative w-16 h-16 rounded-full bg-rose-50 border-2 border-rose-200 flex items-center justify-center mx-auto">
                    <Car className="w-7 h-7 text-rose-600" />
                    <div className="absolute inset-0 rounded-full border-2 border-rose-500 animate-ping opacity-30" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">Contacting Nearest Verified Mechanics...</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Pinging 3 on-duty recovery vans within 5 km of {currentAddress}.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 max-w-xs mx-auto text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-600 animate-spin" /> Target Response:
                    </span>
                    <span className="font-bold text-slate-900">{dispatchCountdown}s</span>
                  </div>

                  {isOffline && (
                    <button
                      onClick={() => triggerOfflineSOS(selectedIssue)}
                      className="text-xs font-bold text-rose-600 underline"
                    >
                      Offline? Send Emergency SMS SOS
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Mechanic Assigned Banner */}
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Mechanic Dispatched!
                      </span>
                      <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                        ETA: ~{assignedMechanic?.etaMinutes || 12} mins
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-700">
                      Mechanic accepted your request and is en-route with recovery tools.
                    </p>
                  </div>

                  {/* Assigned Mechanic Card */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{assignedMechanic?.name}</h4>
                        <p className="text-xs text-blue-600 font-semibold">{assignedMechanic?.occupation}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Distance: {assignedMechanic?.distanceKm} km away</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-900">₹149 Visit Fee</div>
                        <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Fixed Inspection
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <a
                        href={`tel:${assignedMechanic?.phone}`}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call Mechanic</span>
                      </a>

                      <button
                        onClick={handleShareLocation}
                        className="py-2.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
                        title="Share Location"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Safety Notice */}
                  <p className="text-[11px] text-slate-500 text-center">
                    Keep your phone line open. The mechanic may call to confirm your exact lane.
                  </p>

                  <button
                    onClick={onClose}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                  >
                    Close &amp; Keep Tracking in Background
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

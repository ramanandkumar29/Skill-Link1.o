"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { WorkerProfile, INITIAL_WORKERS } from "@/lib/seedData";
import {
  updateBookingStatusInDb,
  fetchWorkerBookingsFromDb,
  updateWorkerLocationInDb,
  updateWorkerAvailabilityInDb,
} from "@/lib/supabaseService";
import { subscribeToWorkerDispatches } from "@/lib/supabaseRealtime";
import { getStoredAuthSession } from "@/lib/auth";
import {
  getBrowserLocation,
  obfuscateCoordinates,
  getNavigationUrl,
} from "@/lib/geo";
import {
  notifyWorkerEnRoute,
  notifyWorkerArrived,
  notifyServiceCompleted,
} from "@/lib/notificationService";

const SkillLinkMap = dynamic(() => import("./SkillLinkMap"), { ssr: false });
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Phone,
  ArrowRight,
  TrendingUp,
  Award,
  Upload,
  Calendar,
  DollarSign,
  AlertTriangle,
  FileText,
  UserCheck,
  Zap,
  Briefcase,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Plus
} from "lucide-react";

interface IncomingJobRequest {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceType: string;
  address: string;
  distanceKm: number;
  offeredFee: number;
  timerSeconds: number;
  emergency: boolean;
  notes: string;
}

interface WorkerPortalProps {
  initialWorker?: WorkerProfile;
  onOpenWelfareModal?: () => void;
}

export default function WorkerPortal({ initialWorker, onOpenWelfareModal }: WorkerPortalProps) {
  // Use first verified worker Ramanand Sharma as active worker if none passed
  const [worker, setWorker] = useState<WorkerProfile>(initialWorker || INITIAL_WORKERS[0]);
  const [isOnline, setIsOnline] = useState<boolean>(worker.isAvailable ?? true);
  const [workerLocation, setWorkerLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  }>({
    lat: worker.latitude || 30.7333,
    lng: worker.longitude || 76.7794,
    address: worker.location || "Sector 17, Chandigarh",
  });
  const [showRadarMap, setShowRadarMap] = useState<boolean>(false);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState<boolean>(false);

  const handleToggleOnline = async () => {
    if (!isOnline) {
      setIsOnline(true);
      updateWorkerAvailabilityInDb(worker.id, true).catch(() => {});
      setIsUpdatingLocation(true);
      const res = await getBrowserLocation();
      setIsUpdatingLocation(false);
      if (res.location) {
        const obf = obfuscateCoordinates(res.location.lat, res.location.lng);
        setWorkerLocation({
          lat: obf.lat,
          lng: obf.lng,
          address: res.location.address,
        });
        updateWorkerLocationInDb(worker.id, obf.lat, obf.lng).catch(() => {});
      }
    } else {
      setIsOnline(false);
      updateWorkerAvailabilityInDb(worker.id, false).catch(() => {});
    }
  };

  // Incoming Job Stream (Simulated real-time dispatch queue)
  const [incomingRequests, setIncomingRequests] = useState<IncomingJobRequest[]>([
    {
      id: "req-101",
      customerName: "Pooja Singhania",
      customerPhone: "+91 98140 22910",
      serviceType: "Urgent Kitchen Pipe Burst & Valve Replacement",
      address: "House 412, Sector 18-B, Chandigarh",
      distanceKm: 1.6,
      offeredFee: 499,
      timerSeconds: 45,
      emergency: true,
      notes: "Heavy water dripping under sink. Main supply shut off. Need urgent repair.",
    },
    {
      id: "req-102",
      customerName: "Col. H.S. Bajwa",
      customerPhone: "+91 98722 88120",
      serviceType: "Solar Water Heater Pipe Connection",
      address: "Villa 19, Sector 9-D, Chandigarh",
      distanceKm: 2.8,
      offeredFee: 650,
      timerSeconds: 90,
      emergency: false,
      notes: "Scheduled installation for terrace connection.",
    },
  ]);

  // Active Job State (when worker accepts a booking)
  const [activeJob, setActiveJob] = useState<{
    id: string;
    customerName: string;
    customerPhone: string;
    serviceType: string;
    address: string;
    distanceKm: number;
    fee: number;
    status: "EN_ROUTE" | "IN_PROGRESS" | "COMPLETED";
    laborAmount: number;
    partsAmount: number;
  } | null>(null);

  // Active Tab: "DASHBOARD" | "EARNINGS" | "WELFARE" | "CERTIFICATIONS"
  const [activeTab, setActiveTab] = useState<"DASHBOARD" | "EARNINGS" | "WELFARE" | "CERTIFICATIONS">("DASHBOARD");

  // Certificate Upload State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [certTitle, setCertTitle] = useState("");
  const [certIssuer, setCertIssuer] = useState("");
  const [certYear, setCertYear] = useState("2024");
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Earnings Passbook
  const [todayGross, setTodayGross] = useState<number>(worker.todayEarnings || 1250);
  const welfareCessRate = 0.03; // 3% Cooperative Welfare Pool
  const todayWelfareDeduction = Math.round(todayGross * welfareCessRate);
  const todayNetPayout = todayGross - todayWelfareDeduction;

  const [completedJobsCount, setCompletedJobsCount] = useState(worker.jobsCompleted || 128);

  // Countdown timer for incoming request
  // Fetch real incoming requests from Supabase
  useEffect(() => {
    const session = getStoredAuthSession();
    const activeWorkerId = session?.id || worker.id;

    fetchWorkerBookingsFromDb(activeWorkerId).then((realBookings) => {
      if (realBookings && realBookings.length > 0) {
        const pendingBookings: IncomingJobRequest[] = realBookings
          .filter((b) => b.status === "requested" || b.status === "assigned")
          .map((b) => ({
            id: b.id,
            customerName: b.customer_name || "Customer",
            customerPhone: b.customer_phone || "+91 98000 00000",
            serviceType: b.service_name || "Home Service",
            address: b.customer_address || "Customer Address",
            distanceKm: 2.1,
            offeredFee: b.visiting_fee || 499,
            timerSeconds: 120,
            emergency: b.emergency ?? false,
            notes: b.problem_description || b.notes || "Inspection & repair requested",
          }));

        if (pendingBookings.length > 0) {
          setIncomingRequests((prev) => {
            const existingIds = new Set(prev.map((r) => r.id));
            const newReqs = pendingBookings.filter((b) => !existingIds.has(b.id));
            return [...newReqs, ...prev];
          });
        }
      }
    });

    // Realtime live dispatch push subscription
    const unsubscribe = subscribeToWorkerDispatches(activeWorkerId, (newBooking) => {
      const liveJob: IncomingJobRequest = {
        id: newBooking.id,
        customerName: newBooking.customer_name || "New Customer",
        customerPhone: newBooking.customer_phone || "+91 98000 00000",
        serviceType: newBooking.service_name || "Home Service",
        address: newBooking.customer_address || "Customer Address",
        distanceKm: 1.8,
        offeredFee: newBooking.visiting_fee || 499,
        timerSeconds: 120,
        emergency: newBooking.emergency ?? false,
        notes: newBooking.problem_description || newBooking.notes || "Live Dispatch",
      };
      setIncomingRequests((prev) => [liveJob, ...prev.filter((r) => r.id !== liveJob.id)]);
    });

    return () => {
      unsubscribe();
    };
  }, [worker.id]);

  useEffect(() => {
    if (incomingRequests.length === 0) return;
    const interval = setInterval(() => {
      setIncomingRequests((prev) =>
        prev
          .map((r) => ({ ...r, timerSeconds: r.timerSeconds - 1 }))
          .filter((r) => r.timerSeconds > 0)
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [incomingRequests.length]);

  const handleAcceptJob = (req: IncomingJobRequest) => {
    // Notify Supabase
    updateBookingStatusInDb(req.id, "accepted").catch(() => {});

    setActiveJob({
      id: req.id,
      customerName: req.customerName,
      customerPhone: req.customerPhone,
      serviceType: req.serviceType,
      address: req.address,
      distanceKm: req.distanceKm,
      fee: req.offeredFee,
      status: "EN_ROUTE",
      laborAmount: req.offeredFee,
      partsAmount: 0,
    });
    setIncomingRequests((prev) => prev.filter((r) => r.id !== req.id));

    // Instant notification: Worker is en route
    notifyWorkerEnRoute({
      bookingId: req.id,
      workerName: worker.name,
      distanceKm: req.distanceKm,
    }).catch(() => {});
  };

  const handleDeclineJob = (reqId: string) => {
    // Notify Supabase
    updateBookingStatusInDb(reqId, "cancelled").catch(() => {});
    setIncomingRequests((prev) => prev.filter((r) => r.id !== reqId));
  };

  const handleAdvanceJobStatus = () => {
    if (!activeJob) return;
    if (activeJob.status === "EN_ROUTE") {
      updateBookingStatusInDb(activeJob.id, "in_progress").catch(() => {});
      setActiveJob({ ...activeJob, status: "IN_PROGRESS" });

      // Instant notification: Worker has arrived at customer doorstep
      notifyWorkerArrived({
        bookingId: activeJob.id,
        workerName: worker.name,
      }).catch(() => {});
    } else if (activeJob.status === "IN_PROGRESS") {
      const totalJobEarnings = activeJob.fee;
      updateBookingStatusInDb(activeJob.id, "completed", { finalAmount: totalJobEarnings }).catch(() => {});
      setTodayGross((prev) => prev + totalJobEarnings);
      setCompletedJobsCount((prev) => prev + 1);
      setActiveJob({ ...activeJob, status: "COMPLETED" });

      // Instant notification: Service completed & 3% welfare credited to artisan passbook
      notifyServiceCompleted({
        bookingId: activeJob.id,
        workerId: worker.id,
        workerName: worker.name,
        finalAmount: totalJobEarnings,
      }).catch(() => {});

      setTimeout(() => {
        setActiveJob(null);
      }, 3500);
    }
  };

  const handleUploadCertification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certTitle.trim() || !certIssuer.trim()) return;

    const newCert = {
      name: certTitle,
      issuer: certIssuer,
      year: certYear,
      verified: true,
      certNumber: `NSDC-${Math.floor(10000 + Math.random() * 90000)}`,
    };

    setWorker((prev) => ({
      ...prev,
      certifications: [...(prev.certifications || []), newCert],
      trustScore: Math.min(100, (prev.trustScore || 90) + 2),
    }));

    setUploadSuccess(true);
    setTimeout(() => {
      setUploadSuccess(false);
      setShowUploadModal(false);
      setCertTitle("");
      setCertIssuer("");
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-slate-900 animate-in fade-in">
      {/* Top Banner: Worker Identity & Online Switch */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={worker.avatarUrl || worker.avatar || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80"}
              alt={worker.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-200 shadow-sm"
            />
            <span
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
              }`}
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900">{worker.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Cooperative Member
              </span>
              <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                {worker.cooperativeMemberId || "TLCS-2022-041"}
              </span>
            </div>

            <p className="text-xs font-semibold text-blue-600 mt-1">
              {worker.occupation} • {worker.experience} Experience
            </p>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-slate-400" />
              {worker.cooperativeSociety || "Tricity Labour & Household Services Cooperative Society Ltd."}
            </p>
          </div>
        </div>

        {/* Live Availability Toggle Button */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-bold text-slate-900">
              {isOnline ? "Status: Online" : "Status: Offline"}
            </div>
            <div className="text-[11px] text-slate-500">
              {isOnline ? "Receiving instant customer jobs" : "Paused • Not dispatching"}
            </div>
          </div>
          <button
            onClick={handleToggleOnline}
            disabled={isUpdatingLocation}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm flex items-center gap-2 ${
              isOnline
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-white" : "bg-slate-500"}`} />
            <span>
              {isUpdatingLocation
                ? "Updating GPS..."
                : isOnline
                ? "Go Offline"
                : "Go Online"}
            </span>
          </button>
        </div>
      </div>

      {/* Geolocation & Privacy Shield Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-slate-700">
            Active Working Sector: <strong>{workerLocation.address}</strong>
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            ({workerLocation.lat.toFixed(2)}°N, {workerLocation.lng.toFixed(2)}°E)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Doorstep Privacy Shield Active (~1.1 km radius)
          </span>

          <button
            type="button"
            onClick={() => setShowRadarMap(!showRadarMap)}
            className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
          >
            <MapPin className="w-3 h-3 text-blue-600" />
            <span>{showRadarMap ? "Hide Sector Radar" : "Open Sector Radar Map"}</span>
          </button>
        </div>
      </div>

      {/* Sector Radar Map Display */}
      {showRadarMap && (
        <div className="space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              Live Sector Radar: Incoming Customer Requests &amp; Distance
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              Click any pin to inspect customer problem or get driving directions
            </span>
          </div>
          <SkillLinkMap
            center={{ lat: workerLocation.lat, lng: workerLocation.lng }}
            zoom={13}
            height="260px"
            markers={[
              {
                id: "worker-self",
                lat: workerLocation.lat,
                lng: workerLocation.lng,
                title: `${worker.name} (Your Base)`,
                subtitle: worker.occupation,
                isCustomer: false,
              },
              ...incomingRequests.map((req, idx) => ({
                id: req.id,
                lat: workerLocation.lat + (idx === 0 ? 0.012 : -0.015),
                lng: workerLocation.lng + (idx === 0 ? 0.009 : -0.011),
                title: req.customerName,
                subtitle: `${req.serviceType} (₹${req.offeredFee})`,
                distanceKm: req.distanceKm,
                isCustomer: true,
              })),
            ]}
          />
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto text-xs font-bold pb-2">
        <button
          onClick={() => setActiveTab("DASHBOARD")}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "DASHBOARD"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Live Dispatch ({incomingRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("EARNINGS")}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "EARNINGS"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Earnings &amp; Passbook</span>
        </button>

        <button
          onClick={() => setActiveTab("WELFARE")}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "WELFARE"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>My Welfare &amp; Insurance</span>
        </button>

        <button
          onClick={() => setActiveTab("CERTIFICATIONS")}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "CERTIFICATIONS"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Skill Certifications ({worker.certifications?.length || 2})</span>
        </button>
      </div>

      {/* TAB 1: LIVE DISPATCH & ACTIVE JOB */}
      {activeTab === "DASHBOARD" && (
        <div className="space-y-6">
          {/* Active In-Progress Job Card (if accepted) */}
          {activeJob && (
            <div className="bg-white border-2 border-blue-600 rounded-2xl p-6 shadow-md space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-600 animate-ping" />
                  <span className="text-xs uppercase font-extrabold tracking-wider text-blue-700">
                    Active Job In Progress
                  </span>
                  <span className="text-xs font-bold bg-blue-50 text-blue-800 px-2.5 py-0.5 rounded-full border border-blue-200">
                    Stage: {activeJob.status.replace("_", " ")}
                  </span>
                </div>
                <div className="text-base font-extrabold text-slate-900">
                  Total Fee: ₹{activeJob.fee}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900">{activeJob.serviceType}</h3>
                  <p className="text-xs text-slate-600 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    {activeJob.address}
                  </p>
                  <p className="text-xs text-slate-500">
                    Client: <span className="font-semibold text-slate-800">{activeJob.customerName}</span> • Distance: ~{activeJob.distanceKm} km
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2.5">
                  <a
                    href={`tel:${activeJob.customerPhone}`}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Call Customer</span>
                  </a>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(activeJob.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>Turn-by-Turn GPS</span>
                  </a>
                </div>
              </div>

              {/* Action Progress Controller */}
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  {activeJob.status === "EN_ROUTE" && "Click when you reach customer doorstep."}
                  {activeJob.status === "IN_PROGRESS" && "Work underway. Click upon finishing work & testing."}
                  {activeJob.status === "COMPLETED" && "Job complete! Earnings added to your Cooperative passbook."}
                </div>

                {activeJob.status !== "COMPLETED" ? (
                  <button
                    onClick={handleAdvanceJobStatus}
                    className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    <span>
                      {activeJob.status === "EN_ROUTE" ? "I have Arrived at Site" : "Finish Job & Collect ₹" + activeJob.fee}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="px-4 py-2 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Payment &amp; 3% Welfare Recorded</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Incoming Dispatch Queue */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  Live Incoming Job Requests ({incomingRequests.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Hyperlocal bookings matched by Cooperative AI engine based on your trade.
                </p>
              </div>

              {incomingRequests.length > 0 && (
                <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 flex items-center gap-1 animate-pulse">
                  <Clock className="w-3.5 h-3.5" />
                  Response Timer Active
                </span>
              )}
            </div>

            {incomingRequests.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <Clock className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No pending job requests right now</p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Keep your status &quot;Online&quot;. Nearby households requesting {worker.occupation} services will alert you here with a 45-second acceptance window.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {incomingRequests.map((req) => (
                  <div
                    key={req.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      req.emergency
                        ? "bg-rose-50/50 border-rose-200 hover:border-rose-300"
                        : "bg-slate-50 border-slate-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {req.emergency && (
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-600 text-white">
                              Emergency SOS
                            </span>
                          )}
                          <h3 className="text-sm font-bold text-slate-900">{req.serviceType}</h3>
                          <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            ~{req.distanceKm} km away
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {req.address}
                        </p>
                        <p className="text-[11px] text-slate-500 italic bg-white p-1.5 rounded-lg border border-slate-200/60 max-w-lg">
                          &ldquo;{req.notes}&rdquo;
                        </p>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase font-bold text-right">Offered Payout</div>
                          <div className="text-lg font-extrabold text-slate-900 text-right">₹{req.offeredFee}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDeclineJob(req.id)}
                            className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => handleAcceptJob(req)}
                            className="px-5 py-2 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                          >
                            <span>Accept</span>
                            <span className="text-[10px] bg-blue-700 px-1.5 py-0.5 rounded-full">
                              {req.timerSeconds}s
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <div className="text-slate-500 text-[11px] font-bold uppercase">Today&apos;s Gross</div>
              <div className="text-xl font-extrabold text-slate-900 mt-1">₹{todayGross}</div>
              <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Direct to Bank</div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <div className="text-slate-500 text-[11px] font-bold uppercase">Jobs Done</div>
              <div className="text-xl font-extrabold text-slate-900 mt-1">{completedJobsCount}</div>
              <div className="text-[10px] text-blue-600 font-semibold mt-0.5">100% Verified</div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <div className="text-slate-500 text-[11px] font-bold uppercase">Rating Index</div>
              <div className="text-xl font-extrabold text-slate-900 mt-1">{worker.rating.toFixed(1)} ★</div>
              <div className="text-[10px] text-amber-700 font-semibold mt-0.5">Top 5% in Tricity</div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <div className="text-slate-500 text-[11px] font-bold uppercase">3% Welfare Pool</div>
              <div className="text-xl font-extrabold text-emerald-700 mt-1">₹{worker.welfareContribution || 2538}</div>
              <div className="text-[10px] text-slate-500 font-semibold mt-0.5">Accident &amp; Health</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EARNINGS & WELFARE PASSBOOK */}
      {activeTab === "EARNINGS" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  Cooperative Transparent Income &amp; Welfare Ledger
                </h2>
                <p className="text-xs text-slate-500">
                  Unlike commercial gig apps charging 25-30% commission, your Cooperative charges ZERO commission, withholding only 3% strictly into your own Welfare Fund.
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-500 font-semibold">Account Status</span>
                <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200 inline-block ml-1">
                  Active Direct Bank Transfer
                </div>
              </div>
            </div>

            {/* Income Card Comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="text-xs text-slate-500 font-bold uppercase">Today&apos;s Gross Earned</div>
                <div className="text-2xl font-black text-slate-900">₹{todayGross}</div>
                <p className="text-[11px] text-slate-500">From 3 completed jobs today</p>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                <div className="text-xs text-emerald-800 font-bold uppercase">3% Cooperative Welfare Pool</div>
                <div className="text-2xl font-black text-emerald-700">- ₹{todayWelfareDeduction}</div>
                <p className="text-[11px] text-emerald-700">Accumulates in your Social Security Fund</p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                <div className="text-xs text-blue-800 font-bold uppercase">Net Payout to Bank</div>
                <div className="text-2xl font-black text-blue-700">₹{todayNetPayout}</div>
                <p className="text-[11px] text-blue-700">Settled daily by 10:00 PM via UPI</p>
              </div>
            </div>

            {/* Ledger Transactions */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h3 className="text-xs font-bold uppercase text-slate-700">Recent Service Settlements</h3>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                {[
                  { id: "TXN-902", client: "Sanjay Gupta (Sec 17)", gross: 499, welfare: 15, net: 484, date: "Today, 11:30 AM", status: "Settled" },
                  { id: "TXN-901", client: "Dr. Ananya Ray (Sec 22)", gross: 751, welfare: 23, net: 728, date: "Today, 09:15 AM", status: "Settled" },
                  { id: "TXN-899", client: "Manish Sood (Mohali)", gross: 650, welfare: 20, net: 630, date: "Yesterday, 04:45 PM", status: "Settled" },
                  { id: "TXN-898", client: "Gurmeet Sandhu (Sec 35)", gross: 800, welfare: 24, net: 776, date: "Yesterday, 01:20 PM", status: "Settled" },
                ].map((item) => (
                  <div key={item.id} className="p-3.5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-900">{item.client}</span>
                      <span className="text-slate-400 mx-1.5">•</span>
                      <span className="text-slate-500 font-mono">{item.id}</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">{item.date}</p>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <div className="text-slate-500">Gross: ₹{item.gross}</div>
                        <div className="text-[10px] text-emerald-600 font-medium">Coop 3%: -₹{item.welfare}</div>
                      </div>
                      <div className="font-bold text-slate-900 text-sm">
                        Net: ₹{item.net}
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MY WELFARE & INSURANCE STATUS */}
      {activeTab === "WELFARE" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  Government &amp; Cooperative Worker Welfare Schemes
                </h2>
                <p className="text-xs text-slate-500">
                  Your active social security covers under the Ministry of Cooperation &amp; Govt of India.
                </p>
              </div>

              <button
                onClick={onOpenWelfareModal}
                className="px-3.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all"
              >
                View Scheme Guidelines
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    Active Policy
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">PMSBY Accidental Cover</h3>
                <p className="text-xs text-slate-600">
                  ₹2,00,000 coverage against accidental disability or casualty during work dispatches. Annual ₹20 fee subsidized by Cooperative.
                </p>
                <div className="text-[11px] font-mono text-emerald-800 pt-1">
                  Policy: PMSBY-PB-994102
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                    Cooperative Grant
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Emergency Medical Fund</h3>
                <p className="text-xs text-slate-600">
                  Up to ₹50,000 instant grant for hospital admission of worker or immediate dependents, funded via the 3% platform pool.
                </p>
                <div className="text-[11px] font-mono text-blue-800 pt-1">
                  Eligibility: Instant 0-Hour Claim
                </div>
              </div>

              <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                    Cooperative Microfinance
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Tool &amp; Equipment Loan</h3>
                <p className="text-xs text-slate-600">
                  Zero-interest loan up to ₹25,000 for acquiring advanced testing gauges, power tools, or safety gear.
                </p>
                <div className="text-[11px] font-mono text-purple-800 pt-1">
                  Limit Available: ₹25,000
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SKILL CERTIFICATIONS */}
      {activeTab === "CERTIFICATIONS" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-600" />
                  Verified Trade Certifications &amp; ITI Diplomas
                </h2>
                <p className="text-xs text-slate-500">
                  Cooperative verified credentials boost your customer matching score by up to 25%.
                </p>
              </div>

              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload New Certificate</span>
              </button>
            </div>

            <div className="space-y-3 pt-2">
              {(worker.certifications || []).map((cert, index) => (
                <div key={index} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{cert.name}</h4>
                      <p className="text-xs text-slate-600">
                        Issued by: <span className="font-semibold">{cert.issuer}</span> • Year: {cert.year}
                      </p>
                      {cert.certNumber && (
                        <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                          Verification ID: {cert.certNumber}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Cooperative Verified
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Upload Certificate Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-600" />
                Upload Skill / ITI Certificate
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {uploadSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-900">Certificate Uploaded!</h4>
                <p className="text-xs text-slate-500">Verified by Cooperative Society verification node.</p>
              </div>
            ) : (
              <form onSubmit={handleUploadCertification} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                    Certificate Title
                  </label>
                  <input
                    type="text"
                    required
                    value={certTitle}
                    onChange={(e) => setCertTitle(e.target.value)}
                    placeholder="e.g. NSDC Advanced Plumbing Certificate"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                    Issuing Authority / Institution
                  </label>
                  <input
                    type="text"
                    required
                    value={certIssuer}
                    onChange={(e) => setCertIssuer(e.target.value)}
                    placeholder="e.g. Govt ITI / Skill India Council"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                    Year of Completion
                  </label>
                  <input
                    type="text"
                    required
                    value={certYear}
                    onChange={(e) => setCertYear(e.target.value)}
                    placeholder="2023"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-1">
                  <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">Attach PDF or Photo Proof</p>
                  <p className="text-[10px] text-slate-400">Max size 5MB (Simulated Verification)</p>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  Submit for Cooperative Verification
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

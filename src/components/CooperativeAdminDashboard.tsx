"use client";

import React, { useState } from "react";
import {
  WorkerProfile,
  INITIAL_WORKERS,
  COOPERATIVE_SOCIETIES,
  DEMAND_FORECAST_DATA,
  CooperativeSociety,
  DemandForecastPoint
} from "@/lib/seedData";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  Briefcase,
  FileCheck,
  DollarSign,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpRight,
  Clock,
  MapPin,
  Search,
  Filter,
  Eye,
  Check,
  X,
  Building,
  HelpCircle,
  RefreshCw,
  BarChart3,
  Sliders
} from "lucide-react";
import {
  getKycWorkers,
  getKycWorkerById,
  DetailedKycWorker,
  finalizeWorkerKycDecision,
} from "@/lib/kycVerificationService";
import WorkerVerificationDrawer from "./WorkerVerificationDrawer";

export default function CooperativeAdminDashboard() {
  const [activeTab, setActiveTab] = useState<
    "OVERVIEW" | "VERIFICATION" | "BOOKINGS" | "WELFARE" | "FORECASTING" | "DISPUTES"
  >("OVERVIEW");

  const [selectedSociety, setSelectedSociety] = useState<string>("all");
  const [workersList, setWorkersList] = useState<WorkerProfile[]>(INITIAL_WORKERS);

  // KYC Verification Queue
  const [kycWorkers, setKycWorkers] = useState<DetailedKycWorker[]>(() => getKycWorkers());
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [kycSearch, setKycSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"NEWEST" | "OLDEST" | "PRIORITY" | "COMPLETION">("NEWEST");

  const refreshKycWorkers = () => {
    setKycWorkers(getKycWorkers());
  };

  // Active Dispatches Monitoring
  const [liveBookings] = useState([
    { id: "BK-4401", customer: "Mrs. Meenakshi Roy", worker: "Ramanand Sharma", trade: "Plumbing", status: "In-Progress", location: "Sec 17, Chandigarh", time: "11:30 AM", emergency: true },
    { id: "BK-4402", customer: "Rajiv Khurana", worker: "Anil Kumar Maurya", trade: "Electrical", status: "Scheduled", location: "Sec 22, Chandigarh", time: "02:00 PM", emergency: false },
    { id: "BK-4403", customer: "Simran Gill", worker: "Sunita Devi", trade: "Caregiver", status: "In-Progress", location: "Sec 35, Chandigarh", time: "10:00 AM", emergency: false },
    { id: "BK-4404", customer: "Vikas Bansal", worker: "Shubham Kumar", trade: "AC Service", status: "Completed", location: "Mohali Ph 3B2", time: "09:15 AM", emergency: false },
  ]);

  // Customer Disputes Queue
  const [disputes, setDisputes] = useState([
    {
      id: "DISP-9841",
      customer: "Karan Malhotra",
      worker: "Anil Kumar Maurya",
      issue: "Arrival delayed by 25 mins due to rain traffic",
      status: "RESOLVED",
      resolution: "₹50 visit fee credit granted to customer; worker informed.",
    },
    {
      id: "DISP-9842",
      customer: "Priya Chawla",
      worker: "Nitish Kumar",
      issue: "Balcony tile cleaning requested touch-up",
      status: "IN_REVIEW",
      resolution: "Free follow-up visit scheduled for tomorrow morning.",
    },
  ]);

  // AI Forecasting Simulator State
  const [forecastSeason, setForecastSeason] = useState<string>("ALL");

  const handleApproveKyc = (id: string) => {
    finalizeWorkerKycDecision(id, "VERIFIED");
    refreshKycWorkers();
  };

  const handleRejectKyc = (id: string) => {
    finalizeWorkerKycDecision(id, "REJECTED", "Manual inspection check failed");
    refreshKycWorkers();
  };

  const filteredKycWorkers = kycWorkers
    .filter((w) => {
      if (kycSearch.trim()) {
        const q = kycSearch.toLowerCase().trim();
        const matchName = w.workerName.toLowerCase().includes(q);
        const matchId = w.workerId.toLowerCase().includes(q);
        const matchSoc = w.societyReg.toLowerCase().includes(q);
        const matchSkill = w.occupation.toLowerCase().includes(q) || w.skills.some((s) => s.toLowerCase().includes(q));
        if (!matchName && !matchId && !matchSoc && !matchSkill) return false;
      }
      if (statusFilter !== "ALL" && w.overallStatus !== statusFilter) return false;
      if (priorityFilter !== "ALL" && w.priority !== priorityFilter) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "PRIORITY") {
        const weight: Record<string, number> = { HIGH: 3, MEDIUM: 2, NORMAL: 1 };
        return (weight[b.priority] || 1) - (weight[a.priority] || 1);
      }
      if (sortBy === "COMPLETION") {
        const pctA = Math.round((a.checklist.filter((c) => c.status === "VERIFIED").length / a.checklist.length) * 100);
        const pctB = Math.round((b.checklist.filter((c) => c.status === "VERIFIED").length / b.checklist.length) * 100);
        return pctB - pctA;
      }
      if (sortBy === "OLDEST") {
        return a.id.localeCompare(b.id);
      }
      return b.id.localeCompare(a.id);
    });

  const filteredForecasts = DEMAND_FORECAST_DATA.filter((f) => {
    if (forecastSeason === "ALL") return true;
    return f.season.toLowerCase().includes(forecastSeason.toLowerCase());
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-slate-900 animate-in fade-in">
      {/* Federation Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <Building className="w-3.5 h-3.5" />
              Ministry of Cooperation • Labour Cooperative Federation Node
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Cooperative Society Administration Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Unified control panel for worker KYC verification, 3% welfare fund audits, real-time dispatches, and AI seasonal demand forecasting.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedSociety}
              onChange={(e) => setSelectedSociety(e.target.value)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Cooperative Societies (Tricity &amp; NCR)</option>
              {COOPERATIVE_SOCIETIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name.split("&")[0]}...
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Executive Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] font-bold uppercase text-slate-500">Registered Artisans</div>
            <div className="text-2xl font-black text-slate-900 mt-1">1,242</div>
            <div className="text-[10px] font-semibold text-emerald-600 mt-0.5">+48 this month</div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
            <div className="text-[10px] font-bold uppercase text-emerald-800">3% Welfare Corpus</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">₹19,56,500</div>
            <div className="text-[10px] font-semibold text-emerald-800 mt-0.5">₹0 Platform Cut</div>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
            <div className="text-[10px] font-bold uppercase text-blue-800">Active Dispatches</div>
            <div className="text-2xl font-black text-blue-700 mt-1">38 Live</div>
            <div className="text-[10px] font-semibold text-blue-800 mt-0.5">4 Emergency SOS</div>
          </div>

          <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200">
            <div className="text-[10px] font-bold uppercase text-purple-800">KYC Verification Rate</div>
            <div className="text-2xl font-black text-purple-700 mt-1">98.4%</div>
            <div className="text-[10px] font-semibold text-purple-800 mt-0.5">{kycWorkers.filter(k => k.overallStatus === "PENDING").length} Pending Audit</div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto text-xs font-bold pb-2">
        {[
          { id: "OVERVIEW", label: "Executive Overview", icon: BarChart3 },
          { id: "VERIFICATION", label: `Worker KYC Queue (${kycWorkers.filter(k => k.overallStatus === "PENDING").length})`, icon: FileCheck },
          { id: "BOOKINGS", label: `Live Service Bookings (${liveBookings.length})`, icon: Briefcase },
          { id: "WELFARE", label: "Welfare & Insurance Fund", icon: ShieldCheck },
          { id: "FORECASTING", label: "AI Seasonal Demand Forecasting", icon: Sparkles },
          { id: "DISPUTES", label: `Grievances & Redressal (${disputes.length})`, icon: AlertTriangle },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: EXECUTIVE OVERVIEW */}
      {activeTab === "OVERVIEW" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {COOPERATIVE_SOCIETIES.map((c) => (
              <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {c.registrationNumber}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Registered
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900">{c.name}</h3>
                <p className="text-xs text-slate-500">
                  Region: <span className="font-semibold text-slate-700">{c.district}, {c.state}</span>
                </p>

                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Active Members</span>
                    <div className="text-base font-extrabold text-slate-900">{c.activeWorkersCount}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Welfare Balance</span>
                    <div className="text-base font-extrabold text-emerald-700">₹{(c.welfareFundBalance).toLocaleString()}</div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 pt-1">
                  President: <span className="font-semibold text-slate-700">{c.presidentName}</span>
                </p>
              </div>
            ))}
          </div>

          {/* Trade Allocation Breakdown */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Skilled Workforce Trade Distribution
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {[
                { trade: "Electricians", count: 245, pct: "20%" },
                { trade: "Plumbers", count: 210, pct: "17%" },
                { trade: "Painters", count: 180, pct: "14%" },
                { trade: "Carpenters", count: 165, pct: "13%" },
                { trade: "AC Technicians", count: 140, pct: "11%" },
                { trade: "Caregivers", count: 110, pct: "9%" },
                { trade: "Cleaners", count: 95, pct: "8%" },
                { trade: "Drivers", count: 97, pct: "8%" },
              ].map((item) => (
                <div key={item.trade} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-0.5">
                  <div className="text-xs font-bold text-slate-900">{item.trade}</div>
                  <div className="text-lg font-black text-blue-600">{item.count}</div>
                  <div className="text-[10px] text-slate-400">{item.pct} share</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WORKER KYC VERIFICATION QUEUE */}
      {activeTab === "VERIFICATION" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-600" />
                Service Provider 5-Tier Verification Queue
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Verify Identity (Aadhaar), Cooperative Membership, Residence Address, Trade Skills, and Accredited Certifications.
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Manual Cooperative Registry Verification</span>
            </div>
          </div>

          {/* Search, Filter & Sorter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={kycSearch}
                onChange={(e) => setKycSearch(e.target.value)}
                placeholder="Search name, ID, society, skill..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <span className="text-[11px] font-bold text-slate-400 shrink-0">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 w-full focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Status ({kycWorkers.length})</option>
                <option value="PENDING">Pending Only ({kycWorkers.filter(w => w.overallStatus === "PENDING").length})</option>
                <option value="VERIFIED">Verified ({kycWorkers.filter(w => w.overallStatus === "VERIFIED").length})</option>
                <option value="REJECTED">Rejected ({kycWorkers.filter(w => w.overallStatus === "REJECTED").length})</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <span className="text-[11px] font-bold text-slate-400 shrink-0">Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 w-full focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Priorities</option>
                <option value="HIGH">High Priority Only</option>
                <option value="MEDIUM">Medium</option>
                <option value="NORMAL">Normal</option>
              </select>
            </div>

            {/* Sort Sorter */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <span className="text-[11px] font-bold text-slate-400 shrink-0">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs font-semibold text-slate-700 w-full focus:outline-none cursor-pointer"
              >
                <option value="NEWEST">Newest Submitted</option>
                <option value="OLDEST">Oldest First</option>
                <option value="PRIORITY">Highest Priority</option>
                <option value="COMPLETION">Completion %</option>
              </select>
            </div>
          </div>

          {/* Worker Cards List */}
          <div className="space-y-3 pt-1">
            {filteredKycWorkers.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <FileCheck className="w-8 h-8 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">No verification requests match your filter</h4>
                <p className="text-xs text-slate-500">Try resetting search keywords or status filter.</p>
              </div>
            ) : (
              filteredKycWorkers.map((item) => {
                const verifiedPills = item.checklist.filter((c) => c.status === "VERIFIED").length;
                const totalPills = item.checklist.length || 5;
                const completionRate = Math.round((verifiedPills / totalPills) * 100);

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedWorkerId(item.id)}
                    className="p-4 rounded-xl bg-slate-50/80 hover:bg-white border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                          {item.workerName}
                        </h3>
                        <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {item.occupation}
                        </span>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          item.overallStatus === "VERIFIED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : item.overallStatus === "REJECTED"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                          {item.overallStatus}
                        </span>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          item.priority === "HIGH"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : item.priority === "MEDIUM"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}>
                          {item.priority} PRIORITY
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                        <div>
                          <span className="text-slate-400">Aadhaar (Masked):</span>{" "}
                          <span className="font-mono font-bold text-slate-800">{item.aadhaarMasked}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Society ID:</span>{" "}
                          <span className="font-mono font-bold text-slate-800">{item.societyReg}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Submitted:</span> {item.submittedDate}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700 pt-0.5">
                        <p className="flex items-center gap-1 font-medium">
                          <FileCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>Uploaded Credential:</span>{" "}
                          <span className="font-semibold text-slate-900">{item.certificateName}</span>
                        </p>
                        <span className="text-slate-300">•</span>
                        <span className="text-[11px] font-semibold text-blue-600 group-hover:underline">
                          Click to Inspect Full KYC Dossier &amp; Documents →
                        </span>
                      </div>

                      {/* Mini 5-tier verification pills */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {item.checklist.map((chk) => (
                          <span
                            key={chk.id}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                              chk.status === "VERIFIED"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : chk.status === "REQUIRES_REVIEW"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-slate-100 text-slate-500 border-slate-200"
                            }`}
                          >
                            {chk.status === "VERIFIED" ? "✓" : "⏳"} {chk.category}
                          </span>
                        ))}
                        <span className="text-[10px] font-mono text-slate-400 ml-1">
                          ({completionRate}% Checked)
                        </span>
                      </div>
                    </div>

                    {/* Quick Card Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0">
                      {item.overallStatus === "PENDING" ? (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRejectKyc(item.id);
                            }}
                            className="px-3 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApproveKyc(item.id);
                            }}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve &amp; Verify</span>
                          </button>
                        </>
                      ) : (
                        <div className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl">
                          Decision Logged
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* INSPECTION DRAWER */}
          <WorkerVerificationDrawer
            worker={selectedWorkerId ? getKycWorkerById(selectedWorkerId) || null : null}
            onClose={() => setSelectedWorkerId(null)}
            onWorkerUpdated={refreshKycWorkers}
          />
        </div>
      )}

      {/* TAB 3: LIVE SERVICE BOOKINGS & DISPATCH MONITOR */}
      {activeTab === "BOOKINGS" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                Live Household &amp; Community Service Dispatches
              </h2>
              <p className="text-xs text-slate-500">
                Real-time booking dispatch monitor across Tricity and NCR sectors.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              Live Feed Active
            </span>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
            {liveBookings.map((b) => (
              <div key={b.id} className="p-4 bg-white hover:bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {b.id}
                    </span>
                    {b.emergency && (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-600 text-white">
                        SOS Emergency
                      </span>
                    )}
                    <span className="font-bold text-slate-900">{b.trade} Service</span>
                  </div>

                  <p className="text-slate-600">
                    Client: <span className="font-semibold text-slate-800">{b.customer}</span> • Assigned Pro: <span className="font-semibold text-slate-800">{b.worker}</span>
                  </p>
                  <p className="text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {b.location} • Slot: {b.time}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] border ${
                    b.status === "In-Progress"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : b.status === "Completed"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  }`}>
                    {b.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: WELFARE & INSURANCE FUND AUDIT */}
      {activeTab === "WELFARE" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              3% Cooperative Worker Welfare &amp; Insurance Fund
            </h2>
            <p className="text-xs text-slate-500">
              The cornerstone of the cooperative gig ecosystem: 3% of all customer booking transactions are automatically held in trust for worker social security, accident insurance, and emergency relief.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
              <div className="text-xs font-bold uppercase text-emerald-800">Total Accumulated Welfare Pool</div>
              <div className="text-3xl font-black text-emerald-800">₹19,56,500</div>
              <p className="text-[11px] text-emerald-700">Accumulated from 32,450 gig orders across registered societies.</p>
            </div>

            <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2">
              <div className="text-xs font-bold uppercase text-blue-800">PMSBY Insurance Covered</div>
              <div className="text-3xl font-black text-blue-800">1,242 Workers</div>
              <p className="text-[11px] text-blue-700">₹2 Lakh accident policy active per worker. Premiums fully paid by Cooperative.</p>
            </div>

            <div className="p-5 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-2">
              <div className="text-xs font-bold uppercase text-purple-800">Medical Grants Disbursed</div>
              <div className="text-3xl font-black text-purple-800">₹2,85,000</div>
              <p className="text-[11px] text-purple-700">Disbursed to 14 workers for hospital emergency relief during work injuries.</p>
            </div>
          </div>

          {/* Allocation Breakdown */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold uppercase text-slate-700">Fund Allocation Rules (Ministry of Cooperation Framework)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <div className="font-bold text-slate-900">40% Accident Shield</div>
                <p className="text-slate-500 text-[11px] mt-0.5">Group accident cover &amp; casualty compensation</p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <div className="font-bold text-slate-900">30% Medical Grants</div>
                <p className="text-slate-500 text-[11px] mt-0.5">Zero-delay hospitalization relief for families</p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <div className="font-bold text-slate-900">20% Tool Microfinance</div>
                <p className="text-slate-500 text-[11px] mt-0.5">0% interest power tools &amp; vehicle repair loans</p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <div className="font-bold text-slate-900">10% Skill Upgradation</div>
                <p className="text-slate-500 text-[11px] mt-0.5">Subsidized ITI / NSDC advanced trade certifications</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AI SEASONAL DEMAND FORECASTING (SIH Feature 14) */}
      {activeTab === "FORECASTING" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                AI Smart Automation Engine • Seasonal Trend Analytics
              </div>
              <h2 className="text-lg font-black text-slate-900 mt-1">
                Predictive Demand Forecasting &amp; Workforce Mobilization
              </h2>
              <p className="text-xs text-slate-500">
                Machine learning model trained on 3 years of regional municipal utility data, seasonal climate metrics, and historical festive booking spikes.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Filter Season:</span>
              <select
                value={forecastSeason}
                onChange={(e) => setForecastSeason(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-50 border border-slate-200 focus:outline-none"
              >
                <option value="ALL">All Forecast Periods</option>
                <option value="Summer">Summer Surge</option>
                <option value="Monsoon">Monsoon Influx</option>
                <option value="Diwali">Diwali &amp; Festive</option>
                <option value="Winter">Winter Maintenance</option>
              </select>
            </div>
          </div>

          {/* AI Forecast Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredForecasts.map((fc, index) => (
              <div
                key={index}
                className="p-5 rounded-2xl border bg-slate-50 hover:bg-white hover:shadow-md transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                      {fc.month}
                    </span>
                    <span className="text-xs font-semibold text-slate-600">{fc.season}</span>
                  </div>

                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                    fc.surgeRisk === "CRITICAL"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : fc.surgeRisk === "HIGH"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-blue-50 text-blue-700 border-blue-200"
                  }`}>
                    {fc.surgeRisk} Surge (+{fc.projectedDemandPercent}%)
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{fc.categoryLabel}</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    <span className="font-bold text-slate-700">Root Drivers:</span> {fc.drivers}
                  </p>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <div className="text-[10px] font-extrabold uppercase text-purple-700 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-600" />
                    AI Recommended Cooperative Action
                  </div>
                  <p className="text-xs text-slate-800 font-medium">{fc.recommendedAction}</p>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-slate-500 font-semibold">Recommended Standby Workforce:</span>
                  <span className="font-extrabold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                    +{fc.additionalWorkersNeeded} Technicians
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: DISPUTES & GRIEVANCE REDRESSAL */}
      {activeTab === "DISPUTES" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              Customer Grievance &amp; Dispute Redressal Board
            </h2>
            <p className="text-xs text-slate-500">
              Federation ombudsman oversight for fair pricing, punctuality guarantees, and quality mediation.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {disputes.map((d) => (
              <div key={d.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-slate-900">{d.id}</span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    d.status === "RESOLVED"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    {d.status}
                  </span>
                </div>

                <p className="text-xs text-slate-700">
                  Customer: <span className="font-semibold">{d.customer}</span> • Worker: <span className="font-semibold">{d.worker}</span>
                </p>

                <div className="text-xs font-medium text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-400 font-bold">Issue:</span> &ldquo;{d.issue}&rdquo;
                </div>

                <div className="text-xs text-emerald-800 bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200">
                  <span className="font-bold">Resolution:</span> {d.resolution}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

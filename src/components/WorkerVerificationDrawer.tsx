"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCheck,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  Award,
  Clock,
  Eye,
  Check,
  RotateCcw,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Download,
  Calendar,
  Layers,
  History,
  Info,
  Sparkles,
  HelpCircle,
  ExternalLink,
  Bot,
  Star,
  Compass,
  Languages,
  CheckCheck,
  FileText
} from "lucide-react";
import {
  DetailedKycWorker,
  KycDocument,
  REJECTION_REASONS,
  updateDocumentStatus,
  updateChecklistItem,
  finalizeWorkerKycDecision,
  generateLexiKycAuditSummary
} from "@/lib/kycVerificationService";
import DocumentViewerModal from "./DocumentViewerModal";

interface WorkerVerificationDrawerProps {
  worker: DetailedKycWorker | null;
  onClose: () => void;
  onWorkerUpdated: () => void;
}

export default function WorkerVerificationDrawer({
  worker,
  onClose,
  onWorkerUpdated,
}: WorkerVerificationDrawerProps) {
  const [activeTab, setActiveTab] = useState<
    "OVERVIEW" | "PERSONAL" | "SKILLS" | "DOCUMENTS" | "TIMELINE"
  >("OVERVIEW");

  // Selected document index for modal viewer
  const [inspectingDocIndex, setInspectingDocIndex] = useState<number | null>(null);

  // Document action prompt (Reject or Re-upload reason)
  const [rejectionTargetDoc, setRejectionTargetDoc] = useState<KycDocument | null>(null);
  const [selectedReason, setSelectedReason] = useState<string>(REJECTION_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>("");

  // Final confirmation modals
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showRequestInfoModal, setShowRequestInfoModal] = useState(false);
  const [requestInfoNotes, setRequestInfoNotes] = useState("");
  const [finalAdminNotes, setFinalAdminNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Accordion expansion states
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);

  // LEXI AI Analysis visibility toggle
  const [showLexiSummary, setShowLexiSummary] = useState(true);

  // Notify system that modal is open to hide floating LEXI assistant & handle Escape key
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("skill-link-modal-open"));

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (inspectingDocIndex !== null) {
          setInspectingDocIndex(null);
        } else if (showApprovalModal) {
          setShowApprovalModal(false);
        } else if (showRejectionModal) {
          setShowRejectionModal(false);
        } else if (showRequestInfoModal) {
          setShowRequestInfoModal(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.dispatchEvent(new CustomEvent("skill-link-modal-close"));
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [inspectingDocIndex, showApprovalModal, showRejectionModal, showRequestInfoModal, onClose]);

  if (!worker) return null;

  // Active inspecting document object
  const inspectingDoc = inspectingDocIndex !== null ? worker.documents[inspectingDocIndex] : null;

  // Calculate verification progress
  const totalChecks = worker.checklist.length || 5;
  const verifiedChecks = worker.checklist.filter((c) => c.status === "VERIFIED").length;
  const progressPct = Math.round((verifiedChecks / totalChecks) * 100);

  // Dynamic AI audit evaluation
  const lexiAudit = generateLexiKycAuditSummary(worker);

  // Handlers for document actions
  const handleApproveDoc = (docId: string, notes?: string) => {
    updateDocumentStatus(worker.id, docId, "VERIFIED", notes);
    onWorkerUpdated();
  };

  const handleRequestReupload = (docId: string, notes?: string) => {
    updateDocumentStatus(
      worker.id,
      docId,
      "REQUIRES_REVIEW",
      notes || "Re-upload requested: Unclear scan / details missing"
    );
    onWorkerUpdated();
  };

  // Handlers for final decisions
  const handleExecuteApproval = () => {
    setIsProcessing(true);
    setTimeout(() => {
      finalizeWorkerKycDecision(worker.id, "VERIFIED", finalAdminNotes);
      setIsProcessing(false);
      setShowApprovalModal(false);
      onWorkerUpdated();
      onClose();
    }, 500);
  };

  const handleExecuteRejection = () => {
    setIsProcessing(true);
    setTimeout(() => {
      finalizeWorkerKycDecision(
        worker.id,
        "REJECTED",
        finalAdminNotes || selectedReason || "Application rejected due to failed verification."
      );
      setIsProcessing(false);
      setShowRejectionModal(false);
      onWorkerUpdated();
      onClose();
    }, 500);
  };

  const handleExecuteRequestInfo = () => {
    setIsProcessing(true);
    setTimeout(() => {
      finalizeWorkerKycDecision(
        worker.id,
        "REQUIRES_REVIEW",
        requestInfoNotes || "Additional documentation requested from worker."
      );
      setIsProcessing(false);
      setShowRequestInfoModal(false);
      onWorkerUpdated();
      onClose();
    }, 500);
  };

  // Check if certificate is expired
  const isCertificateExpired = () => {
    if (!worker.certificateExpiryDate || worker.certificateExpiryDate.includes("Permanent") || worker.certificateExpiryDate.includes("Lifetime")) {
      return false;
    }
    const expiry = new Date(worker.certificateExpiryDate);
    return !isNaN(expiry.getTime()) && expiry.getTime() < Date.now();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Worker Verification - ${worker.workerName}`}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-2 sm:p-4 lg:p-6 animate-in fade-in duration-200"
    >
      {/* Centered Modern Modal Card (Desktop 80-90% max width) */}
      <div className="w-full max-w-5xl xl:max-w-6xl h-[92vh] max-h-[880px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden relative animate-in zoom-in-95 duration-200">
        
        {/* ─── 1. COMPACT & CLEAN HEADER (Part 2) ─────────────────────────── */}
        <div className="px-5 py-3.5 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Worker Profile Photo */}
            <div className="relative shrink-0">
              <img
                src={worker.profilePhoto || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150"}
                alt={worker.workerName}
                className="w-12 h-12 rounded-xl object-cover border-2 border-slate-700 shadow-sm"
              />
              <span
                className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                  worker.overallStatus === "VERIFIED"
                    ? "bg-emerald-500"
                    : worker.overallStatus === "REJECTED"
                    ? "bg-rose-500"
                    : "bg-amber-500 animate-pulse"
                }`}
              />
            </div>

            {/* Name, Profession, Worker ID, Society, Registration Date */}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-white truncate">
                  {worker.workerName}
                </h2>
                <span className="text-xs font-semibold text-blue-300 bg-blue-900/60 px-2 py-0.5 rounded-md border border-blue-700">
                  {worker.occupation}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    worker.overallStatus === "VERIFIED"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : worker.overallStatus === "REJECTED"
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                      : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  }`}
                >
                  {worker.overallStatus === "VERIFIED" ? "VERIFIED" : worker.overallStatus === "REJECTED" ? "REJECTED" : "PENDING VERIFICATION"}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-400 font-mono mt-0.5">
                <span>Worker ID: <strong className="text-slate-200">{worker.workerId}</strong></span>
                <span>• Society: <strong className="text-slate-200">{worker.societyReg}</strong></span>
                <span className="hidden md:inline">• Registered: <strong className="text-slate-300">{worker.joiningDate || "12-Jan-2022"}</strong></span>
              </div>
            </div>
          </div>

          {/* Right Header: Progress Indicator & Close */}
          <div className="flex items-center gap-4 shrink-0">
            {/* KYC Progress Pill */}
            <div className="hidden sm:flex flex-col items-end">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <span>KYC Progress:</span>
                <span className={progressPct === 100 ? "text-emerald-400" : "text-blue-400"}>
                  {verifiedChecks} / {totalChecks} Verified ({progressPct}%)
                </span>
              </div>
              <div className="w-32 bg-slate-800 rounded-full h-1.5 overflow-hidden mt-1 border border-slate-700">
                <div
                  className={`h-full transition-all duration-300 ${
                    progressPct === 100 ? "bg-emerald-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close Panel (Esc)"
              aria-label="Close verification modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ─── 2. TAB NAVIGATION BAR (Part 2) ─────────────────────────────── */}
        <div className="px-5 bg-slate-100 border-b border-slate-200 flex items-center gap-1 overflow-x-auto shrink-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("OVERVIEW")}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === "OVERVIEW"
                ? "border-blue-600 text-blue-700 bg-white shadow-sm"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("PERSONAL")}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === "PERSONAL"
                ? "border-blue-600 text-blue-700 bg-white shadow-sm"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Personal & Identity</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("SKILLS")}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === "SKILLS"
                ? "border-blue-600 text-blue-700 bg-white shadow-sm"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Trade Skills</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("DOCUMENTS")}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === "DOCUMENTS"
                ? "border-blue-600 text-blue-700 bg-white shadow-sm"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Documents ({worker.documents.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("TIMELINE")}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === "TIMELINE"
                ? "border-blue-600 text-blue-700 bg-white shadow-sm"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Verification History / Audit Log</span>
          </button>
        </div>

        {/* ─── 3. INDEPENDENTLY SCROLLABLE CONTENT BODY ───────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50">
          
          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* TAB 1: OVERVIEW & QUICK DECISION SUMMARY (Part 3, 5, 6)           */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {activeTab === "OVERVIEW" && (
            <div className="space-y-6">
              
              {/* SUMMARY & RISK SCORECARD (Part 3) */}
              <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      Verification Summary & Scorecard
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Cooperative 5-tier verification summary for authorized administrative review.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Risk Badge */}
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs">
                      <span className="text-slate-500 font-medium">Risk Level:</span>
                      <span
                        className={`font-bold ${
                          lexiAudit.riskLevel === "LOW"
                            ? "text-emerald-700"
                            : lexiAudit.riskLevel === "MEDIUM"
                            ? "text-amber-700"
                            : "text-rose-700"
                        }`}
                      >
                        {lexiAudit.riskLevel}
                      </span>
                    </div>

                    {/* Recommended Decision Badge */}
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-800">
                      <span className="text-blue-600 font-medium">Recommendation:</span>
                      <span className="font-bold">
                        {progressPct === 100 ? "APPROVE" : worker.riskLevel === "HIGH" ? "REJECT" : "NEEDS REVIEW"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5 Status Pill Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                  <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-200 text-emerald-900 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase">1. Identity</span>
                    <div className="flex items-center gap-1 mt-1 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{worker.identityStatus === "VERIFIED" ? "Verified" : "Pending"}</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">2. Address</span>
                    <div className="flex items-center gap-1 mt-1 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Matched</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-200 text-emerald-900 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase">3. Trade Skill</span>
                    <div className="flex items-center gap-1 mt-1 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{worker.experience}</span>
                    </div>
                  </div>

                  <div
                    className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                      worker.skillVerificationStatus === "VERIFIED"
                        ? "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                        : "bg-amber-50/60 border-amber-200 text-amber-900"
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase">4. Certification</span>
                    <div className="flex items-center gap-1 mt-1 font-bold">
                      {worker.skillVerificationStatus === "VERIFIED" ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      )}
                      <span>{worker.skillVerificationStatus === "VERIFIED" ? "Verified" : "Manual Review"}</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-200 text-blue-900 flex flex-col justify-between col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-bold text-blue-700 uppercase">5. Cooperative</span>
                    <div className="flex items-center gap-1 mt-1 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{worker.membershipStatus}</span>
                    </div>
                  </div>
                </div>

                {/* Attention Required Callout */}
                {worker.riskNote && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 leading-relaxed">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">Attention Required: </strong>
                      {worker.riskNote}
                    </div>
                  </div>
                )}
              </div>

              {/* INTELLIGENT VERIFICATION INSIGHTS (Part 6) */}
              <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    Intelligent Verification Insights
                  </h4>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Rule-Based Compliance Checks
                  </span>
                </div>

                <div className="space-y-2.5">
                  {worker.intelligentFlags && worker.intelligentFlags.length > 0 ? (
                    worker.intelligentFlags.map((flag, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                          flag.type === "GREEN"
                            ? "bg-emerald-50/50 border-emerald-200 text-emerald-900"
                            : flag.type === "YELLOW"
                            ? "bg-amber-50/50 border-amber-200 text-amber-900"
                            : "bg-rose-50/50 border-rose-200 text-rose-900"
                        }`}
                      >
                        <span className="text-sm shrink-0">
                          {flag.type === "GREEN" ? "🟢" : flag.type === "YELLOW" ? "🟡" : "🔴"}
                        </span>
                        <div>
                          <strong className="font-bold block">{flag.label}</strong>
                          <span className="text-slate-600 text-[11px] leading-relaxed mt-0.5 block">
                            {flag.details}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                      <span>🟢</span>
                      <span>No major anomalies detected across submitted identity and certificate tokens.</span>
                    </div>
                  )}
                </div>

                {/* Important Advisory Notice (Part 6) */}
                <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  ℹ️ <strong>Advisory Notice:</strong> Automated analysis assists verification. Final approval is performed by an authorized cooperative administrator.
                </p>
              </div>

              {/* SMART 5-LEVEL VERIFICATION AUDIT WORKFLOW (Part 5) */}
              <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <CheckCheck className="w-4 h-4 text-blue-600" />
                      5-Level Smart Verification Workflow
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Progressive verification gates required before marketplace dispatch activation.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                    Level {verifiedChecks} of 5 Completed
                  </span>
                </div>

                <div className="space-y-2.5">
                  {(worker.verificationLevels || []).map((lvl) => {
                    const isExpanded = expandedLevel === lvl.level;
                    const isVerified = lvl.status === "VERIFIED";

                    return (
                      <div
                        key={lvl.level}
                        className={`rounded-xl border transition-all ${
                          isVerified
                            ? "bg-white border-emerald-200"
                            : lvl.status === "REQUIRES_REVIEW"
                            ? "bg-white border-amber-200"
                            : "bg-white border-slate-200"
                        }`}
                      >
                        <div
                          onClick={() => setExpandedLevel(isExpanded ? null : lvl.level)}
                          className="p-3 sm:p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${
                                isVerified
                                  ? "bg-emerald-100 text-emerald-700"
                                  : lvl.status === "REQUIRES_REVIEW"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              L{lvl.level}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900 truncate">
                                  LEVEL {lvl.level}: {lvl.title}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 truncate">
                                {lvl.subtitle}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                isVerified
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                  : lvl.status === "REQUIRES_REVIEW"
                                  ? "bg-amber-50 text-amber-700 border-amber-300"
                                  : "bg-slate-100 text-slate-600 border-slate-200"
                              }`}
                            >
                              {lvl.status}
                            </span>
                            <ChevronDown
                              className={`w-4 h-4 text-slate-400 transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </div>
                        </div>

                        {/* Expanded Level Audit Details */}
                        {isExpanded && (
                          <div className="px-4 pb-3.5 pt-1 border-t border-slate-100 text-xs text-slate-600 space-y-2 animate-in fade-in">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                              <div>
                                <span className="text-slate-400 block text-[10px]">Verified By</span>
                                <strong className="text-slate-800">{lvl.verifiedBy || "Authorized Cooperative Admin"}</strong>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">Date / Schedule</span>
                                <span className="text-slate-700 font-mono">{lvl.date || "Today"}</span>
                              </div>
                            </div>
                            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-700">
                              <strong>Inspector Notes:</strong> {lvl.notes}
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                              <Check className="w-3 h-3 text-blue-600" />
                              <span>{lvl.automatedCheck}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SERVICE & WORKER PERFORMANCE SUMMARY (Part 3) */}
              <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Compass className="w-4 h-4 text-blue-600" />
                  Service & Marketplace Performance Profile
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Service Radius</span>
                    <span className="font-bold text-slate-900 mt-0.5 block">{worker.serviceRadius || "12 km radius"}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Availability</span>
                    <span className="font-bold text-emerald-700 mt-0.5 block">{worker.availability || "Active / Ready"}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Completed Jobs</span>
                    <span className="font-bold text-slate-900 mt-0.5 block">{worker.totalJobs || 142} Jobs Completed</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Average Customer Rating</span>
                    <span className="font-bold text-amber-600 mt-0.5 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      {worker.rating || 4.92} / 5.0
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2 text-xs text-slate-600">
                  <Languages className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    <strong>Languages Spoken:</strong> {(worker.languagesSpoken || ["Hindi", "Punjabi", "English"]).join(", ")}
                  </span>
                </div>
              </div>

              {/* CONTEXTUAL AI ASSISTANT: ASK LEXI (Part 7) */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl shadow-md space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      LEXI AI Verification Summary
                      <span className="text-[10px] font-semibold bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded-full border border-blue-400/30">
                        Advisory Only
                      </span>
                    </h4>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowLexiSummary((prev) => !prev)}
                    className="text-xs text-blue-300 hover:text-white font-semibold"
                  >
                    {showLexiSummary ? "Hide Analysis" : "Show Analysis"}
                  </button>
                </div>

                {showLexiSummary && (
                  <div className="pt-2 space-y-3 text-xs border-t border-white/10 animate-in fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-blue-100">
                      <div>
                        <span className="text-blue-300 font-medium block text-[11px]">Identity Status:</span>
                        <span className="font-semibold text-white">{lexiAudit.identityStatus}</span>
                      </div>
                      <div>
                        <span className="text-blue-300 font-medium block text-[11px]">Cooperative Membership:</span>
                        <span className="font-semibold text-white">{lexiAudit.membershipStatus}</span>
                      </div>
                      <div>
                        <span className="text-blue-300 font-medium block text-[11px]">Trade Certification:</span>
                        <span className="font-semibold text-white">{lexiAudit.tradeStatus}</span>
                      </div>
                      <div>
                        <span className="text-blue-300 font-medium block text-[11px]">Risk Level:</span>
                        <span className="font-bold text-emerald-300">{lexiAudit.riskLevel}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
                      <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
                        AI Recommendation
                      </span>
                      <p className="text-white leading-relaxed">{lexiAudit.recommendation}</p>
                    </div>

                    <p className="text-[10px] text-blue-300/80 italic">
                      Important: LEXI provides advisory guidance only. Final approval or rejection decisions rest exclusively with authorized cooperative administrators.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* TAB 2: PERSONAL & IDENTITY (Part 3)                               */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {activeTab === "PERSONAL" && (
            <div className="space-y-5">
              {/* Personal Information Grouped Card */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  Personal Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Full Name</span>
                    <span className="font-bold text-slate-900 text-sm">{worker.workerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Date of Birth</span>
                    <span className="font-semibold text-slate-800">{worker.dob || "14-Aug-1988"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Gender</span>
                    <span className="font-semibold text-slate-800">{worker.gender || "Male"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Phone Number</span>
                    <span className="font-mono font-bold text-slate-900">{worker.mobile}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-[11px]">Email Address</span>
                    <span className="font-semibold text-slate-800">{worker.email || "Not Provided"}</span>
                  </div>
                </div>
              </div>

              {/* Address Information Grouped Card */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  Address & Jurisdiction
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="sm:col-span-3">
                    <span className="text-slate-400 block text-[11px]">Current Address</span>
                    <span className="font-semibold text-slate-800">{worker.maskedAddress}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">City</span>
                    <span className="font-semibold text-slate-800">{worker.city}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">District / State</span>
                    <span className="font-semibold text-slate-800">{worker.district}, {worker.state}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Pincode</span>
                    <span className="font-mono font-bold text-blue-700">{worker.pincode || "160071"}</span>
                  </div>
                </div>
              </div>

              {/* Identity Verification Grouped Card (Masked Aadhaar) */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Identity Verification
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Aadhaar Number (Masked)</span>
                    <span className="font-mono font-bold text-slate-900 text-sm bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block">
                      {worker.aadhaarMasked}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">UIDAI Token Matched</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Identity Status</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block mt-0.5">
                      {worker.identityStatus}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Verification Timestamp</span>
                    <span className="font-mono text-slate-700">{worker.lastUpdatedDate}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* TAB 3: TRADE SKILLS (Part 3)                                      */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {activeTab === "SKILLS" && (
            <div className="space-y-5">
              {/* Primary Profession & Practical Skills */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-bold text-blue-600 uppercase">Primary Profession</span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">
                      {worker.primaryProfession}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Designated Rank: <strong className="text-slate-800">{worker.skillLevel}</strong> ({worker.experience} Experience)
                    </p>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Verified Competency Skills:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {worker.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 text-xs font-semibold border border-blue-200"
                      >
                        ✓ {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {worker.secondarySkills && worker.secondarySkills.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Secondary Trade Skills:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {worker.secondarySkills.map((sec, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200"
                        >
                          • {sec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Certification Dossier Card */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Award className="w-4 h-4 text-blue-600" />
                    Formal Certification Record
                  </h3>

                  {/* Certification Badge */}
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                      isCertificateExpired()
                        ? "bg-rose-50 text-rose-700 border-rose-300"
                        : worker.skillVerificationStatus === "VERIFIED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                        : "bg-amber-50 text-amber-700 border-amber-300"
                    }`}
                  >
                    {isCertificateExpired()
                      ? "EXPIRED"
                      : worker.skillVerificationStatus === "VERIFIED"
                      ? "VERIFIED"
                      : "REQUIRES REVIEW"}
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Certificate Name</span>
                    <span className="font-bold text-slate-900">{worker.certificateName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Issuing Organization</span>
                    <span className="font-semibold text-slate-800">{worker.certificationAuthority}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Certificate / Roll ID</span>
                    <span className="font-mono font-bold text-blue-700">{worker.certificateId}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Training Institute</span>
                    <span className="font-semibold text-slate-800">{worker.trainingInstitute || "Accredited Vocational Center"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Issue Date</span>
                    <span className="font-mono text-slate-800">{worker.certificateIssueDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Expiry Status</span>
                    <span className="font-mono text-slate-800">
                      {worker.certificateExpiryDate || "Permanent / No Expiry"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* TAB 4: UPLOADED DOCUMENTS & VIEWER (Part 4)                       */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {activeTab === "DOCUMENTS" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Uploaded Verification Documents
                  </h3>
                  <p className="text-xs text-slate-500">
                    Click any document card to open the 2-column inspector with Previous / Next navigation.
                  </p>
                </div>
              </div>

              {/* Document Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {worker.documents.map((doc, idx) => (
                  <div
                    key={doc.id}
                    onClick={() => setInspectingDocIndex(idx)}
                    className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-blue-400 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    {/* Thumbnail and Title */}
                    <div className="space-y-3">
                      <div className="h-32 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 relative flex items-center justify-center">
                        <img
                          src={doc.previewUrl || doc.fileUrl}
                          alt={doc.documentName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="px-3 py-1 bg-white text-slate-900 rounded-lg text-xs font-bold shadow-md flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">
                            {doc.documentType.replace(/_/g, " ")}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                              doc.status === "VERIFIED"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                : doc.status === "REJECTED"
                                ? "bg-rose-50 text-rose-700 border-rose-300"
                                : "bg-amber-50 text-amber-700 border-amber-300"
                            }`}
                          >
                            {doc.status}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 mt-1 truncate">
                          {doc.documentName}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          Uploaded: {doc.uploadedAt} • {doc.fileSize}
                        </p>
                      </div>
                    </div>

                    {/* Quick Card Action */}
                    <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between text-xs font-semibold text-blue-600">
                      <span>Inspect Document</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* TAB 5: AUDIT LOG TIMELINE (Part 2 & 30)                           */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {activeTab === "TIMELINE" && (
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Verification Audit Trail
                  </h3>
                  <p className="text-xs text-slate-500">
                    Immutable activity log recorded under Cooperative Society Rules.
                  </p>
                </div>
              </div>

              {/* Timeline Items */}
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {worker.auditTimeline.map((item) => (
                  <div key={item.id} className="relative group text-xs">
                    <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow-sm" />
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900">{item.action}</span>
                        <span className="font-mono text-[10px] text-slate-400">{item.timestamp}</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed text-[11px]">{item.details}</p>
                      <span className="text-[10px] text-slate-400 block pt-0.5 font-medium">
                        By: <strong className="text-slate-700">{item.adminName}</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─── 4. STICKY ACTION BAR (Zero LEXI overlap) ───────────────────── */}
        <div className="px-5 py-3.5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 hidden sm:flex items-center gap-1.5">
            <Info className="w-4 h-4 text-slate-400" />
            <span>
              {progressPct === 100
                ? "All requirements verified. Ready for approval."
                : `${5 - verifiedChecks} requirement(s) pending verification.`}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {/* Reject Application */}
            <button
              type="button"
              onClick={() => setShowRejectionModal(true)}
              className="flex-1 sm:flex-none px-4 py-2 bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs rounded-xl border border-rose-300 hover:border-rose-400 transition-colors shadow-sm"
            >
              ✕ Reject Application
            </button>

            {/* Request Additional Information */}
            <button
              type="button"
              onClick={() => setShowRequestInfoModal(true)}
              className="flex-1 sm:flex-none px-4 py-2 bg-white hover:bg-amber-50 text-amber-800 font-bold text-xs rounded-xl border border-amber-300 hover:border-amber-400 transition-colors shadow-sm"
            >
              ⚠ Request Clarification
            </button>

            {/* Approve & Verify Worker */}
            <button
              type="button"
              onClick={() => setShowApprovalModal(true)}
              className="flex-1 sm:flex-none px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.98]"
            >
              ✓ Approve & Verify
            </button>
          </div>
        </div>
      </div>

      {/* ─── MODAL: DOCUMENT VIEWER WITH PREV / NEXT NAVIGATION ──────────── */}
      {inspectingDoc && (
        <DocumentViewerModal
          document={inspectingDoc}
          documents={worker.documents}
          currentIndex={inspectingDocIndex ?? 0}
          onNavigate={(idx) => setInspectingDocIndex(idx)}
          onClose={() => setInspectingDocIndex(null)}
          workerName={worker.workerName}
          workerOccupation={worker.occupation}
          certificateAuthority={worker.certificationAuthority}
          certificateId={worker.certificateId}
          onVerify={(docId, notes) => handleApproveDoc(docId, notes)}
          onRequestClarification={(docId, notes) => handleRequestReupload(docId, notes)}
          onReject={(docId, reason) => {
            updateDocumentStatus(worker.id, docId, "REJECTED", reason);
            onWorkerUpdated();
          }}
        />
      )}

      {/* ─── MODAL: CONFIRM APPROVAL ─────────────────────────────────────── */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                Approve Worker Verification?
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Are you sure you want to approve and verify <strong>{worker.workerName}</strong> as a certified artisan in cooperative {worker.societyReg}?
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">
                Admin Audit Notes (Optional)
              </label>
              <textarea
                value={finalAdminNotes}
                onChange={(e) => setFinalAdminNotes(e.target.value)}
                placeholder="e.g. Verified trade certification & physical society roster..."
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowApprovalModal(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleExecuteApproval}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors disabled:opacity-50"
              >
                {isProcessing ? "Processing..." : "Confirm & Verify"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: CONFIRM REJECTION ────────────────────────────────────── */}
      {showRejectionModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <XCircle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                Reject Worker Application?
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Please enter a mandatory rejection reason to be recorded in the cooperative audit trail.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">
                Rejection Reason (Required)
              </label>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none"
              >
                {REJECTION_REASONS.map((r, i) => (
                  <option key={i} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              <textarea
                value={finalAdminNotes}
                onChange={(e) => setFinalAdminNotes(e.target.value)}
                placeholder="Additional details for the worker..."
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none resize-none"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectionModal(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleExecuteRejection}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors disabled:opacity-50"
              >
                {isProcessing ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: REQUEST ADDITIONAL INFORMATION ───────────────────────── */}
      {showRequestInfoModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                Request Additional Information
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Specify what information or documents the worker needs to provide.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">
                Clarification Instructions
              </label>
              <textarea
                value={requestInfoNotes}
                onChange={(e) => setRequestInfoNotes(e.target.value)}
                placeholder="e.g. Please provide a clear scan of the original ITI National Trade Certificate..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none resize-none"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowRequestInfoModal(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleExecuteRequestInfo}
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors disabled:opacity-50"
              >
                {isProcessing ? "Submitting..." : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

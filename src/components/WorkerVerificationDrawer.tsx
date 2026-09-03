"use client";

import React, { useState } from "react";
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
  Download,
  Calendar,
  Layers,
  History,
  Info
} from "lucide-react";
import {
  DetailedKycWorker,
  KycDocument,
  REJECTION_REASONS,
  updateDocumentStatus,
  updateChecklistItem,
  finalizeWorkerKycDecision
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
    "CHECKLIST" | "PERSONAL" | "SKILLS" | "DOCUMENTS" | "TIMELINE"
  >("CHECKLIST");

  // Selected document for modal viewer
  const [inspectingDoc, setInspectingDoc] = useState<KycDocument | null>(null);

  // Document action prompt (Reject or Re-upload reason)
  const [rejectionTargetDoc, setRejectionTargetDoc] = useState<KycDocument | null>(null);
  const [selectedReason, setSelectedReason] = useState<string>(REJECTION_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>("");

  // Final confirmation modal
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [finalAdminNotes, setFinalAdminNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  if (!worker) return null;

  // Calculate verification progress
  const totalChecks = worker.checklist.length || 5;
  const verifiedChecks = worker.checklist.filter((c) => c.status === "VERIFIED").length;
  const progressPct = Math.round((verifiedChecks / totalChecks) * 100);

  // Handlers for document actions
  const handleApproveDoc = (docId: string) => {
    updateDocumentStatus(worker.id, docId, "VERIFIED");
    onWorkerUpdated();
  };

  const handleOpenRejectPrompt = (doc: KycDocument) => {
    setRejectionTargetDoc(doc);
    setSelectedReason(REJECTION_REASONS[0]);
    setCustomReason("");
  };

  const handleConfirmRejectDoc = () => {
    if (!rejectionTargetDoc) return;
    const finalReason = customReason.trim() || selectedReason;
    updateDocumentStatus(worker.id, rejectionTargetDoc.id, "REJECTED", finalReason);
    setRejectionTargetDoc(null);
    onWorkerUpdated();
  };

  const handleRequestReupload = (docId: string) => {
    updateDocumentStatus(worker.id, docId, "REQUIRES_REVIEW", "Re-upload requested: Unclear scan / details missing");
    onWorkerUpdated();
  };

  // Handlers for checklist item toggles
  const handleToggleChecklist = (checkId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "VERIFIED" ? "PENDING" : "VERIFIED";
    updateChecklistItem(worker.id, checkId, nextStatus as any);
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
    }, 600);
  };

  const handleExecuteRejection = () => {
    setIsProcessing(true);
    setTimeout(() => {
      finalizeWorkerKycDecision(worker.id, "REJECTED", finalAdminNotes || "Documentation criteria not met");
      setIsProcessing(false);
      setShowRejectionModal(false);
      onWorkerUpdated();
      onClose();
    }, 600);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      />

      {/* Slide-out Inspection Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 border-l border-slate-200">
        
        {/* Top Header */}
        <div className="p-5 bg-slate-900 text-white border-b border-slate-800 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={worker.profilePhoto || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150"}
                alt={worker.workerName}
                className="w-12 h-12 rounded-xl object-cover border-2 border-slate-700 shrink-0"
              />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-bold text-white">{worker.workerName}</h2>
                  <span className="text-[11px] font-semibold text-blue-300 bg-blue-900/60 px-2 py-0.5 rounded border border-blue-700">
                    {worker.occupation}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    worker.overallStatus === "VERIFIED"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : worker.overallStatus === "REJECTED"
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                      : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  }`}>
                    {worker.overallStatus}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  ID: <span className="text-slate-200 font-bold">{worker.workerId}</span> • Society: {worker.societyReg}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Verification Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                5-Tier Cooperative KYC Progress
              </span>
              <span className="font-mono text-blue-400 font-bold">{progressPct}% Complete</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                style={{ width: `${progressPct}%` }}
                className={`h-full transition-all duration-500 ${
                  progressPct === 100
                    ? "bg-emerald-500"
                    : progressPct >= 60
                    ? "bg-blue-500"
                    : "bg-amber-500"
                }`}
              />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 overflow-x-auto text-xs font-bold text-slate-600 no-scrollbar">
          {[
            { id: "CHECKLIST", label: "Checklist", icon: FileCheck },
            { id: "PERSONAL", label: "Personal & Identity", icon: User },
            { id: "SKILLS", label: "Trade Skills", icon: Award },
            { id: "DOCUMENTS", label: `Documents (${worker.documents.length})`, icon: Layers },
            { id: "TIMELINE", label: "Audit Log", icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-700 bg-white font-black"
                    : "border-transparent hover:text-slate-900"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Drawer Body Scroll Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50">
          
          {/* TAB 1: CHECKLIST & INTELLIGENT WARNINGS */}
          {activeTab === "CHECKLIST" && (
            <div className="space-y-4">
              {/* Warnings Banner */}
              {worker.warnings.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5 text-xs text-amber-900">
                  <div className="font-bold flex items-center gap-1.5 text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Intelligent Decision Support &amp; Verification Flags</span>
                  </div>
                  <ul className="space-y-1 text-[11px] list-disc list-inside text-amber-950 font-medium">
                    {worker.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                  <p className="text-[10px] text-amber-700 italic pt-0.5">
                    * Automated checks assist verification; final approval is subject to human cooperative inspection.
                  </p>
                </div>
              )}

              {/* 5-Tier Verification Checklist Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    5-Tier Verification Criteria
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">
                    Click to toggle verified status
                  </span>
                </div>

                <div className="space-y-2">
                  {worker.checklist.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleToggleChecklist(item.id, item.status)}
                      className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-white flex items-center justify-between gap-3 cursor-pointer transition-all"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">
                            [{item.category}]
                          </span>
                          <span className="text-xs font-bold text-slate-900">{item.label}</span>
                        </div>
                        {item.note && (
                          <p className="text-[11px] text-slate-500 font-medium">{item.note}</p>
                        )}
                      </div>

                      <div className="shrink-0">
                        {item.status === "VERIFIED" ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Verified
                          </span>
                        ) : item.status === "REQUIRES_REVIEW" ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Needs Review
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Summary Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Cooperative Society:</span>
                  <span className="font-bold text-slate-800">{worker.cooperativeSociety}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Membership Reg No:</span>
                  <span className="font-mono font-bold text-slate-800">{worker.societyReg}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Primary Trade Certificate:</span>
                  <span className="font-semibold text-slate-800">{worker.certificateName}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PERSONAL & IDENTITY INFORMATION */}
          {activeTab === "PERSONAL" && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-sm text-xs">
                <h3 className="font-bold uppercase text-[11px] tracking-wider text-slate-500 border-b pb-2">
                  Personal Information
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Full Name</span>
                    <span className="font-bold text-slate-900">{worker.workerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Worker ID</span>
                    <span className="font-mono font-bold text-slate-900">{worker.workerId}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Phone Number</span>
                    <span className="font-semibold text-slate-900">{worker.mobile}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Email Address</span>
                    <span className="font-semibold text-slate-900">{worker.email || "Not Provided"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Date of Birth</span>
                    <span className="font-semibold text-slate-900">{worker.dob || "On Record"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Gender</span>
                    <span className="font-semibold text-slate-900">{worker.gender || "On Record"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[11px]">Jurisdiction / Residence</span>
                    <span className="font-semibold text-slate-900">{worker.city}, {worker.district}, {worker.state}</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">{worker.maskedAddress}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-sm text-xs">
                <h3 className="font-bold uppercase text-[11px] tracking-wider text-slate-500 border-b pb-2">
                  Identity Verification (Masked Aadhaar)
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Masked Aadhaar Token</span>
                    <span className="font-mono font-black text-slate-900 text-sm">{worker.aadhaarMasked}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Identity Status</span>
                    <span className="font-bold text-emerald-700">{worker.identityStatus}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Doc Verification Type</span>
                    <span className="font-semibold text-slate-900">{worker.identityDocType}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Submission Date</span>
                    <span className="font-semibold text-slate-900">{worker.submittedDate}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-sm text-xs">
                <h3 className="font-bold uppercase text-[11px] tracking-wider text-slate-500 border-b pb-2">
                  Cooperative Society Details
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Society Name:</span>
                    <span className="font-bold text-slate-900">{worker.cooperativeSociety}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Society Reg No:</span>
                    <span className="font-mono font-bold text-slate-900">{worker.societyReg}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Federation:</span>
                    <span className="font-semibold text-slate-800">{worker.federation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">District Office:</span>
                    <span className="font-semibold text-slate-800">{worker.districtOffice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Membership Status:</span>
                    <span className="font-bold text-emerald-700">{worker.membershipStatus}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SKILL AND CERTIFICATION DETAILS */}
          {activeTab === "SKILLS" && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-sm text-xs">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-bold uppercase text-[11px] tracking-wider text-slate-500">
                    Trade Skill Competency
                  </h3>
                  <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                    {worker.skillLevel}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Primary Profession</span>
                    <span className="font-bold text-slate-900">{worker.occupation}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Verified Experience</span>
                    <span className="font-bold text-slate-900">{worker.experience}</span>
                  </div>
                  {worker.trainingInstitute && (
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[11px]">Training Institute</span>
                      <span className="font-semibold text-slate-800">{worker.trainingInstitute}</span>
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px] mb-1.5">Registered Practical Skills</span>
                  <div className="flex flex-wrap gap-1.5">
                    {worker.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 font-semibold text-[11px]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Certificate Dossier */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-sm text-xs">
                <h3 className="font-bold uppercase text-[11px] tracking-wider text-slate-500 border-b pb-2">
                  Accredited Certification Record
                </h3>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 text-sm">{worker.certificateName}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      {worker.skillVerificationStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-slate-600 font-mono text-[11px]">
                    <div>
                      <span className="text-slate-400">Authority:</span>{" "}
                      <span className="text-slate-900 font-semibold">{worker.certificationAuthority}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Certificate ID:</span>{" "}
                      <span className="text-slate-900 font-bold">{worker.certificateId}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Issued:</span> {worker.certificateIssueDate}
                    </div>
                    <div>
                      <span className="text-slate-400">Expiry:</span> {worker.certificateExpiryDate || "Permanent"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: UPLOADED DOCUMENTS & ACTION CONTROLS */}
          {activeTab === "DOCUMENTS" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <h3 className="font-bold uppercase text-[11px] tracking-wider text-slate-500">
                  Uploaded Document Registry ({worker.documents.length})
                </h3>
                <span className="text-[11px] text-slate-500">
                  Verified by Cooperative Secretary
                </span>
              </div>

              <div className="space-y-3">
                {worker.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3 hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
                          <FileCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{doc.documentName}</h4>
                          <p className="text-[11px] text-slate-500 font-mono">
                            Type: <span className="uppercase">{doc.documentType}</span> • {doc.fileSize} • Uploaded {doc.uploadedAt}
                          </p>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        doc.status === "VERIFIED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : doc.status === "REJECTED"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {doc.status}
                      </span>
                    </div>

                    {doc.rejectionReason && (
                      <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-800 font-medium">
                        ⚠ Rejection Note: {doc.rejectionReason}
                      </div>
                    )}

                    {doc.verifiedBy && (
                      <p className="text-[10px] text-slate-500 italic">
                        Verified by {doc.verifiedBy} at {doc.verifiedAt}
                      </p>
                    )}

                    {/* Action Buttons for this Document */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
                      <button
                        type="button"
                        onClick={() => setInspectingDoc(doc)}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold flex items-center gap-1 transition-all border border-blue-200"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Document</span>
                      </button>

                      {doc.status !== "VERIFIED" && (
                        <button
                          type="button"
                          onClick={() => handleApproveDoc(doc.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold flex items-center gap-1 transition-all border border-emerald-200"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                      )}

                      {doc.status !== "REJECTED" && (
                        <button
                          type="button"
                          onClick={() => handleOpenRejectPrompt(doc)}
                          className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold flex items-center gap-1 transition-all border border-rose-200"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRequestReupload(doc.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium flex items-center gap-1 transition-all border border-slate-200 text-[11px]"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Request Re-upload</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: AUDIT LOG TIMELINE */}
          {activeTab === "TIMELINE" && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-sm text-xs">
              <h3 className="font-bold uppercase text-[11px] tracking-wider text-slate-500 border-b pb-2">
                Cooperative KYC Activity Audit Trail
              </h3>

              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {worker.auditTimeline.map((log) => (
                  <div key={log.id} className="relative space-y-1">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white" />
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-bold text-slate-800">{log.adminName}</span>
                      <span className="text-slate-400 font-mono">{log.timestamp}</span>
                    </div>
                    <p className="text-slate-600 font-medium leading-relaxed">{log.details}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Sticky Decision Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row gap-2.5 shrink-0 shadow-lg">
          <button
            type="button"
            onClick={() => setShowRejectionModal(true)}
            className="px-4 py-2.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          >
            <XCircle className="w-4 h-4" />
            <span>Reject Application</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("DOCUMENTS");
              alert("Please select individual documents above to flag re-upload requests with detailed notes.");
            }}
            className="px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Request Additional Info</span>
          </button>

          <button
            type="button"
            onClick={() => setShowApprovalModal(true)}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Approve &amp; Verify Worker (Tier-5)</span>
          </button>
        </div>

      </div>

      {/* DOCUMENT VIEWER MODAL */}
      <DocumentViewerModal
        document={inspectingDoc}
        onClose={() => setInspectingDoc(null)}
        workerName={worker.workerName}
      />

      {/* DOCUMENT REJECTION REASON PROMPT MODAL */}
      {rejectionTargetDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Reject Document: {rejectionTargetDoc.documentName}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Specify the mandatory verification failure reason for cooperative audit records.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Select Standard Reason</label>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
              >
                {REJECTION_REASONS.map((r, i) => (
                  <option key={i} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Custom Observation / Notes</label>
              <textarea
                rows={2}
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="e.g. Roll number does not exist in 2022 exam list..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setRejectionTargetDoc(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejectDoc}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FINAL APPROVAL CONFIRMATION MODAL */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Confirm Official Cooperative Verification
              </h3>
              <p className="text-xs text-slate-500">
                You are about to mark this artisan as verified under the 5-tier cooperative quality framework.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Artisan Name:</span>
                <span className="font-bold text-slate-900 font-sans">{worker.workerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Worker ID:</span>
                <span className="font-bold text-slate-900">{worker.workerId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Trade Profession:</span>
                <span className="font-bold text-blue-700 font-sans">{worker.occupation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Cooperative Society:</span>
                <span className="font-semibold text-slate-800 font-sans">{worker.cooperativeSociety}</span>
              </div>
              <div className="flex justify-between border-t pt-1.5">
                <span className="text-slate-500 font-sans">Verified Checklist:</span>
                <span className="font-bold text-emerald-700 font-sans">{progressPct}% Passed</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Inspector Remarks (Optional)</label>
              <textarea
                rows={2}
                value={finalAdminNotes}
                onChange={(e) => setFinalAdminNotes(e.target.value)}
                placeholder="e.g. Identity and trade certificate verified against society ledger..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowApprovalModal(false)}
                disabled={isProcessing}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteApproval}
                disabled={isProcessing}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5"
              >
                {isProcessing ? "Verifying..." : "Confirm & Verify Worker"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FINAL REJECTION CONFIRMATION MODAL */}
      {showRejectionModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
              <XCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Reject Worker KYC Application
              </h3>
              <p className="text-xs text-slate-500">
                Provide the primary rejection reason. The worker will be notified with instructions to remediate.
              </p>
            </div>

            <textarea
              rows={3}
              value={finalAdminNotes}
              onChange={(e) => setFinalAdminNotes(e.target.value)}
              placeholder="e.g. Documents failed trade skill authenticity requirements..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-rose-500"
            />

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowRejectionModal(false)}
                disabled={isProcessing}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRejection}
                disabled={isProcessing}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
              >
                {isProcessing ? "Processing..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

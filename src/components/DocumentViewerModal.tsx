"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  Download,
  FileText,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  Building,
  Hash,
  FileCode,
  FileCheck2,
  SendHorizontal
} from "lucide-react";
import { KycDocument } from "@/lib/kycVerificationService";

interface DocumentViewerModalProps {
  document: KycDocument | null;
  onClose: () => void;
  workerName: string;
  workerOccupation?: string;
  certificateAuthority?: string;
  certificateId?: string;
  onVerify?: (docId: string, notes?: string) => void;
  onRequestClarification?: (docId: string, notes?: string) => void;
  onReject?: (docId: string, reason: string) => void;
}

export default function DocumentViewerModal({
  document,
  onClose,
  workerName,
  workerOccupation,
  certificateAuthority,
  certificateId,
  onVerify,
  onRequestClarification,
  onReject,
}: DocumentViewerModalProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [adminNote, setAdminNote] = useState(document?.verificationNotes || "");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectBox, setShowRejectBox] = useState(false);
  const totalPages = document?.fileType === "application/pdf" ? 2 : 1;

  // Accessibility: Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!document) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 250));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(100);
    setRotation(0);
  };

  const handleDownload = () => {
    const a = window.document.createElement("a");
    a.href = document.fileUrl;
    a.target = "_blank";
    a.download = `${workerName}_${document.documentName.replace(/\s+/g, "_")}`;
    a.click();
  };

  const isPdf = document.fileType === "application/pdf" || document.documentName.toLowerCase().includes("pdf");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Document Viewer - ${document.documentName}`}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 lg:p-6 animate-in fade-in duration-200"
    >
      <div
        className={`bg-slate-900 border border-slate-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden transition-all duration-300 w-full ${
          isFullscreen
            ? "fixed inset-0 rounded-none h-full max-h-full"
            : "max-w-6xl h-[90vh] max-h-[850px]"
        }`}
      >
        {/* ─── 1. HEADER BAR ────────────────────────────────────────────── */}
        <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4 text-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100 truncate">
                  {document.documentName}
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    document.status === "VERIFIED"
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      : document.status === "REJECTED"
                      ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                      : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                  }`}
                >
                  {document.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                Artisan: <span className="text-slate-200 font-semibold">{workerName}</span> • Size: {document.fileSize} • Uploaded: {document.uploadedAt}
              </p>
            </div>
          </div>

          {/* Quick Header Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
              title="Download original file"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFullscreen((prev) => !prev)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 border border-slate-800 transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 border border-slate-800 transition-colors"
              title="Close viewer (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ─── 2. TWO-COLUMN WORKSPACE ──────────────────────────────────── */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0 bg-slate-950">
          
          {/* LEFT SIDE: PREVIEW CANVAS & CONTROLS (65%) */}
          <div className="flex-1 flex flex-col min-w-0 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950/70 relative">
            {/* Canvas Toolbar */}
            <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-300 shrink-0">
              {/* Zoom & Rotate Controls */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={zoom <= 50}
                  className="p-1.5 hover:bg-slate-800 rounded text-slate-300 disabled:opacity-30 transition-colors"
                  title="Zoom Out (-)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="font-mono text-[11px] px-2 text-slate-400 min-w-[3rem] text-center">
                  {zoom}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={zoom >= 250}
                  className="p-1.5 hover:bg-slate-800 rounded text-slate-300 disabled:opacity-30 transition-colors"
                  title="Zoom In (+)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                <div className="h-4 w-px bg-slate-700 mx-1.5" />

                <button
                  type="button"
                  onClick={handleRotate}
                  className="flex items-center gap-1 px-2 py-1 hover:bg-slate-800 rounded text-slate-300 transition-colors"
                  title="Rotate 90 degrees"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span className="text-[11px]">{rotation}°</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="px-2 py-1 text-[11px] text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                >
                  Reset
                </button>
              </div>

              {/* PDF Page Navigation */}
              {isPdf && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="p-1 hover:bg-slate-800 rounded text-slate-300 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-mono text-[11px] text-slate-400 px-1">
                    Page {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="p-1 hover:bg-slate-800 rounded text-slate-300 disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Document Render Area */}
            <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center relative select-none">
              {isPdf ? (
                /* PDF Interactive Sheet Preview */
                <div
                  style={{
                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                    transition: "transform 0.2s ease-out",
                  }}
                  className="w-full max-w-xl bg-white text-slate-900 rounded-lg shadow-2xl p-8 border border-slate-300 space-y-6 min-h-[500px]"
                >
                  {/* Formal Certificate Header */}
                  <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-700 text-white flex items-center justify-center text-[10px] font-bold">
                        ★
                      </div>
                      <span className="text-[10px] font-bold tracking-widest text-slate-600 uppercase">
                        Government of India / Cooperative Federation Registry
                      </span>
                    </div>
                    <h4 className="text-base font-black text-slate-900 uppercase tracking-tight">
                      {document.documentName}
                    </h4>
                    <p className="text-[11px] font-medium text-slate-500">
                      Accredited Skill & Competency Verification Docket
                    </p>
                  </div>

                  {/* Body Content */}
                  <div className="space-y-4 text-xs">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 gap-2 font-mono">
                      <div>
                        <span className="text-slate-400 block text-[10px]">CANDIDATE NAME</span>
                        <span className="font-bold text-slate-800 text-sm">{workerName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">DESIGNATION / TRADE</span>
                        <span className="font-bold text-slate-800 text-sm">{workerOccupation || "Certified Artisan"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">REGISTRATION TOKEN</span>
                        <span className="font-bold text-blue-700">{certificateId || "SKL-NCVT-9921"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">ISSUING AUTHORITY</span>
                        <span className="font-bold text-slate-800">{certificateAuthority || "National Council for Vocational Training"}</span>
                      </div>
                    </div>

                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      This official certificate dockets that the bearer has completed prescribed practical training, safety compliance protocols, and trade competencies as per Cooperative Federation Guidelines.
                    </p>

                    <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400">
                      <span>DOC ID: {document.id}</span>
                      <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        OFFICIAL COOPERATIVE COPY
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* High-Res Image Scan Preview */
                <div
                  style={{
                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                    transition: "transform 0.2s ease-out",
                  }}
                  className="max-w-full max-h-full flex items-center justify-center"
                >
                  <img
                    src={document.previewUrl || document.fileUrl}
                    alt={document.documentName}
                    className="max-h-[65vh] w-auto object-contain rounded-lg shadow-2xl border border-slate-800"
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDE: DOCUMENT DETAILS & ADMIN VERIFICATION WORKFLOW (35%) */}
          <div className="w-full lg:w-96 bg-slate-900 flex flex-col shrink-0 overflow-y-auto p-5 space-y-5 border-t lg:border-t-0 border-slate-800 text-slate-200">
            
            {/* 1. DOCUMENT METADATA */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-blue-400" />
                Document Metadata
              </h4>

              <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/60 space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Type</span>
                  <span className="font-semibold text-slate-200 capitalize">
                    {document.documentType.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Certificate No.</span>
                  <span className="font-mono font-bold text-blue-400">
                    {certificateId || "UIDAI-MASKED-4912"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Issuing Body</span>
                  <span className="font-semibold text-slate-200 text-right truncate max-w-[140px]">
                    {certificateAuthority || "Government Registry"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Uploaded On</span>
                  <span className="text-slate-300 font-mono text-[11px]">{document.uploadedAt}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Current Status</span>
                  <span className={`font-bold text-[11px] px-2 py-0.5 rounded-full border ${
                    document.status === "VERIFIED"
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                      : document.status === "REJECTED"
                      ? "bg-rose-500/20 text-rose-400 border-rose-500/40"
                      : "bg-amber-500/20 text-amber-400 border-amber-500/40"
                  }`}>
                    {document.status}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. ADMIN VERIFICATION NOTES */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Admin Verification Notes</span>
                <span className="text-[10px] text-slate-500 font-normal">Audit Logged</span>
              </label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="e.g. Certificate number verified against physical society ledger..."
                rows={3}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all resize-none"
              />
            </div>

            {/* Rejection input box if opened */}
            {showRejectBox && (
              <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl space-y-2 animate-in fade-in">
                <label className="text-xs font-bold text-rose-300">Mandatory Rejection Reason</label>
                <input
                  type="text"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Scan is unreadable or blurry..."
                  className="w-full px-3 py-1.5 bg-slate-950 border border-rose-700/80 rounded-lg text-xs text-rose-100 placeholder-rose-400/50 focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={!rejectionReason.trim()}
                    onClick={() => {
                      if (onReject) onReject(document.id, rejectionReason.trim());
                      setShowRejectBox(false);
                      onClose();
                    }}
                    className="flex-1 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg disabled:opacity-40 transition-colors"
                  >
                    Confirm Rejection
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRejectBox(false)}
                    className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded-lg hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* 3. VERIFICATION ACTIONS */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Verification Action
              </span>

              {/* Verify Button */}
              <button
                type="button"
                onClick={() => {
                  if (onVerify) onVerify(document.id, adminNote);
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.98]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify Document</span>
              </button>

              {/* Request Clarification */}
              <button
                type="button"
                onClick={() => {
                  if (onRequestClarification) {
                    onRequestClarification(
                      document.id,
                      adminNote || "Please provide clear high-resolution scan of original certificate."
                    );
                  }
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs rounded-xl border border-slate-700 transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Request Clarification / Re-upload</span>
              </button>

              {/* Reject Document */}
              <button
                type="button"
                onClick={() => setShowRejectBox(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-rose-900/30 text-rose-300 font-semibold text-xs rounded-xl border border-slate-700 hover:border-rose-700/50 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>Reject Document</span>
              </button>
            </div>

            {/* Compliance Disclaimer */}
            <p className="text-[10px] text-slate-500 text-center leading-relaxed">
              All document decisions are recorded immutably in the Cooperative KYC Audit Trail under Section 8 of the Cooperative Societies Act.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

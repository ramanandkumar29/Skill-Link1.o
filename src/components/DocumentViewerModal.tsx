"use client";

import React, { useState } from "react";
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
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertCircle
} from "lucide-react";
import { KycDocument } from "@/lib/kycVerificationService";

interface DocumentViewerModalProps {
  document: KycDocument | null;
  onClose: () => void;
  workerName: string;
}

export default function DocumentViewerModal({
  document,
  onClose,
  workerName,
}: DocumentViewerModalProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = document?.fileType === "application/pdf" ? 2 : 1;

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

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200">
      <div
        className={`bg-slate-900 border border-slate-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden transition-all duration-300 ${
          isFullscreen ? "w-full h-full rounded-none" : "w-full max-w-4xl max-h-[90vh] h-[85vh]"
        }`}
      >
        {/* Top Header */}
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100 truncate">
                  {document.documentName}
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  document.status === "VERIFIED"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : document.status === "REJECTED"
                    ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                }`}>
                  {document.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Artisan: <span className="text-slate-300 font-semibold">{workerName}</span> • Size: {document.fileSize} • Uploaded: {document.uploadedAt}
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-1 shrink-0">
            <div className="flex items-center bg-slate-800/80 rounded-xl p-1 border border-slate-700/60 mr-1 text-xs">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 disabled:opacity-30"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono text-[11px] text-slate-300 min-w-[3.2rem] text-center">
                {zoom}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 250}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 disabled:opacity-30"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRotate}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 ml-1"
                title="Rotate 90°"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-2 py-1 text-[10px] text-slate-400 hover:text-white font-medium"
              >
                Reset
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownload}
              className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 text-xs font-semibold"
              title="Official Society Inspection Download"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-rose-900/60 rounded-xl border border-slate-700 transition-all ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Document Inspection Canvas */}
        <div className="flex-1 bg-slate-950 overflow-auto flex items-center justify-center p-4 relative select-none">
          <div
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transition: "transform 0.15s ease-out",
            }}
            className="max-w-full max-h-full flex items-center justify-center origin-center"
          >
            {document.fileType === "application/pdf" ? (
              /* PDF Simulation View */
              <div className="w-[580px] min-h-[720px] bg-white rounded-lg shadow-2xl p-8 text-slate-900 flex flex-col justify-between border border-slate-200">
                <div className="space-y-4">
                  <div className="border-b-2 border-slate-800 pb-3 flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-blue-700">
                        Official Verified Credential
                      </span>
                      <h2 className="text-base font-black text-slate-900">{document.documentName}</h2>
                      <p className="text-xs text-slate-600 font-serif">Ministry of Cooperation Verified Labor Federation</p>
                    </div>
                    <div className="w-12 h-12 rounded-full border-2 border-slate-800 flex items-center justify-center font-bold text-xs text-slate-800">
                      SEAL
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Holder Name:</span>
                      <span className="font-bold text-slate-900">{workerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Document Type:</span>
                      <span className="font-bold uppercase">{document.documentType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Verification Status:</span>
                      <span className="font-bold text-emerald-700">{document.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Page:</span>
                      <span>Page {currentPage} of {totalPages}</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-700 font-serif leading-relaxed">
                    <p>
                      This certificate validates the completion of approved vocational training and certified trade skill assessments according to labor cooperative society standards.
                    </p>
                    <p className="text-[11px] text-slate-500 italic">
                      Inspected for registration verification, identity linkage, and cooperative membership validation.
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-[10px] text-slate-500">
                  <span>Verified via Skill-Link Cooperative Federation</span>
                  <span className="font-mono">DOC-ID: {document.id}</span>
                </div>
              </div>
            ) : (
              /* High-Res Image Inspection View */
              <div className="relative shadow-2xl rounded-lg overflow-hidden border border-slate-800 max-w-2xl">
                <img
                  src={document.previewUrl}
                  alt={document.documentName}
                  className="max-h-[70vh] object-contain block mx-auto pointer-events-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar with Security Badge & Pagination */}
        <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Authorized Cooperative Administrator View • Private URLs Protected</span>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono text-slate-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

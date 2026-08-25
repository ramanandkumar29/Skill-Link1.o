"use client";

import React, { useState, useEffect } from "react";
import { getStoredBookings, getStoredWorkers, updateBookingPhoto } from "@/lib/storage";
import { ServiceBooking, Worker } from "@/lib/seedData";
import { speakFemaleHindiText } from "@/lib/voice";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { UserCheck, Briefcase, Calendar, ShieldCheck, Camera, CheckCircle2, Clock, Volume2, Upload } from "lucide-react";

export default function ProfilePage() {
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [registeredWorkers, setRegisteredWorkers] = useState<Worker[]>([]);
  const [uploadingBookingId, setUploadingBookingId] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [finalBill, setFinalBill] = useState<number>(499);

  useEffect(() => {
    setBookings(getStoredBookings());
    setRegisteredWorkers(getStoredWorkers());
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePhotoProof = (bookingId: string) => {
    if (photoPreview) {
      updateBookingPhoto(bookingId, photoPreview, finalBill);
      setBookings(getStoredBookings());
      setUploadingBookingId(null);
      setPhotoPreview(null);
    }
  };

  const playWorkerAudio = (url?: string, name?: string, occupation?: string) => {
    if (url) {
      const audio = new Audio(url);
      audio.play();
    } else {
      const text = `Namaste! Main ${name || "Worker"} hoon, ${occupation || "Technician"}. Sahayak Female Voice AI Verified Profile.`;
      speakFemaleHindiText(text);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <Header activeSection="PROFILE" />

      <div className="max-w-4xl mx-auto space-y-8">
        {/* User Header Card */}
        <div className="glass-panel-3d p-6 sm:p-8 text-white rounded-3xl relative overflow-hidden border border-white/15 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-emerald-400 to-cyan-300 p-0.5 shadow-lg flex items-center justify-center text-slate-950 font-black shrink-0">
              <UserCheck className="w-8 h-8 text-slate-950" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                User & Worker Dashboard
              </h1>
              <p className="text-xs text-slate-300 font-medium">
                Manage active service bookings, post-service work photos, and voice-registered profiles.
              </p>
            </div>
          </div>
        </div>

        {/* Active Service Bookings */}
        <div className="glass-panel-3d p-6 border border-white/10 space-y-4">
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            Service Bookings & Work Proofs ({bookings.length})
          </h2>

          {bookings.length === 0 ? (
            <div className="text-center py-8 bg-slate-950/60 rounded-2xl border border-white/10">
              <Clock className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-xs font-black text-white">No active bookings yet.</p>
              <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                Book a worker from Home Marketplace or QuickFix SOS.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((b) => (
                <div
                  key={b.id}
                  className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <div>
                      <span className="text-[10px] uppercase font-black text-slate-400 block">
                        Booking #{b.id}
                      </span>
                      <h3 className="text-base font-black text-white flex items-center gap-1.5">
                        {b.workerName} ({b.occupation})
                        {b.emergencySos && (
                          <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full font-black">
                            SOS Emergency
                          </span>
                        )}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-black px-3 py-1 rounded-full ${
                          b.status === "Completed"
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
                            : "bg-indigo-950 text-cyan-300 border border-indigo-500/40 animate-pulse"
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-semibold text-slate-300">
                    <div>Client: <span className="font-bold text-white">{b.clientName}</span></div>
                    <div>Phone: <span className="font-bold text-white">{b.clientPhone}</span></div>
                    <div>Date: <span className="font-bold text-white">{b.bookingDate}</span></div>
                  </div>

                  {b.completionPhotoUrl ? (
                    <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex items-center gap-4">
                      <img
                        src={b.completionPhotoUrl}
                        alt="Completed Work"
                        className="w-16 h-16 object-cover rounded-xl shadow-md border border-emerald-400"
                      />
                      <div>
                        <span className="text-xs font-black text-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Work Completion Verified
                        </span>
                        <p className="text-xs text-slate-300 mt-0.5">
                          Final Amount Paid: <span className="font-black text-white">₹{b.finalBillAmount || 499}</span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                      <span className="text-xs text-amber-300 font-extrabold">
                        Visit Fee ₹149 Paid • Awaiting Work Photo Proof
                      </span>
                      <button
                        onClick={() => setUploadingBookingId(b.id)}
                        className="px-3.5 py-1.5 btn-3d-tactile text-xs font-black"
                      >
                        <Camera className="w-3.5 h-3.5" /> Upload Photo Proof
                      </button>
                    </div>
                  )}

                  {uploadingBookingId === b.id && (
                    <div className="p-4 bg-slate-900 rounded-2xl border border-indigo-500/40 space-y-3 mt-3">
                      <h4 className="text-xs font-black uppercase text-white">
                        Upload Completion Photo for #{b.id}
                      </h4>

                      <div className="border-2 border-dashed border-white/20 rounded-xl p-3 text-center cursor-pointer relative bg-slate-950">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        {photoPreview ? (
                          <img src={photoPreview} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                        ) : (
                          <div className="text-xs text-slate-400 font-bold py-2">
                            <Upload className="w-6 h-6 text-cyan-400 mx-auto mb-1" />
                            Select Work Photo
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-xs font-black text-slate-300">
                          Final Bill: ₹
                          <input
                            type="number"
                            value={finalBill}
                            onChange={(e) => setFinalBill(Number(e.target.value))}
                            className="w-16 px-1.5 py-0.5 border border-white/20 rounded bg-slate-950 text-cyan-300 font-black ml-1"
                          />
                        </div>
                        <button
                          onClick={() => handleSavePhotoProof(b.id)}
                          disabled={!photoPreview}
                          className="px-4 py-2 btn-3d-emerald-shine text-xs font-black disabled:opacity-50"
                        >
                          Save Photo Proof & Complete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Registered Workers */}
        <div className="glass-panel-3d p-6 border border-white/10 space-y-4">
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-400" />
            Registered Marketplace Professionals ({registeredWorkers.length})
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {registeredWorkers.map((w) => (
              <div
                key={w.id}
                className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={w.avatarUrl || w.avatar}
                    alt={w.name}
                    className="w-12 h-12 rounded-xl object-cover border border-indigo-400/40"
                  />
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-1">
                      {w.name}
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    </h3>
                    <p className="text-xs text-emerald-400 font-black">{w.occupation}</p>
                    <p className="text-[11px] text-slate-400 font-medium">{w.location}</p>
                  </div>
                </div>

                <button
                  onClick={() => playWorkerAudio(w.audioSnippetUrl, w.name, w.occupation)}
                  className="p-2.5 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-cyan-300 font-bold text-xs flex items-center gap-1 border border-indigo-500/40"
                  title="Play Audio Intro Snippet"
                >
                  <Volume2 className="w-4 h-4 text-cyan-300" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav activeSection="PROFILE" />
    </div>
  );
}

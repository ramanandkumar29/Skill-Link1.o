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
      const text = `Namaste! Main ${name || "Worker"} hoon, ${occupation || "Technician"}. Verified Skill-Link Profile.`;
      speakFemaleHindiText(text);
    }
  };

  return (
    <div className="space-y-6 pb-20 text-slate-900">
      <Header activeSection="PROFILE" />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* User Header Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Customer Bookings & Verified History
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Track appointments, inspection visit fees, and completion proofs.
              </p>
            </div>
          </div>
        </div>

        {/* Active Bookings List */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            Your Scheduled Bookings ({bookings.length})
          </h2>

          {bookings.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <Clock className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs font-semibold text-slate-700">No active bookings yet</p>
              <p className="text-[11px] text-slate-500">Book any verified technician from the marketplace to track status here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <div key={b.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{b.serviceType}</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {b.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Assigned Pro: <span className="font-semibold text-slate-800">{b.workerName}</span> • {b.bookingDate}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase block">Visit Fee</span>
                      <span className="text-sm font-bold text-slate-900">₹{b.visitFeeAmount || 149}</span>
                    </div>
                  </div>

                  {/* Photo proof */}
                  {b.completionPhotoUrl ? (
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center gap-3">
                      <img src={b.completionPhotoUrl} alt="Proof" className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
                      <div className="text-xs">
                        <span className="font-semibold text-emerald-700 block flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Photo Proof Verified
                        </span>
                        <span className="text-slate-500">Final Settlement: ₹{b.finalBillAmount || 499}</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {uploadingBookingId === b.id ? (
                        <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
                          <input type="file" accept="image/*" onChange={handlePhotoUpload} className="text-xs text-slate-600" />
                          {photoPreview && (
                            <div className="flex items-center gap-3 pt-2">
                              <img src={photoPreview} alt="Preview" className="w-10 h-10 rounded object-cover" />
                              <input
                                type="number"
                                value={finalBill}
                                onChange={(e) => setFinalBill(Number(e.target.value))}
                                className="px-2 py-1 border rounded text-xs w-28"
                                placeholder="Total bill ₹"
                              />
                              <button
                                onClick={() => handleSavePhotoProof(b.id)}
                                className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-bold"
                              >
                                Save Proof
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => setUploadingBookingId(b.id)}
                          className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Camera className="w-3.5 h-3.5" /> Upload Work Completion Photo
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav activeSection="PROFILE" />
    </div>
  );
}

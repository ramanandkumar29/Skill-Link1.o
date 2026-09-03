"use client";

import React, { useState } from "react";
import { ChatMessageItem, LexiWorkerCardData, LexiServiceCardData } from "./types";
import {
  LexiWorkerCard,
  LexiServiceCard,
  LexiBookingCard,
  LexiBookingPreviewCard,
  LexiSOSCard,
  LexiRateCard,
} from "./RichResponseCards";
import { Sparkles, User, MapPin, Navigation, Compass, AlertCircle, Volume2 } from "lucide-react";
import { lexiVoice } from "@/lib/lexiVoice";

interface ChatMessageProps {
  message: ChatMessageItem;
  onBookWorker?: (worker: LexiWorkerCardData) => void;
  onSelectService?: (service: LexiServiceCardData) => void;
  onShareLocation?: (lat?: number, lng?: number, locationName?: string) => void;
  onSendMessage?: (text: string) => void;
}

const POPULAR_AREAS = [
  "Sector 17, Chandigarh",
  "Sector 22, Chandigarh",
  "Sector 35, Chandigarh",
  "Mohali",
  "Panchkula",
];

export default function ChatMessage({
  message,
  onBookWorker,
  onSelectService,
  onShareLocation,
  onSendMessage,
}: ChatMessageProps) {
  const isUser = message.role === "user";
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [manualArea, setManualArea] = useState("");
  const [feedbackState, setFeedbackState] = useState<"helpful" | "not_helpful" | null>(null);

  const handleGetGPSLocation = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser. Please type your area below.");
      return;
    }

    setIsLocating(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;
        onShareLocation?.(latitude, longitude, "Current GPS Location");
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGpsError("Location permission was denied. You can pick an area chip or type your sector name below.");
        } else {
          setGpsError("Could not retrieve GPS coordinates. Please select an area below.");
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualArea.trim()) {
      onShareLocation?.(undefined, undefined, manualArea.trim());
      setManualArea("");
    }
  };

  return (
    <div
      className={`flex items-start gap-3 my-3 animate-in fade-in slide-in-from-bottom-2 duration-200 ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center shadow-sm ${
          isUser ? "bg-slate-200 text-slate-700" : "bg-blue-600 text-white"
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
      </div>

      {/* Message Content Container */}
      <div className={`flex flex-col space-y-2 max-w-[85%] sm:max-w-[75%] ${isUser ? "items-end" : "items-start"}`}>
        {/* Safety Warning Card */}
        {message.safetyWarning && (
          <div className="w-full mb-1 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 font-semibold flex items-start gap-2 shadow-sm animate-pulse">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>{message.safetyWarning}</div>
          </div>
        )}

        {/* Structured AI Analysis Badge */}
        {message.structuredAnalysis && (
          <div className="w-full mb-1 p-2.5 bg-blue-50/90 border border-blue-200 rounded-xl text-xs text-slate-800 shadow-sm space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-1.5 font-bold">
              <span className="text-blue-900 flex items-center gap-1">
                <span>🛠️</span>
                <span>{message.structuredAnalysis.service}: {message.structuredAnalysis.problem_type}</span>
              </span>
              <span
                className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] uppercase ${
                  message.structuredAnalysis.urgency.includes("EMERGENCY")
                    ? "bg-rose-600 text-white animate-pulse"
                    : message.structuredAnalysis.urgency === "HIGH"
                    ? "bg-amber-100 text-amber-900 border border-amber-300"
                    : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                }`}
              >
                {message.structuredAnalysis.urgency.replace("_", " ")}
              </span>
            </div>
            <div className="text-[11px] text-slate-600">
              Recommended: <strong>{message.structuredAnalysis.recommended_action}</strong>
            </div>
          </div>
        )}

        {/* Bubble */}
        <div
          className={`px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
            isUser
              ? "bg-blue-600 text-white rounded-tr-sm"
              : message.isError
              ? "bg-rose-50 border border-rose-200 text-rose-800 rounded-tl-sm"
              : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm"
          }`}
        >
          <div className="whitespace-pre-wrap">{message.content}</div>

          {/* Voice Speak Audio Button & Feedback on Assistant Message */}
          {!isUser && !message.isError && (
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] text-slate-400 font-medium">{message.timestamp}</span>

              <div className="flex items-center gap-3">
                {/* Helpful Feedback Buttons */}
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  {feedbackState ? (
                    <span className="text-emerald-600 font-medium">
                      {feedbackState === "helpful" ? "Thanks! 👍" : "Feedback noted 👎"}
                    </span>
                  ) : (
                    <>
                      <span>Helpful?</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFeedbackState("helpful");
                          fetch("/api/lexi/feedback", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              messageId: message.id,
                              response: message.content,
                              feedback: "helpful",
                              serviceIdentified: message.structuredAnalysis?.service,
                            }),
                          }).catch(() => {});
                        }}
                        className="hover:scale-125 transition-transform"
                        title="Helpful"
                      >
                        👍
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFeedbackState("not_helpful");
                          fetch("/api/lexi/feedback", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              messageId: message.id,
                              response: message.content,
                              feedback: "not_helpful",
                              serviceIdentified: message.structuredAnalysis?.service,
                            }),
                          }).catch(() => {});
                        }}
                        className="hover:scale-125 transition-transform"
                        title="Not Helpful"
                      >
                        👎
                      </button>
                    </>
                  )}
                </div>

                {message.content && (
                  <button
                    type="button"
                    onClick={() => lexiVoice.speak(message.content, { force: true })}
                    className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md transition-colors"
                    title="Listen to Lexi voice audio"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>Listen</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Location Request Card */}
        {message.requiresLocation && (
          <div className="w-full p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>Share Location for Nearby Search</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Allow browser GPS or pick your area to sort closest verified technicians.
            </p>

            <button
              onClick={handleGetGPSLocation}
              disabled={isLocating}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Navigation className={`w-4 h-4 ${isLocating ? "animate-spin" : ""}`} />
              <span>{isLocating ? "Acquiring GPS..." : "Share Live GPS Location"}</span>
            </button>

            {gpsError && (
              <div className="flex items-center gap-1.5 text-[11px] text-rose-600 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{gpsError}</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                Or Select Your Area:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_AREAS.map((area) => (
                  <button
                    key={area}
                    onClick={() => onShareLocation?.(undefined, undefined, area)}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleManualSubmit} className="flex gap-1.5 pt-1">
              <input
                type="text"
                value={manualArea}
                onChange={(e) => setManualArea(e.target.value)}
                placeholder="Type sector or area name..."
                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold"
              >
                Set
              </button>
            </form>
          </div>
        )}

        {/* Rich Response Cards */}
        {message.richPayload && (
          <div className="w-full space-y-3 pt-1">
            {message.richPayload.workers && (
              <div className="space-y-3">
                {message.richPayload.workers.map((worker) => (
                  <LexiWorkerCard
                    key={worker.workerId}
                    worker={worker}
                    onBook={() => onSendMessage?.(`Book ${worker.name} tomorrow at 10 AM`)}
                  />
                ))}
              </div>
            )}

            {message.richPayload.bookingPreview && (
              <LexiBookingPreviewCard
                preview={message.richPayload.bookingPreview}
                onConfirm={() => onSendMessage?.("Confirm")}
                onModify={() => onSendMessage?.("Change time to 2 PM")}
                onCancel={() => onSendMessage?.("Cancel booking")}
              />
            )}

            {message.richPayload.service && (
              <LexiServiceCard
                service={message.richPayload.service}
                onSelect={(s) => onSendMessage?.(`Find ${s.name} workers near me`)}
              />
            )}

            {message.richPayload.booking && (
              <LexiBookingCard booking={message.richPayload.booking} />
            )}

            {message.richPayload.sos && <LexiSOSCard sos={message.richPayload.sos} />}

            {message.richPayload.rateEstimate && (
              <LexiRateCard estimate={message.richPayload.rateEstimate} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

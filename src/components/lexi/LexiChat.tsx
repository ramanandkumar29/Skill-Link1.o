"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChatMessageItem, LexiWorkerCardData, LexiServiceCardData } from "./types";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import SuggestedPrompts from "./SuggestedPrompts";
import TypingIndicator from "./TypingIndicator";
import { lexiVoice, VoiceLanguage } from "@/lib/lexiVoice";
import {
  Sparkles,
  X,
  Minimize2,
  Maximize2,
  Trash2,
  Volume2,
  VolumeX,
  Sliders,
  RotateCcw,
  Square,
  Check
} from "lucide-react";

interface LexiChatProps {
  onBookWorker?: (worker: LexiWorkerCardData) => void;
  onSelectService?: (service: LexiServiceCardData) => void;
}

export default function LexiChat({ onBookWorker, onSelectService }: LexiChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false); // Auto speech OFF by default
  const [voiceLang, setVoiceLang] = useState<VoiceLanguage>("hi-IN");
  const [interimText, setInterimText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isLoading, isOpen]);

  // Sync voice speaking states
  useEffect(() => {
    const checkVoiceState = () => {
      setIsSpeaking(lexiVoice.isSpeakingNow());
    };
    const interval = setInterval(checkVoiceState, 200);
    return () => clearInterval(interval);
  }, []);

  // Modal active listener to completely eliminate UI overlap with modals & drawers
  const [isModalActive, setIsModalActive] = useState(false);

  useEffect(() => {
    const handleModalOpen = () => setIsModalActive(true);
    const handleModalClose = () => setIsModalActive(false);

    window.addEventListener("skill-link-modal-open", handleModalOpen);
    window.addEventListener("skill-link-modal-close", handleModalClose);

    const handleOpenLexiWorker = (e: any) => {
      const workerInfo = e?.detail;
      setIsOpen(true);
      if (workerInfo?.workerName) {
        handleSendMessage(
          `Please provide a verification audit summary for worker ${workerInfo.workerName} (${workerInfo.workerId || ""}, ${workerInfo.occupation || ""}).`
        );
      }
    };
    window.addEventListener("skill-link-open-lexi-worker", handleOpenLexiWorker);

    return () => {
      window.removeEventListener("skill-link-modal-open", handleModalOpen);
      window.removeEventListener("skill-link-modal-close", handleModalClose);
      window.removeEventListener("skill-link-open-lexi-worker", handleOpenLexiWorker);
    };
  }, []);

  // Voice recognition callbacks
  const handleToggleVoice = () => {
    if (isListening) {
      lexiVoice.stopListening();
      setIsListening(false);
      setInterimText("");
    } else {
      lexiVoice.stopSpeaking();
      setIsListening(true);
      setInterimText("");

      lexiVoice.startListening({
        language: voiceLang,
        onResult: (transcript, isFinal) => {
          if (isFinal) {
            setIsListening(false);
            setInterimText("");
            handleSendMessage(transcript);
          } else {
            setInterimText(transcript);
          }
        },
        onError: (err) => {
          console.error("Voice Error:", err);
          setIsListening(false);
          setInterimText("");
        },
        onEnd: () => {
          setIsListening(false);
          setInterimText("");
        },
      });
    }
  };

  const handleToggleLanguage = () => {
    const nextLang: VoiceLanguage = voiceLang.startsWith("hi") ? "en-IN" : "hi-IN";
    setVoiceLang(nextLang);
  };

  // Auto-welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: "welcome-1",
          role: "assistant",
          content: "Namaste! Main hoon LEXI (Labour Experience & Intelligent Assistant) 🤖\n\nAap apni problem seedhe shabdon me batayein (English, Hindi ya Punjabi me)—jaise: 'Bathroom ka pipe leak ho raha hai' ya 'Switchboard se sparks aa rahe hain'. Main problem aur urgency samajhkar aapke paas ke verified cooperative workers recommend karunga!",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, [isOpen, messages.length]);

  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [voiceMode, setVoiceMode] = useState<"auto" | "hindi" | "english" | "hinglish">("auto");

  function getOfflineLexiResponse(text: string): { reply: string; richPayload?: any } {
    const lower = text.toLowerCase();

    // 1. Gas Leak Emergency (Part 9)
    if (lower.includes("gas") && (lower.includes("leak") || lower.includes("smell") || lower.includes("cylinder") || lower.includes("pipe"))) {
      return {
        reply: "🚨 CRITICAL SAFETY WARNING: Gas cylinder leak / smell detected!\n\n1. Kripya kisi bhi electrical switch ko on ya off na karein.\n2. Matchstick, lighter ya koi spark bilkul na lagayein.\n3. Khidkiyan aur darwaze turant khol dein ventilation ke liye.\n4. Regulator valve band karein aur safe open area me bahar nikal jayein.\n5. Emergency Gas Helpline 1906 par turant call karein.",
      };
    }

    // 2. Electrical Spark Safety (Part 9)
    if (lower.includes("spark") || lower.includes("smoke") || lower.includes("fire") || lower.includes("current lag")) {
      return {
        reply: "🚨 CRITICAL ELECTRICAL SAFETY ALERT:\n\nSafety ke liye turant main MCB / switch off kar dein aur geele haathon se kisi switchboard ya wire ko touch na karein!\n\nMaine emergency verified wireman Anil Kumar Maurya (NCVT Certified, ~1.1 km away) ko standby par rakha hai. Doorstep initial inspection charge ₹149 hai.",
        richPayload: {
          type: "workers",
          workers: [
            {
              workerId: "2",
              name: "Anil Kumar Maurya",
              occupation: "Licensed Wireman & Electrician",
              category: "electrician",
              rating: 4.8,
              reviewsCount: 94,
              visitingFee: 149,
              hourlyRate: 299,
              avatarUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80",
              phone: "9876543213",
              distanceKm: 1.1,
              skills: ["Short Circuit Recovery", "MCB Tripping Fix", "3-Phase Panel"],
              badge: "Expert",
            },
          ],
        },
      };
    }

    // 3. Ambiguous Plumbing Request (Part 8)
    if (lower.includes("leak") || lower.includes("pipe") || lower.includes("pani") || lower.includes("bathroom") || lower.includes("drain")) {
      return {
        reply: "Samajh gaya. Agar paani leak ho raha hai, to main nearby verified cooperative plumber dhoondne mein help kar sakta hoon.\n\nAap bata sakte hain:\n1. Leak slow hai ya paani continuously bah raha hai?\n2. Leak bathroom ke pipe se hai ya tap / valve se?\n\nVerified plumber initial travel & diagnosis inspection fee ₹149 hai.",
        richPayload: {
          type: "workers",
          workers: [
            {
              workerId: "1",
              name: "Ramanand Sharma",
              occupation: "Master Plumber & Pipe Specialist",
              category: "plumber",
              rating: 4.9,
              reviewsCount: 128,
              visitingFee: 149,
              hourlyRate: 349,
              avatarUrl: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80",
              phone: "9876543210",
              distanceKm: 1.2,
              skills: ["Emergency Pipe Bursts", "Bathroom Fitting", "Concealed Leak Detection"],
              badge: "Legendary",
            },
          ],
        },
      };
    }

    // 4. Transparent Pricing Inquiries (Part 12 & 13)
    if (lower.includes("price") || lower.includes("rate") || lower.includes("fee") || lower.includes("charge") || lower.includes("kitna") || lower.includes("visiting")) {
      return {
        reply: "Skill-Link transparent pricing structure par chalta hai:\n\n• Visiting / Inspection Charge: ₹149 (Verified artisan ke travel aur doorstep problem analysis ke liye).\n• 3% PMSBY Cooperative Welfare Pool: ₹4.5 (Worker accident insurance fund).\n• Final Work Estimate: Inspection ke baad artisan labor aur parts ka itemized bill dega. Aapke approve karne ke baad hi kaam shuru hoga!",
      };
    }

    // 5. Painting
    if (lower.includes("paint") || lower.includes("rang") || lower.includes("wall")) {
      return {
        reply: "Maine aapki requirement samajh li hai: Home Painting & Wall Aesthetics. Humare cooperative federation ke certified Master Painter Ramanand Kumar (4 saal ka experience, 4.9 rating) aapke area Sector 17 / Tricity me available hain. Fixed inspection visiting fee ₹149 hai.",
        richPayload: {
          type: "workers",
          workers: [
            {
              workerId: "w-ramanand-kumar",
              name: "Ramanand Kumar",
              occupation: "Master House Painter & Wall Texture Specialist",
              category: "painter",
              rating: 4.9,
              reviewsCount: 142,
              visitingFee: 149,
              hourlyRate: 349,
              avatarUrl: "/workers/ramanand-kumar.png",
              phone: "6203637790",
              distanceKm: 1.2,
              skills: ["Interior Emulsion", "Waterproofing & Putty", "Artistic Texture"],
              badge: "Legendary",
            },
          ],
        },
      };
    }

    // 6. Routine Electrical
    if (lower.includes("electric") || lower.includes("bijli") || lower.includes("switch") || lower.includes("fan")) {
      return {
        reply: "Maine Electrical repair issue identify kiya hai. Hamare certified wireman Anil Kumar Maurya (NCVT certified, 5 saal experience) available hain. Visiting inspection charge ₹149 hai.",
        richPayload: {
          type: "workers",
          workers: [
            {
              workerId: "2",
              name: "Anil Kumar Maurya",
              occupation: "Licensed Wireman & Electrician",
              category: "electrician",
              rating: 4.8,
              reviewsCount: 94,
              visitingFee: 149,
              hourlyRate: 299,
              avatarUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80",
              phone: "9876543213",
              distanceKm: 1.1,
              skills: ["Short Circuit Recovery", "MCB Tripping Fix", "3-Phase Panel"],
              badge: "Expert",
            },
          ],
        },
      };
    }
    if (lower.includes("puncture") || lower.includes("tyre") || lower.includes("road") || lower.includes("highway") || lower.includes("tow") || lower.includes("battery")) {
      return {
        reply: "🚨 15-Minute Highway & Roadside SOS Detected! Hamari nearest emergency garage 'Verma 24x7 Tyre Puncture & Stepney Works' ko priority notification bhej di gayi hai.",
      };
    }
    if (lower.includes("institution") || lower.includes("school") || lower.includes("hospital") || lower.includes("bulk") || lower.includes("office")) {
      return {
        reply: "🏢 Institutional Bulk Service: Skill-Link schools, hospitals aur offices ke liye 5 se 50+ cooperative workers provide karta hai with transparent GST invoicing aur cooperative welfare compliance.",
      };
    }
    if (lower.includes("welfare") || lower.includes("insurance") || lower.includes("wage") || lower.includes("fund") || lower.includes("passbook")) {
      return {
        reply: "🛡️ Cooperative Fair Wage & Welfare: Skill-Link par 100% fair base wage worker ko direct milti hai, aur har transaction me 3% welfare fund Pradhan Mantri Suraksha Bima Yojana (PMSBY) aur healthcare safety pool me jama hota hai.",
      };
    }
    return {
      reply: `Main aapki query '${text}' ko analyze karke verified cooperative workers locate kar raha hoon. Aap direct category filters (Electrician, Plumber, Painter, Mason) se bhi top verified artisans book kar sakte hain!`,
    };
  }

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessageItem = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/lexi/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          conversationHistory: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

      const assistantMsg: ChatMessageItem = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.reply || "Aapke request ke hisaab se mujhe verified details mil gayi hain.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        richPayload: data.richPayload,
        requiresLocation: data.requiresLocation,
        structuredAnalysis: data.structuredAnalysis,
        safetyWarning: data.safetyWarning,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Speak response if voice is enabled
      if (voiceEnabled && data.reply) {
        lexiVoice.speak(data.reply, voiceLang);
      }
    } catch (err) {
      console.warn("Lexi server query redirected to cooperative intelligent engine:", err);
      const fallback = getOfflineLexiResponse(text);
      const assistantMsg: ChatMessageItem = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: fallback.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        richPayload: fallback.richPayload,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      if (voiceEnabled && fallback.reply) {
        lexiVoice.speak(fallback.reply, voiceLang);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    try {
      await fetch("http://localhost:5000/api/lexi/clear", { method: "POST" });
    } catch (e) {
      console.error("Error clearing chat session", e);
    }
    setMessages([]);
    lexiVoice.stopSpeaking();
  };

  const handleShareLocation = (lat?: number, lng?: number, locationName?: string) => {
    if (lat && lng) {
      handleSendMessage(`Meri live location hai: Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`);
    } else if (locationName) {
      handleSendMessage(`Meri location ${locationName} hai`);
    }
  };

  return (
    <>
      {/* ─── 1. FLOATING LAUNCHER BUTTON ─────────────────────────────────── */}
      {!isOpen && !isModalActive && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 group flex items-center gap-2.5 px-4 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl hover:scale-102 active:scale-98 transition-all"
          title="Open Lexi AI Assistant"
        >
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>

          <div className="text-left pr-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white tracking-wide">
                🤖 Ask LEXI
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[10px] text-blue-100 font-medium">Smart AI Assistant</p>
          </div>
        </button>
      )}

      {/* ─── 2. MAIN CHAT MODAL CONTAINER ──────────────────────────────────── */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-200 ease-out flex flex-col shadow-2xl rounded-2xl overflow-hidden border border-slate-200 bg-white ${
            isExpanded
              ? "inset-4 sm:inset-10 max-w-5xl mx-auto h-[calc(100vh-2rem)] sm:h-[calc(100vh-5rem)]"
              : "bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[420px] h-[600px] max-h-[90vh]"
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
                <Sparkles className="w-4 h-4 text-white" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-slate-900">LEXI 🤖</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    Cooperative AI
                  </span>
                </div>
                <p className="text-[10px] font-medium text-slate-500">
                  {isSpeaking
                    ? "🔊 Speaking..."
                    : isListening
                    ? "🎤 Listening..."
                    : "Labour Experience & Intelligent Assistant"}
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowVoiceSettings((prev) => !prev)}
                title="Voice & Speech Settings (Auto-speak, Speed, Language)"
                className={`p-2 rounded-lg transition-all ${
                  showVoiceSettings
                    ? "bg-blue-100 text-blue-700"
                    : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Sliders className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  const next = !voiceEnabled;
                  setVoiceEnabled(next);
                  lexiVoice.setVoiceEnabled(next);
                }}
                title={voiceEnabled ? "Mute Lexi Voice" : "Unmute Lexi Voice"}
                className={`p-2 rounded-lg transition-all ${
                  voiceEnabled
                    ? "bg-blue-50 text-blue-600 border border-blue-200"
                    : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                }`}
              >
                {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={handleClearChat}
                title="Clear chat"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                title={isExpanded ? "Collapse" : "Expand"}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors hidden sm:block"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ─── VOICE SETTINGS DRAWER (Part 10 & 11) ────────────────────── */}
          {showVoiceSettings && (
            <div className="px-4 py-3 bg-slate-900 text-white border-b border-slate-800 text-xs space-y-3 animate-in slide-in-from-top-2 duration-150 shrink-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 uppercase tracking-wider text-[10px]">
                  Voice & Speech Settings
                </span>
                <span className="text-[10px] text-slate-400">
                  {lexiVoice.hasNaturalHindiVoice() ? "Native Hindi Voice Detected" : "System Synthesis"}
                </span>
              </div>

              {/* Auto-Speak Mode Toggle (Part 10: Default OFF) */}
              <div className="flex items-center justify-between p-2 bg-slate-800/80 rounded-xl border border-slate-700">
                <div>
                  <span className="font-bold text-white block">Auto-Speak Responses</span>
                  <span className="text-[10px] text-slate-400 block">
                    {voiceEnabled ? "Voice speaks automatically" : "OFF (Voice only plays when you click Listen)"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !voiceEnabled;
                    setVoiceEnabled(next);
                    lexiVoice.setVoiceEnabled(next);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                    voiceEnabled
                      ? "bg-blue-600 text-white border-blue-500"
                      : "bg-slate-700 text-slate-300 border-slate-600"
                  }`}
                >
                  {voiceEnabled ? "ON" : "OFF (Default)"}
                </button>
              </div>

              {/* Language Mode Selection (Part 11) */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 block">Accent & Language:</span>
                <div className="grid grid-cols-4 gap-1">
                  {(["auto", "hindi", "english", "hinglish"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setVoiceMode(mode);
                        lexiVoice.setVoiceMode(mode);
                      }}
                      className={`py-1 text-[10px] font-bold rounded-md border transition-colors uppercase ${
                        voiceMode === mode
                          ? "bg-blue-600 text-white border-blue-500"
                          : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750"
                      }`}
                    >
                      {mode === "auto" ? "Auto" : mode === "hindi" ? "Hindi" : mode === "english" ? "English" : "Hinglish"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Playback Speed Controls */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-400 mr-1">Speed:</span>
                  {[0.75, 1.0, 1.25].map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => {
                        setPlaybackSpeed(spd);
                        lexiVoice.setPlaybackSpeed(spd);
                      }}
                      className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border ${
                        playbackSpeed === spd
                          ? "bg-blue-600 text-white border-blue-500"
                          : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750"
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => lexiVoice.replay()}
                    className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-750 text-slate-200 text-[10px] font-semibold rounded border border-slate-700 transition-colors"
                    title="Replay last spoken message"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Replay</span>
                  </button>
                  {isSpeaking && (
                    <button
                      type="button"
                      onClick={() => lexiVoice.stopSpeaking()}
                      className="flex items-center gap-1 px-2 py-1 bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-[10px] font-semibold rounded border border-rose-700 transition-colors"
                      title="Stop speaking"
                    >
                      <Square className="w-3 h-3 fill-rose-300" />
                      <span>Stop</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─── 3. CONVERSATION MESSAGES AREA ────────────────────────────── */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 scroll-smooth">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col justify-between py-2 space-y-4">
                {/* Welcome Card */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2 text-center">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center mx-auto text-white shadow-sm">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Hi! I&apos;m Lexi 👋
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                    Ask me to find plumbers, compare technicians, get rate estimates, or schedule doorstep bookings.
                  </p>
                </div>

                {/* Quick Prompts */}
                <SuggestedPrompts onSelectPrompt={handleSendMessage} />
              </div>
            ) : (
              messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  onBookWorker={onBookWorker}
                  onSelectService={onSelectService}
                  onShareLocation={handleShareLocation}
                  onSendMessage={handleSendMessage}
                />
              ))
            )}

            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* ─── 4. INPUT CONTROLS ────────────────────────────────────────── */}
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            isListening={isListening}
            isSpeaking={isSpeaking}
            interimTranscript={interimText}
            voiceLanguage={voiceLang}
            onToggleVoice={handleToggleVoice}
            onToggleLanguage={handleToggleLanguage}
          />
        </div>
      )}
    </>
  );
}

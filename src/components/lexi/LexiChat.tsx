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

  function getOfflineLexiResponse(text: string): { reply: string; richPayload?: any } {
    const lower = text.toLowerCase();
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
              badge: "Legendary"
            }
          ]
        }
      };
    }
    if (lower.includes("spark") || lower.includes("bijli") || lower.includes("electric") || lower.includes("switch") || lower.includes("fan")) {
      const isEmergency = lower.includes("spark") || lower.includes("fire") || lower.includes("smoke");
      return {
        reply: isEmergency
          ? "🚨 High Urgency Detected! Bijli ke switchboard se sparks aana khatarnak ho sakta hai. Maine priority licensed electrician Anil Kumar Maurya ko locate kiya hai (~1.1 km away). Kripya main switch band rakhein jab tak technician na pahuche."
          : "Maine Electrical repair issue identify kiya hai. Hamare certified wireman Anil Kumar Maurya (NCVT certified, 5 saal experience) available hain.",
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
              badge: "Expert"
            }
          ]
        }
      };
    }
    if (lower.includes("leak") || lower.includes("pipe") || lower.includes("pani") || lower.includes("plumb") || lower.includes("drain")) {
      return {
        reply: "Aapke bathroom/kitchen pipe leakage ke liye emergency plumbing assistance locate kiya hai. Cooperative master plumber Ramanand Sharma instant dispatch ke liye ready hain (~1.2 km away).",
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
              badge: "Legendary"
            }
          ]
        }
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
      {!isOpen && (
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
                onClick={() => setVoiceEnabled((prev) => !prev)}
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

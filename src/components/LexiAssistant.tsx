"use client";

import React, { useState, useRef, useEffect } from "react";
import { speakFemaleHindiText, getTTSConfig, setTTSConfig } from "@/lib/voice";
import {
  SERVICE_CATEGORIES,
  searchAvailableWorkers,
  getPriceEstimate,
  getWorkerProfile,
  confirmBooking,
  cancelBooking,
  getHelplines,
  WorkerMatchResult,
  PriceEstimate,
  HelplineItem,
  ServiceCategory
} from "@/lib/servicesCatalog";
import { processUserUtterance, AIActionResult, AIIntentType } from "@/lib/aiDecisionEngine";
import { WorkerProfile, OnRoadMechanic } from "@/lib/seedData";
import Link from "next/link";
import {
  Mic,
  MicOff,
  Volume2,
  X,
  Sparkles,
  Send,
  Zap,
  Bot,
  User,
  Brain,
  ChevronDown,
  ChevronUp,
  Layers,
  Copy,
  Check,
  RefreshCw,
  Wrench,
  AlertTriangle,
  Flame,
  Droplets,
  CalendarCheck,
  Phone,
  ShieldCheck,
  Clock,
  Star,
  ArrowRight,
  CheckCircle2,
  MapPin,
  CreditCard,
  Banknote,
  QrCode,
  PhoneCall,
  Navigation,
  Info,
  Car,
  LifeBuoy
} from "lucide-react";

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export type LexiMode = "voice" | "advanced_cot" | "code_expert";

interface Message {
  id: string;
  sender: "user" | "lexi";
  text: string;
  thought?: string;
  time: string;
  provider?: string;
  latencyMs?: number;
  actionResult?: AIActionResult;
}

interface ApiHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export function cleanSpokenText(text: string): string {
  if (!text) return "";
  return text
    .replace(/\[\[AI_ACTION:[\s\S]*?\]\]/g, "")
    .replace(/\[\[BOOKING_PROPOSAL:[\s\S]*?\]\]/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/#{1,6}\s?/g, "")
    .replace(/`{1,3}(.*?)`{1,3}/g, "$1")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .trim();
}

export function stripMarkdownForSpeech(text: string): string {
  if (!text) return "";
  return cleanSpokenText(text).replace(/\n+/g, " ").trim();
}

export default function LexiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mode, setMode] = useState<LexiMode>("voice");
  const [showSettings, setShowSettings] = useState(false);
  const [voiceSpeed, setVoiceSpeed] = useState<number>(1.1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});

  // Active Context & State Machine
  const [userLocation, setUserLocation] = useState("Sector 17, Chandigarh (Current GPS)");
  const [clientName, setClientName] = useState("Client User");
  const [clientPhone, setClientPhone] = useState("+91 98765 43210");
  const [viewingWorkerProfile, setViewingWorkerProfile] = useState<WorkerProfile | OnRoadMechanic | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"UPI" | "CASH" | "CARD">("UPI");

  // Load TTS config
  useEffect(() => {
    try {
      const cfg = getTTSConfig();
      if (cfg && cfg.speed) {
        setVoiceSpeed(cfg.speed);
      }
    } catch (e) {}
  }, []);

  const handleSetSpeed = (newSpeed: number) => {
    setVoiceSpeed(newSpeed);
    const curr = getTTSConfig();
    setTTSConfig({ ...curr, speed: newSpeed });
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-0",
      sender: "lexi",
      text: "Namaste! Main Skill-Link ki intelligent AI assistant hoon. Main aapki kya madad kar sakti hoon? Aap mujhse koi bhi query pooch sakte hain ya verified technician find karwa sakte hain.",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      provider: "Skill-Link AI",
      latencyMs: 30,
      actionResult: {
        intent: "GENERAL_CONVERSATION",
        actionType: "SHOW_SERVICES",
        speechText: "Namaste! Main Skill-Link ki intelligent AI assistant hoon.",
        payload: {
          categories: SERVICE_CATEGORIES.slice(0, 6)
        }
      }
    },
  ]);

  const [history, setHistory] = useState<ApiHistoryMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Load client details
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("skilllink_user");
      if (storedUser) {
        const u = JSON.parse(storedUser);
        if (u.name) setClientName(u.name);
        if (u.phone) setClientPhone(u.phone);
      }
    } catch (e) {}
  }, []);

  // Restore session
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("skilllink_lexi_history_v3");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch (e) {}
  }, []);

  // Save session updates
  useEffect(() => {
    try {
      sessionStorage.setItem("skilllink_lexi_history_v3", JSON.stringify(messages));
    } catch (e) {}
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isThinking]);

  const toggleThought = (msgId: string) => {
    setExpandedThoughts((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  const copyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const speakResponse = (text: string) => {
    const sanitized = stripMarkdownForSpeech(text);
    speakFemaleHindiText(
      sanitized,
      () => setIsSpeaking(false),
      () => setIsSpeaking(true),
      voiceSpeed
    );
  };

  // ─── WORKFLOW HANDLERS ──────────────────────────────────────────────────────

  // 1. User picks a category from service discovery cards
  const handleSelectCategory = (cat: ServiceCategory) => {
    const query = `Book a ${cat.name}`;
    handleSendMessage(query);
  };

  // 2. User selects a specific worker from the ranked cards list
  const handleSelectWorker = (match: WorkerMatchResult) => {
    const worker = match.worker;
    const workerName = worker.name;
    const category = "category" in worker ? worker.category : "plumber";

    const estimate = getPriceEstimate({
      workerId: worker.id,
      category,
      isEmergency: match.isMechanic
    });

    const replyText = `Aapne ${workerName} (${"occupation" in worker ? worker.occupation : worker.name}) ko select kiya hai. Yahan aapka transparent price breakdown aur payment options hain:`;

    const newMsg: Message = {
      id: `msg-select-${Date.now()}`,
      sender: "lexi",
      text: replyText,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      provider: "Skill-Link Pricing",
      latencyMs: 15,
      actionResult: {
        intent: "WORKER_SELECTED",
        actionType: "SHOW_PRICE_ESTIMATE",
        speechText: replyText,
        payload: {
          selectedWorker: worker,
          priceEstimate: estimate,
        }
      }
    };

    setMessages((prev) => [...prev, newMsg]);
    speakResponse(replyText);
  };

  // 3. User confirms payment and finalizes booking
  const handleConfirmAndPay = (msgId: string, worker: WorkerProfile | OnRoadMechanic, estimate: PriceEstimate) => {
    const workerName = worker.name;
    const occupation = "occupation" in worker ? worker.occupation : "Emergency Specialist";

    const booking = confirmBooking({
      workerId: worker.id,
      workerName,
      occupation,
      clientName,
      clientPhone,
      serviceType: estimate.serviceName || "Service Inspection",
      location: userLocation,
      visitFeeAmount: estimate.visitFee,
      isEmergency: !!estimate.emergencyMultiplier,
      paymentMethod: selectedPaymentMethod
    });

    const confirmSpeech = `Badhai ho! Aapka ${occupation} booking confirm ho gaya hai! Booking ID #${booking.id} hai. ${workerName} agle 15 se 20 minutes me aapke location par dispatch ho rahe hain.`;

    // Update message state
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-confirm-${Date.now()}`,
        sender: "lexi",
        text: confirmSpeech,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        provider: "Skill-Link Dispatch",
        latencyMs: 20,
        actionResult: {
          intent: "BOOKING_CONFIRMATION",
          actionType: "BOOKING_CONFIRMED",
          speechText: confirmSpeech,
          payload: {
            selectedWorker: worker,
            bookingId: booking.id,
            priceEstimate: estimate
          }
        }
      }
    ]);

    speakResponse(confirmSpeech);
  };

  // 4. User cancels booking
  const handleCancelBooking = (bookingId: string) => {
    cancelBooking(bookingId, "User requested cancellation via AI");
    const cancelSpeech = `Aapki booking #${bookingId} safely cancel kar di gayi hai. Aapka koi charge nahi kata hai.`;

    setMessages((prev) => [
      ...prev,
      {
        id: `msg-cancel-${Date.now()}`,
        sender: "lexi",
        text: cancelSpeech,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        provider: "Skill-Link Cancellation",
        latencyMs: 10,
        actionResult: {
          intent: "CANCEL_BOOKING",
          actionType: "BOOKING_CANCELLED",
          speechText: cancelSpeech,
          payload: { bookingId }
        }
      }
    ]);

    speakResponse(cancelSpeech);
  };

  // ─── MAIN SEND MESSAGE HANDLER ──────────────────────────────────────────────
  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg: Message = { id: `msg-${Date.now()}`, sender: "user", text: query, time };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");

    const updatedHistory: ApiHistoryMessage[] = [...history, { role: "user", content: query }];
    setHistory(updatedHistory);
    setIsThinking(true);

    let replyText = "";
    let thoughtText = "";
    let usedProvider = "Skill-Link AI Engine";
    let latency = 0;
    let actionResult: AIActionResult | undefined = undefined;

    try {
      const res = await fetch("/api/lexi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedHistory,
          mode,
          currentState: {
            location: userLocation
          }
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          replyText = cleanSpokenText(data.reply || "");
          usedProvider = data.provider || "LEXI AI";
          latency = data.latencyMs || 80;
          actionResult = data.actionResult;
        }
      }
    } catch (e) {
      console.warn("API route error, using local AI decision engine:", e);
    }

    // Fallback to local decision engine if needed
    if (!replyText || !actionResult) {
      const decision = processUserUtterance(query, updatedHistory, {
        selectedLocation: userLocation
      });
      replyText = decision.speechText;
      thoughtText = decision.thought || "";
      actionResult = decision;
      usedProvider = "Skill-Link Intelligence";
      latency = 25;
    }

    setIsThinking(false);

    const lexiMsgId = `msg-lexi-${Date.now()}`;
    const lexiMsg: Message = {
      id: lexiMsgId,
      sender: "lexi",
      text: replyText,
      thought: mode === "advanced_cot" ? thoughtText : undefined,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      provider: usedProvider,
      latencyMs: latency,
      actionResult,
    };

    setMessages((prev) => [...prev, lexiMsg]);
    setHistory((prev) => [...prev, { role: "assistant", content: replyText }]);

    if (mode === "voice" || query.length < 90) {
      speakResponse(replyText);
    }
  };

  const startVoiceInput = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "hi-IN";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText(transcript);
          handleSendMessage(transcript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "msg-0",
        sender: "lexi",
        text: "Namaste! Main Skill-Link ki AI Assistant hoon. Conversation cleared. Aapko kis service me help chahiye?",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        provider: "Skill-Link AI",
        actionResult: {
          intent: "GENERAL_CONVERSATION",
          actionType: "SHOW_SERVICES",
          speechText: "Namaste! Main Skill-Link ki AI Assistant hoon.",
          payload: {
            categories: SERVICE_CATEGORIES.slice(0, 6)
          }
        }
      },
    ]);
    setHistory([]);
    sessionStorage.removeItem("skilllink_lexi_history_v3");
  };

  return (
    <>
      {/* Floating Action Trigger Button */}
      {!isOpen && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50">
          <button
            onClick={() => setIsOpen(true)}
            aria-label="Open Skill-Link AI Assistant"
            className="group relative flex items-center gap-2.5 px-4 py-3 sm:px-5 sm:py-3.5 rounded-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-[0_10px_35px_rgba(79,70,229,0.45)] hover:shadow-[0_15px_45px_rgba(79,70,229,0.65)] hover:scale-105 active:scale-95 transition-all duration-300 border border-white/25"
          >
            <div className="relative flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-yellow-300 animate-spin-slow" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>

            <span className="font-black tracking-wide text-xs sm:text-sm text-white drop-shadow-sm">
              Skill-Link AI
            </span>
          </button>
        </div>
      )}

      {/* Main Responsive Lexi Modal */}
      {isOpen && (
        <div className="fixed inset-x-2 bottom-2 top-14 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[460px] sm:h-[680px] sm:max-h-[calc(100vh-4rem)] z-50 flex flex-col bg-slate-950/95 backdrop-blur-2xl border border-indigo-500/30 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] ring-1 ring-white/10 overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="p-3.5 sm:p-4 bg-gradient-to-r from-slate-950 via-indigo-950/90 to-purple-950/80 border-b border-indigo-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 p-0.5 shadow-md flex items-center justify-center text-white font-black">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                {isSpeaking && (
                  <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-500 border border-slate-900"></span>
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-black tracking-tight text-white">Skill-Link AI</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-bold">
                    Master Assistant
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-300 font-medium flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Intent-Driven • User in Full Control
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                title="Clear Chat History"
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowSettings(!showSettings)}
                title="Intelligence Modes"
                className={`p-2 rounded-xl transition-colors ${
                  showSettings ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white hover:bg-white/10"
                }`}
              >
                <Layers className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Settings / Mode Drawer */}
          {showSettings && (
            <div className="p-3 bg-slate-900/95 border-b border-indigo-500/20 space-y-2 text-xs animate-in slide-in-from-top duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Select Assistant Mode:
                </span>
                <span className="text-[10px] text-cyan-300 font-bold">Anti-Auto-Booking Active</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setMode("voice")}
                  className={`p-2 rounded-xl font-bold border text-center transition-all ${
                    mode === "voice"
                      ? "bg-indigo-600 border-indigo-400 text-white shadow-md"
                      : "bg-slate-950/60 border-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 mx-auto mb-1 text-yellow-400" />
                  Conversational
                </button>
                <button
                  onClick={() => setMode("advanced_cot")}
                  className={`p-2 rounded-xl font-bold border text-center transition-all ${
                    mode === "advanced_cot"
                      ? "bg-purple-600 border-purple-400 text-white shadow-md"
                      : "bg-slate-950/60 border-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  <Brain className="w-3.5 h-3.5 mx-auto mb-1 text-cyan-300" />
                  Deep Reason
                </button>
                <button
                  onClick={() => setMode("code_expert")}
                  className={`p-2 rounded-xl font-bold border text-center transition-all ${
                    mode === "code_expert"
                      ? "bg-emerald-600 border-emerald-400 text-white shadow-md"
                      : "bg-slate-950/60 border-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-300" />
                  Service SOS
                </button>
              </div>

              <div className="pt-2 border-t border-indigo-500/20">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                    <Volume2 className="w-3 h-3 text-emerald-400" /> Voice Response Speed:
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold font-mono">{voiceSpeed}x Speed</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleSetSpeed(0.95)}
                    className={`py-1.5 px-2 rounded-lg font-bold text-[11px] border text-center transition-all ${
                      voiceSpeed === 0.95
                        ? "bg-emerald-600 border-emerald-400 text-white shadow-sm"
                        : "bg-slate-950/60 border-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    0.95x Gentle
                  </button>
                  <button
                    onClick={() => handleSetSpeed(1.1)}
                    className={`py-1.5 px-2 rounded-lg font-bold text-[11px] border text-center transition-all ${
                      voiceSpeed === 1.1
                        ? "bg-emerald-600 border-emerald-400 text-white shadow-sm"
                        : "bg-slate-950/60 border-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    ⚡ 1.1x Fast (Default)
                  </button>
                  <button
                    onClick={() => handleSetSpeed(1.25)}
                    className={`py-1.5 px-2 rounded-lg font-bold text-[11px] border text-center transition-all ${
                      voiceSpeed === 1.25
                        ? "bg-emerald-600 border-emerald-400 text-white shadow-sm"
                        : "bg-slate-950/60 border-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    🚀 1.25x Turbo
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Location Context Pill Bar */}
          <div className="px-3.5 py-1.5 bg-slate-900/90 border-b border-white/5 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-300 truncate">
              <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">{userLocation}</span>
            </div>
            <button
              onClick={() => {
                const newLoc = prompt("Enter your service area / landmark:", userLocation);
                if (newLoc) setUserLocation(newLoc);
              }}
              className="text-[10px] text-cyan-300 font-bold hover:underline shrink-0 ml-2"
            >
              Change
            </button>
          </div>

          {/* Quick Action Suggestion Chips */}
          <div className="px-3 py-2 bg-slate-950/90 border-b border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px] whitespace-nowrap">
            <button
              onClick={() => handleSendMessage("Mera car breakdown ho gaya hai highway par, urgent roadside help chahiye")}
              className="px-2.5 py-1 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-200 font-bold hover:bg-rose-900/60 transition-all flex items-center gap-1 shrink-0"
            >
              <AlertTriangle className="w-3 h-3 text-rose-400" /> 🚗 Roadside Breakdown SOS
            </button>
            <button
              onClick={() => handleSendMessage("Find me a verified plumber near my location")}
              className="px-2.5 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-200 font-bold hover:bg-indigo-900/60 transition-all flex items-center gap-1 shrink-0"
            >
              <Droplets className="w-3 h-3 text-cyan-400" /> 🚰 Book Plumber
            </button>
            <button
              onClick={() => handleSendMessage("How can I fix a leaking tap by myself?")}
              className="px-2.5 py-1 rounded-full bg-slate-900 border border-white/15 text-slate-300 font-bold hover:bg-slate-800 transition-all flex items-center gap-1 shrink-0"
            >
              <Info className="w-3 h-3 text-yellow-400" /> 💡 Leaking Tap DIY
            </button>
            <button
              onClick={() => handleSendMessage("What services does Skill-Link provide?")}
              className="px-2.5 py-1 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-200 font-bold hover:bg-purple-900/60 transition-all flex items-center gap-1 shrink-0"
            >
              <Sparkles className="w-3 h-3 text-purple-300" /> 📋 Service Catalog
            </button>
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-4 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {m.sender === "lexi" && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0 font-bold">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                {m.sender === "user" && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0 font-bold">
                    <User className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[90%] sm:max-w-[88%] space-y-2.5 ${
                    m.sender === "user" ? "items-end text-right" : "items-start text-left"
                  }`}
                >
                  {/* Collapsible Reasoning */}
                  {m.thought && (
                    <div className="rounded-xl border border-purple-500/30 bg-purple-950/40 p-2 text-xs text-left shadow-sm">
                      <button
                        onClick={() => toggleThought(m.id)}
                        className="w-full flex items-center justify-between font-extrabold text-purple-300 text-[10px] uppercase tracking-wider hover:text-purple-200"
                      >
                        <span className="flex items-center gap-1.5">
                          <Brain className="w-3 h-3 text-cyan-300" />
                          Intent & Decision Reasoning
                        </span>
                        {expandedThoughts[m.id] ? (
                          <ChevronUp className="w-3 h-3 text-purple-400" />
                        ) : (
                          <ChevronDown className="w-3 h-3 text-purple-400" />
                        )}
                      </button>

                      {expandedThoughts[m.id] && (
                        <div className="mt-1.5 pt-1.5 border-t border-purple-500/20 font-mono text-[10px] text-purple-200/90 whitespace-pre-wrap leading-relaxed">
                          {m.thought}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Main Speech Bubble */}
                  <div
                    className={`p-3 sm:p-3.5 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed shadow-md ${
                      m.sender === "user"
                        ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-none border border-indigo-400/30"
                        : "bg-slate-900/90 text-slate-100 rounded-tl-none border border-white/10"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.text}</p>
                  </div>

                  {/* ────────────────────────────────────────────────────────── */}
                  {/* 1. SERVICE CATEGORY CARDS / CATALOG                         */}
                  {/* ────────────────────────────────────────────────────────── */}
                  {m.actionResult?.payload?.categories && m.actionResult.payload.categories.length > 0 && (
                    <div className="space-y-2 p-3 rounded-2xl bg-slate-900/80 border border-white/10">
                      <span className="text-[10px] font-black uppercase text-cyan-300 tracking-wider block">
                        Browse Skill-Link Services:
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {m.actionResult.payload.categories.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => handleSelectCategory(cat)}
                            className="p-2.5 rounded-xl bg-slate-950 border border-white/10 hover:border-indigo-400/60 hover:bg-indigo-950/40 text-left transition-all group"
                          >
                            <div className="text-lg mb-1">{cat.icon}</div>
                            <h4 className="text-xs font-bold text-white group-hover:text-cyan-300">{cat.name}</h4>
                            <p className="text-[10px] text-slate-400 line-clamp-1">{cat.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ────────────────────────────────────────────────────────── */}
                  {/* 2. EMERGENCY HELPLINES DIRECT CARD                         */}
                  {/* ────────────────────────────────────────────────────────── */}
                  {m.actionResult?.payload?.helplines && m.actionResult.payload.helplines.length > 0 && (
                    <div className="p-3 rounded-2xl bg-rose-950/70 border border-rose-500/40 space-y-2">
                      <div className="flex items-center gap-1.5 text-rose-300 text-xs font-black">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <span>Official Emergency Helplines (24/7 Verified)</span>
                      </div>
                      <div className="space-y-1.5">
                        {m.actionResult.payload.helplines.map((h) => (
                          <a
                            key={h.id}
                            href={`tel:${h.number}`}
                            className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-rose-500/30 hover:border-rose-400 text-white transition-all"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-base">{h.icon}</span>
                              <div>
                                <h5 className="text-[11px] font-bold text-white">{h.name}</h5>
                                <p className="text-[9px] text-rose-300/80">{h.description}</p>
                              </div>
                            </div>
                            <span className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-mono font-black text-xs flex items-center gap-1">
                              <PhoneCall className="w-3 h-3" /> {h.number}
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ────────────────────────────────────────────────────────── */}
                  {/* 3. MULTI-WORKER SELECTION CARDS                            */}
                  {/* ────────────────────────────────────────────────────────── */}
                  {m.actionResult?.payload?.workers && m.actionResult.payload.workers.length > 0 && (
                    <div className="space-y-2.5 p-3 rounded-2xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-950 border border-indigo-500/30">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="text-[10px] uppercase font-black tracking-wider text-cyan-300 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                          Nearby Available Specialists ({m.actionResult.payload.workers.length})
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">Ranked by ETA & Rating</span>
                      </div>

                      <div className="space-y-2">
                        {m.actionResult.payload.workers.map((match) => {
                          const w = match.worker;
                          const name = w.name;
                          const occupation = "occupation" in w ? w.occupation : w.servicesOffered?.[0] || "Mechanic";
                          const avatar = "avatarUrl" in w ? w.avatarUrl : w.avatar || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80";

                          return (
                            <div
                              key={w.id}
                              className="p-3 rounded-xl bg-slate-950/90 border border-white/10 hover:border-indigo-400/50 transition-all space-y-2"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                  <img
                                    src={avatar}
                                    alt={name}
                                    className="w-10 h-10 rounded-xl object-cover border border-indigo-400/40 shrink-0"
                                  />
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <h4 className="text-xs font-black text-white">{name}</h4>
                                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold">
                                        ✓ Verified
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-indigo-300 font-bold">{occupation}</p>
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1">
                                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                    {w.rating}
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-1.5 text-[10px] bg-slate-900/90 p-2 rounded-lg text-slate-300">
                                <div>
                                  <span className="text-slate-500 block text-[9px]">Distance</span>
                                  <span className="text-cyan-300 font-bold">📍 {match.distanceKm} km</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 block text-[9px]">Arrival ETA</span>
                                  <span className="text-amber-300 font-bold">⏱ {match.etaMins} mins</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 block text-[9px]">Fee / Rate</span>
                                  <span className="text-emerald-400 font-bold">₹{match.startingPrice} starting</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  onClick={() => setViewingWorkerProfile(w)}
                                  className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold transition-colors"
                                >
                                  View Profile
                                </button>
                                <button
                                  onClick={() => handleSelectWorker(match)}
                                  className="flex-1 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-[11px] font-black hover:opacity-90 transition-opacity flex items-center justify-center gap-1"
                                >
                                  Select Worker <ArrowRight className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ────────────────────────────────────────────────────────── */}
                  {/* 4. ITEMISED PRICE ESTIMATE & PAYMENT CONFIRMATION CARD      */}
                  {/* ────────────────────────────────────────────────────────── */}
                  {m.actionResult?.payload?.priceEstimate && m.actionResult?.payload?.selectedWorker && m.actionResult.actionType !== "BOOKING_CONFIRMED" && (
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-cyan-500/40 space-y-3 shadow-xl">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300">
                          Transparent Price Estimate
                        </span>
                        <span className="text-[10px] text-slate-400">Step 2 of 2</span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-200">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Worker Selected:</span>
                          <span className="font-bold text-white">
                            {m.actionResult.payload.selectedWorker.name}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Visiting & Diagnosis Fee:</span>
                          <span className="font-mono text-white">₹{m.actionResult.payload.priceEstimate.visitFee}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Estimated Labor / Base:</span>
                          <span className="font-mono text-white">₹{m.actionResult.payload.priceEstimate.estimatedLaborFee}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Platform Guarantee Fee:</span>
                          <span className="font-mono text-white">₹{m.actionResult.payload.priceEstimate.platformFee}</span>
                        </div>
                        <div className="border-t border-white/10 pt-2 flex items-center justify-between font-black text-sm">
                          <span className="text-cyan-300">Estimated Total:</span>
                          <span className="text-emerald-400 font-mono text-base">₹{m.actionResult.payload.priceEstimate.totalEstimate}</span>
                        </div>
                      </div>

                      <div className="p-2 rounded-lg bg-slate-950/80 border border-white/5 text-[10px] text-amber-300/90 flex items-start gap-1.5">
                        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{m.actionResult.payload.priceEstimate.disclaimer}</span>
                      </div>

                      {/* Payment Method Selector */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-300 block">Choose Payment Mode:</span>
                        <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                          <button
                            onClick={() => setSelectedPaymentMethod("UPI")}
                            className={`p-2 rounded-xl font-bold border transition-all flex flex-col items-center gap-1 ${
                              selectedPaymentMethod === "UPI"
                                ? "bg-indigo-600 border-cyan-400 text-white shadow-md"
                                : "bg-slate-950 border-white/10 text-slate-400 hover:text-white"
                            }`}
                          >
                            <QrCode className="w-4 h-4" /> UPI QR / App
                          </button>
                          <button
                            onClick={() => setSelectedPaymentMethod("CASH")}
                            className={`p-2 rounded-xl font-bold border transition-all flex flex-col items-center gap-1 ${
                              selectedPaymentMethod === "CASH"
                                ? "bg-indigo-600 border-cyan-400 text-white shadow-md"
                                : "bg-slate-950 border-white/10 text-slate-400 hover:text-white"
                            }`}
                          >
                            <Banknote className="w-4 h-4" /> Cash on Visit
                          </button>
                          <button
                            onClick={() => setSelectedPaymentMethod("CARD")}
                            className={`p-2 rounded-xl font-bold border transition-all flex flex-col items-center gap-1 ${
                              selectedPaymentMethod === "CARD"
                                ? "bg-indigo-600 border-cyan-400 text-white shadow-md"
                                : "bg-slate-950 border-white/10 text-slate-400 hover:text-white"
                            }`}
                          >
                            <CreditCard className="w-4 h-4" /> Card / NetBanking
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          handleConfirmAndPay(
                            m.id,
                            m.actionResult!.payload!.selectedWorker!,
                            m.actionResult!.payload!.priceEstimate!
                          )
                        }
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 text-slate-950 font-black text-xs hover:opacity-95 active:scale-98 transition-all shadow-[0_0_25px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2"
                      >
                        <Zap className="w-4 h-4 text-slate-950 fill-slate-950" />
                        <span>Confirm & Dispatch Worker (₹{m.actionResult.payload.priceEstimate.visitFee} Visit Fee)</span>
                      </button>
                    </div>
                  )}

                  {/* ────────────────────────────────────────────────────────── */}
                  {/* 5. LIVE BOOKING CONFIRMED & TRACKER CARD                   */}
                  {/* ────────────────────────────────────────────────────────── */}
                  {m.actionResult?.actionType === "BOOKING_CONFIRMED" && (
                    <div className="p-3.5 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 space-y-3 shadow-2xl animate-in zoom-in-95">
                      <div className="flex items-center justify-between border-b border-emerald-500/30 pb-2">
                        <div className="flex items-center gap-2 text-emerald-300 font-black text-xs">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          <span>Booking Confirmed & Dispatched!</span>
                        </div>
                        <span className="font-mono text-[11px] font-bold text-white">
                          #{m.actionResult.payload?.bookingId}
                        </span>
                      </div>

                      {m.actionResult.payload?.selectedWorker && (
                        <div className="flex items-center gap-3 bg-slate-950/80 p-2.5 rounded-xl border border-white/10">
                          <img
                            src={
                              "avatarUrl" in m.actionResult.payload.selectedWorker
                                ? m.actionResult.payload.selectedWorker.avatarUrl
                                : m.actionResult.payload.selectedWorker.avatar || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80"
                            }
                            alt="worker"
                            className="w-11 h-11 rounded-xl object-cover border border-emerald-400"
                          />
                          <div>
                            <h4 className="text-xs font-black text-white">
                              {m.actionResult.payload.selectedWorker.name}
                            </h4>
                            <p className="text-[10px] text-emerald-300 font-bold">
                              {"occupation" in m.actionResult.payload.selectedWorker
                                ? m.actionResult.payload.selectedWorker.occupation
                                : "On-Road SOS Technician"}
                            </p>
                            <p className="text-[10px] text-cyan-300 font-medium flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" /> ETA: 15–20 Mins En Route
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={`tel:${
                            m.actionResult.payload?.selectedWorker && "phone" in m.actionResult.payload.selectedWorker
                              ? m.actionResult.payload.selectedWorker.phone
                              : "9876543210"
                          }`}
                          className="py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] text-center border border-white/10 flex items-center justify-center gap-1.5"
                        >
                          <Phone className="w-3.5 h-3.5 text-cyan-400" /> Call Worker
                        </a>
                        <Link
                          href="/profile"
                          className="py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-[11px] text-center flex items-center justify-center gap-1.5"
                        >
                          <Navigation className="w-3.5 h-3.5" /> Dashboard Track
                        </Link>
                      </div>

                      {m.actionResult.payload?.bookingId && (
                        <button
                          onClick={() => handleCancelBooking(m.actionResult!.payload!.bookingId!)}
                          className="w-full text-center text-[10px] text-rose-300 hover:text-rose-200 font-bold py-1 transition-colors"
                        >
                          Cancel this booking
                        </button>
                      )}
                    </div>
                  )}

                  {/* Metadata Bar */}
                  <div className="flex items-center gap-2 text-[9px] sm:text-[10px] text-slate-400 px-1">
                    <span>{m.time}</span>
                    {m.provider && (
                      <span className="px-1.5 py-0.2 rounded bg-indigo-950 border border-indigo-500/30 text-indigo-300 font-bold">
                        {m.provider} {m.latencyMs ? `(${m.latencyMs}ms)` : ""}
                      </span>
                    )}

                    {m.sender === "lexi" && (
                      <div className="flex items-center gap-1.5 ml-auto">
                        <button
                          onClick={() => speakResponse(m.text)}
                          title="Listen with Voice"
                          className="hover:text-cyan-300 transition-colors p-0.5"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => copyMessage(m.id, m.text)}
                          title="Copy text"
                          className="hover:text-cyan-300 transition-colors p-0.5"
                        >
                          {copiedId === m.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="flex gap-2.5 items-center text-xs text-indigo-300 font-bold p-2.5 bg-indigo-950/40 rounded-2xl border border-indigo-500/30 animate-pulse">
                <Brain className="w-4 h-4 animate-spin text-purple-400" />
                <span>Skill-Link AI is understanding and searching verified providers...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Voice & Input Footer */}
          <div className="p-2.5 sm:p-3 bg-slate-950 border-t border-indigo-500/20">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                onClick={startVoiceInput}
                className={`p-2.5 sm:p-3 rounded-2xl border transition-all ${
                  isListening
                    ? "bg-rose-600 text-white border-rose-400 animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.6)]"
                    : "bg-slate-900 text-slate-300 border-white/10 hover:text-white hover:bg-slate-800"
                }`}
                title="Speak in Hindi/English"
              >
                {isListening ? <Mic className="w-4 h-4 sm:w-5 sm:h-5" /> : <MicOff className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />}
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  isListening ? "Listening... Bolyein ab" : "Ask Skill-Link anything or request a service..."
                }
                className="flex-1 bg-slate-900/90 border border-white/10 rounded-2xl px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <button
                type="submit"
                disabled={!inputText.trim() || isThinking}
                className="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90 disabled:opacity-40 transition-all font-bold"
              >
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* WORKER PROFILE DETAIL MODAL                                */}
      {/* ────────────────────────────────────────────────────────── */}
      {viewingWorkerProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-950 border border-white/20 rounded-3xl p-6 shadow-2xl overflow-hidden space-y-4">
            <button
              onClick={() => setViewingWorkerProfile(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <img
                src={
                  "avatarUrl" in viewingWorkerProfile
                    ? viewingWorkerProfile.avatarUrl
                    : viewingWorkerProfile.avatar || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80"
                }
                alt="profile"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-400 shadow-md"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-black text-white">
                    {viewingWorkerProfile.name}
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-400 font-bold">
                    ✓ Verified
                  </span>
                </div>
                <p className="text-xs text-indigo-300 font-bold">
                  {"occupation" in viewingWorkerProfile
                    ? viewingWorkerProfile.occupation
                    : viewingWorkerProfile.servicesOffered?.[0]}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs">
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400" /> {viewingWorkerProfile.rating}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-300">
                    {"jobsCompleted" in viewingWorkerProfile
                      ? `${viewingWorkerProfile.jobsCompleted} Jobs Completed`
                      : `${viewingWorkerProfile.reviewsCount} Reviews`}
                  </span>
                </div>
              </div>
            </div>

            {"bio" in viewingWorkerProfile && viewingWorkerProfile.bio && (
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-3 rounded-2xl border border-white/5">
                {viewingWorkerProfile.bio}
              </p>
            )}

            {"skills" in viewingWorkerProfile && viewingWorkerProfile.skills && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Verified Skills:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {viewingWorkerProfile.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-indigo-950 border border-indigo-500/30 text-indigo-200 text-[11px] font-bold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => setViewingWorkerProfile(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const targetWorker = viewingWorkerProfile;
                  setViewingWorkerProfile(null);
                  handleSelectWorker({
                    worker: targetWorker,
                    isMechanic: !("occupation" in targetWorker),
                    distanceKm: 1.5,
                    etaMins: 15,
                    startingPrice: "visitingFee" in targetWorker ? targetWorker.visitingFee : (targetWorker.hourlyRate || 349),
                    matchScore: 95
                  });
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-xs font-black hover:opacity-90 transition-opacity"
              >
                Select & View Estimate
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

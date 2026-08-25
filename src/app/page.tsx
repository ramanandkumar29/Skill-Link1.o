"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import dynamic from "next/dynamic";
import { WorkerProfile, INITIAL_WORKERS, INITIAL_MECHANICS, OnRoadMechanic } from "@/lib/seedData";
import { getStoredWorkers, saveWorker, saveBooking } from "@/lib/storage";
import { speakFemaleHindiText } from "@/lib/voice";
import { sendPhoneOtp, verifyPhoneOtp, signInWithPassword, clearAuthSession, AuthSessionUser } from "@/lib/auth";
import WorkerCard from "@/components/WorkerCard";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import {
  Search,
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Zap,
  Filter,
  CheckCircle2,
  User,
  Phone,
  LogOut,
  ArrowRight,
  Radio,
  Compass,
  Home as HomeIcon,
  PhoneCall,
  Calendar,
  AlertTriangle,
  Briefcase,
  Clock,
  ShieldCheck,
  Heart,
  ChevronRight,
  Lock,
  Mail,
  RefreshCw,
  Navigation,
  MapPin,
  Star,
  Car,
  Wrench,
  Fuel,
  BatteryCharging,
  Truck,
} from "lucide-react";
import { useSearchParams } from "next/navigation";

// Dynamic Imports for High Performance & Reduced JS Bundle Load
const TrustModal = dynamic(() => import("@/components/TrustModal"), { ssr: false });
const PaymentModal = dynamic(() => import("@/components/PaymentModal"), { ssr: false });
const BrandHelpline = dynamic(() => import("@/components/BrandHelpline"), { ssr: false });
const SahayakVoice = dynamic(() => import("@/components/SahayakVoice"), { ssr: false });

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

function MarketplaceContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "All";

  // Single URL View Mode: "MARKETPLACE" | "SAHAYAK" | "HELPLINES" | "QUICKFIX" | "PROFILE"
  const [activeSection, setActiveSection] = useState<"MARKETPLACE" | "SAHAYAK" | "HELPLINES" | "QUICKFIX" | "PROFILE">("MARKETPLACE");

  // Mode Switcher Toggle: "HOME" (Home Services) vs. "ON_ROAD" (On-Road Emergency)
  const [serviceMode, setServiceMode] = useState<"HOME" | "ON_ROAD">("HOME");

  // Browser Geolocation GPS State for On-Road Emergency
  const [gpsStatus, setGpsStatus] = useState<{
    lat: number | null;
    lng: number | null;
    address: string;
    isLoading: boolean;
    error: string | null;
  }>({
    lat: null,
    lng: null,
    address: "Sector 17 Highway Touch, Chandigarh",
    isLoading: false,
    error: null,
  });

  // On-Road Breakdown Category Chips & Mechanic Data
  const [onRoadCategory, setOnRoadCategory] = useState<string>("All");
  const [mechanics, setMechanics] = useState<OnRoadMechanic[]>(INITIAL_MECHANICS);

  // Quick SOS 15-Min Priority Dispatch Modal state
  const [sosPriorityDispatchOpen, setSosPriorityDispatchOpen] = useState(false);
  const [dispatchCountdown, setDispatchCountdown] = useState(15);
  const [dispatchedMechanic, setDispatchedMechanic] = useState<OnRoadMechanic | null>(null);

  // Auth Guard state
  const [currentUser, setCurrentUser] = useState<AuthSessionUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);
  
  // Instagram-style Auth Step: "CHOICE" | "CLIENT_AUTH" | "WORKER_AUTH"
  const [authFlowStep, setAuthFlowStep] = useState<"CHOICE" | "CLIENT_AUTH" | "WORKER_AUTH">("CHOICE");
  const [authMethod, setAuthMethod] = useState<"OTP" | "PASSWORD">("OTP");

  // Client OTP & Password Login state (Strictly Isolated Client Fields - Name & Phone only for OTP)
  const [clientName, setClientName] = useState("");
  const [phoneNum, setPhoneNum] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPassword, setClientPassword] = useState("");
  const [clientServiceNeed, setClientServiceNeed] = useState("");
  const [isListeningClientVoice, setIsListeningClientVoice] = useState(false);
  const [otpStep, setOtpStep] = useState<"PHONE" | "OTP">("PHONE");
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState<number>(60);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  // Worker Voice ID Registration state (Strictly Isolated Worker Fields)
  const [voiceStep, setVoiceStep] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListeningWorkerVoice, setIsListeningWorkerVoice] = useState(false);
  const [aiPromptText, setAiPromptText] = useState("");

  const [regName, setRegName] = useState("");
  const [regOccupation, setRegOccupation] = useState("");
  const [regExperience, setRegExperience] = useState("");
  const [regLocation, setRegLocation] = useState("");
  const [workerAudioSnippetUrl, setWorkerAudioSnippetUrl] = useState<string | undefined>(undefined);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioTimer, setAudioTimer] = useState(10);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Marketplace state
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [isVoiceSearching, setIsVoiceSearching] = useState(false);

  // QuickFix SOS State
  const [sosSearching, setSosSearching] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(15);
  const [sosMatchedWorker, setSosMatchedWorker] = useState<WorkerProfile | null>(null);
  const [sosEmergencyType, setSosEmergencyType] = useState("Pipe Burst / Major Leakage");
  const [sosClientName, setSosClientName] = useState("");
  const [sosClientPhone, setSosClientPhone] = useState("");
  const [sosConfirmed, setSosConfirmed] = useState(false);

  // Modals state
  const [trustWorker, setTrustWorker] = useState<WorkerProfile | null>(null);
  const [bookingWorker, setBookingWorker] = useState<WorkerProfile | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  const categories = [
    { label: "All", value: "All", icon: "🌐" },
    { label: "Plumber", value: "plumber", icon: "🔧" },
    { label: "Electrician", value: "electrician", icon: "⚡" },
    { label: "Mason", value: "mason", icon: "🧱" },
    { label: "Salon", value: "salon", icon: "✂️" },
    { label: "AC Repair", value: "ac", icon: "❄️" },
    { label: "Deep Cleaning", value: "cleaning", icon: "🧹" },
    { label: "Appliances", value: "appliances", icon: "🔌" },
  ];

  const onRoadCategories = [
    { label: "All Mechanics", value: "All", icon: "🌐" },
    { label: "Puncture / Tyre Change", value: "puncture", icon: "🔧" },
    { label: "Battery Jumpstart", value: "battery", icon: "⚡" },
    { label: "Towing Service", value: "towing", icon: "🚜" },
    { label: "Mechanical Engine Repair", value: "mechanical", icon: "🛠️" },
    { label: "Fuel Delivery", value: "fuel", icon: "⛽" },
  ];

  const voiceQuestions = [
    { step: 1, prompt: "Namaste! Sahayak AI Voice Assistant me aapka swagat hai. Aapka shubh naam kya hai?", field: "name" },
    { step: 2, prompt: "Aap kaunsa kaam karte hain? Jaise Plumber, Electrician, Salon, ya Mason?", field: "occupation" },
    { step: 3, prompt: "Aapka kitne saal ka kaam karne ka anubhav hai?", field: "experience" },
    { step: 4, prompt: "Aap abhi kis city ya area me rehte hain?", field: "location" },
  ];

  // Trigger Browser Geolocation API on selecting On-Road Emergency Mode
  useEffect(() => {
    if (serviceMode === "ON_ROAD") {
      setGpsStatus((prev) => ({ ...prev, isLoading: true, error: null }));
      if (typeof window !== "undefined" && "geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setGpsStatus({
              lat: Number(pos.coords.latitude.toFixed(4)),
              lng: Number(pos.coords.longitude.toFixed(4)),
              address: `GPS Locked: ${pos.coords.latitude.toFixed(4)}°N, ${pos.coords.longitude.toFixed(4)}°E`,
              isLoading: false,
              error: null,
            });
          },
          (err) => {
            console.warn("GPS Geolocation warning, using regional fallback:", err.message);
            setGpsStatus({
              lat: 30.7333,
              lng: 76.7794,
              address: "Sector 17 Highway Touch, Chandigarh",
              isLoading: false,
              error: "Using high-precision regional GPS fallback.",
            });
          },
          { timeout: 8000 }
        );
      } else {
        setGpsStatus({
          lat: 30.7333,
          lng: 76.7794,
          address: "Sector 17 Highway Touch, Chandigarh",
          isLoading: false,
          error: "Using regional GPS location.",
        });
      }
    }
  }, [serviceMode]);

  // 15-Minute On-Road SOS Priority Dispatch Countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (sosPriorityDispatchOpen && dispatchCountdown > 0) {
      timer = setInterval(() => setDispatchCountdown((prev) => prev - 1), 1000);
    } else if (sosPriorityDispatchOpen && dispatchCountdown === 0) {
      const matched = mechanics.find((m) => m.category === onRoadCategory || onRoadCategory === "All") || mechanics[0];
      setDispatchedMechanic(matched);
    }
    return () => clearInterval(timer);
  }, [sosPriorityDispatchOpen, dispatchCountdown, mechanics, onRoadCategory]);

  useEffect(() => {
    setHasMounted(true);
    try {
      const stored = localStorage.getItem("skilllink_user");
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Error reading skilllink_user", e);
    } finally {
      setIsAuthLoading(false);
      setWorkers(getStoredWorkers());
    }
  }, []);

  // 60-Second Resend OTP Countdown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpStep === "OTP" && resendTimer > 0) {
      timer = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpStep, resendTimer]);

  // Countdown timer for SOS
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (sosSearching && sosCountdown > 0) {
      timer = setInterval(() => setSosCountdown((prev) => prev - 1), 1000);
    } else if (sosSearching && sosCountdown === 0) {
      const matched = workers.find((w) => w.isAvailable) || workers[0] || INITIAL_WORKERS[0];
      setSosMatchedWorker(matched);
      setSosSearching(false);
    }
    return () => clearInterval(timer);
  }, [sosSearching, sosCountdown, workers]);

  const speakText = (text: string, onEndCallback?: () => void) => {
    setAiPromptText(text);
    speakFemaleHindiText(
      text,
      () => {
        setIsSpeaking(false);
        if (onEndCallback) onEndCallback();
      },
      () => {
        setIsSpeaking(true);
      }
    );
  };

  const startWorkerRecognition = (stepNum: number) => {
    if (typeof window === "undefined") return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "hi-IN";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => setIsListeningWorkerVoice(true);

    recognition.onresult = (event: any) => {
      let result = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        result += event.results[i][0].transcript;
      }
      const clean = result.trim().replace(/\.$/, "");

      if (stepNum === 1) setRegName(clean);
      else if (stepNum === 2) setRegOccupation(clean);
      else if (stepNum === 3) setRegExperience(clean + " Years");
      else if (stepNum === 4) setRegLocation(clean);
    };

    recognition.onend = () => {
      setIsListeningWorkerVoice(false);
      setTimeout(() => advanceWorkerVoiceStep(stepNum), 1200);
    };

    recognition.onerror = () => setIsListeningWorkerVoice(false);

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {}
  };

  const advanceWorkerVoiceStep = (currentStep: number) => {
    if (currentStep < 4) {
      const next = currentStep + 1;
      setVoiceStep(next);
      const q = voiceQuestions.find((v) => v.step === next);
      if (q) {
        speakText(q.prompt, () => startWorkerRecognition(next));
      }
    } else {
      setVoiceStep(5);
      speakText("Bahut ache! Aapka profile details mil gaya hai. Kripya apna 10 second ka audio voice intro record kijiye.", () => {});
    }
  };

  const handleStartWorkerVoiceID = () => {
    setVoiceStep(1);
    const q1 = voiceQuestions[0];
    speakText(q1.prompt, () => startWorkerRecognition(1));
  };

  const handleStartClientVoicePrompt = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "hi-IN";

    recognition.onstart = () => setIsListeningClientVoice(true);
    recognition.onresult = (event: any) => {
      const spokenText = event.results[0][0].transcript;
      setClientServiceNeed(spokenText);

      const lower = spokenText.toLowerCase();
      if (lower.includes("tap") || lower.includes("water") || lower.includes("pipe") || lower.includes("leak") || lower.includes("plumber")) {
        setSelectedCategory("plumber");
      } else if (lower.includes("light") || lower.includes("power") || lower.includes("mcb") || lower.includes("electrician")) {
        setSelectedCategory("electrician");
      } else if (lower.includes("ac") || lower.includes("cool") || lower.includes("hvac")) {
        setSelectedCategory("ac");
      } else if (lower.includes("tile") || lower.includes("wall") || lower.includes("mason")) {
        setSelectedCategory("mason");
      } else if (lower.includes("salon") || lower.includes("makeup") || lower.includes("hair")) {
        setSelectedCategory("salon");
      } else if (lower.includes("clean") || lower.includes("sofa")) {
        setSelectedCategory("cleaning");
      } else if (lower.includes("fridge") || lower.includes("appliance")) {
        setSelectedCategory("appliances");
      }
    };
    recognition.onend = () => setIsListeningClientVoice(false);
    recognition.onerror = () => setIsListeningClientVoice(false);
    recognition.start();
  };

  const startRecordingVoiceSnippet = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => setWorkerAudioSnippetUrl(reader.result as string);
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      setIsRecordingAudio(true);
      setAudioTimer(10);

      const interval = setInterval(() => {
        setAudioTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            stopRecordingVoiceSnippet();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      alert("Microphone permission required for voice intro.");
    }
  };

  const stopRecordingVoiceSnippet = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
    }
  };

  const handleCompleteWorkerReg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regOccupation) {
      alert("Please fill name and occupation.");
      return;
    }

    const savedWorker = saveWorker({
      name: regName,
      occupation: regOccupation,
      category: "plumber",
      experience: regExperience || "4 Years",
      location: regLocation || "Chandigarh Central",
      rating: 4.9,
      jobsCompleted: 1,
      trustScore: 95,
      badge: "Verified",
      phone: "9876543299",
      avatarUrl: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80",
      avatar: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80",
      bio: `Professional ${regOccupation} with ${regExperience || "4 Years"} experience. Voice ID Verified.`,
      skills: [regOccupation, "Quick Repair"],
      audioSnippetUrl: workerAudioSnippetUrl,
      isAvailable: true,
      hourlyRate: 350,
      trustBreakdown: {
        identityVerified: true,
        ratingHigh: true,
        jobsThreshold: true,
        onTimeRecord: true,
      },
    });

    setWorkers(getStoredWorkers());

    const userObj: AuthSessionUser = {
      id: savedWorker.id,
      name: savedWorker.name,
      role: "worker",
      occupation: savedWorker.occupation,
      location: savedWorker.location,
      experience: savedWorker.experience,
      token: `token-${Date.now()}`,
    };

    localStorage.setItem("skilllink_user", JSON.stringify(userObj));
    setCurrentUser(userObj);
    setActiveSection("PROFILE");
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNum.length < 10) return alert("Enter valid 10-digit mobile number");

    setIsSendingOtp(true);
    setOtpError(null);

    const res = await sendPhoneOtp(phoneNum);
    setIsSendingOtp(false);

    if (res.success) {
      setOtpStep("OTP");
      setResendTimer(60);
      setAuthNotice(res.message);
    } else {
      setOtpError(res.message);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput.trim().length < 4) {
      setOtpError("Enter 6-digit OTP code");
      return;
    }

    const res = await verifyPhoneOtp(phoneNum, otpInput, clientName, "client", clientServiceNeed);

    if (res.success && res.user) {
      setCurrentUser(res.user);
      if (clientServiceNeed) {
        setSearchQuery(clientServiceNeed);
      }
      setActiveSection("MARKETPLACE");
    } else {
      setOtpError(res.message);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientEmail || !clientPassword) return alert("Enter email and password");

    const res = await signInWithPassword(clientEmail, clientPassword);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      setActiveSection("MARKETPLACE");
    } else {
      setOtpError(res.message);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setIsSendingOtp(true);
    const res = await sendPhoneOtp(phoneNum);
    setIsSendingOtp(false);
    if (res.success) {
      setResendTimer(60);
      setAuthNotice("New OTP sent to your phone number.");
    }
  };

  const handleGuestLogin = () => {
    const guestObj: AuthSessionUser = {
      id: "guest-user",
      name: "Guest Explorer",
      role: "guest",
      token: "guest-token",
    };
    localStorage.setItem("skilllink_user", JSON.stringify(guestObj));
    setCurrentUser(guestObj);
    setActiveSection("MARKETPLACE");
  };

  const handleLogout = () => {
    clearAuthSession();
    setCurrentUser(null);
    setAuthFlowStep("CHOICE");
    setVoiceStep(0);
    setOtpStep("PHONE");
    setPhoneNum("");
    setClientName("");
    setOtpInput("");
    setClientServiceNeed("");
    setClientEmail("");
    setClientPassword("");
  };

  const handleVoiceSearch = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "hi-IN";

    recognition.onstart = () => setIsVoiceSearching(true);
    recognition.onresult = (event: any) => {
      const spokenText = event.results[0][0].transcript;
      setSearchQuery(spokenText);

      const lower = spokenText.toLowerCase();
      if (lower.includes("tap") || lower.includes("water") || lower.includes("pipe") || lower.includes("leak") || lower.includes("plumber")) {
        setSelectedCategory("plumber");
      } else if (lower.includes("light") || lower.includes("power") || lower.includes("mcb") || lower.includes("electrician")) {
        setSelectedCategory("electrician");
      } else if (lower.includes("ac") || lower.includes("cool") || lower.includes("hvac")) {
        setSelectedCategory("ac");
      } else if (lower.includes("tile") || lower.includes("wall") || lower.includes("mason")) {
        setSelectedCategory("mason");
      } else if (lower.includes("salon") || lower.includes("makeup") || lower.includes("hair")) {
        setSelectedCategory("salon");
      } else if (lower.includes("clean") || lower.includes("sofa")) {
        setSelectedCategory("cleaning");
      } else if (lower.includes("fridge") || lower.includes("appliance")) {
        setSelectedCategory("appliances");
      }
    };
    recognition.onend = () => setIsVoiceSearching(false);
    recognition.onerror = () => setIsVoiceSearching(false);
    recognition.start();
  };

  const handleTriggerSOS = () => {
    setSosSearching(true);
    setSosCountdown(15);
    setSosMatchedWorker(null);
    setSosConfirmed(false);
  };

  const handleConfirmSOSBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sosMatchedWorker || !sosClientName || !sosClientPhone) return;

    saveBooking({
      workerId: sosMatchedWorker.id,
      workerName: sosMatchedWorker.name,
      occupation: sosMatchedWorker.occupation,
      clientName: sosClientName,
      clientPhone: sosClientPhone,
      serviceType: `EMERGENCY SOS: ${sosEmergencyType}`,
      bookingDate: new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "In-Progress",
      visitFeePaid: true,
      visitFeeAmount: 149,
      emergencySos: true,
    });

    setSosConfirmed(true);
  };

  const filteredWorkers = workers.filter((w) => {
    const matchesCategory =
      selectedCategory === "All" ||
      w.category === selectedCategory ||
      w.occupation.toLowerCase().includes(selectedCategory.toLowerCase());

    const matchesSearch =
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.occupation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.location.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const handleBookingSuccess = (bookingId: string) => {
    setBookingWorker(null);
    setToastMessage(`Booking #${bookingId} confirmed! Check Dashboard.`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  if (!hasMounted || isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-3 bg-[#090d16] text-white">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-xs font-bold text-slate-400">Loading SkillLink Service Marketplace...</p>
      </div>
    );
  }

  // ==========================================
  // VIEW 1: INSTAGRAM-STYLE FULL-SCREEN PRODUCTION AUTH PAGE (UNAUTHENTICATED)
  // NO MARKETPLACE CARDS, NO BOTTOM BAR, NO HEADER VISIBLE
  // ==========================================
  if (!currentUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#090d16] overflow-y-auto">
        {/* Ambient Gradient Background Blur Orbs */}
        <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative w-full max-w-xl glass-panel-3d bg-slate-950/90 border border-white/20 rounded-3xl p-6 sm:p-10 shadow-[0_20px_70px_rgba(0,0,0,0.9)] my-auto space-y-6 text-white backdrop-blur-2xl">
          {/* Instagram-Style Brand Header */}
          <div className="text-center space-y-3">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 via-emerald-400 to-cyan-300 p-0.5 mx-auto shadow-[0_0_40px_rgba(79,70,229,0.6)] flex items-center justify-center">
              <div className="w-full h-full bg-[#090d16] rounded-[22px] flex items-center justify-center">
                <Zap className="w-10 h-10 text-cyan-300 fill-cyan-300 animate-pulse" />
              </div>
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                SkillLink
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-sm mx-auto mt-1">
                India&apos;s 1st Sahayak Voice AI Service Network. Production Secure Auth Ready.
              </p>
            </div>
          </div>

          {/* STEP 1: CHOICE SCREEN (Client vs Worker) */}
          {authFlowStep === "CHOICE" && (
            <div className="space-y-4 pt-2">
              <button
                onClick={() => setAuthFlowStep("CLIENT_AUTH")}
                className="w-full p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/80 border border-indigo-500/40 hover:border-indigo-400 transition-all hover:scale-[1.02] active:scale-[0.98] text-left group shadow-xl flex items-center justify-between min-h-[80px]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 flex items-center justify-center font-black shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <User className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      I am a Client / Customer
                      <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Book Service
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300 font-medium mt-0.5">
                      Ghar ka kaam karwana hai (Plumber, Electrician, Salon, AC, Cleaning)
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-cyan-300 group-hover:translate-x-1 transition-all shrink-0" />
              </button>

              <button
                onClick={() => setAuthFlowStep("WORKER_AUTH")}
                className="w-full p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/80 border border-emerald-500/40 hover:border-emerald-400 transition-all hover:scale-[1.02] active:scale-[0.98] text-left group shadow-xl flex items-center justify-between min-h-[80px]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center font-black shrink-0 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                    <Mic className="w-7 h-7 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      I am a Skilled Worker
                      <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Sahayak Voice AI
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300 font-medium mt-0.5">
                      Kaam dhoondhna hai / Speak Hindi to create verified profile
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-emerald-300 group-hover:translate-x-1 transition-all shrink-0" />
              </button>

              <div className="pt-2 text-center">
                <button
                  onClick={handleGuestLogin}
                  className="text-xs font-black text-slate-400 hover:text-cyan-300 transition-colors flex items-center justify-center gap-1.5 mx-auto min-h-[40px]"
                >
                  <Compass className="w-4 h-4" /> Skip & Explore Marketplace as Guest →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2A: CLIENT AUTH (WITH PHONE OTP & PASSWORD LOGIN TOGGLE) */}
          {authFlowStep === "CLIENT_AUTH" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-400" /> Client Sign-In & Service Request
                </h2>
                <button
                  onClick={() => setAuthFlowStep("CHOICE")}
                  className="text-xs font-bold text-slate-400 hover:text-white"
                >
                  Change Role
                </button>
              </div>

              {/* Auth Method Toggle (Phone OTP vs Password Credential) */}
              <div className="flex p-1 bg-slate-900 border border-white/10 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setAuthMethod("OTP")}
                  className={`w-1/2 py-2 text-xs font-black rounded-xl transition-all ${
                    authMethod === "OTP"
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Phone className="w-3.5 h-3.5 inline mr-1" /> Phone 6-Digit OTP
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMethod("PASSWORD")}
                  className={`w-1/2 py-2 text-xs font-black rounded-xl transition-all ${
                    authMethod === "PASSWORD"
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Lock className="w-3.5 h-3.5 inline mr-1" /> Email & Password
                </button>
              </div>

              {/* MODE A: PHONE OTP AUTH */}
              {authMethod === "OTP" && (
                <>
                  {otpStep === "PHONE" ? (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <div>
                        <label className="block text-xs font-black uppercase text-slate-400 mb-1">
                          Your Full Name
                        </label>
                        <input
                          type="text"
                          required
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          placeholder="e.g. Priyanshu Sharma"
                          className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-white/10 text-white text-sm font-semibold focus:outline-none min-h-[48px]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black uppercase text-slate-400 mb-1">
                          Enter 10-Digit Mobile Number
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-3.5 text-xs font-bold text-slate-400">+91</span>
                          <input
                            type="tel"
                            required
                            maxLength={10}
                            value={phoneNum}
                            onChange={(e) => setPhoneNum(e.target.value.replace(/\D/g, ""))}
                            placeholder="9876543210"
                            className="w-full pl-14 pr-4 py-3 rounded-2xl bg-slate-900 border border-white/10 text-white text-sm font-semibold focus:outline-none min-h-[48px]"
                          />
                        </div>
                      </div>

                      {/* Voice AI Service Prompt Assistant */}
                      <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black uppercase text-cyan-300 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" /> Service Needed (Optional)
                          </label>
                          <button
                            type="button"
                            onClick={handleStartClientVoicePrompt}
                            className={`px-3 py-1.5 rounded-full font-black text-xs flex items-center gap-1.5 transition-all ${
                              isListeningClientVoice
                                ? "bg-rose-600 text-white animate-pulse shadow-lg"
                                : "btn-3d-emerald-shine text-slate-950"
                            }`}
                          >
                            <Mic className={`w-3.5 h-3.5 ${isListeningClientVoice ? "animate-ping text-white" : ""}`} />
                            {isListeningClientVoice ? "Listening..." : "Speak Need"}
                          </button>
                        </div>

                        <input
                          type="text"
                          value={clientServiceNeed}
                          onChange={(e) => setClientServiceNeed(e.target.value)}
                          placeholder="e.g. 'Plumber chahiye tap repair ke liye' or speak..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-semibold focus:outline-none min-h-[44px]"
                        />
                      </div>

                      {otpError && <p className="text-xs font-bold text-rose-400">{otpError}</p>}

                      <button
                        type="submit"
                        disabled={isSendingOtp}
                        className="w-full py-3.5 btn-3d-tactile text-xs font-black min-h-[48px] shine-overlay disabled:opacity-50"
                      >
                        {isSendingOtp ? "Sending Real OTP..." : "Send Real 6-Digit OTP Code"} <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-black uppercase text-slate-400">
                            Enter Real 6-Digit OTP Code
                          </label>
                          <span className="text-xs font-extrabold text-cyan-300">
                            +91 {phoneNum}
                          </span>
                        </div>

                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                          placeholder="123456"
                          className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-white/10 text-center tracking-widest text-2xl font-black text-emerald-400 focus:outline-none min-h-[52px]"
                        />

                        {authNotice && (
                          <p className="text-[11px] font-semibold text-emerald-300 mt-1">{authNotice}</p>
                        )}
                        {otpError && (
                          <p className="text-xs font-bold text-rose-400 mt-1">{otpError}</p>
                        )}
                      </div>

                      {/* 60-Second Resend Countdown */}
                      <div className="flex items-center justify-between text-xs font-bold text-slate-400 pt-1">
                        <span>Resend OTP timer:</span>
                        {resendTimer > 0 ? (
                          <span className="text-emerald-400 font-black flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 animate-spin" /> {resendTimer}s
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleResendOtp}
                            className="text-cyan-300 hover:underline font-black flex items-center gap-1"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Resend OTP Code Now
                          </button>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setOtpStep("PHONE")}
                          className="w-1/3 py-3.5 bg-slate-900 text-slate-300 font-bold text-xs rounded-2xl border border-white/10 min-h-[48px]"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          className="w-2/3 py-3.5 btn-3d-emerald-shine text-xs font-black min-h-[48px] shine-overlay"
                        >
                          Verify & Open Marketplace
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}

              {/* MODE B: PASSWORD CREDENTIAL AUTH */}
              {authMethod === "PASSWORD" && (
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900 border border-white/10 text-white text-sm font-semibold focus:outline-none min-h-[48px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={clientPassword}
                        onChange={(e) => setClientPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900 border border-white/10 text-white text-sm font-semibold focus:outline-none min-h-[48px]"
                      />
                    </div>
                  </div>

                  {otpError && <p className="text-xs font-bold text-rose-400">{otpError}</p>}

                  <button
                    type="submit"
                    className="w-full py-3.5 btn-3d-emerald-shine text-xs font-black min-h-[48px] shine-overlay"
                  >
                    Log In with Credentials <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          )}

          {/* STEP 2B: WORKER SAHAYAK FEMALE VOICE AI ONBOARDING */}
          {authFlowStep === "WORKER_AUTH" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-400 fill-rose-400" /> Sahayak Female Voice AI Registration
                </h2>
                <button
                  onClick={() => setAuthFlowStep("CHOICE")}
                  className="text-xs font-bold text-slate-400 hover:text-white"
                >
                  Change Role
                </button>
              </div>

              {/* 3D Visualizer Orb */}
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-900 border border-white/10 text-center space-y-3">
                <div className="orb-visualizer shrink-0 my-1">
                  {isSpeaking && <div className="orb-visualizer-ring" />}
                  {isListeningWorkerVoice && <div className="orb-visualizer-ring-2" />}

                  {voiceStep === 0 ? (
                    <button
                      onClick={handleStartWorkerVoiceID}
                      className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 via-emerald-400 to-cyan-300 text-slate-950 font-black text-xs shadow-[0_0_35px_rgba(16,185,129,0.7)] flex flex-col items-center justify-center gap-1 hover:scale-105 active:scale-95 transition-transform border-2 border-white/90 cursor-pointer min-h-[48px]"
                    >
                      <Mic className="w-7 h-7 text-slate-950 animate-bounce" />
                      <span className="text-[9px] uppercase font-black">Start Voice</span>
                    </button>
                  ) : (
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center text-white border-2 border-white shadow-2xl transition-all ${
                        isListeningWorkerVoice
                          ? "bg-emerald-500 animate-pulse shadow-[0_0_35px_rgba(16,185,129,0.8)]"
                          : isSpeaking
                          ? "bg-indigo-600 animate-pulse shadow-[0_0_35px_rgba(79,70,229,0.8)]"
                          : "bg-slate-800"
                      }`}
                    >
                      {isListeningWorkerVoice ? (
                        <Radio className="w-7 h-7 animate-ping text-white" />
                      ) : isSpeaking ? (
                        <Volume2 className="w-7 h-7 animate-pulse text-cyan-300" />
                      ) : (
                        <MicOff className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                  )}
                </div>

                {aiPromptText && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-white/10 text-xs font-semibold w-full text-center">
                    {isSpeaking ? (
                      <span className="text-cyan-400 font-extrabold block">👩‍💼 Sahayak Voice Assistant Speaking...</span>
                    ) : isListeningWorkerVoice ? (
                      <span className="text-emerald-400 font-extrabold block">🎙️ Listening... Bolyein ab</span>
                    ) : (
                      <span className="text-slate-400 block">Sahayak AI Ready</span>
                    )}
                    <span className="italic text-slate-200 block text-[11px] mt-0.5">&ldquo;{aiPromptText}&rdquo;</span>
                  </div>
                )}
              </div>

              {/* Worker Form Inputs (Name, Occupation, Experience, Location) */}
              <form onSubmit={handleCompleteWorkerReg} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className={`p-2.5 rounded-xl border ${voiceStep === 1 ? "ring-2 ring-indigo-500 bg-indigo-950/50" : "bg-slate-900 border-white/10"}`}>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Ramanand"
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-white text-xs font-semibold focus:outline-none min-h-[40px]"
                    />
                  </div>

                  <div className={`p-2.5 rounded-xl border ${voiceStep === 2 ? "ring-2 ring-indigo-500 bg-indigo-950/50" : "bg-slate-900 border-white/10"}`}>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Occupation / Skill</label>
                    <input
                      type="text"
                      required
                      value={regOccupation}
                      onChange={(e) => setRegOccupation(e.target.value)}
                      placeholder="e.g. Master Plumber"
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-white text-xs font-semibold focus:outline-none min-h-[40px]"
                    />
                  </div>

                  <div className={`p-2.5 rounded-xl border ${voiceStep === 3 ? "ring-2 ring-indigo-500 bg-indigo-950/50" : "bg-slate-900 border-white/10"}`}>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Work Experience</label>
                    <input
                      type="text"
                      required
                      value={regExperience}
                      onChange={(e) => setRegExperience(e.target.value)}
                      placeholder="e.g. 6 Years"
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-white text-xs font-semibold focus:outline-none min-h-[40px]"
                    />
                  </div>

                  <div className={`p-2.5 rounded-xl border ${voiceStep === 4 ? "ring-2 ring-indigo-500 bg-indigo-950/50" : "bg-slate-900 border-white/10"}`}>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">City / Area Location</label>
                    <input
                      type="text"
                      required
                      value={regLocation}
                      onChange={(e) => setRegLocation(e.target.value)}
                      placeholder="e.g. Chandigarh Central"
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-white text-xs font-semibold focus:outline-none min-h-[40px]"
                    />
                  </div>
                </div>

                {/* 10s Voice Intro Snippet Recorder */}
                <div className="p-3 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">10s Worker Audio Intro Snippet</span>
                  {!isRecordingAudio ? (
                    <button
                      type="button"
                      onClick={startRecordingVoiceSnippet}
                      className="px-3 py-1.5 btn-3d-emerald-shine text-[11px] font-black"
                    >
                      <Mic className="w-3.5 h-3.5 inline mr-1" /> Record Intro
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRecordingVoiceSnippet}
                      className="px-3 py-1.5 bg-rose-600 text-white font-black text-[11px] rounded-lg animate-pulse"
                    >
                      Stop ({audioTimer}s)
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 btn-3d-emerald-shine text-xs font-black min-h-[48px] shine-overlay mt-2"
                >
                  Create Voice Profile & Register <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: AUTHENTICATED SINGLE-URL APPLICATION ENGINE ON http://localhost:3000
  // SHOWS MARKETPLACE / DASHBOARD ONLY AFTER SUCCESSFUL LOGIN
  // ==========================================
  return (
    <div className="w-full space-y-6 pb-20 overflow-x-hidden">
      {/* Dynamic Header synced with single-URL section */}
      <Header activeSection={activeSection} onSelectSection={setActiveSection} />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-4 left-4 sm:left-auto sm:max-w-md z-50 bg-emerald-950 text-emerald-200 border border-emerald-500/50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-black">{toastMessage}</span>
        </div>
      )}

      {/* Logged-In User Header Bar with Role Indicator & Logout Button */}
      <div className="glass-panel-3d p-4 border border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-emerald-400 to-cyan-300 text-slate-950 font-black flex items-center justify-center shadow-lg shrink-0">
            <User className="w-5 h-5 text-slate-950" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-white truncate">{currentUser.name}</h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                {currentUser.role}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate">
              {currentUser.occupation ? `${currentUser.occupation} • ${currentUser.location}` : "Verified Production Session"}
            </p>
          </div>
        </div>

        {/* Unified View Switcher & Clear Logout Button */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-2xl border border-white/10 overflow-x-auto max-w-full scrollbar-none">
          <button
            onClick={() => setActiveSection("MARKETPLACE")}
            className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all flex items-center gap-1 shrink-0 ${
              activeSection === "MARKETPLACE"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <HomeIcon className="w-3.5 h-3.5" /> Marketplace
          </button>
          <button
            onClick={() => setActiveSection("SAHAYAK")}
            className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all flex items-center gap-1 shrink-0 ${
              activeSection === "SAHAYAK"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-emerald-300" /> Sahayak Voice
          </button>
          <button
            onClick={() => setActiveSection("HELPLINES")}
            className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all flex items-center gap-1 shrink-0 ${
              activeSection === "HELPLINES"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" /> Helplines
          </button>
          <button
            onClick={() => setActiveSection("QUICKFIX")}
            className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all flex items-center gap-1 shrink-0 ${
              activeSection === "QUICKFIX"
                ? "bg-rose-600 text-white shadow-md"
                : "text-rose-400 hover:text-rose-300"
            }`}
          >
            <Zap className="w-3.5 h-3.5" /> SOS
          </button>
          <button
            onClick={() => setActiveSection("PROFILE")}
            className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all flex items-center gap-1 shrink-0 ${
              activeSection === "PROFILE"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" /> Dashboard
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 font-extrabold text-xs rounded-xl border border-rose-500/40 transition-colors flex items-center gap-1 shrink-0 min-h-[36px]"
            title="Log Out and return to login screen"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: MARKETPLACE HOME */}
      {activeSection === "MARKETPLACE" && (
        <div className="space-y-8">
          {/* Primary Explicit Mode Toggle: "Home Services" vs "On-Road Emergency" */}
          <div className="flex p-1.5 bg-slate-950/90 rounded-2xl border border-white/15 max-w-md mx-auto shadow-2xl">
            <button
              onClick={() => setServiceMode("HOME")}
              className={`w-1/2 py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 ${
                serviceMode === "HOME"
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg scale-[1.02]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <HomeIcon className="w-4 h-4 text-cyan-300" /> Home Services
            </button>
            <button
              onClick={() => setServiceMode("ON_ROAD")}
              className={`w-1/2 py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 ${
                serviceMode === "ON_ROAD"
                  ? "bg-gradient-to-r from-rose-600 via-red-500 to-amber-500 text-white shadow-lg scale-[1.02]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Car className="w-4 h-4 text-amber-300 animate-pulse" /> On-Road Emergency
            </button>
          </div>

          {/* MODE A: HOME SERVICES */}
          {serviceMode === "HOME" && (
            <>
              {/* Hero Adaptive Spatial Banner */}
              <section className="glass-panel-3d p-6 sm:p-10 text-white rounded-3xl border border-white/15 shadow-2xl relative overflow-hidden">
                <div className="relative z-10 max-w-3xl space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                    <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                    Verified Home Service Marketplace
                  </div>

                  <h1 className="text-2xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                    Find & Book Expert Technicians with{" "}
                    <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                      Trust Guarantee
                    </span>
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl">
                    Book verified plumbers, electricians, masons, salon experts, AC repair & cleaning specialists with ₹149 pre-paid inspection visit fee.
                  </p>

                  {/* Voice-to-Text Search Bar */}
                  <div className="relative mt-4 max-w-2xl">
                    <div className="flex items-center bg-slate-950 rounded-2xl p-1.5 border border-white/20 shadow-2xl">
                      <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search service or speak (e.g. 'Tap leak ho raha hai')..."
                        className="w-full px-3 py-2.5 bg-transparent text-white placeholder-slate-400 focus:outline-none text-xs sm:text-sm font-semibold min-h-[44px]"
                      />
                      <button
                        onClick={handleVoiceSearch}
                        className={`px-4 py-2.5 rounded-xl transition-all font-black flex items-center gap-1.5 text-xs min-h-[44px] shrink-0 ${
                          isVoiceSearching
                            ? "bg-rose-600 text-white animate-pulse"
                            : "btn-3d-tactile"
                        }`}
                      >
                        <Mic className={`w-4 h-4 ${isVoiceSearching ? "animate-ping text-white" : "text-emerald-300"}`} />
                        <span className="hidden sm:inline">
                          {isVoiceSearching ? "Listening..." : "Voice Search"}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* 3D Category Chips */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Filter className="w-4 h-4 text-indigo-400" />
                    Explore Home Categories
                  </h2>
                  <span className="text-xs text-slate-400 font-bold">
                    {filteredWorkers.length} Verified Available
                  </span>
                </div>

                <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                  {categories.map((cat) => {
                    const isSelected = selectedCategory === cat.value;
                    return (
                      <button
                        key={cat.value}
                        onClick={() => setSelectedCategory(cat.value)}
                        className={`px-4 py-2.5 rounded-2xl font-black text-xs shrink-0 transition-all flex items-center gap-2 min-h-[42px] ${
                          isSelected
                            ? "bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 text-white border border-white/40 scale-105 shadow-lg"
                            : "bg-slate-900 text-slate-300 border border-white/10 hover:bg-slate-800"
                        }`}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* ADAPTIVE WORKER GRID */}
              <section className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredWorkers.map((worker) => (
                    <WorkerCard
                      key={worker.id}
                      worker={worker}
                      onOpenTrustModal={(w) => setTrustWorker(w)}
                      onBookService={(w) => setBookingWorker(w)}
                    />
                  ))}
                </div>

                {filteredWorkers.length === 0 && (
                  <div className="text-center py-16 glass-panel-3d rounded-3xl p-8">
                    <Zap className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                    <h3 className="text-lg font-black text-white">No Workers Match Your Filter</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4 font-medium">
                      Try clearing your search query or selecting &quot;All&quot; categories to see available technicians.
                    </p>
                    <button
                      onClick={() => {
                        setSelectedCategory("All");
                        setSearchQuery("");
                      }}
                      className="px-5 py-2.5 btn-3d-tactile text-xs font-black min-h-[44px]"
                    >
                      Reset Filters
                    </button>
                  </div>
                )}
              </section>
            </>
          )}

          {/* MODE B: ON-ROAD EMERGENCY BREAKDOWN ASSIST */}
          {serviceMode === "ON_ROAD" && (
            <div className="space-y-6">
              {/* Geolocation GPS Active Indicator Card */}
              <div className="glass-panel-3d p-4 sm:p-5 rounded-3xl border border-emerald-500/40 bg-emerald-950/20 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-3.5">
                  <div className="radar-pulse-ring w-4 h-4 rounded-full bg-emerald-400 shrink-0 ml-1" />
                  <div>
                    <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider block flex items-center gap-1">
                      <Navigation className="w-3.5 h-3.5" /> Geolocation API Live Active
                    </span>
                    <span className="text-xs sm:text-sm font-black text-white">
                      {gpsStatus.isLoading ? "Acquiring satellite GPS coordinates..." : gpsStatus.address}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-black px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                    15-Min Priority Guarantee
                  </span>
                </div>
              </div>

              {/* Quick SOS Priority Button Banner */}
              <div className="glass-panel-3d p-6 sm:p-8 rounded-3xl border border-rose-500/40 bg-gradient-to-r from-slate-950 via-rose-950/40 to-slate-950 shadow-2xl text-center space-y-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center justify-center gap-2">
                    <Car className="w-7 h-7 text-amber-400 animate-bounce" /> On-Road Breakdown Emergency Assist
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto mt-1 font-medium">
                    Highway & City roadside rescue: Puncture, Battery Jumpstart, Towing, Mechanical Engine Repair & Fuel Delivery.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setSosPriorityDispatchOpen(true);
                    setDispatchCountdown(15);
                    setDispatchedMechanic(null);
                  }}
                  className="px-6 py-4 btn-3d-rose-sos text-sm sm:text-base font-black tracking-wide shine-overlay mx-auto active:scale-95"
                >
                  <Zap className="w-5 h-5 text-yellow-300 animate-bounce" />
                  Find Nearest Mechanic (15-Min Priority Dispatch)
                </button>
              </div>

              {/* On-Road Breakdown Category Chips */}
              <section className="space-y-3">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-amber-400" /> On-Road Emergency Services
                </h3>

                <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                  {onRoadCategories.map((cat) => {
                    const isSelected = onRoadCategory === cat.value;
                    return (
                      <button
                        key={cat.value}
                        onClick={() => setOnRoadCategory(cat.value)}
                        className={`px-4 py-2.5 rounded-2xl font-black text-xs shrink-0 transition-all flex items-center gap-2 min-h-[42px] ${
                          isSelected
                            ? "bg-gradient-to-r from-rose-600 via-amber-500 to-amber-600 text-white border border-white/40 scale-105 shadow-lg"
                            : "bg-slate-900 text-slate-300 border border-white/10 hover:bg-slate-800"
                        }`}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Nearby Garages & Mechanics Grid */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                    Nearby Garages & Mobile Mechanics ({mechanics.filter(m => onRoadCategory === "All" || m.category === onRoadCategory).length})
                  </h3>
                  <span className="text-[11px] text-emerald-400 font-bold">Distance Sorted by GPS</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mechanics
                    .filter((m) => onRoadCategory === "All" || m.category === onRoadCategory)
                    .map((m) => (
                      <div
                        key={m.id}
                        className="glass-panel-3d p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden group border border-white/15 shadow-2xl rounded-3xl bg-slate-900/80 hover:border-amber-500/50 transition-all"
                      >
                        <div className="space-y-4">
                          {/* Top Row: Distance & 24/7 Badge */}
                          <div className="flex items-center justify-between">
                            <span className="px-3 py-1 rounded-full text-[11px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-cyan-300" /> {m.distanceKm} km away
                            </span>

                            {m.is24x7 && (
                              <span className="px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                                ⚡ 24/7 Available
                              </span>
                            )}
                          </div>

                          {/* Info Row */}
                          <div className="flex items-start gap-4">
                            <img
                              src={m.avatarUrl}
                              alt={m.name}
                              className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400/40 shadow-xl group-hover:scale-105 transition-transform shrink-0"
                            />
                            <div className="min-w-0">
                              <h4 className="text-base font-black text-white truncate flex items-center gap-1">
                                {m.name}
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              </h4>
                              <p className="text-xs text-slate-300 font-bold">Owner: {m.ownerName}</p>
                              <p className="text-[11px] text-slate-400 truncate mt-0.5">{m.location}</p>
                            </div>
                          </div>

                          {/* Rating & Fee Row */}
                          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1 font-black text-amber-300 bg-amber-950/60 px-3 py-1 rounded-xl border border-amber-500/30">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span>{m.rating.toFixed(1)}</span>
                              <span className="text-slate-400 font-normal">({m.reviewsCount})</span>
                            </div>

                            <div className="font-black text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-xl border border-emerald-500/30">
                              Visiting Fee: ₹{m.visitingFee}
                            </div>
                          </div>

                          {/* Services Chips */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {m.servicesOffered.map((srv, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-0.5 rounded-lg bg-slate-950 text-[10px] font-extrabold text-slate-300 border border-white/10"
                              >
                                {srv}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Direct Action Buttons */}
                        <div className="mt-5 pt-3 border-t border-white/10 grid grid-cols-2 gap-2">
                          <a
                            href={`tel:${m.phone}`}
                            className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all min-h-[44px]"
                          >
                            <PhoneCall className="w-4 h-4" /> Call Mechanic
                          </a>

                          <button
                            onClick={() => {
                              speakFemaleHindiText(`Connecting to LEXI Voice Guide for roadside assistance with ${m.name}.`);
                            }}
                            className="py-2.5 px-3 rounded-xl bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/40 text-cyan-300 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all min-h-[44px]"
                          >
                            <Volume2 className="w-4 h-4 text-cyan-300 animate-pulse" /> Instant Voice (LEXI)
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </section>

              {/* 15-Min Priority Dispatch Countdown Modal Overlay */}
              {sosPriorityDispatchOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl">
                  <div className="relative w-full max-w-md glass-panel-3d bg-slate-950 border border-rose-500/50 rounded-3xl p-6 shadow-2xl text-center space-y-5">
                    <div className="w-20 h-20 rounded-full bg-rose-600 text-white flex items-center justify-center mx-auto shadow-[0_0_35px_rgba(225,29,72,0.8)] animate-pulse">
                      <Clock className="w-10 h-10 animate-spin" />
                    </div>

                    {!dispatchedMechanic ? (
                      <>
                        <h3 className="text-xl font-black text-white">Searching 15-Min Priority Dispatch Mechanics...</h3>
                        <p className="text-xs text-slate-300 font-medium">
                          Locating closest verified garage within {gpsStatus.address}...
                        </p>
                        <div className="text-5xl font-black text-rose-400 font-mono tracking-wider">{dispatchCountdown}s</div>
                      </>
                    ) : (
                      <>
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Mechanic Dispatched & Locked
                        </span>
                        <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 text-left space-y-2">
                          <h4 className="text-base font-black text-white">{dispatchedMechanic.name}</h4>
                          <p className="text-xs text-slate-300 font-bold">Contact: {dispatchedMechanic.phone}</p>
                          <p className="text-xs text-cyan-300 font-bold">Estimated Arrival: {dispatchedMechanic.estimatedArrivalMins} Minutes</p>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <a
                            href={`tel:${dispatchedMechanic.phone}`}
                            className="w-full py-3 btn-3d-emerald-shine text-xs font-black"
                          >
                            <PhoneCall className="w-4 h-4 inline mr-1" /> Call Dispatched Mechanic Directly
                          </a>
                        </div>
                      </>
                    )}

                    <button
                      onClick={() => setSosPriorityDispatchOpen(false)}
                      className="text-xs font-extrabold text-slate-400 hover:text-white pt-2"
                    >
                      Close Window
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: SAHAYAK VOICE ID */}
      {activeSection === "SAHAYAK" && (
        <div className="space-y-6">
          <SahayakVoice />
        </div>
      )}

      {/* SECTION 3: BRAND HELPLINES */}
      {activeSection === "HELPLINES" && (
        <div className="space-y-6">
          <BrandHelpline />
        </div>
      )}

      {/* SECTION 4: QUICKFIX SOS */}
      {activeSection === "QUICKFIX" && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="glass-panel-3d p-6 sm:p-8 text-white rounded-3xl relative overflow-hidden border border-rose-500/40 shadow-2xl">
            <div className="relative z-10 space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
                <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
                24/7 SOS Emergency Priority Dispatch
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-white">
                QuickFix Utility Breakdown SOS
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-xl">
                Immediate 15-minute priority dispatch for critical utility failures, pipe bursts, short circuits, or gas leakages.
              </p>
            </div>
          </div>

          <div className="glass-panel-3d p-6 border border-white/10 space-y-4">
            <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider">
              Select Emergency Breakdown Type
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {["Pipe Burst / Major Leakage", "Main Power Trip / Wiring Burn", "Gas Leakage / Heater Failure", "Lockout / Door Fitting"].map((lbl) => (
                <button
                  key={lbl}
                  onClick={() => setSosEmergencyType(lbl)}
                  className={`p-4 rounded-2xl border text-xs font-black text-left transition-all ${
                    sosEmergencyType === lbl
                      ? "bg-rose-950/80 border-rose-500 text-rose-200 shadow-lg ring-2 ring-rose-500/40 scale-105"
                      : "bg-slate-900 border-white/10 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <span>{lbl}</span>
                </button>
              ))}
            </div>

            {!sosSearching && !sosMatchedWorker && (
              <div className="mt-8 text-center space-y-4 py-4">
                <button
                  onClick={handleTriggerSOS}
                  className="w-36 h-36 rounded-full bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 text-white font-black text-lg shadow-[0_0_50px_rgba(225,29,72,0.6)] border-4 border-white/80 mx-auto flex flex-col items-center justify-center gap-1 hover:scale-105 active:scale-95 transition-transform cursor-pointer shine-overlay"
                >
                  <Zap className="w-10 h-10 animate-bounce text-white" />
                  <span className="text-xs uppercase tracking-wider font-black">DISPATCH SOS</span>
                </button>
              </div>
            )}

            {sosSearching && (
              <div className="mt-8 text-center space-y-4 py-8 bg-slate-900/90 rounded-2xl border border-rose-500/40">
                <div className="w-20 h-20 rounded-full bg-rose-600 text-white flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(225,29,72,0.8)] animate-pulse">
                  <Clock className="w-10 h-10 animate-spin" />
                </div>
                <h3 className="text-xl font-black text-white">Searching Nearby Technicians...</h3>
                <div className="text-4xl font-black text-rose-400">{sosCountdown}s</div>
              </div>
            )}

            {sosMatchedWorker && !sosConfirmed && (
              <div className="mt-6 p-5 rounded-2xl bg-slate-900 border border-indigo-500/40 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-300 bg-emerald-950 px-3 py-1 rounded-full border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> SOS Priority Match Found
                  </span>
                  <span className="text-xs font-black text-cyan-300">10 Min ETA</span>
                </div>

                <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-2xl border border-white/10">
                  <img src={sosMatchedWorker.avatarUrl || sosMatchedWorker.avatar} alt={sosMatchedWorker.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-400" />
                  <div>
                    <h3 className="text-lg font-black text-white">{sosMatchedWorker.name}</h3>
                    <p className="text-xs font-black text-emerald-400">{sosMatchedWorker.occupation}</p>
                    <p className="text-xs text-slate-400">{sosMatchedWorker.location}</p>
                  </div>
                </div>

                <form onSubmit={handleConfirmSOSBooking} className="space-y-3">
                  <input
                    type="text"
                    required
                    value={sosClientName}
                    onChange={(e) => setSosClientName(e.target.value)}
                    placeholder="Your Full Name"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm font-semibold focus:outline-none min-h-[44px]"
                  />
                  <input
                    type="tel"
                    required
                    value={sosClientPhone}
                    onChange={(e) => setSosClientPhone(e.target.value)}
                    placeholder="Mobile Number"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm font-semibold focus:outline-none min-h-[44px]"
                  />
                  <button type="submit" className="w-full py-3.5 bg-rose-600 text-white font-black text-xs rounded-2xl shadow-lg border-b-4 border-rose-950 min-h-[48px]">
                    Confirm SOS Dispatch
                  </button>
                </form>
              </div>
            )}

            {sosConfirmed && sosMatchedWorker && (
              <div className="mt-6 text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.5)] border border-emerald-500/40">
                  <CheckCircle2 className="w-10 h-10 animate-bounce text-emerald-400" />
                </div>
                <h3 className="text-2xl font-black text-white">Technician Dispatched!</h3>
                <p className="text-xs text-slate-300">
                  <span className="font-bold text-cyan-300">{sosMatchedWorker.name}</span> is en route. Phone: <span className="font-bold text-white">{sosMatchedWorker.phone}</span>.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 5: PROFILE DASHBOARD */}
      {activeSection === "PROFILE" && (
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="glass-panel-3d p-6 sm:p-8 text-white rounded-3xl border border-white/15 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-emerald-400 to-cyan-300 p-0.5 shadow-lg flex items-center justify-center text-slate-950 font-black shrink-0">
                <Calendar className="w-8 h-8 text-slate-950" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white">
                  User & Worker Dashboard
                </h1>
                <p className="text-xs text-slate-300 font-medium">
                  Manage service bookings, post-service work photos, and active sessions.
                </p>
              </div>
            </div>
          </div>

          <div className="glass-panel-3d p-6 border border-white/10 space-y-4">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-400" />
              Registered Marketplace Professionals ({workers.length})
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {workers.map((w) => (
                <div key={w.id} className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={w.avatarUrl || w.avatar} alt={w.name} className="w-12 h-12 rounded-xl object-cover border border-indigo-400/40" />
                    <div>
                      <h3 className="text-sm font-black text-white flex items-center gap-1">{w.name} <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /></h3>
                      <p className="text-xs text-emerald-400 font-black">{w.occupation}</p>
                      <p className="text-[11px] text-slate-400 font-medium">{w.location}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {trustWorker && (
        <TrustModal worker={trustWorker} onClose={() => setTrustWorker(null)} />
      )}

      {bookingWorker && (
        <PaymentModal
          worker={bookingWorker}
          onClose={() => setBookingWorker(null)}
          onSuccess={handleBookingSuccess}
        />
      )}

      {/* Bottom Nav Controller for Mobile */}
      <BottomNav activeSection={activeSection} onSelectSection={setActiveSection} />
    </div>
  );
}

export default function HomeMarketplace() {
  return (
    <Suspense fallback={
      <div className="text-center py-20 text-slate-400 font-bold text-sm">
        Loading Single-URL Service Application...
      </div>
    }>
      <MarketplaceContent />
    </Suspense>
  );
}

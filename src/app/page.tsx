"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import dynamic from "next/dynamic";
import { WorkerProfile, INITIAL_WORKERS, INITIAL_MECHANICS, OnRoadMechanic } from "@/lib/seedData";
import { getStoredWorkers, saveWorker, saveBooking } from "@/lib/storage";
import { speakFemaleHindiText } from "@/lib/voice";
import {
  sendPhoneOtp,
  verifyPhoneOtp,
  signInWithPassword,
  clearAuthSession,
  syncCurrentAuthSession,
  normalizeUserRole,
  AuthSessionUser,
} from "@/lib/auth";
import {
  fetchServicesFromDb,
  fetchWorkersFromDb,
  DbService,
} from "@/lib/supabaseService";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import WorkerCard from "@/components/WorkerCard";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import SOSDispatchModal from "@/components/SOSDispatchModal";
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
  Building,
} from "lucide-react";
import { useSearchParams } from "next/navigation";

import { AppSection } from "@/components/Header";
import { LanguageCode, TRANSLATIONS } from "@/lib/i18n";
import { rankWorkersWithAI } from "@/lib/aiMatching";

// Dynamic Imports for High Performance & Reduced JS Bundle Load
const TrustModal = dynamic(() => import("@/components/TrustModal"), { ssr: false });
const PaymentModal = dynamic(() => import("@/components/PaymentModal"), { ssr: false });
const BrandHelpline = dynamic(() => import("@/components/BrandHelpline"), { ssr: false });
const SahayakVoice = dynamic(() => import("@/components/SahayakVoice"), { ssr: false });
const WorkerPortal = dynamic(() => import("@/components/WorkerPortal"), { ssr: false });
const CooperativeAdminDashboard = dynamic(() => import("@/components/CooperativeAdminDashboard"), { ssr: false });
const WorkerWelfareModal = dynamic(() => import("@/components/WorkerWelfareModal"), { ssr: false });

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

function MarketplaceContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "All";
  const sectionParam = searchParams.get("section") as AppSection | null;

  // App Role View Mode: "MARKETPLACE" | "WORKER_PORTAL" | "COOPERATIVE_ADMIN" | "QUICKFIX" | "SAHAYAK" | "HELPLINES" | "PROFILE"
  const [activeSection, setActiveSection] = useState<AppSection>(sectionParam || "MARKETPLACE");
  const [dbServices, setDbServices] = useState<DbService[]>([]);
  const [isSupabaseLive, setIsSupabaseLive] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>("en");
  const [welfareModalOpen, setWelfareModalOpen] = useState(false);

  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;

  const handleLanguageToggle = () => {
    setCurrentLanguage((prev) => (prev === "en" ? "hi" : prev === "hi" ? "pa" : "en"));
  };

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

  const categories = React.useMemo(() => {
    if (!dbServices || dbServices.length === 0) {
      return [
        { label: t.allServices || "All", value: "All", icon: "🌐" },
        { label: t.electrician || "Electrician", value: "electrician", icon: "⚡" },
        { label: t.plumber || "Plumber", value: "plumber", icon: "🔧" },
        { label: t.carpenter || "Carpenter", value: "carpenter", icon: "🪚" },
        { label: t.painter || "Painter", value: "painter", icon: "🎨" },
        { label: t.cleaner || "Deep Cleaning", value: "cleaning", icon: "🧹" },
        { label: t.driver || "Driver", value: "driver", icon: "🚗" },
        { label: t.gardener || "Gardener", value: "gardener", icon: "🌿" },
        { label: t.caregiver || "Caregiver", value: "caregiver", icon: "🩺" },
        { label: t.technician || "AC Repair", value: "ac", icon: "❄️" },
        { label: "Appliances", value: "appliances", icon: "🔌" },
        { label: "Civil Mason", value: "mason", icon: "🧱" },
        { label: "Salon & Spa", value: "salon", icon: "✂️" },
      ];
    }
    const dbItems = dbServices.map((s) => ({
      label: s.name,
      value: s.slug || s.name.toLowerCase(),
      icon: s.icon || "🔧",
    }));
    return [{ label: t.allServices || "All", value: "All", icon: "🌐" }, ...dbItems];
  }, [dbServices, t]);

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

    // 1. Fetch dynamic services from Supabase
    fetchServicesFromDb().then((res) => {
      if (res.success && res.data.length > 0) {
        setDbServices(res.data);
        setIsSupabaseLive(true);
      }
    });

    // 2. Fetch dynamic workers from Supabase
    fetchWorkersFromDb().then((res) => {
      if (res.success && res.data.length > 0) {
        setWorkers(res.data);
        setIsSupabaseLive(true);
      } else {
        setWorkers(getStoredWorkers());
      }
    });

    // 3. Sync Supabase Auth session & profile
    syncCurrentAuthSession().then((user) => {
      if (user) {
        setCurrentUser(user);
        const sectionParam = searchParams.get("section") as AppSection | null;
        if (sectionParam) {
          setActiveSection(sectionParam);
        } else {
          const canonical = normalizeUserRole(user.role);
          if (canonical === "worker") {
            setActiveSection("WORKER_PORTAL");
          } else if (canonical === "cooperative_admin" || canonical === "super_admin") {
            setActiveSection("COOPERATIVE_ADMIN");
          }
        }
      } else {
        setCurrentUser(null);
      }
      setIsAuthLoading(false);
    });

    // 4. Supabase auth state change listener
    if (isSupabaseConfigured() && supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          syncCurrentAuthSession().then((u) => {
            if (u) setCurrentUser(u);
          });
        } else if (!session) {
          const localUser = localStorage.getItem("skilllink_user");
          if (!localUser || !localUser.includes("guest")) {
            setCurrentUser(null);
          }
        }
      });

      return () => {
        authListener?.subscription?.unsubscribe();
      };
    }
  }, [searchParams]);

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

    try {
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
        }
        setIsListeningClientVoice(false);
      };

      recognition.onerror = () => setIsListeningClientVoice(false);
      recognition.onend = () => setIsListeningClientVoice(false);

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListeningClientVoice(false);
    }
  };

  const startRecordingVoiceSnippet = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
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

      const countdown = setInterval(() => {
        setAudioTimer((prev) => {
          if (prev <= 1) {
            clearInterval(countdown);
            stopRecordingVoiceSnippet();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Mic error:", err);
      alert("Microphone permission denied for voice onboarding.");
    }
  };

  const stopRecordingVoiceSnippet = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
    setIsRecordingAudio(false);
  };

  const handleCompleteWorkerReg = (e: React.FormEvent) => {
    e.preventDefault();

    const createdWorker = saveWorker({
      name: regName || "Verified Professional",
      occupation: regOccupation || "Skilled Technician",
      category: "plumber",
      experience: regExperience || "5 Years",
      location: regLocation || "Chandigarh Central",
      rating: 4.9,
      jobsCompleted: 12,
      trustScore: 95,
      badge: "Verified",
      phone: "9876543299",
      avatarUrl: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80",
      avatar: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80",
      hourlyRate: 350,
      bio: `Professional ${regOccupation} with ${regExperience || "5 Years"} experience. Sahayak Verified.`,
      audioSnippetUrl: workerAudioSnippetUrl,
      skills: [regOccupation, "Doorstep Services"],
      isAvailable: true,
      trustBreakdown: {
        identityVerified: true,
        ratingHigh: true,
        jobsThreshold: true,
        onTimeRecord: true,
      },
    });

    const workerSession: AuthSessionUser = {
      id: createdWorker.id,
      name: createdWorker.name,
      phone: createdWorker.phone,
      role: "worker",
      token: "worker-session-token",
    };

    localStorage.setItem("skilllink_user", JSON.stringify(workerSession));
    setCurrentUser(workerSession);
    setActiveSection("MARKETPLACE");
  };
  const handleTriggerSOS = () => {
    setSosSearching(true);
    setSosCountdown(15);
    setSosMatchedWorker(null);
    setSosConfirmed(false);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);
    setAuthNotice(null);

    if (!clientName.trim()) {
      setOtpError("Please enter your name");
      return;
    }
    if (phoneNum.length < 10) {
      setOtpError("Please enter a valid 10-digit mobile number");
      return;
    }

    setIsSendingOtp(true);
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
    if (typeof window !== "undefined") {
      localStorage.removeItem("skilllink_user");
      localStorage.removeItem("skilllink_user_session_v2");
      sessionStorage.clear();
    }
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
      }
      setIsVoiceSearching(false);
    };

    recognition.onerror = () => setIsVoiceSearching(false);
    recognition.onend = () => setIsVoiceSearching(false);

    recognition.start();
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

  const aiRankedMatches = rankWorkersWithAI(workers, searchQuery, selectedCategory);
  const filteredWorkersWithAI = aiRankedMatches.filter(({ worker }) => {
    const matchesCategory =
      selectedCategory === "All" ||
      worker.category === selectedCategory ||
      worker.occupation.toLowerCase().includes(selectedCategory.toLowerCase());

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      worker.name.toLowerCase().includes(q) ||
      worker.occupation.toLowerCase().includes(q) ||
      worker.location.toLowerCase().includes(q) ||
      (worker.skills || []).some((s) => s.toLowerCase().includes(q));

    return matchesCategory && matchesSearch;
  });

  const filteredWorkers = filteredWorkersWithAI.map((item) => item.worker);

  const handleBookingSuccess = (bookingId: string) => {
    setBookingWorker(null);
    setToastMessage(`Booking #${bookingId} confirmed! Check Dashboard.`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  if (!hasMounted || isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        <p className="text-xs font-medium text-slate-500">Loading Skill-Link...</p>
      </div>
    );
  }

  // ==========================================
  // VIEW 1: CLEAN LIGHT SIGN-IN GATEWAY (FIRST TIME VISITORS & LOGGED OUT USERS)
  // ==========================================
  if (!currentUser) {
    return (
      <div className="w-full max-w-lg mx-auto my-6 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 text-slate-900">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto shadow-sm">
            <Zap className="w-6 h-6" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Welcome to Skill-Link
            </h1>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-0.5">
              AI-Powered Cooperative Platform for Household &amp; Community Services (Ministry of Cooperation • SIH26089).
            </p>
          </div>
        </div>

        {/* STEP 1: CHOICE SCREEN (Client vs Worker vs Admin) */}
        {authFlowStep === "CHOICE" && (
          <div className="space-y-3 pt-2">
            <button
              onClick={() => setAuthFlowStep("CLIENT_AUTH")}
              className="w-full p-4 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 transition-all text-left group shadow-sm flex items-center justify-between"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    I am a Customer
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      Book Pro
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Book plumbers, electricians, carpenters, caregivers, and cleaning.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all shrink-0" />
            </button>

            <button
              onClick={() => setAuthFlowStep("WORKER_AUTH")}
              className="w-full p-4 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 transition-all text-left group shadow-sm flex items-center justify-between"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold shrink-0">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    I am a Skilled Technician
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Worker Portal
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live dispatch jobs, 0% commission, and Cooperative Welfare Passbook.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all shrink-0" />
            </button>

            <button
              onClick={() => {
                const adminUser: AuthSessionUser = {
                  id: "admin-coop",
                  name: "Cooperative Federation Officer",
                  role: "admin",
                  token: "admin-token",
                };
                localStorage.setItem("skilllink_user", JSON.stringify(adminUser));
                setCurrentUser(adminUser);
                setActiveSection("COOPERATIVE_ADMIN");
              }}
              className="w-full p-4 rounded-xl bg-purple-50/50 hover:bg-purple-50 border border-purple-200 transition-all text-left group shadow-sm flex items-center justify-between"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-700 border border-purple-200 flex items-center justify-center font-bold shrink-0">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    Cooperative Society Admin
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                      Federation
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Worker KYC verification, 3% welfare fund audits, and AI seasonal forecasting.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all shrink-0" />
            </button>

            <div className="pt-2 text-center">
              <button
                onClick={handleGuestLogin}
                className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-1.5 mx-auto"
              >
                <Compass className="w-4 h-4" /> Skip &amp; Explore Marketplace as Guest →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2A: CLIENT AUTH (WITH PHONE OTP & PASSWORD LOGIN TOGGLE) */}
        {authFlowStep === "CLIENT_AUTH" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" /> Customer Sign-In
              </h2>
              <button
                onClick={() => setAuthFlowStep("CHOICE")}
                className="text-xs font-semibold text-slate-500 hover:text-blue-600"
              >
                Change Role
              </button>
            </div>

            {/* Auth Method Toggle (Phone OTP vs Password Credential) */}
            <div className="flex p-1 bg-slate-100 border border-slate-200 rounded-xl">
              <button
                type="button"
                onClick={() => setAuthMethod("OTP")}
                className={`w-1/2 py-2 text-xs font-bold rounded-lg transition-all ${
                  authMethod === "OTP"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Phone className="w-3.5 h-3.5 inline mr-1 text-blue-600" /> Phone 6-Digit OTP
              </button>
              <button
                type="button"
                onClick={() => setAuthMethod("PASSWORD")}
                className={`w-1/2 py-2 text-xs font-bold rounded-lg transition-all ${
                  authMethod === "PASSWORD"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Lock className="w-3.5 h-3.5 inline mr-1 text-blue-600" /> Email &amp; Password
              </button>
            </div>

            {/* MODE A: PHONE OTP AUTH */}
            {authMethod === "OTP" && (
              <>
                {otpStep === "PHONE" ? (
                  <form onSubmit={handleSendOtp} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Your Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="e.g. Ramanand Sharma"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-500 focus:bg-white min-h-[44px]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Enter 10-Digit Mobile Number
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-3 text-xs font-bold text-slate-500">+91</span>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={phoneNum}
                          onChange={(e) => setPhoneNum(e.target.value.replace(/\D/g, ""))}
                          placeholder="9876543210"
                          className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-500 focus:bg-white min-h-[44px]"
                        />
                      </div>
                    </div>

                    {/* Voice AI Service Prompt Assistant */}
                    <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Service Needed (Optional)
                        </label>
                        <button
                          type="button"
                          onClick={handleStartClientVoicePrompt}
                          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all ${
                            isListeningClientVoice
                              ? "bg-rose-600 text-white animate-pulse"
                              : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm"
                          }`}
                        >
                          <Mic className={`w-3.5 h-3.5 ${isListeningClientVoice ? "text-white" : "text-blue-600"}`} />
                          {isListeningClientVoice ? "Listening..." : "Speak Need"}
                        </button>
                      </div>

                      <input
                        type="text"
                        value={clientServiceNeed}
                        onChange={(e) => setClientServiceNeed(e.target.value)}
                        placeholder="e.g. 'Plumber for tap leak' or speak..."
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-500 min-h-[40px]"
                      />
                    </div>

                    {otpError && <p className="text-xs font-bold text-rose-600">{otpError}</p>}

                    <button
                      type="submit"
                      disabled={isSendingOtp}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 min-h-[44px]"
                    >
                      <span>{isSendingOtp ? "Sending OTP..." : "Send 6-Digit Verification Code"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Enter 6-Digit OTP Code
                        </label>
                        <span className="text-xs font-bold text-blue-600">
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
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center tracking-widest text-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white min-h-[48px]"
                      />

                      {authNotice && (
                        <p className="text-[11px] font-semibold text-emerald-700 mt-1">{authNotice}</p>
                      )}
                      {otpError && (
                        <p className="text-xs font-bold text-rose-600 mt-1">{otpError}</p>
                      )}
                    </div>

                    {/* 60-Second Resend Countdown */}
                    <div className="flex items-center justify-between text-xs font-medium text-slate-500 pt-1">
                      <span>Resend OTP timer:</span>
                      {resendTimer > 0 ? (
                        <span className="text-blue-600 font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 animate-spin" /> {resendTimer}s
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          className="text-blue-600 hover:underline font-bold flex items-center gap-1"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Resend OTP Code
                        </button>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setOtpStep("PHONE")}
                        className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="w-2/3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                      >
                        Verify &amp; Open Marketplace
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}

            {/* MODE B: PASSWORD CREDENTIAL AUTH */}
            {authMethod === "PASSWORD" && (
              <form onSubmit={handlePasswordLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-500 focus:bg-white min-h-[44px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={clientPassword}
                      onChange={(e) => setClientPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-500 focus:bg-white min-h-[44px]"
                    />
                  </div>
                </div>

                {otpError && <p className="text-xs font-bold text-rose-600">{otpError}</p>}

                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Log In with Password</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        )}

        {/* STEP 2B: WORKER SAHAYAK FEMALE VOICE AI ONBOARDING */}
        {authFlowStep === "WORKER_AUTH" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-600 fill-rose-600" /> Sahayak Voice AI Registration
              </h2>
              <button
                onClick={() => setAuthFlowStep("CHOICE")}
                className="text-xs font-semibold text-slate-500 hover:text-blue-600"
              >
                Change Role
              </button>
            </div>

            {/* Visualizer Voice Card */}
            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-3">
              {voiceStep === 0 ? (
                <button
                  onClick={handleStartWorkerVoiceID}
                  className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform cursor-pointer"
                >
                  <Mic className="w-6 h-6 text-white" />
                  <span className="text-[9px] uppercase font-bold">Start Voice</span>
                </button>
              ) : (
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-md transition-all ${
                    isListeningWorkerVoice
                      ? "bg-emerald-600 animate-pulse"
                      : isSpeaking
                      ? "bg-blue-600 animate-pulse"
                      : "bg-slate-700"
                  }`}
                >
                  {isListeningWorkerVoice ? (
                    <Radio className="w-6 h-6 animate-ping text-white" />
                  ) : isSpeaking ? (
                    <Volume2 className="w-6 h-6 animate-pulse" />
                  ) : (
                    <MicOff className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              )}

              {aiPromptText && (
                <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs font-medium w-full text-center">
                  {isSpeaking ? (
                    <span className="text-blue-700 font-bold block">👩‍💼 Sahayak Assistant Speaking...</span>
                  ) : isListeningWorkerVoice ? (
                    <span className="text-emerald-700 font-bold block">🎙️ Listening... Bolyein ab</span>
                  ) : (
                    <span className="text-slate-500 block">Sahayak AI Ready</span>
                  )}
                  <span className="italic text-slate-800 block text-xs mt-0.5">&ldquo;{aiPromptText}&rdquo;</span>
                </div>
              )}
            </div>

            {/* Worker Form Inputs (Name, Occupation, Experience, Location) */}
            <form onSubmit={handleCompleteWorkerReg} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className={`p-2.5 rounded-xl border ${voiceStep === 1 ? "ring-2 ring-blue-500 bg-blue-50/50" : "bg-slate-50 border-slate-200"}`}>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Ramanand Sharma"
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-500 min-h-[38px]"
                  />
                </div>

                <div className={`p-2.5 rounded-xl border ${voiceStep === 2 ? "ring-2 ring-blue-500 bg-blue-50/50" : "bg-slate-50 border-slate-200"}`}>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Occupation / Skill</label>
                  <input
                    type="text"
                    required
                    value={regOccupation}
                    onChange={(e) => setRegOccupation(e.target.value)}
                    placeholder="e.g. Master Plumber"
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-500 min-h-[38px]"
                  />
                </div>

                <div className={`p-2.5 rounded-xl border ${voiceStep === 3 ? "ring-2 ring-blue-500 bg-blue-50/50" : "bg-slate-50 border-slate-200"}`}>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Work Experience</label>
                  <input
                    type="text"
                    required
                    value={regExperience}
                    onChange={(e) => setRegExperience(e.target.value)}
                    placeholder="e.g. 6 Years"
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-500 min-h-[38px]"
                  />
                </div>

                <div className={`p-2.5 rounded-xl border ${voiceStep === 4 ? "ring-2 ring-blue-500 bg-blue-50/50" : "bg-slate-50 border-slate-200"}`}>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">City / Area Location</label>
                  <input
                    type="text"
                    required
                    value={regLocation}
                    onChange={(e) => setRegLocation(e.target.value)}
                    placeholder="e.g. Chandigarh Central"
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-500 min-h-[38px]"
                  />
                </div>
              </div>

              {/* 10s Voice Intro Snippet Recorder */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">10s Audio Intro Greeting</span>
                {!isRecordingAudio ? (
                  <button
                    type="button"
                    onClick={startRecordingVoiceSnippet}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-sm"
                  >
                    <Mic className="w-3.5 h-3.5 inline mr-1" /> Record Intro
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopRecordingVoiceSnippet}
                    className="px-3 py-1.5 bg-rose-600 text-white font-bold text-[11px] rounded-lg animate-pulse"
                  >
                    Stop ({audioTimer}s)
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 mt-2"
              >
                <span>Create Voice Profile &amp; Register</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW 2: AUTHENTICATED SINGLE-URL APPLICATION ENGINE ON http://localhost:3000
  // ==========================================
  return (
    <div className="w-full space-y-6 pb-20 overflow-x-hidden text-slate-900">
      <Header
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        currentUser={currentUser}
        onLogout={handleLogout}
        currentLanguage={currentLanguage}
        onSelectLanguage={setCurrentLanguage}
        onOpenWelfareModal={() => setWelfareModalOpen(true)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-4 left-4 sm:left-auto sm:max-w-md z-50 bg-emerald-50 text-emerald-800 border border-emerald-300 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* SECTION 1: MARKETPLACE HOME */}
      {activeSection === "MARKETPLACE" && (
        <div className="space-y-6">
          {/* Main Hero Discovery Section */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="max-w-3xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Ministry of Cooperation • Cooperative Gig Platform (SIH26089)
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>Tricity &amp; NCR Cooperatives</span>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    isSupabaseLive
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseLive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                    {isSupabaseLive ? "Supabase Live DB" : "Cooperative Registry"}
                  </span>
                </div>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 leading-tight">
                  Cooperative Gig Services for Households &amp; Communities
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
                  Connecting verified skilled workers associated with Labour Cooperative Societies with households. Zero commercial commission, 100% fair wages, 3% worker welfare safety pool, and AI smart dispatch.
                </p>
              </div>

              {/* Two Core Action CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={() => {
                    setServiceMode("HOME");
                    const el = document.getElementById("services-section");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all flex items-center gap-2"
                >
                  <Wrench className="w-4 h-4" />
                  <span>Find a Professional</span>
                </button>

                <button
                  onClick={() => setSosPriorityDispatchOpen(true)}
                  className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 active:scale-[0.98] text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                  <span>Emergency Roadside SOS</span>
                </button>
              </div>

              {/* Natural Search Input */}
              <div className="relative pt-2 max-w-2xl">
                <div className="flex items-center bg-slate-50 rounded-xl p-1.5 border border-slate-200 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all shadow-sm">
                  <Search className="w-4 h-4 text-slate-400 ml-2.5 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="What do you need help with? (e.g. AC Repair, Plumber, Electrician)..."
                    className="w-full px-2.5 py-1 bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none text-xs sm:text-sm font-medium"
                  />
                  <button
                    onClick={handleVoiceSearch}
                    className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 text-xs transition-all shrink-0 ${
                      isVoiceSearching
                        ? "bg-rose-600 text-white animate-pulse"
                        : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm"
                    }`}
                  >
                    <Mic className={`w-3.5 h-3.5 ${isVoiceSearching ? "text-white" : "text-blue-600"}`} />
                    <span className="hidden sm:inline">
                      {isVoiceSearching ? "Listening..." : "Speak"}
                    </span>
                  </button>
                </div>

                {/* Quick Search Badges */}
                <div className="flex items-center gap-1.5 mt-2.5 text-xs text-slate-500 overflow-x-auto pb-0.5">
                  <span className="font-semibold text-slate-600 text-[11px] shrink-0">Popular:</span>
                  <button onClick={() => { setSelectedCategory("ac"); setSearchQuery(""); }} className="px-2.5 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-[11px] font-medium text-slate-700 transition-colors">AC Repair</button>
                  <button onClick={() => { setSelectedCategory("electrician"); setSearchQuery(""); }} className="px-2.5 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-[11px] font-medium text-slate-700 transition-colors">Electrician</button>
                  <button onClick={() => { setSelectedCategory("plumber"); setSearchQuery(""); }} className="px-2.5 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-[11px] font-medium text-slate-700 transition-colors">Plumber</button>
                  <button onClick={() => { setServiceMode("ON_ROAD"); setSearchQuery(""); }} className="px-2.5 py-0.5 rounded-md bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-[11px] font-medium text-slate-700 transition-colors">Car Mechanic</button>
                  <button onClick={() => { setSelectedCategory("cleaning"); setSearchQuery(""); }} className="px-2.5 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-[11px] font-medium text-slate-700 transition-colors">Cleaning</button>
                </div>
              </div>
            </div>

            {/* Factual Trust Indicators Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 text-xs text-slate-700">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">Verified Professionals</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-semibold">Fixed ₹149 Inspection</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-semibold">15-Min Dispatch Target</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-semibold">Location-Aware Assistance</span>
              </div>
            </div>
          </section>

          {/* Segmented Mode Selector */}
          <div id="services-section" className="flex p-1 bg-slate-100/90 rounded-xl border border-slate-200 max-w-md mx-auto shadow-sm">
            <button
              onClick={() => setServiceMode("HOME")}
              className={`w-1/2 py-2 px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                serviceMode === "HOME"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <HomeIcon className="w-4 h-4 text-blue-600" /> Doorstep Services
            </button>
            <button
              onClick={() => setServiceMode("ON_ROAD")}
              className={`w-1/2 py-2 px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                serviceMode === "ON_ROAD"
                  ? "bg-rose-50 text-rose-700 border border-rose-200 font-bold"
                  : "text-rose-600 hover:text-rose-700"
              }`}
            >
              <Car className="w-4 h-4 text-rose-600" /> Roadside SOS (15m Target)
            </button>
          </div>

          {/* MODE A: HOME SERVICES */}
          {serviceMode === "HOME" && (
            <>
              {/* Category Chips Bar */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Filter className="w-4 h-4 text-blue-600" />
                    Popular Service Categories
                  </h2>
                  <span className="text-xs text-slate-500 font-medium">
                    {filteredWorkers.length} Verified Available
                  </span>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {categories.map((cat) => {
                    const isSelected = selectedCategory === cat.value;
                    return (
                      <button
                        key={cat.value}
                        onClick={() => setSelectedCategory(cat.value)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center gap-2 border ${
                          isSelected
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Verified Worker Grid */}
              <section className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
                  {filteredWorkersWithAI.map(({ worker, matchScore, matchReason }) => (
                    <WorkerCard
                      key={worker.id}
                      worker={worker}
                      aiMatchScore={matchScore}
                      aiMatchReason={matchReason}
                      onOpenTrustModal={(w) => setTrustWorker(w)}
                      onBookService={(w) => setBookingWorker(w)}
                    />
                  ))}
                </div>

                {filteredWorkers.length === 0 && (
                  <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                    <Wrench className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-900">No professionals match your filter</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                      Try searching for plumbers, electricians, or selecting &quot;All&quot; categories to see verified technicians.
                    </p>
                    <button
                      onClick={() => {
                        setSelectedCategory("All");
                        setSearchQuery("");
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
                    >
                      Reset Filters
                    </button>
                  </div>
                )}
              </section>

              {/* How Skill-Link Works Section */}
              <section className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 mt-12">
                <div className="text-center max-w-xl mx-auto">
                  <h2 className="text-xl font-bold text-slate-900">How Skill-Link Works</h2>
                  <p className="text-xs text-slate-500 mt-1">Simple, transparent, and verified home service delivery in 3 steps.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">1</div>
                    <h3 className="text-sm font-bold text-slate-900">1. Select Service & Pro</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">Choose from verified local plumbers, electricians, and mechanics with transparent ratings and reviews.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">2</div>
                    <h3 className="text-sm font-bold text-slate-900">2. Doorstep Inspection</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">The technician arrives at your location with a standard ₹149 inspection visit fee with zero surprise charges.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">3</div>
                    <h3 className="text-sm font-bold text-slate-900">3. Escrow OTP Release</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">Share your completion OTP only after the service is finished to your complete satisfaction.</p>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* MODE B: ON-ROAD EMERGENCY BREAKDOWN ASSIST */}
          {serviceMode === "ON_ROAD" && (
            <div className="space-y-6">
              {/* Geolocation GPS Active Indicator Card */}
              <div className="bg-white border border-emerald-200 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <div>
                    <span className="text-[10px] font-bold uppercase text-emerald-700 tracking-wider block flex items-center gap-1">
                      <Navigation className="w-3 h-3 text-emerald-600" /> GPS Geolocation Active
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-900">
                      {gpsStatus.isLoading ? "Acquiring GPS coordinates..." : gpsStatus.address}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                    15-Min Arrival Guarantee
                  </span>
                </div>
              </div>

              {/* Quick SOS Priority Button Banner */}
              <div className="bg-white border border-rose-200 p-6 sm:p-8 rounded-2xl text-center space-y-4 shadow-sm">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center justify-center gap-2">
                    <Car className="w-6 h-6 text-rose-600" /> Emergency Roadside Breakdown Assistance
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto mt-1">
                    Highway & City roadside rescue: Punctures, Battery Jumpstarts, Towing, Mechanical Repair & Emergency Fuel.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setSosPriorityDispatchOpen(true);
                    setDispatchCountdown(15);
                    setDispatchedMechanic(null);
                  }}
                  className="px-6 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold tracking-wide shadow-sm active:scale-95 transition-all mx-auto flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>Find Nearest Mechanic (15-Min Priority Dispatch)</span>
                </button>
              </div>

              {/* On-Road Breakdown Category Chips */}
              <section className="space-y-3">
                <h3 className="text-xs font-bold uppercase text-slate-700 tracking-wider flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-blue-600" /> On-Road Emergency Services
                </h3>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {onRoadCategories.map((cat) => {
                    const isSelected = onRoadCategory === cat.value;
                    return (
                      <button
                        key={cat.value}
                        onClick={() => setOnRoadCategory(cat.value)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center gap-2 border ${
                          isSelected
                            ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
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
                  <h3 className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                    Nearby Garages & Mobile Mechanics ({mechanics.filter(m => onRoadCategory === "All" || m.category === onRoadCategory).length})
                  </h3>
                  <span className="text-[11px] text-emerald-700 font-semibold">Distance Sorted by GPS</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mechanics
                    .filter((m) => onRoadCategory === "All" || m.category === onRoadCategory)
                    .map((m) => (
                      <div
                        key={m.id}
                        className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all"
                      >
                        <div className="space-y-3.5">
                          {/* Top Row: Distance & 24/7 Badge */}
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-blue-600" /> {m.distanceKm} km away
                            </span>

                            {m.is24x7 && (
                              <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                                ⚡ 24/7 Available
                              </span>
                            )}
                          </div>

                          {/* Info Row */}
                          <div className="flex items-start gap-3.5">
                            <img
                              src={m.avatarUrl}
                              alt={m.name}
                              className="w-14 h-14 rounded-xl object-cover border border-slate-200 shadow-sm shrink-0"
                            />
                            <div className="min-w-0">
                              <h4 className="text-base font-bold text-slate-900 truncate flex items-center gap-1">
                                {m.name}
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              </h4>
                              <p className="text-xs text-blue-600 font-semibold">Owner: {m.ownerName}</p>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">{m.location}</p>
                            </div>
                          </div>

                          {/* Rating & Fee Row */}
                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1 font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                              <span>{m.rating.toFixed(1)}</span>
                              <span className="text-slate-500 font-normal">({m.reviewsCount})</span>
                            </div>

                            <div className="font-bold text-slate-900">
                              Visiting Fee: ₹{m.visitingFee}
                            </div>
                          </div>

                          {/* Services Chips */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {m.servicesOffered.map((srv, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-medium text-slate-600 border border-slate-200"
                              >
                                {srv}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Direct Action Buttons */}
                        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                          <a
                            href={`tel:${m.phone}`}
                            className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                          >
                            <PhoneCall className="w-4 h-4" /> Call Pro
                          </a>

                          <button
                            onClick={() => {
                              speakFemaleHindiText(`Connecting to Voice Guide for roadside assistance with ${m.name}.`);
                            }}
                            className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                          >
                            <Volume2 className="w-4 h-4 text-blue-600" /> Voice Assist
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </section>

              {/* 15-Min Priority Dispatch Countdown Modal */}
              {sosPriorityDispatchOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                  <div className="relative w-full max-w-md bg-white border border-rose-200 rounded-2xl p-6 shadow-xl text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
                      <Clock className="w-8 h-8 animate-spin" />
                    </div>

                    {!dispatchedMechanic ? (
                      <>
                        <h3 className="text-lg font-bold text-slate-900">Searching 15-Min Priority Mechanics...</h3>
                        <p className="text-xs text-slate-500">
                          Locating closest verified garage within {gpsStatus.address}...
                        </p>
                        <div className="text-4xl font-bold text-rose-600 font-mono tracking-wider">{dispatchCountdown}s</div>
                      </>
                    ) : (
                      <>
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Mechanic Dispatched & Locked
                        </span>
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-1.5">
                          <h4 className="text-sm font-bold text-slate-900">{dispatchedMechanic.name}</h4>
                          <p className="text-xs text-slate-600">Contact: {dispatchedMechanic.phone}</p>
                          <p className="text-xs text-blue-600 font-semibold">Estimated Arrival: {dispatchedMechanic.estimatedArrivalMins} Minutes</p>
                        </div>
                        <div className="pt-2">
                          <a
                            href={`tel:${dispatchedMechanic.phone}`}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <PhoneCall className="w-4 h-4" /> Call Mechanic Directly
                          </a>
                        </div>
                      </>
                    )}

                    <button
                      onClick={() => setSosPriorityDispatchOpen(false)}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-900 pt-2"
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

      {/* SECTION: WORKER PORTAL (Cooperative Member Application) */}
      {activeSection === "WORKER_PORTAL" && (
        <div className="space-y-6">
          <WorkerPortal onOpenWelfareModal={() => setWelfareModalOpen(true)} />
        </div>
      )}

      {/* SECTION: COOPERATIVE ADMIN DASHBOARD (Ministry & Federation) */}
      {activeSection === "COOPERATIVE_ADMIN" && (
        <div className="space-y-6">
          <CooperativeAdminDashboard />
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
          <div className="bg-white border border-rose-200 p-6 sm:p-8 rounded-2xl shadow-sm space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              24/7 SOS Emergency Priority Dispatch
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              QuickFix Utility Breakdown SOS
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Immediate 15-minute priority dispatch for critical utility failures, pipe bursts, short circuits, or gas leakages.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold uppercase text-slate-700 tracking-wider">
              Select Emergency Breakdown Type
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {["Pipe Burst / Major Leakage", "Main Power Trip / Wiring Burn", "Gas Leakage / Heater Failure", "Lockout / Door Fitting"].map((lbl) => (
                <button
                  key={lbl}
                  onClick={() => setSosEmergencyType(lbl)}
                  className={`p-3.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                    sosEmergencyType === lbl
                      ? "bg-rose-50 border-rose-300 text-rose-700 font-bold shadow-sm"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
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
                  className="w-32 h-32 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-lg border-4 border-rose-100 mx-auto flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform cursor-pointer"
                >
                  <Zap className="w-8 h-8" />
                  <span className="text-xs uppercase tracking-wider font-bold">DISPATCH SOS</span>
                </button>
              </div>
            )}

            {sosSearching && (
              <div className="mt-8 text-center space-y-4 py-8 bg-slate-50 rounded-xl border border-rose-200">
                <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
                  <Clock className="w-8 h-8 animate-spin" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Searching Nearby Technicians...</h3>
                <div className="text-3xl font-bold text-rose-600 font-mono">{sosCountdown}s</div>
              </div>
            )}

            {sosMatchedWorker && !sosConfirmed && (
              <div className="mt-6 p-5 rounded-2xl bg-white border border-blue-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> SOS Priority Match Found
                  </span>
                  <span className="text-xs font-bold text-blue-600">10 Min ETA</span>
                </div>

                <div className="flex items-center gap-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <img src={sosMatchedWorker.avatarUrl || sosMatchedWorker.avatar} alt={sosMatchedWorker.name} className="w-14 h-14 rounded-xl object-cover border border-slate-200" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{sosMatchedWorker.name}</h3>
                    <p className="text-xs font-semibold text-blue-600">{sosMatchedWorker.occupation}</p>
                    <p className="text-xs text-slate-500">{sosMatchedWorker.location}</p>
                  </div>
                </div>

                <form onSubmit={handleConfirmSOSBooking} className="space-y-3">
                  <input
                    type="text"
                    required
                    value={sosClientName}
                    onChange={(e) => setSosClientName(e.target.value)}
                    placeholder="Your Full Name"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                  <input
                    type="tel"
                    required
                    value={sosClientPhone}
                    onChange={(e) => setSosClientPhone(e.target.value)}
                    placeholder="Mobile Number"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                  <button type="submit" className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all">
                    Confirm SOS Dispatch
                  </button>
                </form>
              </div>
            )}

            {sosConfirmed && sosMatchedWorker && (
              <div className="mt-6 text-center py-6 space-y-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Technician Dispatched!</h3>
                <p className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-900">{sosMatchedWorker.name}</span> is en route. Phone: <span className="font-semibold text-slate-900">{sosMatchedWorker.phone}</span>.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 5: PROFILE DASHBOARD */}
      {activeSection === "PROFILE" && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                Logged In Session
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                {currentUser?.name || "Ramanand"}
              </h3>
              <p className="text-xs text-slate-500">
                Role: <span className="font-semibold text-slate-700 capitalize">{currentUser?.role || "Customer"}</span> • Phone: {currentUser?.phone || "+91 98765 43210"}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 self-start sm:self-auto"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out / Login as Different User</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600" />
              Registered Marketplace Professionals ({workers.length})
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {workers.map((w) => (
                <div key={w.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={w.avatarUrl || w.avatar} alt={w.name} className="w-10 h-10 rounded-lg object-cover border border-slate-200" />
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1">{w.name} <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /></h3>
                      <p className="text-xs text-blue-600 font-semibold">{w.occupation}</p>
                      <p className="text-[10px] text-slate-500">{w.location}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Customer Dispute Resolution / Support Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-rose-600" />
              Service Guarantee &amp; Dispute Support
            </h2>
            <p className="text-xs text-slate-500">
              Experienced an issue with pricing, service quality, or punctuality? Our resolution team investigates within 2 hours.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => alert("Dispute Ticket #DISP-9842 created. Our support team will call you within 30 minutes.")}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all"
              >
                Report Punctuality / No-Show
              </button>
              <button
                onClick={() => alert("Price Dispute Ticket #DISP-9843 created. Verified bill will be audited.")}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all"
              >
                Price Adjustment Request
              </button>
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

      {/* 5-Step Simplified Emergency Roadside SOS Modal */}
      {sosPriorityDispatchOpen && (
        <SOSDispatchModal
          isOpen={sosPriorityDispatchOpen}
          onClose={() => setSosPriorityDispatchOpen(false)}
          customerName={currentUser?.name || "Ramanand Sharma"}
          customerPhone={currentUser?.phone || "+91 98765 43210"}
          lat={gpsStatus.lat ?? undefined}
          lng={gpsStatus.lng ?? undefined}
          pickupAddress={gpsStatus.address}
        />
      )}

      {/* Worker Welfare & Social Security Modal */}
      {welfareModalOpen && (
        <WorkerWelfareModal
          isOpen={welfareModalOpen}
          onClose={() => setWelfareModalOpen(false)}
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

"use client";

import React, { useState, useRef } from "react";
import { saveWorker } from "../lib/storage";
import { speakFemaleHindiText } from "../lib/voice";
import { Mic, MicOff, Volume2, CheckCircle2, Sparkles, User, Briefcase, MapPin, Award, Square, ArrowRight, Heart } from "lucide-react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function SahayakVoice() {
  const router = useRouter();

  const [step, setStep] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [aiSpeechText, setAiSpeechText] = useState("");

  // Form Fields
  const [name, setName] = useState("");
  const [occupation, setOccupation] = useState("");
  const [experience, setExperience] = useState("");
  const [location, setLocation] = useState("");
  const [audioSnippetUrl, setAudioSnippetUrl] = useState<string | undefined>(undefined);

  // Audio Snippet Recording state
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioTimer, setAudioTimer] = useState(10);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const recognitionRef = useRef<any>(null);

  const questions = [
    {
      step: 1,
      hiPrompt: "Namaste! Sahayak AI me aapka swagat hai. Aapka shubh naam kya hai?",
      enLabel: "What is your full name?",
      field: "name",
    },
    {
      step: 2,
      hiPrompt: "Aap kaunsa kaam karte hain? Jaise Plumber, Electrician, Salon, ya Mason?",
      enLabel: "What is your main occupation?",
      field: "occupation",
    },
    {
      step: 3,
      hiPrompt: "Aapka kitne saal ka kaam karne ka anubhav hai?",
      enLabel: "How many years of experience do you have?",
      field: "experience",
    },
    {
      step: 4,
      hiPrompt: "Aap abhi kis city ya area me rehte hain?",
      enLabel: "Which city or area do you live in?",
      field: "location",
    },
  ];

  const speakPrompt = (text: string, onEndCallback?: () => void) => {
    setAiSpeechText(text);
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

  const startRecognition = (stepNum: number) => {
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

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      let currentTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      const cleanVal = currentTranscript.trim().replace(/\.$/, "");

      if (stepNum === 1) setName(cleanVal);
      else if (stepNum === 2) setOccupation(cleanVal);
      else if (stepNum === 3) setExperience(cleanVal + " Years");
      else if (stepNum === 4) setLocation(cleanVal);
    };

    recognition.onend = () => {
      setIsListening(false);
      setTimeout(() => advanceToNextStep(stepNum), 1200);
    };

    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {}
  };

  const advanceToNextStep = (currentStepNum: number) => {
    if (currentStepNum < 4) {
      const nextStepNum = currentStepNum + 1;
      setStep(nextStepNum);
      const q = questions.find((item) => item.step === nextStepNum);
      if (q) {
        speakPrompt(q.hiPrompt, () => startRecognition(nextStepNum));
      }
    } else if (currentStepNum === 4) {
      setStep(5);
      speakPrompt("Bahut ache! Aapka profile details mil gaya hai. Kripya apna 10 second ka audio voice intro record kijiye.", () => {});
    }
  };

  const handleStartSahayakFlow = () => {
    setStep(1);
    const q1 = questions[0];
    speakPrompt(q1.hiPrompt, () => startRecognition(1));
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
        reader.onloadend = () => setAudioSnippetUrl(reader.result as string);
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

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !occupation) {
      alert("Please fill in your name and occupation.");
      return;
    }

    const createdWorker = saveWorker({
      name: name || "Verified Worker",
      occupation: occupation || "General Technician",
      category: "plumber",
      experience: experience || "4 Years",
      location: location || "Chandigarh Central",
      rating: 4.9,
      jobsCompleted: 14,
      trustScore: 96,
      badge: "Verified",
      phone: "9876543299",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      hourlyRate: 350,
      bio: `Professional ${occupation} with ${experience || "4 Years"} experience. Sahayak Neural Female Voice AI Verified Worker.`,
      audioSnippetUrl,
      skills: [occupation, "Home Maintenance"],
      isAvailable: true,
      trustBreakdown: {
        identityVerified: true,
        ratingHigh: true,
        jobsThreshold: true,
        onTimeRecord: true,
      },
    });

    setStep(6);
    speakPrompt("Aapka bahut dhanyawad! Aapka Sahayak profile successfully ban gaya hai. Subh kaam ke liye aage badhein!", () => {
      setTimeout(() => router.push("/"), 2000);
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      {/* Banner */}
      <div className="glass-panel-3d p-6 sm:p-8 text-white rounded-3xl relative overflow-hidden border border-indigo-500/40 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
              ChatGPT-Style Sahayak Female Voice AI
            </div>
            <h1 className="text-3xl font-black text-white">
              Worker Voice Onboarding
            </h1>
            <p className="text-xs text-slate-300 max-w-md">
              Speak in natural Hindi. Neural Female Voice AI listens with human-like cadence and populates your profile automatically.
            </p>
          </div>

          <div className="flex flex-col items-center">
            {step === 0 ? (
              <button
                onClick={handleStartSahayakFlow}
                className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-600 via-emerald-400 to-cyan-300 text-slate-950 font-black shadow-[0_0_35px_rgba(16,185,129,0.7)] flex flex-col items-center justify-center gap-1 hover:scale-105 active:scale-95 transition-transform border-2 border-white cursor-pointer"
              >
                <Mic className="w-8 h-8 text-slate-950 animate-bounce" />
                <span className="text-[10px] uppercase font-black">Start Sahayak</span>
              </button>
            ) : (
              <div className="flex flex-col items-center">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center text-white border-2 border-white shadow-2xl transition-all ${
                    isListening
                      ? "bg-emerald-500 animate-pulse shadow-glow-emerald"
                      : isSpeaking
                      ? "bg-indigo-600 animate-pulse shadow-glow-indigo"
                      : "bg-slate-800"
                  }`}
                >
                  {isListening ? (
                    <Mic className="w-8 h-8 animate-ping" />
                  ) : isSpeaking ? (
                    <Volume2 className="w-8 h-8 animate-pulse text-cyan-300" />
                  ) : (
                    <MicOff className="w-8 h-8" />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {aiSpeechText && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 text-xs font-semibold flex items-center gap-3 text-white">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
            👩‍💼
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-cyan-300">Sahayak Neural Voice AI</span>
            <p className="text-sm font-semibold text-slate-200 italic mt-0.5">&ldquo;{aiSpeechText}&rdquo;</p>
          </div>
        </div>
      )}

      <div className="glass-panel-3d p-6 sm:p-8 space-y-6 border border-white/15">
        <h2 className="text-lg font-black text-white flex items-center justify-between">
          <span>Worker Profile Registration</span>
          <span className="text-xs font-bold text-cyan-300 bg-indigo-950 px-3 py-1 rounded-full border border-indigo-500/40">
            {step > 0 ? `Voice Step ${step} of 5` : "Manual or Voice Input"}
          </span>
        </h2>

        <form onSubmit={handleFinalSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className={`p-3.5 rounded-2xl border ${step === 1 ? "ring-2 ring-indigo-500 bg-indigo-950/50" : "bg-slate-950/40 border-white/10"}`}>
              <label className="block text-xs font-black uppercase text-slate-400 mb-1 flex items-center gap-1.5">
                <User className="w-4 h-4 text-indigo-400" /> Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramanand"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-sm font-semibold focus:outline-none min-h-[44px]"
              />
            </div>

            <div className={`p-3.5 rounded-2xl border ${step === 2 ? "ring-2 ring-indigo-500 bg-indigo-950/50" : "bg-slate-950/40 border-white/10"}`}>
              <label className="block text-xs font-black uppercase text-slate-400 mb-1 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-indigo-400" /> Occupation / Skill
              </label>
              <input
                type="text"
                required
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="e.g. Master Plumber"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-sm font-semibold focus:outline-none min-h-[44px]"
              />
            </div>

            <div className={`p-3.5 rounded-2xl border ${step === 3 ? "ring-2 ring-indigo-500 bg-indigo-950/50" : "bg-slate-950/40 border-white/10"}`}>
              <label className="block text-xs font-black uppercase text-slate-400 mb-1 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-400" /> Experience
              </label>
              <input
                type="text"
                required
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="e.g. 6 Years"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-sm font-semibold focus:outline-none min-h-[44px]"
              />
            </div>

            <div className={`p-3.5 rounded-2xl border ${step === 4 ? "ring-2 ring-indigo-500 bg-indigo-950/50" : "bg-slate-950/40 border-white/10"}`}>
              <label className="block text-xs font-black uppercase text-slate-400 mb-1 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-400" /> Current City / Area
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Chandigarh Central"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-sm font-semibold focus:outline-none min-h-[44px]"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-emerald-400" /> 10-Second Worker Voice Intro Audio
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Clients listen to your voice intro before booking your services.
                </p>
              </div>
              {audioSnippetUrl && (
                <span className="text-xs font-bold text-emerald-300 bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Recorded
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {!isRecordingAudio ? (
                <button
                  type="button"
                  onClick={startRecordingVoiceSnippet}
                  className="px-4 py-2.5 btn-3d-emerald-shine text-xs font-black flex items-center gap-1.5 min-h-[40px]"
                >
                  <Mic className="w-4 h-4" /> Record 10s Intro
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecordingVoiceSnippet}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-md animate-pulse flex items-center gap-1.5 min-h-[40px]"
                >
                  <Square className="w-4 h-4" /> Stop Recording ({audioTimer}s)
                </button>
              )}

              {audioSnippetUrl && (
                <audio controls src={audioSnippetUrl} className="h-9 w-full max-w-xs" />
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 btn-3d-emerald-shine text-sm font-black tracking-wide shine-overlay min-h-[48px]"
          >
            Create Sahayak Profile & Publish <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

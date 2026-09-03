"use client";

import React, { useState, useRef } from "react";
import { saveWorker } from "../lib/storage";
import { speakFemaleHindiText } from "../lib/voice";
import { Mic, MicOff, Volume2, CheckCircle2, User, Briefcase, MapPin, Award, ArrowRight, Heart } from "lucide-react";
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
      enLabel: "Which city or area do you reside in?",
      field: "location",
    },
  ];

  const speakPrompt = (text: string, onEnd?: () => void) => {
    setIsSpeaking(true);
    setAiSpeechText(text);
    speakFemaleHindiText(text, () => {
      setIsSpeaking(false);
      if (onEnd) onEnd();
    });
  };

  const startListeningForField = (field: string) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser does not support Web Speech API. Please type in fields manually.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = "hi-IN";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (field === "name") setName(transcript);
        if (field === "occupation") setOccupation(transcript);
        if (field === "experience") setExperience(transcript);
        if (field === "location") setLocation(transcript);

        setIsListening(false);
        advanceStep(field);
      };

      recognition.onerror = (err: any) => {
        console.error("Speech Rec Error:", err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const handleStartSahayakFlow = () => {
    setStep(1);
    speakPrompt(questions[0].hiPrompt, () => {
      startListeningForField("name");
    });
  };

  const advanceStep = (currentField: string) => {
    if (currentField === "name") {
      setStep(2);
      speakPrompt(questions[1].hiPrompt, () => {
        startListeningForField("occupation");
      });
    } else if (currentField === "occupation") {
      setStep(3);
      speakPrompt(questions[2].hiPrompt, () => {
        startListeningForField("experience");
      });
    } else if (currentField === "experience") {
      setStep(4);
      speakPrompt(questions[3].hiPrompt, () => {
        startListeningForField("location");
      });
    } else if (currentField === "location") {
      setStep(5);
      speakPrompt("Shandar! Aapki sabhi details save ho gayi hain. Kripya apna 10 second ka audio intro record karein ya verify karein.");
    }
  };

  const startRecordingAudioSnippet = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioSnippetUrl(reader.result as string);
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      setIsRecordingAudio(true);
      setAudioTimer(10);

      const countdown = setInterval(() => {
        setAudioTimer((prev) => {
          if (prev <= 1) {
            clearInterval(countdown);
            stopRecordingAudioSnippet();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Mic Error:", err);
      alert("Microphone permission denied. Please allow audio access.");
    }
  };

  const stopRecordingAudioSnippet = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    setIsRecordingAudio(false);
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    saveWorker({
      name: name || "Verified Partner",
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
      bio: `Professional ${occupation} with ${experience || "4 Years"} experience. Sahayak Neural Voice AI Verified Worker.`,
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
    <div className="max-w-4xl mx-auto space-y-6 pb-24 text-slate-900">
      {/* Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
              Sahayak Voice AI Assistant
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Technician Voice Onboarding
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md">
              Speak in natural Hindi or English. Sahayak Voice AI listens and populates your profile automatically.
            </p>
          </div>

          <div className="flex flex-col items-center">
            {step === 0 ? (
              <button
                onClick={handleStartSahayakFlow}
                className="w-20 h-20 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform cursor-pointer"
              >
                <Mic className="w-6 h-6 text-white" />
                <span className="text-[10px] uppercase font-bold">Start Voice</span>
              </button>
            ) : (
              <div className="flex flex-col items-center">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-white border-2 border-slate-200 shadow-md transition-all ${
                    isListening
                      ? "bg-emerald-600 animate-pulse"
                      : isSpeaking
                      ? "bg-blue-600 animate-pulse"
                      : "bg-slate-700"
                  }`}
                >
                  {isListening ? (
                    <Mic className="w-6 h-6 animate-ping" />
                  ) : isSpeaking ? (
                    <Volume2 className="w-6 h-6 animate-pulse" />
                  ) : (
                    <MicOff className="w-6 h-6" />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {aiSpeechText && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium flex items-center gap-3 text-slate-800">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
            👩‍💼
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-blue-700">Sahayak Voice Assistant</span>
            <p className="text-xs font-semibold text-slate-900 italic mt-0.5">&ldquo;{aiSpeechText}&rdquo;</p>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 flex items-center justify-between">
          <span>Technician Profile Information</span>
          <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            {step > 0 ? `Voice Step ${step} of 5` : "Manual or Voice Input"}
          </span>
        </h2>

        <form onSubmit={handleFinalSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-3.5 rounded-xl border ${step === 1 ? "ring-2 ring-blue-500 bg-blue-50/50" : "bg-slate-50 border-slate-200"}`}>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-600" /> Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramanand Sharma"
                className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className={`p-3.5 rounded-xl border ${step === 2 ? "ring-2 ring-blue-500 bg-blue-50/50" : "bg-slate-50 border-slate-200"}`}>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-blue-600" /> Occupation / Skill
              </label>
              <input
                type="text"
                required
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="e.g. Master Plumber"
                className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className={`p-3.5 rounded-xl border ${step === 3 ? "ring-2 ring-blue-500 bg-blue-50/50" : "bg-slate-50 border-slate-200"}`}>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-blue-600" /> Experience
              </label>
              <input
                type="text"
                required
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="e.g. 6 Years"
                className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className={`p-3.5 rounded-xl border ${step === 4 ? "ring-2 ring-blue-500 bg-blue-50/50" : "bg-slate-50 border-slate-200"}`}>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-600" /> City / Area
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Sector 17, Chandigarh"
                className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* 10s Voice Audio Snippet Recorder */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-800 block">10-Second Worker Audio Intro Snippet</span>
              <span className="text-[11px] text-slate-500">Record a short greeting for potential customers</span>
            </div>
            {!isRecordingAudio ? (
              <button
                type="button"
                onClick={startRecordingAudioSnippet}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                <Mic className="w-3.5 h-3.5 inline mr-1" /> Record Intro
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecordingAudioSnippet}
                className="px-3.5 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl animate-pulse"
              >
                Stop ({audioTimer}s)
              </button>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
          >
            <span>Save Profile & Register</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

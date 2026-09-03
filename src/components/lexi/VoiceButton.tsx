"use client";

import React from "react";
import { Mic, MicOff, Volume2 } from "lucide-react";

interface VoiceButtonProps {
  isListening: boolean;
  isSpeaking?: boolean;
  onToggleVoice?: () => void;
  onClick?: () => void;
  disabled?: boolean;
}

export default function VoiceButton({
  isListening,
  isSpeaking = false,
  onToggleVoice,
  onClick,
  disabled = false,
}: VoiceButtonProps) {
  const handleClick = onToggleVoice || onClick;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      title={isListening ? "Stop Voice Input" : "Speak to Lexi AI (Hindi / English)"}
      className={`relative p-2.5 rounded-xl transition-all flex items-center justify-center shrink-0 active:scale-95 ${
        isListening
          ? "bg-rose-600 text-white animate-pulse"
          : isSpeaking
          ? "bg-emerald-600 text-white animate-pulse"
          : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-sm"
      }`}
    >
      {isSpeaking ? (
        <Volume2 className="w-4 h-4 animate-pulse text-white" />
      ) : isListening ? (
        <MicOff className="w-4 h-4" />
      ) : (
        <Mic className="w-4 h-4 text-blue-600" />
      )}
    </button>
  );
}

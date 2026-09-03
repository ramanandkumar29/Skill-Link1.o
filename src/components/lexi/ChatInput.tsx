"use client";

import React, { useState, useRef, useEffect } from "react";
import VoiceButton from "./VoiceButton";
import { Send, Sparkles, X, Globe, Radio } from "lucide-react";
import { VoiceLanguage } from "@/lib/lexiVoice";

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isLoading?: boolean;
  isListening?: boolean;
  isSpeaking?: boolean;
  interimTranscript?: string;
  voiceLanguage?: VoiceLanguage;
  onToggleVoice?: () => void;
  onToggleLanguage?: () => void;
  placeholder?: string;
}

export default function ChatInput({
  onSendMessage,
  isLoading = false,
  isListening = false,
  isSpeaking = false,
  interimTranscript = "",
  voiceLanguage = "hi-IN",
  onToggleVoice,
  onToggleLanguage,
  placeholder = "Ask Lexi in English, Hindi, or Hinglish...",
}: ChatInputProps) {
  const [inputText, setInputText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync interim transcript with input text for live editing
  useEffect(() => {
    if (interimTranscript) {
      setInputText(interimTranscript);
    }
  }, [interimTranscript]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = inputText.trim();
    if (!clean || isLoading) return;

    onSendMessage(clean);
    setInputText("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="bg-white border-t border-slate-200 flex flex-col">
      {/* Live Voice Listening Bar */}
      {isListening && (
        <div className="px-4 py-2 bg-rose-50 border-b border-rose-200 flex items-center justify-between gap-2 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2 text-rose-700 text-xs font-semibold truncate">
            <Radio className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
            <span className="animate-pulse">Listening ({voiceLanguage.startsWith("hi") ? "Hindi/Hinglish" : "English"})...</span>
            <div className="flex items-center gap-0.5 ml-2">
              <span className="w-1 h-3 bg-rose-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1 h-4 bg-rose-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1 h-2 bg-rose-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              <span className="w-1 h-4 bg-rose-600 rounded-full animate-bounce" style={{ animationDelay: "450ms" }} />
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleVoice}
            className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 px-2 py-0.5 rounded bg-white border border-slate-200"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Main Input Form */}
      <form
        onSubmit={handleSend}
        className="p-3 flex items-end gap-2 relative"
      >
        {/* Voice Button */}
        <VoiceButton
          isListening={isListening}
          isSpeaking={isSpeaking}
          onClick={onToggleVoice}
          disabled={isLoading}
        />

        {/* Input Field */}
        <div className="flex-1 relative flex items-center">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Listening to your voice..." : placeholder}
            disabled={isLoading}
            className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900 placeholder-slate-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium resize-none focus:outline-none min-h-[40px] max-h-[120px] transition-all"
          />

          {inputText && (
            <button
              type="button"
              onClick={() => setInputText("")}
              className="absolute right-2.5 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-bold transition-all shrink-0 flex items-center justify-center shadow-sm"
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Language Indicator Footer */}
      <div className="px-3 pb-2 pt-0 flex items-center justify-between text-[10px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <Globe className="w-3 h-3 text-blue-600" />
          <span>Language:</span>
          <button
            type="button"
            onClick={onToggleLanguage}
            className="font-bold text-blue-600 hover:underline cursor-pointer"
          >
            {voiceLanguage.startsWith("hi") ? "Hindi / Hinglish (हिंदी)" : "English (India)"}
          </button>
        </div>

        <span className="text-slate-400 font-medium">Powered by Lexi AI</span>
      </div>
    </div>
  );
}

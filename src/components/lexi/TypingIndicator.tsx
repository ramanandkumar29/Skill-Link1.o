"use client";

import React from "react";
import { Sparkles } from "lucide-react";

interface TypingIndicatorProps {
  label?: string;
}

export default function TypingIndicator({ label = "Lexi is thinking..." }: TypingIndicatorProps) {
  return (
    <div className="flex items-start gap-3 my-2 animate-in fade-in duration-200">
      {/* Bot Avatar */}
      <div className="w-8 h-8 rounded-full bg-blue-600 text-white shrink-0 flex items-center justify-center shadow-sm">
        <Sparkles className="w-4 h-4" />
      </div>

      {/* Bubble */}
      <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white border border-slate-200 shadow-sm flex items-center gap-3">
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" />
        </div>
      </div>
    </div>
  );
}

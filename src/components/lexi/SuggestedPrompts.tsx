"use client";

import React from "react";
import { SuggestedPromptItem } from "./types";
import { Sparkles } from "lucide-react";

interface SuggestedPromptsProps {
  onSelectPrompt: (promptText: string) => void;
  customPrompts?: SuggestedPromptItem[];
}

const DEFAULT_PROMPTS: SuggestedPromptItem[] = [
  {
    id: "p1",
    text: "🚰 Bathroom pipe leaking continuously (Emergency Plumber)",
    category: "home",
  },
  {
    id: "p2",
    text: "⚡ Bijli ke switch se sparks aa rahe hain (Urgent Electrician)",
    category: "home",
  },
  {
    id: "p3",
    text: "🎨 Ghar ki painting karwani hai (Ramanand Kumar - Master Painter)",
    category: "home",
  },
  {
    id: "p4",
    text: "🚨 Highway emergency flat tyre & puncture repair",
    category: "sos",
  },
  {
    id: "p5",
    text: "🏢 School / Hospital bulk booking (5+ Workers for 3 Days)",
    category: "institution",
  },
  {
    id: "p6",
    text: "🛡️ Cooperative Fair Wage & Welfare Passbook kaise kaam karta hai?",
    category: "pricing",
  },
];

export default function SuggestedPrompts({
  onSelectPrompt,
  customPrompts = DEFAULT_PROMPTS,
}: SuggestedPromptsProps) {
  return (
    <div className="space-y-2 my-2">
      <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold uppercase tracking-wider px-1">
        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
        <span>Suggested Topics</span>
      </div>

      <div className="flex flex-col gap-1.5">
        {customPrompts.map((prompt) => (
          <button
            key={prompt.id}
            type="button"
            onClick={() => onSelectPrompt(prompt.text)}
            className="text-left px-3.5 py-2 rounded-xl text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm transition-all active:scale-[0.99] flex items-center justify-between group"
          >
            <span>{prompt.text}</span>
            <span className="text-slate-400 group-hover:text-blue-600 text-xs transition-colors">→</span>
          </button>
        ))}
      </div>
    </div>
  );
}

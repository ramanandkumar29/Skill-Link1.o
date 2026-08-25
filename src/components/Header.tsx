"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, Globe, Signal } from "lucide-react";

interface HeaderProps {
  activeSection?: "MARKETPLACE" | "SAHAYAK" | "HELPLINES" | "QUICKFIX" | "PROFILE";
  onSelectSection?: (section: "MARKETPLACE" | "SAHAYAK" | "HELPLINES" | "QUICKFIX" | "PROFILE") => void;
}

export default function Header({ activeSection = "MARKETPLACE", onSelectSection }: HeaderProps) {
  const [lang, setLang] = useState<"Hindi" | "Hinglish" | "English">("Hinglish");
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleNavClick = (section: "MARKETPLACE" | "SAHAYAK" | "HELPLINES" | "QUICKFIX" | "PROFILE") => {
    if (onSelectSection) {
      onSelectSection(section);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-2xl bg-slate-950/85 border-b border-white/10 text-white px-4 sm:px-6 lg:px-8 py-3 shadow-2xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* App Logo */}
        <div
          onClick={() => handleNavClick("MARKETPLACE")}
          className="cursor-pointer"
        >
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-emerald-400 to-cyan-300 p-0.5 shadow-[0_0_20px_rgba(79,70,229,0.5)] transition-transform group-hover:scale-105">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-cyan-300 fill-cyan-300 animate-pulse" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-cyan-300 bg-clip-text text-transparent flex items-center gap-1.5">
                SkillLink
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Sahayak AI
                </span>
              </span>
              <span className="text-[10px] text-slate-400 font-extrabold hidden sm:inline">
                Service Marketplace
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Quick Nav Links (hidden on mobile, visible on desktop) */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-black text-slate-300">
          <button
            onClick={() => handleNavClick("MARKETPLACE")}
            className={`hover:text-cyan-300 transition-colors ${
              activeSection === "MARKETPLACE" ? "text-cyan-300 border-b-2 border-cyan-400 pb-0.5" : ""
            }`}
          >
            Marketplace
          </button>
          <button
            onClick={() => handleNavClick("HELPLINES")}
            className={`hover:text-cyan-300 transition-colors ${
              activeSection === "HELPLINES" ? "text-cyan-300 border-b-2 border-cyan-400 pb-0.5" : ""
            }`}
          >
            Brand Helplines
          </button>
          <button
            onClick={() => handleNavClick("QUICKFIX")}
            className={`hover:text-rose-400 transition-colors flex items-center gap-1 ${
              activeSection === "QUICKFIX" ? "text-rose-400 border-b-2 border-rose-500 pb-0.5" : ""
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            QuickFix SOS
          </button>
          <button
            onClick={() => handleNavClick("PROFILE")}
            className={`hover:text-cyan-300 transition-colors ${
              activeSection === "PROFILE" ? "text-cyan-300 border-b-2 border-cyan-400 pb-0.5" : ""
            }`}
          >
            Dashboard
          </button>
        </nav>

        {/* Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile SOS Shortcut */}
          <button
            onClick={() => handleNavClick("QUICKFIX")}
            className="md:hidden flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-rose-300 bg-rose-950/80 border border-rose-500/40 rounded-xl shadow-lg active:scale-95 min-h-[38px]"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            SOS
          </button>

          {/* Network Status Indicator */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full font-extrabold border ${
              isOnline
                ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                : "bg-amber-950/80 text-amber-300 border-amber-500/40"
            }`}
            title={isOnline ? "Network Status: High Speed Connected" : "Network Status: Offline or Low Bandwidth"}
          >
            {isOnline ? (
              <>
                <Globe className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">🌐 Online</span>
              </>
            ) : (
              <>
                <Signal className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">📶 Low Net</span>
              </>
            )}
          </div>

          {/* Language Switcher */}
          <div className="flex items-center bg-slate-900 border border-white/10 rounded-xl p-0.5 shadow-inner">
            {(["Hindi", "Hinglish", "English"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2.5 py-1 text-[11px] font-black rounded-lg transition-all ${
                  lang === l
                    ? "bg-gradient-to-r from-indigo-600 to-emerald-500 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

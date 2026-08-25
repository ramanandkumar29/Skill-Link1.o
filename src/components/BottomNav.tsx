"use client";

import React from "react";
import Link from "next/link";
import { Home, Mic, PhoneCall, Zap, UserCheck } from "lucide-react";

interface BottomNavProps {
  activeSection?: "MARKETPLACE" | "SAHAYAK" | "HELPLINES" | "QUICKFIX" | "PROFILE";
  onSelectSection?: (section: "MARKETPLACE" | "SAHAYAK" | "HELPLINES" | "QUICKFIX" | "PROFILE") => void;
}

export default function BottomNav({ activeSection = "MARKETPLACE", onSelectSection }: BottomNavProps) {
  const navItems = [
    { label: "Home", section: "MARKETPLACE" as const, href: "/", icon: Home },
    { label: "Sahayak", section: "SAHAYAK" as const, href: "/register", icon: Mic, highlight: true },
    { label: "Helplines", section: "HELPLINES" as const, href: "/helplines", icon: PhoneCall },
    { label: "QuickFix", section: "QUICKFIX" as const, href: "/quickfix", icon: Zap, sos: true },
    { label: "Profile", section: "PROFILE" as const, href: "/profile", icon: UserCheck },
  ];

  const handleItemClick = (
    e: React.MouseEvent,
    section: "MARKETPLACE" | "SAHAYAK" | "HELPLINES" | "QUICKFIX" | "PROFILE"
  ) => {
    if (onSelectSection) {
      e.preventDefault();
      onSelectSection(section);
    }
  };

  return (
    <nav className="flex md:hidden fixed bottom-0 left-0 right-0 z-50 w-full px-3 pb-2.5">
      <div className="max-w-md mx-auto w-full glass-panel-3d px-3 py-2 border border-white/20 bg-slate-950/95 shadow-[0_20px_50px_rgba(0,0,0,0.9)] rounded-2xl flex items-center justify-around backdrop-blur-2xl">
        {navItems.map((item) => {
          const isActive = activeSection === item.section;
          const Icon = item.icon;

          if (item.highlight) {
            return (
              <Link
                key={item.section}
                href={item.href}
                onClick={(e) => handleItemClick(e, item.section)}
                className="relative -top-4 flex flex-col items-center group"
              >
                <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-indigo-600 via-emerald-400 to-cyan-300 text-slate-950 shadow-[0_0_30px_rgba(16,185,129,0.8)] flex items-center justify-center border-2 border-white transition-transform active:scale-95">
                  <Icon className="w-6 h-6 text-slate-950 animate-pulse font-black" />
                </div>
                <span className="text-[10px] font-black text-cyan-300 mt-1">
                  {item.label}
                </span>
              </Link>
            );
          }

          if (item.sos) {
            return (
              <Link
                key={item.section}
                href={item.href}
                onClick={(e) => handleItemClick(e, item.section)}
                className={`flex flex-col items-center gap-1 min-h-[48px] justify-center transition-all ${
                  isActive ? "text-rose-400 scale-105" : "text-slate-400 hover:text-rose-300"
                }`}
              >
                <div className="relative p-1 rounded-xl bg-rose-950/80 border border-rose-500/40">
                  <Icon className="w-5 h-5 text-rose-400 animate-bounce" />
                </div>
                <span className="text-[10px] font-black text-rose-400">{item.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.section}
              href={item.href}
              onClick={(e) => handleItemClick(e, item.section)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 min-h-[48px] justify-center rounded-xl transition-all ${
                isActive
                  ? "text-cyan-300 font-black bg-indigo-950/80 border border-indigo-500/30"
                  : "text-slate-400 hover:text-slate-200 font-extrabold"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { Home, Briefcase, Zap, Building, User } from "lucide-react";
import { AppSection } from "./Header";

interface BottomNavProps {
  activeSection?: AppSection;
  onSelectSection?: (section: AppSection) => void;
}

export default function BottomNav({ activeSection = "MARKETPLACE", onSelectSection }: BottomNavProps) {
  const navItems: Array<{
    label: string;
    section: AppSection;
    href: string;
    icon: any;
    sos?: boolean;
  }> = [
    { label: "Customer", section: "MARKETPLACE", href: "/", icon: Home },
    { label: "Worker", section: "WORKER_PORTAL", href: "#worker", icon: Briefcase },
    { label: "SOS", section: "QUICKFIX", href: "/quickfix", icon: Zap, sos: true },
    { label: "Admin", section: "COOPERATIVE_ADMIN", href: "#admin", icon: Building },
    { label: "Account", section: "PROFILE", href: "/profile", icon: User },
  ];

  const handleItemClick = (e: React.MouseEvent, section: AppSection) => {
    if (onSelectSection) {
      e.preventDefault();
      onSelectSection(section);
    }
  };

  return (
    <nav className="flex md:hidden fixed bottom-0 left-0 right-0 z-50 w-full px-3 pb-3">
      <div className="max-w-md mx-auto w-full px-3 py-2 border border-slate-200 bg-white/95 shadow-lg rounded-2xl flex items-center justify-around backdrop-blur-md">
        {navItems.map((item) => {
          const isActive = activeSection === item.section;
          const Icon = item.icon;

          if (item.sos) {
            return (
              <button
                key={item.section}
                onClick={(e) => handleItemClick(e, item.section)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                  isActive
                    ? "text-rose-700 bg-rose-50 font-bold"
                    : "text-rose-600 hover:text-rose-700"
                }`}
              >
                <Icon className="w-5 h-5 text-rose-600" />
                <span className="text-[10px] font-bold">{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.section}
              onClick={(e) => handleItemClick(e, item.section)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                isActive
                  ? "text-blue-600 font-bold bg-blue-50"
                  : "text-slate-500 hover:text-slate-900 font-medium"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

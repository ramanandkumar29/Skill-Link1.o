"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Wrench,
  MapPin,
  User,
  LogOut,
  ChevronDown,
  Globe,
  ShieldCheck,
  Building,
  Briefcase,
  Users,
  Sparkles,
  Zap
} from "lucide-react";
import { AuthSessionUser } from "@/lib/auth";
import { LanguageCode, LANGUAGES, TRANSLATIONS } from "@/lib/i18n";
import NotificationBell from "./NotificationBell";

export type AppSection =
  | "MARKETPLACE"
  | "WORKER_PORTAL"
  | "COOPERATIVE_ADMIN"
  | "QUICKFIX"
  | "SAHAYAK"
  | "HELPLINES"
  | "PROFILE";

interface HeaderProps {
  activeSection?: AppSection;
  onSelectSection?: (section: AppSection) => void;
  currentUser?: AuthSessionUser | null;
  onLogout?: () => void;
  currentLanguage?: LanguageCode;
  onSelectLanguage?: (lang: LanguageCode) => void;
  onLanguageToggle?: () => void;
  currentLang?: "en" | "hi";
  onOpenWelfareModal?: () => void;
}

export default function Header({
  activeSection = "MARKETPLACE",
  onSelectSection,
  currentUser,
  onLogout,
  currentLanguage = "en",
  onSelectLanguage,
  onLanguageToggle,
  currentLang,
  onOpenWelfareModal,
}: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  const activeLang: LanguageCode = currentLanguage || (currentLang as LanguageCode) || "en";
  const t = TRANSLATIONS[activeLang] || TRANSLATIONS.en;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNavClick = (section: AppSection) => {
    if (onSelectSection) {
      onSelectSection(section);
    }
  };

  const displayName = currentUser?.name
    ? currentUser.name.split("@")[0].replace(/[0-9_]/g, "").trim() || currentUser.name.split("@")[0]
    : "Coop Account";

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/95 border-b border-slate-200 text-slate-900 px-3 sm:px-6 py-2.5 transition-all shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo & Ministry Affiliation */}
        <div onClick={() => handleNavClick("MARKETPLACE")} className="cursor-pointer">
          <div className="flex items-center gap-2 group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-600/20 group-hover:bg-blue-700 transition-colors">
              <Building className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                Skill-Link
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Cooperative
                </span>
              </span>
              <span className="hidden sm:block text-[10px] font-semibold text-slate-500 truncate max-w-[210px]">
                Ministry of Cooperation • SIH26089
              </span>
            </div>
          </div>
        </div>

        {/* 3-in-1 Role Switcher (Customer / Worker / Admin) */}
        <nav className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 text-xs font-bold text-slate-700">
          <button
            onClick={() => handleNavClick("MARKETPLACE")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeSection === "MARKETPLACE"
                ? "bg-white text-blue-700 font-black shadow-sm"
                : "hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{t.roleCustomer}</span>
            <span className="md:hidden">Customer</span>
          </button>

          <button
            onClick={() => handleNavClick("WORKER_PORTAL")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeSection === "WORKER_PORTAL"
                ? "bg-white text-emerald-700 font-black shadow-sm"
                : "hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline">{t.roleWorker}</span>
            <span className="md:hidden">Worker</span>
          </button>

          <button
            onClick={() => handleNavClick("COOPERATIVE_ADMIN")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeSection === "COOPERATIVE_ADMIN"
                ? "bg-white text-purple-700 font-black shadow-sm"
                : "hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <Building className="w-3.5 h-3.5 text-purple-600" />
            <span className="hidden md:inline">{t.roleAdmin}</span>
            <span className="md:hidden">Admin</span>
          </button>

          <button
            onClick={() => handleNavClick("QUICKFIX")}
            className={`hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-rose-700 hover:bg-rose-50/80 transition-all ${
              activeSection === "QUICKFIX" ? "bg-rose-50 font-black border border-rose-200" : ""
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            <span>Emergency SOS</span>
          </button>
        </nav>

        {/* Right Controls: Multilingual Selector & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Multilingual 5-Language Dropdown */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-xl transition-all shadow-sm"
              title="Select Language"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span className="uppercase text-[11px]">{activeLang}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isLangDropdownOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 text-xs text-slate-700 animate-in fade-in slide-in-from-top-1">
                <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold uppercase text-slate-400">
                  Select Language (भाषा)
                </div>
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      if (onSelectLanguage) onSelectLanguage(lang.code);
                      else if (onLanguageToggle) onLanguageToggle();
                      setIsLangDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center justify-between font-semibold ${
                      activeLang === lang.code ? "text-blue-700 bg-blue-50/50 font-bold" : ""
                    }`}
                  >
                    <span>{lang.label}</span>
                    <span className="text-sm">{lang.flag}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Welfare Info Trigger */}
          {onOpenWelfareModal && (
            <button
              onClick={onOpenWelfareModal}
              className="hidden xl:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>3% Welfare Info</span>
            </button>
          )}

          {/* In-App & Realtime Notification Bell */}
          <NotificationBell
            userId={currentUser?.id}
            userRole={(currentUser?.role as any) || "customer"}
          />

          {/* User Account Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-sm"
            >
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span className="max-w-[75px] sm:max-w-[100px] truncate">{displayName}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 text-xs text-slate-700 animate-in fade-in slide-in-from-top-1">
                <div className="px-3.5 py-2 border-b border-slate-100">
                  <p className="font-bold text-slate-900 truncate">{displayName}</p>
                  <p className="text-[10px] text-slate-500 capitalize">
                    {currentUser?.role || "Cooperative Customer"}
                  </p>
                </div>

                <button
                  onClick={() => {
                    handleNavClick("PROFILE");
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 font-medium"
                >
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  My Bookings &amp; History
                </button>

                <button
                  onClick={() => {
                    handleNavClick("WORKER_PORTAL");
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 font-medium"
                >
                  <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                  Worker Portal Dashboard
                </button>

                <button
                  onClick={() => {
                    handleNavClick("COOPERATIVE_ADMIN");
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 font-medium"
                >
                  <Building className="w-3.5 h-3.5 text-purple-600" />
                  Cooperative Federation Admin
                </button>

                <Link
                  href="/login"
                  onClick={() => setIsDropdownOpen(false)}
                  className="w-full text-left px-3.5 py-2 hover:bg-blue-50 text-blue-700 flex items-center gap-2 font-semibold border-t border-slate-100"
                >
                  <User className="w-3.5 h-3.5" />
                  Sign In / Switch Account
                </Link>

                {onLogout && (
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Log Out
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

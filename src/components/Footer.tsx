"use client";

import React from "react";
import Link from "next/link";
import { Zap, ShieldCheck, Heart, PhoneCall, Sparkles, MapPin, Mail, ArrowUpRight } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-slate-950/90 border-t border-white/10 text-white mt-12 pt-12 pb-24 md:pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden backdrop-blur-2xl">
      {/* Background Subtle Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
        {/* Col 1: Brand Info */}
        <div className="space-y-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-emerald-400 to-cyan-300 p-0.5 shadow-lg">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-cyan-300 fill-cyan-300 animate-pulse" />
              </div>
            </div>
            <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
              SkillLink
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Sahayak AI
              </span>
            </span>
          </Link>
          <p className="text-xs text-slate-400 font-medium leading-relaxed">
            Next-generation corporate service marketplace connecting customers with verified local technicians powered by Sahayak 2-Way Voice AI.
          </p>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-500/30 w-fit">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> ₹149 Visit Guarantee
          </div>
        </div>

        {/* Col 2: Quick Links */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Platform Navigation
          </h3>
          <ul className="space-y-2 text-xs font-bold text-slate-400">
            <li>
              <Link href="/" className="hover:text-cyan-300 transition-colors flex items-center gap-1">
                Marketplace Home <ArrowUpRight className="w-3 h-3 text-slate-500" />
              </Link>
            </li>
            <li>
              <Link href="/register" className="hover:text-cyan-300 transition-colors flex items-center gap-1">
                Sahayak AI Voice Registration <ArrowUpRight className="w-3 h-3 text-slate-500" />
              </Link>
            </li>
            <li>
              <Link href="/helplines" className="hover:text-cyan-300 transition-colors flex items-center gap-1">
                Official Brand Helplines <ArrowUpRight className="w-3 h-3 text-slate-500" />
              </Link>
            </li>
            <li>
              <Link href="/quickfix" className="hover:text-rose-400 transition-colors flex items-center gap-1">
                QuickFix SOS Emergency <ArrowUpRight className="w-3 h-3 text-slate-500" />
              </Link>
            </li>
            <li>
              <Link href="/profile" className="hover:text-cyan-300 transition-colors flex items-center gap-1">
                User & Worker Dashboard <ArrowUpRight className="w-3 h-3 text-slate-500" />
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 3: Service Categories */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
            Verified Categories
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-400">
            <Link href="/?category=plumber" className="hover:text-cyan-300">🔧 Master Plumber</Link>
            <Link href="/?category=electrician" className="hover:text-cyan-300">⚡ Electrician</Link>
            <Link href="/?category=mason" className="hover:text-cyan-300">🧱 Masonry</Link>
            <Link href="/?category=salon" className="hover:text-cyan-300">✂️ Women&apos;s Salon</Link>
            <Link href="/?category=ac" className="hover:text-cyan-300">❄️ AC Servicing</Link>
            <Link href="/?category=cleaning" className="hover:text-cyan-300">🧹 Deep Cleaning</Link>
            <Link href="/?category=appliances" className="hover:text-cyan-300">🔌 Appliances</Link>
          </div>
        </div>

        {/* Col 4: Contact & Coverage */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
            Coverage & Support
          </h3>
          <div className="space-y-2 text-xs text-slate-400 font-medium">
            <p className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
              Chandigarh, Mohali, Panchkula & Delhi NCR
            </p>
            <p className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-emerald-400 shrink-0" />
              24/7 Helpline: 1800-SKILL-LINK
            </p>
            <p className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
              support@skilllink.ai
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-500">
        <p>© {new Date().getFullYear()} SkillLink Service Marketplace. All rights reserved.</p>
        <p className="flex items-center gap-1">
          Engineered with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for Next.js 14 Web
        </p>
      </div>
    </footer>
  );
}

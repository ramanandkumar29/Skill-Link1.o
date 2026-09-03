"use client";

import React from "react";
import Link from "next/link";
import { Wrench, ShieldCheck, MapPin, PhoneCall, ArrowUpRight } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-slate-50 border-t border-slate-200 text-slate-900 mt-16 pt-12 pb-24 md:pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Col 1: Brand Info */}
        <div className="space-y-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">
              Skill-Link
            </span>
          </Link>
          <p className="text-xs text-slate-600 leading-relaxed">
            Verified local tradespeople for doorstep home maintenance and 15-minute emergency roadside assistance across the Tricity area.
          </p>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 w-fit">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> ₹149 Fixed Inspection Fee
          </div>
        </div>

        {/* Col 2: Quick Links */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Platform Navigation
          </h3>
          <ul className="space-y-2 text-xs font-medium text-slate-600">
            <li>
              <Link href="/" className="hover:text-blue-600 transition-colors flex items-center gap-1">
                Marketplace Home <ArrowUpRight className="w-3 h-3 text-slate-400" />
              </Link>
            </li>
            <li>
              <Link href="/register" className="hover:text-blue-600 transition-colors flex items-center gap-1">
                Worker Registration <ArrowUpRight className="w-3 h-3 text-slate-400" />
              </Link>
            </li>
            <li>
              <Link href="/helplines" className="hover:text-blue-600 transition-colors flex items-center gap-1">
                Authorized Brand Helplines <ArrowUpRight className="w-3 h-3 text-slate-400" />
              </Link>
            </li>
            <li>
              <Link href="/quickfix" className="hover:text-rose-600 transition-colors flex items-center gap-1">
                15-Min Roadside SOS <ArrowUpRight className="w-3 h-3 text-slate-400" />
              </Link>
            </li>
            <li>
              <Link href="/profile" className="hover:text-blue-600 transition-colors flex items-center gap-1">
                Customer Bookings <ArrowUpRight className="w-3 h-3 text-slate-400" />
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 3: Service Categories */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Verified Trades
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-600">
            <Link href="/?category=plumber" className="hover:text-blue-600 transition-colors">Plumbing</Link>
            <Link href="/?category=electrician" className="hover:text-blue-600 transition-colors">Electricians</Link>
            <Link href="/?category=ac" className="hover:text-blue-600 transition-colors">AC & HVAC</Link>
            <Link href="/?category=mason" className="hover:text-blue-600 transition-colors">Masonry</Link>
            <Link href="/?category=cleaning" className="hover:text-blue-600 transition-colors">Deep Cleaning</Link>
            <Link href="/?category=appliances" className="hover:text-blue-600 transition-colors">Appliances</Link>
          </div>
        </div>

        {/* Col 4: Coverage & Support */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Coverage & Support
          </h3>
          <div className="space-y-2 text-xs text-slate-600 font-medium">
            <p className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
              Chandigarh, Mohali, Panchkula & Delhi NCR
            </p>
            <p className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-emerald-600 shrink-0" />
              24/7 Helpline: 1800-SKILL-LINK
            </p>
            <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-200">
              © {new Date().getFullYear()} Skill-Link Technologies. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

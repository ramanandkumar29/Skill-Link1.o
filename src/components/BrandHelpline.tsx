"use client";

import React, { useState } from "react";
import { BRAND_HELPLINES } from "../lib/seedData";
import { Search, PhoneCall, MessageSquare, Wrench, Sparkles, Clock, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function BrandHelpline() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBrands = BRAND_HELPLINES.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.supportedAppliance.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto pb-24 md:pb-8">
      {/* Header Banner */}
      <div className="glass-panel-3d p-6 sm:p-8 text-white rounded-3xl relative overflow-hidden border border-white/15 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-400/20 text-amber-300 border border-amber-400/40">
            <Sparkles className="w-3.5 h-3.5" />
            Official Warranty Directory
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white">
            Brand Helplines & Toll-Free Care
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium">
            Direct 1-tap toll-free support numbers, WhatsApp service bots, and warranty assistance for leading appliances in India.
          </p>

          {/* Search Bar */}
          <div className="relative mt-4">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search brand (Samsung, LG, Voltas, AC, Refrigerator)..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-950/90 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm font-semibold min-h-[48px]"
            />
          </div>
        </div>
      </div>

      {/* ADAPTIVE DESKTOP & MOBILE GRID: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBrands.map((brand) => (
          <div
            key={brand.id}
            className="glass-panel-3d glass-card-hover p-6 flex flex-col justify-between relative overflow-hidden border border-white/10"
          >
            <div>
              <div className="flex items-center gap-3.5 mb-4">
                <div
                  className={`w-12 h-12 rounded-2xl ${brand.logoBg} text-white font-black text-lg flex items-center justify-center shadow-lg shrink-0 border border-white/20`}
                >
                  {brand.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">{brand.name}</h3>
                  <span className="text-[11px] font-extrabold text-slate-400 block">
                    {brand.category}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/10 mb-4 space-y-1.5">
                <span className="text-[10px] uppercase font-black text-slate-400 block">
                  Covered Appliances:
                </span>
                <p className="text-xs text-slate-200 font-semibold">{brand.supportedAppliance}</p>
                <div className="flex items-center gap-1.5 text-[11px] text-cyan-300 font-bold pt-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  {brand.hours}
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-white/10">
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`tel:${brand.tollFreeNumber}`}
                  className="py-2.5 px-3 btn-3d-emerald-shine text-xs font-black text-center min-h-[44px]"
                >
                  <PhoneCall className="w-3.5 h-3.5" /> Call Toll-Free
                </a>

                <a
                  href={`https://wa.me/${brand.whatsappNumber}?text=Hi%20${encodeURIComponent(
                    brand.name
                  )}%20Customer%20Support,%20I%20need%20assistance.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-lg border-b-4 border-emerald-950 transition-all active:translate-y-1 active:border-b-0 flex items-center justify-center gap-1 text-xs min-h-[44px]"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                </a>
              </div>

              <Link
                href={`/?category=ac`}
                className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-extrabold rounded-2xl border border-white/10 flex items-center justify-center gap-1.5 transition-all hover:text-emerald-300 min-h-[44px]"
              >
                <Wrench className="w-3.5 h-3.5 text-amber-400" />
                Warranty Expired? Book Verified Local Tech
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filteredBrands.length === 0 && (
        <div className="text-center py-12 glass-panel-3d rounded-3xl p-8">
          <ShieldAlert className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-lg font-black text-white">No Brands Found</h3>
          <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto mt-1">
            Try searching for Samsung, LG, Voltas or Whirlpool.
          </p>
        </div>
      )}
    </div>
  );
}

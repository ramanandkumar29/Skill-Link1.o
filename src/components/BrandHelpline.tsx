"use client";

import React, { useState } from "react";
import { BRAND_HELPLINES } from "../lib/seedData";
import { Search, PhoneCall, MessageSquare, Wrench, Sparkles, Clock, ShieldAlert, Globe } from "lucide-react";
import Link from "next/link";

export default function BrandHelpline() {
  const [searchQuery, setSearchQuery] = useState("");

  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  const filteredBrands = BRAND_HELPLINES.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.supportedAppliance.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === "ALL" || b.category.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto pb-24 md:pb-8 text-slate-900">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          Official Brand Support Directory
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Authorized Brand Helplines &amp; Customer Care
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
          Direct toll-free support numbers, WhatsApp service assistants, and warranty verification for major appliance brands in India.
        </p>

        {/* Search Bar & Category Filter */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search brand (Samsung, LG, Voltas, Daikin, Exide)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white text-xs sm:text-sm font-medium"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {["ALL", "appliances", "electronics", "automotive"].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  categoryFilter === cat
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat === "ALL" ? "All Brands" : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Brand Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBrands.map((brand) => (
          <div
            key={brand.id}
            className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-11 h-11 rounded-xl ${brand.logoBg} text-white font-bold text-base flex items-center justify-center shadow-sm shrink-0`}
                >
                  {brand.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-900 truncate">{brand.name}</h3>
                  <span className="text-[11px] font-semibold text-blue-600 uppercase">
                    {brand.supportedAppliance}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs text-slate-600 mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Support Hours: {brand.hours}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Official Authorized Support</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-100">
              <a
                href={`tel:${brand.tollFreeNumber}`}
                className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call {brand.tollFreeNumber}</span>
              </a>

              {brand.whatsappNumber && (
                <a
                  href={`https://wa.me/${brand.whatsappNumber.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>WhatsApp Support</span>
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { MapPin, Navigation, Compass, ExternalLink, ShieldCheck, Star } from "lucide-react";
import { LatLng, getNavigationUrl } from "@/lib/geo";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  rating?: number;
  distanceKm?: number;
  isCustomer?: boolean;
  avatarUrl?: string;
}

interface SkillLinkMapProps {
  center: LatLng;
  zoom?: number;
  markers?: MapMarker[];
  onLocationSelect?: (pos: LatLng) => void;
  interactiveSelect?: boolean;
  height?: string;
  className?: string;
  activeWorkerId?: string;
}

export default function SkillLinkMap({
  center,
  zoom = 13,
  markers = [],
  onLocationSelect,
  interactiveSelect = false,
  height = "320px",
  className = "",
  activeWorkerId,
}: SkillLinkMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;

    // Dynamically import Leaflet to ensure SSR safety in Next.js
    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Clean up previous instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Initialize map
      const map = L.map(mapContainerRef.current, {
        center: [center.lat, center.lng],
        zoom,
        zoomControl: true,
        attributionControl: false,
      });

      mapInstanceRef.current = map;

      // CartoDB Voyager / OpenStreetMap clean modern tile layer
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          maxZoom: 19,
          subdomains: "abcd",
        }
      ).addTo(map);

      // Create LayerGroup for markers
      const markerGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markerGroup;

      // Click to select location if enabled
      if (interactiveSelect && onLocationSelect) {
        map.on("click", (e: any) => {
          const newPos: LatLng = {
            lat: Number(e.latlng.lat.toFixed(4)),
            lng: Number(e.latlng.lng.toFixed(4)),
          };
          onLocationSelect(newPos);
        });
      }

      // Render markers
      renderMarkers(L, markerGroup);
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update center when props change
  useEffect(() => {
    if (mapInstanceRef.current && center?.lat && center?.lng) {
      mapInstanceRef.current.setView([center.lat, center.lng], zoom, { animate: true });
    }
  }, [center.lat, center.lng, zoom]);

  // Re-render markers when markers list changes
  useEffect(() => {
    if (mapInstanceRef.current && markersLayerRef.current) {
      import("leaflet").then((L) => {
        markersLayerRef.current.clearLayers();
        renderMarkers(L, markersLayerRef.current);
      });
    }
  }, [markers, activeWorkerId]);

  const renderMarkers = (L: any, group: any) => {
    markers.forEach((m) => {
      const isSelected = activeWorkerId === m.id;
      const isCustomer = m.isCustomer;

      const markerHtml = isCustomer
        ? `
          <div class="relative flex items-center justify-center">
            <span class="absolute w-8 h-8 rounded-full bg-blue-500/30 animate-ping"></span>
            <div class="w-8 h-8 rounded-full bg-blue-600 border-2 border-white shadow-md flex items-center justify-center text-white font-bold text-xs">
              📍
            </div>
          </div>
        `
        : `
          <div class="relative flex flex-col items-center">
            <div class="w-8 h-8 rounded-xl ${isSelected ? "bg-emerald-600 scale-110 ring-2 ring-emerald-400" : "bg-emerald-500"} border-2 border-white shadow-md flex items-center justify-center text-white text-xs font-bold transition-transform">
              🔧
            </div>
            <div class="bg-white/95 px-1.5 py-0.5 rounded text-[9px] font-bold text-slate-800 shadow-sm border border-slate-200 mt-0.5 whitespace-nowrap">
              ${m.distanceKm ? `${m.distanceKm}km` : m.title.split(" ")[0]}
            </div>
          </div>
        `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: "custom-map-pin",
        iconSize: [36, 48],
        iconAnchor: [18, 40],
      });

      const leafletMarker = L.marker([m.lat, m.lng], { icon: customIcon }).addTo(group);

      leafletMarker.on("click", () => {
        setSelectedMarker(m);
      });
    });
  };

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm ${className}`}>
      {/* Map Canvas */}
      <div ref={mapContainerRef} style={{ height, width: "100%" }} className="z-10" />

      {/* Floating Selected Marker Card */}
      {selectedMarker && (
        <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 sm:w-80 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-3.5 shadow-xl z-20 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-slate-900 truncate">{selectedMarker.title}</h4>
                {selectedMarker.rating && (
                  <span className="flex items-center text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                    <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500 mr-0.5" />
                    {selectedMarker.rating.toFixed(1)}
                  </span>
                )}
              </div>
              {selectedMarker.subtitle && (
                <p className="text-[11px] font-medium text-blue-600">{selectedMarker.subtitle}</p>
              )}
              {selectedMarker.distanceKm && (
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Approx. {selectedMarker.distanceKm} km away (~{Math.round(selectedMarker.distanceKm * 2.4 + 4)} mins ETA)
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedMarker(null)}
              className="text-slate-400 hover:text-slate-700 text-xs px-1.5 py-0.5 rounded"
            >
              ✕
            </button>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            <a
              href={getNavigationUrl(selectedMarker.lat, selectedMarker.lng, selectedMarker.title)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
            >
              <Navigation className="w-3 h-3" />
              <span>Get Directions</span>
              <ExternalLink className="w-2.5 h-2.5 ml-0.5 text-emerald-500" />
            </a>

            <span className="text-[10px] font-semibold text-slate-400">
              {selectedMarker.lat.toFixed(3)}°N, {selectedMarker.lng.toFixed(3)}°E
            </span>
          </div>
        </div>
      )}

      {/* Interactive Select Overlay Hint */}
      {interactiveSelect && (
        <div className="absolute top-2.5 left-2.5 z-20 bg-white/90 backdrop-blur-sm border border-slate-200 px-2.5 py-1 rounded-lg text-[10px] font-semibold text-slate-700 shadow-sm flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-blue-600" />
          <span>Click anywhere on the map to set your service pin</span>
        </div>
      )}
    </div>
  );
}

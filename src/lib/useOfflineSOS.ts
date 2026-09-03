"use client";

/**
 * useOfflineSOS — Skill-Link Offline SOS Bridge Hook
 *
 * Detects when the device loses internet connectivity and provides:
 *  1. Compact SMS payload assembly: "SOS#LAT:xx.xxxx#LNG:yy.yyyy#ISSUE_TYPE"
 *  2. SMS URI dispatch to open the native SMS app pre-filled
 *  3. API timeout detection (>3000ms) as secondary offline trigger
 *
 * Usage:
 *   const { isOffline, triggerOfflineSOS, smsPayload, gpsStatus } = useOfflineSOS();
 */

import { useState, useEffect, useCallback, useRef } from "react";

export type SOSIssueType =
  | "TYRE_PUNCTURE"
  | "BATTERY_JUMPSTART"
  | "FUEL_DELIVERY"
  | "TOWING"
  | "ENGINE_BREAKDOWN"
  | "ACCIDENT_ASSISTANCE"
  | "OTHER";

export interface OfflineSOSState {
  isOffline: boolean;
  smsPayload: string | null;
  gpsCoords: { lat: number; lng: number } | null;
  gpsError: string | null;
  isAcquiringGPS: boolean;
}

export interface UseOfflineSOSReturn extends OfflineSOSState {
  /** Open native SMS app with pre-filled SOS payload */
  triggerOfflineSOS: (issueType?: SOSIssueType) => void;
  /** Detect API timeout and treat as offline */
  wrapWithTimeoutDetection: <T>(promise: Promise<T>, timeoutMs?: number) => Promise<T>;
  /** Force re-acquire GPS coordinates */
  refreshGPS: () => void;
}

const SMS_GATEWAY_NUMBER = process.env.NEXT_PUBLIC_SMS_GATEWAY || "+911234567890";

/** Assemble compact 30-char SOS payload */
function buildSMSPayload(lat: number, lng: number, issueType: SOSIssueType): string {
  const latStr = lat.toFixed(4);
  const lngStr = lng.toFixed(4);
  return `SOS#LAT:${latStr}#LNG:${lngStr}#${issueType}`;
}

/** Use device native GPS via Geolocation API */
function acquireGPS(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: parseFloat(pos.coords.latitude.toFixed(4)),
          lng: parseFloat(pos.coords.longitude.toFixed(4)),
        }),
      (err) => reject(new Error(err.message)),
      { timeout: 10000, enableHighAccuracy: true }
    );
  });
}

// Chandigarh regional fallback coords
const REGIONAL_FALLBACK = { lat: 30.7333, lng: 76.7794 };

export function useOfflineSOS(): UseOfflineSOSReturn {
  const [state, setState] = useState<OfflineSOSState>({
    isOffline:       false,
    smsPayload:      null,
    gpsCoords:       null,
    gpsError:        null,
    isAcquiringGPS:  false,
  });

  const gpsRef = useRef<{ lat: number; lng: number } | null>(null);

  // ── Acquire GPS ─────────────────────────────────────────────────────────────
  const refreshGPS = useCallback(async () => {
    setState(s => ({ ...s, isAcquiringGPS: true, gpsError: null }));
    try {
      const coords = await acquireGPS();
      gpsRef.current = coords;
      setState(s => ({ ...s, gpsCoords: coords, isAcquiringGPS: false }));
    } catch (err: any) {
      console.warn("GPS acquisition failed, using regional fallback:", err.message);
      gpsRef.current = REGIONAL_FALLBACK;
      setState(s => ({
        ...s,
        gpsCoords:      REGIONAL_FALLBACK,
        gpsError:       "Using regional GPS fallback (Chandigarh area).",
        isAcquiringGPS: false,
      }));
    }
  }, []);

  // ── Network online/offline listeners ────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOffline = () => {
      console.warn("🔴 Network offline detected — SOS SMS bridge activated");
      setState(s => ({ ...s, isOffline: true }));
      // Pre-acquire GPS proactively when going offline
      refreshGPS();
    };

    const handleOnline = () => {
      console.log("🟢 Network online — SOS SMS bridge deactivated");
      setState(s => ({ ...s, isOffline: false }));
    };

    // Initialize with current state
    if (!navigator.onLine) handleOffline();

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online",  handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online",  handleOnline);
    };
  }, [refreshGPS]);

  // ── Acquire GPS on mount for fast SOS dispatch ───────────────────────────────
  useEffect(() => {
    refreshGPS();
  }, [refreshGPS]);

  // ── SMS URI dispatch ────────────────────────────────────────────────────────
  const triggerOfflineSOS = useCallback((issueType: SOSIssueType = "OTHER") => {
    const coords = gpsRef.current || REGIONAL_FALLBACK;
    const payload = buildSMSPayload(coords.lat, coords.lng, issueType);

    setState(s => ({ ...s, smsPayload: payload }));

    // Open native SMS app
    const smsUri = `sms:${SMS_GATEWAY_NUMBER}?body=${encodeURIComponent(payload)}`;
    if (typeof window !== "undefined") {
      window.open(smsUri, "_self");
    }

    console.log(`📱 Offline SOS SMS dispatched: ${payload}`);
    return payload;
  }, []);

  // ── API timeout detection wrapper ────────────────────────────────────────────
  const wrapWithTimeoutDetection = useCallback(
    <T>(promise: Promise<T>, timeoutMs = 3000): Promise<T> => {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => {
          console.warn(`⏱️ API timeout (>${timeoutMs}ms) — treating as offline`);
          setState(s => ({ ...s, isOffline: true }));
          reject(new Error("API_TIMEOUT"));
        }, timeoutMs)
      );
      return Promise.race([promise, timeoutPromise]);
    },
    []
  );

  return {
    ...state,
    triggerOfflineSOS,
    wrapWithTimeoutDetection,
    refreshGPS,
  };
}

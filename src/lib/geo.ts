/**
 * Geo & Location Utilities for Skill-Link
 * Handles Haversine distance, travel times, reverse geocoding, and privacy-preserving coordinate handling.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface LocationInfo {
  lat: number;
  lng: number;
  address: string;
  city?: string;
  sector?: string;
}

/**
 * Calculates accurate geodesic distance between two GPS coordinates using the Haversine formula.
 * @returns Distance in kilometers (rounded to 1 decimal place).
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 2.5;

  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;

  return Number(Math.max(0.3, d).toFixed(1));
}

/**
 * Estimates technician travel arrival time in minutes.
 * Models urban traffic with average 25 km/h urban speed + 5 min dispatch prep buffer.
 */
export function estimateTravelTimeMinutes(distanceKm: number): number {
  const speedKmPerHour = 25;
  const travelMinutes = (distanceKm / speedKmPerHour) * 60;
  return Math.max(8, Math.round(travelMinutes + 4));
}

/**
 * Privacy Protection Guard:
 * Obfuscates exact GPS coordinates to a ~1.1km neighborhood radius.
 * Prevents exposing precise personal doorstep locations of workers to public callers.
 */
export function obfuscateCoordinates(lat: number, lng: number): LatLng {
  // 2 decimal places provides ~1.1 km resolution (neighborhood/sector level privacy)
  return {
    lat: Number(lat.toFixed(2)),
    lng: Number(lng.toFixed(2)),
  };
}

/**
 * Reverse geocodes coordinates to a readable street/sector address.
 * Uses OpenStreetMap Nominatim with clean timeout and regional fallbacks.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          "Accept-Language": "en",
          "User-Agent": "SkillLink-App/1.0",
        },
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.display_name) {
        const addr = data.address || {};
        const road = addr.suburb || addr.neighbourhood || addr.road || addr.residential;
        const city = addr.city || addr.town || addr.county || "Chandigarh";
        if (road) {
          return `${road}, ${city}`;
        }
        return data.display_name.split(",").slice(0, 2).join(", ");
      }
    }
  } catch (e) {
    // Network or timeout: fall back gracefully
  }

  // Regional Sector Estimation Fallback
  return `Sector Pin (${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E)`;
}

/**
 * Requests browser geolocation permission cleanly with user-friendly errors.
 */
export async function getBrowserLocation(): Promise<{
  success: boolean;
  location?: LocationInfo;
  error?: string;
}> {
  if (typeof window === "undefined" || !("geolocation" in navigator)) {
    return {
      success: false,
      error: "Geolocation is not supported by your browser.",
    };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = Number(position.coords.latitude.toFixed(4));
        const lng = Number(position.coords.longitude.toFixed(4));
        const address = await reverseGeocode(lat, lng);
        resolve({
          success: true,
          location: { lat, lng, address },
        });
      },
      (err) => {
        let msg = "Could not retrieve your location.";
        if (err.code === err.PERMISSION_DENIED) {
          msg = "Location access was denied. You can select your sector manually.";
        } else if (err.code === err.TIMEOUT) {
          msg = "Location request timed out. Using default sector.";
        }
        resolve({
          success: false,
          error: msg,
          location: {
            lat: 30.7333,
            lng: 76.7794,
            address: "Sector 17, Chandigarh",
          },
        });
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  });
}

/**
 * Generates turn-by-turn navigation URL for technicians opening external Google Maps or Apple Maps.
 */
export function getNavigationUrl(lat: number, lng: number, label?: string): string {
  const destination = `${lat},${lng}`;
  const query = label ? `${destination}+(${encodeURIComponent(label)})` : destination;
  return `https://www.google.com/maps/dir/?api=1&destination=${query}`;
}

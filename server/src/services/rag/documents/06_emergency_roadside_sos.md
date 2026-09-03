# 15-Minute Emergency Roadside SOS Dispatch

## What is On-Road Emergency SOS?
Skill-Link provides a rapid 15-minute emergency roadside assistance engine for stranded vehicles (cars, bikes, commercial vehicles).

## SOS Assistance Types Covered
- **Tyre Puncture & Flat Tyre Replacement:** Locked rate ₹349.
- **Battery Jumpstart:** Locked rate ₹299.
- **Emergency Fuel Delivery (Petrol / Diesel):** Service fee ₹249 + fuel at pump price.
- **Towing Service & Flatbed Transport:** Fixed base rate ₹999 for up to 15km.
- **Engine Breakdown & Mechanical Highway Recovery:** Starting at ₹499.

## 3-Stage Cascade Dispatch Algorithm
1. **Stage 1 (0–15 seconds):**
   Queries verified mechanics within a **5km radius** using high-precision GPS `$nearSphere` geospatial matching. Pings top 3 nearest active mechanics via WebSocket.
2. **Stage 2 (15–30 seconds):**
   If no acceptance occurs in Stage 1, the search radius automatically widens to **10km** and pings the next 5 nearest mechanics.
3. **Stage 3 (30+ seconds):**
   If still pending, the system automatically escalates to 24x7 partner garage hubs and triggers automated emergency IVR calls.

## Offline SMS SOS Bridge
- If internet connectivity drops or API requests time out (>3000ms), the system formats a compact 30-character SMS payload:
  `SOS#LAT:xx.xxxx#LNG:yy.yyyy#ISSUE_TYPE`
- The user can dispatch this via standard SMS to the Skill-Link Emergency Shortcode (`+911234567890`) with zero internet required.

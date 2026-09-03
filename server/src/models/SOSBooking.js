/**
 * SOSBooking Schema — Skill-Link Emergency Dispatch
 *
 * Tracks the full lifecycle of an emergency SOS booking:
 *   TRIGGERED → PINGED → ACCEPTED → EN_ROUTE → COMPLETED | CANCELLED
 *
 * Supports three trigger modes:
 *   ONLINE_WEBSOCKET  — standard in-app dispatch
 *   OFFLINE_SMS       — SMS-based offline trigger
 *   BLE_MESH          — Bluetooth P2P mesh trigger
 */

const mongoose = require("mongoose");
const crypto   = require("crypto");

const sosBookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type:     String,
      required: true,
      unique:   true,
      default:  () => `SOS-${Date.now().toString(36).toUpperCase()}`,
    },

    // ── Parties ───────────────────────────────────────────────────────────────
    customerId:   { type: String, required: true },
    customerName: { type: String, required: true },
    customerPhone:{ type: String, required: true },
    workerId:     { type: String, default: null },      // filled on ACCEPTED
    workerName:   { type: String, default: null },

    // ── Service ───────────────────────────────────────────────────────────────
    serviceType: {
      type: String,
      required: true,
      enum: [
        "TYRE_PUNCTURE",
        "BATTERY_JUMPSTART",
        "FUEL_DELIVERY",
        "TOWING",
        "ENGINE_BREAKDOWN",
        "ACCIDENT_ASSISTANCE",
        "OTHER",
      ],
      default: "OTHER",
    },

    // ── FSM Status ────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["TRIGGERED", "PINGED", "ACCEPTED", "EN_ROUTE", "COMPLETED", "CANCELLED", "EXPIRED"],
      default: "TRIGGERED",
      index: true,
    },

    // ── Dispatch Stage Tracking ───────────────────────────────────────────────
    dispatchStage:   { type: Number, default: 1 },   // 1, 2, or 3
    pinnedWorkerIds: [{ type: String }],             // workers pinged (for dedup)

    // ── Trigger Mode ─────────────────────────────────────────────────────────
    triggerMode: {
      type: String,
      enum: ["ONLINE_WEBSOCKET", "OFFLINE_SMS", "BLE_MESH"],
      default: "ONLINE_WEBSOCKET",
    },

    // ── Location ─────────────────────────────────────────────────────────────
    /**
     * pickupLocation — GeoJSON Point
     * coordinates: [longitude, latitude]
     */
    pickupLocation: {
      type: {
        type:  String,
        enum:  ["Point"],
        default: "Point",
      },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    pickupAddress: { type: String, default: "" },      // reverse-geocoded label

    // ── Payment ───────────────────────────────────────────────────────────────
    priceLock:     { type: Number, default: 0 },       // locked rate at dispatch
    paymentStatus: { type: String, enum: ["PENDING", "PAID", "REFUNDED"], default: "PENDING" },
    paymentMethod: { type: String, default: "UPI" },

    // ── OTP Escrow Release ────────────────────────────────────────────────────
    otpSecret:  { type: String, default: () => crypto.randomInt(100000, 999999).toString() },
    otpVerified:{ type: Boolean, default: false },

    // ── Timing ───────────────────────────────────────────────────────────────
    acceptedAt:   { type: Date, default: null },
    arrivedAt:    { type: Date, default: null },
    completedAt:  { type: Date, default: null },
    cancelledAt:  { type: Date, default: null },
    cancelReason: { type: String, default: null },

    // ── Raw SMS payload (for OFFLINE_SMS mode) ───────────────────────────────
    rawSmsPayload: { type: String, default: null },
  },
  {
    timestamps: true,
    toJSON:  { virtuals: true },
    toObject:{ virtuals: true },
  }
);

// ── Geospatial index (for future $nearSphere worker-to-pickup queries) ────────
sosBookingSchema.index({ pickupLocation: "2dsphere" });
sosBookingSchema.index({ status: 1, createdAt: -1 });
sosBookingSchema.index({ customerId: 1, status: 1 });

// ── Virtual: elapsed minutes since trigger ────────────────────────────────────
sosBookingSchema.virtual("elapsedMins").get(function () {
  return Math.floor((Date.now() - new Date(this.createdAt).getTime()) / 60000);
});

module.exports = mongoose.models.SOSBooking || mongoose.model("SOSBooking", sosBookingSchema);

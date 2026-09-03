/**
 * Worker Schema — Skill-Link
 *
 * Updated with:
 *  - liveLocation: GeoJSON Point + 2dsphere index (for $nearSphere queries)
 *  - kycStatus:    KYC pipeline status enum
 *  - calloutFee:   flat emergency call-out charge
 *  - totalReviews: raw review count (previously called reviewsCount)
 *  - currentSocketId: live WebSocket connection tracking
 *  - devicePushToken: FCM push token for offline pings
 */

const mongoose = require("mongoose");

const workerSchema = new mongoose.Schema(
  {
    workerId:   { type: String, required: true, unique: true, index: true },
    name:       { type: String, required: true, trim: true },
    phone:      { type: String, required: true, trim: true },
    occupation: { type: String, required: true },
    category:   { type: String, required: true, index: true },
    skills:     [{ type: String }],

    // ── Pricing ──────────────────────────────────────────────────────────────
    visitingFee: { type: Number, default: 149 },
    hourlyRate:  { type: Number, default: 349 },
    calloutFee:  { type: Number, default: 199 }, // flat emergency dispatch fee

    // ── Reputation ───────────────────────────────────────────────────────────
    rating:       { type: Number, default: 4.8, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 }, // alias kept for backward-compat
    jobsCompleted:{ type: Number, default: 0 },
    trustScore:   { type: Number, default: 90, min: 0, max: 100 },
    experience:   { type: String, default: "2+ years" },
    badge:        { type: String, enum: ["Legendary", "Expert", "Top Rated", "Verified"], default: "Verified" },

    // ── Status ───────────────────────────────────────────────────────────────
    isOnline:    { type: Boolean, default: true },
    isAvailable: { type: Boolean, default: true },
    isVerified:  { type: Boolean, default: false },

    // ── KYC Pipeline ─────────────────────────────────────────────────────────
    kycStatus: {
      type: String,
      enum: ["PENDING", "VERIFIED", "REJECTED"],
      default: "PENDING",
      index: true,
    },
    kycDocuments: [{ docType: String, docUrl: String, verifiedAt: Date }],

    // ── Location ─────────────────────────────────────────────────────────────
    location: { type: String, default: "Chandigarh" }, // human-readable

    /**
     * liveLocation — GeoJSON Point
     * Used for $nearSphere geospatial queries in SOS dispatch.
     * coordinates: [longitude, latitude]  ← GeoJSON order (lng first!)
     */
    liveLocation: {
      type: {
        type:        String,
        enum:        ["Point"],
        default:     "Point",
      },
      coordinates: { type: [Number], default: [76.7794, 30.7333] }, // [lng, lat]
    },

    // ── Real-Time Connectivity ────────────────────────────────────────────────
    currentSocketId:  { type: String, default: null },
    devicePushToken:  { type: String, default: null },

    // ── Emergency Capability ─────────────────────────────────────────────────
    emergencySupported: { type: Boolean, default: false },

    // ── Metadata ─────────────────────────────────────────────────────────────
    avatarUrl: { type: String, default: "" },
    bio:       { type: String, default: "" },
    is24x7:    { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Geospatial Index (required for $nearSphere) ───────────────────────────────
workerSchema.index({ liveLocation: "2dsphere" });

// ── Compound Indexes for common query patterns ────────────────────────────────
workerSchema.index({ category: 1, isAvailable: 1, kycStatus: 1 });
workerSchema.index({ isAvailable: 1, emergencySupported: 1, kycStatus: 1 });

// ── Virtual: startingPrice alias ──────────────────────────────────────────────
workerSchema.virtual("startingPrice").get(function () {
  return this.visitingFee || 149;
});

module.exports = mongoose.models.Worker || mongoose.model("Worker", workerSchema);

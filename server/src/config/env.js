/**
 * Skill-Link — Centralized Environment Configuration
 * All process.env reads are consolidated here.
 * Every key has a documented fallback for zero-config local development.
 */

const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  PORT: parseInt(process.env.PORT, 10) || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",

  // ── Database ────────────────────────────────────────────────────────────────
  // Single canonical export: MONGODB_URI (db.js uses this key)
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/skilllink",

  // ── WebSocket ───────────────────────────────────────────────────────────────
  WS_PORT: parseInt(process.env.WS_PORT, 10) || 5001,

  // ── AI Provider Selection ───────────────────────────────────────────────────
  // "openrouter" | "gemini" | "groq"
  AI_PROVIDER: process.env.AI_PROVIDER || "openrouter",

  // Primary: OpenRouter (free tier supported)
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || "",
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || "openrouter/auto",

  // Backup: Google Gemini
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-1.5-flash",

  // Fast inference: Groq LPU
  GROQ_API_KEY: process.env.GROQ_API_KEY || "",
  GROQ_MODEL: process.env.GROQ_MODEL || "llama-3.1-8b-instant",

  // ── Vector DB & Embeddings ──────────────────────────────────────────────────
  EMBEDDING_PROVIDER: process.env.EMBEDDING_PROVIDER || "local",
  QDRANT_URL: process.env.QDRANT_URL || "",
  QDRANT_API_KEY: process.env.QDRANT_API_KEY || "",

  // ── Auth & Security ─────────────────────────────────────────────────────────
  JWT_SECRET: process.env.JWT_SECRET || "skilllink-dev-secret-change-in-prod",

  // ── SMS Gateway (Twilio / Kaleyra / Gupshup) ───────────────────────────────
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || "",
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || "",
  TWILIO_FROM_NUMBER: process.env.TWILIO_FROM_NUMBER || "+14155552671",
  SMS_GATEWAY_SHORTCODE: process.env.SMS_GATEWAY_SHORTCODE || "+911234567890",
  SMS_WEBHOOK_SECRET: process.env.SMS_WEBHOOK_SECRET || "skilllink-sms-secret",

  // ── Redis (Distributed Dispatch Lock) ──────────────────────────────────────
  REDIS_URL: process.env.REDIS_URL || "",

  // ── SOS Dispatch ────────────────────────────────────────────────────────────
  SOS_STAGE1_RADIUS_KM: parseFloat(process.env.SOS_STAGE1_RADIUS_KM) || 5,
  SOS_STAGE2_RADIUS_KM: parseFloat(process.env.SOS_STAGE2_RADIUS_KM) || 10,
  SOS_STAGE1_TIMEOUT_MS: parseInt(process.env.SOS_STAGE1_TIMEOUT_MS, 10) || 15000,
  SOS_STAGE2_TIMEOUT_MS: parseInt(process.env.SOS_STAGE2_TIMEOUT_MS, 10) || 30000,
};

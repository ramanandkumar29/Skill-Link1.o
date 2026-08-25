/**
 * Lexi Master Controller
 * Multi-Provider AI Gateway (OpenRouter -> Gemini -> Groq -> Local Semantic Engine)
 */

const env = require("../config/env");
const { callOpenRouterAI } = require("../services/openrouter.service");
const { callGeminiAI } = require("../services/gemini.service");
const { callGroqAI } = require("../services/groq.service");

// Tools
const searchWorkersTool = require("../tools/searchWorkers.tool");
const workerDetailsTool = require("../tools/workerDetails.tool");
const availabilityTool = require("../tools/availability.tool");
const getServicesTool = require("../tools/getServices.tool");
const bookingTool = require("../tools/booking.tool");
const bookingStatusTool = require("../tools/bookingStatus.tool");
const getUserBookingsTool = require("../tools/getUserBookings.tool");

const TOOLS_MAP = {
  searchWorkers: searchWorkersTool,
  search_workers: searchWorkersTool,
  getWorkerDetails: workerDetailsTool,
  get_worker_details: workerDetailsTool,
  checkWorkerAvailability: availabilityTool,
  checkAvailability: availabilityTool,
  getServices: getServicesTool,
  createBooking: bookingTool,
  getBookingStatus: bookingStatusTool,
  getUserBookings: getUserBookingsTool
};

const TOOLS_DEFS = [
  searchWorkersTool.definition,
  workerDetailsTool.definition,
  availabilityTool.definition,
  getServicesTool.definition,
  bookingTool.definition,
  bookingStatusTool.definition,
  getUserBookingsTool.definition
];

async function chatHandler(req, res) {
  const startTime = Date.now();
  const { messages = [], userId = "guest_user", userContext = {} } = req.body;

  let aiResult = null;
  let primaryProvider = env.AI_PROVIDER || "openrouter";

  // 1. Try Primary Configured Provider
  if (primaryProvider === "openrouter" && env.OPENROUTER_API_KEY) {
    try {
      aiResult = await callOpenRouterAI(messages, userContext);
    } catch (e) {
      console.warn("OpenRouter provider failed, falling back to backup:", e.message);
    }
  } else if (primaryProvider === "gemini" && env.GEMINI_API_KEY) {
    try {
      aiResult = await callGeminiAI(messages, TOOLS_MAP, TOOLS_DEFS);
    } catch (e) {
      console.warn("Gemini provider failed, falling back to backup:", e.message);
    }
  } else if (primaryProvider === "groq" && env.GROQ_API_KEY) {
    try {
      aiResult = await callGroqAI(messages, TOOLS_MAP, TOOLS_DEFS);
    } catch (e) {
      console.warn("Groq provider failed, falling back to backup:", e.message);
    }
  }

  // 2. Cascade Fallback Providers if Primary not available or failed
  if (!aiResult && env.OPENROUTER_API_KEY) {
    try {
      aiResult = await callOpenRouterAI(messages, userContext);
    } catch (e) {}
  }

  if (!aiResult && env.GEMINI_API_KEY) {
    try {
      aiResult = await callGeminiAI(messages, TOOLS_MAP, TOOLS_DEFS);
    } catch (e) {}
  }

  if (!aiResult && env.GROQ_API_KEY) {
    try {
      aiResult = await callGroqAI(messages, TOOLS_MAP, TOOLS_DEFS);
    } catch (e) {}
  }

  // 3. Resilient Built-in Semantic Engine (Offline / Free Development Mode)
  if (!aiResult) {
    aiResult = await callOpenRouterAI(messages, userContext); // executes deterministic fallback
  }

  return res.json({
    success: true,
    reply: aiResult.reply,
    intent: aiResult.intent || (aiResult.toolCalled ? "service_request" : "conversation"),
    toolCalled: aiResult.toolCalled || null,
    toolArgs: aiResult.toolArgs || null,
    toolResult: aiResult.toolResult || null,
    provider: aiResult.provider || "Skill-Link Intelligence",
    latencyMs: Date.now() - startTime
  });
}

module.exports = {
  chatHandler,
  TOOLS_MAP,
  TOOLS_DEFS
};

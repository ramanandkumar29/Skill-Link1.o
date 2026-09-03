/**
 * Context Builder — Skill-Link Lexi AI
 * Assembles layered, optimized context (RAG + Structured State + Summary + Sliding Window Messages) for LLM prompts.
 */

const { RECENT_WINDOW_TURNS, SUMMARY_TRIGGER_THRESHOLD } = require("./config");
const { getSessionState, updateSessionState } = require("./structuredState");
const { summarizeOlderMessages } = require("./summarizer");
const { LEXI_SYSTEM_PROMPT } = require("../lexi.prompt");

/**
 * Builds optimized messages array and context payload
 * @param {Array<{ role: string, content: string }>} rawMessages
 * @param {string} sessionId
 * @param {string} [ragContext]
 * @returns {{ fullPromptMessages: Array, structuredState: Object, recentMessages: Array }}
 */
function buildOptimizedContext(rawMessages = [], sessionId = "default_session", ragContext = "") {
  const state = getSessionState(sessionId);

  // 1. Sanitize raw messages
  const sanitized = (rawMessages || [])
    .filter((m) => m && typeof m.content === "string" && m.content.trim().length > 0)
    .map((m) => ({
      role: m.role === "assistant" || m.role === "model" ? "assistant" : "user",
      content: String(m.content).trim(),
    }));

  let recentMessages = sanitized;

  // 2. Multi-turn sliding window & summarization
  if (sanitized.length > SUMMARY_TRIGGER_THRESHOLD) {
    const splitIndex = sanitized.length - RECENT_WINDOW_TURNS;
    const older = sanitized.slice(0, splitIndex);
    recentMessages = sanitized.slice(splitIndex);

    // Update conversation summary
    const updatedSummary = summarizeOlderMessages(older, state.conversationSummary);
    if (updatedSummary !== state.conversationSummary) {
      updateSessionState(sessionId, { conversationSummary: updatedSummary });
    }
  }

  // 3. Construct Structured Context String
  const stateDirectives = [];

  if (state.activeSearch?.trade) {
    stateDirectives.push(`Active Search Trade: "${state.activeSearch.trade}"`);
  }
  if (state.activeSearch?.location) {
    stateDirectives.push(`Active User Location: "${state.activeSearch.location}"`);
  }
  if (state.activeSearch?.filters) {
    const f = state.activeSearch.filters;
    const activeFilters = [];
    if (f.affordable) activeFilters.push("Affordable pricing");
    if (f.bestRated) activeFilters.push("Top ratings");
    if (f.experienced) activeFilters.push("Senior experience");
    if (activeFilters.length > 0) {
      stateDirectives.push(`User Active Preferences: ${activeFilters.join(", ")}`);
    }
  }
  if (state.pendingDraft) {
    stateDirectives.push(
      `Pending Booking Draft: Worker="${state.pendingDraft.workerName}", Service="${state.pendingDraft.serviceType}", Date="${state.pendingDraft.date}", Time="${state.pendingDraft.time}" (Awaiting explicit confirmation)`
    );
  }
  if (state.conversationSummary) {
    stateDirectives.push(`Conversation Summary: ${state.conversationSummary}`);
  }

  const structuredContextBlock = stateDirectives.length > 0
    ? `\n\n[STRUCTURED SESSION MEMORY]\n${stateDirectives.map((s) => `• ${s}`).join("\n")}`
    : "";

  // 4. Combine Dynamic System Prompt
  let systemPromptContent = LEXI_SYSTEM_PROMPT;
  if (ragContext) {
    systemPromptContent += `\n\n${ragContext}`;
  }
  if (structuredContextBlock) {
    systemPromptContent += structuredContextBlock;
  }

  const fullPromptMessages = [
    { role: "system", content: systemPromptContent },
    ...recentMessages,
  ];

  return {
    fullPromptMessages,
    structuredState: state,
    recentMessages,
  };
}

module.exports = {
  buildOptimizedContext,
};

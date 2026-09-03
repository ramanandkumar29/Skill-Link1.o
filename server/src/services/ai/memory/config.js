/**
 * Lexi AI Memory & Context Configuration
 */

module.exports = {
  // Number of recent message turns to include directly in LLM context
  RECENT_WINDOW_TURNS: 8,

  // Message count threshold after which older messages are compressed into a summary
  SUMMARY_TRIGGER_THRESHOLD: 10,

  // Max characters allowed for the running conversation summary
  MAX_SUMMARY_LENGTH: 400,

  // Inactivity timeout for session memory (30 minutes)
  SESSION_TTL_MS: 30 * 60 * 1000,

  // Inactivity timeout for pending booking drafts (15 minutes)
  BOOKING_DRAFT_TTL_MS: 15 * 60 * 1000,
};

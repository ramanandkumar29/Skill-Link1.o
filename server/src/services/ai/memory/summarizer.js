/**
 * Conversation Summarizer — Skill-Link Lexi AI
 * Periodically compresses older conversational history into concise, factual context.
 */

const { MAX_SUMMARY_LENGTH } = require("./config");

/**
 * Generates an extractive factual summary of older turns
 * @param {Array<{ role: string, content: string }>} olderMessages
 * @param {string} existingSummary
 * @returns {string}
 */
function summarizeOlderMessages(olderMessages = [], existingSummary = "") {
  if (!Array.isArray(olderMessages) || olderMessages.length === 0) {
    return existingSummary;
  }

  const keyFacts = [];

  for (const msg of olderMessages) {
    const text = (msg.content || "").toLowerCase();

    // Track trade mentions
    const tradeMatch = text.match(/(plumber|electrician|mechanic|ac repair|ac service|mason|cleaning|ro repair|water purifier)/i);
    if (tradeMatch && !keyFacts.some((f) => f.includes(tradeMatch[0]))) {
      keyFacts.push(`User inquired about ${tradeMatch[0]}`);
    }

    // Track location mentions
    const locMatch = text.match(/(sector\s*\d+|chandigarh|mohali|panchkula|near me)/i);
    if (locMatch && !keyFacts.some((f) => f.includes(locMatch[0]))) {
      keyFacts.push(`Location context: ${locMatch[0]}`);
    }

    // Track price/rating preferences
    if (text.includes("cheaper") || text.includes("affordable") || text.includes("sasta")) {
      keyFacts.push("User preferred affordable pricing");
    }
    if (text.includes("top rated") || text.includes("highest rated") || text.includes("best")) {
      keyFacts.push("User preferred highly rated workers");
    }
    if (text.includes("experienced") || text.includes("senior")) {
      keyFacts.push("User preferred experienced professionals");
    }

    // Track booking actions
    if (text.includes("confirm") || text.includes("booking")) {
      keyFacts.push("User discussed service booking");
    }
  }

  const newSummaryItems = Array.from(new Set(keyFacts));
  if (newSummaryItems.length === 0) return existingSummary;

  const combined = existingSummary
    ? `${existingSummary}. Earlier context: ${newSummaryItems.join(", ")}`
    : `Prior context: ${newSummaryItems.join(", ")}`;

  return combined.slice(0, MAX_SUMMARY_LENGTH);
}

module.exports = {
  summarizeOlderMessages,
};

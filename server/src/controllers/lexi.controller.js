/**
 * Lexi AI Controller — Skill-Link Production Ready
 * Production error boundary, request validation, privacy-safe logging, and memory lifecycle handlers.
 */

const { generateLexiResponse, resetConversationMemory } = require("../services/ai/ai.service");

/**
 * POST /api/lexi/chat
 * Body: { messages: Array<{ role: string, content: string }>, userContext?: Object }
 */
async function chatHandler(req, res) {
  const startTime = Date.now();

  try {
    const { messages = [], userContext = {} } = req.body;

    // 1. Payload validation
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid request payload. 'messages' must be a non-empty array of objects.",
      });
    }

    // 2. Timeout protection (15 seconds)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out. Please try again.")), 15000)
    );

    // 3. Dispatch to AI orchestrator with timeout race
    const result = await Promise.race([
      generateLexiResponse(messages, { userContext }),
      timeoutPromise,
    ]);

    const latencyMs = Date.now() - startTime;

    // 4. Privacy-safe audit log (masks sensitive context)
    console.log(
      `[Lexi API] /chat completed in ${latencyMs}ms | Provider: ${result.provider || "Local"} | Tool: ${
        result.toolCalled || "none"
      }`
    );

    return res.status(result.success ? 200 : 200).json({
      ...result,
      latencyMs,
    });
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    console.error(`[Lexi API Error] (${latencyMs}ms):`, error.message);

    // Production safe error message (no leaked stack traces)
    return res.status(200).json({
      success: false,
      reply: "I am having trouble processing your request right now. Please try again in a moment.",
      provider: "Skill-Link Error Boundary",
      isError: true,
      error: error.message || "Failed to process request.",
      latencyMs,
    });
  }
}

/**
 * POST /api/lexi/clear
 * Body: { userId?: string, sessionId?: string }
 */
async function clearHandler(req, res) {
  try {
    const sessionId = req.body.userId || req.body.sessionId || "default_session";
    resetConversationMemory(sessionId);
    console.log(`[Lexi API] /clear executed for session '${sessionId}'`);
    return res.status(200).json({
      success: true,
      message: `Memory and context cleared for session '${sessionId}'.`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to reset session memory.",
    });
  }
}

module.exports = {
  chatHandler,
  clearHandler,
};

const { callOpenRouterAI } = require("../services/openrouter.service");

async function chatHandler(req, res) {
  const startTime = Date.now();
  try {
    const { messages = [] } = req.body;
    const aiResult = await callOpenRouterAI(messages);

    return res.json({
      success: true,
      reply: aiResult.reply,
      toolCalled: aiResult.toolCalled || null,
      toolResult: aiResult.toolOutput || null,
      provider: aiResult.provider || "Lexi AI",
      latencyMs: Date.now() - startTime
    });
  } catch (error) {
    console.error("Error in lexi.controller chatHandler:", error);
    return res.status(500).json({
      success: false,
      error: "I am having trouble processing that right now.",
      latencyMs: Date.now() - startTime
    });
  }
}

module.exports = { chatHandler };

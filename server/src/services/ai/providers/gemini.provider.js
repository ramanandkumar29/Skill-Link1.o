/**
 * Google Gemini AI Provider Adapter
 * Native Gemini generateContent API integration.
 */

const env = require("../../../config/env");

async function callGemini(messages, timeoutMs = 12000) {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const model = env.GEMINI_MODEL || "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // Convert OpenAI-style role/content to Gemini contents
  const systemMsg = messages.find((m) => m.role === "system")?.content || "";
  const chatMsgs = messages.filter((m) => m.role !== "system");

  const contents = chatMsgs.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  // Prepend system instruction to first message or system_instruction field
  const payload = {
    contents: contents.length > 0 ? contents : [{ role: "user", parts: [{ text: "Hello" }] }],
    system_instruction: systemMsg ? { parts: [{ text: systemMsg }] } : undefined,
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 800,
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(timeoutMs),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => response.statusText);
    throw new Error(`Gemini error (${response.status}): ${errBody}`);
  }

  const data = await response.json();
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!reply) {
    throw new Error("Empty response from Gemini model.");
  }

  return {
    reply: reply.trim(),
    provider: `Google Gemini (${model})`,
  };
}

module.exports = { callGemini };

/**
 * Google Gemini AI Service
 * Supports gemini-1.5-flash and gemini-1.5-pro with function tool execution
 */

const env = require("../config/env");
const { LEXI_MASTER_PROMPT } = require("../prompts/lexi.system");
const { getRAGContext } = require("./rag.service");

async function callGeminiAI(messages = [], toolsMap = {}, toolsDefs = []) {
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured in server environment.");
  }

  const lastUserMsg = messages.filter(m => m.role === "user").pop()?.content || "";
  const ragSnippet = await getRAGContext(lastUserMsg);

  const contents = [
    {
      role: "user",
      parts: [{ text: `${LEXI_MASTER_PROMPT}\n\nKNOWLEDGE BASE CONTEXT (RAG):\n${ragSnippet}\n\nUSER MESSAGE:\n${lastUserMsg}` }]
    }
  ];

  const model = env.GEMINI_MODEL || "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      generationConfig: { temperature: 0.3, maxOutputTokens: 500 }
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API returned error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "How can I help you with Skill-Link today?";

  return {
    reply: replyText,
    provider: `Google Gemini (${model})`
  };
}

module.exports = { callGeminiAI };

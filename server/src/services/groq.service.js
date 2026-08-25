/**
 * Groq Fast AI Service
 * Ultra-low latency inference using LLaMA 3.1 8B Instant on Groq LPUs
 */

const env = require("../config/env");
const { LEXI_MASTER_PROMPT } = require("../prompts/lexi.system");
const { getRAGContext } = require("./rag.service");

async function callGroqAI(messages = [], toolsMap = {}, toolsDefs = []) {
  if (!env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured in server environment.");
  }

  const lastUserMsg = messages.filter(m => m.role === "user").pop()?.content || "";
  const ragSnippet = await getRAGContext(lastUserMsg);

  const systemMessage = {
    role: "system",
    content: `${LEXI_MASTER_PROMPT}\n\nKNOWLEDGE BASE CONTEXT (RAG):\n${ragSnippet}`
  };

  const payloadMessages = [systemMessage, ...messages];
  const model = env.GROQ_MODEL || "llama-3.1-8b-instant";

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model,
      messages: payloadMessages,
      tools: toolsDefs.length > 0 ? toolsDefs : undefined,
      temperature: 0.3,
      max_tokens: 450
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API returned error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0];

  return {
    reply: choice?.message?.content || "How can I help you today?",
    provider: `Groq LPU (${model})`
  };
}

module.exports = { callGroqAI };

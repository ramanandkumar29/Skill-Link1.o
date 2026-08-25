const env = require("../config/env");
const { LEXI_MASTER_PROMPT } = require("../prompts/lexi.system");
const { getRAGContext } = require("./rag.service");

// Tools
const searchWorkersTool = require("../tools/searchWorkers.tool");
const workerDetailsTool = require("../tools/workerDetails.tool");
const availabilityTool = require("../tools/availability.tool");
const bookingTool = require("../tools/booking.tool");
const bookingStatusTool = require("../tools/bookingStatus.tool");

const TOOLS_MAP = {
  searchWorkers: searchWorkersTool,
  getWorkerDetails: workerDetailsTool,
  checkAvailability: availabilityTool,
  createBooking: bookingTool,
  getBookingStatus: bookingStatusTool
};

const TOOLS_DEFINITIONS = Object.values(TOOLS_MAP).map(t => t.definition);

async function callOpenRouterAI(messages = []) {
  const lastUserMsg = messages.filter(m => m.role === "user").pop()?.content || "";
  const ragSnippet = getRAGContext(lastUserMsg);

  const systemMessage = {
    role: "system",
    content: `${LEXI_MASTER_PROMPT}\n\nKNOWLEDGE BASE CONTEXT (RAG):\n${ragSnippet}`
  };

  const payloadMessages = [systemMessage, ...messages];

  if (!env.OPENROUTER_API_KEY) {
    return handleDeterministicFallback(lastUserMsg);
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://skilllink.ai",
        "X-Title": "SkillLink Express AI"
      },
      body: JSON.stringify({
        model: env.OPENROUTER_MODEL,
        messages: payloadMessages,
        tools: TOOLS_DEFINITIONS,
        tool_choice: "auto",
        temperature: 0.3
      })
    });

    if (response.ok) {
      const data = await response.json();
      const choice = data.choices?.[0];

      // Handle Tool Call
      if (choice?.message?.tool_calls && choice.message.tool_calls.length > 0) {
        const toolCall = choice.message.tool_calls[0];
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments || "{}");

        if (TOOLS_MAP[toolName]) {
          const toolOutput = await TOOLS_MAP[toolName].execute(toolArgs);
          return {
            reply: choice.message.content || `Executed ${toolName} with real backend data.`,
            toolCalled: toolName,
            toolOutput,
            provider: "OpenRouter LLM + Tool Calling"
          };
        }
      }

      return {
        reply: choice?.message?.content || "How can I help you?",
        provider: "OpenRouter LLM"
      };
    }
  } catch (e) {
    console.warn("OpenRouter API error, cascading to deterministic engine:", e);
  }

  return handleDeterministicFallback(lastUserMsg);
}

async function handleDeterministicFallback(query = "") {
  const q = query.toLowerCase();

  if (q.includes("kaise ho") || q.includes("kya haal")) {
    return { reply: "Main theek hoon. Aap batao, kaise help kar sakta hoon?", provider: "Deterministic Engine" };
  }
  if (q.includes("car") || q.includes("breakdown") || q.includes("mechanic")) {
    if (q.includes("chandigarh") || q.includes("delhi") || q.includes("sector")) {
      const toolOutput = await searchWorkersTool.execute({ category: "mechanic_car", location: "Chandigarh" });
      return {
        reply: "Okay. Chandigarh mein mechanic service ke liye available workers check karta hoon.",
        toolCalled: "searchWorkers",
        toolOutput,
        provider: "Deterministic Engine + Tool Dispatch"
      };
    }
    return { reply: "Samajh gaya. Aapko mechanic ki help chahiye. Aapki current location kya hai?", provider: "Deterministic Engine" };
  }
  if (q.includes("plumber") || q.includes("leak") || q.includes("pipe")) {
    return { reply: "Sure. Aapko plumber kis location par chahiye?", provider: "Deterministic Engine" };
  }
  if (q.includes("javascript")) {
    return { reply: "JavaScript is a programming language widely used to create interactive web applications.", provider: "Deterministic Engine" };
  }

  return { reply: "Hey! How can I help you today?", provider: "Deterministic Engine" };
}

module.exports = { callOpenRouterAI };

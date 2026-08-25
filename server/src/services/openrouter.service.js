/**
 * OpenRouter AI Service with RAG + 2-Step Agentic Tool Calling
 */

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
  search_workers: searchWorkersTool,
  getWorkerDetails: workerDetailsTool,
  get_worker_details: workerDetailsTool,
  checkAvailability: availabilityTool,
  check_availability: availabilityTool,
  createBooking: bookingTool,
  create_booking: bookingTool,
  getBookingStatus: bookingStatusTool,
  get_booking_status: bookingStatusTool
};

const TOOLS_DEFINITIONS = [
  searchWorkersTool.definition,
  workerDetailsTool.definition,
  availabilityTool.definition,
  bookingTool.definition,
  bookingStatusTool.definition
];

/**
 * Main Lexi Brain Orchestrator:
 * 1. Retrieve Knowledge (RAG)
 * 2. Send Message + RAG + Tools to LLM
 * 3. If Tool Called: Execute -> Send Tool Result back to LLM -> Return Natural Response
 */
async function callOpenRouterAI(messages = [], userContext = {}) {
  const lastUserMsg = messages.filter(m => m.role === "user").pop()?.content || "";
  
  // 1. RAG Context Retrieval
  const ragSnippet = getRAGContext(lastUserMsg);

  const systemMessage = {
    role: "system",
    content: `${LEXI_MASTER_PROMPT}\n\nKNOWLEDGE BASE CONTEXT (RAG):\n${ragSnippet}`
  };

  const payloadMessages = [systemMessage, ...messages];

  // If no API key configured, use intelligent deterministic fallback
  if (!env.OPENROUTER_API_KEY) {
    return handleDeterministicFallback(lastUserMsg, userContext);
  }

  try {
    // 2. First LLM Turn: User Query + Tools
    const firstRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://skilllink.ai",
        "X-Title": "SkillLink Master AI"
      },
      body: JSON.stringify({
        model: env.OPENROUTER_MODEL,
        messages: payloadMessages,
        tools: TOOLS_DEFINITIONS,
        tool_choice: "auto",
        temperature: 0.3
      })
    });

    if (firstRes.ok) {
      const firstData = await firstRes.json();
      const choice = firstData.choices?.[0];
      const toolCalls = choice?.message?.tool_calls;

      // 3. If LLM requested Tool Calling
      if (toolCalls && toolCalls.length > 0) {
        const toolCall = toolCalls[0];
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments || "{}");

        let toolOutput = null;
        if (TOOLS_MAP[toolName]) {
          toolOutput = await TOOLS_MAP[toolName].execute(toolArgs);
        }

        // 4. Second LLM Turn: Send Tool Result back to LLM for synthesis
        const followUpMessages = [
          ...payloadMessages,
          choice.message,
          {
            role: "tool",
            tool_call_id: toolCall.id,
            name: toolName,
            content: JSON.stringify(toolOutput || {})
          }
        ];

        try {
          const secondRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
              "HTTP-Referer": "https://skilllink.ai",
              "X-Title": "SkillLink Master AI"
            },
            body: JSON.stringify({
              model: env.OPENROUTER_MODEL,
              messages: followUpMessages,
              temperature: 0.3
            })
          });

          if (secondRes.ok) {
            const secondData = await secondRes.json();
            const finalReply = secondData.choices?.[0]?.message?.content;
            return {
              reply: finalReply,
              toolCalled: toolName,
              toolArgs,
              toolResult: toolOutput,
              provider: "OpenRouter LLM + Multi-Turn Tool Execution"
            };
          }
        } catch (e2) {
          console.warn("Second-turn LLM synthesis error, returning tool output directly:", e2);
        }

        return {
          reply: choice.message.content || `Found matching options for ${toolArgs.category || "your request"}.`,
          toolCalled: toolName,
          toolArgs,
          toolResult: toolOutput,
          provider: "OpenRouter LLM + Tool Execution"
        };
      }

      // Normal response without tool call
      return {
        reply: choice?.message?.content || "How can I help you?",
        provider: "OpenRouter LLM"
      };
    }
  } catch (e) {
    console.warn("OpenRouter API error, falling back:", e);
  }

  return handleDeterministicFallback(lastUserMsg, userContext);
}

async function handleDeterministicFallback(query = "", userContext = {}) {
  const q = query.toLowerCase().trim();

  // 1. Natural Hinglish check-ins ("Mai bhi thik hu", "Sab badhiya", "Great here")
  if (
    q.includes("mai bhi thik") ||
    q.includes("mai bhi theek") ||
    q.includes("main bhi theek") ||
    q.includes("main bhi thik") ||
    q.includes("hum bhi theek") ||
    q.includes("sab badhiya") ||
    q.includes("sab theek") ||
    q.includes("sab mast") ||
    q.includes("theek hu") ||
    q.includes("thik hu") ||
    q.includes("badhiya hu") ||
    q.includes("i am good") ||
    q.includes("im good") ||
    q.includes("doing well") ||
    q.includes("all good") ||
    q === "badhiya" ||
    q === "mast" ||
    q === "thik" ||
    q === "theek" ||
    q === "fine" ||
    q === "good"
  ) {
    return {
      reply: "Sunkar accha laga! Bataiye, aaj main aapki kya madad kar sakti hoon?",
      provider: "Skill-Link Intelligence"
    };
  }

  // 2. Greetings & Status inquiries
  if (q.includes("kaise ho") || q.includes("kya haal") || q.includes("kaisa hai")) {
    return { reply: "Main theek hoon. Aap batao, kaise help kar sakta hoon?", provider: "Skill-Link Intelligence" };
  }
  if (q === "hi" || q === "hello" || q === "hey" || q === "namaste") {
    return { reply: "Hey! Kaise help kar sakta hoon?", provider: "Skill-Link Intelligence" };
  }
  if (q.includes("how are you")) {
    return { reply: "I'm doing great, thank you! How can I help you today?", provider: "Skill-Link Intelligence" };
  }
  if (q.includes("aur batao") || q.includes("kya chal raha") || q.includes("whats up") || q === "sup") {
    return { reply: "Bas sab badhiya! Aap batao, aaj koi kaam ya sawaal hai?", provider: "Skill-Link Intelligence" };
  }
  if (q.includes("thank") || q.includes("shukriya") || q.includes("dhanyawad")) {
    return { reply: "Aapka swagat hai! Kisi aur cheez mein madad chahiye toh zaroor batayein.", provider: "Skill-Link Intelligence" };
  }

  // 3. Service Inquiries via Seeded NLP Dictionary
  const { matchServiceFromText } = require("../seed/serviceAliases.seed");
  const serviceMatch = matchServiceFromText(q);

  if (serviceMatch) {
    const loc = userContext.location || (q.includes("chandigarh") ? "Chandigarh" : (q.includes("delhi") ? "Delhi" : null));
    const cat = serviceMatch.category;

    if (loc) {
      const toolOutput = await searchWorkersTool.execute({ category: cat, location: loc });
      return {
        reply: `Bilkul! ${loc} mein ${cat.replace(/_/g, " ")} ke liye verified workers check karta hoon.`,
        intent: "service_request",
        toolCalled: "searchWorkers",
        toolResult: toolOutput,
        provider: "Skill-Link Intelligence + Tool Dispatch"
      };
    } else {
      return {
        reply: `Samajh gaya. ${cat.replace(/_/g, " ")} service ke liye aapki current location kya hai?`,
        intent: "service_request",
        provider: "Skill-Link Intelligence"
      };
    }
  }

  // 4. Platform Questions
  if (q.includes("skill-link") || q.includes("skill link")) {
    return {
      reply: "Skill-Link ek AI-powered service marketplace hai jo aapko instant verified local technicians (plumbers, electricians, mechanics, etc.) se connect karta hai.",
      intent: "skill_link_question",
      provider: "Skill-Link Intelligence"
    };
  }

  if (q.includes("what is javascript") || q.includes("what is js")) {
    return { reply: "JavaScript is a lightweight, interpreted programming language widely used to build interactive websites.", provider: "Skill-Link Intelligence" };
  }

  return { reply: "Hey! Aap batao, aaj main aapki kya madad kar sakta hoon?", intent: "conversation", provider: "Skill-Link Intelligence" };
}

module.exports = { callOpenRouterAI };

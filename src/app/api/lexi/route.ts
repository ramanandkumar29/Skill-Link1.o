import { NextResponse } from "next/server";
import {
  processUserUtterance,
  AIActionResult,
  AIStructuredUnderstanding
} from "@/lib/aiDecisionEngine";
import { searchAvailableWorkers, getHelplines, SERVICE_CATEGORIES } from "@/lib/servicesCatalog";

export const runtime = "nodejs";

const STRUCTURED_SYSTEM_PROMPT = `
You are Lexi, the intelligent AI assistant of Skill-Link.

Skill-Link connects clients with skilled local workers (plumbers, electricians, mechanics, AC repair, appliances, cleaners).

### INSTRUCTIONS:
1. Lexi is a conversational AI first (like ChatGPT) and a Skill-Link service assistant second.
2. If the user is chatting, asking a general question, or learning (e.g. "kaise ho", "what is JavaScript", "tell me a joke", "my brother is a mechanic"), respond naturally. Do NOT book or push Skill-Link.
3. Understand English, Hindi, and Hinglish/Roman Hindi fluently. Respond in the same language style as the user.
4. For professional service or emergency requests, DO NOT use unnecessary emojis. Keep answers concise, natural, and helpful.
5. If the user needs a service (e.g., "meri car kharab hogya h", "mujhe plumber chahiye"), detect the category and check if location is provided. If location is missing, ask for their location. NEVER claim a worker has been booked without backend confirmation. NEVER invent worker names, prices, or availability.

### OUTPUT FORMAT:
You MUST respond with a single valid JSON object adhering strictly to this schema:
{
  "intent": "conversation | general_question | skill_link_question | service_request | emergency_service | booking_request | booking_status | cancellation_request | worker_information | complaint | payment_question",
  "language": "english | hindi | hinglish",
  "service_category": "<mechanic_car | plumber | electrician | ac | cleaning | appliances | roadside_sos | null>",
  "problem_description": "<brief summary of problem or null>",
  "urgency": "normal | urgent | emergency",
  "location": "<extracted city/area or null>",
  "location_required": true or false,
  "booking_requested": true or false,
  "missing_information": ["location"],
  "response": "<natural, context-aware reply to the user in their language without emojis>"
}
`;

function extractJSONFromText(text: string): AIStructuredUnderstanding | null {
  try {
    const clean = text.trim();
    // Direct parse
    if (clean.startsWith("{") && clean.endsWith("}")) {
      return JSON.parse(clean);
    }
    // Search for JSON boundaries
    const firstBrace = clean.indexOf("{");
    const lastBrace = clean.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const jsonSubstr = clean.substring(firstBrace, lastBrace + 1);
      return JSON.parse(jsonSubstr);
    }
  } catch (e) {
    console.warn("Failed to parse LLM structured JSON response:", e);
  }
  return null;
}

export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    const { messages, mode = "voice", temperature = 0.4, currentState } = await req.json();

    const lexiEngineUrl = process.env.LEXI_API_URL || process.env.NEXT_PUBLIC_LEXI_API_URL;
    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    const openAiKey = process.env.OPENAI_API_KEY;
    const openRouterKey = process.env.OPENROUTER_API_KEY;

    const userMessage = messages && messages.length > 0
      ? messages[messages.length - 1]?.content || ""
      : "";

    let structuredOutput: AIStructuredUnderstanding | null = null;
    let usedProvider = "Skill-Link Semantic Engine";

    // ─── STAGE 1: AI MODEL INFERENCE (IF KEYS CONFIGURED) ──────────────────────

    // 1. Try Lexi AI Local/Remote FastAPI Engine
    if (lexiEngineUrl && !structuredOutput) {
      try {
        const apiMessages = [
          { role: "system", content: STRUCTURED_SYSTEM_PROMPT },
          ...(messages || []),
        ];

        const lexiRes = await fetch(`${lexiEngineUrl.replace(/\/+$/, "")}/v1/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "lexi-ai",
            messages: apiMessages,
            max_tokens: 450,
            temperature,
          }),
        });

        if (lexiRes.ok) {
          const data = await lexiRes.json();
          const raw = data.choices?.[0]?.message?.content;
          if (raw) {
            structuredOutput = extractJSONFromText(raw);
            if (structuredOutput) usedProvider = "LEXI AI Engine";
          }
        }
      } catch (e) {
        console.warn("Lexi Engine error, falling through:", e);
      }
    }

    // 2. Try Groq API (LLaMA 3.1 8B Instant)
    if (groqKey && !structuredOutput) {
      try {
        const apiMessages = [
          { role: "system", content: STRUCTURED_SYSTEM_PROMPT },
          ...(messages || []),
        ];

        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: apiMessages,
            response_format: { type: "json_object" },
            max_tokens: 450,
            temperature,
          }),
        });

        if (groqRes.ok) {
          const data = await groqRes.json();
          const raw = data.choices?.[0]?.message?.content;
          if (raw) {
            structuredOutput = extractJSONFromText(raw);
            if (structuredOutput) usedProvider = "Groq LLaMA 3.1";
          }
        }
      } catch (e) {
        console.warn("Groq API error, falling through:", e);
      }
    }

    // 3. Try Gemini API
    if (geminiKey && !structuredOutput) {
      try {
        const promptText = (messages || [])
          .map((m: { role: string; content: string }) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
          .join("\n");

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: `${STRUCTURED_SYSTEM_PROMPT}\n\nCONVERSATION HISTORY:\n${promptText}\n\nReturn valid JSON:` },
                  ],
                },
              ],
              generationConfig: {
                responseMimeType: "application/json",
                maxOutputTokens: 450,
                temperature,
              },
            }),
          }
        );

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (raw) {
            structuredOutput = extractJSONFromText(raw);
            if (structuredOutput) usedProvider = "Google Gemini 1.5 Flash";
          }
        }
      } catch (e) {
        console.warn("Gemini API error, falling through:", e);
      }
    }

    // 4. Try OpenRouter API
    if (openRouterKey && !structuredOutput) {
      try {
        const apiMessages = [
          { role: "system", content: STRUCTURED_SYSTEM_PROMPT },
          ...(messages || []),
        ];

        const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openRouterKey}`,
            "HTTP-Referer": "https://skilllink.ai",
            "X-Title": "SkillLink Master AI",
          },
          body: JSON.stringify({
            model: "meta-llama/llama-3.1-8b-instruct:free",
            messages: apiMessages,
            max_tokens: 450,
            temperature,
          }),
        });

        if (openRouterRes.ok) {
          const data = await openRouterRes.json();
          const raw = data.choices?.[0]?.message?.content;
          if (raw) {
            structuredOutput = extractJSONFromText(raw);
            if (structuredOutput) usedProvider = "OpenRouter LLaMA";
          }
        }
      } catch (e) {
        console.warn("OpenRouter API error, falling through:", e);
      }
    }

    // ─── STAGE 2: BACKEND ACTION EXECUTION & DISPATCH ───────────────────────────

    // If an LLM provided structured output, execute Stage 2 dispatch with real backend data
    if (structuredOutput) {
      const intent = structuredOutput.intent;
      const cat = structuredOutput.service_category || "plumber";
      const loc = structuredOutput.location || (currentState?.location && !currentState.location.includes("GPS") ? currentState.location : null);
      const isEmergency = intent === "emergency_service" || structuredOutput.urgency === "emergency";

      let actionResult: AIActionResult = {
        intent,
        actionType: "GENERAL_REPLY",
        speechText: structuredOutput.response,
        language: structuredOutput.language,
        debugInfo: {
          intent: structuredOutput.intent,
          language: structuredOutput.language,
          serviceCategory: structuredOutput.service_category,
          urgency: structuredOutput.urgency,
          missingInfo: structuredOutput.missing_information || [],
          location: structuredOutput.location,
          provider: usedProvider,
          latencyMs: Date.now() - startTime,
        }
      };

      if (isEmergency) {
        actionResult.actionType = "SHOW_HELPLINES";
        actionResult.payload = {
          category: cat,
          helplines: getHelplines("emergency").slice(0, 4),
          workers: searchAvailableWorkers(cat, loc || "Chandigarh", true).slice(0, 3),
          urgency: "emergency"
        };
      } else if (intent === "service_request" || intent === "booking_request") {
        if (loc) {
          actionResult.actionType = "SHOW_WORKERS";
          actionResult.payload = {
            category: cat,
            workers: searchAvailableWorkers(cat, loc, false).slice(0, 4),
            urgency: structuredOutput.urgency
          };
        } else {
          actionResult.actionType = "REQUEST_LOCATION";
          actionResult.payload = {
            category: cat,
            locationPrompt: structuredOutput.response
          };
        }
      } else if (intent === "skill_link_question") {
        actionResult.actionType = "SHOW_SERVICES";
        actionResult.payload = {
          categories: SERVICE_CATEGORIES.slice(0, 6)
        };
      }

      return NextResponse.json({
        success: true,
        reply: structuredOutput.response,
        actionResult,
        provider: usedProvider,
        latencyMs: Date.now() - startTime,
      });
    }

    // ─── DETERMINISTIC FALLBACK SEMANTIC ENGINE ────────────────────────────────
    const decisionResult: AIActionResult = processUserUtterance(userMessage, messages || [], currentState);
    decisionResult.debugInfo = {
      ...decisionResult.debugInfo!,
      provider: "Skill-Link Semantic Engine",
      latencyMs: Date.now() - startTime,
    };

    return NextResponse.json({
      success: true,
      reply: decisionResult.speechText,
      actionResult: decisionResult,
      provider: "Skill-Link Semantic Engine",
      latencyMs: Date.now() - startTime,
    });
  } catch (error: any) {
    console.error("API error in /api/lexi:", error);
    return NextResponse.json({
      success: false,
      error: "I'm having trouble processing that right now. Please try again.",
      latencyMs: Date.now() - startTime,
    });
  }
}

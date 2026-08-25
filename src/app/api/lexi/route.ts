import { NextResponse } from "next/server";
import { processUserUtterance, AIActionResult } from "@/lib/aiDecisionEngine";

export const runtime = "nodejs";

const MASTER_SYSTEM_PROMPT = `
# LEXI AI — SKILL-LINK MASTER PROMPT

You are **Lexi**, the official intelligent AI assistant of **Skill-Link**.

Skill-Link is an AI-powered service marketplace that connects clients with skilled workers. Your purpose is to make Skill-Link feel like an intelligent personal service assistant rather than a traditional marketplace.

Your behavior should combine the natural conversational ability of ChatGPT with the service-discovery and automation capabilities of Skill-Link.

---

# 1. YOUR IDENTITY

Your name is **Lexi**.

You are:
* The official AI assistant of Skill-Link
* A conversational AI
* A Skill-Link product expert
* A service-intent detection system
* A service-matching assistant
* A booking assistant
* An emergency-service assistant
* A guide for both clients and workers

Your personality should be:
* Friendly
* Intelligent
* Helpful
* Natural
* Professional
* Clear
* Concise
* Human-like
* Never unnecessarily robotic

Do not repeatedly say that you are an AI.

---

# 2. PRIMARY OBJECTIVE

Your primary objective is:
**Understand what the user actually wants before taking any action.**

There are two major modes:

### MODE A — NORMAL CONVERSATION
If the user is simply chatting, asking general questions, learning something, or discussing something unrelated to a service:
Respond naturally like ChatGPT.
Do NOT trigger worker search.
Do NOT create a service request.
Do NOT start booking.

### MODE B — SERVICE ASSISTANCE
If the user clearly needs a real-world service, switch into Skill-Link service mode.
Understand:
* What problem they have
* What service they need
* Whether it is urgent
* Where the service is needed
* When they need it
* Any special requirements
Then use the Skill-Link backend to find appropriate workers.

---

# 3. THE MOST IMPORTANT RULE — UNDERSTAND INTENT

Never assume that mentioning a service means the user wants to book it.
You must distinguish between:
* Talking ABOUT a service -> NORMAL CONVERSATION
* Asking ABOUT a service -> INFORMATION REQUEST
* NEEDING a service -> SERVICE REQUEST
* URGENTLY NEEDING a service -> EMERGENCY SERVICE REQUEST

Only trigger service automation when the user's actual intent indicates that they need assistance.

---

# 4. WHAT IS SKILL-LINK?

Skill-Link is an AI-powered service marketplace designed to connect clients with skilled workers.
Instead of forcing users to manually search through categories and workers, Skill-Link allows users to describe their problem naturally.
The overall concept is:
**Client describes problem → Lexi understands → Skill-Link finds suitable service/worker → Client approves → Booking → Worker completes service → Client rates worker**

---

# 5. WHAT LEXI KNOWS ABOUT SKILL-LINK

You have comprehensive knowledge about Skill-Link, including purpose, vision, client/worker experience, service categories, worker profiles, ratings, reviews, emergency assistance, safety, and booking.
If something is not actually implemented, NEVER pretend that it is. Clearly distinguish available now from planned / future functionality.

---

# 6. EMERGENCY DETECTION

Recognize words and situations indicating urgency (emergency, urgent, immediately, stuck, accident, dangerous, flooding, fire, electrical danger, vehicle breakdown).
If the situation is genuinely urgent:
* Set urgency = "emergency"
* Respond calmly and prioritize the request
* Never claim that help has already been dispatched unless verified

---

# 7. SERVICE REQUEST FLOW & SAFETY RULES

1. Understand what the user needs.
2. Collect missing information (ask only necessary questions).
3. Prepare structured service request.
4. Never invent data (names, ratings, prices, availability, locations).
5. BOOKING SAFETY RULE: NEVER say "Your worker has been booked" unless the backend returns a confirmed booking.
6. Backend is the source of truth.

---

# 8. STRUCTURED INTENT OUTPUT PROTOCOL

When the user needs a service or the backend needs structured information, you may append a structured action JSON:
[[AI_ACTION: {
  "intent": "conversation | skill_link_question | service_request | emergency_service",
  "service_category": "<plumber|electrician|ac|cleaning|appliances|mechanic_car|puncture|battery|towing|locksmith|gas_emergency>",
  "problem_description": "",
  "urgency": "normal | urgent | emergency",
  "location": "",
  "preferred_time": "",
  "additional_requirements": "",
  "needs_booking": false
}]]

Rules:
* "conversation": general chatting
* "skill_link_question": asking about Skill-Link
* "service_request": normal service request
* "emergency_service": urgent/emergency request
* "needs_booking": true ONLY when user clearly wants to book/request a service

---

# 9. GOLDEN RULE

**CONVERSATION FIRST → UNDERSTAND INTENT → SERVICE DETECTION → COLLECT REQUIRED INFORMATION → BACKEND → REAL DATA → USER CONFIRMATION → BOOKING**
Never trigger automatic booking merely because a keyword matches a service category.
`;

export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    const { messages, mode = "voice", temperature = 0.7, currentState } = await req.json();

    const lexiEngineUrl = process.env.LEXI_API_URL || process.env.NEXT_PUBLIC_LEXI_API_URL;
    const groqKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const openAiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_LEXI_API_KEY;
    const openRouterKey = process.env.OPENROUTER_API_KEY;

    const userMessage = messages && messages.length > 0
      ? messages[messages.length - 1]?.content || ""
      : "";

    // 1. Try Lexi AI Local/Remote FastAPI Engine if URL is configured
    if (lexiEngineUrl) {
      try {
        const apiMessages = [
          { role: "system", content: MASTER_SYSTEM_PROMPT },
          ...(messages || []),
        ];

        const lexiRes = await fetch(`${lexiEngineUrl.replace(/\/+$/, "")}/v1/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "lexi-ai",
            messages: apiMessages,
            max_tokens: 500,
            temperature,
          }),
        });

        if (lexiRes.ok) {
          const data = await lexiRes.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply) {
            return NextResponse.json({
              success: true,
              reply,
              provider: "LEXI AI Engine",
              latencyMs: Date.now() - startTime,
            });
          }
        }
      } catch (e) {
        console.warn("Lexi Engine endpoint error, cascading:", e);
      }
    }

    // 2. Try Groq API (Ultra-fast inference)
    if (groqKey) {
      try {
        const apiMessages = [
          { role: "system", content: MASTER_SYSTEM_PROMPT },
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
            max_tokens: 500,
            temperature,
          }),
        });

        if (groqRes.ok) {
          const data = await groqRes.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply) {
            return NextResponse.json({
              success: true,
              reply,
              provider: "Groq LLaMA 3.1",
              latencyMs: Date.now() - startTime,
            });
          }
        }
      } catch (e) {
        console.warn("Groq API error, trying Gemini:", e);
      }
    }

    // 3. Try Gemini API
    if (geminiKey) {
      try {
        const promptText = messages
          ?.map((m: { role: string; content: string }) => `${m.role === "user" ? "User" : "AI"}: ${m.content}`)
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
                    { text: `${MASTER_SYSTEM_PROMPT}\n\nConversation History:\n${promptText}\n\nSkill-Link AI:` },
                  ],
                },
              ],
              generationConfig: {
                maxOutputTokens: 500,
                temperature,
              },
            }),
          }
        );

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) {
            return NextResponse.json({
              success: true,
              reply,
              provider: "Google Gemini",
              latencyMs: Date.now() - startTime,
            });
          }
        }
      } catch (e) {
        console.warn("Gemini API error, trying OpenAI:", e);
      }
    }

    // 4. Try OpenAI API
    if (openAiKey) {
      try {
        const apiMessages = [
          { role: "system", content: MASTER_SYSTEM_PROMPT },
          ...(messages || []),
        ];

        const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openAiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: apiMessages,
            max_tokens: 500,
            temperature,
          }),
        });

        if (openAiRes.ok) {
          const data = await openAiRes.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply) {
            return NextResponse.json({
              success: true,
              reply,
              provider: "OpenAI",
              latencyMs: Date.now() - startTime,
            });
          }
        }
      } catch (e) {
        console.warn("OpenAI API error:", e);
      }
    }

    // 5. Try OpenRouter API
    if (openRouterKey) {
      try {
        const apiMessages = [
          { role: "system", content: MASTER_SYSTEM_PROMPT },
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
            max_tokens: 500,
            temperature,
          }),
        });

        if (openRouterRes.ok) {
          const data = await openRouterRes.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply) {
            return NextResponse.json({
              success: true,
              reply,
              provider: "OpenRouter LLaMA",
              latencyMs: Date.now() - startTime,
            });
          }
        }
      } catch (e) {
        console.warn("OpenRouter API error:", e);
      }
    }

    // 6. Master Deterministic AI Intent & Decision Fallback Engine
    const decisionResult: AIActionResult = processUserUtterance(userMessage, messages, currentState);

    return NextResponse.json({
      success: true,
      reply: decisionResult.speechText,
      actionResult: decisionResult,
      provider: "Skill-Link Intent Engine",
      latencyMs: Date.now() - startTime,
    });
  } catch (error: any) {
    console.error("API error in /api/lexi:", error);
    return NextResponse.json({
      success: false,
      error: error?.message || "Internal server error",
      latencyMs: Date.now() - startTime,
    });
  }
}

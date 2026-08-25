import { NextResponse } from "next/server";
import { processUserUtterance, AIActionResult } from "@/lib/aiDecisionEngine";

export const runtime = "nodejs";

const MASTER_SYSTEM_PROMPT = `
# Skill-Link AI — Master System Prompt

## 1. ROLE & IDENTITY
You are the intelligent AI assistant of Skill-Link, a multi-service local worker and emergency assistance platform.
You combine:
- ChatGPT-style empathetic conversational assistant
- Skill-Link verified service marketplace
- Roadside and home emergency assistance
- Local worker discovery system

## 2. CORE PRINCIPLE (CRITICAL)
> **Conversation does NOT automatically mean booking.**
- Mentioning a problem (e.g. "My pipe is leaking" or "My car broke down") is NOT permission to book!
- Respond with helpful advice / safety steps and ASK if the user wants to search for a technician.
- Never finalize a worker booking without explicit user confirmation.
- Never claim emergency help has been dispatched unless verified.
- Always give the user control over worker selection, price, payment, and final confirmation.

## 3. INTENT CLASSIFICATION
You must recognize and handle:
1. GENERAL_CONVERSATION: Normal chatting, questions, advice, greetings, DIY questions (e.g., "How can I fix a leaking tap?"). Respond with helpful tips, do NOT book.
2. SERVICE_INFORMATION: Inquiries about services / rates (e.g. "What services does Skill-Link provide?"). Explain catalog.
3. SERVICE_REQUEST: Explicit requests (e.g. "Book a plumber", "I need an electrician", "Find me a mechanic"). Trigger service discovery.
4. EMERGENCY_SERVICE: Urgent issues (e.g., "Car breakdown on highway", "Gas leak", "Electrical spark"). Give safety steps first, ask if in safe spot, recommend emergency-capable providers & helpline (112, 1033, 1906).
5. BOOKING_CONFIRMATION: Explicit confirmation ("Yes book him", "Confirm Raj Kumar"). Show price estimate / payment flow.
6. CANCEL_BOOKING: "Cancel my booking", "Cancel it". Handle cancellation cleanly.

## 4. ACTION TAG OUTPUT PROTOCOL
When appropriate, append a structured action tag at the end of your response:
[[AI_ACTION: {"intent": "<GENERAL_CONVERSATION|SERVICE_INFORMATION|SERVICE_REQUEST|EMERGENCY_SERVICE|BOOKING_CONFIRMATION|CANCEL_BOOKING>", "category": "<plumber|electrician|ac|cleaning|appliances|mechanic_car|puncture|battery|towing|locksmith|gas_emergency>", "urgency": "<normal|high|emergency>"}]]

## 5. LANGUAGE & TONE
- Natural, warm, empathetic Hindi / Hinglish / English.
- Avoid robotic output or raw markdown asterisks in spoken sentences.
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

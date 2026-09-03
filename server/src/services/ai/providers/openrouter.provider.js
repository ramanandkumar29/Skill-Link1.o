/**
 * OpenRouter AI Provider Adapter
 * Multi-Turn Autonomous Function & Tool Calling with Error Resilience
 */

const env = require("../../../config/env");

async function callOpenRouter(messages, tools = null, executeToolFn = null, timeoutMs = 12000) {
  const apiKey = env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  const model = env.OPENROUTER_MODEL || "openrouter/auto";

  const requestBody = {
    model,
    messages,
    temperature: 0.3,
    max_tokens: 800,
  };

  if (tools && Array.isArray(tools) && tools.length > 0) {
    requestBody.tools = tools;
    requestBody.tool_choice = "auto";
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://skilllink.ai",
      "X-Title": "Skill-Link Lexi AI",
    },
    signal: AbortSignal.timeout(timeoutMs),
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => response.statusText);
    throw new Error(`OpenRouter error (${response.status}): ${errBody}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];
  const toolCalls = choice?.message?.tool_calls;

  // ─── Multi-Turn Tool Execution ──────────────────────────────────────────────
  if (toolCalls && toolCalls.length > 0 && typeof executeToolFn === "function") {
    const toolCall = toolCalls[0];
    const toolName = toolCall.function.name;

    let toolArgs = {};
    try {
      toolArgs = JSON.parse(toolCall.function.arguments || "{}");
    } catch (_) {
      toolArgs = {};
    }

    const toolExecution = await executeToolFn(toolName, toolArgs);

    // Follow-up synthesis turn
    const followUpMessages = [
      ...messages,
      choice.message,
      {
        role: "tool",
        tool_call_id: toolCall.id,
        name: toolName,
        content: JSON.stringify(toolExecution.result || {}),
      },
    ];

    try {
      const secondRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://skilllink.ai",
          "X-Title": "Skill-Link Lexi AI",
        },
        signal: AbortSignal.timeout(timeoutMs),
        body: JSON.stringify({
          model,
          messages: followUpMessages,
          temperature: 0.3,
          max_tokens: 800,
        }),
      });

      if (secondRes.ok) {
        const secondData = await secondRes.json();
        const synthesizedReply = secondData.choices?.[0]?.message?.content;
        if (synthesizedReply) {
          return {
            reply: synthesizedReply.trim(),
            toolCalled: toolName,
            toolArgs,
            richPayload: toolExecution.richPayload || null,
            provider: `OpenRouter (${model}) + Autonomous Tool Execution`,
          };
        }
      }
    } catch (turn2Err) {
      console.warn("[OpenRouter] Turn 2 synthesis error, falling back to direct tool result:", turn2Err.message);
    }

    // Direct tool reply fallback
    return {
      reply: `I retrieved the information for **${toolName}**. Here are the verified results:`,
      toolCalled: toolName,
      toolArgs,
      richPayload: toolExecution.richPayload || null,
      provider: `OpenRouter (${model}) + Tool Execution`,
    };
  }

  const reply = choice?.message?.content;
  if (!reply) {
    throw new Error("Empty response from OpenRouter model.");
  }

  return {
    reply: reply.trim(),
    provider: `OpenRouter (${model})`,
    toolCalled: null,
    richPayload: null,
  };
}

module.exports = { callOpenRouter };

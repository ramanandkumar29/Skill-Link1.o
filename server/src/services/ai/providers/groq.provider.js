/**
 * Groq AI Provider Adapter
 * Multi-Turn Autonomous Function & Tool Calling on Groq LPUs
 */

const env = require("../../../config/env");

async function callGroq(messages, tools = null, executeToolFn = null, timeoutMs = 10000) {
  const apiKey = env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  const model = env.GROQ_MODEL || "llama-3.1-8b-instant";

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

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    signal: AbortSignal.timeout(timeoutMs),
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => response.statusText);
    throw new Error(`Groq error (${response.status}): ${errBody}`);
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
      const secondRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
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
            provider: `Groq LPU (${model}) + Autonomous Tool Execution`,
          };
        }
      }
    } catch (turn2Err) {
      console.warn("[Groq] Turn 2 error, falling back to direct tool result:", turn2Err.message);
    }

    return {
      reply: `I retrieved the verified details for **${toolName}**:`,
      toolCalled: toolName,
      toolArgs,
      richPayload: toolExecution.richPayload || null,
      provider: `Groq LPU (${model}) + Tool Execution`,
    };
  }

  const reply = choice?.message?.content;
  if (!reply) {
    throw new Error("Empty response from Groq model.");
  }

  return {
    reply: reply.trim(),
    provider: `Groq LPU (${model})`,
    toolCalled: null,
    richPayload: null,
  };
}

module.exports = { callGroq };

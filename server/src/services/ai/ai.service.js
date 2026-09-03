/**
 * AI Service Orchestrator — Skill-Link Lexi AI
 * Natural Conversational Intelligence, Strict RAG Privacy, Tool Calling, and Sanitized Responses.
 */

const env = require("../../config/env");
const { getKnowledgeContext, searchKnowledge } = require("../rag");
const { TOOL_DEFINITIONS, executeTool } = require("./tools");
const {
  getSessionState,
  updateSessionState,
  resetSessionState,
  clearPendingDraft,
  resolveWorkerReference,
  buildOptimizedContext,
} = require("./memory");
const {
  parseNaturalDate,
  parseNaturalTime,
  isConfirmationMessage,
  isCancellationMessage,
} = require("./bookingState");
const {
  sanitizeResponse,
  classifyIntent,
  synthesizePlatformAnswer,
  generateNaturalGreeting,
} = require("./naturalSynthesizer");
const { callOpenRouter } = require("./providers/openrouter.provider");
const { callGroq } = require("./providers/groq.provider");
const { callGemini } = require("./providers/gemini.provider");

/**
 * Generate AI Response with Strict Intent Routing and Sanitization
 * @param {Array<{ role: string, content: string }>} userMessages
 * @param {Object} [options]
 * @returns {Promise<{ success: boolean, reply: string, toolCalled?: string, toolArgs?: any, richPayload?: any, requiresLocation?: boolean, pendingTrade?: string, provider: string, latencyMs: number }>}
 */
async function generateLexiResponse(userMessages = [], options = {}) {
  const startTime = Date.now();
  const userContext = options.userContext || {};
  const sessionId = userContext.userId || userContext.sessionId || "default_session";
  const state = getSessionState(sessionId);

  const rawMessages = Array.isArray(userMessages) ? userMessages : [];
  if (rawMessages.length === 0) {
    throw new Error("Cannot generate response for empty conversation history.");
  }

  const latestUserMsg = rawMessages[rawMessages.length - 1]?.content || "";
  const lowerText = latestUserMsg.toLowerCase().trim();
  const isHindi = /[\u0900-\u097F]|namaste|kya|kaise|hai|hoon|karo|bhai|chahiye|madad|kitna|dikhao|paas|sasta|badhiya|book/i.test(
    latestUserMsg
  );

  // Classify Intent early
  const intent = classifyIntent(latestUserMsg);

  // ─── 1. GREETING INTENT (Natural ChatGPT-style greeting without RAG dump) ─────
  if (intent === "GREETING") {
    const greeting = generateNaturalGreeting(isHindi);
    return {
      success: true,
      reply: greeting,
      provider: "Skill-Link Conversational Assistant",
      ragInjected: false,
      latencyMs: Date.now() - startTime,
    };
  }

  // Retrieve relevant RAG context as hidden LLM grounding (NOT for direct rendering)
  const ragContext = getKnowledgeContext(latestUserMsg);

  // Build Layered Optimized Context (Windowing + Structured Directives + Summary)
  const { fullPromptMessages } = buildOptimizedContext(rawMessages, sessionId, ragContext);

  const primary = (env.AI_PROVIDER || "openrouter").toLowerCase();
  const providersToTry = [];

  if (primary === "openrouter" && env.OPENROUTER_API_KEY) providersToTry.push("openrouter");
  else if (primary === "groq" && env.GROQ_API_KEY) providersToTry.push("groq");
  else if (primary === "gemini" && env.GEMINI_API_KEY) providersToTry.push("gemini");

  if (primary !== "openrouter" && env.OPENROUTER_API_KEY) providersToTry.push("openrouter");
  if (primary !== "groq" && env.GROQ_API_KEY) providersToTry.push("groq");
  if (primary !== "gemini" && env.GEMINI_API_KEY) providersToTry.push("gemini");

  const toolExecutor = (name, args) => executeTool(name, args, userContext);

  // ─── 2. Attempt Cloud LLMs with Tool Calling ─────────────────────────────────
  for (const provider of providersToTry) {
    try {
      let result = null;
      if (provider === "openrouter") {
        result = await callOpenRouter(fullPromptMessages, TOOL_DEFINITIONS, toolExecutor);
      } else if (provider === "groq") {
        result = await callGroq(fullPromptMessages, TOOL_DEFINITIONS, toolExecutor);
      } else if (provider === "gemini") {
        result = await callGemini(fullPromptMessages);
      }

      if (result && result.reply) {
        return {
          success: true,
          reply: sanitizeResponse(result.reply),
          toolCalled: result.toolCalled || null,
          toolArgs: result.toolArgs || null,
          richPayload: result.richPayload || null,
          requiresLocation: result.requiresLocation || false,
          pendingTrade: result.pendingTrade || null,
          provider: result.provider,
          ragInjected: !!ragContext,
          latencyMs: Date.now() - startTime,
        };
      }
    } catch (err) {
      console.warn(`[Lexi AI] Provider "${provider}" warning:`, err.message);
    }
  }

  // ─── 3. Conversational Booking State Machine (Safety & Explicit Confirmation) ──

  // A. Explicit Confirmation of Pending Booking Draft
  if (state.pendingDraft && isConfirmationMessage(lowerText)) {
    const draft = state.pendingDraft;
    const confirmRes = await executeTool(
      "confirmBooking",
      {
        workerId: draft.workerId,
        serviceType: draft.serviceType,
        date: draft.date,
        time: draft.time,
        location: draft.location,
      },
      userContext
    );

    clearPendingDraft(sessionId);

    if (confirmRes.success) {
      const b = confirmRes.result.booking;
      const reply = isHindi
        ? `🎉 **Booking Confirm ho gayi hai!**\n\n• **Booking ID:** #${b.bookingId}\n• **Technician:** ${b.workerName} (${b.serviceType})\n• **Scheduled Time:** ${b.date}\n• **Doorstep Fee:** ₹${b.totalEstimate}\n• **Escrow OTP:** \`${b.otpSecret}\` *(Technician ke kaam complete hone par hi share karein)*`
        : `🎉 **Your booking is confirmed!**\n\n• **Booking ID:** #${b.bookingId}\n• **Professional:** ${b.workerName} (${b.serviceType})\n• **Scheduled Time:** ${b.date}\n• **Doorstep Visiting Fee:** ₹${b.totalEstimate}\n• **Secure Completion OTP:** \`${b.otpSecret}\` *(Only share this with the technician after satisfactory service completion)*`;

      return {
        success: true,
        reply: sanitizeResponse(reply),
        toolCalled: "confirmBooking",
        toolArgs: { bookingId: b.bookingId },
        richPayload: confirmRes.richPayload,
        provider: "Skill-Link Conversational Booking Engine",
        latencyMs: Date.now() - startTime,
      };
    } else {
      return {
        success: false,
        reply: "I was unable to finalize this booking. Please try selecting another time slot.",
        provider: "Skill-Link Conversational Booking Engine",
        latencyMs: Date.now() - startTime,
      };
    }
  }

  // B. Pre-Confirmation Cancellation of Booking Draft
  if (state.pendingDraft && isCancellationMessage(lowerText)) {
    clearPendingDraft(sessionId);
    const reply = isHindi
      ? "Maine booking draft cancel kar diya hai. Agar aapko koi aur service ya worker chahiye toh batayein!"
      : "I have cancelled this booking draft. Let me know if you would like to explore other workers or services!";

    return {
      success: true,
      reply,
      toolCalled: "cancelBookingDraft",
      richPayload: null,
      provider: "Skill-Link Conversational Booking Engine",
      latencyMs: Date.now() - startTime,
    };
  }

  // C. Pre-Confirmation Modification or Slot Fulfillment (e.g. "10 AM", "Actually make it 2 PM")
  if (state.pendingDraft) {
    const newTime = parseNaturalTime(lowerText);
    const newDate = parseNaturalDate(lowerText);

    if (newTime || newDate || lowerText.includes("change") || lowerText.includes("make it") || lowerText.includes("instead")) {
      if (newTime) state.pendingDraft.time = newTime;
      if (newDate && !newDate.includes("actually") && !newDate.includes("change")) state.pendingDraft.date = newDate;

      if (state.pendingDraft.date && state.pendingDraft.time) {
        const draft = state.pendingDraft;
        const previewRes = await executeTool("createBookingPreview", draft, userContext);

        const reply = isHindi
          ? `📋 **Booking Summary:**\n• **Service:** ${draft.serviceType}\n• **Technician:** ${draft.workerName}\n• **Date:** ${draft.date}\n• **Time:** ${draft.time}\n• **Doorstep Fee:** ₹${draft.visitingFee} *(Escrow Protected)*\n\nKya main is booking ko confirm kar doon? *(Confirm karne ke liye "Yes" ya "Confirm" bolein)*`
          : `📋 **Booking Summary:**\n• **Service:** ${draft.serviceType}\n• **Technician:** ${draft.workerName}\n• **Date:** ${draft.date}\n• **Time:** ${draft.time}\n• **Doorstep Fee:** ₹${draft.visitingFee} *(Escrow Protected)*\n\nWould you like me to confirm this booking? *(Reply "Confirm" or "Yes" to proceed)*`;

        return {
          success: true,
          reply: sanitizeResponse(reply),
          toolCalled: "createBookingPreview",
          toolArgs: draft,
          richPayload: previewRes.richPayload,
          provider: "Skill-Link Conversational Booking Engine",
          latencyMs: Date.now() - startTime,
        };
      }
    }
  }

  // D. Booking Intent Detection ("Book", "Hire", "Schedule", "Appoint")
  if (intent === "BOOKING") {
    const referencedWorker = resolveWorkerReference(lowerText, state);
    const parsedDate = parseNaturalDate(lowerText) || state.pendingDraft?.date || null;
    const parsedTime = parseNaturalTime(lowerText) || state.pendingDraft?.time || null;

    if (!referencedWorker && !state.pendingDraft) {
      const reply = isHindi
        ? "Aap kis worker ya service ko book karna chahte hain? Kripya worker ka naam ya category batayein (e.g., 'Book first worker')."
        : "Which professional would you like to book? Please mention the worker's name or rank (e.g., 'Book the first worker').";

      return {
        success: true,
        reply,
        toolCalled: "createBookingPreview",
        richPayload: null,
        provider: "Skill-Link Conversational Booking Engine",
        latencyMs: Date.now() - startTime,
      };
    }

    const workerToBook = referencedWorker || state.pendingDraft;

    if (!parsedDate) {
      updateSessionState(sessionId, {
        pendingDraft: {
          workerId: workerToBook.workerId || workerToBook.id,
          workerName: workerToBook.name,
          serviceType: workerToBook.occupation || workerToBook.serviceType,
          visitingFee: workerToBook.visitingFee || 149,
          time: parsedTime,
          createdAt: Date.now(),
        },
      });

      const reply = isHindi
        ? `Sure! Main **${workerToBook.name}** (${workerToBook.occupation}) ke liye booking schedule kar rahi hoon. Aap kis din service chahte hain (e.g. Aaj, Kal, ya Friday)?`
        : `Sure! I am preparing a booking for **${workerToBook.name}** (${workerToBook.occupation}). Which day would you like to schedule this (e.g., Today, Tomorrow, or Friday)?`;

      return {
        success: true,
        reply,
        provider: "Skill-Link Conversational Booking Engine",
        latencyMs: Date.now() - startTime,
      };
    }

    if (!parsedTime) {
      updateSessionState(sessionId, {
        pendingDraft: {
          workerId: workerToBook.workerId || workerToBook.id,
          workerName: workerToBook.name,
          serviceType: workerToBook.occupation || workerToBook.serviceType,
          visitingFee: workerToBook.visitingFee || 149,
          date: parsedDate,
          createdAt: Date.now(),
        },
      });

      const reply = isHindi
        ? `Bilkul! **${workerToBook.name}** ke liye **${parsedDate}** ko aap kis time par technician bulana chahte hain (e.g. 10:00 AM, 2:00 PM, ya 4:00 PM)?`
        : `Got it! What time would you prefer for **${workerToBook.name}** on **${parsedDate}** (e.g., 10:00 AM, 2:00 PM, or 4:00 PM)?`;

      return {
        success: true,
        reply,
        provider: "Skill-Link Conversational Booking Engine",
        latencyMs: Date.now() - startTime,
      };
    }

    const bookingDraft = {
      workerId: workerToBook.workerId || workerToBook.id,
      workerName: workerToBook.name,
      serviceType: workerToBook.occupation || workerToBook.serviceType || "Doorstep Service Inspection",
      date: parsedDate,
      time: parsedTime,
      location: userContext.location || userContext.locationName || "Sector 17, Chandigarh",
      visitingFee: workerToBook.visitingFee || 149,
      createdAt: Date.now(),
    };

    updateSessionState(sessionId, { pendingDraft: bookingDraft });

    const previewRes = await executeTool("createBookingPreview", bookingDraft, userContext);

    const reply = isHindi
      ? `📋 **Booking Summary:**\n• **Service:** ${bookingDraft.serviceType}\n• **Technician:** ${bookingDraft.workerName}\n• **Date:** ${bookingDraft.date}\n• **Time:** ${bookingDraft.time}\n• **Doorstep Fee:** ₹${bookingDraft.visitingFee} *(Escrow Protected)*\n\nKya main is booking ko confirm kar doon? *(Confirm karne ke liye "Yes" ya "Confirm" bolein)*`
      : `📋 **Booking Summary:**\n• **Service:** ${bookingDraft.serviceType}\n• **Technician:** ${bookingDraft.workerName}\n• **Date:** ${bookingDraft.date}\n• **Time:** ${bookingDraft.time}\n• **Doorstep Fee:** ₹${bookingDraft.visitingFee} *(Escrow Protected)*\n\nWould you like me to confirm this booking? *(Reply "Confirm" or "Yes" to proceed)*`;

    return {
      success: true,
      reply: sanitizeResponse(reply),
      toolCalled: "createBookingPreview",
      toolArgs: bookingDraft,
      richPayload: previewRes.richPayload,
      provider: "Skill-Link Conversational Booking Engine",
      latencyMs: Date.now() - startTime,
    };
  }

  // ─── 4. Worker Discovery & Recommendation Intent ─────────────────────────────

  // Edge Case: Unsupported Digital Services
  const unsupportedMatches = [
    "graphic designer",
    "web developer",
    "software engineer",
    "digital marketer",
    "video editor",
    "pilot",
    "lawyer",
    "doctor",
    "astronaut",
  ];
  if (unsupportedMatches.some((u) => lowerText.includes(u))) {
    const reply = isHindi
      ? "Skill-Link doorstep home technical maintenance (Plumbers, Electricians, AC Technicians, Masons, Appliances) aur 15-minute emergency roadside assistance par focus karta hai. Digital services jaise graphic design ya web development hamare platform par currently available nahi hain."
      : "Skill-Link specializes in doorstep home technical maintenance (Plumbers, Electricians, AC Technicians, Masons, RO Specialists) and 15-minute emergency roadside assistance. Digital services like graphic design or web development are not currently offered.";

    return {
      success: true,
      reply,
      toolCalled: "searchWorkers",
      toolArgs: { category: "unsupported" },
      richPayload: null,
      provider: "Skill-Link Smart Recommendation Engine",
      latencyMs: Date.now() - startTime,
    };
  }

  // Edge Case: Ambiguous Search Query
  const isAmbiguousQuery =
    (lowerText.includes("technician") ||
      lowerText.includes("worker chahiye") ||
      lowerText.includes("find a worker") ||
      lowerText.includes("help chahiye")) &&
    !lowerText.match(
      /(electrician|plumber|mechanic|ac|cleaning|salon|mason|carpenter|painter|bike|car|bijli|nal|fan|ro|purifier|laptop|computer)/i
    );

  if (isAmbiguousQuery && !state.activeSearch?.trade) {
    const reply = isHindi
      ? "Aapko kis type ke technician ya service ki zaroorat hai? Jaise ki AC Repair, Electrician (bijli fix), Plumber (nal/pipe fix), Car/Bike Mechanic, RO Purifier, ya Deep Cleaning?"
      : "What type of technician or specialist do you need? For example: AC Repair, Electrician, Plumber, Car/Bike Mechanic, RO Water Purifier, Laptop Repair, or Deep Cleaning.";

    return {
      success: true,
      reply,
      toolCalled: "searchWorkers",
      toolArgs: { isAmbiguous: true },
      richPayload: null,
      provider: "Skill-Link Smart Recommendation Engine",
      latencyMs: Date.now() - startTime,
    };
  }

  // Proximity & Location Handling
  const wantsNearMe =
    lowerText.includes("near me") ||
    lowerText.includes("nearby") ||
    lowerText.includes("paas me") ||
    lowerText.includes("closest") ||
    lowerText.includes("mere paas");
  const hasUserLocation =
    (typeof userContext.lat === "number" && typeof userContext.lng === "number") ||
    !!userContext.location ||
    !!userContext.locationName ||
    !!state.activeSearch?.location;

  const isRefinement =
    lowerText.includes("experienced") ||
    lowerText.includes("cheaper") ||
    lowerText.includes("affordable") ||
    lowerText.includes("top rated") ||
    lowerText.includes("rating") ||
    lowerText.includes("aur dikhao") ||
    lowerText.includes("best") ||
    wantsNearMe;
  const directTradeMatch = lowerText.match(
    /(electrician|plumber|mechanic|ac|cleaning|salon|mason|carpenter|painter|bike|car|bijli|nal|fan|ro|purifier|laptop|computer)/i
  );

  const tradeToUse = directTradeMatch
    ? directTradeMatch[0].toLowerCase()
    : isRefinement
    ? state.activeSearch?.trade || null
    : null;

  if (wantsNearMe && !hasUserLocation) {
    const targetTrade = tradeToUse || "technician";
    const reply = isHindi
      ? `Aapke paas ke verified **${targetTrade}** dhundhne ke liye, kripya live GPS location allow karein ya apna area/sector batayein (e.g. Sector 17, Chandigarh):`
      : `To find verified **${targetTrade}** professionals closest to your current spot, please allow location access or type your area/sector (e.g. Sector 17, Chandigarh):`;

    return {
      success: true,
      reply,
      toolCalled: "searchWorkers",
      toolArgs: { category: targetTrade, nearMe: true },
      requiresLocation: true,
      pendingTrade: targetTrade,
      richPayload: null,
      provider: "Skill-Link Smart Recommendation Engine",
      latencyMs: Date.now() - startTime,
    };
  }

  if (intent === "WORKER_SEARCH" || tradeToUse || wantsNearMe) {
    const trade = tradeToUse || "all";
    const wantsExperienced =
      lowerText.includes("experienced") ||
      lowerText.includes("senior") ||
      lowerText.includes("tazurba") ||
      !!state.activeSearch?.filters?.experienced;
    const wantsAffordable =
      lowerText.includes("affordable") ||
      lowerText.includes("cheapest") ||
      lowerText.includes("cheaper") ||
      lowerText.includes("sasta") ||
      lowerText.includes("low cost") ||
      lowerText.includes("under 200") ||
      lowerText.includes("under 150") ||
      !!state.activeSearch?.filters?.affordable;
    const wantsRating =
      lowerText.includes("rated") ||
      lowerText.includes("best") ||
      lowerText.includes("top") ||
      !!state.activeSearch?.filters?.bestRated;

    const locToUse =
      userContext.location ||
      userContext.locationName ||
      state.activeSearch?.location ||
      "Sector 17, Chandigarh";

    updateSessionState(sessionId, {
      activeSearch: {
        trade: trade !== "all" ? trade : state.activeSearch?.trade,
        filters: {
          affordable: wantsAffordable,
          bestRated: wantsRating,
          experienced: wantsExperienced,
          nearMe: wantsNearMe || !!state.activeSearch?.filters?.nearMe,
        },
        location: locToUse,
      },
    });

    const toolRes = await executeTool(
      "searchWorkers",
      {
        category: trade !== "all" ? trade : undefined,
        experienced: wantsExperienced,
        affordable: wantsAffordable,
        bestRated: wantsRating,
        minRating: wantsRating ? 4.8 : undefined,
        lat: userContext.lat,
        lng: userContext.lng,
        location: locToUse,
        nearMe: wantsNearMe,
        sortBy: "recommendation",
      },
      userContext
    );

    if (toolRes.success && toolRes.result.workers && toolRes.result.workers.length > 0) {
      const workers = toolRes.result.workers;
      const count = workers.length;
      const topWorker = workers[0];

      updateSessionState(sessionId, {
        lastResults: workers,
        selectedWorker: topWorker,
      });

      const rankedSummary = workers
        .slice(0, 3)
        .map(
          (w, i) =>
            `• **#${i + 1} ${w.name}** (${w.rankingBadge || "Recommended"}) — Rating: ${w.rating}★, ${
              w.distanceKm
            } km away, Fee: ₹${w.visitingFee}`
        )
        .join("\n");

      let explanation = toolRes.result.topRecommendationExplanation || "";
      if (isHindi) {
        const topReasons = (topWorker.whyRecommended || []).join(", ");
        explanation = `Main **${topWorker.name}** (${topWorker.rankingBadge}) ko recommend karti hoon kyunki: ${
          topReasons || "ye aapke preferences ke liye best match hain"
        }.`;
      }

      const reply = isHindi
        ? `Maine aapke criteria ke mutabiq **${count} matching professionals** score aur rank kiye hain:\n\n${rankedSummary}\n\n💡 **Recommendation Detail:**\n${explanation}\n\nAap inme se kisi ko bhi book karne ke liye bol sakte hain (e.g., *"Book the first worker tomorrow at 10 AM"*):`
        : `I found **${count} matching professionals** and ranked them based on your preferences:\n\n${rankedSummary}\n\n💡 **Recommendation Detail:**\n${explanation}\n\nYou can book any pro directly by saying (e.g., *"Book the first worker tomorrow at 10 AM"*):`;

      return {
        success: true,
        reply: sanitizeResponse(reply),
        toolCalled: "searchWorkers",
        toolArgs: { category: trade },
        richPayload: toolRes.richPayload,
        provider: "Skill-Link Smart Recommendation Engine",
        latencyMs: Date.now() - startTime,
      };
    }
  }

  // ─── 5. User Bookings Lookup Intent ──────────────────────────────────────────
  if (intent === "USER_BOOKINGS") {
    const toolRes = await executeTool("getUserBookings", {}, userContext);
    if (toolRes.success) {
      const bookingsCount = toolRes.result.count;
      const reply =
        bookingsCount > 0
          ? isHindi
            ? `Aapki **${bookingsCount} active booking(s)** registered hain. Yahan aapka booking card hai:`
            : `You have **${bookingsCount} active booking(s)** registered. Here is your current booking card:`
          : isHindi
          ? `Currently aapki koi active booking nahi mili. Agar aapko koi service schedule karni hai toh batayein!`
          : `You don't have any active bookings at the moment. Let me know if you'd like to schedule a service!`;

      return {
        success: true,
        reply: sanitizeResponse(reply),
        toolCalled: "getUserBookings",
        toolArgs: {},
        richPayload: toolRes.richPayload,
        provider: "Skill-Link Conversational Booking Engine",
        latencyMs: Date.now() - startTime,
      };
    }
  }

  // ─── 6. Platform Q&A / RAG Answer Synthesis (Zero Document Dumps) ─────────────
  const matches = searchKnowledge(latestUserMsg, 2, 0.25);
  const naturalAnswer = synthesizePlatformAnswer(latestUserMsg, matches, isHindi);

  return {
    success: true,
    reply: sanitizeResponse(naturalAnswer),
    provider: "Skill-Link Natural Assistant",
    ragInjected: !!matches && matches.length > 0,
    latencyMs: Date.now() - startTime,
  };
}

/**
 * Resets/clears conversation memory for a session
 */
function resetConversationMemory(sessionId = "default_session") {
  return resetSessionState(sessionId);
}

module.exports = {
  generateLexiResponse,
  resetConversationMemory,
};

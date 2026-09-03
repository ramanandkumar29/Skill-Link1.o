/**
 * Natural Response Synthesizer & Sanitization Gate — Skill-Link Lexi AI
 * Ensures all assistant responses are natural, ChatGPT-quality conversational answers.
 * Strictly prevents raw RAG document dumps, internal debug leaks, or technical error messages.
 */

/**
 * Sanitizes response text to guarantee no internal context or technical errors leak to frontend
 * @param {string} text
 * @returns {string}
 */
function sanitizeResponse(text) {
  if (!text || typeof text !== "string") {
    return "I'm having trouble processing that right now. How else can I help you with Skill-Link services?";
  }

  let clean = text;

  // 1. Strip internal RAG headers, debug headers, and document titles
  clean = clean.replace(/\*\*Skill-Link Knowledge Base.*?\*\*:\s*/gi, "");
  clean = clean.replace(/\*\*Skill-Link Knowledge.*?\*\*:\s*/gi, "");
  clean = clean.replace(/\[RAG Context:.*?\]/gi, "");
  clean = clean.replace(/Retrieved Context:.*?\n/gi, "");
  clean = clean.replace(/\[STRUCTURED SESSION MEMORY\].*?\n/gi, "");

  // 2. Strip API key instructions or developer notes
  clean = clean.replace(/\*\(Note:.*?API_KEY.*?\)\*/gi, "");
  clean = clean.replace(/\(Note: Configure OPENROUTER_API_KEY.*?\)/gi, "");
  clean = clean.replace(/Configure OPENROUTER_API_KEY.*?\./gi, "");
  clean = clean.replace(/Configure GROQ_API_KEY.*?\./gi, "");
  clean = clean.replace(/server\/\.env/gi, "");
  clean = clean.replace(/OPENROUTER_API_KEY/gi, "");
  clean = clean.replace(/GROQ_API_KEY/gi, "");
  clean = clean.replace(/GEMINI_API_KEY/gi, "");

  // 3. Clean up excessive whitespace or leftover brackets
  clean = clean.replace(/\n{3,}/g, "\n\n").trim();

  // If text became empty or was pure debug info, return friendly fallback
  if (!clean || clean.length < 5) {
    return "I'm here to help you find skilled professionals, schedule services, or answer any questions about Skill-Link. How can I assist you?";
  }

  return clean;
}

/**
 * Detects conversational intent of the user message
 */
function classifyIntent(text) {
  const lower = (text || "").toLowerCase().trim();

  // 1. Basic Greetings
  const isGreeting =
    /^(hi|hello|hey|namaste|namaskar|helo|hlo|good morning|good afternoon|good evening|who are you|what can you do|kya kar sakti ho|tum kaun ho|who r u|hii+|heyy+)\b/i.test(
      lower
    ) || lower === "hi" || lower === "hello" || lower === "hey" || lower === "namaste";

  if (isGreeting) return "GREETING";

  // 2. Platform Q&A / Knowledge Inquiry (Higher priority than generic "booking" keyword)
  const isPlatformQuestion =
    lower.includes("what is skill-link") ||
    lower.includes("how does it work") ||
    lower.includes("how to cancel") ||
    lower.includes("how do i cancel") ||
    lower.includes("cancel a booking") ||
    lower.includes("cancellation") ||
    lower.includes("refund") ||
    lower.includes("pricing") ||
    lower.includes("visiting fee") ||
    lower.includes("what is sos") ||
    lower.includes("how does sos work") ||
    lower.includes("trust") ||
    lower.includes("kyc") ||
    lower.includes("safety");

  if (isPlatformQuestion) return "PLATFORM_QA";

  // 3. User Bookings Lookup
  if (
    lower.includes("my booking") ||
    lower.includes("my bookings") ||
    lower.includes("track status") ||
    lower.includes("meri booking") ||
    lower.includes("show my bookings")
  ) {
    return "USER_BOOKINGS";
  }

  // 4. Booking Creation Intents ("Book the worker", "Hire Rahul", "Schedule for tomorrow")
  if (
    lower.includes("book the") ||
    lower.includes("book this") ||
    lower.includes("book a") ||
    lower.includes("book worker") ||
    lower.includes("want to hire") ||
    lower.includes("schedule this") ||
    lower.includes("appoint") ||
    lower.includes("confirm") ||
    (lower.startsWith("book ") && !lower.includes("cancel"))
  ) {
    return "BOOKING";
  }

  // 5. Worker Search & Trade Requirements
  const hasTradeKeyword = /(plumber|electrician|mechanic|ac|cleaning|salon|mason|carpenter|painter|bike|car|bijli|nal|fan|ro|purifier|laptop|computer|technician|worker|mistri|puncture)/i.test(
    lower
  );
  if (
    hasTradeKeyword ||
    lower.includes("near me") ||
    lower.includes("nearby") ||
    lower.includes("cheaper") ||
    lower.includes("experienced") ||
    lower.includes("top rated") ||
    lower.includes("sasta") ||
    lower.includes("chahiye")
  ) {
    return "WORKER_SEARCH";
  }

  return "GENERAL_CHAT";
}

/**
 * Synthesizes a natural, concise answer for platform Q&A without exposing raw RAG markdown
 */
function synthesizePlatformAnswer(userQuery, ragMatches = [], isHindi = false) {
  const lower = (userQuery || "").toLowerCase();

  // A. What is Skill-Link
  if (lower.includes("what is skill-link") || lower.includes("about skill-link") || lower.includes("kya hai")) {
    if (isHindi) {
      return "Skill-Link ek intelligent hyperlocal marketplace hai jo aapko verified technicians (Plumbers, Electricians, AC Specialists) aur 15-minute emergency roadside assistance se connect karta hai. Yahan aap transparent ₹149 base fee aur OTP security ke saath transparent services book kar sakte hain.";
    }
    return "Skill-Link is an intelligent hyperlocal platform connecting you with verified local tradespeople (plumbers, electricians, AC mechanics) for doorstep maintenance, plus 15-minute emergency roadside SOS assistance with fixed transparent pricing.";
  }

  // B. Cancellation & Refunds
  if (lower.includes("cancel") || lower.includes("refund") || lower.includes("cancellation")) {
    if (isHindi) {
      return "Skill-Link par aap technician ke service location par aane se pehle kisi bhi booking ko zero penalty ke saath cancel kar sakte hain. Agar aapne online UPI se pay kiya hai, toh full refund turant aapke payment source par process ho jata hai.";
    }
    return "You can cancel any service booking on Skill-Link with zero penalty before the technician arrives at your location. If you pre-paid online via UPI, your refund is processed immediately back to your original payment method.";
  }

  // C. Pricing & Visiting Fee
  if (lower.includes("price") || lower.includes("pricing") || lower.includes("fee") || lower.includes("cost") || lower.includes("kitna")) {
    if (isHindi) {
      return "Skill-Link par doorstep inspection ki base visiting fee ₹149 se shuru hoti hai. Technician pehle issue diagnose karte hain aur standard rate chart ke hisaab se estimate dete hain. Kaam complete hone par hi Escrow OTP share kiya jata hai.";
    }
    return "Skill-Link features transparent fixed inspection fees starting at ₹149. The technician diagnoses the issue and provides a standardized estimate before starting work. You only release payment via a secure 6-digit OTP once the job is completed to your satisfaction.";
  }

  // D. Emergency Roadside SOS
  if (lower.includes("sos") || lower.includes("emergency") || lower.includes("roadside") || lower.includes("puncture")) {
    if (isHindi) {
      return "Hamara QuickFix SOS system tyre puncture, battery jumpstart, towing, aur fuel delivery ke liye 15 minute ke andar nearest verified mechanic dispatch karta hai, jisme ₹199 ka transparent price-lock milta hai.";
    }
    return "Our QuickFix 15-Minute Emergency Roadside SOS connects stranded drivers with the nearest verified mechanic for tyre punctures, battery jumpstarts, towing, and emergency fuel with a locked ₹199 base fee.";
  }

  // E. Trust, KYC & Safety
  if (lower.includes("trust") || lower.includes("kyc") || lower.includes("safety") || lower.includes("verified")) {
    if (isHindi) {
      return "Skill-Link ke sabhi technicians DigiLocker Aadhaar KYC verified hain. Saath hi aapko ₹10,000 ka Workmanship Damage Cover aur 7-day service warranty milti hai.";
    }
    return "Every professional on Skill-Link undergoes DigiLocker government Aadhaar KYC verification. All completed jobs also include a ₹10,000 Workmanship Damage Cover and a 7-day service warranty.";
  }

  // F. Fallback from top RAG match if available, extracting only pure factual text without markdown headers
  if (ragMatches && ragMatches.length > 0) {
    const rawContent = ragMatches[0].content || "";
    // Clean bullet lines into a natural paragraph
    const cleanedParagraph = rawContent
      .replace(/^#+.*$/gm, "")
      .replace(/\*\*.*?\*\*/g, (m) => m.replace(/\*\*/g, ""))
      .replace(/^[•\-*]\s+/gm, "")
      .replace(/\n+/g, " ")
      .trim();

    const firstTwoSentences = cleanedParagraph.split(/(?<=[.?!])\s+/).slice(0, 3).join(" ");
    return firstTwoSentences || "Skill-Link connects you with verified local tradespeople and 15-minute emergency roadside assistance across the Tricity area.";
  }

  return isHindi
    ? "Skill-Link aapko verified home maintenance technicians aur 15-minute roadside assistance provide karta hai. Aap mujhse kisi bhi service ke baare me pooch sakte hain!"
    : "Skill-Link provides verified doorstep home technical services and 15-minute roadside emergency assistance. Let me know what service or information you need!";
}

/**
 * Natural greeting generator
 */
function generateNaturalGreeting(isHindi = false) {
  if (isHindi) {
    return "Namaste! 👋 Main **Lexi** hoon, Skill-Link ki intelligent AI assistant.\n\nMain aapko verified technicians (Plumber, Electrician, AC Mechanic, Mason) dhoondhne, recommendations compare karne, aur doorstep bookings schedule karne me madad kar sakti hoon.\n\nMain aaj aapki kya madad karoon?";
  }

  return "Hi! 👋 I'm **Lexi**, your Skill-Link AI assistant.\n\nI can help you discover verified local professionals (Plumbers, Electricians, AC Technicians), compare recommendations, schedule doorstep bookings, and guide you through our 15-minute roadside SOS.\n\nHow can I help you today?";
}

module.exports = {
  sanitizeResponse,
  classifyIntent,
  synthesizePlatformAnswer,
  generateNaturalGreeting,
};

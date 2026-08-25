import {
  SERVICE_CATEGORIES,
  searchAvailableWorkers,
  getPriceEstimate,
  getHelplines,
  WorkerMatchResult,
  PriceEstimate,
  HelplineItem,
  ServiceCategory
} from "./servicesCatalog";
import { WorkerProfile, OnRoadMechanic } from "./seedData";

// ─── STAGE 1: STRUCTURED AI UNDERSTANDING SCHEMA ─────────────────────────────

export type AIIntentType =
  | "conversation"
  | "general_question"
  | "skill_link_question"
  | "service_request"
  | "emergency_service"
  | "booking_request"
  | "booking_status"
  | "cancellation_request"
  | "worker_information"
  | "complaint"
  | "payment_question"
  | "GENERAL_CONVERSATION"
  | "SERVICE_INFORMATION"
  | "WORKER_SELECTED"
  | "BOOKING_CONFIRMATION"
  | "CANCEL_BOOKING";

export type AIActionType =
  | "GENERAL_REPLY"
  | "SHOW_SERVICES"
  | "REQUEST_LOCATION"
  | "SHOW_WORKERS"
  | "SHOW_PROFILE"
  | "SHOW_PRICE_ESTIMATE"
  | "REQUEST_PAYMENT"
  | "BOOKING_CONFIRMED"
  | "BOOKING_CANCELLED"
  | "SHOW_HELPLINES"
  | "CLARIFICATION";

export interface AIStructuredUnderstanding {
  intent: AIIntentType;
  language: "english" | "hindi" | "hinglish";
  service_category: string | null;
  problem_description: string | null;
  urgency: "normal" | "urgent" | "emergency";
  location: string | null;
  location_required: boolean;
  booking_requested?: boolean;
  missing_information: string[];
  response: string;
}

export interface AIActionResult {
  intent: AIIntentType;
  actionType: AIActionType;
  speechText: string;
  thought?: string;
  language?: "english" | "hindi" | "hinglish";
  debugInfo?: {
    intent: AIIntentType;
    language: string;
    serviceCategory: string | null;
    urgency: string;
    missingInfo: string[];
    location: string | null;
    provider?: string;
    latencyMs?: number;
  };
  payload?: {
    categories?: ServiceCategory[];
    category?: string;
    workers?: WorkerMatchResult[];
    selectedWorker?: WorkerProfile | OnRoadMechanic;
    priceEstimate?: PriceEstimate;
    helplines?: HelplineItem[];
    bookingId?: string;
    locationPrompt?: string;
    clarificationOptions?: string[];
    urgency?: "normal" | "urgent" | "emergency";
  };
}

export interface ConversationTurn {
  role: "user" | "assistant" | "system";
  content: string;
}

// ─── UTILITIES & NORMALIZERS ─────────────────────────────────────────────────

function normalize(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/['".,\/#!$%\^&\*;:{}=\-_`~()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectLanguage(text: string): "english" | "hindi" | "hinglish" {
  const norm = normalize(text);
  const hindiHindiWords = [
    "mera", "meri", "mere", "mujhe", "kya", "hai", "hain", "h", "nahi", "kar", "karna", "karein",
    "bhai", "kaise", "theek", "hoon", "aap", "aapka", "aapki", "paani", "ghar", "gaadi", "chahiye",
    "batao", "bataiye", "ho", "gaya", "gayi", "raha", "rahi", "lag", "rasta", "fasa", "chabi", "nal"
  ];
  
  const tokens = norm.split(" ");
  const matchCount = tokens.filter(t => hindiHindiWords.includes(t)).length;

  if (matchCount > 0) {
    return "hinglish";
  }
  return "english";
}

// ─── LOCATION EXTRACTOR ──────────────────────────────────────────────────────

const INDIAN_CITIES_AND_AREAS = [
  "chandigarh", "delhi", "new delhi", "noida", "gurgaon", "gurugram", "mumbai", "bangalore",
  "bengaluru", "hyderabad", "pune", "chennai", "kolkata", "jaipur", "ahmedabad", "lucknow",
  "mohali", "panchkula", "sector 17", "sector 22", "sector 35", "sector 62", "indiranagar",
  "koramangala", "whitefield", "andheri", "bandra", "saket", "connaught place", "rohini",
  "dwarka", "vaishali", "indirapuram", "patna", "bhopal", "indore", "surat", "nagpur", "kanpur"
];

function extractLocation(text: string): string | null {
  const norm = normalize(text);
  for (const loc of INDIAN_CITIES_AND_AREAS) {
    if (norm.includes(loc)) {
      // Capitalize properly
      return loc.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }
  }
  // If user says "in <location>" or "at <location>"
  const match = text.match(/\b(?:in|at|near|around|from)\s+([A-Za-z0-9\s]{3,25})/i);
  if (match && match[1]) {
    const candidate = match[1].trim();
    if (!["a", "the", "my", "this", "some", "urgent", "emergency"].includes(candidate.toLowerCase())) {
      return candidate;
    }
  }
  return null;
}

// ─── CONTEXT & MULTI-TURN HISTORY ANALYZER ───────────────────────────────────

interface HistoricalContext {
  lastIntent?: AIIntentType;
  lastCategory?: string;
  lastUrgency?: "normal" | "urgent" | "emergency";
  askedForLocation: boolean;
  askedForConfirmation: boolean;
  selectedWorkerId?: string;
}

function analyzeHistory(history: ConversationTurn[]): HistoricalContext {
  const ctx: HistoricalContext = {
    askedForLocation: false,
    askedForConfirmation: false
  };

  if (!history || history.length === 0) return ctx;

  // Search backward through assistant turns
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    if (msg.role === "assistant") {
      const contentNorm = normalize(msg.content);
      if (contentNorm.includes("location") || contentNorm.includes("kahan") || contentNorm.includes("kis location") || contentNorm.includes("area")) {
        ctx.askedForLocation = true;
      }
      if (contentNorm.includes("confirm") || contentNorm.includes("proceed with booking") || contentNorm.includes("book karu")) {
        ctx.askedForConfirmation = true;
      }
    } else if (msg.role === "user") {
      const userNorm = normalize(msg.content);
      if (userNorm.includes("car") || userNorm.includes("breakdown") || userNorm.includes("mechanic") || userNorm.includes("gadi")) {
        ctx.lastCategory = "mechanic_car";
      } else if (userNorm.includes("plumb") || userNorm.includes("tap") || userNorm.includes("pipe") || userNorm.includes("leak") || userNorm.includes("nal")) {
        ctx.lastCategory = "plumber";
      } else if (userNorm.includes("electric") || userNorm.includes("wiring") || userNorm.includes("spark") || userNorm.includes("switch") || userNorm.includes("fan")) {
        ctx.lastCategory = "electrician";
      } else if (userNorm.includes("ac") || userNorm.includes("cooling")) {
        ctx.lastCategory = "ac";
      } else if (userNorm.includes("clean") || userNorm.includes("safai")) {
        ctx.lastCategory = "cleaning";
      } else if (userNorm.includes("fridge") || userNorm.includes("washing machine") || userNorm.includes("appliance")) {
        ctx.lastCategory = "appliances";
      }
    }
  }

  return ctx;
}

// ─── STAGE 1: SEMANTIC UNDERSTANDING ENGINE ─────────────────────────────────

export function analyzeMessageAndContext(
  messageText: string,
  history: ConversationTurn[] = [],
  currentState?: {
    location?: string;
    pendingCategory?: string;
    step?: string;
  }
): AIStructuredUnderstanding {
  const norm = normalize(messageText);
  const lang = detectLanguage(messageText);
  const histCtx = analyzeHistory(history);
  const detectedLocation = extractLocation(messageText);

  // ─── 1. TOP PRIORITY: NATURAL CONVERSATIONAL & SMALL-TALK PHRASES ───────────

  // A. "Mai bhi thik hu", "Mai badhiya", "Sab theek", "Doing well"
  if (
    norm.includes("mai bhi thik") ||
    norm.includes("mai bhi theek") ||
    norm.includes("main bhi theek") ||
    norm.includes("main bhi thik") ||
    norm.includes("hum bhi theek") ||
    norm.includes("sab badhiya") ||
    norm.includes("sab theek") ||
    norm.includes("sab mast") ||
    norm.includes("theek hu") ||
    norm.includes("thik hu") ||
    norm.includes("badhiya hu") ||
    norm.includes("badhiya hoon") ||
    norm.includes("i am good") ||
    norm.includes("im good") ||
    norm.includes("doing well") ||
    norm.includes("all good") ||
    norm.includes("great here") ||
    norm === "badhiya" ||
    norm === "mast" ||
    norm === "thik" ||
    norm === "theek" ||
    norm === "fine" ||
    norm === "good"
  ) {
    return {
      intent: "conversation",
      language: lang,
      service_category: null,
      problem_description: null,
      urgency: "normal",
      location: null,
      location_required: false,
      booking_requested: false,
      missing_information: [],
      response: lang === "hinglish" || lang === "hindi"
        ? "Sunkar accha laga! Bataiye, aaj main aapki kya madad kar sakti hoon?"
        : "Glad to hear that! How can I help you today?"
    };
  }

  // B. "Kaise ho", "How are you", "Kya haal chaal"
  if (norm.includes("kaise ho") || norm.includes("kya haal") || norm.includes("kaisa hai") || norm.includes("kaise hain")) {
    return {
      intent: "conversation",
      language: "hinglish",
      service_category: null,
      problem_description: null,
      urgency: "normal",
      location: null,
      location_required: false,
      booking_requested: false,
      missing_information: [],
      response: "Main theek hoon. Aap batao, kaise help kar sakta hoon?"
    };
  }

  if (norm.includes("how are you") || norm.includes("how're you") || norm.includes("how r u")) {
    return {
      intent: "conversation",
      language: "english",
      service_category: null,
      problem_description: null,
      urgency: "normal",
      location: null,
      location_required: false,
      booking_requested: false,
      missing_information: [],
      response: "I'm doing great, thank you! How can I help you today?"
    };
  }

  // C. Greetings ("Hi", "Hello", "Hey", "Namaste", "Salam")
  if (norm === "hi" || norm === "hello" || norm === "hey" || norm === "namaste" || norm === "namaskar" || norm === "salam" || norm === "halo") {
    return {
      intent: "conversation",
      language: lang,
      service_category: null,
      problem_description: null,
      urgency: "normal",
      location: null,
      location_required: false,
      booking_requested: false,
      missing_information: [],
      response: lang === "hinglish" || lang === "hindi" ? "Hey! Kaise help kar sakta hoon?" : "Hey! How can I help you today?"
    };
  }

  // D. "Aur batao", "Kya chal raha hai", "What's up"
  if (norm.includes("aur batao") || norm.includes("aur sunao") || norm.includes("kya chal raha") || norm.includes("kya chal rha") || norm.includes("what's up") || norm.includes("whats up") || norm === "sup") {
    return {
      intent: "conversation",
      language: lang,
      service_category: null,
      problem_description: null,
      urgency: "normal",
      location: null,
      location_required: false,
      booking_requested: false,
      missing_information: [],
      response: lang === "hinglish" || lang === "hindi"
        ? "Bas sab badhiya! Aap batao, aaj koi kaam ya sawaal hai?"
        : "All good here! What's on your mind today?"
    };
  }

  // E. "Kuch nahi", "Bas aise hi", "Nothing"
  if (norm.includes("kuch nahi") || norm.includes("kuch nhi") || norm.includes("bas aise hi") || norm === "nothing" || norm.includes("just checking")) {
    return {
      intent: "conversation",
      language: lang,
      service_category: null,
      problem_description: null,
      urgency: "normal",
      location: null,
      location_required: false,
      booking_requested: false,
      missing_information: [],
      response: lang === "hinglish" || lang === "hindi"
        ? "Haha koi baat nahi! Jab bhi kisi service ya help ki zaroorat ho, bas bata dena."
        : "No problem at all! Feel free to ask whenever you need any assistance."
    };
  }

  // F. Gratitude ("Thanks", "Thank you", "Dhanyawad", "Shukriya")
  if (norm.includes("thank") || norm.includes("dhanyawad") || norm.includes("shukriya") || norm.includes("dhanyavaad")) {
    return {
      intent: "conversation",
      language: lang,
      service_category: null,
      problem_description: null,
      urgency: "normal",
      location: null,
      location_required: false,
      booking_requested: false,
      missing_information: [],
      response: lang === "hinglish" || lang === "hindi"
        ? "Aapka swagat hai! Kisi aur cheez mein madad chahiye toh zaroor batayein."
        : "You're very welcome! Let me know if you need anything else."
    };
  }

  // G. Farewells ("Bye", "Goodbye", "Alvida", "Good night")
  if (norm.includes("bye") || norm.includes("goodbye") || norm.includes("alvida") || norm.includes("good night") || norm.includes("shubh ratri")) {
    return {
      intent: "conversation",
      language: lang,
      service_category: null,
      problem_description: null,
      urgency: "normal",
      location: null,
      location_required: false,
      booking_requested: false,
      missing_information: [],
      response: lang === "hinglish" || lang === "hindi"
        ? "Take care! Jab bhi zaroorat ho, Skill-Link yahan hai. Alvida!"
        : "Goodbye! Have a wonderful day, and feel free to reach out anytime."
    };
  }

  // H. Jokes & Boredom
  if (norm.includes("joke") || norm.includes("chutkula") || norm.includes("hasao")) {
    return {
      intent: "conversation",
      language: lang,
      service_category: null,
      problem_description: null,
      urgency: "normal",
      location: null,
      location_required: false,
      booking_requested: false,
      missing_information: [],
      response: "Why did the developer go broke? Because he used up all his cache!"
    };
  }

  if (norm.includes("bored") || norm.includes("bore ho")) {
    return {
      intent: "conversation",
      language: lang,
      service_category: null,
      problem_description: null,
      urgency: "normal",
      location: null,
      location_required: false,
      booking_requested: false,
      missing_information: [],
      response: "Want to chat, hear a quick fun fact, or explore some handy services?"
    };
  }

  // I. Casual mention of relatives' profession (NOT a booking)
  if ((norm.includes("brother") || norm.includes("friend") || norm.includes("dost") || norm.includes("bhai") || norm.includes("uncle") || norm.includes("chacha")) &&
      (norm.includes("mechanic") || norm.includes("plumber") || norm.includes("electrician") || norm.includes("engineer"))) {
    return {
      intent: "conversation",
      language: lang,
      service_category: null,
      problem_description: null,
      urgency: "normal",
      location: null,
      location_required: false,
      booking_requested: false,
      missing_information: [],
      response: "That's awesome! It's always great to have a skilled expert in the family."
    };
  }

  // ─── 2. GENERAL TECHNICAL / WORLD KNOWLEDGE QUESTIONS ──────────────────────

  if (norm.includes("what is javascript") || norm.includes("what is js")) {
    return {
      intent: "general_question",
      language: lang,
      service_category: null,
      problem_description: null,
      urgency: "normal",
      location: null,
      location_required: false,
      booking_requested: false,
      missing_information: [],
      response: "JavaScript is a lightweight, interpreted programming language widely used to build dynamic, interactive websites and scalable full-stack applications."
    };
  }

  if (norm.includes("what is python")) {
    return {
      intent: "general_question",
      language: lang,
      service_category: null,
      problem_description: null,
      urgency: "normal",
      location: null,
      location_required: false,
      booking_requested: false,
      missing_information: [],
      response: "Python is a high-level, versatile programming language renowned for its clear syntax, readability, and powerful ecosystem across AI, machine learning, and web development."
    };
  }

  if (norm.includes("what is java") && !norm.includes("javascript")) {
    return {
      intent: "general_question",
      language: lang,
      service_category: null,
      problem_description: null,
      urgency: "normal",
      location: null,
      location_required: false,
      booking_requested: false,
      missing_information: [],
      response: "Java is an object-oriented, class-based programming language engineered with the 'Write Once, Run Anywhere' (WORA) cross-platform philosophy."
    };
  }

  // ─── 3. SKILL-LINK PLATFORM KNOWLEDGE (RAG) ────────────────────────────────

  if (norm.includes("what is skill-link") || norm.includes("what is skill link") || norm.includes("skill-link kya hai") || norm.includes("skill link kya hai")) {
    return {
      intent: "skill_link_question",
      language: lang,
      service_category: null,
      problem_description: null,
      urgency: "normal",
      location: null,
      location_required: false,
      booking_requested: false,
      missing_information: [],
      response: lang === "hinglish"
        ? "Skill-Link ek AI-powered service marketplace hai jo clients ko verified local skilled workers (plumbers, electricians, mechanics, technicians) se connect karta hai. Aap bina kisi complex form ke seedhe apni problem bata sakte hain, aur main aapko suitable workers se connect kar dungi."
        : "Skill-Link is an AI-powered service marketplace that connects clients with skilled local workers. You can simply describe what you need, and Lexi will help identify the right service and guide you through the process."
    };
  }

  if (norm.includes("how does skill-link work") || norm.includes("how it works") || norm.includes("kaise kaam karta")) {
    return {
      intent: "skill_link_question",
      language: lang,
      service_category: null,
      problem_description: null,
      urgency: "normal",
      location: null,
      location_required: false,
      booking_requested: false,
      missing_information: [],
      response: "Skill-Link works in 5 simple steps: 1) Describe your issue naturally. 2) Lexi identifies the trade and checks location. 3) Skill-Link ranks and matches verified workers. 4) You review profiles, prices, and confirm. 5) The technician arrives and completes the job."
    };
  }

  if (norm.includes("future of skill-link") || norm.includes("future vision") || norm.includes("roadmap") || norm.includes("future kya hai")) {
    return {
      intent: "skill_link_question",
      language: lang,
      service_category: null,
      problem_description: null,
      urgency: "normal",
      location: null,
      location_required: false,
      booking_requested: false,
      missing_information: [],
      response: "Skill-Link's long-term roadmap aims to build a complete autonomous home & roadside service ecosystem, featuring real-time GPS technician tracking, predictive IoT maintenance, multilingual voice AI, and pan-India expansion."
    };
  }

  // ─── 4. CANCELLATION INTENT ────────────────────────────────────────────────

  if (norm === "cancel" || norm.includes("cancel booking") || norm.includes("cancel it") || norm.includes("cancel karo") || norm.includes("mat bhejo")) {
    return {
      intent: "cancellation_request",
      language: lang,
      service_category: null,
      problem_description: "User wants to cancel booking",
      urgency: "normal",
      location: null,
      location_required: false,
      booking_requested: false,
      missing_information: [],
      response: lang === "hinglish"
        ? "Aapki booking cancel kar di gayi hai. Aapka koi charge nahi katega."
        : "Your booking request has been cancelled cleanly. No charges have been deducted."
    };
  }

  // ─── 5. MULTI-TURN LOCATION FOLLOW-UP (AFTER ASKING LOCATION) ──────────────

  const explicitLocation = detectedLocation || (
    histCtx.askedForLocation &&
    norm.length <= 35 &&
    (norm.includes("chandigarh") || norm.includes("delhi") || norm.includes("sector") || norm.includes("noida") || norm.includes("gurgaon") || norm.includes("mohali") || norm.includes("panchkula"))
      ? messageText.trim()
      : null
  );

  if (histCtx.askedForLocation && explicitLocation) {
    const loc = explicitLocation;
    const cat = histCtx.lastCategory || currentState?.pendingCategory || "mechanic_car";
    const isHindi = lang === "hinglish" || lang === "hindi";

    return {
      intent: "service_request",
      language: lang,
      service_category: cat,
      problem_description: `User provided location for ${cat} request`,
      urgency: histCtx.lastUrgency || "normal",
      location: loc,
      location_required: false,
      booking_requested: false,
      missing_information: [],
      response: isHindi
        ? `Okay. ${loc} mein ${getCategoryDisplayName(cat, "hi")} ke liye available workers check karta hoon.`
        : `Okay. Checking available workers for ${getCategoryDisplayName(cat, "en")} in ${loc}.`
    };
  }

  // ─── 6. EMERGENCY SERVICE INTENT ───────────────────────────────────────────

  const emergencyKeywords = [
    "burst", "flooding", "ghar mein paani bhar raha", "paani bhar raha", "short circuit", "spark", "current lag gaya",
    "highway", "highway pe fasa", "highway par band", "highway breakdown", "accident", "gas leak", "urgent roadside help", "car band ho gayi highway", "road par phas"
  ];
  const isEmergency = emergencyKeywords.some(k => norm.includes(k));

  if (isEmergency) {
    let cat = "roadside_sos";
    if (norm.includes("pipe") || norm.includes("burst") || norm.includes("paani") || norm.includes("nal")) cat = "plumber";
    if (norm.includes("short circuit") || norm.includes("spark") || norm.includes("current") || norm.includes("switchboard")) cat = "electrician";
    if (norm.includes("gas leak")) cat = "gas_emergency";

    const isHindi = lang === "hinglish" || lang === "hindi";
    return {
      intent: "emergency_service",
      language: lang,
      service_category: cat,
      problem_description: messageText,
      urgency: "emergency",
      location: detectedLocation,
      location_required: !detectedLocation,
      booking_requested: false,
      missing_information: detectedLocation ? [] : ["location"],
      response: detectedLocation
        ? (isHindi
            ? `Ye urgent lag raha hai. ${detectedLocation} ke liye emergency workers aur official helplines connect kar raha hoon.`
            : `This sounds urgent. Connecting emergency technicians and 24/7 verified helplines for ${detectedLocation}.`)
        : (isHindi
            ? "Ye urgent lag raha hai. Aapki current location kya hai? Main emergency assistance ke liye available workers check karunga."
            : "That sounds urgent. What is your current location so I can search for immediate emergency assistance?")
    };
  }

  // ─── 7. EXPLICIT OR IMPLIED SERVICE REQUESTS ────────────────────────────────

  const serviceMatches = detectServiceIntent(norm);
  if (serviceMatches) {
    const isHindi = lang === "hinglish" || lang === "hindi";
    const loc = detectedLocation || (currentState?.location && !currentState.location.includes("Current GPS") ? currentState.location : null);
    const missing = loc ? [] : ["location"];

    let naturalResp = "";
    if (!loc) {
      if (serviceMatches.category === "mechanic_car") {
        naturalResp = isHindi
          ? "Samajh gaya. Aapko mechanic ki help chahiye. Aapki current location kya hai?"
          : "I can help you find a mechanic. What is your current location?";
      } else if (serviceMatches.category === "plumber") {
        naturalResp = isHindi
          ? "Sure. Aapko plumber kis location par chahiye?"
          : "Sure. What location do you need the plumber for?";
      } else if (serviceMatches.category === "electrician") {
        naturalResp = isHindi
          ? "Samajh gaya. Electrician service ke liye aapki location kya hai?"
          : "I can help you find a verified electrician. What is your location?";
      } else if (serviceMatches.category === "ac") {
        naturalResp = isHindi
          ? "Samajh gaya. AC technician ke liye aapki location kya hai?"
          : "I can help you find an AC technician. Where do you need the service?";
      } else {
        naturalResp = isHindi
          ? `Samajh gaya. ${serviceMatches.nameHi} service ke liye aapki location kya hai?`
          : `I can help you with ${serviceMatches.nameEn}. What is your location?`;
      }
    } else {
      naturalResp = isHindi
        ? `Samajh gaya. ${loc} mein ${serviceMatches.nameHi} ke liye available verified workers check kar raha hoon.`
        : `Got it. Checking available verified workers for ${serviceMatches.nameEn} in ${loc}.`;
    }

    return {
      intent: serviceMatches.isBookingDirect ? "booking_request" : "service_request",
      language: lang,
      service_category: serviceMatches.category,
      problem_description: messageText,
      urgency: "normal",
      location: loc,
      location_required: !loc,
      booking_requested: serviceMatches.isBookingDirect,
      missing_information: missing,
      response: naturalResp
    };
  }

  // 8. Informational: "what does a plumber do"
  if (norm.includes("what does a plumber do") || norm.includes("plumber kya karta hai")) {
    return {
      intent: "general_question",
      language: lang,
      service_category: null,
      problem_description: null,
      urgency: "normal",
      location: null,
      location_required: false,
      booking_requested: false,
      missing_information: [],
      response: "A plumber installs, repairs, and maintains pipes, valves, fittings, drainage systems, and fixtures for water supply and waste disposal."
    };
  }

  // Default clean conversational response matching language
  return {
    intent: "conversation",
    language: lang,
    service_category: null,
    problem_description: null,
    urgency: "normal",
    location: null,
    location_required: false,
    booking_requested: false,
    missing_information: [],
    response: lang === "hinglish"
      ? "Samajh gaya. Aap bataiye, main aapki kya madad kar sakta hoon?"
      : "I understand. Let me know how I can help you."
  };
}

// ─── HELPER: SERVICE INTENT DETECTOR ─────────────────────────────────────────

interface ServiceDetectResult {
  category: string;
  nameEn: string;
  nameHi: string;
  isBookingDirect: boolean;
}

function detectServiceIntent(norm: string): ServiceDetectResult | null {
  const isBookingDirect = (norm.includes("book ") || norm.includes("confirm booking") || norm.startsWith("book") || norm.includes("hire ")) && !norm.includes("chahiye");

  // 1. Bike / Two-Wheeler Repair
  if (
    norm.includes("bike") || norm.includes("motorcycle") || norm.includes("scooty") || norm.includes("activa") || norm.includes("scooter") || norm.includes("two wheeler")
  ) {
    if (
      norm.includes("kharab") || norm.includes("band") || norm.includes("start") || norm.includes("repair") || norm.includes("mechanic") ||
      norm.includes("puncture") || norm.includes("service") || norm.includes("problem") || norm.includes("issue") || norm.includes("chahiye") || norm.includes("worker")
    ) {
      return {
        category: "bike_repair",
        nameEn: "Bike & Two-Wheeler Mechanic",
        nameHi: "Bike Mechanic",
        isBookingDirect
      };
    }
  }

  // 2. Car & Automobile Repair
  if (
    norm.includes("car") || norm.includes("gadi") || norm.includes("four wheeler") || norm.includes("automobile")
  ) {
    if (
      norm.includes("kharab") || norm.includes("band") || norm.includes("start") || norm.includes("repair") || norm.includes("mechanic") ||
      norm.includes("breakdown") || norm.includes("heating") || norm.includes("smoke") || norm.includes("chahiye") || norm.includes("worker")
    ) {
      return {
        category: "mechanic_car",
        nameEn: "Car Mechanic",
        nameHi: "Car Mechanic",
        isBookingDirect
      };
    }
  }

  // 3. General Mechanic
  if (norm.includes("mechanic") || norm.includes("mistry")) {
    return {
      category: "mechanic_car",
      nameEn: "Automobile Mechanic",
      nameHi: "Mechanic",
      isBookingDirect
    };
  }

  // 4. Plumber & Pipeline
  if (
    norm.includes("plumber") || norm.includes("tap") || norm.includes("nal") || norm.includes("pipe") || norm.includes("leak") ||
    norm.includes("sink") || norm.includes("drain") || norm.includes("water motor") || norm.includes("water tank") || norm.includes("commode")
  ) {
    return {
      category: "plumber",
      nameEn: "Plumber",
      nameHi: "Plumber",
      isBookingDirect
    };
  }

  // 5. Electrician & Wiring
  if (
    (norm.includes("electrician") && !norm.includes("brother") && !norm.includes("friend") && !norm.includes("dost")) ||
    norm.includes("bijli") || norm.includes("switchboard") || norm.includes("short circuit") || norm.includes("mcb") ||
    norm.includes("fan") || norm.includes("wiring") || norm.includes("spark") || norm.includes("inverter")
  ) {
    return {
      category: "electrician",
      nameEn: "Electrician",
      nameHi: "Electrician",
      isBookingDirect
    };
  }

  // 6. AC & Cooling
  if (
    norm.includes("ac ") || norm.startsWith("ac") || norm.includes("air conditioner") || norm.includes("cooling") || norm.includes("jet service")
  ) {
    if (norm.includes("kharab") || norm.includes("cooling") || norm.includes("thanda") || norm.includes("repair") || norm.includes("service") || norm.includes("gas") || norm.includes("chahiye")) {
      return {
        category: "ac",
        nameEn: "AC Technician",
        nameHi: "AC Technician",
        isBookingDirect
      };
    }
  }

  // 7. Refrigerator / Fridge
  if (norm.includes("fridge") || norm.includes("refrigerator") || norm.includes("freezer")) {
    return {
      category: "refrigerator_repair",
      nameEn: "Refrigerator Technician",
      nameHi: "Fridge Repair",
      isBookingDirect
    };
  }

  // 8. Washing Machine
  if (norm.includes("washing machine") || norm.includes("washer") || norm.includes("kapde dhone wali machine")) {
    return {
      category: "washing_machine_repair",
      nameEn: "Washing Machine Technician",
      nameHi: "Washing Machine Repair",
      isBookingDirect
    };
  }

  // 9. Laptop & Computer
  if (norm.includes("laptop") || norm.includes("computer") || norm.includes("pc ") || norm.includes("desktop") || norm.includes("blue screen")) {
    return {
      category: "computer_repair",
      nameEn: "Computer & Laptop Engineer",
      nameHi: "Laptop Repair",
      isBookingDirect
    };
  }

  // 10. Mobile Phone
  if (norm.includes("mobile") || norm.includes("phone ki screen") || norm.includes("smartphone") || norm.includes("touch screen") || norm.includes("charging jack")) {
    return {
      category: "mobile_repair",
      nameEn: "Mobile Phone Technician",
      nameHi: "Mobile Repair",
      isBookingDirect
    };
  }

  // 11. RO & Water Purifier
  if (norm.includes("ro ") || norm.startsWith("ro") || norm.includes("water purifier") || norm.includes("aquaguard") || norm.includes("kent ro")) {
    return {
      category: "ro_repair",
      nameEn: "RO & Water Purifier Technician",
      nameHi: "RO Purifier Service",
      isBookingDirect
    };
  }

  // 12. Carpenter & Woodwork
  if (norm.includes("carpenter") || norm.includes("badhai") || norm.includes("furniture") || norm.includes("door lock") || norm.includes("darwaza jam")) {
    return {
      category: "carpenter",
      nameEn: "Carpenter",
      nameHi: "Carpenter",
      isBookingDirect
    };
  }

  // 13. Painter
  if (norm.includes("painter") || norm.includes("painting") || norm.includes("wall paint") || norm.includes("putty") || norm.includes("seelan")) {
    return {
      category: "painter",
      nameEn: "House Painter",
      nameHi: "Painter",
      isBookingDirect
    };
  }

  // 14. Deep Cleaning
  if (norm.includes("cleaning") || norm.includes("deep clean") || norm.includes("sofa clean") || norm.includes("safai") || norm.includes("bathroom clean")) {
    return {
      category: "cleaning",
      nameEn: "Home Deep Cleaner",
      nameHi: "Home Cleaning",
      isBookingDirect
    };
  }

  // 15. CCTV
  if (norm.includes("cctv") || norm.includes("security camera") || norm.includes("dvr")) {
    return {
      category: "cctv_service",
      nameEn: "CCTV Technician",
      nameHi: "CCTV Installation",
      isBookingDirect
    };
  }

  // 16. Internet / WiFi
  if (norm.includes("wifi") || norm.includes("router") || norm.includes("broadband") || norm.includes("lan cable")) {
    return {
      category: "wifi_technician",
      nameEn: "WiFi & Internet Technician",
      nameHi: "WiFi Technician",
      isBookingDirect
    };
  }

  // 17. TV Repair
  if (norm.includes("tv ") || norm.startsWith("tv") || norm.includes("led tv") || norm.includes("television")) {
    return {
      category: "tv_repair",
      nameEn: "TV Technician",
      nameHi: "TV Repair",
      isBookingDirect
    };
  }

  return null;
}

function getCategoryDisplayName(catId: string, lang: "en" | "hi"): string {
  switch (catId) {
    case "mechanic_car":
    case "roadside_sos":
      return lang === "hi" ? "Mechanic" : "Vehicle Mechanic";
    case "plumber":
      return "Plumber";
    case "electrician":
      return "Electrician";
    case "ac":
      return lang === "hi" ? "AC Technician" : "AC Specialist";
    case "cleaning":
      return lang === "hi" ? "Deep Cleaning" : "Home Cleaning";
    case "appliances":
      return lang === "hi" ? "Appliance Repair" : "Appliance Technician";
    default:
      return catId;
  }
}

// ─── STAGE 2: DETERMINISTIC BACKEND ACTION DISPATCHER ────────────────────────

export function processUserUtterance(
  messageText: string,
  history: ConversationTurn[] = [],
  currentState?: {
    location?: string;
    pendingCategory?: string;
    step?: string;
    activeBookingId?: string;
  }
): AIActionResult {
  // 1. Run Semantic Understanding
  const understanding = analyzeMessageAndContext(messageText, history, currentState);

  // 2. Dispatch Stage 2 Action
  const isEmergency = understanding.intent === "emergency_service" || understanding.urgency === "emergency";
  const cat = understanding.service_category || "plumber";
  const loc = understanding.location || currentState?.location || "Your Area";

  const debugInfo = {
    intent: understanding.intent,
    language: understanding.language,
    serviceCategory: understanding.service_category,
    urgency: understanding.urgency,
    missingInfo: understanding.missing_information,
    location: understanding.location,
    provider: "Deterministic Semantic Engine",
    latencyMs: 15
  };

  // If Emergency: attach 24x7 verified emergency helplines + emergency workers
  if (isEmergency) {
    const helplines = getHelplines("emergency");
    const workers = searchAvailableWorkers(cat, loc, true);

    return {
      intent: understanding.intent,
      actionType: "SHOW_HELPLINES",
      speechText: understanding.response,
      language: understanding.language,
      debugInfo,
      payload: {
        category: cat,
        helplines: helplines.slice(0, 4),
        workers: workers.slice(0, 3),
        urgency: "emergency"
      }
    };
  }

  // If Service Request with location resolved -> search and attach real workers!
  if ((understanding.intent === "service_request" || understanding.intent === "booking_request") && !understanding.missing_information.includes("location") && understanding.location) {
    const workers = searchAvailableWorkers(cat, loc, false);

    return {
      intent: understanding.intent,
      actionType: "SHOW_WORKERS",
      speechText: understanding.response,
      language: understanding.language,
      debugInfo,
      payload: {
        category: cat,
        workers: workers.slice(0, 4),
        urgency: understanding.urgency
      }
    };
  }

  // If Service Request with missing location -> ask for location without rendering fake worker cards
  if (understanding.intent === "service_request" || understanding.intent === "booking_request") {
    return {
      intent: understanding.intent,
      actionType: "REQUEST_LOCATION",
      speechText: understanding.response,
      language: understanding.language,
      debugInfo,
      payload: {
        category: cat,
        locationPrompt: understanding.response
      }
    };
  }

  // If Skill-Link question
  if (understanding.intent === "skill_link_question") {
    return {
      intent: understanding.intent,
      actionType: "SHOW_SERVICES",
      speechText: understanding.response,
      language: understanding.language,
      debugInfo,
      payload: {
        categories: SERVICE_CATEGORIES.slice(0, 6)
      }
    };
  }

  // Default clean conversation or general question
  return {
    intent: understanding.intent,
    actionType: "GENERAL_REPLY",
    speechText: understanding.response,
    language: understanding.language,
    debugInfo
  };
}

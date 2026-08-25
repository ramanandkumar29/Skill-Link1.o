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
  const detectedLocation = extractLocation(messageText) || (histCtx.askedForLocation && norm.length < 30 && !norm.includes(" ") ? messageText.trim() : null);

  // 1. Check if user is responding with a location to a previous location question
  if (histCtx.askedForLocation && (detectedLocation || norm.length <= 25)) {
    const loc = detectedLocation || messageText.trim();
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

  // 2. Cancellation Intent
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

  // 3. Emergency Service Intent
  const emergencyKeywords = [
    "burst", "flooding", "ghar mein paani bhar raha", "short circuit", "spark", "current lag gaya",
    "highway pe fasa", "highway breakdown", "accident", "gas leak", "urgent roadside help", "car band ho gayi highway"
  ];
  const isEmergency = emergencyKeywords.some(k => norm.includes(k));

  if (isEmergency) {
    let cat = "roadside_sos";
    if (norm.includes("pipe") || norm.includes("burst") || norm.includes("paani")) cat = "plumber";
    if (norm.includes("short circuit") || norm.includes("spark") || norm.includes("current")) cat = "electrician";
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

  // 4. Explicit or Implied Service Requests
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

  // 5. Questions about Skill-Link platform
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
      response: "Skill-Link works in simple steps: 1) You describe your issue naturally. 2) Lexi identifies the required service. 3) Skill-Link matches available verified workers. 4) You review profiles, prices, and confirm. 5) The worker completes the job and you can rate them."
    };
  }

  if (norm.includes("future of skill-link") || norm.includes("future vision") || norm.includes("roadmap")) {
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
      response: "Skill-Link's long-term vision is to become a complete AI-powered service ecosystem. Planned future capabilities include advanced AI worker matching, voice interaction, multilingual support, real-time worker tracking, predictive maintenance, and regional expansion."
    };
  }

  // 6. General Questions (e.g. "what is javascript", "what is java", "explain python") -> Standard ChatGPT-like reply without mentioning Skill-Link!
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
      response: "JavaScript is a lightweight, interpreted programming language widely used to create interactive and dynamic web applications across both client-side and server-side environments."
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
      response: "Java is a popular, class-based, object-oriented programming language designed to have as few implementation dependencies as possible, following the 'write once, run anywhere' philosophy."
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
      missing_information: [],
      response: "Python is a high-level, interpreted programming language renowned for its clear syntax, readability, and versatile ecosystem in web development, data science, and artificial intelligence."
    };
  }

  // 7. Conversational checks: "kaise ho", "how are you", "hi", "tell me a joke", "i'm bored", "my brother is an electrician"
  if (norm.includes("kaise ho") || norm.includes("kya haal")) {
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

  if (norm === "hi" || norm === "hello" || norm === "hey" || norm === "namaste") {
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
      response: lang === "hinglish" ? "Hey! Aap batao, kaise help kar sakta hoon?" : "Hey! How can I help you today?"
    };
  }

  if (norm.includes("how are you")) {
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
      response: "I'm doing great! What are you up to today?"
    };
  }

  if (norm.includes("joke") || norm.includes("chutkula")) {
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
      response: "Want to chat, hear a quick fact, or talk about something interesting?"
    };
  }

  // 8. Casual mention of someone's profession (NOT a booking)
  if ((norm.includes("brother") || norm.includes("friend") || norm.includes("dost") || norm.includes("bhai")) &&
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
      response: lang === "hinglish"
        ? "Badiya! Skilled professionals ka field mein hona bahut zaroori hota hai. Aur batao, kya chal raha hai?"
        : "That's great! Having skilled professionals in the family or friend circle is always awesome. What are you up to today?"
    };
  }

  // 9. Informational: "what does a plumber do"
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
  // Check vehicle / mechanic
  const carWords = ["car kharab", "gadi kharab", "bike start", "car breakdown", "bike breakdown", "need a mechanic", "mechanic chahiye", "book a mechanic", "car repair", "bike repair", "scooter repair"];
  if (carWords.some(w => norm.includes(w)) || (norm.includes("car") && (norm.includes("kharab") || norm.includes("broken") || norm.includes("repair") || norm.includes("fix") || norm.includes("start")))) {
    return {
      category: "mechanic_car",
      nameEn: "Vehicle Mechanic",
      nameHi: "Car / Bike Mechanic",
      isBookingDirect: norm.includes("book") || norm.includes("hire") || norm.includes("bhejo")
    };
  }

  // Check plumber
  const plumbWords = ["plumber", "tap leak", "pipe leak", "nal kharab", "tap kharab", "pipe kharab", "bathroom leak", "sink leak", "drain blocked", "plumber chahiye", "book a plumber", "need a plumber"];
  if (plumbWords.some(w => norm.includes(w)) || (norm.includes("leak") && (norm.includes("tap") || norm.includes("pipe") || norm.includes("sink") || norm.includes("bathroom")))) {
    return {
      category: "plumber",
      nameEn: "Plumber",
      nameHi: "Plumber",
      isBookingDirect: norm.includes("book") || norm.includes("hire") || norm.includes("bhejo")
    };
  }

  // Check electrician
  const elecWords = ["electrician", "electrician chahiye", "book electrician", "wiring kharab", "switch kharab", "fan kharab", "mcb trip", "light repair", "fan repair"];
  if (elecWords.some(w => norm.includes(w)) || (norm.includes("electrician") && !norm.includes("brother") && !norm.includes("friend"))) {
    return {
      category: "electrician",
      nameEn: "Electrician",
      nameHi: "Electrician",
      isBookingDirect: norm.includes("book") || norm.includes("hire") || norm.includes("bhejo")
    };
  }

  // Check AC
  const acWords = ["ac kaam nahi kar raha", "ac cooling", "ac not cooling", "ac repair", "ac service", "ac technician"];
  if (acWords.some(w => norm.includes(w))) {
    return {
      category: "ac",
      nameEn: "AC Technician",
      nameHi: "AC Technician",
      isBookingDirect: norm.includes("book") || norm.includes("hire") || norm.includes("bhejo")
    };
  }

  // Check cleaning
  const cleanWords = ["cleaning chahiye", "house cleaning", "deep clean", "sofa cleaning", "ghar ki safai"];
  if (cleanWords.some(w => norm.includes(w))) {
    return {
      category: "cleaning",
      nameEn: "Home Cleaning",
      nameHi: "Deep Cleaning",
      isBookingDirect: norm.includes("book") || norm.includes("hire") || norm.includes("bhejo")
    };
  }

  // Check appliances
  const appWords = ["fridge kharab", "refrigerator repair", "washing machine repair", "microwave repair", "geyser repair"];
  if (appWords.some(w => norm.includes(w))) {
    return {
      category: "appliances",
      nameEn: "Appliance Repair",
      nameHi: "Appliance Repair",
      isBookingDirect: norm.includes("book") || norm.includes("hire") || norm.includes("bhejo")
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

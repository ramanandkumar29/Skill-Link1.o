import {
  SERVICE_CATEGORIES,
  SERVICE_ITEMS,
  VERIFIED_HELPLINES,
  searchAvailableWorkers,
  getPriceEstimate,
  getWorkerProfile,
  getHelplines,
  WorkerMatchResult,
  PriceEstimate,
  HelplineItem,
  ServiceCategory
} from "./servicesCatalog";
import { WorkerProfile, OnRoadMechanic } from "./seedData";

export type AIIntentType =
  | "GENERAL_CONVERSATION"
  | "SERVICE_INFORMATION"
  | "SERVICE_REQUEST"
  | "EMERGENCY_SERVICE"
  | "BOOKING_CONFIRMATION"
  | "CANCEL_BOOKING"
  | "LOCATION_PROVIDED"
  | "WORKER_SELECTED"
  | "PAYMENT_CONFIRMATION";

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

export interface AIActionResult {
  intent: AIIntentType;
  actionType: AIActionType;
  speechText: string;
  thought?: string;
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
    urgency?: "normal" | "high" | "emergency";
  };
}

export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
}

// ─── HELPER PATTERN DETECTORS ────────────────────────────────────────────────

const GREETINGS = [
  "hi", "hii", "hiii", "hello", "hey", "heyy", "namaste", "namaskar", "pranam",
  "good morning", "good afternoon", "good evening", "kaise ho", "kya haal", "how are you",
  "who are you", "kaun ho", "kya kar sakti ho"
];

const DIY_ADVICE_KEYWORDS = [
  "how to fix", "how can i fix", "how do i repair", "kaise theek karein", "kaise fix kare",
  "diy", "tips to fix", "what should i do if", "kya karu agar", "reason for", "kyu hota hai",
  "how it works", "kaise kaam karta hai", "self repair", "apne aap theek"
];

const SERVICE_INFO_KEYWORDS = [
  "what services", "services list", "konse service", "kya kya service", "kya kaam karte ho",
  "charges", "rates", "pricing list", "service catalog", "kya provide karte ho", "all services"
];

const EXPLICIT_SERVICE_REQUESTS = [
  "book", "chahiye", "bhejo", "send someone", "find me a", "need a", "arrange a",
  "hire", "bulana hai", "lagwana hai", "karwana hai", "plumber chahiye", "electrician chahiye",
  "mechanic chahiye", "ac service karwani hai", "book a plumber", "book an electrician",
  "book a mechanic", "find me an electrician", "send a mechanic"
];

const EMERGENCY_KEYWORDS = [
  "emergency", "accident", "burst", "fat gaya", "toot gaya", "highway breakdown",
  "car band ho gayi", "bike band", "gadi raste me", "stuck on road", "gas leak", "gas smell",
  "short circuit", "spark", "current lag gaya", "locked out", "lockout", "chabi kho gayi",
  "urgent help", "roadside sos", "highway pe fasa", "help me urgently"
];

const CONFIRMATION_KEYWORDS = [
  "yes", "haan", "ha", "book him", "book her", "confirm this", "proceed", "select this",
  "confirm booking", "bhej do", "theek hai book karo", "pay now", "continue", "agreed"
];

const CANCELLATION_KEYWORDS = [
  "cancel", "cancel it", "cancel booking", "mat bhejo", "cancel karo", "dont need",
  "no need", "cancel service", "cancel my booking"
];

/**
 * Normalizes input text for multi-lingual & Hinglish pattern matching
 */
function normalize(text: string): string {
  return text.toLowerCase().replace(/['".,\/#!$%\^&\*;:{}=\-_`~()]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Classifies user message into one of the Master System Prompt intents
 */
export function classifyIntent(text: string, context?: { lastIntent?: AIIntentType; pendingCategory?: string }): AIIntentType {
  const norm = normalize(text);

  // 1. Cancellation check
  if (CANCELLATION_KEYWORDS.some((k) => norm.includes(k))) {
    return "CANCEL_BOOKING";
  }

  // 2. Direct confirmation check (especially if in a pending service flow)
  if (context?.lastIntent && CONFIRMATION_KEYWORDS.some((k) => norm === k || norm.startsWith(k + " ") || norm.endsWith(" " + k))) {
    return "BOOKING_CONFIRMATION";
  }

  // 3. Emergency Service check (Highest Priority)
  if (EMERGENCY_KEYWORDS.some((k) => norm.includes(k))) {
    return "EMERGENCY_SERVICE";
  }

  // 4. DIY / Informational questions vs explicit service request
  if (DIY_ADVICE_KEYWORDS.some((k) => norm.includes(k))) {
    return "GENERAL_CONVERSATION";
  }

  // 5. Service Information inquiry
  if (SERVICE_INFO_KEYWORDS.some((k) => norm.includes(k))) {
    return "SERVICE_INFORMATION";
  }

  // 6. Explicit Service Request (e.g. "Book a plumber", "bhai electrician chahiye")
  if (EXPLICIT_SERVICE_REQUESTS.some((k) => norm.includes(k))) {
    return "SERVICE_REQUEST";
  }

  // 7. Problem Mention without booking phrase (e.g. "My pipe is leaking", "AC thanda nahi kar raha")
  // Rule #2 & #36: Mentioning a problem is NOT permission to book! It triggers advice + clarification.
  const problemWords = ["leak", "pipe", "tap", "nal", "ac", "cooling", "fan", "switch", "fridge", "car", "bike", "drain", "puncture"];
  if (problemWords.some((w) => norm.includes(w))) {
    return "GENERAL_CONVERSATION";
  }

  // 8. Simple Greeting
  if (GREETINGS.some((g) => norm === g || (norm.split(" ").length <= 2 && norm.includes(g)))) {
    return "GENERAL_CONVERSATION";
  }

  return "GENERAL_CONVERSATION";
}

/**
 * Extracts candidate service category from user utterance
 */
export function detectServiceCategory(text: string): { category: string; subcategory?: string; urgency: "normal" | "high" | "emergency" } {
  const norm = normalize(text);

  // Emergency / Breakdown
  if (norm.includes("breakdown") || norm.includes("highway") || norm.includes("towing") || norm.includes("car band") || norm.includes("bike band") || norm.includes("stuck")) {
    return { category: "roadside_sos", subcategory: "On-Road Emergency", urgency: "emergency" };
  }
  if (norm.includes("puncture") || norm.includes("tyre") || norm.includes("tire") || norm.includes("flat")) {
    return { category: "puncture", subcategory: "Tyre & Puncture SOS", urgency: "high" };
  }
  if (norm.includes("battery") || norm.includes("jumpstart") || norm.includes("cranking")) {
    return { category: "battery", subcategory: "Battery Jumpstart", urgency: "high" };
  }
  if (norm.includes("mechanic") || norm.includes("engine") || norm.includes("clutch") || norm.includes("brake")) {
    return { category: "mechanic_car", subcategory: "Car Mechanic", urgency: "normal" };
  }

  // Plumbing
  if (norm.includes("pipe burst") || norm.includes("paani overflow") || norm.includes("flooding")) {
    return { category: "plumber", subcategory: "Plumbing Emergency", urgency: "emergency" };
  }
  if (norm.includes("plumb") || norm.includes("pipe") || norm.includes("leak") || norm.includes("tap") || norm.includes("nal") || norm.includes("drain") || norm.includes("tank")) {
    return { category: "plumber", subcategory: "Plumbing Service", urgency: "normal" };
  }

  // Electrical
  if (norm.includes("short circuit") || norm.includes("spark") || norm.includes("mcb trip") || norm.includes("current")) {
    return { category: "electrician", subcategory: "Electrical Emergency", urgency: "emergency" };
  }
  if (norm.includes("electric") || norm.includes("wiring") || norm.includes("fan") || norm.includes("switch") || norm.includes("light") || norm.includes("fuse")) {
    return { category: "electrician", subcategory: "Electrical Repair", urgency: "normal" };
  }

  // AC
  if (norm.includes("ac") || norm.includes("cooling") || norm.includes("air cond") || norm.includes("jet service") || norm.includes("gas charge")) {
    return { category: "ac", subcategory: "AC Repair & Jet Cleaning", urgency: "normal" };
  }

  // Appliances
  if (norm.includes("fridge") || norm.includes("refrigerator") || norm.includes("washing machine") || norm.includes("geyser") || norm.includes("microwave") || norm.includes("appliance")) {
    return { category: "appliances", subcategory: "Home Appliance Repair", urgency: "normal" };
  }

  // Cleaning
  if (norm.includes("clean") || norm.includes("safai") || norm.includes("deep clean") || norm.includes("sofa")) {
    return { category: "cleaning", subcategory: "Deep Cleaning & Sanitization", urgency: "normal" };
  }

  // Locksmith & Woodwork
  if (norm.includes("lockout") || norm.includes("lock") || norm.includes("tala") || norm.includes("chabi") || norm.includes("key")) {
    return { category: "locksmith", subcategory: "Locksmith & Key Service", urgency: "high" };
  }
  if (norm.includes("carpenter") || norm.includes("furniture") || norm.includes("wood") || norm.includes("badhai")) {
    return { category: "carpenter", subcategory: "Carpentry & Woodwork", urgency: "normal" };
  }

  // Mason
  if (norm.includes("mason") || norm.includes("mistri") || norm.includes("tile") || norm.includes("granite") || norm.includes("plaster")) {
    return { category: "mason", subcategory: "Civil Masonry & Tiles", urgency: "normal" };
  }

  return { category: "plumber", subcategory: "General Home Repair", urgency: "normal" };
}

/**
 * Main Master Decision Engine Orchestrator
 * Maps user message -> Intent -> Tools -> Structured AI Action Payload
 */
export function processUserUtterance(
  messageText: string,
  history: ConversationTurn[] = [],
  currentState?: {
    step?: string;
    selectedCategory?: string;
    selectedLocation?: string;
    selectedWorkerId?: string;
    activeBookingId?: string;
  }
): AIActionResult {
  const norm = normalize(messageText);
  const detected = detectServiceCategory(messageText);
  const intent = classifyIntent(messageText, {
    lastIntent: currentState?.step as AIIntentType,
    pendingCategory: currentState?.selectedCategory
  });

  // ─── 1. GENERAL CONVERSATION (CHATGPT-LIKE DEFAULT: GREETINGS, CHAT, JOKES, DIY) ───
  if (intent === "GENERAL_CONVERSATION") {
    // 1A. Greetings & Check-ins
    if (norm === "hi" || norm === "hello" || norm === "hey" || norm === "namaste" || norm === "namaskar") {
      return {
        intent: "GENERAL_CONVERSATION",
        actionType: "GENERAL_REPLY",
        speechText: "Hey! 👋 How can I help you today?",
        thought: "Friendly greeting. Responding naturally like ChatGPT.",
      };
    }

    if (norm.includes("how are you") || norm.includes("kaise ho") || norm.includes("kya haal")) {
      return {
        intent: "GENERAL_CONVERSATION",
        actionType: "GENERAL_REPLY",
        speechText: "I'm doing great! 😄 What can I help you with?",
        thought: "Friendly check-in response.",
      };
    }

    if (norm.includes("joke") || norm.includes("chutkula")) {
      return {
        intent: "GENERAL_CONVERSATION",
        actionType: "GENERAL_REPLY",
        speechText: "Why did the developer go broke? Because he used up all his cache! 😄",
        thought: "Told a friendly programming joke.",
      };
    }

    if (norm.includes("bored") || norm.includes("bore ho")) {
      return {
        intent: "GENERAL_CONVERSATION",
        actionType: "GENERAL_REPLY",
        speechText: "Let's fix that 😄 Want to chat, play a quick trivia game, or talk about something interesting?",
        thought: "Conversational response to boredom.",
      };
    }

    // 1B. Questions about Skill-Link platform itself
    if (norm.includes("what is skill-link") || norm.includes("what is skill link") || norm.includes("skill-link kya hai") || norm.includes("skill link kya hai")) {
      return {
        intent: "SERVICE_INFORMATION",
        actionType: "SHOW_SERVICES",
        speechText: "Skill-Link is an AI-powered service marketplace that connects clients with skilled local workers. You can simply describe what you need, and I will help identify the right service and guide you through the process.",
        thought: "User asked about Skill-Link. Providing clear overview.",
        payload: {
          categories: SERVICE_CATEGORIES.slice(0, 6)
        }
      };
    }

    if (norm.includes("how does skill-link work") || norm.includes("how it works") || norm.includes("kaise kaam karta")) {
      return {
        intent: "SERVICE_INFORMATION",
        actionType: "GENERAL_REPLY",
        speechText: "Here's how Skill-Link works: 1) You describe your issue naturally. 2) I identify the needed service. 3) Skill-Link matches available verified workers. 4) You review profiles, prices, and confirm. 5) The worker completes the job and you can rate them!",
        thought: "Explained the 5-step Skill-Link workflow.",
      };
    }

    if (norm.includes("future of skill-link") || norm.includes("future vision") || norm.includes("roadmap")) {
      return {
        intent: "SERVICE_INFORMATION",
        actionType: "GENERAL_REPLY",
        speechText: "Skill-Link's long-term vision is to become a complete AI-powered service ecosystem. Planned future capabilities include advanced AI matching, voice interaction, multilingual support, real-time worker tracking, predictive maintenance, and regional expansion.",
        thought: "Discussed future vision and planned roadmap.",
      };
    }

    // 1C. Casual talk about professions (NOT a service request)
    if (norm.includes("my brother") || norm.includes("my friend") || norm.includes("mera dost") || norm.includes("bhai")) {
      return {
        intent: "GENERAL_CONVERSATION",
        actionType: "GENERAL_REPLY",
        speechText: "That's great! Having skilled professionals around is always awesome. 😄 What would you like to chat about?",
        thought: "User casually mentioned someone's profession. Conversational reply without booking trigger.",
      };
    }

    // 1D. Informational: "What does an electrician/plumber do?"
    if (norm.includes("what does a") || norm.includes("kya karta hai")) {
      return {
        intent: "GENERAL_CONVERSATION",
        actionType: "GENERAL_REPLY",
        speechText: "Skilled technicians handle repairs, installations, diagnostics, and routine maintenance for homes and vehicles to ensure everything runs safely and efficiently.",
        thought: "Provided educational answer to general question.",
      };
    }

    // 1E. Problem Mention without explicit booking: Give helpful tips & ask politely
    if (norm.includes("tap") || norm.includes("leak") || norm.includes("pipe")) {
      return {
        intent: "GENERAL_CONVERSATION",
        actionType: "GENERAL_REPLY",
        speechText: "To stop a leak, first shut off the local angle valve under the sink. If water still drips, the washer or cartridge might need replacing. Would you like me to help you find a plumber?",
        thought: "Provided DIY advice and politely asked if a technician is needed.",
        payload: {
          category: "plumber",
          clarificationOptions: ["Find available Plumbers", "DIY advice only"]
        }
      };
    }

    if (norm.includes("ac") || norm.includes("cooling")) {
      return {
        intent: "GENERAL_CONVERSATION",
        actionType: "GENERAL_REPLY",
        speechText: "AC cooling issues are commonly caused by dirty filters, dusty condenser coils, or low refrigerant gas. Try cleaning the filters first. Would you like me to check for nearby AC technicians?",
        thought: "Provided troubleshooting tips and offered technician assistance.",
        payload: {
          category: "ac",
          clarificationOptions: ["Search AC Technicians", "Just checking"]
        }
      };
    }

    // Default conversational response
    return {
      intent: "GENERAL_CONVERSATION",
      actionType: "GENERAL_REPLY",
      speechText: "I'm here to help! Whether you'd like to chat or need assistance with a service or question, feel free to ask. 😄",
      thought: "General conversational query handled smoothly.",
    };
  }

  // ─── 2. SERVICE INFORMATION INQUIRY ──────────────────────────────────────────
  if (intent === "SERVICE_INFORMATION") {
    return {
      intent: "SERVICE_INFORMATION",
      actionType: "SHOW_SERVICES",
      speechText: "Skill-Link par Home Services (Plumbing, Electrical, AC, Cleaning, Appliances, Carpentry), Vehicle Services (Car/Bike Mechanics, Puncture, Battery Jumpstart, Towing) aur 24/7 Emergency Services available hain. Aap inme se koi bhi category select kar sakte hain:",
      thought: "User requested service catalog. Displaying interactive category cards without starting a booking.",
      payload: {
        categories: SERVICE_CATEGORIES
      }
    };
  }

  // ─── 3. EMERGENCY SERVICE (HIGHEST PRIORITY) ─────────────────────────────────
  if (intent === "EMERGENCY_SERVICE") {
    const isRoadside = norm.includes("breakdown") || norm.includes("highway") || norm.includes("road") || norm.includes("towing") || norm.includes("puncture");
    const isGas = norm.includes("gas") || norm.includes("cylinder") || norm.includes("lpg");
    const isShortCircuit = norm.includes("spark") || norm.includes("short circuit") || norm.includes("fire");

    const categoryKey = isRoadside ? "roadside_sos" : isGas ? "gas_emergency" : isShortCircuit ? "electrical_emergency" : detected.category;
    const workers = searchAvailableWorkers({ category: categoryKey, emergency: true, maxResults: 3 });
    const emergencyHelplines = isGas ? getHelplines("gas") : isRoadside ? getHelplines("roadside") : isShortCircuit ? getHelplines("electrical") : getHelplines("police");

    let adviceText = "Ghabraiye mat! ";
    if (isRoadside) {
      adviceText += "Aap sabse pehle gaadi ko safe left side par park karke hazard warning lights ON kar lijiye. Agar engine garam hai toh radiator bilkul mat kholiye. Maine emergency-capable verified roadside providers search kar liye hain — aap inme se choose kar sakte hain:";
    } else if (isGas) {
      adviceText += "Kripya turant saare electric switches band rakhein, koi matchstick na jalayein, khidkiyan khol dein aur cylinder regulator band karein. National Gas Emergency 1906 par call karein ya nearby emergency tech choose karein:";
    } else if (isShortCircuit) {
      adviceText += "Turant ghar ka main MCB power switch OFF karein taaki electrical fire na faile. Maine paas ke priority electricians find kar liye hain:";
    } else {
      adviceText += "Safety first! Maine paas ke available emergency specialists match kiye hain. Kripya apna location confirm karein aur worker select karein:";
    }

    return {
      intent: "EMERGENCY_SERVICE",
      actionType: "SHOW_WORKERS",
      speechText: adviceText,
      thought: "EMERGENCY detected. Safety advice provided immediately, priority emergency workers matched by ETA/distance, official helpline provided.",
      payload: {
        category: categoryKey,
        urgency: "emergency",
        workers,
        helplines: emergencyHelplines
      }
    };
  }

  // ─── 4. EXPLICIT SERVICE REQUEST ─────────────────────────────────────────────
  if (intent === "SERVICE_REQUEST") {
    const targetCat = detected.category;
    const matchedWorkers = searchAvailableWorkers({
      category: targetCat,
      emergency: detected.urgency === "emergency",
      maxResults: 4
    });

    const categoryName = SERVICE_CATEGORIES.find((c) => c.id === targetCat)?.name || "Service";

    return {
      intent: "SERVICE_REQUEST",
      actionType: "SHOW_WORKERS",
      speechText: `Bilkul! Maine aapke paas ke verified ${categoryName} specialists search kar liye hain. Aap unki rating, ETA aur starting charges dekh kar apna pasandida worker select kar sakte hain:`,
      thought: `Explicit service request detected for [${targetCat}]. Returning ranked list of real verified workers for explicit user selection.`,
      payload: {
        category: targetCat,
        urgency: detected.urgency,
        workers: matchedWorkers,
        locationPrompt: "Sector 17, Chandigarh (Current Location)"
      }
    };
  }

  // ─── 5. BOOKING CONFIRMATION ────────────────────────────────────────────────
  if (intent === "BOOKING_CONFIRMATION") {
    // If a worker was selected or context holds a target, create price estimate / payment request
    const workerId = currentState?.selectedWorkerId || "1";
    const estimate = getPriceEstimate({
      workerId,
      category: currentState?.selectedCategory || detected.category
    });

    return {
      intent: "BOOKING_CONFIRMATION",
      actionType: "SHOW_PRICE_ESTIMATE",
      speechText: `Bohot badiya! Yahan aapki service ka transparent price estimate diya gaya hai. Aap payment method (UPI / Cash on Visit / Card) choose karke confirm kar sakte hain:`,
      thought: "User confirmed worker selection. Showing itemized price estimate before payment.",
      payload: {
        priceEstimate: estimate,
        selectedWorker: getWorkerProfile(workerId) || undefined
      }
    };
  }

  // ─── 6. CANCELLATION ────────────────────────────────────────────────────────
  if (intent === "CANCEL_BOOKING") {
    return {
      intent: "CANCEL_BOOKING",
      actionType: "BOOKING_CANCELLED",
      speechText: "Aapki booking request cancel kar di gayi hai. Aapka koi bhi cancellation charge nahi kata hai. Agar aapko koi aur service chahiye toh kripya batayein!",
      thought: "Booking cancellation request processed cleanly.",
      payload: {
        bookingId: currentState?.activeBookingId
      }
    };
  }

  return {
    intent: "GENERAL_CONVERSATION",
    actionType: "GENERAL_REPLY",
    speechText: "Skill-Link aapki seva me hajir hai. Aap mujhe batayein ki aapko kis service me sahayata chahiye!",
    thought: "Default fallback response."
  };
}

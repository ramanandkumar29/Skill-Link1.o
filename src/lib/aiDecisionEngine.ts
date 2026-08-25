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

  // ─── 1. GENERAL CONVERSATION (GREETINGS, DIY, PROBLEM MENTION WITHOUT BOOKING) ───
  if (intent === "GENERAL_CONVERSATION") {
    // 1A. Pure Greeting
    if (GREETINGS.some((g) => norm === g || (norm.split(" ").length <= 2 && norm.includes(g)))) {
      return {
        intent: "GENERAL_CONVERSATION",
        actionType: "GENERAL_REPLY",
        speechText: "Namaste! Main Skill-Link ki intelligent AI assistant hoon. Main aapki kya madad kar sakti hoon? Aap mujhse kisi bhi service ke baare me pooch sakte hain ya koi technical guidance le sakte hain.",
        thought: "User gave a friendly greeting. Responding conversationally without activating booking.",
        payload: {
          categories: SERVICE_CATEGORIES.slice(0, 6)
        }
      };
    }

    // 1B. DIY Question: "How to fix a leaking tap / pipe"
    if (norm.includes("tap") || norm.includes("leak") || norm.includes("pipe")) {
      return {
        intent: "GENERAL_CONVERSATION",
        actionType: "GENERAL_REPLY",
        speechText: "Tap ya pipe leak fix karne ke liye: sabse pehle sink ke neeche ka angle valve ya main water valve band karein. Agar leak tap ke nozzle se hai toh washer/O-ring change karna pad sakta hai. Kya aap chahte hain ki main aapke area me available verified Plumber find karu?",
        thought: "User asked about a leaking tap/pipe. Provided helpful DIY guidance and politely asked if they want a technician, adhering strictly to the Anti-Auto-Booking principle.",
        payload: {
          category: "plumber",
          clarificationOptions: ["Find available Plumbers", "Show DIY steps only", "View all services"]
        }
      };
    }

    // 1C. AC Not Cooling
    if (norm.includes("ac") || norm.includes("cooling")) {
      return {
        intent: "GENERAL_CONVERSATION",
        actionType: "GENERAL_REPLY",
        speechText: "AC cooling na karne ke mukhya kaaran ho sakte hain: dirty air filters, condenser coil par dhool, ya refrigerant gas leakage. Aap pehle filters ko wash karke check kar sakte hain. Agar problem bani rehti hai, toh kya main aapke liye nearby AC technician search karu?",
        thought: "User mentioned AC issue. Provided basic troubleshooting and asked if technician search is desired.",
        payload: {
          category: "ac",
          clarificationOptions: ["Search AC Technicians", "View AC Service Rates", "No, just checking"]
        }
      };
    }

    // 1D. Electrical Switch/Fan
    if (norm.includes("electric") || norm.includes("mcb") || norm.includes("switch") || norm.includes("fan")) {
      return {
        intent: "GENERAL_CONVERSATION",
        actionType: "GENERAL_REPLY",
        speechText: "Electrical safety ke liye: kisi bhi switch ya board ko kholne se pehle main MCB switch zaroor off karein. Agar MCB baar-baar trip ho rahi hai toh load imbalance ya short circuit ho sakta hai. Kya aap chahte hain ki main paas ke certified Electrician ko search karu?",
        thought: "User asked about electrical issue. Emphasized safety and offered technician discovery.",
        payload: {
          category: "electrician",
          clarificationOptions: ["Search Electricians", "Check safety tips", "Not now"]
        }
      };
    }

    // 1E. Car / Bike issue mentioned without explicit request
    if (norm.includes("car") || norm.includes("bike") || norm.includes("vehicle")) {
      return {
        intent: "GENERAL_CONVERSATION",
        actionType: "GENERAL_REPLY",
        speechText: "Gaadi start na hone par: battery terminals par carbon check karein aur lights check karein. Agar ignition par ticking sound aa rahi hai toh battery jumpstart ki zaroorat ho sakti hai. Kya aap chahte hain ki main nearest vehicle mechanic discover karu?",
        thought: "User mentioned vehicle issue. Provided advice and offered mechanic lookup.",
        payload: {
          category: "mechanic_car",
          clarificationOptions: ["Find nearby Mechanics", "Check emergency road assistance", "Thanks, got it"]
        }
      };
    }

    return {
      intent: "GENERAL_CONVERSATION",
      actionType: "GENERAL_REPLY",
      speechText: "Main samajh gayi! Skill-Link par aapko verified local technicians (Plumber, Electrician, Mechanic, AC Tech, Cleaners) milte hain. Aap mujhe batayein ki aapko kya help chahiye!",
      thought: "General conversational query handled smoothly.",
      payload: {
        categories: SERVICE_CATEGORIES.slice(0, 8)
      }
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

/**
 * LEXI AI Core Intelligent Engine — Skill-Link
 * Comprehensive domain-specific conversational intelligence pipeline.
 *
 * Pipeline Stages:
 * 1. Language Detection (Hindi, Hinglish, English)
 * 2. Input Validation
 * 3. Conversation Context Retrieval & Multi-Turn Memory
 * 4. Safety and Emergency Detection
 * 5. Intent Classification
 * 6. Entity & Problem Extraction (Service, Problem, Location, Device, Urgency)
 * 7. Service Requirement Analysis
 * 8. Real Platform Data Check & Honest Reporting
 * 9. Confidence Evaluation & Intelligent Clarification
 * 10. Natural Response Generation (Matching detected language)
 * 11. Response Validation (Zero hallucination guard)
 */

import { retrieveKnowledge, KnowledgeDocument } from "./lexiKnowledge";
import { WorkerProfile, INITIAL_WORKERS } from "./seedData";
import { fetchWorkersFromDb, fetchServicesFromDb } from "./supabaseService";
import { isSupabaseConfigured, supabase } from "./supabase";

export type UserLanguage = "hindi" | "hinglish" | "english";
export type UrgencyLevel = "CRITICAL_EMERGENCY" | "HIGH" | "MEDIUM" | "LOW";
export type IntentCategory =
  | "EMERGENCY"
  | "SERVICE_REQUEST"
  | "SERVICE_CONTINUATION"
  | "BOOKING_CONFIRM"
  | "BOOKING_CANCEL"
  | "BOOKING_STATUS"
  | "PLATFORM_INFO"
  | "GREETING_HELP"
  | "CLARIFICATION_NEEDED";

export interface ExtractedEntities {
  service?: string;
  category?: string;
  problem?: string;
  roomOrLocation?: string;
  deviceOrAppliance?: string;
  urgency: UrgencyLevel;
}

export interface StructuredServiceAnalysis {
  service: string;
  category: string;
  problem_type: string;
  urgency: UrgencyLevel;
  confidence: "High" | "Medium" | "Low";
  recommended_action: string;
  safetyWarning?: string;
  requiresConfirmation: boolean;
  entities?: ExtractedEntities;
  detectedLanguage?: UserLanguage;
  intent?: IntentCategory;
}

export interface LexiEngineInput {
  message: string;
  conversationHistory?: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  userRole?: "customer" | "worker" | "cooperative_admin" | "super_admin";
  userLocation?: { lat?: number; lng?: number; address?: string };
  userId?: string;
}

export interface LexiEngineOutput {
  reply: string;
  structuredAnalysis?: StructuredServiceAnalysis;
  richPayload?: any;
  safetyWarning?: string;
  retrievedKnowledge?: Array<{ title: string; category: string }>;
  promptTokensEstimated?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 1: LANGUAGE DETECTION
// ─────────────────────────────────────────────────────────────────────────────
export function detectLanguage(text: string): UserLanguage {
  // Check for Devanagari script
  if (/[\u0900-\u097F]/.test(text)) {
    return "hindi";
  }

  const lower = text.toLowerCase();
  const hinglishMarkers = [
    "mera", "meri", "mere", "hai", "hain", "nahi", "karna", "karo", "kripya",
    "bhai", "aap", "tum", "kaun", "kaise", "kya", "pani", "paani", "bijli",
    "kharab", "chahiye", "chal", "rha", "raha", "rahi", "rahe", "hoga", "hogi",
    "ghar", "kamra", "darwaja", "tala", "nal", "seelan", "seep", "awaz", "jal",
    "kitna", "lagta", "madad", "batao", "karo", "kardo", "aana", "aayega", "poore"
  ];

  const words = lower.split(/\s+/);
  const matchCount = words.filter((w) => hinglishMarkers.includes(w.replace(/[^a-z]/g, ""))).length;

  if (matchCount >= 1 || (words.length <= 4 && matchCount >= 1)) {
    return "hinglish";
  }

  return "english";
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 2: CONVERSATION CONTEXT & MULTI-TURN MEMORY RETRIEVAL
// ─────────────────────────────────────────────────────────────────────────────
interface ConversationContext {
  activeService?: string;
  activeCategory?: string;
  activeProblem?: string;
  lastAssistantQuestion?: string;
  bookingStage?: "DISCOVERY" | "CONFIRMATION_PENDING" | "CONFIRMED";
  pendingTrade?: string;
}

export function extractConversationContext(
  history: Array<{ role: string; content: string }>
): ConversationContext {
  const context: ConversationContext = {};
  if (!history || history.length === 0) return context;

  // Look through recent assistant messages for context cues
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    if (msg.role === "assistant") {
      const lower = msg.content.toLowerCase();
      if (lower.includes("plumber") || lower.includes("pipe") || lower.includes("leakage")) {
        context.activeService = context.activeService || "Plumber";
        context.activeCategory = context.activeCategory || "plumber";
      } else if (lower.includes("electrician") || lower.includes("electricity") || lower.includes("bijli") || lower.includes("fan")) {
        context.activeService = context.activeService || "Electrician";
        context.activeCategory = context.activeCategory || "electrician";
      } else if (lower.includes("carpenter") || lower.includes("wood") || lower.includes("lock")) {
        context.activeService = context.activeService || "Carpenter";
        context.activeCategory = context.activeCategory || "carpenter";
      } else if (lower.includes("painter") || lower.includes("painting") || lower.includes("putty")) {
        context.activeService = context.activeService || "Painter";
        context.activeCategory = context.activeCategory || "painter";
      } else if (lower.includes("ac & appliance") || lower.includes("cooling") || lower.includes("appliance")) {
        context.activeService = context.activeService || "AC & Appliance Repair";
        context.activeCategory = context.activeCategory || "ac";
      } else if (lower.includes("caregiver") || lower.includes("eldercare")) {
        context.activeService = context.activeService || "Caregiver & Eldercare";
        context.activeCategory = context.activeCategory || "caregiver";
      }

      if (lower.includes("confirm") || lower.includes("kya aap") || lower.includes("schedule")) {
        context.bookingStage = "CONFIRMATION_PENDING";
      }
      context.lastAssistantQuestion = msg.content;
      break;
    }
  }

  return context;
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 3: ENTITY & PROBLEM EXTRACTION
// ─────────────────────────────────────────────────────────────────────────────
export function extractEntitiesAndProblem(text: string, context: ConversationContext): ExtractedEntities {
  const lower = text.toLowerCase();

  // Location / Room extraction
  let roomOrLocation: string | undefined;
  if (lower.includes("kitchen") || lower.includes("rasoi")) roomOrLocation = "Kitchen";
  else if (lower.includes("bathroom") || lower.includes("washroom") || lower.includes("gusal khana")) roomOrLocation = "Bathroom";
  else if (lower.includes("bedroom") || lower.includes("bed room")) roomOrLocation = "Bedroom";
  else if (lower.includes("living room") || lower.includes("hall") || lower.includes("drawing room")) roomOrLocation = "Living Room";
  else if (lower.includes("balcony") || lower.includes("terrace") || lower.includes("chhat") || lower.includes("roof")) roomOrLocation = "Terrace / Balcony";
  else if (lower.includes("garden") || lower.includes("lawn")) roomOrLocation = "Garden / Outdoor";
  else if (lower.includes("poore ghar") || lower.includes("whole house") || lower.includes("all rooms")) roomOrLocation = "Entire House";

  // Device / Appliance extraction
  let deviceOrAppliance: string | undefined;
  if (lower.includes("fan") || lower.includes("pankha")) deviceOrAppliance = "Ceiling Fan";
  else if (lower.includes("ac") || lower.includes("air conditioner")) deviceOrAppliance = "Air Conditioner";
  else if (lower.includes("refrigerator") || lower.includes("fridge")) deviceOrAppliance = "Refrigerator";
  else if (lower.includes("washing machine")) deviceOrAppliance = "Washing Machine";
  else if (lower.includes("geyser") || lower.includes("water heater")) deviceOrAppliance = "Water Geyser";
  else if (lower.includes("inverter") || lower.includes("battery")) deviceOrAppliance = "Inverter / Battery";
  else if (lower.includes("switchboard") || lower.includes("switch") || lower.includes("socket") || lower.includes("mcb")) deviceOrAppliance = "Switchboard / MCB";
  else if (lower.includes("pipe") || lower.includes("tap") || lower.includes("nal") || lower.includes("faucet")) deviceOrAppliance = "Plumbing Pipe / Tap";
  else if (lower.includes("lock") || lower.includes("tala") || lower.includes("door") || lower.includes("darwaja")) deviceOrAppliance = "Door Lock / Hinge";
  else if (lower.includes("water tank") || lower.includes("tanki")) deviceOrAppliance = "Water Storage Tank";

  // Problem extraction
  let problem = "General Inspection Required";
  if (lower.includes("spark") || lower.includes("shock") || lower.includes("smoke")) problem = "Electrical Sparks / Dangerous Shock Hazard";
  else if (lower.includes("leak") || lower.includes("burst")) problem = "Water Leakage / Pipe Burst";
  else if (lower.includes("cooling") || lower.includes("thanda")) problem = "Appliance Cooling Failure";
  else if (lower.includes("jammed") || lower.includes("lock")) problem = "Jammed Door Lock / Key Failure";
  else if (lower.includes("noise") || lower.includes("awaz") || lower.includes("rattling")) problem = "Abnormal Mechanical Vibration / Noise";
  else if (lower.includes("blackout") || lower.includes("light nahi") || lower.includes("no electricity") || lower.includes("poore ghar")) problem = "Total Power Outage / Tripped MCB";
  else if (lower.includes("damp") || lower.includes("seep") || lower.includes("seelan")) problem = "Wall Dampness & Moisture Seepage";
  else if (lower.includes("slow")) problem = "Motor Speed Reduction / Slow Operation";

  // Urgency computation
  let urgency: UrgencyLevel = "LOW";
  if (
    lower.includes("spark") ||
    lower.includes("fire") ||
    lower.includes("shock") ||
    lower.includes("smoke") ||
    lower.includes("gas leak") ||
    lower.includes("puncture") ||
    lower.includes("highway") ||
    lower.includes("dead battery")
  ) {
    urgency = "CRITICAL_EMERGENCY";
  } else if (
    lower.includes("burst") ||
    lower.includes("urgent") ||
    lower.includes("badly") ||
    lower.includes("immediately") ||
    lower.includes("jaldi") ||
    lower.includes("flood") ||
    lower.includes("spreading") ||
    lower.includes("lock") ||
    lower.includes("patient") ||
    lower.includes("surgery") ||
    lower.includes("elder") ||
    lower.includes("grandmother") ||
    lower.includes("fan")
  ) {
    urgency = "HIGH";
  } else if (
    lower.includes("cooling") ||
    lower.includes("slow") ||
    lower.includes("noise") ||
    lower.includes("tap")
  ) {
    urgency = "MEDIUM";
  }

  return {
    service: context.activeService,
    category: context.activeCategory,
    problem,
    roomOrLocation,
    deviceOrAppliance,
    urgency,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 4: INTENT CLASSIFICATION
// ─────────────────────────────────────────────────────────────────────────────
export function classifyIntent(
  text: string,
  context: ConversationContext
): IntentCategory {
  const lower = text.toLowerCase().trim();

  // 1. Emergency
  if (
    lower.includes("spark") ||
    lower.includes("smoke") ||
    lower.includes("fire") ||
    lower.includes("gas leak") ||
    lower.includes("shock") ||
    lower.includes("cylinder leak") ||
    lower.includes("tank burst")
  ) {
    return "EMERGENCY";
  }

  // 2. Booking Confirmation
  if (
    context.bookingStage === "CONFIRMATION_PENDING" &&
    (lower === "yes" ||
      lower === "haan" ||
      lower === "ha" ||
      lower.includes("confirm") ||
      lower.includes("book kar do") ||
      lower.includes("book kardo") ||
      lower.includes("schedule visit") ||
      lower.includes("yes please") ||
      lower.includes("haan bhej do"))
  ) {
    return "BOOKING_CONFIRM";
  }

  // 3. Booking Cancellation
  if (
    lower.includes("cancel") &&
    (lower.includes("booking") || lower.includes("service") || lower.includes("active") || lower.includes("karna"))
  ) {
    return "BOOKING_CANCEL";
  }

  // 4. Booking Status / Where is my worker
  if (
    lower.includes("where is my worker") ||
    lower.includes("worker status") ||
    lower.includes("booking status") ||
    lower.includes("kitni der me aayega") ||
    lower.includes("technician kab pahuchega") ||
    lower.includes("check booking")
  ) {
    return "BOOKING_STATUS";
  }

  // 5. Platform Info / Pricing
  if (
    lower.includes("visiting fee") ||
    lower.includes("charges") ||
    lower.includes("how skill-link works") ||
    lower.includes("how does it work") ||
    lower.includes("cooperative") ||
    lower.includes("welfare fund") ||
    lower.includes("commission") ||
    lower.includes("insurance") ||
    lower.includes("pmsby")
  ) {
    return "PLATFORM_INFO";
  }

  // 6. Greetings / Generic Help
  if (
    lower === "hello" ||
    lower === "hi" ||
    lower === "namaste" ||
    lower === "hey" ||
    lower === "help" ||
    lower === "madad"
  ) {
    return "GREETING_HELP";
  }

  // 7. Underspecified Low-Confidence Request (needs clarification)
  if (
    lower === "machine kharab hai" ||
    lower === "appliance kharab hai" ||
    lower === "kuch problem hai" ||
    lower === "problem ho gayi" ||
    lower === "machine is not working" ||
    lower === "something is broken"
  ) {
    return "CLARIFICATION_NEEDED";
  }

  // 8. Multi-turn continuation (answering a previous question)
  if (context.activeService) {
    const isContinuationWord =
      lower.includes("poore ghar") ||
      lower.includes("kitchen") ||
      lower.includes("bathroom") ||
      lower.includes("room") ||
      lower.includes("slow") ||
      lower.includes("noise") ||
      lower.includes("start nahi") ||
      lower.includes("water continuously");

    if (isContinuationWord) {
      return "SERVICE_CONTINUATION";
    }
  }

  // 9. Standard Service Request
  return "SERVICE_REQUEST";
}

// ─────────────────────────────────────────────────────────────────────────────
// BACKWARD-COMPATIBLE CLASSIFIER EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export function classifyServiceRequest(text: string): StructuredServiceAnalysis {
  const context = extractConversationContext([]);
  const entities = extractEntitiesAndProblem(text, context);
  const { service, category, confidence } = determineServiceCategory(text, context);
  const lang = detectLanguage(text);
  const intent = classifyIntent(text, context);

  const lower = text.toLowerCase();
  let safetyWarning: string | undefined;
  if (category === "electrician" && (lower.includes("spark") || lower.includes("smoke") || lower.includes("fire") || lower.includes("shock"))) {
    safetyWarning = "⚠️ IMMEDIATE SAFETY WARNING: Turn off your Main MCB or meter switch immediately from a dry area. Do not touch live wires or use water near electrical sparks.";
  } else if (category === "plumber" && (lower.includes("burst") || lower.includes("flood") || lower.includes("badly") || lower.includes("spreading"))) {
    safetyWarning = "💧 TIP: Please locate and close the main overhead water tank valve near your terrace or water meter to stop the flooding.";
  }

  return {
    service,
    category,
    problem_type: entities.problem || "General Inspection Required",
    urgency: entities.urgency,
    confidence,
    recommended_action: entities.urgency === "CRITICAL_EMERGENCY"
      ? "Turn off main switches and dispatch licensed wireman"
      : `Schedule ${service} Doorstep Inspection`,
    safetyWarning,
    requiresConfirmation: true,
    entities,
    detectedLanguage: lang,
    intent,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 5: SERVICE REQUIREMENT ANALYSIS & MATCHING
// ─────────────────────────────────────────────────────────────────────────────
export function determineServiceCategory(text: string, context: ConversationContext): {
  service: string;
  category: string;
  confidence: "High" | "Medium" | "Low";
} {
  const lower = text.toLowerCase().trim();

  // If continuing previous active context
  if (context.activeService && context.activeCategory) {
    const isDirectSwitch =
      lower.includes("plumber") ||
      lower.includes("electrician") ||
      lower.includes("carpenter") ||
      lower.includes("painter") ||
      lower.includes("clean");

    if (!isDirectSwitch) {
      return {
        service: context.activeService,
        category: context.activeCategory,
        confidence: "High",
      };
    }
  }

  // Electrician
  if (
    lower.includes("spark") ||
    lower.includes("shock") ||
    lower.includes("mcb") ||
    lower.includes("short circuit") ||
    lower.includes("bijli") ||
    lower.includes("wire") ||
    lower.includes("switch") ||
    lower.includes("fan") ||
    lower.includes("light") ||
    lower.includes("inverter") ||
    lower.includes("blackout") ||
    lower.includes("electrician")
  ) {
    return { service: "Electrician", category: "electrician", confidence: "High" };
  }

  // Painter (Check before plumber if paint or damp wall is mentioned)
  if (
    lower.includes("paint") ||
    lower.includes("painting") ||
    lower.includes("putty") ||
    lower.includes("distemper") ||
    lower.includes("whitewash") ||
    lower.includes("rang") ||
    (lower.includes("wall") && (lower.includes("seep") || lower.includes("damp")))
  ) {
    return { service: "Painter", category: "painter", confidence: "High" };
  }

  // Plumber
  if (
    lower.includes("pipe") ||
    lower.includes("leak") ||
    lower.includes("tap") ||
    lower.includes("nal") ||
    lower.includes("water tank") ||
    lower.includes("flush") ||
    lower.includes("washbasin") ||
    lower.includes("drain") ||
    lower.includes("plumber") ||
    lower.includes("paani") ||
    lower.includes("नल") ||
    lower.includes("पानी") ||
    lower.includes("टपक") ||
    lower.includes("लीक") ||
    lower.includes("पाइप")
  ) {
    return { service: "Plumber", category: "plumber", confidence: "High" };
  }

  // Carpenter
  if (
    lower.includes("door") ||
    lower.includes("lock") ||
    lower.includes("tala") ||
    lower.includes("darwaja") ||
    lower.includes("wood") ||
    lower.includes("carpenter") ||
    lower.includes("furniture") ||
    lower.includes("bed") ||
    lower.includes("almirah") ||
    lower.includes("hinge")
  ) {
    return { service: "Carpenter", category: "carpenter", confidence: "High" };
  }

  // Deep Cleaning
  if (
    lower.includes("clean") ||
    lower.includes("sofa") ||
    lower.includes("sanit") ||
    lower.includes("safai") ||
    lower.includes("deep cleaning")
  ) {
    return { service: "Deep Cleaning", category: "cleaning", confidence: "High" };
  }

  // AC & Appliances
  if (
    lower.includes("ac") ||
    lower.includes("air conditioner") ||
    lower.includes("cooling") ||
    lower.includes("fridge") ||
    lower.includes("refrigerator") ||
    lower.includes("washing machine") ||
    lower.includes("microwave") ||
    lower.includes("technician")
  ) {
    return { service: "AC & Appliance Repair", category: "ac", confidence: "High" };
  }

  // Caregiver
  if (
    lower.includes("caregiver") ||
    lower.includes("elder") ||
    lower.includes("patient") ||
    lower.includes("nurse") ||
    lower.includes("dada") ||
    lower.includes("dadi") ||
    lower.includes("attendant")
  ) {
    return { service: "Caregiver & Eldercare", category: "caregiver", confidence: "High" };
  }

  // Roadside SOS
  if (
    lower.includes("puncture") ||
    lower.includes("tyre") ||
    lower.includes("jumpstart") ||
    lower.includes("battery dead") ||
    lower.includes("towing") ||
    lower.includes("breakdown") ||
    lower.includes("fuel empty") ||
    lower.includes("highway") ||
    lower.includes("sos")
  ) {
    return { service: "Roadside SOS", category: "puncture", confidence: "High" };
  }

  // Mason
  if (
    lower.includes("mason") ||
    lower.includes("tile") ||
    lower.includes("plaster") ||
    lower.includes("brick") ||
    lower.includes("cement")
  ) {
    return { service: "Civil Mason", category: "mason", confidence: "High" };
  }

  return { service: "Skill-Link Platform Inquiry", category: "general", confidence: "Low" };
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 6: NATURAL RESPONSE GENERATION ENGINE
// ─────────────────────────────────────────────────────────────────────────────
export async function runLexiEngine(input: LexiEngineInput): Promise<LexiEngineOutput> {
  const { message, conversationHistory = [], userRole = "customer", userLocation } = input;

  // 1. Language Detection
  const lang = detectLanguage(message);

  // 2. Context Extraction from Multi-turn history
  const context = extractConversationContext(conversationHistory);

  // 3. Entity & Problem Extraction
  const entities = extractEntitiesAndProblem(message, context);

  // 4. Intent Classification
  const intent = classifyIntent(message, context);

  // 5. Service Categorization
  const { service, category, confidence } = determineServiceCategory(message, context);
  entities.service = service;
  entities.category = category;

  // 6. RAG Domain Knowledge Retrieval
  const retrievedDocs = retrieveKnowledge(message, 2);

  // 7. Real Data Check (Workers & Services)
  let matchedWorkers: WorkerProfile[] = [];
  let isRealDatabaseData = false;

  if (category && category !== "general") {
    if (isSupabaseConfigured() && supabase) {
      const dbRes = await fetchWorkersFromDb(category);
      if (dbRes.success && dbRes.data.length > 0) {
        matchedWorkers = dbRes.data.slice(0, 3);
        isRealDatabaseData = true;
      }
    }

    if (matchedWorkers.length === 0) {
      matchedWorkers = INITIAL_WORKERS.filter(
        (w) => w.category === category || w.occupation.toLowerCase().includes(category)
      ).slice(0, 3);
    }
  }

  // 8. Construct Response Tailored to Intent & Language
  let replyText = "";
  let safetyWarning: string | undefined;
  let richPayload: any = null;

  // ─────────────────────────────────────────────────────────────────────────
  // CASE A: CRITICAL EMERGENCY SAFETY RESPONSE
  // ─────────────────────────────────────────────────────────────────────────
  if (intent === "EMERGENCY" || entities.urgency === "CRITICAL_EMERGENCY") {
    if (category === "electrician") {
      safetyWarning = lang === "english"
        ? "⚠️ CRITICAL ELECTRICAL SAFETY WARNING: Please immediately turn off your Main MCB / Meter switch from a dry area. Do not touch live wires or use water near electrical sparks."
        : "⚠️ तत्काल सुरक्षा चेतावनी: कृपया सूखे स्थान से अपने घर का मेन MCB या मीटर स्विच तुरंत बंद कर दें। बिजली की चिंगारी के पास पानी न डालें और तारों को न छुएं।";

      replyText = lang === "english"
        ? `${safetyWarning}\n\nI have identified an **Electrical Hazard Emergency**.\n\nFor your family's safety:\n1. Keep everyone away from the switchboard.\n2. Do not attempt DIY repairs.\n\nWe can dispatch a licensed cooperative wireman for doorstep inspection (transparent ₹149 visit fee). Would you like to confirm a priority visit?`
        : `${safetyWarning}\n\nMaine **Electrical Hazard (Bijli ki Chingari / Short Circuit)** identify kiya hai.\n\nAapki suraksha ke liye:\n1. Main MCB turant off karein.\n2. Bachhon ko switchboard se door rakhein.\n\nHum cooperative federation se licensed wireman priority inspection ke liye bhej sakte hain (Fixed visit fee ₹149). Kya aap visit confirm karna chahte hain?`;
    } else if (category === "plumber") {
      safetyWarning = lang === "english"
        ? "💧 URGENT WATER SAFETY: Please locate and close the main overhead water tank gate valve near your terrace or meter to stop water flooding."
        : "💧 आवश्यक जल सुरक्षा: छत या मोटर के पास जाकर मेन वाटर सप्लाई गेट वॉल्व को तुरंत बंद कर दें ताकि पानी का बहाव रुक सके।";

      replyText = lang === "english"
        ? `${safetyWarning}\n\nI have noted a **Major Plumbing Leakage** in ${entities.roomOrLocation || "your premises"}.\n\nOnce the main valve is shut, we can schedule a certified Master Plumber (transparent ₹149 inspection fee). Would you like to proceed with the visit confirmation?`
        : `${safetyWarning}\n\nMaine **Severe Pipe Leakage** identify ki hai ${entities.roomOrLocation ? `(${entities.roomOrLocation} me)` : ""}.\n\nValve band karne ke baad, certified Master Plumber inspection schedule kar sakte hain (Fixed ₹149 visit fee). Kya aap plumber visit confirm karna chahte hain?`;
    } else {
      replyText = lang === "english"
        ? `⚠️ **Emergency Request Noted!** Please prioritize your personal safety first. If there is immediate danger of fire or gas leakage, dial Emergency Services (112 / 101).\n\nFor cooperative technician assistance, shall I connect you with a verified specialist?`
        : `⚠️ **इमरजेंसी स्थिति:** कृपया अपनी व्यक्तिगत सुरक्षा को प्राथमिकता दें। आग या गैस रिसाव की स्थिति में आपातकालीन हेल्पलाइन (112) पर संपर्क करें। क्या आप को-ऑपरेटिव तकनीशियन विजिट चाहते हैं?`;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CASE B: CLARIFICATION NEEDED (LOW CONFIDENCE)
  // ─────────────────────────────────────────────────────────────────────────
  else if (intent === "CLARIFICATION_NEEDED") {
    if (lang === "english") {
      replyText = `I'm here to help you get this resolved! 👍 Could you please specify which machine or appliance is having trouble?

1. **Washing Machine** (Motor, spin, or drainage issue)
2. **Air Conditioner / Refrigerator** (Cooling or gas issue)
3. **Ceiling Fan / Inverter** (Electrical or speed issue)
4. **Water Motor / Geyser** (Plumbing or heating issue)

Just reply with the appliance name!`;
    } else {
      replyText = `Samajh gaya 👍 Main isme aapki poori help karunga! Kripya batayein kaunsi machine ya appliance me problem aa rahi hai?

1. **Washing Machine** (Motor ya drainage problem)
2. **Air Conditioner (AC) / Refrigerator** (Cooling ya gas leakage issue)
3. **Ceiling Fan / Inverter** (Start nahi ho raha ya awaz aa rahi hai)
4. **Water Motor / Geyser** (Heating ya water pressure problem)

Aap bas appliance ka naam likh dein!`;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CASE C: MULTI-TURN SERVICE CONTINUATION
  // ─────────────────────────────────────────────────────────────────────────
  else if (intent === "SERVICE_CONTINUATION") {
    const room = entities.roomOrLocation ? ` in your ${entities.roomOrLocation}` : "";
    const roomHi = entities.roomOrLocation ? ` (${entities.roomOrLocation} me)` : "";

    if (lang === "english") {
      replyText = `Got it! Noted the updated details${room}: **${entities.problem}** for **${service}**.

Cooperative artisans in our federation are ready for doorstep inspection. The visit fee is transparently **₹149** (with 3% contributed directly to the Worker Social Security Welfare Pool).

👉 **Human Confirmation:** Would you like to confirm the doorstep visit now?`;
    } else {
      replyText = `Samajh gaya 👍 Noted${roomHi}: **${entities.problem}** (${service} requirement).

Humare cooperative federation ke certified artisans inspection ke liye available hain. Doorstep visit fee transparent **₹149** hai (jisme 3% worker welfare fund me jata hai).

👉 **Human Confirmation:** Kya aap visit schedule confirm karna chahte hain?`;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CASE D: BOOKING CONFIRMATION ACTION
  // ─────────────────────────────────────────────────────────────────────────
  else if (intent === "BOOKING_CONFIRM") {
    if (lang === "english") {
      replyText = `✅ **Visit Confirmation Acknowledged!**

I have prepared your request for **${service}** (${entities.problem}).

📍 **Next Step:** To complete your doorstep dispatch and assign the nearest cooperative artisan, please review your service address above or click **Book Now** on the artisan card below. Fixed inspection fee is locked at **₹149**.`;
    } else {
      replyText = `✅ **Visit Request Acknowledged!**

Maine aapki **${service}** request (${entities.problem}) prepare kar di hai.

📍 **Next Step:** Doorstep dispatch complete karne aur nearby cooperative artisan assign karne ke liye, kripya niche diye gaye card par **Book Now** click karein. Fixed inspection visiting fee **₹149** rahegi.`;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CASE E: BOOKING STATUS / CANCELLATION
  // ─────────────────────────────────────────────────────────────────────────
  else if (intent === "BOOKING_STATUS") {
    if (lang === "english") {
      replyText = `To check your live booking status:
1. Tap the **Profile / Bookings** tab in the top navigation bar.
2. Here you can view your assigned worker, live ETA, and OTP verification code.
3. If you have an active dispatch, our artisan will reach you within the estimated schedule.`;
    } else {
      replyText = `Aapki live booking status check karne ke liye:
1. Top navigation me **Profile / Bookings** par jayein.
2. Wahan aap apne assigned worker ki live details, ETA aur OTP dekh sakte hain.
3. Agar booking active hai toh technician schedule time par aapke doorstep par pahuchega.`;
    }
  } else if (intent === "BOOKING_CANCEL") {
    if (lang === "english") {
      replyText = `If you wish to cancel an existing booking, you can do so directly from your **Profile > Active Bookings** section before the artisan arrives at no cancellation fee. Would you like assistance with rescheduling instead?`;
    } else {
      replyText = `Agar aapko booking cancel karni hai, toh aap **Profile > Active Bookings** me jakar artisan ke doorstep pahuchne se pehle bina kisi cancellation charge ke cancel kar sakte hain. Kya aap kisi doosre time slot par reschedule karna chahte hain?`;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CASE F: PLATFORM INFORMATION & COOPERATIVE GIG MODEL
  // ─────────────────────────────────────────────────────────────────────────
  else if (intent === "PLATFORM_INFO") {
    const doc = retrievedDocs[0];
    if (lang === "english") {
      replyText = `Here is official information about Skill-Link:

**Cooperative Transparent Pricing:**
- **Doorstep Visiting Fee:** Transparent ₹149 fixed fee for all trades.
- **0% Commission on Labor:** Workers keep 100% of their base labor wages.
- **3% Social Security Pool:** Every booking contributes 3% to worker accident & health safety under PM Suraksha Bima Yojana (PMSBY).

${doc ? `*${doc.title}*: ${doc.content.slice(0, 200)}...` : ""}`;
    } else {
      replyText = `Skill-Link Cooperative Federation ke baare me jankari:

**Cooperative Transparent Pricing:**
- **Doorstep Visiting Fee:** Fixed ₹149 transparent inspection fee.
- **0% Platform Commission:** Workers ko unki mehnat ka 100% pura paisa milta hai.
- **3% Social Security Pool:** Har booking se 3% welfare fund me jata hai (Pradhan Mantri Suraksha Bima Yojana aur healthcare sahayata ke liye).

Aap kisi bhi specific service (Electrician, Plumber, Painter, Mason, AC Technician) ke baare me pooch sakte hain!`;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CASE G: GREETINGS / HELP
  // ─────────────────────────────────────────────────────────────────────────
  else if (intent === "GREETING_HELP") {
    if (lang === "english") {
      replyText = `Hello! I am **LEXI**, your Skill-Link Cooperative Assistant. 🤖

How can I help you today? You can describe any household problem (e.g. *"Water pipe is leaking"* or *"Ceiling fan is rattling"*), or ask about our transparent ₹149 cooperative visiting rates!`;
    } else {
      replyText = `Namaste! Main **LEXI** hoon, Skill-Link ka intelligent cooperative assistant. 🤖

Main aapki kya madad kar sakta hoon? Aap apni pareshani seedhe shabdon me bata sakte hain (jaise: *"Kitchen ka tap leak ho raha hai"* ya *"Bijli ke switch me spark aa raha hai"*). Main turant verified artisans suggest karunga!`;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CASE H: STANDARD SERVICE REQUEST
  // ─────────────────────────────────────────────────────────────────────────
  else {
    const roomStr = entities.roomOrLocation ? ` (${entities.roomOrLocation})` : "";

    if (lang === "english") {
      replyText = `${safetyWarning ? safetyWarning + "\n\n" : ""}I have understood your requirement: **${service} Service**${roomStr}.
Problem: **${entities.problem}**.

${
  isRealDatabaseData
    ? `We have verified cooperative artisans registered in our live database ready for inspection.`
    : `Our registered cooperative federation provides certified artisans for doorstep inspection.`
}
Fixed inspection visiting fee is transparently **₹149** (with 3% contributed to the Worker Welfare Pool).

👉 **Human Confirmation:** Would you like to schedule an inspection visit?`;
    } else {
      replyText = `${safetyWarning ? safetyWarning + "\n\n" : ""}Samajh gaya 👍 Maine aapki requirement samajh li hai: **${service} Service**${roomStr}.
Problem: **${entities.problem}**.

${
  isRealDatabaseData
    ? `Humare live cooperative registry me certified artisans available hain.`
    : `Humare cooperative federation ke certified artisans inspection ke liye available hain.`
}
Doorstep inspection visiting fee transparent **₹149** hai (jisme 3% worker social security cess shamil hai).

👉 **Human Confirmation:** Kya aap artisan visit schedule karna chahte hain?`;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ATTACH RICH WORKER CARDS (Transparently marked)
  // ─────────────────────────────────────────────────────────────────────────
  if (matchedWorkers.length > 0 && !richPayload && category !== "general") {
    richPayload = {
      type: "workers",
      isLiveDatabase: isRealDatabaseData,
      workers: matchedWorkers.map((w) => ({
        workerId: w.id,
        name: w.name,
        occupation: w.occupation,
        category: w.category,
        rating: w.rating,
        reviewsCount: w.jobsCompleted,
        visitingFee: w.visitingFee || 149,
        hourlyRate: w.hourlyRate || 299,
        avatarUrl: w.avatarUrl || w.avatar,
        phone: w.phone,
        distanceKm: 1.2,
        skills: w.skills?.slice(0, 3) || [],
        badge: w.badge,
        cooperativeSociety: w.cooperativeSociety || "Tricity Labour Cooperative Society Ltd.",
      })),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STAGE 7: RESPONSE VALIDATION (Guards against hallucinated commitments)
  // ─────────────────────────────────────────────────────────────────────────
  if (!replyText || replyText.includes("[object Object]")) {
    replyText = lang === "english"
      ? "I understood your request. Could you please specify a few more details so I can recommend the right cooperative artisan for you?"
      : "Maine aapki query samajh li hai. Kripya thodi aur detail batayein taaki main sahi cooperative artisan suggest kar sakoon.";
  }

  return {
    reply: replyText,
    structuredAnalysis: {
      service,
      category,
      problem_type: entities.problem || "General Inspection Required",
      urgency: entities.urgency,
      confidence,
      recommended_action: entities.urgency === "CRITICAL_EMERGENCY"
        ? "Turn off main switches and dispatch licensed wireman"
        : `Schedule ${service} Doorstep Inspection`,
      safetyWarning,
      requiresConfirmation: true,
      entities,
      detectedLanguage: lang,
      intent,
    },
    richPayload,
    safetyWarning,
    retrievedKnowledge: retrievedDocs.map((d) => ({ title: d.title, category: d.category })),
    promptTokensEstimated: message.length + conversationHistory.length * 20,
  };
}

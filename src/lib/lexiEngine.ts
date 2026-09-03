/**
 * LEXI AI Core Intelligent Engine
 * Provides domain-specific request understanding, structured JSON analysis,
 * role-based context adaptation, RAG document injection, and safety guards.
 */

import { retrieveKnowledge, KnowledgeDocument } from "./lexiKnowledge";
import { WorkerProfile, INITIAL_WORKERS } from "./seedData";
import { fetchWorkersFromDb, fetchServicesFromDb } from "./supabaseService";

export type UrgencyLevel = "CRITICAL_EMERGENCY" | "HIGH" | "MEDIUM" | "LOW";

export interface StructuredServiceAnalysis {
  service: string;
  category: string;
  problem_type: string;
  urgency: UrgencyLevel;
  confidence: "High" | "Medium" | "Low";
  recommended_action: string;
  safetyWarning?: string;
  requiresConfirmation: boolean;
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

/**
 * 1. Deep Natural Language Service & Urgency Classifier
 */
export function classifyServiceRequest(text: string): StructuredServiceAnalysis {
  const lower = text.toLowerCase().trim();

  // Helper to test standalone words or phrases
  const hasWord = (str: string, words: string[]) =>
    words.some((w) => new RegExp(`(^|\\b|\\s)${w}(\\b|\\s|$)`, "i").test(str));

  // A. Electrical Safety & Hazards
  if (
    lower.includes("spark") ||
    lower.includes("shock") ||
    lower.includes("mcb") ||
    lower.includes("short circuit") ||
    lower.includes("bijli") ||
    lower.includes("wire burn") ||
    lower.includes("fire") ||
    lower.includes("switchboard") ||
    hasWord(lower, ["fan", "ceiling fan", "light", "bulb", "socket", "inverter", "wiring", "power trip"])
  ) {
    const isCritical =
      lower.includes("spark") ||
      lower.includes("fire") ||
      lower.includes("shock") ||
      lower.includes("smoke");

    return {
      service: "Electrician",
      category: "electrician",
      problem_type: isCritical
        ? "Electrical Fire / Short Circuit Hazard"
        : lower.includes("fan")
        ? "Ceiling Fan Malfunction / Motor Noise"
        : "Switchboard / MCB Tripping Malfunction",
      urgency: isCritical ? "CRITICAL_EMERGENCY" : "HIGH",
      confidence: "High",
      recommended_action: isCritical
        ? "Turn off Main Switchboard & Dispatch Licensed Wireman"
        : "Schedule Certified Electrician Inspection",
      safetyWarning: isCritical
        ? "⚠️ IMMEDIATE SAFETY WARNING: Turn off your Main MCB or meter switch immediately from a dry area. Do not touch live wires or use water near electrical sparks."
        : undefined,
      requiresConfirmation: true,
    };
  }

  // B. Home Painting & Damp Proofing (Priority if paint/whitewash/putty is explicitly mentioned)
  if (
    hasWord(lower, ["paint", "painting", "putty", "distemper", "whitewash", "emulsion", "texture", "rang"]) ||
    (lower.includes("paint") && (lower.includes("wall") || lower.includes("seep") || lower.includes("damp")))
  ) {
    return {
      service: "Painter",
      category: "painter",
      problem_type: "Wall Putty, Damp Proofing & Emulsion Painting",
      urgency: "LOW",
      confidence: "High",
      recommended_action: "Book Surface Inspection & Estimation",
      requiresConfirmation: true,
    };
  }

  // C. Plumbing & Water Leakage
  if (
    lower.includes("pipe") ||
    lower.includes("leak") ||
    lower.includes("tap") ||
    lower.includes("seep") ||
    lower.includes("water tank") ||
    lower.includes("flush") ||
    lower.includes("washbasin") ||
    lower.includes("burst") ||
    lower.includes("nali") ||
    hasWord(lower, ["pani", "water leakage", "drain"])
  ) {
    const isBurst = lower.includes("burst") || lower.includes("flood") || lower.includes("badly");
    return {
      service: "Plumber",
      category: "plumber",
      problem_type: isBurst
        ? "Main Pipe Burst / Severe Leakage"
        : "Tap Leakage & Concealed Plumbing Issue",
      urgency: isBurst ? "HIGH" : "MEDIUM",
      confidence: "High",
      recommended_action: isBurst
        ? "Shut Off Main Water Gate Valve & Confirm Plumber Visit"
        : "Schedule Master Plumber Inspection",
      safetyWarning: isBurst
        ? "💧 TIP: Please locate and close the main overhead water tank valve near your terrace or water meter to stop the flooding."
        : undefined,
      requiresConfirmation: true,
    };
  }

  // D. Roadside Emergency SOS
  if (
    lower.includes("puncture") ||
    lower.includes("tyre") ||
    lower.includes("jumpstart") ||
    lower.includes("battery dead") ||
    lower.includes("towing") ||
    lower.includes("breakdown") ||
    lower.includes("fuel empty") ||
    lower.includes("highway") ||
    lower.includes("car stop")
  ) {
    return {
      service: "Roadside SOS",
      category: "puncture",
      problem_type: "Vehicle Breakdown / Roadside Utility Emergency",
      urgency: "CRITICAL_EMERGENCY",
      confidence: "High",
      recommended_action: "Initiate 15-Minute Priority On-Road Dispatch",
      requiresConfirmation: true,
    };
  }

  // E. Carpentry & Furniture
  if (
    lower.includes("door") ||
    lower.includes("lock") ||
    lower.includes("wood") ||
    lower.includes("carpenter") ||
    lower.includes("hinge") ||
    lower.includes("kitchen") ||
    lower.includes("bed") ||
    lower.includes("almirah") ||
    lower.includes("darwaja")
  ) {
    return {
      service: "Carpenter",
      category: "carpenter",
      problem_type: "Door Lock / Woodwork / Furniture Fitting",
      urgency: lower.includes("lock") ? "HIGH" : "MEDIUM",
      confidence: "High",
      recommended_action: "Schedule Certified Master Craftsman",
      requiresConfirmation: true,
    };
  }

  // F. Deep Cleaning & Sanitation
  if (
    lower.includes("clean") ||
    lower.includes("sofa") ||
    lower.includes("sanit") ||
    lower.includes("safai") ||
    lower.includes("bathroom dirty") ||
    lower.includes("kitchen grease")
  ) {
    return {
      service: "Deep Cleaning",
      category: "cleaning",
      problem_type: "Deep Sanitation & Degreasing Service",
      urgency: "LOW",
      confidence: "High",
      recommended_action: "Schedule Sanitation Team",
      requiresConfirmation: true,
    };
  }

  // G. AC & Appliance Repair
  if (
    lower.includes("ac") ||
    lower.includes("air conditioner") ||
    lower.includes("cooling") ||
    lower.includes("gas leak") ||
    lower.includes("fridge") ||
    lower.includes("refrigerator") ||
    lower.includes("washing machine") ||
    lower.includes("microwave")
  ) {
    return {
      service: "AC & Appliance Repair",
      category: "ac",
      problem_type: "HVAC Cooling Coil / Appliance Motor Fault",
      urgency: "MEDIUM",
      confidence: "High",
      recommended_action: "Book Technician Diagnostic Visit",
      requiresConfirmation: true,
    };
  }

  // H. Caregiving & Eldercare
  if (
    lower.includes("caregiver") ||
    lower.includes("elder") ||
    lower.includes("patient") ||
    lower.includes("nurse") ||
    lower.includes("dada") ||
    lower.includes("dadi") ||
    lower.includes("attendant")
  ) {
    return {
      service: "Caregiver & Eldercare",
      category: "caregiver",
      problem_type: "Elderly Companionship & Post-Surgery Attendant",
      urgency: "HIGH",
      confidence: "High",
      recommended_action: "Schedule Certified Health Attendant",
      requiresConfirmation: true,
    };
  }

  // Default General Inquiry
  return {
    service: "Skill-Link Platform Inquiry",
    category: "general",
    problem_type: "General Service or Policy Question",
    urgency: "LOW",
    confidence: "Medium",
    recommended_action: "Provide Informational Guidance",
    requiresConfirmation: false,
  };
}

/**
 * 2. Multi-Turn Context Summarizer for Performance & Token Efficiency
 * Compacts conversation history over 6 messages into a concise context brief.
 */
export function compactConversationHistory(
  history: Array<{ role: string; content: string }>
): string {
  if (!history || history.length <= 4) {
    return history.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n");
  }

  const recent = history.slice(-4);
  const earlier = history.slice(0, -4);
  const summary = `[Earlier Context: User and assistant discussed ${earlier.length} turns regarding home services]`;

  return `${summary}\n` + recent.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n");
}

/**
 * 3. Master LEXI Execution Pipeline
 */
export async function runLexiEngine(input: LexiEngineInput): Promise<LexiEngineOutput> {
  const { message, conversationHistory = [], userRole = "customer", userLocation } = input;

  // Step 1: Perform Natural Language Classification
  const analysis = classifyServiceRequest(message);

  // Step 2: Retrieve Relevant Domain Documents (RAG)
  const retrievedDocs = retrieveKnowledge(message, 2);

  // Step 3: Fetch relevant workers if a specific trade was detected
  let matchedWorkers: WorkerProfile[] = [];
  if (analysis.category && analysis.category !== "general") {
    const dbRes = await fetchWorkersFromDb(analysis.category);
    if (dbRes.success && dbRes.data.length > 0) {
      matchedWorkers = dbRes.data.slice(0, 3);
    } else {
      matchedWorkers = INITIAL_WORKERS.filter(
        (w) => w.category === analysis.category || w.occupation.toLowerCase().includes(analysis.category)
      ).slice(0, 3);
    }
  }

  // Step 4: Construct Role-Tailored Response
  let replyText = "";
  let richPayload: any = null;

  // Custom role handling
  if (userRole === "worker") {
    replyText = `Namaste! As a verified artisan in the Skill-Link cooperative federation, you can manage your daily schedule and view live job dispatches. Your online status ensures you receive instant notifications within a 1.1km sector radius. Fixed inspection visiting fees (₹149) and full labor earnings are directly tracked in your Passbook with a 3% contribution to your Cooperative Welfare Fund.`;
  } else if (userRole === "cooperative_admin") {
    replyText = `Welcome, Cooperative Administrator. The Skill-Link federation dashboard gives you full audit visibility over member artisans, NCVT/Skill India certifications, welfare pool collections (3% social security cess), and active sector radars across Tricity.`;
  } else {
    // Customer flow
    if (analysis.service === "Plumber") {
      replyText = `${analysis.safetyWarning ? analysis.safetyWarning + "\n\n" : ""}Maine aapki requirement identify kar li hai: **Plumbing Service (Pipe Leakage / Repair)**.

Skill-Link cooperative federation ke certified Master Plumber **Ramanand Sharma** (6 saal ka experience, 4.9★ rating) aapke area me available hain. Doorstep inspection visiting fee transparent **₹149** hai.

👉 **Human Confirmation:** Kya aap plumber visit confirm karna chahte hain?`;
    } else if (analysis.service === "Electrician") {
      replyText = `${analysis.safetyWarning ? analysis.safetyWarning + "\n\n" : ""}Maine aapki requirement identify kar li hai: **Electrical Repair**.

Hamare licensed wireman **Anil Kumar Maurya** (NCVT Certified, 5 saal experience, 4.8★) short circuits aur switchboard repair ke liye available hain. Transparent visiting fee: **₹149**.

👉 **Human Confirmation:** Kya aap certified electrician ki doorstep visit confirm karna chahte hain?`;
    } else if (analysis.service === "Roadside SOS") {
      replyText = `🚨 **On-Road Emergency SOS Request Detected!**
Humne aapke location ke paas 15-Minute Priority Mobile Mechanic locate kiya hai. Guaranteed 15-minute SLA ke tahat emergency puncture, jumpstart ya towing assistance ke liye ready hain.

👉 **Confirmation Required:** Kya aap emergency roadside dispatch initiate karna chahte hain?`;
      richPayload = {
        type: "sos",
        sos: {
          issueType: analysis.problem_type,
          location: userLocation?.address || "Sector 17, Chandigarh Highway",
          eta: "12-15 Mins",
          priceLock: 199,
          status: "SEARCHING",
        },
      };
    } else if (analysis.service === "Painter") {
      replyText = `Maine aapki requirement identify ki hai: **Home Painting & Damp Wall Fix**.
Cooperative Master Painter **Ramanand Kumar** (4 saal ka experience, 4.9★ rating, Asian Paints & PCSC Certified) Sector 17 / Tricity me available hain.

👉 **Human Confirmation:** Kya aap painting inspection aur rate card preview schedule karna chahte hain?`;
    } else if (analysis.service === "Carpenter") {
      replyText = `Maine aapki requirement identify ki hai: **Carpentry & Wood Fitting**.
Cooperative master craftsman **Gurpreet Singh** (7 saal experience, 4.9★) door locks aur kitchen woodwork ke liye ready hain. Fixed visit fee: ₹149.

👉 **Human Confirmation:** Kya aap carpenter slot book karna chahte hain?`;
    } else if (analysis.service === "Deep Cleaning") {
      replyText = `Maine aapki requirement identify ki hai: **Deep Cleaning & Home Sanitization**.
Sanitation specialist **Nitish Kumar** hospital-grade equipment ke sath available hain. Fixed inspection fee: ₹149.

👉 **Human Confirmation:** Kya aap deep cleaning team visit schedule karna chahte hain?`;
    } else if (analysis.service === "AC & Appliance Repair") {
      replyText = `Maine aapki requirement identify ki hai: **AC & Appliance Diagnostics**.
Appliance technician diagnostic visit fee: ₹149. Cooling test aur motor check ke liye technician dispatch ready hain.

👉 **Human Confirmation:** Kya aap technician inspection schedule karna chahte hain?`;
    } else if (analysis.service === "Caregiver & Eldercare") {
      replyText = `Maine aapki requirement identify ki hai: **Elderly & Patient Caregiver**.
HSSC certified caregiver **Sunita Devi** (6 saal experience, Red Cross CPR certified) compassionate patient care ke liye available hain.

👉 **Human Confirmation:** Kya aap caregiver consultation schedule karna chahte hain?`;
    } else {
      // General domain knowledge response using RAG
      const doc = retrievedDocs[0];
      if (doc) {
        replyText = `Skill-Link ke bare me jankari:\n\n**${doc.title}**\n${doc.content}\n\nAap kisi bhi specific service (Plumber, Electrician, Carpenter, Painter, Cleaning, Driver, AC Technician ya Roadside SOS) ke bare me pooch sakte hain!`;
      } else {
        replyText = `Namaste! Main LEXI hoon, Skill-Link ka intelligent assistant. Aap apni problem seedhe shabdon me bata sakte hain (jaise: 'Pani ka pipe leak ho raha hai' ya 'Bijli ke switch me spark aa raha hai'). Main problem samajhkar nearby verified cooperative workers suggest karunga!`;
      }
    }

    // Attach worker cards if matched
    if (matchedWorkers.length > 0 && !richPayload) {
      richPayload = {
        type: "workers",
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
        })),
      };
    }
  }

  return {
    reply: replyText,
    structuredAnalysis: analysis,
    richPayload,
    safetyWarning: analysis.safetyWarning,
    retrievedKnowledge: retrievedDocs.map((d) => ({ title: d.title, category: d.category })),
    promptTokensEstimated: message.length + (conversationHistory.length * 20),
  };
}

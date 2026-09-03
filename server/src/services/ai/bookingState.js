/**
 * Conversational Booking State Manager — Skill-Link Lexi AI
 * Tracks recent search context, resolves ordinal references ("first worker"), parses natural dates/times,
 * and maintains pending booking drafts requiring explicit confirmation.
 */

// Known verified worker directory fallback
const GLOBAL_WORKERS_POOL = [
  { workerId: "w1", name: "Ramanand", occupation: "Master Automobile & Bike Mechanic", category: "mechanic_car", visitingFee: 199 },
  { workerId: "w2", name: "Vikram Sharma", occupation: "Certified Master Plumber", category: "plumber", visitingFee: 149 },
  { workerId: "w3", name: "Amit Patel", occupation: "Licensed Electrical Technician", category: "electrician", visitingFee: 149 },
  { workerId: "w4", name: "Deepak Kumar", occupation: "HVAC & AC Service Specialist", category: "ac", visitingFee: 199 },
  { workerId: "w_bike_1", name: "Raj Kumar", occupation: "Senior Bike & Scooter Mechanic", category: "bike_repair", visitingFee: 149 },
  { workerId: "w_ro_1", name: "Suresh Mehra", occupation: "Water Purifier & RO Technician", category: "ro_repair", visitingFee: 149 },
  { workerId: "w_comp_1", name: "Nitin Verma", occupation: "Hardware & Laptop Engineer", category: "computer_repair", visitingFee: 149 },
];

// In-memory session store (keyed by userId or session IP)
const sessionBookingStates = new Map();

/**
 * Normalizes date strings like "tomorrow", "friday", "saturday" into human-friendly dates
 */
function parseNaturalDate(dateInput) {
  if (!dateInput || typeof dateInput !== "string") return null;
  const lower = dateInput.toLowerCase().trim();

  const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const today = new Date();

  if (lower.includes("tomorrow") || lower.includes("kal")) {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  }

  if (lower.includes("today") || lower.includes("aaj")) {
    return today.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  }

  for (let i = 0; i < daysOfWeek.length; i++) {
    if (lower.includes(daysOfWeek[i])) {
      const targetDay = i;
      const currentDay = today.getDay();
      let diff = targetDay - currentDay;
      if (diff <= 0) diff += 7;
      const d = new Date(today);
      d.setDate(d.getDate() + diff);
      return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
    }
  }

  const monthMatch = lower.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2}[/-]\d{1,2})\b/);
  if (monthMatch) {
    return dateInput.trim();
  }

  return null;
}

/**
 * Parses natural time strings like "10 AM", "4 PM", "morning", "evening"
 */
function parseNaturalTime(timeInput) {
  if (!timeInput || typeof timeInput !== "string") return null;
  const lower = timeInput.toLowerCase().trim();

  const timeMatch = lower.match(/\b(1[0-2]|0?[1-9])(?::([0-5][0-9]))?\s*(am|pm)\b/i);
  if (timeMatch) {
    const hour = timeMatch[1];
    const mins = timeMatch[2] || "00";
    const period = timeMatch[3].toUpperCase();
    return `${hour}:${mins} ${period}`;
  }

  const numberOnly = lower.match(/\b([1-9]|1[0-2])\s*(baje|pm|am)?\b/);
  if (lower.includes("morning") || lower.includes("subah")) return "10:00 AM";
  if (lower.includes("afternoon") || lower.includes("dopahar")) return "02:00 PM";
  if (lower.includes("evening") || lower.includes("sham")) return "05:00 PM";

  if (numberOnly) {
    const num = parseInt(numberOnly[1], 10);
    const period = num >= 7 && num <= 11 ? "AM" : "PM";
    return `${num}:00 ${period}`;
  }

  return null;
}

/**
 * Resolves a worker reference (e.g. "first worker", "second one", "Rahul", "Vikram")
 * from recent search results or global worker pool
 */
function resolveWorkerReference(query, recentWorkers = []) {
  const lower = query.toLowerCase();

  // 1. Ordinal checks in recent search results
  if (lower.includes("first") || lower.includes("1st") || lower.includes("pehle")) {
    if (recentWorkers && recentWorkers.length > 0) return recentWorkers[0];
  }
  if (lower.includes("second") || lower.includes("2nd") || lower.includes("doosra")) {
    if (recentWorkers && recentWorkers.length > 1) return recentWorkers[1];
    if (recentWorkers && recentWorkers.length > 0) return recentWorkers[0];
  }
  if (lower.includes("third") || lower.includes("3rd") || lower.includes("teesra")) {
    if (recentWorkers && recentWorkers.length > 2) return recentWorkers[2];
    if (recentWorkers && recentWorkers.length > 0) return recentWorkers[0];
  }

  // 2. Name check against recent search results
  if (Array.isArray(recentWorkers) && recentWorkers.length > 0) {
    for (const w of recentWorkers) {
      const nameParts = (w.name || "").toLowerCase().split(/\s+/);
      if (nameParts.some((p) => p.length > 2 && lower.includes(p))) {
        return w;
      }
    }
  }

  // 3. Fallback: Name check against global pool
  for (const w of GLOBAL_WORKERS_POOL) {
    const nameParts = (w.name || "").toLowerCase().split(/\s+/);
    if (nameParts.some((p) => p.length > 2 && lower.includes(p))) {
      return w;
    }
  }

  // 4. Trade / Category check against global pool
  for (const w of GLOBAL_WORKERS_POOL) {
    if (lower.includes(w.category) || lower.includes(w.occupation.toLowerCase())) {
      return w;
    }
  }

  return (recentWorkers && recentWorkers.length > 0) ? recentWorkers[0] : null;
}

/**
 * Checks if a user message is an explicit confirmation
 */
function isConfirmationMessage(text) {
  const clean = text.toLowerCase().trim().replace(/[^\w\s]/g, "");
  const confirmPhrases = [
    "yes",
    "confirm",
    "confirm booking",
    "go ahead",
    "book it",
    "please confirm",
    "sure confirm",
    "ha",
    "haan",
    "theek hai",
    "kardo",
    "kar do",
    "book kardo",
    "yes please",
    "proceed",
    "ok confirm",
  ];
  return confirmPhrases.includes(clean) || clean === "yes" || clean === "confirm";
}

/**
 * Checks if a user message is an explicit cancellation before booking
 */
function isCancellationMessage(text) {
  const clean = text.toLowerCase().trim().replace(/[^\w\s]/g, "");
  const cancelPhrases = [
    "no",
    "cancel",
    "dont book",
    "stop",
    "nahi chahiye",
    "rehne do",
    "cancel this",
    "never mind",
    "abort",
  ];
  return cancelPhrases.includes(clean) || clean === "no" || clean === "cancel";
}

/**
 * Get or create session booking state
 */
function getSessionState(sessionId = "default_session") {
  if (!sessionBookingStates.has(sessionId)) {
    sessionBookingStates.set(sessionId, {
      recentWorkers: [],
      pendingDraft: null,
      lastSearchTrade: null,
    });
  }
  return sessionBookingStates.get(sessionId);
}

function updateSessionState(sessionId = "default_session", updates = {}) {
  const state = getSessionState(sessionId);
  Object.assign(state, updates);
  sessionBookingStates.set(sessionId, state);
  return state;
}

function clearPendingDraft(sessionId = "default_session") {
  const state = getSessionState(sessionId);
  state.pendingDraft = null;
  sessionBookingStates.set(sessionId, state);
}

module.exports = {
  parseNaturalDate,
  parseNaturalTime,
  resolveWorkerReference,
  isConfirmationMessage,
  isCancellationMessage,
  getSessionState,
  updateSessionState,
  clearPendingDraft,
};

/**
 * Structured Session State Manager — Skill-Link Lexi AI
 * Tracks active search workflows, filters, last candidate results, and booking drafts with TTL.
 */

const { SESSION_TTL_MS, BOOKING_DRAFT_TTL_MS } = require("./config");

// Global fallback worker pool for direct reference resolution
const GLOBAL_WORKERS_POOL = [
  { workerId: "w1", name: "Ramanand", occupation: "Master Automobile & Bike Mechanic", category: "mechanic_car", visitingFee: 199 },
  { workerId: "w2", name: "Vikram Sharma", occupation: "Certified Master Plumber", category: "plumber", visitingFee: 149 },
  { workerId: "w3", name: "Amit Patel", occupation: "Licensed Electrical Technician", category: "electrician", visitingFee: 149 },
  { workerId: "w4", name: "Deepak Kumar", occupation: "HVAC & AC Service Specialist", category: "ac", visitingFee: 199 },
  { workerId: "w_bike_1", name: "Raj Kumar", occupation: "Senior Bike & Scooter Mechanic", category: "bike_repair", visitingFee: 149 },
  { workerId: "w_ro_1", name: "Suresh Mehra", occupation: "Water Purifier & RO Technician", category: "ro_repair", visitingFee: 149 },
  { workerId: "w_comp_1", name: "Nitin Verma", occupation: "Hardware & Laptop Engineer", category: "computer_repair", visitingFee: 149 },
];

const sessions = new Map();

/**
 * Creates an empty structured state object
 */
function createInitialSessionState() {
  return {
    activeSearch: {
      trade: null,
      serviceName: null,
      filters: {
        affordable: false,
        bestRated: false,
        experienced: false,
        nearMe: false,
      },
      location: null,
    },
    lastResults: [],
    selectedWorker: null,
    pendingDraft: null,
    conversationSummary: "",
    lastActivity: Date.now(),
  };
}

/**
 * Retrieves session state for a given session ID, auto-creating if non-existent
 */
function getSessionState(sessionId = "default_session") {
  cleanupExpiredSessions();

  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, createInitialSessionState());
  }

  const state = sessions.get(sessionId);
  state.lastActivity = Date.now();

  // Check if pending booking draft has expired (older than 15 mins)
  if (state.pendingDraft && state.pendingDraft.createdAt) {
    if (Date.now() - state.pendingDraft.createdAt > BOOKING_DRAFT_TTL_MS) {
      console.log(`[Memory Manager] Booking draft expired for session '${sessionId}'`);
      state.pendingDraft = null;
    }
  }

  return state;
}

/**
 * Updates structured state fields
 */
function updateSessionState(sessionId = "default_session", updates = {}) {
  const state = getSessionState(sessionId);

  if (updates.activeSearch) {
    state.activeSearch = {
      ...state.activeSearch,
      ...updates.activeSearch,
      filters: {
        ...state.activeSearch.filters,
        ...(updates.activeSearch.filters || {}),
      },
    };
  }

  if (updates.lastResults !== undefined) {
    state.lastResults = updates.lastResults;
  }

  if (updates.selectedWorker !== undefined) {
    state.selectedWorker = updates.selectedWorker;
  }

  if (updates.pendingDraft !== undefined) {
    if (updates.pendingDraft) {
      updates.pendingDraft.createdAt = updates.pendingDraft.createdAt || Date.now();
    }
    state.pendingDraft = updates.pendingDraft;
  }

  if (updates.conversationSummary !== undefined) {
    state.conversationSummary = updates.conversationSummary;
  }

  state.lastActivity = Date.now();
  sessions.set(sessionId, state);
  return state;
}

/**
 * Resets/clears session context cleanly (e.g. on new conversation or clear history)
 */
function resetSessionState(sessionId = "default_session") {
  sessions.set(sessionId, createInitialSessionState());
  console.log(`[Memory Manager] Reset session memory for '${sessionId}'`);
  return sessions.get(sessionId);
}

/**
 * Clears pending booking draft without wiping search history
 */
function clearPendingDraft(sessionId = "default_session") {
  const state = getSessionState(sessionId);
  state.pendingDraft = null;
  state.lastActivity = Date.now();
  sessions.set(sessionId, state);
}

/**
 * Resolves a worker reference (e.g. "first worker", "second one", "Amit", "Deepak")
 * against the latest structured results or global worker pool
 */
function resolveWorkerReference(query, state) {
  const lower = (query || "").toLowerCase();
  const recent = state?.lastResults || [];

  // 1. Ordinal References
  if (lower.includes("first") || lower.includes("1st") || lower.includes("pehle")) {
    if (recent.length > 0) return recent[0];
  }
  if (lower.includes("second") || lower.includes("2nd") || lower.includes("doosra")) {
    if (recent.length > 1) return recent[1];
    if (recent.length > 0) return recent[0];
  }
  if (lower.includes("third") || lower.includes("3rd") || lower.includes("teesra")) {
    if (recent.length > 2) return recent[2];
    if (recent.length > 0) return recent[0];
  }

  // 2. Name check against recent results
  if (recent.length > 0) {
    for (const w of recent) {
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

  return recent.length > 0 ? recent[0] : null;
}

/**
 * Sweeps and cleans inactive sessions to prevent memory leaks
 */
function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [id, state] of sessions.entries()) {
    if (now - state.lastActivity > SESSION_TTL_MS) {
      sessions.delete(id);
    }
  }
}

module.exports = {
  getSessionState,
  updateSessionState,
  resetSessionState,
  clearPendingDraft,
  resolveWorkerReference,
  cleanupExpiredSessions,
  GLOBAL_WORKERS_POOL,
};

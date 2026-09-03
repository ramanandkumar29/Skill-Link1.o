/**
 * Tool: searchWorkers
 * Schema, structured validation, and execution for AI-powered worker search on Skill-Link.
 * Integrated with the Smart Recommendation Engine (multi-factor scoring & explainable ranking).
 */

const { searchWorkersService } = require("../../worker.service");
const { rankWorkersWithRecommendations } = require("../../recommendation");

const UNSUPPORTED_DIGITAL_TRADES = [
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

const definition = {
  type: "function",
  function: {
    name: "searchWorkers",
    description:
      "Search, filter, score, and rank verified skilled workers (electricians, plumbers, mechanics, AC technicians, RO specialists, computer engineers) on Skill-Link using the Smart Recommendation Engine.",
    parameters: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description:
            "The service trade category (e.g., 'plumber', 'electrician', 'ac', 'mechanic_car', 'bike_repair', 'ro_repair', 'computer_repair', 'appliances', 'mason', 'salon', 'cleaning').",
        },
        skills: {
          type: "string",
          description: "Specific skill or problem keyword (e.g., 'jet pump', 'short circuit', 'mcb', 'pipe leak', 'engine', 'membrane').",
        },
        workerName: {
          type: "string",
          description: "Specific worker name or title (e.g., 'Ramanand', 'Vikram', 'Amit', 'Deepak').",
        },
        lat: {
          type: "number",
          description: "User latitude coordinate (-90 to 90) provided via browser permission.",
        },
        lng: {
          type: "number",
          description: "User longitude coordinate (-180 to 180) provided via browser permission.",
        },
        location: {
          type: "string",
          description: "Manual sector, area, or city name provided by user (e.g., 'Sector 17, Chandigarh', 'Mohali', 'Panchkula').",
        },
        nearMe: {
          type: "boolean",
          description: "Set to true if user explicitly requested workers 'near me', 'nearby', 'paas me', or 'closest'.",
        },
        experienced: {
          type: "boolean",
          description: "Filter for senior/experienced professionals with 5+ years of verified industry experience.",
        },
        affordable: {
          type: "boolean",
          description: "Filter for budget-friendly workers with base visiting fees at or below ₹149.",
        },
        bestRated: {
          type: "boolean",
          description: "Prioritize top customer ratings and reviews.",
        },
        maxRate: {
          type: "number",
          description: "Maximum visiting fee or rate in INR.",
        },
        minRating: {
          type: "number",
          description: "Minimum star rating threshold (e.g., 4.8).",
        },
        sortBy: {
          type: "string",
          enum: ["recommendation", "distance", "rating", "experience", "price_asc", "price_desc", "matchScore"],
          description: "Sorting preference.",
        },
        isAmbiguous: {
          type: "boolean",
          description: "Set to true if user's trade request is generic (e.g., 'find me a technician' without specifying trade).",
        },
      },
    },
  },
};

/**
 * Validate and execute searchWorkers tool with Recommendation Scoring
 */
async function execute(args = {}, userContext = {}) {
  const rawCat = (args.category || "").trim().toLowerCase();
  const rawSkill = (args.skills || "").trim().toLowerCase();
  const rawName = (args.workerName || "").trim();

  // 1. Edge Case: Ambiguous Request without Trade
  if (args.isAmbiguous || (!rawCat && !rawSkill && !rawName && !args.experienced && !args.affordable && !args.nearMe && !args.bestRated)) {
    return {
      success: true,
      toolName: "searchWorkers",
      isAmbiguous: true,
      message:
        "What type of specialist or technician do you need? For example: AC repair, Electrician, Plumber, Car/Bike Mechanic, RO Purifier, Laptop/Computer, Mason, or Cleaning.",
      workers: [],
      richPayload: null,
    };
  }

  // 2. Edge Case: Unsupported Digital or Non-Platform Trade Check
  const isUnsupported = UNSUPPORTED_DIGITAL_TRADES.some(
    (trade) => rawCat.includes(trade) || rawSkill.includes(trade)
  );

  if (isUnsupported) {
    return {
      success: false,
      toolName: "searchWorkers",
      isUnsupportedService: true,
      message:
        "Skill-Link specializes in on-demand doorstep home maintenance and 15-minute emergency roadside assistance. Digital services like graphic design or web development are not currently offered.",
      workers: [],
      richPayload: null,
    };
  }

  // 3. Category Normalization & Aliases
  let cleanCategory = rawCat;
  if (rawCat.includes("bijli") || rawCat.includes("fan") || rawCat.includes("spark") || rawCat.includes("switchboard") || rawCat.includes("mcb")) {
    cleanCategory = "electrician";
  } else if (rawCat.includes("nal") || rawCat.includes("pipe") || rawCat.includes("tap") || rawCat.includes("drain") || rawCat.includes("leakage")) {
    cleanCategory = "plumber";
  } else if (rawCat.includes("car") || rawCat.includes("gadi") || rawCat.includes("engine") || rawCat.includes("automobile")) {
    cleanCategory = "mechanic_car";
  } else if (rawCat.includes("bike") || rawCat.includes("scooty") || rawCat.includes("two wheeler") || rawCat.includes("motorcycle")) {
    cleanCategory = "bike_repair";
  } else if (rawCat.includes("ac") || rawCat.includes("air conditioner") || rawCat.includes("cooling")) {
    cleanCategory = "ac";
  } else if (rawCat.includes("ro") || rawCat.includes("water purifier") || rawCat.includes("purifier")) {
    cleanCategory = "ro_repair";
  } else if (rawCat.includes("laptop") || rawCat.includes("computer") || rawCat.includes("pc")) {
    cleanCategory = "computer_repair";
  } else if (rawCat.includes("safai") || rawCat.includes("cleaning") || rawCat.includes("deep clean")) {
    cleanCategory = "cleaning";
  } else if (rawCat.includes("mistri") || rawCat.includes("mason") || rawCat.includes("tile") || rawCat.includes("cement")) {
    cleanCategory = "mason";
  } else if (rawCat.includes("parlour") || rawCat.includes("salon") || rawCat.includes("makeup") || rawCat.includes("grooming")) {
    cleanCategory = "salon";
  }

  // 4. Privacy-Safe Location Inspection
  const userLat = typeof args.lat === "number" ? args.lat : (typeof userContext.lat === "number" ? userContext.lat : null);
  const userLng = typeof args.lng === "number" ? args.lng : (typeof userContext.lng === "number" ? userContext.lng : null);
  const manualLocation = args.location || userContext.location || userContext.locationName || null;

  const hasLocation = (userLat !== null && userLng !== null) || !!manualLocation;

  if (args.nearMe && !hasLocation) {
    return {
      success: true,
      toolName: "searchWorkers",
      requiresLocation: true,
      pendingTrade: cleanCategory,
      message: `To find the closest verified ${cleanCategory || "technicians"} near you, please allow location access or type your area/sector (e.g. Sector 17, Chandigarh).`,
      workers: [],
      richPayload: null,
    };
  }

  // 5. Query Real Workers from Database / Seed Service
  const result = await searchWorkersService({
    category: cleanCategory,
    skills: rawSkill,
    workerName: rawName,
    lat: userLat,
    lng: userLng,
    location: manualLocation || "Chandigarh",
    experienced: args.experienced === true,
    affordable: args.affordable === true,
    maxPrice: typeof args.maxRate === "number" && args.maxRate > 0 ? args.maxRate : undefined,
    minRating: typeof args.minRating === "number" && args.minRating > 0 ? args.minRating : undefined,
    isEmergency: false,
  });

  const rawWorkersList = (result.workers || []).map((w) => {
    const raw = w.worker || w;
    return {
      workerId: raw.workerId || raw.id || "w-1",
      name: raw.name,
      occupation: raw.occupation,
      category: raw.category,
      rating: raw.rating || 4.8,
      reviewsCount: raw.reviewsCount || raw.totalReviews || 100,
      experience: raw.experience || "5+ years",
      location: raw.location || "Sector 17, Chandigarh",
      distanceKm: w.distanceKm || "1.2",
      visitingFee: raw.visitingFee || 149,
      hourlyRate: raw.hourlyRate || 349,
      phone: raw.phone || "+91 98765 43210",
      avatarUrl: raw.avatarUrl || raw.avatar,
      badge: raw.badge || "Verified",
      skills: raw.skills || [],
      isAvailable: raw.isOnline !== false && raw.isAvailable !== false,
      trustScore: raw.trustScore || 95,
      isVerified: raw.isVerified !== false,
    };
  });

  if (rawWorkersList.length === 0) {
    return {
      success: true,
      toolName: "searchWorkers",
      count: 0,
      category: cleanCategory,
      message: `No verified workers found near '${manualLocation || "your location"}' for '${cleanCategory || "this service"}'. Try expanding your search to the wider Chandigarh Tricity area.`,
      workers: [],
      richPayload: null,
    };
  }

  // 6. Recommendation Scoring & Multi-Factor Ranking
  const preferences = {
    pricePreference: args.affordable ? "cheapest" : null,
    affordable: args.affordable === true,
    locationPriority: !!hasLocation || args.nearMe === true,
    nearMe: args.nearMe === true,
    ratingPriority: args.bestRated === true || (typeof args.minRating === "number" && args.minRating >= 4.8),
    experiencePriority: args.experienced === true,
  };

  const { rankedWorkers, topRecommendationExplanation } = rankWorkersWithRecommendations(
    rawWorkersList,
    preferences,
    { category: cleanCategory }
  );

  return {
    success: true,
    toolName: "searchWorkers",
    category: cleanCategory,
    count: rankedWorkers.length,
    userLocationUsed: result.userLocationUsed,
    workers: rankedWorkers,
    topRecommendationExplanation,
    richPayload: {
      type: "workers",
      workers: rankedWorkers,
    },
  };
}

module.exports = {
  definition,
  execute,
};

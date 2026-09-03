const mongoose = require("mongoose");
const Worker = require("../models/Worker");
const { calculateWorkerMatchScore } = require("../utils/matching");

/**
 * Haversine great-circle distance in kilometers between two [lng, lat] coordinate pairs
 */
function haversineKm([lng1, lat1], [lng2, lat2]) {
  if (typeof lng1 !== "number" || typeof lat1 !== "number" || typeof lng2 !== "number" || typeof lat2 !== "number") {
    return 2.5; // default fallback distance in km
  }
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return Number((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2));
}

// Known regional location centers for manual text fallback matching
const REGION_COORDINATES = {
  "sector 17": [76.7850, 30.7360],
  "sector 22": [76.7700, 30.7280],
  "sector 35": [76.7580, 30.7200],
  "sector 19": [76.7880, 30.7300],
  "sector 20": [76.7820, 30.7250],
  "mohali": [76.7179, 30.7046],
  "panchkula": [76.8606, 30.6942],
  "industrial area": [76.8050, 30.7080],
  "chandigarh": [76.7794, 30.7333],
};

const SEED_WORKERS = [
  {
    workerId: "w_ramanand_kumar",
    name: "Ramanand Kumar",
    occupation: "Master House Painter & Wall Texture Specialist",
    category: "painter",
    phone: "6203637790",
    rating: 4.9,
    reviewsCount: 142,
    jobsCompleted: 165,
    trustScore: 99,
    experience: "4 years",
    location: "Sector 17, Chandigarh",
    liveLocation: { type: "Point", coordinates: [76.7794, 30.7333] },
    visitingFee: 149,
    hourlyRate: 349,
    avatarUrl: "/workers/ramanand-kumar.png",
    isOnline: true,
    isAvailable: true,
    isVerified: true,
    skills: ["Interior Emulsion Painting", "Exterior Weathercoat", "Wall Putty & Primer", "Artistic Texture Designing", "Waterproofing & Seepage Fix"],
    emergencySupported: true,
  },
  {
    workerId: "w1",
    name: "Ramanand",
    occupation: "Master Automobile & Bike Mechanic",
    category: "mechanic_car",
    phone: "+91 98765 43210",
    rating: 4.9,
    reviewsCount: 184,
    jobsCompleted: 260,
    trustScore: 99,
    experience: "8 years",
    location: "Sector 17, Chandigarh",
    liveLocation: { type: "Point", coordinates: [76.7850, 30.7360] },
    visitingFee: 199,
    hourlyRate: 399,
    isOnline: true,
    isAvailable: true,
    isVerified: true,
    skills: ["Engine Diagnostics", "Car Diagnostics", "Brake Repair", "Highway SOS", "Engine Overhaul"],
    emergencySupported: true,
  },
  {
    workerId: "w2",
    name: "Vikram Sharma",
    occupation: "Certified Master Plumber",
    category: "plumber",
    phone: "+91 98111 22334",
    rating: 4.8,
    reviewsCount: 112,
    jobsCompleted: 140,
    trustScore: 95,
    experience: "6 years",
    location: "Sector 17, Chandigarh",
    liveLocation: { type: "Point", coordinates: [76.7780, 30.7340] },
    visitingFee: 149,
    hourlyRate: 299,
    isOnline: true,
    isAvailable: true,
    isVerified: true,
    skills: ["Concealed Pipe Leaks", "Bathroom Sanitary", "Water Tank & Motor", "Drain Blockage"],
    emergencySupported: true,
  },
  {
    workerId: "w3",
    name: "Amit Patel",
    occupation: "Licensed Electrical Technician",
    category: "electrician",
    phone: "+91 98222 33445",
    rating: 4.9,
    reviewsCount: 195,
    jobsCompleted: 230,
    trustScore: 97,
    experience: "7 years",
    location: "Sector 22, Chandigarh",
    liveLocation: { type: "Point", coordinates: [76.7700, 30.7280] },
    visitingFee: 149,
    hourlyRate: 349,
    isOnline: true,
    isAvailable: true,
    isVerified: true,
    skills: ["Short Circuit Recovery", "MCB Trip Repair", "House Wiring", "Ceiling Fan", "Inverter Setup"],
    emergencySupported: true,
  },
  {
    workerId: "w4",
    name: "Deepak Kumar",
    occupation: "HVAC & AC Service Specialist",
    category: "ac",
    phone: "+91 98333 44556",
    rating: 4.7,
    reviewsCount: 92,
    jobsCompleted: 115,
    trustScore: 93,
    experience: "5 years",
    location: "Sector 35, Chandigarh",
    liveLocation: { type: "Point", coordinates: [76.7580, 30.7200] },
    visitingFee: 199,
    hourlyRate: 399,
    isOnline: true,
    isAvailable: true,
    isVerified: true,
    skills: ["Jet Pump Cleaning", "Gas Leak Detection", "Compressor PCB Repair", "Cooling Diagnostics"],
    emergencySupported: false,
  },
  {
    workerId: "w_bike_1",
    name: "Raj Kumar",
    occupation: "Senior Bike & Scooter Mechanic",
    category: "bike_repair",
    phone: "+91 98765 11001",
    rating: 4.9,
    reviewsCount: 145,
    jobsCompleted: 210,
    trustScore: 98,
    experience: "7 years",
    location: "Sector 19, Chandigarh",
    liveLocation: { type: "Point", coordinates: [76.7880, 30.7300] },
    visitingFee: 149,
    hourlyRate: 249,
    isOnline: true,
    isAvailable: true,
    isVerified: true,
    skills: ["Bike Engine Overhaul", "Carburetor Tuning", "Clutch & Brake Repair", "Puncture SOS"],
    emergencySupported: true,
  },
  {
    workerId: "w_ro_1",
    name: "Suresh Mehra",
    occupation: "Water Purifier & RO Technician",
    category: "ro_repair",
    phone: "+91 98765 11006",
    rating: 4.8,
    reviewsCount: 78,
    jobsCompleted: 88,
    trustScore: 94,
    experience: "4 years",
    location: "Sector 20, Chandigarh",
    liveLocation: { type: "Point", coordinates: [76.7820, 30.7250] },
    visitingFee: 149,
    hourlyRate: 249,
    isOnline: true,
    isAvailable: true,
    isVerified: true,
    skills: ["RO Membrane Change", "Filter Replacement", "TDS Calibration", "Booster Pump"],
    emergencySupported: false,
  },
  {
    workerId: "w_comp_1",
    name: "Nitin Verma",
    occupation: "Hardware & Laptop Engineer",
    category: "computer_repair",
    phone: "+91 98765 11007",
    rating: 4.9,
    reviewsCount: 130,
    jobsCompleted: 175,
    trustScore: 96,
    experience: "6 years",
    location: "Industrial Area Phase 1, Chandigarh",
    liveLocation: { type: "Point", coordinates: [76.8050, 30.7080] },
    visitingFee: 149,
    hourlyRate: 349,
    isOnline: true,
    isAvailable: true,
    isVerified: true,
    skills: ["Blue Screen Recovery", "SSD Upgrade", "RAM Expansion", "Hinge Repair"],
    emergencySupported: false,
  }
];

function parseExperienceYears(expStr) {
  if (!expStr) return 0;
  const match = String(expStr).match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

/**
 * Enhanced Worker Search Service supporting Privacy-Safe Location, Distance Sorting, and Filters
 */
async function searchWorkersService(params = {}) {
  const {
    category,
    skills,
    workerName,
    minExperience,
    experienced,
    minRating,
    maxPrice,
    affordable,
    isAvailable,
    lat,
    lng,
    radiusKm = 25,
    location = "Chandigarh",
    sortBy = "matchScore",
    isEmergency = false,
  } = params;

  let pool = SEED_WORKERS;
  if (mongoose.connection.readyState === 1) {
    try {
      const mongoDocs = await Worker.find();
      if (mongoDocs && mongoDocs.length > 0) {
        pool = mongoDocs;
      }
    } catch (e) {}
  }

  // Deduplicate pool by worker name
  const seenNames = new Set();
  const dedupedPool = [];
  for (const w of pool) {
    const key = (w.name || w.workerId || "").toLowerCase().trim();
    if (key && !seenNames.has(key)) {
      seenNames.add(key);
      dedupedPool.push(w);
    }
  }

  const cleanCat = (category || "").trim().toLowerCase();
  const cleanName = (workerName || "").trim().toLowerCase();
  const cleanSkill = (skills || "").trim().toLowerCase();

  // Determine user coordinates (from GPS lat/lng or manual location name)
  let userCoords = null;
  const hasValidGps = typeof lat === "number" && typeof lng === "number" && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

  if (hasValidGps) {
    userCoords = [lng, lat];
  } else if (location && typeof location === "string") {
    const lowerLoc = location.toLowerCase().trim();
    for (const [region, coords] of Object.entries(REGION_COORDINATES)) {
      if (lowerLoc.includes(region) || region.includes(lowerLoc)) {
        userCoords = coords;
        break;
      }
    }
  }

  // 1. Filter by category, trade, name, and skills
  let filtered = dedupedPool.filter((w) => {
    const wCat = (w.category || "").toLowerCase();
    const wName = (w.name || "").toLowerCase();
    const wOcc = (w.occupation || "").toLowerCase();
    const wSkills = Array.isArray(w.skills) ? w.skills.map((s) => s.toLowerCase()) : [];

    // Category filter
    if (cleanCat && cleanCat !== "all") {
      const matchCat =
        wCat.includes(cleanCat) ||
        cleanCat.includes(wCat) ||
        wOcc.includes(cleanCat) ||
        wSkills.some((s) => s.includes(cleanCat));
      if (!matchCat) return false;
    }

    // Name filter
    if (cleanName) {
      const matchName = wName.includes(cleanName) || wOcc.includes(cleanName);
      if (!matchName) return false;
    }

    // Skill filter
    if (cleanSkill) {
      const matchSkill = wSkills.some((s) => s.includes(cleanSkill)) || wOcc.includes(cleanSkill);
      if (!matchSkill) return false;
    }

    // Rating filter
    if (minRating && (w.rating || 0) < Number(minRating)) {
      return false;
    }

    // Max price / affordable filter
    if (maxPrice && (w.visitingFee || 0) > Number(maxPrice)) {
      return false;
    }
    if (affordable && (w.visitingFee || 0) > 149) {
      return false;
    }

    // Experience filter (>= 5 years)
    const years = parseExperienceYears(w.experience);
    if (experienced && years < 5) {
      return false;
    }
    if (minExperience && years < Number(minExperience)) {
      return false;
    }

    // Availability filter
    if (isAvailable && w.isOnline === false) {
      return false;
    }

    return true;
  });

  // Fallback category relaxing if needed
  if (filtered.length === 0 && cleanCat && cleanCat !== "all") {
    filtered = dedupedPool.filter((w) => {
      const wCat = (w.category || "").toLowerCase();
      const wOcc = (w.occupation || "").toLowerCase();
      const wSkills = Array.isArray(w.skills) ? w.skills.map((s) => s.toLowerCase()) : [];
      return (
        wCat.includes(cleanCat) ||
        cleanCat.includes(wCat) ||
        wOcc.includes(cleanCat) ||
        wSkills.some((s) => s.includes(cleanCat))
      );
    });
  }

  // 2. Score, Compute Haversine Distance & Rank
  const ranked = filtered.map((w) => {
    const workerCoords = w.liveLocation?.coordinates || [76.7850, 30.7360];
    let distanceKm = 2.0;

    if (userCoords) {
      distanceKm = haversineKm(workerCoords, userCoords);
    }

    const etaMins = Math.max(10, Math.min(60, Math.round(distanceKm * 4 + 8)));
    const scoreInfo = calculateWorkerMatchScore(w, { category: cleanCat, isEmergency, location });

    return {
      worker: w,
      matchScore: scoreInfo.matchScore,
      distanceKm: Number(distanceKm.toFixed(1)),
      etaMins,
      startingPrice: w.visitingFee || 149,
      experienceYears: parseExperienceYears(w.experience),
    };
  });

  // 3. Filter by radius if GPS userCoords were provided and radius specified
  let inRadius = ranked;
  if (userCoords && radiusKm > 0) {
    const radiusFiltered = ranked.filter((r) => r.distanceKm <= radiusKm);
    if (radiusFiltered.length > 0) {
      inRadius = radiusFiltered;
    }
  }

  // 4. Sort based on preference or distance
  if (sortBy === "distance" || (userCoords && sortBy === "matchScore")) {
    inRadius.sort((a, b) => a.distanceKm - b.distanceKm);
  } else if (sortBy === "rating") {
    inRadius.sort((a, b) => (b.worker.rating || 0) - (a.worker.rating || 0));
  } else if (sortBy === "experience") {
    inRadius.sort((a, b) => b.experienceYears - a.experienceYears);
  } else if (sortBy === "price_asc") {
    inRadius.sort((a, b) => (a.worker.visitingFee || 0) - (b.worker.visitingFee || 0));
  } else if (sortBy === "price_desc") {
    inRadius.sort((a, b) => (b.worker.visitingFee || 0) - (a.worker.visitingFee || 0));
  } else {
    inRadius.sort((a, b) => b.matchScore - a.matchScore);
  }

  return {
    success: true,
    count: inRadius.length,
    userLocationUsed: !!userCoords,
    workers: inRadius.slice(0, 5),
  };
}

async function getWorkerDetailsService(workerId) {
  const cleanId = (workerId || "").trim().toLowerCase();
  let worker = SEED_WORKERS.find(
    (w) =>
      (w.workerId || "").toLowerCase() === cleanId ||
      (w.id || "").toLowerCase() === cleanId ||
      (w.name || "").toLowerCase().includes(cleanId)
  );

  if (mongoose.connection.readyState === 1) {
    try {
      const doc = await Worker.findOne({
        $or: [{ workerId }, { name: new RegExp(workerId, "i") }],
      });
      if (doc) worker = doc;
    } catch (e) {}
  }

  if (!worker) {
    return { success: false, message: `Worker #${workerId} not found.` };
  }

  const visitFee = worker.visitingFee || 149;
  const laborFee = worker.hourlyRate || 349;
  const platformFee = 20;

  return {
    success: true,
    worker,
    priceEstimate: {
      visitFee,
      estimatedLaborFee: laborFee,
      platformFee,
      totalEstimate: visitFee + laborFee + platformFee,
      disclaimer: "Final labor & parts cost may vary after physical diagnosis.",
    },
  };
}

async function checkWorkerAvailabilityService(workerId, timeSlot = "immediate") {
  const details = await getWorkerDetailsService(workerId);
  if (!details.success) return { success: false, available: false, message: "Worker not found" };

  return {
    success: true,
    workerId,
    workerName: details.worker.name,
    available: details.worker.isOnline !== false,
    timeSlot,
    etaMins: details.worker.isOnline !== false ? 15 : null,
  };
}

module.exports = {
  searchWorkersService,
  getWorkerDetailsService,
  checkWorkerAvailabilityService,
  haversineKm,
};

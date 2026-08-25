/**
 * Skill-Link Intelligent Worker Match Engine
 * ==========================================
 * Calculates deterministic multi-factor match scores:
 * 
 * Total Worker Score (0 - 105) =
 *     Service Match Score    (Max: 35 pts)
 *   + Location Proximity     (Max: 25 pts)
 *   + Customer Rating        (Max: 20 pts)
 *   + Live Availability      (Max: 15 pts)
 *   + Experience & Trust     (Max: 10 pts)
 *   + Emergency SOS Bonus    (Max: 10 pts)
 */

function calculateWorkerMatchScore(worker, query = {}) {
  const {
    category = "",
    location = "Chandigarh",
    isEmergency = false
  } = query;

  const targetCategory = category.toLowerCase();
  const workerCategory = (worker.category || "").toLowerCase();
  const workerSkills = (worker.skills || []).map(s => s.toLowerCase());

  // 1. Service Match Score (Max: 35)
  let serviceScore = 0;
  if (workerCategory === targetCategory) {
    serviceScore = 35;
  } else if (workerCategory.includes(targetCategory) || targetCategory.includes(workerCategory)) {
    serviceScore = 28;
  } else if (workerSkills.some(s => s.includes(targetCategory) || targetCategory.includes(s))) {
    serviceScore = 25;
  } else {
    serviceScore = 10;
  }

  // 2. Location Match Score (Max: 25)
  let locationScore = 15;
  let distanceKm = 2.5;
  const userLoc = (location || "").toLowerCase();
  const workerLoc = (worker.location || "").toLowerCase();

  if (userLoc && workerLoc && (userLoc.includes(workerLoc) || workerLoc.includes(userLoc))) {
    locationScore = 25;
    distanceKm = 1.2;
  } else if (userLoc.includes("sector") && workerLoc.includes("sector")) {
    locationScore = 20;
    distanceKm = 2.0;
  } else {
    distanceKm = 3.8;
    locationScore = 15;
  }

  // 3. Customer Rating Score (Max: 20)
  // Rating 5.0 -> 20 pts, 4.5 -> 18 pts, 4.0 -> 16 pts
  const rating = worker.rating || 4.5;
  const ratingScore = Math.min(20, Math.round((rating / 5.0) * 20));

  // 4. Live Availability Score (Max: 15)
  const isOnline = worker.isOnline !== undefined ? worker.isOnline : true;
  const availabilityScore = isOnline ? 15 : 0;
  const etaMins = isOnline ? Math.round(distanceKm * 4 + 6) : null;

  // 5. Experience & Trust Score (Max: 10)
  const jobs = worker.jobsCompleted || 50;
  const trust = worker.trustScore || 90;
  const experienceScore = Math.min(10, Math.round((trust / 100) * 6 + Math.min(4, jobs / 25)));

  // 6. Emergency SOS Priority Bonus (Max: 10)
  let emergencyBonus = 0;
  if (isEmergency && worker.emergencySupported) {
    emergencyBonus = 10;
  }

  const totalScore = serviceScore + locationScore + ratingScore + availabilityScore + experienceScore + emergencyBonus;

  return {
    matchScore: totalScore,
    breakdown: {
      serviceScore,
      locationScore,
      ratingScore,
      availabilityScore,
      experienceScore,
      emergencyBonus
    },
    distanceKm,
    etaMins,
    rating,
    isOnline
  };
}

module.exports = { calculateWorkerMatchScore };

/**
 * Skill-Link Worker Matching Engine
 * =================================
 * Calculates transparent multi-factor worker score (Max: 100+ points):
 * 
 * Worker Score =
 *     Service Match Score   (0–30 pts)
 *   + Skill Keyword Match   (0–15 pts)
 *   + Location Proximity    (0–20 pts)
 *   + Live Availability     (0–15 pts)
 *   + Rating Score          (0–10 pts)
 *   + Experience & Trust    (0–10 pts)
 *   + Verification Score    (0–5 pts)
 *   + Emergency SOS Bonus   (0–10 pts)
 */

function calculateWorkerMatchScore(worker, query = {}) {
  const {
    service = "",
    category = "",
    location = "Chandigarh",
    isEmergency = false
  } = query;

  const targetCategory = (service || category || "").toLowerCase().trim();
  const workerCategory = (worker.category || "").toLowerCase().trim();
  const workerSkills = (worker.skills || []).map(s => s.toLowerCase());

  // 1. Service Match Score (Max: 30)
  let serviceScore = 0;
  if (workerCategory === targetCategory) {
    serviceScore = 30;
  } else if (workerCategory.includes(targetCategory) || targetCategory.includes(workerCategory)) {
    serviceScore = 24;
  } else {
    serviceScore = 10;
  }

  // 2. Skill Match Score (Max: 15)
  let skillScore = 0;
  if (workerSkills.some(s => s.includes(targetCategory) || targetCategory.includes(s))) {
    skillScore = 15;
  } else if (workerSkills.length > 0) {
    skillScore = 8;
  }

  // 3. Location Proximity Score (Max: 20)
  let locationScore = 12;
  let distanceKm = 2.4;
  const userLoc = (location || "").toLowerCase();
  const workerLoc = (worker.location || "").toLowerCase();

  if (userLoc && workerLoc && (userLoc.includes(workerLoc) || workerLoc.includes(userLoc))) {
    locationScore = 20;
    distanceKm = 1.2;
  } else if (userLoc.includes("sector") && workerLoc.includes("sector")) {
    locationScore = 16;
    distanceKm = 1.8;
  } else {
    distanceKm = 3.5;
    locationScore = 12;
  }

  // 4. Live Availability Score (Max: 15)
  const isOnline = worker.isOnline !== undefined ? worker.isOnline : true;
  const availabilityScore = isOnline ? 15 : 0;
  const etaMins = isOnline ? Math.round(distanceKm * 4 + 6) : null;

  // 5. Customer Rating Score (Max: 10)
  const rating = worker.rating || 4.5;
  const ratingScore = Math.min(10, Math.round((rating / 5.0) * 10));

  // 6. Experience & Trust Score (Max: 10)
  const trust = worker.trustScore || 90;
  const jobs = worker.jobsCompleted || 50;
  const experienceScore = Math.min(10, Math.round((trust / 100) * 6 + Math.min(4, jobs / 25)));

  // 7. Verification Score (Max: 5)
  const verificationScore = worker.isVerified ? 5 : 0;

  // 8. Emergency SOS Priority Bonus (Max: 10)
  let emergencyBonus = 0;
  if (isEmergency && worker.emergencySupported) {
    emergencyBonus = 10;
  }

  const totalScore = serviceScore + skillScore + locationScore + availabilityScore + ratingScore + experienceScore + verificationScore + emergencyBonus;

  return {
    matchScore: totalScore,
    breakdown: {
      serviceScore,
      skillScore,
      locationScore,
      availabilityScore,
      ratingScore,
      experienceScore,
      verificationScore,
      emergencyBonus
    },
    distanceKm,
    etaMins,
    rating,
    isOnline,
    isVerified: !!worker.isVerified
  };
}

module.exports = { calculateWorkerMatchScore };

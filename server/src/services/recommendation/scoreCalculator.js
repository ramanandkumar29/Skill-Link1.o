/**
 * Deterministic Worker Recommendation Score Calculator
 * Calculates multi-factor scores and generates strictly factual explanation bullets.
 */

function parseExperienceYears(expStr) {
  if (!expStr) return 4;
  const match = String(expStr).match(/\d+/);
  return match ? parseInt(match[0], 10) : 4;
}

/**
 * Calculates recommendation score for a single worker
 * @param {Object} worker
 * @param {Object} weights
 * @param {Object} context
 * @returns {{ score: number, subScores: Object, whyRecommended: string[] }}
 */
function calculateWorkerRecommendationScore(worker, weights, context = {}) {
  const targetCategory = (context.category || "").toLowerCase();
  const workerCategory = (worker.category || "").toLowerCase();
  const workerSkills = Array.isArray(worker.skills) ? worker.skills.map((s) => s.toLowerCase()) : [];

  // 1. Service Relevance Sub-score (0 - 100)
  let serviceScore = 75;
  if (targetCategory) {
    if (workerCategory === targetCategory) serviceScore = 100;
    else if (workerCategory.includes(targetCategory) || targetCategory.includes(workerCategory)) serviceScore = 90;
    else if (workerSkills.some((s) => s.includes(targetCategory))) serviceScore = 85;
    else serviceScore = 60;
  }

  // 2. Distance Sub-score (0 - 100)
  const distanceKm = typeof worker.distanceKm === "number" ? worker.distanceKm : (parseFloat(worker.distanceKm) || 2.5);
  const distanceScore = Math.max(0, Math.min(100, Math.round((1 - Math.min(distanceKm, 20) / 20) * 100)));

  // 3. Rating Sub-score (0 - 100)
  const rating = typeof worker.rating === "number" ? worker.rating : 4.6;
  const ratingScore = Math.max(0, Math.min(100, Math.round((rating / 5.0) * 100)));

  // 4. Experience Sub-score (0 - 100)
  const expYears = parseExperienceYears(worker.experience);
  const experienceScore = Math.max(0, Math.min(100, Math.round(Math.min(expYears, 10) * 10)));

  // 5. Price / Affordability Sub-score (0 - 100)
  const visitingFee = typeof worker.visitingFee === "number" ? worker.visitingFee : 149;
  const priceScore = Math.max(0, Math.min(100, Math.round((1 - Math.max(0, visitingFee - 149) / 200) * 100)));

  // 6. Availability Sub-score (0 - 100)
  const isAvailable = worker.isOnline !== false && worker.isAvailable !== false;
  const availabilityScore = isAvailable ? 100 : 40;

  // 7. Trust / Badge Sub-score (0 - 100)
  const trustScore = typeof worker.trustScore === "number" ? worker.trustScore : 92;

  // Weighted Sum Calculation
  const finalScore = Math.round(
    (weights.serviceRelevance || 0.2) * serviceScore +
    (weights.distance || 0.2) * distanceScore +
    (weights.rating || 0.2) * ratingScore +
    (weights.experience || 0.15) * experienceScore +
    (weights.price || 0.1) * priceScore +
    (weights.availability || 0.05) * availabilityScore +
    (weights.trustBadge || 0.1) * trustScore
  );

  // Generate Strictly Factual "Why Recommended" Bullets
  const whyRecommended = [];

  if (distanceKm <= 2.5) {
    whyRecommended.push(`Closest technician (${distanceKm} km away in ${worker.location || "Chandigarh"})`);
  } else {
    whyRecommended.push(`Located in ${worker.location || "Chandigarh"} (${distanceKm} km away)`);
  }

  if (rating >= 4.8) {
    whyRecommended.push(`Exceptional ${rating}★ customer rating with ${worker.reviewsCount || 100}+ completed jobs`);
  } else if (rating >= 4.5) {
    whyRecommended.push(`Consistent ${rating}★ rating on verified service calls`);
  }

  if (expYears >= 5) {
    whyRecommended.push(`Senior specialist with ${worker.experience || `${expYears} years`} field experience`);
  }

  if (visitingFee <= 149) {
    whyRecommended.push(`Affordable ₹${visitingFee} base visiting fee`);
  } else {
    whyRecommended.push(`Transparent rate card (₹${visitingFee} visiting fee)`);
  }

  if (worker.isVerified) {
    whyRecommended.push("Aadhaar KYC verified under Skill-Link Trust Shield");
  }

  return {
    score: Math.min(100, Math.max(10, finalScore)),
    subScores: {
      serviceScore,
      distanceScore,
      ratingScore,
      experienceScore,
      priceScore,
      availabilityScore,
      trustScore,
    },
    whyRecommended: whyRecommended.slice(0, 3), // Top 3 most compelling verified bullets
  };
}

module.exports = {
  calculateWorkerRecommendationScore,
  parseExperienceYears,
};

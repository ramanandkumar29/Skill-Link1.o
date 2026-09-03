/**
 * Recommendation Service — Skill-Link Recommendation Engine
 * Orchestrates preference extraction, score calculation, ranking, and explainability.
 */

const { DEFAULT_WEIGHTS, PREFERENCE_PROFILES } = require("./config");
const { calculateWorkerRecommendationScore } = require("./scoreCalculator");

/**
 * Derives dynamic weights based on user preferences
 * @param {Object} preferences
 * @returns {Object}
 */
function resolveWeights(preferences = {}) {
  if (preferences.pricePreference === "cheapest" || preferences.affordable) {
    return PREFERENCE_PROFILES.cheapest;
  }
  if (preferences.locationPriority || preferences.nearMe || preferences.closest) {
    return PREFERENCE_PROFILES.closest;
  }
  if (preferences.ratingPriority || preferences.bestRated) {
    return PREFERENCE_PROFILES.highest_rated;
  }
  if (preferences.experiencePriority || preferences.experienced) {
    return PREFERENCE_PROFILES.most_experienced;
  }
  return DEFAULT_WEIGHTS;
}

/**
 * Rank a list of verified workers and annotate with recommendation scores and explanations
 * @param {Array<Object>} workers
 * @param {Object} [preferences]
 * @param {Object} [context]
 * @returns {{ rankedWorkers: Array<Object>, topRecommendationExplanation: string }}
 */
function rankWorkersWithRecommendations(workers = [], preferences = {}, context = {}) {
  if (!Array.isArray(workers) || workers.length === 0) {
    return {
      rankedWorkers: [],
      topRecommendationExplanation: "No matching workers available to rank.",
    };
  }

  const weights = resolveWeights(preferences);

  // Score each candidate worker
  const scoredWorkers = workers.map((workerCandidate) => {
    const raw = workerCandidate.worker || workerCandidate;
    const distanceKm = workerCandidate.distanceKm || raw.distanceKm || "1.5";

    const workerObj = {
      ...raw,
      distanceKm: typeof distanceKm === "string" ? parseFloat(distanceKm) : distanceKm,
    };

    const { score, subScores, whyRecommended } = calculateWorkerRecommendationScore(
      workerObj,
      weights,
      context
    );

    return {
      ...raw,
      distanceKm: workerObj.distanceKm,
      recommendationScore: score,
      subScores,
      whyRecommended,
    };
  });

  // Sort descending by recommendationScore
  scoredWorkers.sort((a, b) => b.recommendationScore - a.recommendationScore);

  // Assign ranking badges
  const rankedWorkers = scoredWorkers.map((w, idx) => {
    let rankingBadge = "#3 Recommended Pro";
    if (idx === 0) rankingBadge = "#1 Top Recommendation";
    else if (idx === 1) rankingBadge = "#2 Great Match";
    else if (idx === 2) rankingBadge = "#3 High Value Match";
    else rankingBadge = `#${idx + 1} Alternative Pro`;

    return {
      ...w,
      rank: idx + 1,
      rankingBadge,
    };
  });

  // Generate Natural Top Worker Explanation
  const topWorker = rankedWorkers[0];
  const reasons = topWorker.whyRecommended || [];
  const topExplanation = reasons.length > 0
    ? `I recommend **${topWorker.name}** (${topWorker.rankingBadge}) because: ${reasons.join(", ")}.`
    : `I recommend **${topWorker.name}** as your top verified match.`;

  return {
    rankedWorkers,
    topRecommendationExplanation: topExplanation,
  };
}

module.exports = {
  rankWorkersWithRecommendations,
  resolveWeights,
};

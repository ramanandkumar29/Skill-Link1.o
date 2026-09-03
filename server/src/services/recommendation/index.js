/**
 * Skill-Link Smart Recommendation Engine Barrel
 */

const {
  rankWorkersWithRecommendations,
  resolveWeights,
} = require("./recommendation.service");
const { DEFAULT_WEIGHTS, PREFERENCE_PROFILES } = require("./config");
const { calculateWorkerRecommendationScore } = require("./scoreCalculator");

module.exports = {
  rankWorkersWithRecommendations,
  resolveWeights,
  DEFAULT_WEIGHTS,
  PREFERENCE_PROFILES,
  calculateWorkerRecommendationScore,
};

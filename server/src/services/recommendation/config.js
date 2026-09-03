/**
 * Skill-Link Recommendation Engine — Centralized Scoring Weights & Config
 * Easily tunable weights and normalization baselines.
 */

const DEFAULT_WEIGHTS = {
  serviceRelevance: 0.25, // Category / trade exact match
  distance: 0.20,         // Proximity in km (Haversine)
  rating: 0.20,           // Star rating (0 - 5.0)
  experience: 0.15,       // Years of verified experience
  price: 0.10,            // Visiting fee affordability
  availability: 0.05,     // Online / available status
  trustBadge: 0.05,       // KYC / TrustScore bonus
};

const PREFERENCE_PROFILES = {
  cheapest: {
    price: 0.40,
    serviceRelevance: 0.20,
    distance: 0.15,
    rating: 0.10,
    experience: 0.05,
    availability: 0.05,
    trustBadge: 0.05,
  },
  closest: {
    distance: 0.45,
    serviceRelevance: 0.20,
    availability: 0.10,
    rating: 0.10,
    price: 0.05,
    experience: 0.05,
    trustBadge: 0.05,
  },
  highest_rated: {
    rating: 0.45,
    trustBadge: 0.15,
    serviceRelevance: 0.15,
    experience: 0.10,
    distance: 0.05,
    price: 0.05,
    availability: 0.05,
  },
  most_experienced: {
    experience: 0.40,
    serviceRelevance: 0.20,
    rating: 0.15,
    trustBadge: 0.10,
    distance: 0.05,
    price: 0.05,
    availability: 0.05,
  },
  best_overall: DEFAULT_WEIGHTS,
};

module.exports = {
  DEFAULT_WEIGHTS,
  PREFERENCE_PROFILES,
};

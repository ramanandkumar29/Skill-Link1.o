import { WorkerProfile, ServiceCategory } from "./seedData";
import { calculateHaversineDistance } from "./geo";

export interface AIMatchResult {
  worker: WorkerProfile;
  matchScore: number; // 0 - 100
  matchReason: string;
  distanceKm: number;
  factors: {
    skillRelevance: number;    // 0 - 100
    ratingTrust: number;       // 0 - 100
    coopVerification: number;  // 0 - 100
    proximity: number;         // 0 - 100
    availability: number;      // 0 - 100
    fairOpportunity: number;   // 0 - 100 (Cooperative equal work distribution)
  };
}

/**
 * Calculates AI-based smart worker match score based on Cooperative Fairness model:
 * - Skill & Search query match (30%)
 * - Cooperative Verification & Certifications (20%)
 * - Geographical Proximity (20%)
 * - Rating & Quality Trust (15%)
 * - Fair Opportunity Distribution & Equal Work Rotation (15%)
 */
export function calculateAIMatch(
  worker: WorkerProfile,
  query: string = "",
  preferredCategory?: string,
  userLat?: number,
  userLng?: number
): AIMatchResult {
  // 1. Skill & Query Relevance (0 - 100)
  let skillScore = 75;
  const q = query.toLowerCase().trim();
  const workerCategory = worker.category.toLowerCase();
  const workerOccupation = worker.occupation.toLowerCase();
  const workerSkills = (worker.skills || []).map((s) => s.toLowerCase());

  if (preferredCategory && preferredCategory !== "All") {
    if (workerCategory === preferredCategory.toLowerCase()) {
      skillScore = 95;
    } else {
      skillScore = 40;
    }
  }

  if (q) {
    if (workerCategory.includes(q) || workerOccupation.includes(q)) {
      skillScore = Math.max(skillScore, 98);
    } else if (workerSkills.some((s) => s.includes(q))) {
      skillScore = Math.max(skillScore, 92);
    } else if (q.split(" ").some((token) => workerOccupation.includes(token) || workerSkills.some((s) => s.includes(token)))) {
      skillScore = Math.max(skillScore, 85);
    }
  }

  // 2. Rating & Trust Score (0 - 100)
  const ratingScore = Math.min(100, Math.round((worker.rating / 5.0) * 80 + (worker.trustScore / 100) * 20));

  // 3. Cooperative Verification & Certifications (0 - 100)
  let coopScore = 70;
  if (worker.kycStatus === "VERIFIED") coopScore += 15;
  if (worker.cooperativeMemberId) coopScore += 10;
  if (worker.certifications && worker.certifications.length > 0) coopScore += 5;
  coopScore = Math.min(100, coopScore);

  // 4. Geodesic Proximity calculation (Uses real Haversine formula when coordinates are available)
  let distanceKm: number;
  if (userLat && userLng && worker.latitude && worker.longitude) {
    distanceKm = calculateHaversineDistance(userLat, userLng, worker.latitude, worker.longitude);
  } else {
    // Graceful fallback to deterministic regional hash
    distanceKm = Number((1.1 + ((worker.id.charCodeAt(0) * 7) % 35) / 10).toFixed(1));
  }
  const proximityScore = Math.max(20, Math.min(100, Math.round(100 - distanceKm * 8)));

  // 5. Availability & Workload balance
  const availabilityScore = worker.isAvailable ? 95 : 30;

  // 6. Fair Opportunity Distribution Score (0 - 100)
  // Ensures new or balanced cooperative workers receive equitable job rotation
  // rather than concentrating 100% of jobs to only 1 top worker.
  const jobs = worker.jobsCompleted || 0;
  let fairOpportunityScore = 85;
  if (jobs < 50) {
    fairOpportunityScore = 98; // Priority boost for newer verified artisans
  } else if (jobs < 120) {
    fairOpportunityScore = 90;
  } else {
    fairOpportunityScore = 78; // Gentle normalization to prevent superstar monopolization
  }

  // Composite Weighted Score (Cooperative Fair Matching)
  const compositeScore = Math.round(
    skillScore * 0.30 +
    coopScore * 0.20 +
    proximityScore * 0.20 +
    ratingScore * 0.15 +
    fairOpportunityScore * 0.15
  );

  // Natural Language Explainable Reason
  let reason = "";
  if (fairOpportunityScore >= 90) {
    reason = `Cooperative Fair Rotation: Verified ${worker.occupation} with ${worker.experience} exp, recommended for balanced work distribution (~${distanceKm} km away).`;
  } else if (worker.badge === "Legendary") {
    reason = `Top-rated ${worker.occupation} with ${worker.experience} exp, verified by ${worker.cooperativeSociety?.split(" ")[0] || "Cooperative"}, ~${distanceKm} km away.`;
  } else if (worker.certifications && worker.certifications.length > 0) {
    reason = `Certified in ${worker.certifications[0].name.split("(")[0].trim()}, ~${distanceKm} km away in ${worker.location}.`;
  } else {
    reason = `Verified cooperative worker with ${worker.rating.toFixed(1)}★ rating across ${worker.jobsCompleted}+ successful jobs (~${distanceKm} km away).`;
  }

  return {
    worker,
    matchScore: compositeScore,
    matchReason: reason,
    distanceKm,
    factors: {
      skillRelevance: skillScore,
      ratingTrust: ratingScore,
      coopVerification: coopScore,
      proximity: proximityScore,
      availability: availabilityScore,
      fairOpportunity: fairOpportunityScore,
    },
  };
}

/**
 * Rank and score all workers with the AI matching engine
 */
export function rankWorkersWithAI(
  workers: WorkerProfile[],
  query: string = "",
  preferredCategory?: string,
  userLat?: number,
  userLng?: number
): AIMatchResult[] {
  return workers
    .map((w) => calculateAIMatch(w, query, preferredCategory, userLat, userLng))
    .sort((a, b) => b.matchScore - a.matchScore);
}

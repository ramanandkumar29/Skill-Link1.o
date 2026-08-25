/**
 * Worker Ranking & Match Score Calculation Engine
 */

function calculateWorkerMatchScore(worker, query = {}) {
  const { isEmergency = false, userLocation = "Chandigarh" } = query;
  
  // Base rating score (0-100)
  const ratingScore = (worker.rating || 4.5) * 20;

  // Trust score (0-30)
  const trustScore = ((worker.trustScore || 90) / 100) * 30;

  // Jobs completed weight (0-20)
  const jobsScore = Math.min(20, (worker.jobsCompleted || 20) / 5);

  // Simulated proximity penalty
  const distanceKm = Number((1.0 + Math.random() * 3.5).toFixed(1));
  const etaMins = Math.round(distanceKm * 4 + 6);
  const distancePenalty = distanceKm * 3;

  let totalScore = ratingScore * 0.4 + trustScore + jobsScore - distancePenalty;

  if (isEmergency && worker.emergencySupported) {
    totalScore += 25;
  }

  return {
    matchScore: Math.round(totalScore),
    distanceKm,
    etaMins
  };
}

module.exports = { calculateWorkerMatchScore };

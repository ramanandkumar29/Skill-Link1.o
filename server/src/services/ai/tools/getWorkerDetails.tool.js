/**
 * Tool: getWorkerDetails
 * Schema and validator for retrieving specific worker profile and trust score.
 */

const { getWorkerDetailsService } = require("../../worker.service");

const definition = {
  type: "function",
  function: {
    name: "getWorkerDetails",
    description:
      "Get detailed profile, verified badges, rating, experience, TrustScore, and visiting fee price estimate for a specific worker by workerId or name.",
    parameters: {
      type: "object",
      properties: {
        workerId: {
          type: "string",
          description: "The unique ID of the worker (e.g. 'w1', 'w2', 'w3', 'w4') or worker's name.",
        },
      },
      required: ["workerId"],
    },
  },
};

/**
 * Validate and execute getWorkerDetails tool
 */
async function execute(args = {}) {
  const workerId = (args.workerId || "").trim();
  if (!workerId) {
    return {
      success: false,
      error: "Missing required parameter: 'workerId'",
    };
  }

  const result = await getWorkerDetailsService(workerId);
  if (!result.success || !result.worker) {
    return {
      success: false,
      message: `Worker with ID/name '${workerId}' was not found.`,
    };
  }

  const raw = result.worker;
  const formattedWorker = {
    workerId: raw.workerId || raw.id || workerId,
    name: raw.name,
    occupation: raw.occupation,
    category: raw.category,
    rating: raw.rating || 4.8,
    reviewsCount: raw.reviewsCount || 100,
    experience: raw.experience || "5+ years",
    location: raw.location || "Chandigarh",
    distanceKm: "1.2",
    visitingFee: raw.visitingFee || 149,
    hourlyRate: raw.hourlyRate || 349,
    phone: raw.phone || "+91 98765 43210",
    avatarUrl: raw.avatarUrl || raw.avatar,
    badge: raw.badge || "Verified",
    skills: raw.skills || [],
    isAvailable: raw.isOnline !== false,
  };

  return {
    success: true,
    toolName: "getWorkerDetails",
    worker: formattedWorker,
    priceEstimate: result.priceEstimate,
    richPayload: {
      type: "workers",
      workers: [formattedWorker],
    },
  };
}

module.exports = {
  definition,
  execute,
};

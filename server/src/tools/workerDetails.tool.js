const { getWorkerDetailsService } = require("../services/worker.service");

const workerDetailsTool = {
  definition: {
    type: "function",
    function: {
      name: "getWorkerDetails",
      description: "Retrieve verified profile, ratings, trust score, and price breakdown for a specific worker.",
      parameters: {
        type: "object",
        properties: {
          workerId: { type: "string", description: "Worker ID (e.g. w1, w2)" }
        },
        required: ["workerId"]
      }
    }
  },
  execute: async (args) => {
    return await getWorkerDetailsService(args.workerId);
  }
};

module.exports = workerDetailsTool;

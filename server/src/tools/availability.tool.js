const { checkWorkerAvailabilityService } = require("../services/worker.service");

const availabilityTool = {
  definition: {
    type: "function",
    function: {
      name: "checkAvailability",
      description: "Check if a worker is online and available for immediate or scheduled service dispatch.",
      parameters: {
        type: "object",
        properties: {
          workerId: { type: "string", description: "Worker ID" },
          timeSlot: { type: "string", description: "Time slot or immediate" }
        },
        required: ["workerId"]
      }
    }
  },
  execute: async (args) => {
    return await checkWorkerAvailabilityService(args.workerId, args.timeSlot);
  }
};

module.exports = availabilityTool;

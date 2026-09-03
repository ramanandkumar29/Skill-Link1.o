/**
 * Tool: checkWorkerAvailability
 * Checks if a specific worker is online and available for the requested time slot.
 */

const { checkWorkerAvailabilityService } = require("../../worker.service");

const definition = {
  type: "function",
  function: {
    name: "checkWorkerAvailability",
    description:
      "Check whether a verified technician or mechanic is active, online, and accepting bookings for a specified time.",
    parameters: {
      type: "object",
      properties: {
        workerId: {
          type: "string",
          description: "Worker ID or worker name.",
        },
        timeSlot: {
          type: "string",
          description: "Requested time slot (e.g., '10:00 AM', '04:00 PM').",
        },
      },
      required: ["workerId"],
    },
  },
};

/**
 * Validate and execute checkWorkerAvailability tool
 */
async function execute(args = {}) {
  const workerId = (args.workerId || "").trim();
  if (!workerId) {
    return { success: false, message: "Missing workerId parameter." };
  }

  const result = await checkWorkerAvailabilityService(workerId, args.timeSlot);
  return {
    success: result.success,
    toolName: "checkWorkerAvailability",
    available: result.available,
    workerName: result.workerName,
    etaMins: result.etaMins,
    timeSlot: result.timeSlot,
  };
}

module.exports = {
  definition,
  execute,
};

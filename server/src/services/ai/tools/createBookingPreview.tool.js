/**
 * Tool: createBookingPreview
 * Creates an explainable booking preview draft requiring explicit user confirmation before execution.
 */

const { createBookingPreviewService } = require("../../booking.service");

const definition = {
  type: "function",
  function: {
    name: "createBookingPreview",
    description:
      "Draft a transparent service booking summary with assigned worker, date, time, visiting fee, and location. This tool ONLY creates a preview draft and NEVER commits to the database.",
    parameters: {
      type: "object",
      properties: {
        workerId: {
          type: "string",
          description: "Worker ID or worker name to book.",
        },
        serviceType: {
          type: "string",
          description: "Service requirement description (e.g. 'AC Repair & Jet Pump Service', 'Plumbing Inspection').",
        },
        date: {
          type: "string",
          description: "Booking date (e.g., 'Tomorrow', 'Friday', '2026-09-05').",
        },
        time: {
          type: "string",
          description: "Booking time slot (e.g., '10:00 AM', '04:00 PM').",
        },
        location: {
          type: "string",
          description: "Service address or sector (e.g., 'Sector 17, Chandigarh').",
        },
      },
      required: ["workerId"],
    },
  },
};

/**
 * Validate and execute createBookingPreview tool
 */
async function execute(args = {}, userContext = {}) {
  const workerId = (args.workerId || "").trim();
  if (!workerId) {
    return {
      success: false,
      message: "Please specify which worker you would like to book.",
    };
  }

  const result = await createBookingPreviewService({
    workerId,
    serviceType: args.serviceType,
    date: args.date || "Tomorrow",
    time: args.time || "10:00 AM",
    location: args.location || userContext.location || userContext.locationName || "Sector 17, Chandigarh",
    clientName: userContext.clientName || "Skill-Link Member",
    clientPhone: userContext.clientPhone || "+91 98765 43210",
  });

  if (!result.success || !result.preview) {
    return {
      success: false,
      message: result.message || `Unable to prepare booking preview for worker #${workerId}.`,
    };
  }

  return {
    success: true,
    toolName: "createBookingPreview",
    requiresConfirmation: true,
    preview: result.preview,
    richPayload: {
      type: "booking_preview",
      bookingPreview: result.preview,
    },
  };
}

module.exports = {
  definition,
  execute,
};

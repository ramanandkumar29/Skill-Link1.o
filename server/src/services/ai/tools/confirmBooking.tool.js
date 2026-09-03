/**
 * Tool: confirmBooking
 * Executes final validation and creates the confirmed booking in the Skill-Link database.
 */

const { createBookingService } = require("../../booking.service");

const definition = {
  type: "function",
  function: {
    name: "confirmBooking",
    description:
      "Confirm and finalize an in-flight booking draft in the Skill-Link database. Call this ONLY after the user has explicitly confirmed.",
    parameters: {
      type: "object",
      properties: {
        workerId: {
          type: "string",
          description: "Worker ID to book.",
        },
        serviceType: {
          type: "string",
          description: "Service type/trade description.",
        },
        date: {
          type: "string",
          description: "Service date.",
        },
        time: {
          type: "string",
          description: "Service time slot.",
        },
        location: {
          type: "string",
          description: "Doorstep service location.",
        },
      },
      required: ["workerId"],
    },
  },
};

/**
 * Validate and execute confirmBooking tool
 */
async function execute(args = {}, userContext = {}) {
  const workerId = (args.workerId || "").trim();
  if (!workerId) {
    return {
      success: false,
      message: "Cannot confirm booking without a valid workerId.",
    };
  }

  const result = await createBookingService({
    workerId,
    serviceType: args.serviceType || "Home Service Inspection",
    date: args.date || new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    time: args.time || "10:00 AM",
    location: args.location || userContext.location || userContext.locationName || "Sector 17, Chandigarh",
    clientName: userContext.clientName || "Skill-Link Member",
    clientPhone: userContext.clientPhone || "+91 98765 43210",
  });

  if (!result.success || !result.booking) {
    return {
      success: false,
      message: result.message || "Failed to confirm booking due to a database issue.",
    };
  }

  const b = result.booking;
  const formattedBooking = {
    bookingId: b.bookingId || "BK-NEW",
    workerName: b.workerName,
    serviceType: b.serviceType,
    status: b.status || "Confirmed",
    date: `${b.bookingDate} at ${b.bookingTime}`,
    totalEstimate: b.visitFeeAmount || 149,
    otpSecret: b.otpSecret || "492018",
    customerPhone: b.clientPhone,
  };

  return {
    success: true,
    toolName: "confirmBooking",
    booking: formattedBooking,
    message: result.message,
    richPayload: {
      type: "booking",
      booking: formattedBooking,
    },
  };
}

module.exports = {
  definition,
  execute,
};

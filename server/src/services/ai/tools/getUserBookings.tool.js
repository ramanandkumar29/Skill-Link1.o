/**
 * Tool: getUserBookings
 * Schema and validator for fetching user's active and past bookings.
 */

const { getAllBookingsService } = require("../../booking.service");

const definition = {
  type: "function",
  function: {
    name: "getUserBookings",
    description:
      "Retrieve the client's current active, confirmed, in-progress, or past service bookings, including booking IDs, assigned workers, and status.",
    parameters: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["Confirmed", "Pending", "In-Progress", "Completed", "Cancelled", "All"],
          description: "Optional booking status filter.",
        },
      },
    },
  },
};

/**
 * Validate and execute getUserBookings tool
 */
async function execute(args = {}) {
  const allBookings = await getAllBookingsService();
  const statusFilter = args.status && args.status !== "All" ? args.status.toLowerCase() : null;

  let filtered = allBookings;
  if (statusFilter) {
    filtered = allBookings.filter((b) => (b.status || "").toLowerCase() === statusFilter);
  }

  const formattedBookings = filtered.map((b) => ({
    bookingId: b.bookingId || b.id || "BK-DEMO",
    workerName: b.workerName || "Verified Professional",
    serviceType: b.serviceType || "Home Service Inspection",
    status: b.status || "Confirmed",
    date: b.bookingDate || b.createdAt || "Recent",
    totalEstimate: b.visitFeeAmount || 149,
    otpSecret: b.otpSecret || "492018",
  }));

  const primaryBooking = formattedBookings.length > 0 ? formattedBookings[0] : null;

  return {
    success: true,
    toolName: "getUserBookings",
    count: formattedBookings.length,
    bookings: formattedBookings,
    richPayload: primaryBooking
      ? {
          type: "booking",
          booking: primaryBooking,
        }
      : undefined,
  };
}

module.exports = {
  definition,
  execute,
};

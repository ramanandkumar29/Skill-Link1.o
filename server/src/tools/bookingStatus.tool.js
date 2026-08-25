const { getBookingStatusService } = require("../services/booking.service");

const bookingStatusTool = {
  definition: {
    type: "function",
    function: {
      name: "getBookingStatus",
      description: "Retrieve real-time tracking status, worker assignment, and ETA of an existing booking ID.",
      parameters: {
        type: "object",
        properties: {
          bookingId: { type: "string", description: "Booking ID (e.g. BK-1001)" }
        },
        required: ["bookingId"]
      }
    }
  },
  execute: async (args) => {
    return await getBookingStatusService(args.bookingId);
  }
};

module.exports = bookingStatusTool;

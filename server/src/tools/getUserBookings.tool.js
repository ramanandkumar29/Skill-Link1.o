const { getAllBookingsService } = require("../services/booking.service");

const getUserBookingsTool = {
  definition: {
    type: "function",
    function: {
      name: "getUserBookings",
      description: "Retrieve all past and active bookings made by a user.",
      parameters: {
        type: "object",
        properties: {
          userId: { type: "string", description: "User ID or phone number" }
        }
      }
    }
  },
  execute: async (args = {}) => {
    const all = await getAllBookingsService();
    return {
      success: true,
      count: all.length,
      bookings: all
    };
  }
};

module.exports = getUserBookingsTool;

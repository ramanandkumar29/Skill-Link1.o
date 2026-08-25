const { createBookingService } = require("../services/booking.service");

const bookingTool = {
  definition: {
    type: "function",
    function: {
      name: "createBooking",
      description: "Create and confirm a verified booking for a client with a skilled worker.",
      parameters: {
        type: "object",
        properties: {
          workerId: { type: "string", description: "Worker ID" },
          clientName: { type: "string", description: "Client full name" },
          clientPhone: { type: "string", description: "Client phone" },
          serviceType: { type: "string", description: "Service type" },
          location: { type: "string", description: "Service location" },
          isEmergency: { type: "boolean", description: "Emergency flag" },
          paymentMethod: { type: "string", enum: ["UPI", "CASH", "CARD"], description: "Payment method" }
        },
        required: ["workerId", "serviceType"]
      }
    }
  },
  execute: async (args) => {
    return await createBookingService(args);
  }
};

module.exports = bookingTool;

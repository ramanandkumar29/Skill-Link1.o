const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    bookingId: { type: String, required: true, unique: true },
    workerId: { type: String, required: true },
    workerName: { type: String, required: true },
    occupation: { type: String, required: true },
    clientName: { type: String, required: true },
    clientPhone: { type: String, required: true },
    serviceType: { type: String, required: true },
    location: { type: String, required: true },
    bookingDate: { type: String, default: () => new Date().toLocaleDateString() },
    bookingTime: { type: String, default: "10:00 AM" },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "In-Progress", "Completed", "Cancelled"],
      default: "Confirmed",
    },
    visitFeeAmount: { type: Number, default: 149 },
    visitFeePaid: { type: Boolean, default: true },
    emergencySos: { type: Boolean, default: false },
    paymentMethod: { type: String, default: "UPI" },
    otpSecret: { type: String, default: () => Math.floor(100000 + Math.random() * 900000).toString() },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);

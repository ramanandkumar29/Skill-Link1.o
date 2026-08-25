const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    reviewId: { type: String, required: true, unique: true },
    bookingId: { type: String, required: true },
    workerId: { type: String, required: true },
    userId: { type: String, required: true },
    userName: { type: String, default: "Verified Customer" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    verifiedService: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Review || mongoose.model("Review", reviewSchema);

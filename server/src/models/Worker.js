const mongoose = require("mongoose");

const workerSchema = new mongoose.Schema(
  {
    workerId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    occupation: { type: String, required: true },
    category: { type: String, required: true },
    phone: { type: String, required: true },
    rating: { type: Number, default: 4.8 },
    reviewsCount: { type: Number, default: 40 },
    jobsCompleted: { type: Number, default: 50 },
    trustScore: { type: Number, default: 95 },
    experience: { type: String, default: "5+ years" },
    location: { type: String, required: true },
    visitingFee: { type: Number, default: 149 },
    hourlyRate: { type: Number, default: 349 },
    isOnline: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: true },
    skills: [{ type: String }],
    emergencySupported: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Worker || mongoose.model("Worker", workerSchema);

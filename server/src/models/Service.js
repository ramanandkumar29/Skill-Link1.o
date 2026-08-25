const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    serviceId: { type: String, required: true, unique: true },
    categoryId: { type: String, required: true },
    name: { type: String, required: true },
    nameHi: { type: String },
    description: { type: String },
    keywords: [{ type: String }],
    baseVisitFee: { type: Number, default: 149 },
    estimatedLaborFee: { type: Number, default: 299 },
    emergencySupported: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Service || mongoose.model("Service", serviceSchema);

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String },
    location: { type: String, default: "Chandigarh" },
    savedAddresses: [{ label: String, address: String }],
    emergencyContacts: [{ name: String, phone: String }]
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);

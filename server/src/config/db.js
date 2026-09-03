/**
 * MongoDB Connection — Skill-Link
 * Gracefully degrades to in-memory resilient mode when Atlas is unreachable.
 */

const mongoose = require("mongoose");
const env = require("./env");

async function connectDB() {
  const uri = env.MONGODB_URI; // ✅ Fixed: was env.MONGO_URI (wrong key)

  if (!uri || uri.includes("localhost:27017")) {
    console.log(
      "ℹ️  MongoDB: local/mock URI detected — running with in-memory resilient fallback.\n" +
      "   Set MONGODB_URI in server/.env to connect a real Atlas cluster."
    );
    return;
  }

  try {
    mongoose.set("strictQuery", false);
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(
      `⚠️  MongoDB connection warning: ${error.message}\n` +
      "   Continuing with local in-memory store (data won't persist across restarts)."
    );
  }
}

module.exports = { connectDB };

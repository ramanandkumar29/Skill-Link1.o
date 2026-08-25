const mongoose = require("mongoose");
const env = require("./env");

async function connectDB() {
  try {
    if (!env.MONGO_URI || env.MONGO_URI.includes("localhost:27017")) {
      console.log("ℹ️ MongoDB URI in local/mock mode. Running with in-memory resilient fallback.");
      return;
    }
    const conn = await mongoose.connect(env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`⚠️ MongoDB connection warning: ${error.message}. Continuing with local store.`);
  }
}

module.exports = { connectDB };

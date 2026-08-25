/**
 * Skill-Link Database Seeder Script
 * Upserts services, worker test profiles, and knowledge chunks into MongoDB & Vector Store safely without overwriting production data.
 */

const mongoose = require("mongoose");
const env = require("../config/env");
const { connectDB } = require("../config/db");
const { ingestAll } = require("../rag/ingest");

// Seed Data
const { SEEDED_SERVICES } = require("../seed/services.seed");
const { SEEDED_DEV_WORKERS } = require("../seed/workers.seed");
const { SEEDED_FAQS } = require("../seed/faq.seed");

// Models
const Service = require("../models/Service");
const Worker = require("../models/Worker");

async function seedDatabase() {
  console.log("🌱 Starting Skill-Link Comprehensive Data Seeding...");

  // 1. Connect MongoDB
  await connectDB();

  // 2. Upsert Services into MongoDB
  if (mongoose.connection.readyState === 1) {
    console.log(`📦 Seeding ${SEEDED_SERVICES.length} structured services into MongoDB...`);
    for (const s of SEEDED_SERVICES) {
      await Service.findOneAndUpdate(
        { serviceId: s.serviceId },
        { $set: s },
        { upsert: true, new: true }
      );
    }
    console.log("✅ Services upserted successfully.");

    // 3. Upsert Development / Test Workers
    console.log(`👷 Seeding ${SEEDED_DEV_WORKERS.length} development worker profiles...`);
    for (const w of SEEDED_DEV_WORKERS) {
      await Worker.findOneAndUpdate(
        { workerId: w.workerId },
        { $set: w },
        { upsert: true, new: true }
      );
    }
    console.log("✅ Development workers upserted successfully.");
  } else {
    console.log("ℹ️ MongoDB running in local in-memory store mode. Seed data ready in memory.");
  }

  // 4. Ingest All RAG Markdown Knowledge Documents into Vector Store
  console.log("📚 Ingesting Markdown Knowledge Base into Vector Store...");
  ingestAll();

  console.log("🎉 Seeding completed successfully!");
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Seeding failed:", err);
      process.exit(1);
    });
}

module.exports = { seedDatabase };

const app = require("./src/app");
const env = require("./src/config/env");
const { connectDB } = require("./src/config/db");
const { ingestAll } = require("./src/rag/ingest");

async function startServer() {
  // Connect MongoDB
  await connectDB();

  // Ingest RAG documents
  ingestAll();

  // Start Express listener
  app.listen(env.PORT, () => {
    console.log(`🚀 Skill-Link Express AI Backend running on port ${env.PORT} [${env.NODE_ENV}]`);
    console.log(`📡 OpenRouter Model: ${env.OPENROUTER_MODEL}`);
  });
}

startServer();

const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  
  // Database
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/skilllink",
  
  // AI Provider & Model Configuration
  AI_PROVIDER: process.env.AI_PROVIDER || "openrouter", // "openrouter" | "gemini" | "groq"
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || "",
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || "openrouter/free",
  
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-1.5-flash",
  
  GROQ_API_KEY: process.env.GROQ_API_KEY || "",
  GROQ_MODEL: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
  
  // Vector DB & Embeddings
  EMBEDDING_PROVIDER: process.env.EMBEDDING_PROVIDER || "local", // "gemini" | "openrouter" | "local"
  QDRANT_URL: process.env.QDRANT_URL || "",
  QDRANT_API_KEY: process.env.QDRANT_API_KEY || ""
};

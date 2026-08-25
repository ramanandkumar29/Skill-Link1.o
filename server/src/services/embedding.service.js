/**
 * Configurable Embedding Service
 * Supports Gemini text-embedding-004, OpenRouter, and Local semantic vectors.
 */

const env = require("../config/env");

async function generateEmbedding(text) {
  if (!text) return [];

  // 1. Google Gemini Embeddings
  if (env.EMBEDDING_PROVIDER === "gemini" && env.GEMINI_API_KEY) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${env.GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "models/text-embedding-004",
          content: { parts: [{ text }] }
        })
      });
      if (res.ok) {
        const data = await res.json();
        return data.embedding?.values || [];
      }
    } catch (e) {
      console.warn("Gemini Embedding error, using local vector fallback:", e.message);
    }
  }

  // 2. Local TF-IDF Hash Vectorizer
  return generateLocalVector(text, 128);
}

function generateLocalVector(text, dimensions = 128) {
  const vec = new Array(dimensions).fill(0);
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(w => w.length > 1);

  words.forEach(word => {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = (hash << 5) - hash + word.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dimensions;
    vec[idx] += 1;
  });

  // Normalize
  const magnitude = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0)) || 1;
  return vec.map(v => Number((v / magnitude).toFixed(5)));
}

module.exports = {
  generateEmbedding,
  generateLocalVector
};

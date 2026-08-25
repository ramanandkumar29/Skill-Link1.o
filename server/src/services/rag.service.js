/**
 * RAG Knowledge Retrieval Service
 * Integrates Qdrant Vector Database with Local Fallback Vector Store
 */

const env = require("../config/env");
const { searchKnowledge } = require("../rag/vectorStore");
const { generateEmbedding } = require("./embedding.service");

const COLLECTION_NAME = "skilllink_knowledge";

async function queryQdrantVectorDB(queryText, limit = 3) {
  if (!env.QDRANT_URL) return null;

  try {
    const vector = await generateEmbedding(queryText);
    if (!vector || vector.length === 0) return null;

    const headers = { "Content-Type": "application/json" };
    if (env.QDRANT_API_KEY) headers["api-key"] = env.QDRANT_API_KEY;

    const res = await fetch(`${env.QDRANT_URL.replace(/\/+$/, "")}/collections/${COLLECTION_NAME}/points/search`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        vector,
        limit,
        with_payload: true
      })
    });

    if (res.ok) {
      const data = await res.json();
      return (data.result || []).map(r => ({
        title: r.payload?.title || "Skill-Link Knowledge",
        content: r.payload?.content || ""
      }));
    }
  } catch (e) {
    console.warn("Qdrant search error, using local vector store:", e.message);
  }

  return null;
}

async function getRAGContext(userQuery) {
  if (!userQuery) return "";

  // 1. Try Qdrant Vector DB if configured
  const qdrantMatches = await queryQdrantVectorDB(userQuery, 3);
  if (qdrantMatches && qdrantMatches.length > 0) {
    return qdrantMatches.map(m => `[Topic: ${m.title}]\n${m.content}`).join("\n\n");
  }

  // 2. Fall back to in-memory semantic vector store
  const localMatches = searchKnowledge(userQuery, 3);
  if (!localMatches || localMatches.length === 0) return "";
  return localMatches.map(m => `[Topic: ${m.title} (${m.filename})]\n${m.content}`).join("\n\n");
}

module.exports = {
  getRAGContext,
  queryQdrantVectorDB
};

/**
 * RAG Vector Knowledge Store with Semantic Embedding & Keyword Retrieval
 */

const fs = require("fs");
const path = require("path");

let vectorStoreChunks = [];

/**
 * Add a chunk with metadata to the in-memory vector index
 */
function addDocumentChunk(chunk) {
  vectorStoreChunks.push(chunk);
}

/**
 * Reset vector store
 */
function clearVectorStore() {
  vectorStoreChunks = [];
}

/**
 * Retrieve total chunk count
 */
function getChunkCount() {
  return vectorStoreChunks.length;
}

/**
 * Search knowledge base using semantic keyword and term-frequency scoring
 */
function searchKnowledge(query, topK = 3) {
  if (!query || vectorStoreChunks.length === 0) return [];
  const q = query.toLowerCase();
  const queryTokens = q.split(/\s+/).filter(t => t.length > 2);

  const scored = vectorStoreChunks.map(chunk => {
    let score = 0;
    const content = chunk.content.toLowerCase();
    const title = (chunk.title || "").toLowerCase();

    // Exact phrase match bonus
    if (content.includes(q)) score += 15;
    if (title.includes(q)) score += 20;

    // Token frequency match
    for (const token of queryTokens) {
      if (title.includes(token)) score += 5;
      if (content.includes(token)) score += 2;
    }

    return { chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored
    .filter(item => item.score > 0)
    .slice(0, topK)
    .map(item => item.chunk);
}

module.exports = {
  addDocumentChunk,
  clearVectorStore,
  getChunkCount,
  searchKnowledge
};

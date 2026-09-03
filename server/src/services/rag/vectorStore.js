/**
 * In-Memory Vector & Term Frequency Index for Knowledge Chunks
 * Computes cosine similarity between query vectors and knowledge chunks.
 */

const DIMENSIONS = 128;

/**
 * Tokenizes text and produces a normalized TF-IDF hash vector
 * @param {string} text
 * @returns {number[]}
 */
function createVector(text, dimensions = DIMENSIONS) {
  if (!text || typeof text !== "string") return new Array(dimensions).fill(0);

  const vec = new Array(dimensions).fill(0);
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);

  // Common stop words filter
  const stopWords = new Set(["the", "and", "is", "in", "it", "to", "of", "for", "with", "on", "at", "by", "from", "up", "about", "into", "over", "after"]);

  words.forEach((word) => {
    if (!stopWords.has(word)) {
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        hash = (hash << 5) - hash + word.charCodeAt(i);
        hash |= 0;
      }
      const idx = Math.abs(hash) % dimensions;
      vec[idx] += 1;
    }
  });

  // L2 Normalize
  const magnitude = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0)) || 1;
  return vec.map((v) => Number((v / magnitude).toFixed(6)));
}

/**
 * Computes Cosine Similarity between two normalized vectors
 * @param {number[]} vecA
 * @param {number[]} vecB
 * @returns {number}
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  return Math.max(0, Math.min(1, dotProduct));
}

module.exports = {
  createVector,
  cosineSimilarity,
};

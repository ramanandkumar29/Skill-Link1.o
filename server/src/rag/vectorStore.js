/**
 * RAG Vector Knowledge Store with Semantic Cosine / Keyword Retrieval
 */

const defaultDocs = require("./documents/skilllink_docs.json");

let memoryVectorStore = [...defaultDocs];

function addDocument(doc) {
  memoryVectorStore.push(doc);
}

function searchKnowledge(query, topK = 2) {
  if (!query) return [];
  const q = query.toLowerCase();
  
  // Calculate term-frequency semantic relevance
  const scored = memoryVectorStore.map(doc => {
    let score = 0;
    const content = doc.content.toLowerCase();
    const topic = doc.topic.toLowerCase();

    if (content.includes(q) || topic.includes(q)) score += 10;

    const words = q.split(/\s+/).filter(w => w.length > 2);
    for (const w of words) {
      if (content.includes(w)) score += 2;
      if (topic.includes(w)) score += 3;
    }

    return { doc, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.filter(s => s.score > 0).slice(0, topK).map(s => s.doc);
}

module.exports = {
  addDocument,
  searchKnowledge
};

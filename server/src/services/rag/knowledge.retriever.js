/**
 * Knowledge Retriever — Skill-Link RAG Pipeline
 * Ingests markdown documents and retrieves relevant factual context for Lexi AI.
 */

const fs = require("fs");
const path = require("path");
const { createVector, cosineSimilarity } = require("./vectorStore");

const DOCUMENTS_DIR = path.join(__dirname, "documents");

let indexedChunks = [];
let isInitialized = false;

/**
 * Splits a markdown document into logical chunks based on headers (## or ###)
 */
function chunkMarkdownDocument(filename, rawText) {
  const chunks = [];
  const lines = rawText.split("\n");

  let docTitle = filename.replace(/^\d+_/, "").replace(/\.md$/i, "").replace(/_/g, " ");
  let sectionTitle = docTitle;
  let currentBuffer = [];

  for (const line of lines) {
    if (line.startsWith("# ") || line.startsWith("## ") || line.startsWith("### ")) {
      if (currentBuffer.length > 0) {
        const textContent = currentBuffer.join("\n").trim();
        if (textContent.length > 30) {
          chunks.push({
            id: `${filename}_chunk_${chunks.length + 1}`,
            filename,
            docTitle,
            sectionTitle,
            content: textContent,
            vector: createVector(`${docTitle} ${sectionTitle} ${textContent}`),
          });
        }
        currentBuffer = [];
      }
      sectionTitle = line.replace(/^#+\s*/, "").trim();
    } else {
      currentBuffer.push(line);
    }
  }

  if (currentBuffer.length > 0) {
    const textContent = currentBuffer.join("\n").trim();
    if (textContent.length > 30) {
      chunks.push({
        id: `${filename}_chunk_${chunks.length + 1}`,
        filename,
        docTitle,
        sectionTitle,
        content: textContent,
        vector: createVector(`${docTitle} ${sectionTitle} ${textContent}`),
      });
    }
  }

  return chunks;
}

/**
 * Loads and indexes all knowledge documents into memory
 */
function initializeKnowledgeBase() {
  if (!fs.existsSync(DOCUMENTS_DIR)) {
    console.warn(`[RAG Engine] Documents directory not found at: ${DOCUMENTS_DIR}`);
    indexedChunks = [];
    return;
  }

  const files = fs.readdirSync(DOCUMENTS_DIR).filter((f) => f.endsWith(".md"));
  const allChunks = [];

  for (const file of files) {
    try {
      const filePath = path.join(DOCUMENTS_DIR, file);
      const rawText = fs.readFileSync(filePath, "utf-8");
      const fileChunks = chunkMarkdownDocument(file, rawText);
      allChunks.push(...fileChunks);
    } catch (err) {
      console.warn(`[RAG Engine] Error reading ${file}:`, err.message);
    }
  }

  indexedChunks = allChunks;
  isInitialized = true;
  console.log(`[RAG Engine] Successfully indexed ${files.length} knowledge docs into ${indexedChunks.length} chunks.`);
}

/**
 * Search the indexed knowledge base for top matching chunks
 * @param {string} query
 * @param {number} topK
 * @param {number} minThreshold
 * @returns {Array<{ title: string, content: string, score: number }>}
 */
function searchKnowledge(query, topK = 2, minThreshold = 0.12) {
  if (!isInitialized || indexedChunks.length === 0) {
    initializeKnowledgeBase();
  }

  if (!query || typeof query !== "string") return [];

  const queryVector = createVector(query);
  const scoredChunks = [];

  for (const chunk of indexedChunks) {
    const similarity = cosineSimilarity(queryVector, chunk.vector);

    // Exact keyword boost (e.g. "cancellation", "sos", "plumber", "visiting fee", "otp", "rework", "aadhaar")
    let boost = 0;
    const lowerQuery = query.toLowerCase();
    const lowerContent = chunk.content.toLowerCase();
    const lowerTitle = chunk.sectionTitle.toLowerCase();

    const queryWords = lowerQuery.split(/\s+/).filter((w) => w.length > 3);
    for (const word of queryWords) {
      if (lowerTitle.includes(word)) boost += 0.15;
      if (lowerContent.includes(word)) boost += 0.05;
    }

    const finalScore = similarity + boost;

    if (finalScore >= minThreshold) {
      scoredChunks.push({
        title: `${chunk.docTitle} → ${chunk.sectionTitle}`,
        content: chunk.content,
        score: finalScore,
      });
    }
  }

  // Sort descending by score
  scoredChunks.sort((a, b) => b.score - a.score);

  return scoredChunks.slice(0, topK);
}

/**
 * Formats retrieved chunks into a prompt-ready markdown block
 * @param {string} query
 * @returns {string}
 */
function getKnowledgeContext(query) {
  const matches = searchKnowledge(query, 2, 0.12);

  if (!matches || matches.length === 0) {
    return "";
  }

  const formattedBlocks = matches.map(
    (m, idx) => `### [Source ${idx + 1}: ${m.title}]\n${m.content}`
  );

  return `\n━━ SKILL-LINK VERIFIED KNOWLEDGE BASE (GROUND TRUTH) ━━\nUse ONLY the following factual information to answer platform questions. If specific information is missing, state clearly that it is not available.\n\n${formattedBlocks.join(
    "\n\n"
  )}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
}

module.exports = {
  initializeKnowledgeBase,
  searchKnowledge,
  getKnowledgeContext,
};

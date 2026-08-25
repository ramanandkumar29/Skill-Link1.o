/**
 * RAG Document Ingestion & Chunking Pipeline
 * Reads all .md files in server/src/rag/documents/ and splits into chunks for Vector Retrieval.
 */

const fs = require("fs");
const path = require("path");
const { addDocumentChunk, clearVectorStore, getChunkCount } = require("./vectorStore");

const DOCUMENTS_DIR = path.join(__dirname, "documents");

/**
 * Splits a markdown document by headers (##) or major paragraphs into searchable chunks
 */
function chunkMarkdown(filename, text) {
  const chunks = [];
  const lines = text.split("\n");

  let currentTitle = filename.replace(/\.md$/i, "").replace(/-/g, " ");
  let currentBuffer = [];

  for (const line of lines) {
    if (line.startsWith("# ") || line.startsWith("## ")) {
      if (currentBuffer.length > 0) {
        chunks.push({
          id: `${filename}_chunk_${chunks.length + 1}`,
          filename,
          title: currentTitle,
          content: currentBuffer.join("\n").trim()
        });
        currentBuffer = [];
      }
      currentTitle = line.replace(/^#+\s*/, "").trim();
    } else {
      currentBuffer.push(line);
    }
  }

  if (currentBuffer.length > 0) {
    chunks.push({
      id: `${filename}_chunk_${chunks.length + 1}`,
      filename,
      title: currentTitle,
      content: currentBuffer.join("\n").trim()
    });
  }

  return chunks;
}

/**
 * Ingest all documents from DOCUMENTS_DIR
 */
function ingestAll() {
  clearVectorStore();

  if (!fs.existsSync(DOCUMENTS_DIR)) {
    console.warn(`⚠️ Documents directory not found: ${DOCUMENTS_DIR}`);
    return;
  }

  const files = fs.readdirSync(DOCUMENTS_DIR).filter(f => f.endsWith(".md"));
  let totalChunks = 0;

  for (const file of files) {
    const filePath = path.join(DOCUMENTS_DIR, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const chunks = chunkMarkdown(file, content);

    chunks.forEach(chunk => {
      if (chunk.content.length > 20) {
        addDocumentChunk(chunk);
        totalChunks++;
      }
    });
  }

  console.log(`✅ Ingestion Complete: Indexed ${files.length} documents into ${totalChunks} searchable vector chunks.`);
}

if (require.main === module) {
  ingestAll();
}

module.exports = { ingestAll };

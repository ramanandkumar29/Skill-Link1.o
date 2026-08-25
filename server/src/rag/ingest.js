/**
 * RAG Document Ingestion Pipeline
 */

const { addDocument } = require("./vectorStore");
const docs = require("./documents/skilllink_docs.json");

function ingestAll() {
  console.log(`📥 Ingesting ${docs.length} knowledge base documents into Vector Store...`);
  docs.forEach(doc => addDocument(doc));
  console.log("✅ Ingestion complete.");
}

if (require.main === module) {
  ingestAll();
}

module.exports = { ingestAll };

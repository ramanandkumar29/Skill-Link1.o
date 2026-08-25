const { searchKnowledge } = require("../rag/vectorStore");

function getRAGContext(userQuery) {
  const matches = searchKnowledge(userQuery, 2);
  if (!matches || matches.length === 0) return "";
  return matches.map(m => `[Topic: ${m.topic}]\n${m.content}`).join("\n\n");
}

module.exports = { getRAGContext };

/**
 * Skill-Link RAG Knowledge System
 */

const {
  initializeKnowledgeBase,
  searchKnowledge,
  getKnowledgeContext,
} = require("./knowledge.retriever");

module.exports = {
  initializeKnowledgeBase,
  searchKnowledge,
  getKnowledgeContext,
};

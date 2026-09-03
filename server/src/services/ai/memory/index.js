/**
 * Lexi AI Layered Memory & Context Subsystem
 */

const config = require("./config");
const structuredState = require("./structuredState");
const summarizer = require("./summarizer");
const contextBuilder = require("./contextBuilder");

module.exports = {
  ...config,
  ...structuredState,
  ...summarizer,
  ...contextBuilder,
};

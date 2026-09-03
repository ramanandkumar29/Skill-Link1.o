/**
 * Lexi AI API Routes
 */

const express = require("express");
const router = express.Router();
const { chatHandler, clearHandler } = require("../controllers/lexi.controller");

// POST /api/lexi/chat
router.post("/chat", chatHandler);

// POST /api/lexi/clear
router.post("/clear", clearHandler);

module.exports = router;

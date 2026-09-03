/**
 * SOS Routes — Skill-Link Emergency Dispatch API
 */

const express = require("express");
const router  = express.Router();
const {
  triggerSOSHandler,
  smsWebhookHandler,
  getSOSStatusHandler,
  acceptSOSHandler,
} = require("../controllers/sos.controller");

// POST /api/sos/trigger — online SOS (requires active internet)
router.post("/trigger", triggerSOSHandler);

// POST /api/sos/sms-webhook — offline SMS ingestion (no JWT, signed by phone match)
// Registered before JWT middleware in app.js intentionally
router.post("/sms-webhook", smsWebhookHandler);

// GET /api/sos/:bookingId/status — poll current dispatch status
router.get("/:bookingId/status", getSOSStatusHandler);

// POST /api/sos/:bookingId/accept — worker accepts the SOS job
router.post("/:bookingId/accept", acceptSOSHandler);

module.exports = router;

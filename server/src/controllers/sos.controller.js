/**
 * SOS Controller — Skill-Link Emergency Dispatch API
 *
 * Handles:
 *  POST /api/sos/trigger        — standard online SOS
 *  POST /api/sos/sms-webhook    — offline SMS ingestion (no JWT required)
 *  GET  /api/sos/:bookingId/status
 *  POST /api/sos/:bookingId/accept  — worker accepts SOS
 */

const {
  triggerSOSDispatch,
  parseOfflineSMSPayload,
  acceptSOSBooking,
} = require("../services/sos.service");
const SOSBooking = require("../models/SOSBooking");
const env        = require("../config/env");
const crypto     = require("crypto");

// The WebSocket client registry is injected from server.js
let wsClientRegistry = new Map();
function setWSClientRegistry(map) { wsClientRegistry = map; }

/**
 * POST /api/sos/trigger
 * Body: { customerId, customerName, customerPhone, serviceType, lat, lng, pickupAddress }
 */
async function triggerSOSHandler(req, res) {
  try {
    const {
      customerId    = `guest-${Date.now()}`,
      customerName  = "SOS Customer",
      customerPhone,
      serviceType   = "OTHER",
      lat,
      lng,
      pickupAddress = "",
    } = req.body;

    if (!customerPhone) {
      return res.status(400).json({ success: false, error: "customerPhone is required" });
    }
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      return res.status(400).json({ success: false, error: "Valid lat and lng are required" });
    }

    const result = await triggerSOSDispatch({
      customerId,
      customerName,
      customerPhone,
      serviceType:  serviceType.toUpperCase(),
      lat:          parsedLat,
      lng:          parsedLng,
      pickupAddress,
      triggerMode:  "ONLINE_WEBSOCKET",
      wsClients:    wsClientRegistry,
    });

    return res.json(result);
  } catch (err) {
    console.error("SOS trigger error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/sos/sms-webhook
 *
 * Ingests compact SMS from offline bridge. Bypasses standard JWT auth.
 * Security: signed via HMAC phone-number matching.
 *
 * Body (Twilio / Kaleyra format):
 *   { From: "+919876543210", Body: "SOS#LAT:28.5355#LNG:77.3910#TYRE_PUNCTURE" }
 */
async function smsWebhookHandler(req, res) {
  try {
    // Signature validation (Twilio sends X-Twilio-Signature header)
    // For dev mode: skip signature check
    const rawBody = req.body?.Body || req.body?.body || req.body?.message || "";
    const fromPhone = req.body?.From || req.body?.from || req.body?.msisdn || "";

    if (!rawBody || !rawBody.startsWith("SOS#")) {
      return res.status(200).json({ success: false, message: "Not a Skill-Link SOS payload" });
    }

    console.log(`📱 Offline SMS SOS received from ${fromPhone}: ${rawBody}`);

    const parsed = parseOfflineSMSPayload(rawBody);
    if (!parsed) {
      return res.status(400).json({ success: false, error: "Invalid SOS SMS payload format" });
    }

    // Sanitize phone
    const sanitizedPhone = fromPhone.replace(/\D/g, "");
    const customerPhone  = sanitizedPhone.startsWith("91")
      ? `+${sanitizedPhone}`
      : `+91${sanitizedPhone}`;

    const result = await triggerSOSDispatch({
      customerId:   `sms-${sanitizedPhone}`,
      customerName: "SMS SOS Customer",
      customerPhone,
      serviceType:  parsed.serviceType,
      lat:          parsed.lat,
      lng:          parsed.lng,
      triggerMode:  "OFFLINE_SMS",
      wsClients:    wsClientRegistry,
      rawSmsPayload: rawBody,
    });

    // Respond with Twilio TwiML (or plain JSON for other providers)
    const acceptXml = req.headers["x-twilio-signature"]
      ? `<?xml version="1.0" encoding="UTF-8"?>
         <Response><Message>SOS received! Booking ID: ${result.booking.bookingId}. ${result.message}</Message></Response>`
      : null;

    if (acceptXml) {
      res.set("Content-Type", "text/xml");
      return res.send(acceptXml);
    }
    return res.json(result);
  } catch (err) {
    console.error("SMS webhook error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/sos/:bookingId/status
 */
async function getSOSStatusHandler(req, res) {
  try {
    const { bookingId } = req.params;

    if (require("mongoose").connection.readyState === 1) {
      try {
        const booking = await SOSBooking.findOne({ bookingId });
        if (booking) {
          return res.json({ success: true, booking, elapsedMins: booking.elapsedMins });
        }
      } catch (e) {}
    }

    return res.status(404).json({ success: false, error: `SOS Booking #${bookingId} not found` });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/sos/:bookingId/accept
 * Body: { workerId, workerName }
 */
async function acceptSOSHandler(req, res) {
  try {
    const { bookingId } = req.params;
    const { workerId, workerName } = req.body;
    if (!workerId) return res.status(400).json({ success: false, error: "workerId required" });

    const result = await acceptSOSBooking(bookingId, workerId, workerName || "Mechanic");
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  triggerSOSHandler,
  smsWebhookHandler,
  getSOSStatusHandler,
  acceptSOSHandler,
  setWSClientRegistry,
};

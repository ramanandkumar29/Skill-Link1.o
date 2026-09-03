const express = require("express");
const cors    = require("cors");
const http    = require("http");

const workerRoutes  = require("./routes/worker.routes");
const bookingRoutes = require("./routes/booking.routes");
const sosRoutes     = require("./routes/sos.routes");
const lexiRoutes    = require("./routes/lexi.routes");

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://skilllink.ai",
    /\.vercel\.app$/,
  ],
  credentials: true,
}));

// Raw body for SMS webhook HMAC verification (must come before express.json)
app.use("/api/sos/sms-webhook", express.raw({ type: "*/*" }));

// JSON body parser
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Request Logger (dev only) ─────────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  app.use((req, _res, next) => {
    console.log(`→ ${req.method} ${req.path}`);
    next();
  });
}

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/workers",  workerRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/sos",      sosRoutes);
app.use("/api/lexi",     lexiRoutes);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  const mongoose = require("mongoose");
  res.json({
    status:    "ok",
    service:   "Skill-Link Express Backend",
    timestamp: new Date().toISOString(),
    db:        mongoose.connection.readyState === 1 ? "connected" : "fallback",
    env:       process.env.NODE_ENV || "development",
  });
});

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("Unhandled server error:", err);
  res.status(500).json({ success: false, error: "Internal server error" });
});

function createServer() {
  return http.createServer(app);
}

module.exports = app;
module.exports.createServer = createServer;

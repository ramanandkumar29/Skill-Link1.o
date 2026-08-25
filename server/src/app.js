const express = require("express");
const cors = require("cors");

const lexiRoutes = require("./routes/lexi.routes");
const workerRoutes = require("./routes/worker.routes");
const bookingRoutes = require("./routes/booking.routes");

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/lexi", lexiRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/bookings", bookingRoutes);

// Health Check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Skill-Link Express AI Backend",
    timestamp: new Date().toISOString()
  });
});

module.exports = app;

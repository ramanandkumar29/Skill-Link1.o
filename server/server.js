/**
 * Skill-Link Express + WebSocket Server Entry Point
 *
 * Architecture:
 *  - HTTP/Express server handles REST API requests
 *  - ws WebSocket server shares the same HTTP port
 *  - wsClients Map tracks live worker socket connections
 *  - SOS controller injects wsClients for real-time dispatch pings
 */

const { createServer } = require("./src/app");
const env   = require("./src/config/env");
const { connectDB } = require("./src/config/db");

// WebSocket server (using built-in 'ws' module)
const { WebSocketServer } = require("ws");

// SOS controller needs the live WS client registry
const { setWSClientRegistry } = require("./src/controllers/sos.controller");

async function startServer() {
  // ── 1. Connect MongoDB ───────────────────────────────────────────────────
  await connectDB();

  // ── 2. Create HTTP server (wraps Express app) ────────────────────────────
  const server = createServer();

  // ── 3. Attach WebSocket server to same HTTP port ─────────────────────────
  const wss = new WebSocketServer({ server });

  /**
   * wsClients: Map<socketId, WebSocket>
   * Used by SOS dispatch to push real-time mechanic pings.
   */
  const wsClients = new Map();
  setWSClientRegistry(wsClients);

  wss.on("connection", (ws, req) => {
    const socketId = `ws-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    ws.socketId = socketId;
    wsClients.set(socketId, ws);

    console.log(`🔌 WS client connected: ${socketId} (total: ${wsClients.size})`);

    ws.send(JSON.stringify({
      event:      "CONNECTED",
      socketId,
      message:    "Skill-Link real-time SOS channel active.",
      serverTime: new Date().toISOString(),
    }));

    // ── Message handler ──────────────────────────────────────────────────────
    ws.on("message", async (rawData) => {
      try {
        const msg = JSON.parse(rawData.toString());

        switch (msg.event) {
          // Worker registers with their workerId so we can resolve pings
          case "WORKER_REGISTER": {
            ws.workerId = msg.workerId;
            wsClients.set(socketId, ws);
            try {
              const Worker = require("./src/models/Worker");
              await Worker.findOneAndUpdate(
                { workerId: msg.workerId },
                { currentSocketId: socketId, isOnline: true, isAvailable: true }
              );
            } catch (_) {}
            ws.send(JSON.stringify({ event: "REGISTERED", workerId: msg.workerId }));
            console.log(`👷 Worker registered: ${msg.workerId} → socket ${socketId}`);
            break;
          }

          // Worker accepts a SOS booking
          case "SOS_ACCEPT": {
            const { bookingId, workerId, workerName } = msg;
            const { acceptSOSBooking } = require("./src/services/sos.service");
            const result = await acceptSOSBooking(bookingId, workerId, workerName);
            ws.send(JSON.stringify({ event: "SOS_ACCEPTED", ...result }));
            console.log(`✅ SOS accepted: booking ${bookingId} by worker ${workerId}`);
            break;
          }

          // Worker live GPS update
          case "LOCATION_UPDATE": {
            const { workerId: wId, lat, lng } = msg;
            if (wId && lat && lng) {
              try {
                const Worker = require("./src/models/Worker");
                await Worker.findOneAndUpdate(
                  { workerId: wId },
                  { liveLocation: { type: "Point", coordinates: [lng, lat] } }
                );
              } catch (_) {}
            }
            break;
          }

          // Keepalive
          case "PING":
            ws.send(JSON.stringify({ event: "PONG", ts: Date.now() }));
            break;

          default:
            ws.send(JSON.stringify({ event: "ERROR", message: `Unknown event: ${msg.event}` }));
        }
      } catch (e) {
        ws.send(JSON.stringify({ event: "ERROR", message: "Invalid JSON payload" }));
      }
    });

    // ── Disconnect handler ───────────────────────────────────────────────────
    ws.on("close", async () => {
      wsClients.delete(socketId);
      console.log(`🔴 WS client disconnected: ${socketId} (total: ${wsClients.size})`);
      if (ws.workerId) {
        try {
          const Worker = require("./src/models/Worker");
          await Worker.findOneAndUpdate(
            { workerId: ws.workerId },
            { currentSocketId: null, isOnline: false, isAvailable: false }
          );
        } catch (_) {}
      }
    });

    ws.on("error", (err) => {
      console.warn(`WS error on ${socketId}:`, err.message);
      wsClients.delete(socketId);
    });
  });

  // ── 4. Start HTTP listener ────────────────────────────────────────────────
  server.listen(env.PORT, () => {
    console.log(`\n🚀 Skill-Link Backend ready on port ${env.PORT} [${env.NODE_ENV}]`);
    console.log(`   REST API   → http://localhost:${env.PORT}/api`);
    console.log(`   WebSocket  → ws://localhost:${env.PORT}`);
    console.log(`   Health     → http://localhost:${env.PORT}/health`);
    console.log(`   DB Mode    → ${env.MONGODB_URI.includes("localhost") ? "In-Memory Fallback" : "MongoDB Atlas"}\n`);
  });
}

startServer();

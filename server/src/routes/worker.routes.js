const express = require("express");
const {
  searchWorkersHandler,
  getWorkerDetailsHandler,
  getWorkerAvailabilityHandler
} = require("../controllers/worker.controller");

const router = express.Router();

router.get("/", searchWorkersHandler);
router.post("/search", searchWorkersHandler);
router.get("/:id", getWorkerDetailsHandler);
router.get("/:id/availability", getWorkerAvailabilityHandler);

module.exports = router;

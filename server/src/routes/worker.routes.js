const express = require("express");
const { searchWorkersHandler, getWorkerDetailsHandler } = require("../controllers/worker.controller");

const router = express.Router();

router.get("/", searchWorkersHandler);
router.get("/:id", getWorkerDetailsHandler);

module.exports = router;

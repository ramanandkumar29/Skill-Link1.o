const express = require("express");
const { createBookingHandler, getBookingStatusHandler, getAllBookingsHandler } = require("../controllers/booking.controller");

const router = express.Router();

router.get("/", getAllBookingsHandler);
router.post("/", createBookingHandler);
router.get("/:id", getBookingStatusHandler);

module.exports = router;

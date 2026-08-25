const express = require("express");
const {
  createBookingHandler,
  getBookingStatusHandler,
  cancelBookingHandler,
  getAllBookingsHandler
} = require("../controllers/booking.controller");

const router = express.Router();

router.get("/", getAllBookingsHandler);
router.post("/", createBookingHandler);
router.get("/:id", getBookingStatusHandler);
router.delete("/:id", cancelBookingHandler);

module.exports = router;

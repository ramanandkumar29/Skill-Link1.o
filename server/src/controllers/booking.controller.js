const {
  createBookingService,
  getBookingStatusService,
  cancelBookingService,
  getAllBookingsService
} = require("../services/booking.service");

async function createBookingHandler(req, res) {
  try {
    const result = await createBookingService(req.body);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function getBookingStatusHandler(req, res) {
  try {
    const { id } = req.params;
    const result = await getBookingStatusService(id);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function cancelBookingHandler(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const result = await cancelBookingService(id, reason);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function getAllBookingsHandler(req, res) {
  try {
    const result = await getAllBookingsService();
    return res.json({ success: true, count: result.length, bookings: result });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  createBookingHandler,
  getBookingStatusHandler,
  cancelBookingHandler,
  getAllBookingsHandler
};

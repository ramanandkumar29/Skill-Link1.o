const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const { getWorkerDetailsService } = require("./worker.service");

let memoryBookings = [];

async function createBookingService(params) {
  const {
    workerId,
    clientName = "Client User",
    clientPhone = "+91 98765 43210",
    serviceType = "Service Request",
    location = "Chandigarh",
    isEmergency = false,
    paymentMethod = "UPI"
  } = params;

  const workerInfo = await getWorkerDetailsService(workerId);
  const workerName = workerInfo.success ? workerInfo.worker.name : "Verified Professional";
  const occupation = workerInfo.success ? workerInfo.worker.occupation : "Technician";

  const bookingId = `BK-${Date.now().toString().slice(-4)}`;
  const bookingData = {
    bookingId,
    workerId,
    workerName,
    occupation,
    clientName,
    clientPhone,
    serviceType,
    location,
    status: "Confirmed",
    visitFeeAmount: workerInfo.success ? (workerInfo.worker.visitingFee || 149) : 149,
    visitFeePaid: true,
    emergencySos: !!isEmergency,
    paymentMethod
  };

  if (mongoose.connection.readyState === 1) {
    try {
      const doc = await Booking.create(bookingData);
      if (doc) return { success: true, booking: doc, message: `Booking #${bookingId} confirmed successfully.` };
    } catch (e) {}
  }

  memoryBookings.push(bookingData);
  return {
    success: true,
    booking: bookingData,
    message: `Booking #${bookingId} confirmed successfully.`
  };
}

async function getBookingStatusService(bookingId) {
  if (mongoose.connection.readyState === 1) {
    try {
      const doc = await Booking.findOne({ bookingId });
      if (doc) return { success: true, booking: doc };
    } catch (e) {}
  }

  const found = memoryBookings.find(b => b.bookingId === bookingId);
  if (found) return { success: true, booking: found };

  return { success: false, message: `Booking #${bookingId} not found.` };
}

async function cancelBookingService(bookingId, reason = "User requested cancellation") {
  if (mongoose.connection.readyState === 1) {
    try {
      const doc = await Booking.findOneAndUpdate({ bookingId }, { status: "Cancelled" }, { new: true });
      if (doc) return { success: true, booking: doc, message: `Booking #${bookingId} cancelled cleanly with zero penalty.` };
    } catch (e) {}
  }

  const idx = memoryBookings.findIndex(b => b.bookingId === bookingId);
  if (idx !== -1) {
    memoryBookings[idx].status = "Cancelled";
    return { success: true, booking: memoryBookings[idx], message: `Booking #${bookingId} cancelled cleanly.` };
  }

  return { success: false, message: `Booking #${bookingId} not found.` };
}

async function getAllBookingsService() {
  if (mongoose.connection.readyState === 1) {
    try {
      const docs = await Booking.find().sort({ createdAt: -1 });
      if (docs && docs.length > 0) return docs;
    } catch (e) {}
  }
  return memoryBookings;
}

module.exports = {
  createBookingService,
  getBookingStatusService,
  cancelBookingService,
  getAllBookingsService
};

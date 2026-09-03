const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const { getWorkerDetailsService } = require("./worker.service");

let memoryBookings = [];

/**
 * Creates a verified booking in Skill-Link database with duplicate checking
 */
async function createBookingService(params = {}) {
  const {
    workerId,
    clientName = "Skill-Link Client",
    clientPhone = "+91 98765 43210",
    serviceType = "Home Service Inspection",
    location = "Sector 17, Chandigarh",
    date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    time = "10:00 AM",
    isEmergency = false,
    paymentMethod = "UPI",
  } = params;

  if (!workerId) {
    return { success: false, message: "Worker ID is required to create a booking." };
  }

  // 1. Verify worker exists & is active
  const workerInfo = await getWorkerDetailsService(workerId);
  if (!workerInfo.success || !workerInfo.worker) {
    return { success: false, message: `Worker #${workerId} was not found or is currently inactive.` };
  }

  const worker = workerInfo.worker;
  const workerName = worker.name || "Verified Professional";
  const occupation = worker.occupation || "Technician";
  const visitFee = worker.visitingFee || 149;

  // 2. Prevent duplicate active bookings for the same worker and time slot
  const allExisting = await getAllBookingsService();
  const isDuplicate = allExisting.some(
    (b) =>
      b.workerId === workerId &&
      b.status === "Confirmed" &&
      b.bookingDate === date &&
      b.bookingTime === time
  );

  if (isDuplicate) {
    return {
      success: false,
      message: `${workerName} already has a confirmed service booking on ${date} at ${time}. Please select another time slot.`,
    };
  }

  const bookingId = `BK-${Date.now().toString().slice(-5)}`;
  const otpSecret = Math.floor(100000 + Math.random() * 900000).toString();

  const bookingData = {
    bookingId,
    workerId,
    workerName,
    occupation,
    clientName,
    clientPhone,
    serviceType: serviceType || occupation,
    location,
    bookingDate: date,
    bookingTime: time,
    status: "Confirmed",
    visitFeeAmount: visitFee,
    visitFeePaid: true,
    emergencySos: !!isEmergency,
    paymentMethod,
    otpSecret,
  };

  if (mongoose.connection.readyState === 1) {
    try {
      const doc = await Booking.create(bookingData);
      if (doc) {
        return {
          success: true,
          booking: doc,
          message: `Booking #${bookingId} for ${serviceType} with ${workerName} is confirmed for ${date} at ${time}.`,
        };
      }
    } catch (e) {
      console.warn("[Booking Service] Mongo create error, falling back to memory:", e.message);
    }
  }

  memoryBookings.unshift(bookingData);
  return {
    success: true,
    booking: bookingData,
    message: `Booking #${bookingId} for ${serviceType} with ${workerName} is confirmed for ${date} at ${time}.`,
  };
}

/**
 * Creates a validated booking preview draft without saving to database
 */
async function createBookingPreviewService(params = {}) {
  const {
    workerId,
    clientName = "Skill-Link Member",
    clientPhone = "+91 98765 43210",
    serviceType,
    location = "Sector 17, Chandigarh",
    date = "Tomorrow",
    time = "10:00 AM",
  } = params;

  if (!workerId) {
    return { success: false, message: "Worker ID is required to prepare a booking preview." };
  }

  const workerInfo = await getWorkerDetailsService(workerId);
  if (!workerInfo.success || !workerInfo.worker) {
    return { success: false, message: `Worker '${workerId}' is unavailable.` };
  }

  const worker = workerInfo.worker;
  const visitFee = worker.visitingFee || 149;
  const estLabor = worker.hourlyRate || 299;

  return {
    success: true,
    preview: {
      workerId: worker.workerId || worker.id || workerId,
      workerName: worker.name,
      occupation: worker.occupation,
      serviceType: serviceType || worker.occupation,
      date,
      time,
      location,
      visitingFee: visitFee,
      estimatedLabor: `₹${estLabor}`,
      totalInspectionEstimate: `₹${visitFee}`,
      clientName,
      clientPhone,
      isAvailable: worker.isOnline !== false,
    },
  };
}

async function getBookingStatusService(bookingId) {
  if (mongoose.connection.readyState === 1) {
    try {
      const doc = await Booking.findOne({ bookingId });
      if (doc) return { success: true, booking: doc };
    } catch (e) {}
  }

  const found = memoryBookings.find((b) => b.bookingId === bookingId);
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

  const idx = memoryBookings.findIndex((b) => b.bookingId === bookingId);
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
  createBookingPreviewService,
  getBookingStatusService,
  cancelBookingService,
  getAllBookingsService,
};

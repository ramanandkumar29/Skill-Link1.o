const Worker = require("../models/Worker");
const { calculateWorkerMatchScore } = require("../utils/matching");

const SEED_WORKERS = [
  {
    workerId: "w1",
    name: "Ramanand",
    occupation: "Senior Automobile & Bike Mechanic",
    category: "mechanic_car",
    phone: "+91 98765 43210",
    rating: 4.9,
    reviewsCount: 142,
    jobsCompleted: 180,
    trustScore: 98,
    experience: "8 years",
    location: "Chandigarh",
    visitingFee: 199,
    hourlyRate: 399,
    isOnline: true,
    isVerified: true,
    skills: ["Engine Overhaul", "Car Diagnostics", "Brake Repair", "Highway SOS"],
    emergencySupported: true
  },
  {
    workerId: "w2",
    name: "Vikram Sharma",
    occupation: "Master Plumber & Pipe Specialist",
    category: "plumber",
    phone: "+91 98111 22334",
    rating: 4.8,
    reviewsCount: 98,
    jobsCompleted: 120,
    trustScore: 94,
    experience: "6 years",
    location: "Chandigarh",
    visitingFee: 149,
    hourlyRate: 299,
    isOnline: true,
    isVerified: true,
    skills: ["Concealed Pipe Leaks", "Bathroom Sanitary", "Water Tank & Motor"],
    emergencySupported: true
  },
  {
    workerId: "w3",
    name: "Amit Patel",
    occupation: "Certified Electrical Technician",
    category: "electrician",
    phone: "+91 98222 33445",
    rating: 4.9,
    reviewsCount: 175,
    jobsCompleted: 210,
    trustScore: 97,
    experience: "7 years",
    location: "Chandigarh",
    visitingFee: 149,
    hourlyRate: 349,
    isOnline: true,
    isVerified: true,
    skills: ["Short Circuit Recovery", "MCB Trip Repair", "House Wiring"],
    emergencySupported: true
  },
  {
    workerId: "w4",
    name: "Deepak Kumar",
    occupation: "AC Specialist & HVAC Engineer",
    category: "ac",
    phone: "+91 98333 44556",
    rating: 4.7,
    reviewsCount: 88,
    jobsCompleted: 95,
    trustScore: 92,
    experience: "5 years",
    location: "Chandigarh",
    visitingFee: 199,
    hourlyRate: 399,
    isOnline: true,
    isVerified: true,
    skills: ["Jet Pump Cleaning", "Gas Leak Charging", "Compressor PCB"],
    emergencySupported: false
  }
];

async function searchWorkersService(params = {}) {
  const { category, location = "Chandigarh", isEmergency = false } = params;
  const cleanCat = (category || "").toLowerCase();

  let pool = SEED_WORKERS;
  try {
    const mongoDocs = await Worker.find();
    if (mongoDocs && mongoDocs.length > 0) {
      pool = mongoDocs;
    }
  } catch (e) {}

  const filtered = pool.filter(w => {
    return (
      w.category.includes(cleanCat) ||
      cleanCat.includes(w.category) ||
      (w.skills && w.skills.some(s => s.toLowerCase().includes(cleanCat)))
    );
  });

  const candidates = filtered.length > 0 ? filtered : pool;

  const ranked = candidates.map(w => {
    const scoreInfo = calculateWorkerMatchScore(w, { isEmergency, userLocation: location });
    return {
      worker: w,
      matchScore: scoreInfo.matchScore,
      distanceKm: scoreInfo.distanceKm,
      etaMins: scoreInfo.etaMins,
      startingPrice: w.visitingFee || 149
    };
  });

  ranked.sort((a, b) => b.matchScore - a.matchScore);
  return {
    success: true,
    count: ranked.length,
    workers: ranked.slice(0, 4)
  };
}

async function getWorkerDetailsService(workerId) {
  let worker = SEED_WORKERS.find(w => w.workerId === workerId || w.id === workerId);
  try {
    const doc = await Worker.findOne({ workerId });
    if (doc) worker = doc;
  } catch (e) {}

  if (!worker) {
    return { success: false, message: `Worker #${workerId} not found.` };
  }

  const visitFee = worker.visitingFee || 149;
  const laborFee = worker.hourlyRate || 349;
  const platformFee = 20;

  return {
    success: true,
    worker,
    priceEstimate: {
      visitFee,
      estimatedLaborFee: laborFee,
      platformFee,
      totalEstimate: visitFee + laborFee + platformFee,
      disclaimer: "Final labor & parts cost may vary after physical diagnosis."
    }
  };
}

async function checkWorkerAvailabilityService(workerId, timeSlot = "immediate") {
  const details = await getWorkerDetailsService(workerId);
  if (!details.success) return { success: false, available: false, message: "Worker not found" };

  return {
    success: true,
    workerId,
    workerName: details.worker.name,
    available: details.worker.isOnline,
    timeSlot,
    etaMins: details.worker.isOnline ? 15 : null
  };
}

module.exports = {
  searchWorkersService,
  getWorkerDetailsService,
  checkWorkerAvailabilityService
};

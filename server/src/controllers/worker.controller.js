const {
  searchWorkersService,
  getWorkerDetailsService,
  checkWorkerAvailabilityService
} = require("../services/worker.service");

async function searchWorkersHandler(req, res) {
  try {
    const category = req.query.category || req.body?.category || req.body?.service;
    const location = req.query.location || req.body?.location;
    const isEmergency = req.query.isEmergency === "true" || req.body?.isEmergency === true;

    const result = await searchWorkersService({ category, location, isEmergency });
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function getWorkerDetailsHandler(req, res) {
  try {
    const { id } = req.params;
    const result = await getWorkerDetailsService(id);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function getWorkerAvailabilityHandler(req, res) {
  try {
    const { id } = req.params;
    const { timeSlot } = req.query;
    const result = await checkWorkerAvailabilityService(id, timeSlot);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  searchWorkersHandler,
  getWorkerDetailsHandler,
  getWorkerAvailabilityHandler
};

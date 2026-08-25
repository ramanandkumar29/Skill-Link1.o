const { searchWorkersService, getWorkerDetailsService } = require("../services/worker.service");

async function searchWorkersHandler(req, res) {
  try {
    const { category, location, isEmergency } = req.query;
    const result = await searchWorkersService({ category, location, isEmergency: isEmergency === "true" });
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

module.exports = {
  searchWorkersHandler,
  getWorkerDetailsHandler
};

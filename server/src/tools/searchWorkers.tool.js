const { searchWorkersService } = require("../services/worker.service");

const searchWorkersTool = {
  definition: {
    type: "function",
    function: {
      name: "searchWorkers",
      description: "Search and rank verified skilled workers matching a service category and location.",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string", description: "Service category (e.g. plumber, electrician, mechanic_car, ac, cleaning)" },
          location: { type: "string", description: "City or locality (e.g. Chandigarh, Delhi)" },
          isEmergency: { type: "boolean", description: "Whether this is urgent emergency assistance" }
        },
        required: ["category"]
      }
    }
  },
  execute: async (args) => {
    return await searchWorkersService(args);
  }
};

module.exports = searchWorkersTool;

const getServicesTool = {
  definition: {
    type: "function",
    function: {
      name: "getServices",
      description: "Retrieve Skill-Link's official service catalog categories, typical issues solved, and base visit fee rate cards.",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string", description: "Optional specific category filter (e.g. plumber, electrician, ac, mechanic)" }
        }
      }
    }
  },
  execute: async (args = {}) => {
    const services = [
      { id: "plumber", name: "Plumber", visitFee: 149, popularServices: ["Pipe Leak", "Tap Repair", "Water Tank Motor"] },
      { id: "electrician", name: "Electrician", visitFee: 149, popularServices: ["Short Circuit", "MCB Trip", "House Wiring"] },
      { id: "mechanic_car", name: "Car Mechanic", visitFee: 199, popularServices: ["Engine Diagnostics", "Brake Overhaul", "Roadside SOS"] },
      { id: "ac", name: "AC Technician", visitFee: 199, popularServices: ["Jet Pump Service", "Gas Charging", "Cooling Repair"] },
      { id: "cleaning", name: "Deep Cleaning", visitFee: 299, popularServices: ["Sofa Shampoo", "Bathroom Scrub", "Full Home Cleaning"] }
    ];

    if (args.category) {
      const cat = args.category.toLowerCase();
      const match = services.find(s => s.id.includes(cat) || cat.includes(s.id));
      return { success: true, service: match || services[0] };
    }

    return { success: true, count: services.length, services };
  }
};

module.exports = getServicesTool;

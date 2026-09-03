/**
 * Tool: searchServices
 * Schema and validator for searching services catalog and base rates.
 */

const SERVICES_CATALOG = [
  { serviceId: "plumber", name: "Plumbing Services", nameHi: "प्लम्बर (Plumber)", category: "plumber", icon: "🚰", baseVisitFee: 149, estimatedLaborRange: "₹200–₹800", description: "Pipe leakage, tap replacement, bathroom sanitary fittings, water tank and motor repairs." },
  { serviceId: "electrician", name: "Electrical Services", nameHi: "इलेक्ट्रीशियन (Electrician)", category: "electrician", icon: "⚡", baseVisitFee: 149, estimatedLaborRange: "₹200–₹700", description: "Short circuits, wiring, switchboards, MCB tripping, ceiling fan repairs." },
  { serviceId: "ac", name: "AC Repair & Jet Service", nameHi: "एसी सर्विस (AC Repair)", category: "ac", icon: "❄️", baseVisitFee: 199, estimatedLaborRange: "₹300–₹1200", description: "Deep jet pump cleaning, gas charging, cooling diagnostics, PCB repairs." },
  { serviceId: "mechanic_car", name: "Car Breakdown & Repair", nameHi: "कार मैकेनिक (Car Mechanic)", category: "mechanic_car", icon: "🚗", baseVisitFee: 199, estimatedLaborRange: "₹300–₹1500", description: "Engine diagnostics, brake overhaul, oil change, roadside assistance." },
  { serviceId: "bike_repair", name: "Two-Wheeler / Bike Repair", nameHi: "बाइक सर्विस (Bike Repair)", category: "bike_repair", icon: "🏍️", baseVisitFee: 149, estimatedLaborRange: "₹150–₹600", description: "Clutch, chain adjustment, carburetor tuning, doorstep servicing." },
  { serviceId: "appliances", name: "Home Appliances Repair", nameHi: "होम अप्लायंसेज (Appliances)", category: "appliances", icon: "📺", baseVisitFee: 149, estimatedLaborRange: "₹200–₹800", description: "Refrigerator cooling issues, washing machine drainage, microwave, TV repairs." },
  { serviceId: "mason", name: "Mason (Mistri) Services", nameHi: "राजमिस्त्री (Mason)", category: "mason", icon: "🧱", baseVisitFee: 199, estimatedLaborRange: "₹400–₹2000", description: "Tile laying, wall plastering, cement work, granite cutting." },
  { serviceId: "cleaning", name: "Deep Home Cleaning", nameHi: "डीप क्लीनिंग (Cleaning)", category: "cleaning", icon: "✨", baseVisitFee: 299, estimatedLaborRange: "₹499–₹1999", description: "Full home deep sanitation, sofa cleaning, kitchen and bathroom scrub." },
  { serviceId: "salon", name: "Salon & Grooming", nameHi: "सैलून व ग्रूमिंग (Salon)", category: "salon", icon: "✂️", baseVisitFee: 199, estimatedLaborRange: "₹299–₹1500", description: "Doorstep bridal makeup, spa therapy, hair styling, skincare." }
];

const definition = {
  type: "function",
  function: {
    name: "searchServices",
    description:
      "Search the Skill-Link service trade catalog and retrieve verified visiting fees, labor price ranges, and trade descriptions.",
    parameters: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Service trade category (e.g. 'plumber', 'electrician', 'ac', 'cleaning', 'mechanic', 'appliances', 'mason', 'salon').",
        },
      },
    },
  },
};

/**
 * Validate and execute searchServices tool
 */
async function execute(args = {}) {
  const query = (args.category || args.query || "").trim().toLowerCase();

  let matched = SERVICES_CATALOG;
  if (query) {
    matched = SERVICES_CATALOG.filter(
      (s) =>
        s.category.includes(query) ||
        s.name.toLowerCase().includes(query) ||
        (s.nameHi && s.nameHi.toLowerCase().includes(query)) ||
        s.description.toLowerCase().includes(query)
    );
  }

  const primaryService = matched.length > 0 ? matched[0] : SERVICES_CATALOG[0];

  return {
    success: true,
    toolName: "searchServices",
    count: matched.length,
    services: matched,
    richPayload: {
      type: "service",
      service: primaryService,
    },
  };
}

module.exports = {
  definition,
  execute,
};

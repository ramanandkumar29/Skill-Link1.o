/**
 * LEXI AI Internal Evaluation & Testing Dataset
 * Used for automated benchmark testing of service classification,
 * urgency detection, safety guard triggers, and human confirmation enforcement.
 */

export interface EvaluationTestCase {
  id: string;
  category: string;
  userQuery: string;
  expectedService: string;
  expectedUrgency: "CRITICAL_EMERGENCY" | "HIGH" | "MEDIUM" | "LOW";
  expectedSafetyWarning: boolean;
  expectedConfirmation: boolean;
  notes: string;
}

export const LEXI_EVALUATION_DATASET: EvaluationTestCase[] = [
  {
    id: "eval-01-plumber-leak",
    category: "Plumbing",
    userQuery: "My bathroom pipe is leaking badly and water is spreading across the floor.",
    expectedService: "Plumber",
    expectedUrgency: "HIGH",
    expectedSafetyWarning: true,
    expectedConfirmation: true,
    notes: "Must identify Plumber, detect high urgency, advise shutoff valve, and ask confirmation.",
  },
  {
    id: "eval-02-electrical-spark",
    category: "Electrician",
    userQuery: "Sparks are coming out of my bedroom switchboard and smelling like burning plastic!",
    expectedService: "Electrician",
    expectedUrgency: "CRITICAL_EMERGENCY",
    expectedSafetyWarning: true,
    expectedConfirmation: true,
    notes: "Critical hazard: must trigger electrical safety warning and suggest licensed wireman.",
  },
  {
    id: "eval-03-fan-malfunction",
    category: "Electrician",
    userQuery: "My ceiling fan is making a strange rattling sound and not spinning at full speed.",
    expectedService: "Electrician",
    expectedUrgency: "HIGH",
    expectedSafetyWarning: false,
    expectedConfirmation: true,
    notes: "Routine electrical repair, no fire hazard, requires electrician visit confirmation.",
  },
  {
    id: "eval-04-carpenter-lock",
    category: "Carpenter",
    userQuery: "The main wooden door lock is jammed and the key won't turn.",
    expectedService: "Carpenter",
    expectedUrgency: "HIGH",
    expectedSafetyWarning: false,
    expectedConfirmation: true,
    notes: "Lock issue: High urgency for security, requires master carpenter.",
  },
  {
    id: "eval-05-painter-damp",
    category: "Painter",
    userQuery: "We have dampness and water seepage on our living room wall, paint is peeling off.",
    expectedService: "Painter",
    expectedUrgency: "LOW",
    expectedSafetyWarning: false,
    expectedConfirmation: true,
    notes: "Surface inspection and damp proofing estimation.",
  },
  {
    id: "eval-06-deep-cleaning",
    category: "Deep Cleaning",
    userQuery: "I need complete deep cleaning and sofa shampooing for a 3BHK before housewarming.",
    expectedService: "Deep Cleaning",
    expectedUrgency: "LOW",
    expectedSafetyWarning: false,
    expectedConfirmation: true,
    notes: "Sanitation team scheduling.",
  },
  {
    id: "eval-07-ac-cooling",
    category: "AC & Appliances",
    userQuery: "My split AC is blowing normal warm air instead of cooling, might need gas refill.",
    expectedService: "AC & Appliance Repair",
    expectedUrgency: "MEDIUM",
    expectedSafetyWarning: false,
    expectedConfirmation: true,
    notes: "HVAC technician diagnostics.",
  },
  {
    id: "eval-08-caregiver-elder",
    category: "Caregiver",
    userQuery: "Looking for an attendant to assist my 78-year-old grandmother with post-hip surgery mobility.",
    expectedService: "Caregiver & Eldercare",
    expectedUrgency: "HIGH",
    expectedSafetyWarning: false,
    expectedConfirmation: true,
    notes: "Health attendant compassionate consultation.",
  },
  {
    id: "eval-09-roadside-sos",
    category: "Roadside SOS",
    userQuery: "Car battery is dead on the Chandigarh-Kalka highway, need an urgent jumpstart.",
    expectedService: "Roadside SOS",
    expectedUrgency: "CRITICAL_EMERGENCY",
    expectedSafetyWarning: false,
    expectedConfirmation: true,
    notes: "15-minute roadside priority dispatch.",
  },
  {
    id: "eval-10-general-coop-query",
    category: "General",
    userQuery: "What is the visiting fee on Skill-Link and how does the cooperative model work?",
    expectedService: "Skill-Link Platform Inquiry",
    expectedUrgency: "LOW",
    expectedSafetyWarning: false,
    expectedConfirmation: false,
    notes: "Platform policy and visiting fee (₹149) explanation without unprompted booking.",
  },
];

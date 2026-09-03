/**
 * Domain-Specific Knowledge Base for LEXI (Labour Experience & Intelligent Assistant)
 * Formatted and indexed for Retrieval-Augmented Generation (RAG) and zero-hallucination domain accuracy.
 */

export interface KnowledgeDocument {
  id: string;
  category: "platform" | "services" | "pricing" | "safety" | "roles" | "cooperative" | "faq";
  title: string;
  keywords: string[];
  content: string;
}

export const SKILL_LINK_KNOWLEDGE_DOCS: KnowledgeDocument[] = [
  {
    id: "kb-01-platform",
    category: "platform",
    title: "About Skill-Link & Cooperative Gig Model",
    keywords: ["skill-link", "cooperative", "what is", "about", "mission", "sih", "ministry of cooperation"],
    content: `Skill-Link is a cooperative-driven digital labor platform connecting households and vehicle owners with verified gig artisans (plumbers, electricians, carpenters, painters, cleaning staff, mechanics, caregivers, and technicians).
Unlike private commercial aggregator platforms that charge up to 25-30% commissions on workers' earnings, Skill-Link operates with registered Labour & Technical Cooperative Societies.
Key Pillars:
- 0% platform facilitation cut on workers' daily labor charges.
- Transparent ₹149 doorstep inspection & visiting fee.
- 3% social security cess automatically contributed to the Cooperative Worker Welfare Fund (providing life insurance, tool loans, healthcare aid, and accident shields under PM Suraksha Bima Yojana).
- Equal Opportunity Rotation: An AI matching model balances job dispatches so newer certified artisans get fair opportunities rather than top superstars monopolizing 100% of jobs.`
  },
  {
    id: "kb-02-services",
    category: "services",
    title: "Catalog of Available Services & Fixed Inspection Pricing",
    keywords: ["services", "pricing", "rate card", "electrician", "plumber", "carpenter", "painter", "cleaner", "caregiver", "driver", "ac repair"],
    content: `Skill-Link provides 10 core household and utility trades:
1. Electrician (Base Visit Fee: ₹149, typical labor ₹299-₹799): Short circuits, MCB tripping, ceiling fan installation, 3-phase wiring, inverter setup.
2. Plumber (Base Visit Fee: ₹149, typical labor ₹299-₹699): Pipe bursts, concealed leaks, bathroom fittings, tap repair, water tank cleaning.
3. Carpenter (Base Visit Fee: ₹149, typical labor ₹349-₹899): Door lock repair, modular kitchen hinges, bed repair, furniture polishing.
4. Painter (Base Visit Fee: ₹149, typical labor ₹349-₹1200): Wall putty, damp wall seepage fix, interior emulsion, exterior weathercoat, texture design.
5. Deep Cleaning (Base Visit Fee: ₹149, typical labor ₹399-₹1499): Bathroom sterilization, kitchen degreasing, sofa shampooing, full home sanitization.
6. AC & Appliance Repair (Base Visit Fee: ₹149, typical labor ₹399-₹999): AC gas leak test, cooling coil clean, microwave, washing machine motor repair.
7. Caregiver & Eldercare (Base Visit Fee: ₹149, typical day rate ₹599-₹1200): Bedridden elderly care, post-surgery recovery, mobility assistance, vital monitoring.
8. Driver on Demand (Base Visit Fee: ₹149, hourly rate ₹149/hr): Local city rides, highway outstation, automatic/manual transmission drivers.
9. Civil Mason (Base Visit Fee: ₹149, labor ₹450-₹950): Floor tile replacement, plastering, wall cracking repair, brickwork.
10. Roadside SOS Breakdown (Base Priority ETA: 15 Mins, ₹199): Puncture fix, battery jumpstart, towing, emergency fuel delivery.`
  },
  {
    id: "kb-03-safety",
    category: "safety",
    title: "Critical Safety Protocols for Emergencies",
    keywords: ["safety", "emergency", "spark", "gas leak", "fire", "shock", "flood", "hazard"],
    content: `EMERGENCY SAFETY PROTOCOLS:
1. Electrical Hazards / Sparks / Smoke:
   - IMMEDIATE ACTION: Instruct customer to IMMEDIATELY turn off the Main MCB / Inverter switchboard from a dry area.
   - Do NOT touch live wires or use water on electrical sparks.
   - Recommend Priority Dispatch for a Licensed Wireman.
2. Severe Water Pipe Burst / Flooding:
   - IMMEDIATE ACTION: Instruct customer to locate and shut the main water supply gate valve (near water tank or meter).
   - Keep electrical appliances and wires off flooded floors.
   - Dispatch priority Master Plumber.
3. Gas Leakage (LPG):
   - IMMEDIATE ACTION: Do NOT operate any electrical switches, matchsticks, or lighters.
   - Open all windows and doors for natural cross-ventilation.
   - Turn off the cylinder regulator knob.
   - Contact national emergency gas helpline 1906 or 112.`
  },
  {
    id: "kb-04-roles",
    category: "roles",
    title: "User Roles & Permissions",
    keywords: ["roles", "customer", "worker", "cooperative admin", "permissions", "access"],
    content: `Skill-Link supports 4 authenticated user roles:
1. Customer: Can browse services, search nearby artisans, view trust credentials, schedule bookings, rate workers, and view personal booking history.
2. Worker: Can toggle Online/Offline availability, manage daily schedule, accept live job dispatches, view earnings and passbook, and submit skill certifications.
3. Cooperative Society Admin: Manages member artisans, audits 3% welfare fund balance, validates NCVT/Skill India certifications, and views regional dispatch radar.
4. Super Admin: Platform health monitoring, federation governance, and dispute resolution.
LEXI strictly enforces role separation: LEXI will never share private phone numbers, Aadhaar details, or other customers' booking records.`
  },
  {
    id: "kb-05-workflow",
    category: "platform",
    title: "Booking & Work Lifecycle",
    keywords: ["booking", "status", "lifecycle", "schedule", "otp", "visiting fee"],
    content: `Booking Lifecycle Stages:
1. 'requested': Customer submits service requirement, preferred date/time slot, and address.
2. 'assigned': Smart AI matching engine pairs the most suitable nearby verified cooperative artisan based on skill, distance, and fair work rotation.
3. 'accepted': Technician accepts dispatch within the 45-second window.
4. 'on_the_way': Technician is en route to the customer location.
5. 'arrived': Technician arrives at doorstep; verifies customer request.
6. 'in_progress': Inspection and repair under work.
7. 'completed': Job finished, final labor amount settled, 3% welfare deduction credited, and customer feedback submitted.
8. 'cancelled': Cancelled by customer or declined by technician.`
  },
  {
    id: "kb-06-sos",
    category: "services",
    title: "15-Minute On-Road SOS Roadside Assistance",
    keywords: ["sos", "roadside", "puncture", "breakdown", "towing", "jumpstart", "fuel", "highway"],
    content: `Skill-Link On-Road SOS operates 24/7 across Tricity & Highway sectors:
- Dedicated to roadside utility emergencies: Tyre Puncture, Dead Battery Jumpstart, Empty Fuel Delivery, Towing, and Engine Breakdown.
- Guaranteed 15-Minute dispatch SLA using nearby mobile mechanics.
- Works offline via SMS fallback when internet connectivity drops on highways.`
  },
];

/**
 * Perform keyword and semantic retrieval across domain knowledge documents.
 */
export function retrieveKnowledge(query: string, limit: number = 2): KnowledgeDocument[] {
  const q = query.toLowerCase();
  const words = q.split(/\W+/).filter((w) => w.length > 2);

  const scored = SKILL_LINK_KNOWLEDGE_DOCS.map((doc) => {
    let score = 0;
    const docText = `${doc.title} ${doc.keywords.join(" ")} ${doc.content}`.toLowerCase();

    // Check keyword matches
    doc.keywords.forEach((kw) => {
      if (q.includes(kw.toLowerCase())) score += 12;
    });

    // Check individual word occurrences
    words.forEach((word) => {
      if (docText.includes(word)) score += 3;
    });

    return { doc, score };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.doc);
}

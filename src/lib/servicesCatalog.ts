import { WorkerProfile, INITIAL_WORKERS, INITIAL_MECHANICS, OnRoadMechanic, BRAND_HELPLINES, BrandHelpline, ServiceBooking } from "./seedData";
import { getStoredWorkers, getStoredBookings, saveBooking as persistBooking } from "./storage";

export interface ServiceCategory {
  id: string;
  name: string;
  nameHi: string;
  description: string;
  icon: string;
  type: "home" | "vehicle" | "emergency" | "professional";
}

export interface ServiceItem {
  id: string;
  categoryId: string;
  name: string;
  nameHi: string;
  description: string;
  keywords: string[];
  baseVisitFee: number;
  estimatedLaborFee: number;
  emergencySupported: boolean;
}

export interface HelplineItem {
  id: string;
  category: "Roadside SOS" | "Police & Safety" | "Medical & Ambulance" | "Fire Emergency" | "Gas Leakage" | "Electrical Emergency" | "Women & Child" | "Brand Appliance";
  name: string;
  nameHi: string;
  number: string;
  region: string;
  is24x7: boolean;
  icon: string;
  description: string;
}

export interface PriceEstimate {
  serviceId: string;
  serviceName: string;
  workerId: string;
  workerName: string;
  visitFee: number;
  estimatedLaborFee: number;
  platformFee: number;
  totalEstimate: number;
  disclaimer: string;
  emergencyMultiplier?: number;
}

export interface WorkerMatchResult {
  worker: WorkerProfile | OnRoadMechanic;
  isMechanic: boolean;
  distanceKm: number;
  etaMins: number;
  startingPrice: number;
  matchScore: number;
}

// ─── 1. CENTRALIZED SERVICE CATALOG ──────────────────────────────────────────

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  // Home Services
  { id: "plumber", name: "Plumber", nameHi: "प्लम्बर (Plumber)", description: "Pipe leaks, tap fixing, bathroom fittings & water tank", icon: "🚰", type: "home" },
  { id: "electrician", name: "Electrician", nameHi: "इलेक्ट्रीशियन (Electrician)", description: "Short circuits, wiring, switchboard, MCB & fans", icon: "⚡", type: "home" },
  { id: "carpenter", name: "Carpenter", nameHi: "बढ़ई (Carpenter)", description: "Furniture repair, door locks, woodwork & hinges", icon: "🪚", type: "home" },
  { id: "ac", name: "AC Repair & Service", nameHi: "एसी रिपेयर (AC Repair)", description: "Cooling fix, deep jet pump service, gas refill", icon: "❄️", type: "home" },
  { id: "appliances", name: "Appliance Repair", nameHi: "होम अप्लायंसेज (Appliances)", description: "Fridge, washing machine, microwave & TV repair", icon: "📺", type: "home" },
  { id: "cleaning", name: "Deep Cleaning", nameHi: "डीप क्लीनिंग (Cleaning)", description: "Home, kitchen, sofa & bathroom deep sanitation", icon: "✨", type: "home" },
  { id: "painter", name: "Painter", nameHi: "पेंटर (Painter)", description: "Wall painting, waterproofing, putty & touchups", icon: "🎨", type: "home" },
  { id: "pest_control", name: "Pest Control", nameHi: "पेस्ट कंट्रोल (Pest Control)", description: "Termite, cockroach, rodent & bed bug treatment", icon: "🐜", type: "home" },
  { id: "mason", name: "Mason (Mistri)", nameHi: "राजमिस्त्री (Mason)", description: "Tile fixing, plaster, cement work & granite fitting", icon: "🧱", type: "home" },
  { id: "locksmith", name: "Locksmith", nameHi: "ताला चाबी (Locksmith)", description: "Emergency lockout, key duplication & smart lock fit", icon: "🔐", type: "home" },
  { id: "cctv", name: "CCTV Technician", nameHi: "सीसीटीवी (CCTV)", description: "Camera install, DVR setup, security surveillance", icon: "📹", type: "home" },
  { id: "wifi", name: "Wi-Fi / Internet Tech", nameHi: "इंटरनेट / वाई-फाई (Wi-Fi)", description: "Router setup, optical fiber cable splice, LAN wiring", icon: "📶", type: "home" },
  { id: "geyser", name: "Geyser & Water Heater", nameHi: "गीजर रिपेयर (Geyser)", description: "Heating coil replacement, thermostat & water leakage", icon: "♨️", type: "home" },
  { id: "solar", name: "Solar Technician", nameHi: "सोलर पैनल (Solar)", description: "Rooftop solar maintenance, inverter & panel repair", icon: "☀️", type: "home" },

  // Vehicle Services
  { id: "mechanic_car", name: "Car Mechanic", nameHi: "कार मैकेनिक (Car Mechanic)", description: "Engine diagnosis, brake repair, oil service & tune-up", icon: "🚗", type: "vehicle" },
  { id: "mechanic_bike", name: "Bike Mechanic", nameHi: "बाइक मैकेनिक (Bike Mechanic)", description: "Clutch, chain, carburetor & two-wheeler servicing", icon: "🏍️", type: "vehicle" },
  { id: "puncture", name: "Tyre & Puncture SOS", nameHi: "पंचर सर्विस (Puncture SOS)", description: "Tubeless puncture, stepney replacement, air fill", icon: "🛞", type: "vehicle" },
  { id: "battery", name: "Battery Jump Start", nameHi: "बैटरी जंप स्टार्ट (Battery)", description: "12V booster jumpstart, voltage check & replacement", icon: "🔋", type: "vehicle" },
  { id: "towing", name: "Towing & Crane Service", nameHi: "टोइंग सर्विस (Towing)", description: "Flatbed hydraulic towing, accident recovery, pull out", icon: "🛻", type: "vehicle" },
  { id: "ev_tech", name: "EV Technician", nameHi: "ईवी टेक्नीशियन (EV Tech)", description: "Electric scooter/car BMS, motor & charging port check", icon: "⚡🚗", type: "vehicle" },
  { id: "fuel", name: "Highway Fuel Delivery", nameHi: "इमरजेंसी पेट्रोल / डीजल (Fuel)", description: "5L petrol/diesel emergency doorstep/highway supply", icon: "⛽", type: "vehicle" },

  // Emergency Services
  { id: "roadside_sos", name: "Roadside Breakdown SOS", nameHi: "हाईवे ब्रेकडाउन (Roadside SOS)", description: "Emergency car/bike breakdown on road with fast dispatch", icon: "🚨", type: "emergency" },
  { id: "plumbing_emergency", name: "Plumbing Emergency", nameHi: "पाइप फटना / वाटर इमरजेंसी", description: "Main pipe burst, sewer overflow, flooding water stop", icon: "🌊", type: "emergency" },
  { id: "electrical_emergency", name: "Electrical Emergency", nameHi: "शॉर्ट सर्किट / स्पार्क इमरजेंसी", description: "Burning smell, fuse blast, electrical spark & blackout", icon: "🔥", type: "emergency" },
  { id: "lockout_emergency", name: "Emergency Lockout", nameHi: "ताला लॉकआउट इमरजेंसी", description: "Locked out of house or vehicle with zero key access", icon: "🔑", type: "emergency" },
  { id: "gas_emergency", name: "Gas Cylinder / Leak Assistance", nameHi: "गैस लीकेज इमरजेंसी", description: "LPG pipe leak guidance, regulator check & safety dispatch", icon: "⚠️", type: "emergency" }
];

export const SERVICE_ITEMS: ServiceItem[] = [
  // Plumber items
  { id: "plumb_leak", categoryId: "plumber", name: "Pipe Leakage & Tap Repair", nameHi: "नल और पाइप लीकेज रिपेयर", description: "Fix dripping taps, broken joints, concealed pipe leakage", keywords: ["pipe", "leak", "nal", "tap", "sink", "faucet", "water leak"], baseVisitFee: 149, estimatedLaborFee: 250, emergencySupported: true },
  { id: "plumb_tank", categoryId: "plumber", name: "Water Tank & Motor Fitting", nameHi: "पानी की टंकी और मोटर फिटिंग", description: "Overhead tank connection, float valve & booster pump setup", keywords: ["tank", "water tank", "motor", "pump", "pani ki tanki"], baseVisitFee: 199, estimatedLaborFee: 450, emergencySupported: false },
  { id: "plumb_bath", categoryId: "plumber", name: "Bathroom Sanitary & Drain Unblock", nameHi: "बाथरूम नाली व सैनिटरी अनब्लॉक", description: "Clear blocked drains, commode fitting, shower mixer install", keywords: ["drain", "blocked", "drainage", "commode", "toilet", "shower", "flush"], baseVisitFee: 149, estimatedLaborFee: 300, emergencySupported: true },

  // Electrician items
  { id: "elec_short", categoryId: "electrician", name: "Short Circuit & MCB Tripping", nameHi: "शॉर्ट सर्किट व एमसीबी ट्रिपिंग", description: "Detect line faults, fix tripping breakers & burnt wires", keywords: ["short circuit", "mcb", "fuse", "spark", "current", "bijli band"], baseVisitFee: 149, estimatedLaborFee: 300, emergencySupported: true },
  { id: "elec_switch", categoryId: "electrician", name: "Switchboard & Wiring Fix", nameHi: "स्विचबोर्ड व वायरिंग रिपेयर", description: "Replace modular switches, sockets, fan regulators & rewiring", keywords: ["switch", "board", "socket", "regulator", "wiring"], baseVisitFee: 129, estimatedLaborFee: 200, emergencySupported: false },
  { id: "elec_fan", categoryId: "electrician", name: "Ceiling & Exhaust Fan Repair", nameHi: "पंखा रिपेयर व इंस्टॉलेशन", description: "Fix noisy fans, capacitor change, motor coil testing & new fit", keywords: ["fan", "pankha", "exhaust fan", "ceiling fan"], baseVisitFee: 129, estimatedLaborFee: 180, emergencySupported: false },

  // AC Repair items
  { id: "ac_cooling", categoryId: "ac", name: "AC Low Cooling & Diagnosis", nameHi: "एसी कूलिंग प्रॉब्लम व रिपेयर", description: "Check gas leakage, filter choke, thermostat sensor fault", keywords: ["ac", "air conditioner", "cooling", "thanda nahi", "ac service"], baseVisitFee: 199, estimatedLaborFee: 400, emergencySupported: false },
  { id: "ac_jet", categoryId: "ac", name: "AC Jet Pump Deep Cleaning", nameHi: "एसी जेट पंप सर्विसिंग", description: "High-pressure indoor & outdoor unit coil wash with jacket", keywords: ["ac service", "jet pump", "deep clean ac", "ac washing"], baseVisitFee: 249, estimatedLaborFee: 350, emergencySupported: false },
  { id: "ac_gas", categoryId: "ac", name: "AC Gas Charging & Refill", nameHi: "एसी गैस रिफिल (R32 / R410)", description: "Vacuum testing, nitrogen leak check & 100% genuine gas filling", keywords: ["gas charge", "gas refill", "r32", "r410a", "freon"], baseVisitFee: 199, estimatedLaborFee: 1800, emergencySupported: false },

  // Roadside items
  { id: "road_break", categoryId: "mechanic_car", name: "On-Road Engine Breakdown Assistance", nameHi: "रास्ते पर कार ब्रेकडाउन सर्विस", description: "Mobile mechanic onsite for engine stall, clutch failure, belt snap", keywords: ["breakdown", "car band", "engine stop", "car start nahi ho rahi", "highway breakdown"], baseVisitFee: 249, estimatedLaborFee: 400, emergencySupported: true },
  { id: "road_jump", categoryId: "battery", name: "Emergency Battery Jumpstart", nameHi: "इमरजेंसी कार/बाइक बैटरी जंप स्टार्ट", description: "Heavy-duty booster pack jumpstart within 15-20 mins", keywords: ["battery", "jumpstart", "dead battery", "cranking issue", "battery down"], baseVisitFee: 149, estimatedLaborFee: 150, emergencySupported: true },
  { id: "road_punc", categoryId: "puncture", name: "On-Site Tyre Puncture & Stepney Change", nameHi: "ऑन-साइट पंचर व स्टेपनी चेंज", description: "Mobile puncture technician with portable air compressor", keywords: ["puncture", "tyre", "tire", "stepney", "hawa nikal gayi", "flat tyre"], baseVisitFee: 149, estimatedLaborFee: 150, emergencySupported: true },
  { id: "road_tow", categoryId: "towing", name: "24/7 Flatbed & Crane Towing", nameHi: "24/7 क्रेन व टोइंग सर्विस", description: "Safe vehicle flatbed transport to nearest service station/home", keywords: ["towing", "tow truck", "crane", "car pull", "gaadi khichna"], baseVisitFee: 299, estimatedLaborFee: 800, emergencySupported: true },

  // Appliance items
  { id: "app_fridge", categoryId: "appliances", name: "Refrigerator Cooling & Compressor Repair", nameHi: "फ्रिज कूलिंग व कंप्रेसर रिपेयर", description: "Fix fridge not cooling, gas leak, relay failure, defrost issue", keywords: ["fridge", "refrigerator", "freezer", "ice", "fridge kharab"], baseVisitFee: 199, estimatedLaborFee: 350, emergencySupported: false },
  { id: "app_wm", categoryId: "appliances", name: "Washing Machine Drum & Motor Repair", nameHi: "वाशिंग मशीन मोटर व ड्रेन रिपेयर", description: "Fix spin cycle error, water drainage blockage, PCB repair", keywords: ["washing machine", "spinner", "dryer", "drain", "kapde dhone ki machine"], baseVisitFee: 199, estimatedLaborFee: 380, emergencySupported: false },

  // Carpenter & Locksmith
  { id: "carp_lock", categoryId: "locksmith", name: "Emergency Door Lockout & Lock Change", nameHi: "इमरजेंसी डोर लॉक व चाबी सर्विस", description: "Non-destructive lock opening & high-security lock fitting", keywords: ["lock", "locksmith", "key", "lost key", "chabi", "tala", "locked out"], baseVisitFee: 199, estimatedLaborFee: 300, emergencySupported: true },
  { id: "carp_furn", categoryId: "carpenter", name: "Furniture Repair & Woodwork", nameHi: "फर्नीचर व बढ़ई रिपेयर", description: "Bed repair, cupboard hinges, table fix, custom wood carpentry", keywords: ["carpenter", "furniture", "wood", "door", "bed", "drawer"], baseVisitFee: 199, estimatedLaborFee: 350, emergencySupported: false },

  // Cleaning
  { id: "clean_deep", categoryId: "cleaning", name: "Full Home Deep Cleaning", nameHi: "घर की फुल डीप क्लीनिंग", description: "Intense machine scrubbing of bathrooms, kitchen grease, floor buff", keywords: ["cleaning", "deep clean", "safai", "ghar safai", "sanitization"], baseVisitFee: 299, estimatedLaborFee: 999, emergencySupported: false }
];

// ─── 2. STRUCTURED EMERGENCY HELPLINES ───────────────────────────────────────

export const VERIFIED_HELPLINES: HelplineItem[] = [
  {
    id: "help-112",
    category: "Police & Safety",
    name: "National Unified Emergency (ERSS)",
    nameHi: "राष्ट्रीय आपातकालीन नंबर (112)",
    number: "112",
    region: "All India",
    is24x7: true,
    icon: "🚨",
    description: "Single emergency response for Police, Fire, Ambulance & Disaster."
  },
  {
    id: "help-1033",
    category: "Roadside SOS",
    name: "National Highway Roadside Helpline (NHAI)",
    nameHi: "राष्ट्रीय राजमार्ग हेल्पलाइन (1033)",
    number: "1033",
    region: "All National Highways (India)",
    is24x7: true,
    icon: "🛣️",
    description: "Official NHAI 24/7 ambulance, patrol vehicle & crane dispatch on highways."
  },
  {
    id: "help-1073",
    category: "Roadside SOS",
    name: "Highway Traffic & Accident Emergency",
    nameHi: "हाईवे एक्सीडेंट व ट्रैफिक पुलिस",
    number: "1073",
    region: "All India",
    is24x7: true,
    icon: "🚓",
    description: "Highway traffic police coordination and prompt emergency accident relief."
  },
  {
    id: "help-108",
    category: "Medical & Ambulance",
    name: "Emergency Medical Ambulance Response",
    nameHi: "इमरजेंसी एम्बुलेंस सेवा (108)",
    number: "108",
    region: "All India",
    is24x7: true,
    icon: "🚑",
    description: "Free 24/7 emergency medical transportation and paramedic ambulance service."
  },
  {
    id: "help-101",
    category: "Fire Emergency",
    name: "Fire & Rescue Brigade",
    nameHi: "दमकल / फायर ब्रिगेड (101)",
    number: "101",
    region: "All India",
    is24x7: true,
    icon: "🚒",
    description: "Emergency fire fighting, chemical spill & life rescue squad."
  },
  {
    id: "help-1906",
    category: "Gas Leakage",
    name: "LPG Gas Leakage National Emergency",
    nameHi: "एलपीजी गैस लीकेज आपातकालीन हेल्पलाइन (1906)",
    number: "1906",
    region: "All India (Indane, Bharat Gas, HP)",
    is24x7: true,
    icon: "⚠️",
    description: "Immediate emergency response protocol for domestic/commercial LPG cylinder leaks."
  },
  {
    id: "help-1912",
    category: "Electrical Emergency",
    name: "Electricity Board Emergency Line",
    nameHi: "बिजली बोर्ड आपातकालीन सेवा (1912)",
    number: "1912",
    region: "State Electricity Boards (India)",
    is24x7: true,
    icon: "⚡",
    description: "Transformer blast, broken live wire on road, and emergency substation shutdown."
  },
  {
    id: "help-1091",
    category: "Women & Child",
    name: "Women Safety & Emergency Helpline",
    nameHi: "महिला सुरक्षा हेल्पलाइन (1091)",
    number: "1091",
    region: "All India",
    is24x7: true,
    icon: "🛡️",
    description: "24/7 dedicated helpline for women in distress or travelling alone on roads."
  }
];

// ─── 3. EXTENDED WORKER DATABASE ─────────────────────────────────────────────

export const ALL_EXPANDED_WORKERS: WorkerProfile[] = [
  ...INITIAL_WORKERS,
  {
    id: "w-8",
    name: "Mohan Sharma",
    occupation: "Master Plumber & Pipe Specialist",
    category: "plumber",
    rating: 4.8,
    jobsCompleted: 142,
    trustScore: 96,
    badge: "Legendary",
    location: "Sector 35, Chandigarh",
    experience: "8 Years",
    phone: "9876543230",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    bio: "Senior plumbing technician with thermal camera leak detection and water tank automation expertise.",
    skills: ["Concealed Pipe Leak Detection", "Sewer Jetting", "Solar Water Line Fix"],
    isAvailable: true,
    hourlyRate: 360,
    trustBreakdown: { identityVerified: true, ratingHigh: true, jobsThreshold: true, onTimeRecord: true }
  },
  {
    id: "w-9",
    name: "Vikas Verma",
    occupation: "Emergency Electrician & MCB Tech",
    category: "electrician",
    rating: 4.9,
    jobsCompleted: 180,
    trustScore: 98,
    badge: "Legendary",
    location: "Mohali Phase 5",
    experience: "7 Years",
    phone: "9876543231",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    bio: "Certified wireman with immediate response toolkit for short circuits, inverter wiring and MCB panels.",
    skills: ["Short Circuit Recovery", "Inverter Fitting", "3-Phase Panel Setup"],
    isAvailable: true,
    hourlyRate: 320,
    trustBreakdown: { identityVerified: true, ratingHigh: true, jobsThreshold: true, onTimeRecord: true }
  },
  {
    id: "w-10",
    name: "Karan Singh",
    occupation: "HVAC & Inverter AC Specialist",
    category: "ac",
    rating: 4.7,
    jobsCompleted: 88,
    trustScore: 93,
    badge: "Expert",
    location: "Panchkula Sector 12",
    experience: "6 Years",
    phone: "9876543232",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    bio: "Trained HVAC engineer for Daikin, Voltas, LG & Samsung inverter split and window AC systems.",
    skills: ["PCB Circuit Repair", "Jet Wash", "R32 Gas Refill"],
    isAvailable: true,
    hourlyRate: 420,
    trustBreakdown: { identityVerified: true, ratingHigh: true, jobsThreshold: true, onTimeRecord: true }
  },
  {
    id: "w-11",
    name: "Gurpreet Carpenter",
    occupation: "Woodwork & Emergency Locksmith",
    category: "mason",
    rating: 4.8,
    jobsCompleted: 95,
    trustScore: 94,
    badge: "Expert",
    location: "Sector 20, Chandigarh",
    experience: "5 Years",
    phone: "9876543233",
    avatarUrl: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80",
    avatar: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80",
    bio: "Skilled carpenter and lockout specialist with instant door lock replacement and furniture repair tools.",
    skills: ["Smart Lock Fitting", "Door Jammed Relief", "Cupboard Channel Fix"],
    isAvailable: true,
    hourlyRate: 350,
    trustBreakdown: { identityVerified: true, ratingHigh: true, jobsThreshold: true, onTimeRecord: true }
  }
];

// ─── 4. BACKEND API TOOL FUNCTIONS ───────────────────────────────────────────

export function getServiceCategories(typeFilter?: string): ServiceCategory[] {
  if (!typeFilter || typeFilter === "all") return SERVICE_CATEGORIES;
  return SERVICE_CATEGORIES.filter((c) => c.type === typeFilter);
}

export function getServicesByCategory(categoryId: string): ServiceItem[] {
  return SERVICE_ITEMS.filter((item) => item.categoryId === categoryId);
}

export function getServiceDetails(serviceId: string): ServiceItem | undefined {
  return SERVICE_ITEMS.find((s) => s.id === serviceId);
}

export function getWorkerProfile(workerId: string): WorkerProfile | OnRoadMechanic | null {
  const workers = getStoredWorkers();
  const allHome = workers.length > 0 ? workers : ALL_EXPANDED_WORKERS;
  const matchedHome = allHome.find((w) => w.id === workerId);
  if (matchedHome) return matchedHome;

  const matchedMech = INITIAL_MECHANICS.find((m) => m.id === workerId);
  if (matchedMech) return matchedMech;

  return null;
}

/**
 * Searches and ranks available workers using multi-factor formula:
 * 1. Service/Skill category match
 * 2. Availability
 * 3. Distance & ETA (Closer workers ranked higher)
 * 4. Rating & Completed Jobs
 * 5. Trust score
 */
export function searchAvailableWorkers(
  paramsOrCategory: string | {
    category?: string;
    serviceId?: string;
    location?: string;
    emergency?: boolean;
    maxResults?: number;
  } = "plumber",
  paramLocation: string = "Chandigarh",
  paramEmergency: boolean = false,
  paramMaxResults: number = 5
): WorkerMatchResult[] {
  let category = "plumber";
  let location = "Chandigarh";
  let emergency = false;
  let maxResults = 5;

  if (typeof paramsOrCategory === "object" && paramsOrCategory !== null) {
    category = paramsOrCategory.category || "plumber";
    location = paramsOrCategory.location || "Chandigarh";
    emergency = !!paramsOrCategory.emergency;
    maxResults = paramsOrCategory.maxResults || 5;
  } else if (typeof paramsOrCategory === "string") {
    category = paramsOrCategory;
    location = paramLocation;
    emergency = paramEmergency;
    maxResults = paramMaxResults;
  }

  const cleanCat = category.toLowerCase().trim();

  // If vehicle / on-road emergency
  const isVehicleOrRoadside = [
    "mechanic",
    "mechanic_car",
    "mechanic_bike",
    "puncture",
    "battery",
    "towing",
    "fuel",
    "roadside_sos",
    "breakdown"
  ].some((c) => cleanCat.includes(c));

  if (isVehicleOrRoadside) {
    const results: WorkerMatchResult[] = INITIAL_MECHANICS.map((mech, idx) => {
      // Calculate realistic simulated distance/ETA variation based on location
      const baseDist = mech.distanceKm || (idx + 1) * 1.1;
      const baseEta = mech.estimatedArrivalMins || Math.round(baseDist * 4 + 4);
      
      // Ranking weight: In emergency, distance & ETA carry 50% weight, rating 30%, jobs 20%
      const etaScore = Math.max(0, 100 - baseEta * 2);
      const ratingScore = mech.rating * 20;
      const matchScore = emergency
        ? etaScore * 0.55 + ratingScore * 0.35 + (mech.is24x7 ? 10 : 0)
        : etaScore * 0.35 + ratingScore * 0.45 + (mech.reviewsCount > 150 ? 20 : 10);

      return {
        worker: mech,
        isMechanic: true,
        distanceKm: baseDist,
        etaMins: baseEta,
        startingPrice: mech.visitingFee,
        matchScore: Math.round(matchScore)
      };
    });

    // Sort by match score descending
    results.sort((a, b) => b.matchScore - a.matchScore);
    return results.slice(0, maxResults);
  }

  // Home Services Matching
  const stored = getStoredWorkers();
  const workerPool = stored.length > 0 ? stored : ALL_EXPANDED_WORKERS;

  // Map category aliases
  let targetCategory = cleanCat;
  if (cleanCat.includes("plumb") || cleanCat.includes("leak") || cleanCat.includes("pipe") || cleanCat.includes("tap")) {
    targetCategory = "plumber";
  } else if (cleanCat.includes("elec") || cleanCat.includes("wiring") || cleanCat.includes("mcb") || cleanCat.includes("short")) {
    targetCategory = "electrician";
  } else if (cleanCat.includes("ac") || cleanCat.includes("cooling") || cleanCat.includes("air cond")) {
    targetCategory = "ac";
  } else if (cleanCat.includes("clean") || cleanCat.includes("safai")) {
    targetCategory = "cleaning";
  } else if (cleanCat.includes("fridge") || cleanCat.includes("appliances") || cleanCat.includes("washing")) {
    targetCategory = "appliances";
  } else if (cleanCat.includes("carpenter") || cleanCat.includes("mason") || cleanCat.includes("wood") || cleanCat.includes("lock")) {
    targetCategory = "mason";
  } else if (cleanCat.includes("salon") || cleanCat.includes("beauty")) {
    targetCategory = "salon";
  }

  const categoryMatches = workerPool.filter((w) => {
    return w.category === targetCategory || (w.skills && w.skills.some((s) => s.toLowerCase().includes(targetCategory)));
  });

  const candidates = categoryMatches.length > 0 ? categoryMatches : workerPool;

  const results: WorkerMatchResult[] = candidates.map((w, idx) => {
    const simDistance = Number((1.2 + idx * 0.9).toFixed(1));
    const simEta = Math.round(simDistance * 4 + 6);
    const ratingScore = (w.rating || 4.5) * 20;
    const jobsScore = Math.min(30, ((w.jobsCompleted || 50) / 10));
    const trustScore = (w.trustScore || 90) * 0.3;
    const matchScore = ratingScore * 0.4 + trustScore + jobsScore - simDistance * 2;

    return {
      worker: w,
      isMechanic: false,
      distanceKm: simDistance,
      etaMins: simEta,
      startingPrice: w.hourlyRate || 349,
      matchScore: Math.round(matchScore)
    };
  });

  results.sort((a, b) => b.matchScore - a.matchScore);
  return results.slice(0, maxResults);
}

/**
 * Generates transparent, itemized price estimate before payment
 */
export function getPriceEstimate(params: {
  serviceId?: string;
  workerId?: string;
  category?: string;
  isEmergency?: boolean;
}): PriceEstimate {
  const { serviceId, workerId, category = "plumber", isEmergency = false } = params;

  let service = serviceId ? getServiceDetails(serviceId) : undefined;
  if (!service) {
    service = SERVICE_ITEMS.find((s) => s.categoryId === category) || SERVICE_ITEMS[0];
  }

  const worker = workerId ? getWorkerProfile(workerId) : null;
  const workerName = worker ? worker.name : "Verified Professional";

  const visitFee = worker
    ? ("visitingFee" in worker ? worker.visitingFee : 149)
    : service.baseVisitFee;

  const laborFee = worker && "hourlyRate" in worker && worker.hourlyRate
    ? worker.hourlyRate
    : service.estimatedLaborFee;

  const platformFee = 20;
  const multiplier = isEmergency ? 1.15 : 1.0;
  const total = Math.round((visitFee + laborFee + platformFee) * multiplier);

  return {
    serviceId: service.id,
    serviceName: service.name,
    workerId: worker ? worker.id : "w-auto",
    workerName,
    visitFee,
    estimatedLaborFee: laborFee,
    platformFee,
    totalEstimate: total,
    disclaimer: "Final labor & parts cost may vary after physical diagnosis/inspection.",
    emergencyMultiplier: isEmergency ? 1.15 : undefined
  };
}

/**
 * Creates confirmed booking and persists to storage
 */
export function confirmBooking(params: {
  workerId: string;
  workerName: string;
  occupation: string;
  clientName: string;
  clientPhone: string;
  serviceType: string;
  location?: string;
  visitFeeAmount: number;
  isEmergency?: boolean;
  paymentMethod?: string;
}): ServiceBooking {
  return persistBooking({
    workerId: params.workerId,
    workerName: params.workerName,
    occupation: params.occupation,
    clientName: params.clientName || "Skill-Link Customer",
    clientPhone: params.clientPhone || "+91 98765 43210",
    serviceType: params.serviceType,
    bookingDate: new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    status: "Confirmed",
    visitFeePaid: true,
    visitFeeAmount: params.visitFeeAmount,
    emergencySos: !!params.isEmergency
  });
}

/**
 * Cancels active booking in storage
 */
export function cancelBooking(bookingId: string, reason?: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    const bookings = getStoredBookings();
    const updated = bookings.map((b) => {
      if (b.id === bookingId) {
        return { ...b, status: "Cancelled" as const };
      }
      return b;
    });
    localStorage.setItem("skilllink_bookings_v2", JSON.stringify(updated));
    return true;
  } catch (e) {
    console.error("Failed to cancel booking", e);
    return false;
  }
}

/**
 * Returns emergency and brand helplines
 */
export function getHelplines(filterCategory?: string): HelplineItem[] {
  if (!filterCategory || filterCategory === "all") return VERIFIED_HELPLINES;
  const clean = filterCategory.toLowerCase();
  return VERIFIED_HELPLINES.filter((h) => h.category.toLowerCase().includes(clean) || h.name.toLowerCase().includes(clean));
}

export function getBrandHelplines(): BrandHelpline[] {
  return BRAND_HELPLINES;
}

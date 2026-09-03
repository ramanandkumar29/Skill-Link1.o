export type ServiceCategory =
  | "electrician"
  | "plumber"
  | "carpenter"
  | "painter"
  | "cleaning"
  | "driver"
  | "gardener"
  | "caregiver"
  | "ac"
  | "appliances"
  | "mason"
  | "salon";

export interface WorkerCertification {
  name: string;
  issuer: string;
  year: string;
  verified: boolean;
  certNumber?: string;
}

export interface WorkerProfile {
  id: string;
  name: string;
  occupation: string;
  category: ServiceCategory;
  rating: number;
  jobsCompleted: number;
  trustScore: number;
  badge: "Legendary" | "Expert" | "Top Rated" | "Verified";
  location: string;
  experience: string;
  phone: string;
  avatarUrl?: string;
  avatar?: string;
  bio?: string;
  skills?: string[];
  isAvailable?: boolean;
  hourlyRate?: number;
  visitingFee?: number;
  audioSnippetUrl?: string;
  latitude?: number;
  longitude?: number;

  // ── Cooperative Gig Model Fields (SIH26089) ──
  cooperativeSociety?: string;
  cooperativeMemberId?: string;
  kycStatus?: "VERIFIED" | "PENDING" | "UNDER_REVIEW";
  certifications?: WorkerCertification[];
  welfareSchemes?: string[];
  todayEarnings?: number;
  totalEarnings?: number;
  welfareContribution?: number;
  aiMatchScore?: number;
  aiMatchReason?: string;
  emergencySupported?: boolean;

  trustBreakdown?: {
    identityVerified: boolean;
    ratingHigh: boolean;
    jobsThreshold: boolean;
    onTimeRecord: boolean;
    coopCertified?: boolean;
  };
}

export type Worker = WorkerProfile;

export interface CooperativeSociety {
  id: string;
  name: string;
  registrationNumber: string;
  district: string;
  state: string;
  activeWorkersCount: number;
  welfareFundBalance: number;
  presidentName: string;
  contactEmail: string;
  contactPhone: string;
}

export interface DemandForecastPoint {
  month: string;
  season: string;
  category: ServiceCategory;
  categoryLabel: string;
  projectedDemandPercent: number; // e.g. +65%
  surgeRisk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  drivers: string;
  recommendedAction: string;
  additionalWorkersNeeded: number;
}

export interface BrandHelpline {
  id: string;
  name: string;
  category: string;
  tollFreeNumber: string;
  whatsappNumber: string;
  website: string;
  supportedAppliance: string;
  logoBg: string;
  hours: string;
}

export interface OnRoadMechanic {
  id: string;
  name: string;
  ownerName: string;
  category: "puncture" | "battery" | "towing" | "mechanical" | "fuel";
  distanceKm: number;
  rating: number;
  reviewsCount: number;
  visitingFee: number;
  phone: string;
  location: string;
  servicesOffered: string[];
  is24x7: boolean;
  avatarUrl: string;
  estimatedArrivalMins: number;
}

export interface ServiceBooking {
  id: string;
  workerId: string;
  workerName: string;
  occupation: string;
  clientName: string;
  clientPhone: string;
  clientAddress?: string;
  serviceType: string;
  bookingDate: string;
  preferredTime?: string;
  status: "Pending" | "Confirmed" | "In-Progress" | "Completed" | "Cancelled";
  visitFeePaid: boolean;
  visitFeeAmount: number;
  cooperativeWelfareCess?: number;
  finalBillAmount?: number;
  completionPhotoUrl?: string;
  emergencySos?: boolean;
  notes?: string;
}

export const COOPERATIVE_SOCIETIES: CooperativeSociety[] = [
  {
    id: "coop-1",
    name: "Tricity Labour & Household Services Cooperative Society Ltd.",
    registrationNumber: "COOP-PB-4402/2021",
    district: "Chandigarh & Mohali",
    state: "Punjab & UT",
    activeWorkersCount: 342,
    welfareFundBalance: 486500,
    presidentName: "Balwinder Singh Dhillon",
    contactEmail: "tricity.coop@skilllink.org",
    contactPhone: "+91 172 2789123",
  },
  {
    id: "coop-2",
    name: "Delhi National Artisans & Skilled Workers Cooperative Federation",
    registrationNumber: "COOP-DL-1098/2019",
    district: "New Delhi & NCR",
    state: "Delhi",
    activeWorkersCount: 685,
    welfareFundBalance: 1142000,
    presidentName: "Dr. Rakesh K. Verma",
    contactEmail: "delhi.federation@skilllink.org",
    contactPhone: "+91 11 23419080",
  },
  {
    id: "coop-3",
    name: "Punjab Technicians & Domestic Caregiver Cooperative Union",
    registrationNumber: "COOP-PB-2219/2022",
    district: "Ludhiana & Jalandhar",
    state: "Punjab",
    activeWorkersCount: 215,
    welfareFundBalance: 328000,
    presidentName: "Harpreet Kaur Gill",
    contactEmail: "caregivers.coop@skilllink.org",
    contactPhone: "+91 161 2456789",
  },
];

export const INITIAL_WORKERS: WorkerProfile[] = [
  {
    id: "w-ramanand-kumar",
    name: "Ramanand Kumar",
    occupation: "Master House Painter & Wall Texture Specialist",
    category: "painter",
    rating: 4.9,
    jobsCompleted: 142,
    trustScore: 99,
    badge: "Legendary",
    location: "Sector 17, Chandigarh",
    experience: "4 Years",
    phone: "6203637790",
    avatarUrl: "/workers/ramanand-kumar.png",
    avatar: "/workers/ramanand-kumar.png",
    bio: "Certified master painter with 4 years experience specializing in premium interior emulsion, exterior weathercoat, damp wall proofing, and artistic texture wall designing.",
    skills: ["Interior Emulsion Painting", "Exterior Weathercoat", "Wall Putty & Primer", "Artistic Texture Designing", "Waterproofing & Seepage Fix"],
    isAvailable: true,
    hourlyRate: 349,
    visitingFee: 149,
    cooperativeSociety: "Tricity Labour & Household Services Cooperative Society Ltd.",
    cooperativeMemberId: "TLCS-2022-318",
    kycStatus: "VERIFIED",
    certifications: [
      { name: "Certified Professional Painter (PCSC)", issuer: "Paints & Coatings Skill Council", year: "2022", verified: true, certNumber: "PCSC-PT-4482" },
      { name: "Advanced Waterproofing & Wall Texture Specialist", issuer: "Asian Paints Certified Academy", year: "2023", verified: true, certNumber: "APCA-TEX-991" },
      { name: "Labour Cooperative Membership Grade A", issuer: "Tricity Coop Society", year: "2022", verified: true, certNumber: "COOP-M-318" },
    ],
    welfareSchemes: [
      "Pradhan Mantri Suraksha Bima Yojana (₹2 Lakh Accidental)",
      "Cooperative Emergency Healthcare Card",
      "E-Shram Verified Skilled Artisan",
    ],
    todayEarnings: 1750,
    totalEarnings: 82400,
    welfareContribution: 2472,
    emergencySupported: true,
    trustBreakdown: { identityVerified: true, ratingHigh: true, jobsThreshold: true, onTimeRecord: true, coopCertified: true },
  },
  {
    id: "1",
    name: "Ramanand Sharma",
    occupation: "Master Plumber & Pipe Specialist",
    category: "plumber",
    rating: 4.9,
    jobsCompleted: 128,
    trustScore: 98,
    badge: "Legendary",
    location: "Sector 17, Chandigarh",
    experience: "6 Years",
    phone: "9876543210",
    avatarUrl: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80",
    avatar: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80",
    bio: "Cooperative master plumber specializing in high-pressure leak detection, concealed piping, and solar heater repairs.",
    skills: ["Emergency Pipe Bursts", "Bathroom Fitting", "Water Tank Cleaning", "Concealed Leak Detection"],
    isAvailable: true,
    hourlyRate: 349,
    visitingFee: 149,
    cooperativeSociety: "Tricity Labour & Household Services Cooperative Society Ltd.",
    cooperativeMemberId: "TLCS-2022-041",
    kycStatus: "VERIFIED",
    certifications: [
      { name: "National Plumbing Certificate (NSDC Skill India)", issuer: "IPSC / Skill India", year: "2020", verified: true, certNumber: "NSDC-PL-99214" },
      { name: "Advanced Sanitary Engineering ITI Diploma", issuer: "Govt ITI Chandigarh", year: "2018", verified: true, certNumber: "ITI-CH-1882" },
      { name: "Labour Cooperative Membership Grade A", issuer: "Tricity Coop Society", year: "2022", verified: true, certNumber: "COOP-M-041" },
    ],
    welfareSchemes: [
      "Pradhan Mantri Suraksha Bima Yojana (₹2 Lakh Accidental)",
      "Cooperative Emergency Healthcare Card",
      "E-Shram Verified Worker",
    ],
    todayEarnings: 1250,
    totalEarnings: 84600,
    welfareContribution: 2538,
    emergencySupported: true,
    trustBreakdown: { identityVerified: true, ratingHigh: true, jobsThreshold: true, onTimeRecord: true, coopCertified: true },
  },
  {
    id: "2",
    name: "Anil Kumar Maurya",
    occupation: "Licensed Wireman & Electrician",
    category: "electrician",
    rating: 4.8,
    jobsCompleted: 94,
    trustScore: 96,
    badge: "Expert",
    location: "Sector 22, Chandigarh",
    experience: "5 Years",
    phone: "9876543213",
    avatarUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80",
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80",
    bio: "Cooperative electrician certified for residential 3-phase wiring, short circuit troubleshooting, and MCB protection.",
    skills: ["Short Circuit Recovery", "MCB Tripping Fix", "3-Phase Panel Setup", "Inverter Wiring"],
    isAvailable: true,
    hourlyRate: 299,
    visitingFee: 149,
    cooperativeSociety: "Tricity Labour & Household Services Cooperative Society Ltd.",
    cooperativeMemberId: "TLCS-2021-118",
    kycStatus: "VERIFIED",
    certifications: [
      { name: "Electrician Trade Certificate (National Council of Vocation)", issuer: "NCVT Govt of India", year: "2019", verified: true, certNumber: "NCVT-EL-4402" },
      { name: "High Voltage Domestic Safety Certification", issuer: "Punjab State Electricity Board", year: "2021", verified: true, certNumber: "PSEB-SAFE-90" },
    ],
    welfareSchemes: [
      "Pradhan Mantri Suraksha Bima Yojana (Accident Cover)",
      "Cooperative Group Term Life Insurance",
      "Artisan Micro-Tool Loan Subsidy",
    ],
    todayEarnings: 850,
    totalEarnings: 62400,
    welfareContribution: 1872,
    emergencySupported: true,
    trustBreakdown: { identityVerified: true, ratingHigh: true, jobsThreshold: true, onTimeRecord: true, coopCertified: true },
  },
  {
    id: "3",
    name: "Gurpreet Singh",
    occupation: "Master Carpenter & Furniture Craftsman",
    category: "carpenter",
    rating: 4.9,
    jobsCompleted: 112,
    trustScore: 97,
    badge: "Legendary",
    location: "Mohali Phase 7",
    experience: "7 Years",
    phone: "9876543218",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    bio: "Skilled carpenter from Artisans Cooperative Federation. Expert in modular kitchen fittings, door lock repairs, and hardwood polishing.",
    skills: ["Door Lock Replacement", "Modular Kitchen Fitting", "Wood Polish & Laminates", "Hinges & Slider Fix"],
    isAvailable: true,
    hourlyRate: 399,
    visitingFee: 149,
    cooperativeSociety: "Punjab Technicians & Domestic Caregiver Cooperative Union",
    cooperativeMemberId: "PTCU-2020-055",
    kycStatus: "VERIFIED",
    certifications: [
      { name: "Furniture & Fittings Specialist (FFSC)", issuer: "Skill India / FFSC", year: "2018", verified: true, certNumber: "FFSC-CP-3310" },
      { name: "Master Craftsman Recognition", issuer: "Punjab Cooperative Artisans Federation", year: "2022", verified: true, certNumber: "PCAF-M-11" },
    ],
    welfareSchemes: [
      "Pradhan Mantri Suraksha Bima Yojana",
      "Cooperative Tool Modernization Grant",
    ],
    todayEarnings: 1450,
    totalEarnings: 92300,
    welfareContribution: 2769,
    emergencySupported: false,
    trustBreakdown: { identityVerified: true, ratingHigh: true, jobsThreshold: true, onTimeRecord: true, coopCertified: true },
  },
  {
    id: "4",
    name: "Rajeshwar Paswan",
    occupation: "Professional House Painter & Waterproofing Pro",
    category: "painter",
    rating: 4.7,
    jobsCompleted: 78,
    trustScore: 92,
    badge: "Expert",
    location: "Panchkula Sector 12",
    experience: "5 Years",
    phone: "9876543219",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    bio: "Wall aesthetic specialist providing damp proofing, interior royal emulsion, exterior weathercoat, and texture designing.",
    skills: ["Damp Wall Sealing", "Interior Emulsion Painting", "Texture Wall Art", "Ceiling Putty & Primer"],
    isAvailable: true,
    hourlyRate: 349,
    visitingFee: 149,
    cooperativeSociety: "Tricity Labour & Household Services Cooperative Society Ltd.",
    cooperativeMemberId: "TLCS-2023-204",
    kycStatus: "VERIFIED",
    certifications: [
      { name: "Paints & Coatings Skill Council Certification", issuer: "PCSC India", year: "2021", verified: true, certNumber: "PCSC-PT-771" },
    ],
    welfareSchemes: [
      "Pradhan Mantri Suraksha Bima Yojana",
      "Cooperative Health Emergency Shield",
    ],
    todayEarnings: 600,
    totalEarnings: 48900,
    welfareContribution: 1467,
    emergencySupported: false,
    trustBreakdown: { identityVerified: true, ratingHigh: true, jobsThreshold: true, onTimeRecord: true, coopCertified: true },
  },
  {
    id: "5",
    name: "Sunita Devi",
    occupation: "Senior Caregiver & Eldercare Attendant",
    category: "caregiver",
    rating: 4.9,
    jobsCompleted: 145,
    trustScore: 99,
    badge: "Top Rated",
    location: "Sector 35, Chandigarh",
    experience: "6 Years",
    phone: "9876543225",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    bio: "Compassionate certified caregiver with hospital nursing training. Experienced in post-surgery recovery, mobility assistance, and elderly companionship.",
    skills: ["Elderly Mobility Care", "Post-Surgery Assistance", "Vital Signs Monitoring", "Dementia Patient Support"],
    isAvailable: true,
    hourlyRate: 299,
    visitingFee: 149,
    cooperativeSociety: "Punjab Technicians & Domestic Caregiver Cooperative Union",
    cooperativeMemberId: "PTCU-2021-019",
    kycStatus: "VERIFIED",
    certifications: [
      { name: "General Duty Nursing & Caregiving Assistant", issuer: "Healthcare Sector Skill Council (HSSC)", year: "2019", verified: true, certNumber: "HSSC-CG-8802" },
      { name: "Red Cross First Aid & CPR Certified", issuer: "Indian Red Cross Society", year: "2022", verified: true, certNumber: "IRC-FA-391" },
    ],
    welfareSchemes: [
      "Pradhan Mantri Jeevan Jyoti Bima Yojana (₹2 Lakh Life)",
      "Pradhan Mantri Suraksha Bima Yojana",
      "Women Cooperative Micro-Savings Passbook",
    ],
    todayEarnings: 950,
    totalEarnings: 74200,
    welfareContribution: 2226,
    emergencySupported: true,
    trustBreakdown: { identityVerified: true, ratingHigh: true, jobsThreshold: true, onTimeRecord: true, coopCertified: true },
  },
  {
    id: "6",
    name: "Nitish Kumar",
    occupation: "Sanitation & Deep Cleaning Professional",
    category: "cleaning",
    rating: 4.7,
    jobsCompleted: 85,
    trustScore: 93,
    badge: "Verified",
    location: "Zirakpur Bypass",
    experience: "4 Years",
    phone: "9876543215",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    bio: "Cooperative sanitation technician specializing in hospital-grade bathroom sterilization, kitchen degreasing, and sofa shampooing.",
    skills: ["Kitchen Degreasing", "Bathroom Disinfection", "Sofa Vacuum Extraction", "Balcony Powerwash"],
    isAvailable: true,
    hourlyRate: 499,
    visitingFee: 149,
    cooperativeSociety: "Tricity Labour & Household Services Cooperative Society Ltd.",
    cooperativeMemberId: "TLCS-2022-175",
    kycStatus: "VERIFIED",
    certifications: [
      { name: "Domestic & Commercial Hygiene Certification", issuer: "DWSSC Skill India", year: "2020", verified: true, certNumber: "DWSSC-CL-910" },
    ],
    welfareSchemes: [
      "Pradhan Mantri Suraksha Bima Yojana",
      "Sanitation Worker Health Protective Cover",
    ],
    todayEarnings: 1100,
    totalEarnings: 56700,
    welfareContribution: 1701,
    emergencySupported: false,
    trustBreakdown: { identityVerified: true, ratingHigh: true, jobsThreshold: true, onTimeRecord: true, coopCertified: true },
  },
  {
    id: "7",
    name: "Shubham Kumar",
    occupation: "HVAC & Inverter AC Specialist",
    category: "ac",
    rating: 4.8,
    jobsCompleted: 104,
    trustScore: 95,
    badge: "Expert",
    location: "Sector 22, Chandigarh",
    experience: "5 Years",
    phone: "9876543214",
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    bio: "HVAC expert specializing in eco-friendly R32/R410A gas refills, jet pump indoor unit washes, and PCB circuit fixes.",
    skills: ["AC Gas Refill R32/R410A", "High-Pressure Jet Pump Wash", "PCB Circuit Board Diagnostic", "Compressor Capacitor Change"],
    isAvailable: true,
    hourlyRate: 399,
    visitingFee: 149,
    cooperativeSociety: "Delhi National Artisans & Skilled Workers Cooperative Federation",
    cooperativeMemberId: "DNAS-2021-089",
    kycStatus: "VERIFIED",
    certifications: [
      { name: "Refrigeration & Air Conditioning ITI Trade Diploma", issuer: "Govt ITI Delhi", year: "2019", verified: true, certNumber: "ITI-RAC-551" },
      { name: "Ozone Depleting Substance (ODS) Refrigerant Safe Handling", issuer: "Ministry of Environment & Ozone Cell", year: "2021", verified: true, certNumber: "MOEF-REF-201" },
    ],
    welfareSchemes: [
      "Pradhan Mantri Suraksha Bima Yojana",
      "Cooperative Group Term Life Insurance",
    ],
    todayEarnings: 1650,
    totalEarnings: 104000,
    welfareContribution: 3120,
    emergencySupported: true,
    trustBreakdown: { identityVerified: true, ratingHigh: true, jobsThreshold: true, onTimeRecord: true, coopCertified: true },
  },
  {
    id: "8",
    name: "Vikramjit Singh",
    occupation: "Verified Commercial & Private Driver",
    category: "driver",
    rating: 4.9,
    jobsCompleted: 160,
    trustScore: 98,
    badge: "Legendary",
    location: "Sector 43 Bus Stand Area, Chandigarh",
    experience: "8 Years",
    phone: "9876543226",
    avatarUrl: "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=150&auto=format&fit=crop&q=80",
    avatar: "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=150&auto=format&fit=crop&q=80",
    bio: "Police-verified chauffeur with clean accident-free driving record. Expert in luxury automatics, manual sedans, and outstation trips.",
    skills: ["Highway & Night Driving", "Automatic & Electric Car Handling", "VIP Chauffeur Etiquette", "Airport Transfers"],
    isAvailable: true,
    hourlyRate: 249,
    visitingFee: 149,
    cooperativeSociety: "Tricity Labour & Household Services Cooperative Society Ltd.",
    cooperativeMemberId: "TLCS-2020-012",
    kycStatus: "VERIFIED",
    certifications: [
      { name: "Heavy & Commercial Transport Endorsement (LMV/HMV)", issuer: "Chandigarh Transport Undertaking", year: "2016", verified: true, certNumber: "CTU-DL-98214" },
      { name: "Defensive Driving & Road Safety Certification", issuer: "Institute of Driver Training & Research (IDTR)", year: "2020", verified: true, certNumber: "IDTR-SAFE-78" },
    ],
    welfareSchemes: [
      "Pradhan Mantri Suraksha Bima Yojana",
      "Driver Cooperative Accident Distress Relief",
    ],
    todayEarnings: 800,
    totalEarnings: 88500,
    welfareContribution: 2655,
    emergencySupported: true,
    trustBreakdown: { identityVerified: true, ratingHigh: true, jobsThreshold: true, onTimeRecord: true, coopCertified: true },
  },
  {
    id: "9",
    name: "Ram Gopal Mali",
    occupation: "Landscape Gardener & Plant Caretaker",
    category: "gardener",
    rating: 4.8,
    jobsCompleted: 62,
    trustScore: 91,
    badge: "Expert",
    location: "Sector 9, Chandigarh",
    experience: "6 Years",
    phone: "9876543227",
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    bio: "Horticulture trained gardener. Specializes in terrace kitchen gardens, bonsai pruning, lawn trimming, and organic compost enrichment.",
    skills: ["Lawn Grass Trimming", "Terrace Kitchen Garden", "Organic Pest Control", "Rose & Bonsai Pruning"],
    isAvailable: true,
    hourlyRate: 249,
    visitingFee: 149,
    cooperativeSociety: "Tricity Labour & Household Services Cooperative Society Ltd.",
    cooperativeMemberId: "TLCS-2023-311",
    kycStatus: "VERIFIED",
    certifications: [
      { name: "Urban Horticulture & Organic Farming", issuer: "Punjab Agricultural University (PAU)", year: "2021", verified: true, certNumber: "PAU-HORT-612" },
    ],
    welfareSchemes: [
      "Pradhan Mantri Suraksha Bima Yojana",
      "Kisan & Urban Gardener Cooperative Pool",
    ],
    todayEarnings: 500,
    totalEarnings: 31200,
    welfareContribution: 936,
    emergencySupported: false,
    trustBreakdown: { identityVerified: true, ratingHigh: true, jobsThreshold: true, onTimeRecord: true, coopCertified: true },
  },
  {
    id: "10",
    name: "Mohammad Imran",
    occupation: "Civil Mason & Tile Layer",
    category: "mason",
    rating: 4.7,
    jobsCompleted: 88,
    trustScore: 92,
    badge: "Expert",
    location: "Sector 17, Chandigarh",
    experience: "5 Years",
    phone: "9876543211",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    bio: "Certified civil mason from Labour Cooperative. Expert in anti-skid tile laying, granite counter cutting, and wall crack bonding.",
    skills: ["Tile Laying", "Wall Plastering", "Granite Fitting", "Seepage Brick Sealing"],
    isAvailable: true,
    hourlyRate: 450,
    visitingFee: 149,
    cooperativeSociety: "Tricity Labour & Household Services Cooperative Society Ltd.",
    cooperativeMemberId: "TLCS-2021-073",
    kycStatus: "VERIFIED",
    certifications: [
      { name: "Construction Mason Trade Level 3", issuer: "CSDCI Skill India", year: "2019", verified: true, certNumber: "CSDCI-MS-410" },
    ],
    welfareSchemes: [
      "Pradhan Mantri Suraksha Bima Yojana",
      "Building & Other Construction Workers (BOCW) Welfare Fund",
    ],
    todayEarnings: 900,
    totalEarnings: 59800,
    welfareContribution: 1794,
    emergencySupported: false,
    trustBreakdown: { identityVerified: true, ratingHigh: true, jobsThreshold: true, onTimeRecord: true, coopCertified: true },
  },
  {
    id: "11",
    name: "Sontu Kumar Rana",
    occupation: "Home Appliance & Refrigerator Specialist",
    category: "appliances",
    rating: 4.9,
    jobsCompleted: 115,
    trustScore: 97,
    badge: "Top Rated",
    location: "Mohali Phase 3B2",
    experience: "6 Years",
    phone: "9876543216",
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    bio: "Master technician for double door frost-free refrigerators, front load washing machines, and induction microwaves.",
    skills: ["Refrigerator Compressor Gas", "Washing Machine Drum & Motor", "Microwave Magnetron Fix", "Water Purifier RO Membrane"],
    isAvailable: true,
    hourlyRate: 449,
    visitingFee: 149,
    cooperativeSociety: "Delhi National Artisans & Skilled Workers Cooperative Federation",
    cooperativeMemberId: "DNAS-2022-140",
    kycStatus: "VERIFIED",
    certifications: [
      { name: "Consumer Electronics & Appliances Technician", issuer: "ESSCI Skill India", year: "2018", verified: true, certNumber: "ESSCI-AP-891" },
    ],
    welfareSchemes: [
      "Pradhan Mantri Suraksha Bima Yojana",
      "Cooperative Micro-Enterprise Protection Fund",
    ],
    todayEarnings: 1350,
    totalEarnings: 82100,
    welfareContribution: 2463,
    emergencySupported: true,
    trustBreakdown: { identityVerified: true, ratingHigh: true, jobsThreshold: true, onTimeRecord: true, coopCertified: true },
  },
  {
    id: "12",
    name: "Lexi Grover",
    occupation: "Women Grooming, Wellness & Salon Pro",
    category: "salon",
    rating: 4.9,
    jobsCompleted: 205,
    trustScore: 99,
    badge: "Top Rated",
    location: "Mohali Phase 7",
    experience: "7 Years",
    phone: "9876543212",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    bio: "Cooperative salon specialist offering hygienic doorstep spa therapy, facial rejuvenation, and bridal makeup.",
    skills: ["Bridal Makeup", "Aroma Spa Therapy", "Hair Treatment & Styling", "Skin Rejuvenation"],
    isAvailable: true,
    hourlyRate: 599,
    visitingFee: 149,
    cooperativeSociety: "Punjab Technicians & Domestic Caregiver Cooperative Union",
    cooperativeMemberId: "PTCU-2020-008",
    kycStatus: "VERIFIED",
    certifications: [
      { name: "Beauty & Wellness Sector Skill Council Master Trainer", issuer: "B&WSSC India", year: "2017", verified: true, certNumber: "BWSSC-SL-102" },
    ],
    welfareSchemes: [
      "Pradhan Mantri Jeevan Jyoti Bima Yojana",
      "Pradhan Mantri Suraksha Bima Yojana",
      "Women Cooperative Self-Reliant Grant",
    ],
    todayEarnings: 1800,
    totalEarnings: 128000,
    welfareContribution: 3840,
    emergencySupported: false,
    trustBreakdown: { identityVerified: true, ratingHigh: true, jobsThreshold: true, onTimeRecord: true, coopCertified: true },
  }
];

export const DEFAULT_WORKERS = INITIAL_WORKERS;

// ── AI Demand Forecasting Seasonal Dataset (SIH26089 Feature 14) ─────────────
export const DEMAND_FORECAST_DATA: DemandForecastPoint[] = [
  {
    month: "April - June",
    season: "Summer Surge",
    category: "ac",
    categoryLabel: "Air Conditioning & Refrigerator",
    projectedDemandPercent: 68,
    surgeRisk: "CRITICAL",
    drivers: "Intense heat waves, inverter AC compressor overload, coolant gas leaks, and refrigerator continuous cooling strain.",
    recommendedAction: "Mobilize 35 standby cooperative AC technicians across North Zone. Stock 120 cylinders of R32 coolant gas in district warehouses.",
    additionalWorkersNeeded: 35,
  },
  {
    month: "July - September",
    season: "Monsoon Influx",
    category: "plumber",
    categoryLabel: "Plumbing, Drainage & Waterproofing",
    projectedDemandPercent: 82,
    surgeRisk: "CRITICAL",
    drivers: "Roof water logging, basement back-up, storm drain clogs, sewage overflow, and electrical earthing shorts.",
    recommendedAction: "Set up 24/7 Rapid Monsoon SOS squads. Deploy emergency suction pump units with trained cooperative plumbers.",
    additionalWorkersNeeded: 42,
  },
  {
    month: "July - September",
    season: "Monsoon Influx",
    category: "electrician",
    categoryLabel: "Electrical Safety & Earthing",
    projectedDemandPercent: 54,
    surgeRisk: "HIGH",
    drivers: "Rain moisture causing main MCB tripping, voltage fluctuations, transformer earthing faults, and water contact leakage.",
    recommendedAction: "Conduct community transformer checks with Municipal Cooperatives. Keep 20 wiremen on 15-minute emergency standby.",
    additionalWorkersNeeded: 22,
  },
  {
    month: "October - November",
    season: "Diwali & Festive Season",
    category: "painter",
    categoryLabel: "Home Painting & Aesthetics",
    projectedDemandPercent: 95,
    surgeRisk: "CRITICAL",
    drivers: "Annual pre-Diwali home renovation, exterior weather-coat repainting, festive touch-ups, and interior royal sheen coatings.",
    recommendedAction: "Issue advance pre-booking calendar via Cooperative Society. Distribute spray machines on cooperative tool microfinance.",
    additionalWorkersNeeded: 60,
  },
  {
    month: "October - November",
    season: "Diwali & Festive Season",
    category: "cleaning",
    categoryLabel: "Deep Sanitation & Festival Prep",
    projectedDemandPercent: 78,
    surgeRisk: "HIGH",
    drivers: "Festive deep kitchen cleaning, sofa dry-cleaning, chimney degreasing, and post-monsoon sanitation.",
    recommendedAction: "Organize cooperative deep-cleaning brigades with mechanized scrubbers and eco-friendly organic sanitizers.",
    additionalWorkersNeeded: 45,
  },
  {
    month: "December - February",
    season: "Winter Maintenance",
    category: "appliances",
    categoryLabel: "Geysers & Water Heaters",
    projectedDemandPercent: 50,
    surgeRisk: "MEDIUM",
    drivers: "Water heater coil burnout, thermostat failure, geyser tank scaling, and room heater coil repairs.",
    recommendedAction: "Procure standard geyser heating elements at bulk wholesale cooperative discounts for faster repairs.",
    additionalWorkersNeeded: 18,
  },
];

export const BRAND_HELPLINES: BrandHelpline[] = [
  {
    id: "b-1",
    name: "Samsung",
    category: "Consumer Electronics & Appliances",
    tollFreeNumber: "1800407267864",
    whatsappNumber: "91180057267864",
    website: "https://www.samsung.com/in/support/",
    supportedAppliance: "Smart TVs, Refrigerators, Washing Machines, Air Conditioners",
    logoBg: "bg-blue-600",
    hours: "24/7 Toll Free Support",
  },
  {
    id: "b-2",
    name: "LG Electronics",
    category: "Home Appliances & Entertainment",
    tollFreeNumber: "18003159999",
    whatsappNumber: "919711709999",
    website: "https://www.lg.com/in/support",
    supportedAppliance: "OLED TVs, Dual Inverter ACs, Washing Machines, Microwaves",
    logoBg: "bg-red-600",
    hours: "8 AM - 8 PM Daily",
  },
  {
    id: "b-3",
    name: "Whirlpool",
    category: "Refrigeration & Laundry",
    tollFreeNumber: "18002081800",
    whatsappNumber: "919667418800",
    website: "https://www.whirlpoolindia.com/support",
    supportedAppliance: "Refrigerators, Washing Machines, Dishwashers, Water Purifiers",
    logoBg: "bg-amber-600",
    hours: "9 AM - 7 PM Daily",
  },
  {
    id: "b-4",
    name: "Voltas",
    category: "Air Conditioning & Cooling",
    tollFreeNumber: "18602334555",
    whatsappNumber: "919873498888",
    website: "https://www.voltas.com/customer-care",
    supportedAppliance: "Split ACs, Window ACs, Air Coolers, Commercial Refrigerators",
    logoBg: "bg-sky-600",
    hours: "24/7 Helpline",
  },
  {
    id: "b-5",
    name: "Havells & Lloyd",
    category: "Electricals & Home Appliances",
    tollFreeNumber: "18001031313",
    whatsappNumber: "919711773333",
    website: "https://www.havells.com/support",
    supportedAppliance: "Geysers, Fans, Switchgear, Lloyd ACs, LED Lighting",
    logoBg: "bg-indigo-600",
    hours: "8 AM - 8 PM",
  },
  {
    id: "b-6",
    name: "Crompton",
    category: "Pumps, Lighting & Fans",
    tollFreeNumber: "18004190505",
    whatsappNumber: "917208080505",
    website: "https://www.crompton.co.in/support",
    supportedAppliance: "Ceiling Fans, Submersible Water Pumps, Water Heaters",
    logoBg: "bg-teal-600",
    hours: "9 AM - 6 PM (Mon-Sat)",
  },
  {
    id: "b-7",
    name: "Godrej Appliances",
    category: "Home & Office Appliances",
    tollFreeNumber: "18002095511",
    whatsappNumber: "919321665511",
    website: "https://www.godrej.com/godrej-appliances/support",
    supportedAppliance: "Refrigerators, Washing Machines, Deep Freezers, ACs",
    logoBg: "bg-purple-600",
    hours: "8 AM - 8 PM Daily",
  },
];

export const INITIAL_MECHANICS: OnRoadMechanic[] = [
  {
    id: "m-1",
    name: "Verma 24x7 Tyre Puncture & Stepney Works",
    ownerName: "Rajesh Verma",
    category: "puncture",
    distanceKm: 1.2,
    rating: 4.8,
    reviewsCount: 184,
    visitingFee: 199,
    phone: "9876543220",
    location: "Sector 17 Highway Touch, Chandigarh",
    servicesOffered: ["Tubeless Tyre Repair", "Stepney Replacement", "Air Pressure & Valve Fix"],
    is24x7: true,
    avatarUrl: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=150&auto=format&fit=crop&q=80",
    estimatedArrivalMins: 12,
  },
  {
    id: "m-2",
    name: "Apex 24/7 Car Battery Jumpstart & Electricals",
    ownerName: "Harpreet Singh",
    category: "battery",
    distanceKm: 0.8,
    rating: 4.9,
    reviewsCount: 230,
    visitingFee: 149,
    phone: "9876543221",
    location: "Tribune Chowk Signal, Chandigarh",
    servicesOffered: ["Booster Jumpstart", "Battery Voltage Testing", "Emergency Terminal Replacement"],
    is24x7: true,
    avatarUrl: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=150&auto=format&fit=crop&q=80",
    estimatedArrivalMins: 10,
  },
  {
    id: "m-3",
    name: "Speedo Flatbed Towing & Crane Recovery Services",
    ownerName: "Vikram Malhotra",
    category: "towing",
    distanceKm: 3.1,
    rating: 4.7,
    reviewsCount: 96,
    visitingFee: 299,
    phone: "9876543222",
    location: "Kharar Highway Flyover, Mohali",
    servicesOffered: ["Hydraulic Flatbed Tow", "Wheel-Lift Towing", "Accident Vehicle Extraction"],
    is24x7: true,
    avatarUrl: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=150&auto=format&fit=crop&q=80",
    estimatedArrivalMins: 20,
  },
  {
    id: "m-4",
    name: "Express Highway Car Engine Breakdown & Mechanical Garage",
    ownerName: "Sunil Kumar",
    category: "mechanical",
    distanceKm: 1.8,
    rating: 4.8,
    reviewsCount: 155,
    visitingFee: 249,
    phone: "9876543223",
    location: "Phase 7 Industrial Area, Mohali",
    servicesOffered: ["Radiator Coolant Overheat Fix", "Clutch Cable Repair", "Brake Fluid & Belt Repair"],
    is24x7: false,
    avatarUrl: "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=150&auto=format&fit=crop&q=80",
    estimatedArrivalMins: 15,
  },
  {
    id: "m-5",
    name: "QuickFuel Highway Emergency Petrol & Diesel Service",
    ownerName: "Gurdeep Dhillon",
    category: "fuel",
    distanceKm: 2.2,
    rating: 4.9,
    reviewsCount: 312,
    visitingFee: 179,
    phone: "9876543224",
    location: "Zirakpur Flyover Exit, Chandigarh",
    servicesOffered: ["5L Diesel Emergency Canister", "5L Petrol Delivery", "Fuel Line Air Purge"],
    is24x7: true,
    avatarUrl: "https://images.unsplash.com/photo-1527018601619-a508a2be00d6?w=150&auto=format&fit=crop&q=80",
    estimatedArrivalMins: 14,
  },
];

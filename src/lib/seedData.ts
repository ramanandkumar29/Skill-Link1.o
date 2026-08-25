export interface WorkerProfile {
  id: string;
  name: string;
  occupation: string;
  category: "plumber" | "electrician" | "mason" | "salon" | "ac" | "cleaning" | "appliances";
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
  audioSnippetUrl?: string;
  trustBreakdown?: {
    identityVerified: boolean;
    ratingHigh: boolean;
    jobsThreshold: boolean;
    onTimeRecord: boolean;
  };
}

export type Worker = WorkerProfile;

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
  serviceType: string;
  bookingDate: string;
  status: "Pending" | "Confirmed" | "In-Progress" | "Completed";
  visitFeePaid: boolean;
  visitFeeAmount: number;
  finalBillAmount?: number;
  completionPhotoUrl?: string;
  emergencySos?: boolean;
}

export const INITIAL_WORKERS: WorkerProfile[] = [
  {
    id: "1",
    name: "Ramanand",
    occupation: "Master Plumber",
    category: "plumber",
    rating: 4.9,
    jobsCompleted: 120,
    trustScore: 98,
    badge: "Legendary",
    location: "Chandigarh Central",
    experience: "6 Years",
    phone: "9876543210",
    avatarUrl: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80",
    avatar: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80",
    bio: "Master plumber specializing in bathroom fittings, leak detectors, and solar heater repairs.",
    skills: ["Pipe Leakage", "Bathroom Fitting", "Water Tank Cleaning"],
    isAvailable: true,
    hourlyRate: 349,
    trustBreakdown: { identityVerified: true, ratingHigh: true, jobsThreshold: true, onTimeRecord: true }
  },
  {
    id: "2",
    name: "Imran",
    occupation: "Senior Mason",
    category: "mason",
    rating: 4.7,
    jobsCompleted: 85,
    trustScore: 92,
    badge: "Expert",
    location: "Sector 17, Chandigarh",
    experience: "5 Years",
    phone: "9876543211",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    bio: "Certified civil mason specializing in tile laying, granite cutting, and plaster repairs.",
    skills: ["Tile Laying", "Wall Plastering", "Granite Fitting"],
    isAvailable: true,
    hourlyRate: 450,
    trustBreakdown: { identityVerified: true, ratingHigh: true, jobsThreshold: true, onTimeRecord: true }
  },
  {
    id: "3",
    name: "Lexi",
    occupation: "Women's Salon & Grooming",
    category: "salon",
    rating: 4.9,
    jobsCompleted: 200,
    trustScore: 99,
    badge: "Top Rated",
    location: "Mohali Phase 7",
    experience: "7 Years",
    phone: "9876543212",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    bio: "Professional salon specialist offering spa, bridal makeup, hair styling, and skin therapy.",
    skills: ["Bridal Makeup", "Spa Therapy", "Hair Styling"],
    isAvailable: true,
    hourlyRate: 599,
    trustBreakdown: { identityVerified: true, ratingHigh: true, jobsThreshold: true, onTimeRecord: true }
  },
  {
    id: "4",
    name: "Anil",
    occupation: "Certified Electrician",
    category: "electrician",
    rating: 4.5,
    jobsCompleted: 50,
    trustScore: 88,
    badge: "Verified",
    location: "Panchkula",
    experience: "4 Years",
    phone: "9876543213",
    avatarUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80",
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80",
    bio: "Licensed electrician specializing in short-circuit detection, MCB panel installation, and wiring.",
    skills: ["Short Circuit Fix", "MCB Tripping", "Wiring"],
    isAvailable: true,
    hourlyRate: 299,
    trustBreakdown: { identityVerified: true, ratingHigh: true, jobsThreshold: true, onTimeRecord: false }
  },
  {
    id: "5",
    name: "Shubham Kumar",
    occupation: "AC Repair & Servicing Specialist",
    category: "ac",
    rating: 4.8,
    jobsCompleted: 95,
    trustScore: 95,
    badge: "Expert",
    location: "Sector 22, Chandigarh",
    experience: "5 Years",
    phone: "9876543214",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    bio: "HVAC expert for split AC gas refill, jet pump cleaning, and copper pipe welding.",
    skills: ["AC Gas Refill", "Jet Pump Service", "Compressor Repair"],
    isAvailable: true,
    hourlyRate: 399,
    trustBreakdown: { identityVerified: true, ratingHigh: true, jobsThreshold: true, onTimeRecord: true }
  },
  {
    id: "6",
    name: "Nitish Kumar",
    occupation: "Home Deep Cleaning & Sanitation",
    category: "cleaning",
    rating: 4.6,
    jobsCompleted: 70,
    trustScore: 90,
    badge: "Verified",
    location: "Zirakpur",
    experience: "3 Years",
    phone: "9876543215",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    bio: "Sanitation professional providing eco-friendly deep kitchen, bathroom, and sofa shampooing.",
    skills: ["Deep Kitchen Clean", "Sofa Shampoo", "Bathroom Sanitization"],
    isAvailable: true,
    hourlyRate: 499,
    trustBreakdown: { identityVerified: true, ratingHigh: true, jobsThreshold: true, onTimeRecord: true }
  },
  {
    id: "7",
    name: "Sontu Kumar Rana",
    occupation: "Refrigerator & Home Appliances Technician",
    category: "appliances",
    rating: 4.9,
    jobsCompleted: 110,
    trustScore: 97,
    badge: "Top Rated",
    location: "Mohali Phase 3B2",
    experience: "6 Years",
    phone: "9876543216",
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    bio: "Master technician for double door refrigerators, washing machines, and microwave ovens.",
    skills: ["Refrigerator Gas", "Washing Machine Motor", "Microwave Repair"],
    isAvailable: true,
    hourlyRate: 449,
    trustBreakdown: { identityVerified: true, ratingHigh: true, jobsThreshold: true, onTimeRecord: true }
  }
];

export const DEFAULT_WORKERS = INITIAL_WORKERS;

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
    name: "Verma Auto Care & Emergency Repair",
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
    name: "Apex 24/7 Battery Jumpstart Rescue",
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
    name: "Speedo Flatbed Towing & Crane Squad",
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
    name: "Express Mobile Engine & Mechanical Repair",
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
    name: "QuickFuel On-Demand Highway Tanker",
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


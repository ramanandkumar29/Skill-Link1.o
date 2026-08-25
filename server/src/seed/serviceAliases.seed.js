/**
 * Multilingual Natural Language & Slang Expression Mappings
 * Maps natural user queries across English, Hindi, Hinglish, and Romanized colloquial typing.
 */

const SERVICE_ALIASES_MAP = [
  // 1. BIKE REPAIR
  {
    serviceId: "bike_repair",
    category: "bike_repair",
    patterns: [
      "bike kharab", "bike kharab h", "bike kharab ho gyi", "bike kharab ho gayi",
      "bike start nahi ho rahi", "bike start nhi hori", "bike start nahi horhi",
      "bike band ho gyi", "bike band ho gayi", "bike raste mein band", "bike raste me band",
      "bike mein problem", "bike me problem", "bike repair karwani", "bike repair wala",
      "bike mechanic chahiye", "mujhe bike mechanic", "bike ka engine problem",
      "bike puncture", "bike ka tyre", "bike nahi chal rahi", "bike chal nahi rahi",
      "motorcycle kharab", "scooty kharab", "activa start nahi", "activa servicing",
      "scooter kharab", "scooter repair", "two wheeler mechanic", "two wheeler repair"
    ]
  },

  // 2. CAR REPAIR & MECHANIC
  {
    serviceId: "car_repair",
    category: "mechanic_car",
    patterns: [
      "car kharab", "car kharab h", "car kharab ho gyi", "car kharab ho gayi",
      "car start nahi ho rahi", "car start nhi hori", "car start nahi horhi",
      "car band ho gayi", "car band ho gyi", "car breakdown", "car mechanic chahiye",
      "car repair karwani", "car me problem", "gadi kharab", "gadi start nahi ho rahi",
      "gadi band ho gayi", "gadi ka mechanic", "car heating problem", "car engine smoke",
      "brake fail car", "clutch hard car", "four wheeler mechanic"
    ]
  },

  // 3. EMERGENCY ROADSIDE ASSISTANCE
  {
    serviceId: "emergency_roadside",
    category: "emergency_roadside",
    patterns: [
      "highway par fasa", "highway breakdown", "road par phas gaya", "highway pe car band",
      "roadside assistance", "battery jumpstart chahiye", "car jumpstart", "gadi jumpstart",
      "towing crane chahiye", "car towing", "flatbed towing", "puncture on highway"
    ]
  },

  // 4. PLUMBER / PLUMBING
  {
    serviceId: "plumbing",
    category: "plumber",
    patterns: [
      "tap leak", "nal leak", "pipe leak", "paani leak", "water leakage",
      "plumber chahiye", "plumber bhej do", "nal toot gaya", "tap repair",
      "nal tapak raha", "tap tapak raha", "pipe burst", "ghar me paani bhar raha",
      "sink block", "bathroom drainage block", "water motor nahi chal rahi",
      "water tank overflow", "commode flush kharab", "sanitaryware repair"
    ]
  },

  // 5. ELECTRICIAN / ELECTRICAL
  {
    serviceId: "electrician",
    category: "electrician",
    patterns: [
      "electrician chahiye", "electrician bhej do", "bijli wala", "light problem",
      "switch kharab", "switchboard spark", "spark aa raha", "mcb trip ho raha",
      "mcb gir gayi", "fan kharab", "ceiling fan nahi chal raha", "wiring jal gayi",
      "electricity problem", "current lag raha", "short circuit ho gaya", "inverter repair"
    ]
  },

  // 6. AC REPAIR
  {
    serviceId: "ac_repair",
    category: "ac",
    patterns: [
      "ac kharab", "ac thanda nahi kar raha", "ac cooling nahi kar raha", "ac cooling nhi kr rha",
      "ac repair", "ac mechanic", "ac service", "ac jet service", "ac gas charge",
      "ac se paani tapak raha", "split ac service", "window ac repair", "ac on nahi ho raha"
    ]
  },

  // 7. REFRIGERATOR / FRIDGE
  {
    serviceId: "refrigerator_repair",
    category: "refrigerator_repair",
    patterns: [
      "fridge kharab", "fridge thanda nahi kar raha", "fridge cooling nahi kar raha",
      "refrigerator repair", "freezer me baraf", "fridge mechanic", "fridge compressor",
      "fridge me current", "fridge on nahi ho raha"
    ]
  },

  // 8. WASHING MACHINE
  {
    serviceId: "washing_machine_repair",
    category: "washing_machine_repair",
    patterns: [
      "washing machine kharab", "washing machine paani nahi nikal rahi", "washing machine drain problem",
      "drum rotate nahi ho raha", "spin nahi ho raha", "washing machine aawaz kar rahi",
      "washing machine repair", "washer dryer mechanic"
    ]
  },

  // 9. TV REPAIR
  {
    serviceId: "tv_repair",
    category: "tv_repair",
    patterns: [
      "tv kharab", "tv on nahi ho raha", "led tv repair", "smart tv screen lines",
      "tv me aawaz aa rahi picture nahi", "tv backlight kharab", "tv display kharab"
    ]
  },

  // 10. MOBILE REPAIR
  {
    serviceId: "mobile_repair",
    category: "mobile_repair",
    patterns: [
      "phone kharab", "mobile repair", "screen toot gayi", "display toot gaya",
      "phone touch nahi chal raha", "phone charge nahi ho raha", "mobile charging jack",
      "phone battery replace", "smartphone mechanic"
    ]
  },

  // 11. COMPUTER & LAPTOP
  {
    serviceId: "computer_repair",
    category: "computer_repair",
    patterns: [
      "laptop kharab", "computer problem", "pc repair", "laptop repair",
      "computer technician", "laptop on nahi ho raha", "blue screen error",
      "laptop slow chal raha", "ssd lagwani hai", "laptop keyboard kharab"
    ]
  },

  // 12. RO & WATER PURIFIER
  {
    serviceId: "ro_repair",
    category: "ro_repair",
    patterns: [
      "ro kharab", "water purifier kharab", "ro se paani nahi aa raha",
      "ro filter change", "ro membrane replace", "kent ro repair",
      "aquaguard service", "ro paani ka taste kharab"
    ]
  },

  // 13. CARPENTER
  {
    serviceId: "carpenter",
    category: "carpenter",
    patterns: [
      "carpenter chahiye", "badhai chahiye", "door lock kharab", "darwaza jam",
      "furniture repair", "bed assembly", "wardrobe repair", "kitchen hinge loose"
    ]
  },

  // 14. PAINTER
  {
    serviceId: "painter",
    category: "painter",
    patterns: [
      "painter chahiye", "painting karwani", "wall paint", "putty karwani",
      "ghar me paint", "deewar pe seelan", "waterproofing karwani"
    ]
  },

  // 15. HOME CLEANING
  {
    serviceId: "home_cleaning",
    category: "cleaning",
    patterns: [
      "ghar saaf karwana", "home cleaning", "deep cleaning", "sofa cleaning",
      "bathroom cleaning", "kitchen deep clean", "safai wala chahiye"
    ]
  },

  // 16. CCTV CAMERA
  {
    serviceId: "cctv_service",
    category: "cctv_service",
    patterns: [
      "cctv camera kharab", "cctv installation", "camera lagwana hai",
      "cctv video loss", "dvr record nahi kar raha", "security camera technician"
    ]
  },

  // 17. WIFI & INTERNET
  {
    serviceId: "wifi_technician",
    category: "wifi_technician",
    patterns: [
      "wifi problem", "internet nahi chal raha", "router disconnect ho raha",
      "wifi range badhani", "lan cable lagwani", "broadband technician"
    ]
  }
];

function matchServiceFromText(text = "") {
  const norm = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

  for (const item of SERVICE_ALIASES_MAP) {
    for (const pattern of item.patterns) {
      if (norm.includes(pattern) || pattern.includes(norm)) {
        return {
          serviceId: item.serviceId,
          category: item.category,
          matchedPattern: pattern
        };
      }
    }
  }

  // Token fuzzy search
  const tokens = norm.split(/\s+/).filter(t => t.length > 2);
  for (const item of SERVICE_ALIASES_MAP) {
    for (const pattern of item.patterns) {
      const pTokens = pattern.split(/\s+/);
      const allMatch = pTokens.every(pt => tokens.some(t => t.includes(pt) || pt.includes(t)));
      if (allMatch && pTokens.length > 1) {
        return {
          serviceId: item.serviceId,
          category: item.category,
          matchedPattern: pattern
        };
      }
    }
  }

  return null;
}

module.exports = {
  SERVICE_ALIASES_MAP,
  matchServiceFromText
};

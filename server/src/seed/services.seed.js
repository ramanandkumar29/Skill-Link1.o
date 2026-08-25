/**
 * Skill-Link Comprehensive 20-Service Catalog Seed
 */

const SEEDED_SERVICES = [
  {
    serviceId: "bike_repair",
    categoryId: "automotive",
    name: "Bike Repair & Two-Wheeler Service",
    nameHi: "बाइक रिपेयर और सर्विस",
    description: "Doorstep and on-road two-wheeler mechanics for engine problems, starting trouble, brake adjustment, carburettor tuning, and chain tightening.",
    keywords: ["bike", "motorcycle", "scooter", "scooty", "activa", "splendor", "pulsar", "two wheeler", "two-wheeler", "engine oil", "clutch", "brake"],
    commonProblems: [
      "Bike start nahi ho rahi",
      "Bike chalte chalte band ho gayi",
      "Clutch wire toot gayi",
      "Engine se abnormal sound aa rahi hai",
      "Brake fail ya loose hai",
      "Two wheeler tuning aur oil service"
    ],
    relatedServices: ["puncture_repair", "battery_jumpstart", "emergency_roadside"],
    urgencyPossible: ["normal", "urgent", "emergency"],
    baseVisitFee: 149,
    estimatedLaborFee: 249
  },
  {
    serviceId: "car_repair",
    categoryId: "automotive",
    name: "Car Repair & Multi-Brand Service",
    nameHi: "कार रिपेयर और मैकेनिक",
    description: "Certified automobile mechanics for petrol, diesel, and CNG cars covering engine diagnostics, brake pad overhaul, radiator coolant, and suspension repair.",
    keywords: ["car", "gadi", "automobile", "four wheeler", "engine", "radiator", "brake pad", "clutch plate", "steering", "gearbox"],
    commonProblems: [
      "Car start nahi ho rahi",
      "Engine overheating ho raha hai",
      "Clutch hard ya slip ho raha hai",
      "Brake sound aa rahi hai",
      "Gadi dhuwa (smoke) chhod rahi hai",
      "Regular periodic car service"
    ],
    relatedServices: ["emergency_roadside", "battery_jumpstart", "towing_service"],
    urgencyPossible: ["normal", "urgent", "emergency"],
    baseVisitFee: 199,
    estimatedLaborFee: 399
  },
  {
    serviceId: "mechanic",
    categoryId: "automotive",
    name: "General Automobile Mechanic",
    nameHi: "ऑटोमोबाइल मैकेनिक",
    description: "Universal automotive technician for on-spot vehicle troubleshooting, mechanical checks, and emergency road assistance.",
    keywords: ["mechanic", "mistry", "gadi wala", "automobile expert", "motor mechanic"],
    commonProblems: [
      "Vehicle breakdown",
      "Strange mechanical noises",
      "Exhaust issues",
      "Fluid leaks"
    ],
    relatedServices: ["bike_repair", "car_repair", "emergency_roadside"],
    urgencyPossible: ["normal", "urgent", "emergency"],
    baseVisitFee: 199,
    estimatedLaborFee: 349
  },
  {
    serviceId: "electrician",
    categoryId: "home_trade",
    name: "Certified Electrician",
    nameHi: "इलेक्ट्रीशियन / बिजली मिस्त्री",
    description: "Licensed electricians for home and office wiring, short circuit recovery, MCB breaker trips, ceiling fans, switchboard installations, and inverter setups.",
    keywords: ["electrician", "bijli", "wiring", "short circuit", "spark", "mcb", "switch", "socket", "light", "fan", "inverter", "fuse"],
    commonProblems: [
      "Switchboard se spark aa raha hai",
      "Ghar ki light chali gayi par padosi ki hai",
      "MCB baar baar trip ho raha hai",
      "Ceiling fan nahi ghum raha",
      "Inverter battery backup nahi de raha",
      "New switch socket lagwana hai"
    ],
    relatedServices: ["appliance_repair", "cctv_service"],
    urgencyPossible: ["normal", "urgent", "emergency"],
    baseVisitFee: 149,
    estimatedLaborFee: 299
  },
  {
    serviceId: "plumbing",
    categoryId: "home_trade",
    name: "Master Plumber & Pipe Specialist",
    nameHi: "प्लम्बर / नल व पाइप मिस्त्री",
    description: "Expert plumbing services for concealed wall leaks, tap drippings, pipe bursts, bathroom sanitaryware, water tank cleaning, and pressure booster pumps.",
    keywords: ["plumber", "plumbing", "pipe", "tap", "nal", "leak", "leakage", "tank", "water motor", "drainage", "commode", "flush", "washbasin", "sink"],
    commonProblems: [
      "Tap/Nal lagatar tapak (leak) raha hai",
      "Main pipe burst ho gaya aur paani beh raha hai",
      "Bathroom ya kitchen sink drain block ho gaya",
      "Water motor pump chal raha hai par paani nahi chadha raha",
      "Concealed wall se seelan aur water leakage aa rahi hai",
      "New tap ya sanitaryware install karwana hai"
    ],
    relatedServices: ["ro_repair", "home_cleaning"],
    urgencyPossible: ["normal", "urgent", "emergency"],
    baseVisitFee: 149,
    estimatedLaborFee: 249
  },
  {
    serviceId: "ac_repair",
    categoryId: "appliances",
    name: "AC Repair & HVAC Technician",
    nameHi: "एसी रिपेयर और सर्विस",
    description: "Split and window AC experts for high-pressure jet cleaning, gas leak detection, compressor capacitor replacement, PCB repair, and cooling optimization.",
    keywords: ["ac", "air conditioner", "split ac", "window ac", "cooling", "gas charge", "freon", "compressor", "jet service", "hvac"],
    commonProblems: [
      "AC chal raha hai par cooling nahi kar raha",
      "AC se paani tapak raha hai indoor unit se",
      "AC gas charge karwana hai",
      "AC start hote hi MCB trip kar deta hai",
      "AC jet pump deep service karwani hai",
      "AC outdoor unit fan nahi chal raha"
    ],
    relatedServices: ["refrigerator_repair", "electrician"],
    urgencyPossible: ["normal", "urgent"],
    baseVisitFee: 199,
    estimatedLaborFee: 399
  },
  {
    serviceId: "refrigerator_repair",
    categoryId: "appliances",
    name: "Refrigerator & Deep Fridge Repair",
    nameHi: "फ्रिज रिपेयर",
    description: "Single, double door, and side-by-side refrigerator servicing for cooling coil issues, thermostat faults, relay replacement, and gas charging.",
    keywords: ["fridge", "refrigerator", "deep freezer", "cooling coil", "thermostat", "fridge gas", "defrost"],
    commonProblems: [
      "Fridge thanda nahi kar raha",
      "Freezer me baraf jam rahi hai par niche thanda nahi hai",
      "Fridge compressor se click sound aa rahi hai",
      "Fridge body current de rahi hai",
      "Water leakage under the fridge"
    ],
    relatedServices: ["ac_repair", "appliance_repair"],
    urgencyPossible: ["normal", "urgent"],
    baseVisitFee: 149,
    estimatedLaborFee: 349
  },
  {
    serviceId: "washing_machine_repair",
    categoryId: "appliances",
    name: "Washing Machine Repair",
    nameHi: "वाशिंग मशीन रिपेयर",
    description: "Automatic, front load, and top load washing machine repair covering drum spin issues, drain pump blockages, drive belt, motor, and PCB board faults.",
    keywords: ["washing machine", "washer", "dryer", "spin", "drum", "drain pump", "front load", "top load"],
    commonProblems: [
      "Washing machine paani drain nahi kar rahi",
      "Drum rotate ya spin nahi ho raha",
      "Spin cycle me bahut zyada vibration aur aawaz ho rahi hai",
      "Washing machine on nahi ho rahi",
      "Water inlet valve se paani nahi aa raha"
    ],
    relatedServices: ["appliance_repair", "plumbing"],
    urgencyPossible: ["normal", "urgent"],
    baseVisitFee: 149,
    estimatedLaborFee: 349
  },
  {
    serviceId: "tv_repair",
    categoryId: "electronics",
    name: "LED/Smart TV Repair",
    nameHi: "टीवी रिपेयर",
    description: "Display panel repair, backlight replacement, sound board repair, HDMI port fixes, and wall-mount installation for smart LEDs.",
    keywords: ["tv", "television", "led tv", "smart tv", "display", "screen", "backlight", "sound", "hdmi"],
    commonProblems: [
      "TV me aawaz aa rahi hai par picture nahi aa rahi (backlight issue)",
      "TV screen par horizontal/vertical lines aa gayi hain",
      "TV on nahi ho raha (power supply fault)",
      "LED TV wall mount fitting karwani hai"
    ],
    relatedServices: ["cctv_service", "computer_repair"],
    urgencyPossible: ["normal"],
    baseVisitFee: 149,
    estimatedLaborFee: 299
  },
  {
    serviceId: "mobile_repair",
    categoryId: "electronics",
    name: "Mobile Phone & Tablet Repair",
    nameHi: "मोबाइल रिपेयर",
    description: "Doorstep smartphone screen display replacement, battery swap, charging jack repair, mic/speaker fixing, and water damage recovery.",
    keywords: ["mobile", "phone", "smartphone", "iphone", "android", "display", "touch screen", "battery", "charging port", "jack"],
    commonProblems: [
      "Phone ki screen toot gayi hai touch kaam nahi kar raha",
      "Phone charge nahi ho raha jack loose hai",
      "Phone battery jaldi drain ho rahi hai",
      "Speaker se aawaz nahi aa rahi ya mic kharab hai",
      "Phone paani me gir gaya tha on nahi ho raha"
    ],
    relatedServices: ["computer_repair"],
    urgencyPossible: ["normal", "urgent"],
    baseVisitFee: 99,
    estimatedLaborFee: 249
  },
  {
    serviceId: "computer_repair",
    categoryId: "electronics",
    name: "Laptop & PC Computer Repair",
    nameHi: "लैपटॉप और कंप्यूटर रिपेयर",
    description: "Hardware repairs, SSD upgrade, RAM expansion, OS formatting, blue screen troubleshooting, laptop hinge repair, and keyboard replacement.",
    keywords: ["laptop", "computer", "pc", "desktop", "macbook", "windows", "ssd", "ram", "blue screen", "keyboard", "hinge", "thermal paste"],
    commonProblems: [
      "Laptop on nahi ho raha bilkul dead hai",
      "Laptop screen blue screen error de rahi hai",
      "Laptop bahut slow chal raha hai SSD lagwani hai",
      "Laptop ka keyboard ya touchpad kaam nahi kar raha",
      "Laptop heating ho raha hai fan aawaz kar raha hai"
    ],
    relatedServices: ["wifi_technician", "cctv_service"],
    urgencyPossible: ["normal", "urgent"],
    baseVisitFee: 149,
    estimatedLaborFee: 349
  },
  {
    serviceId: "carpenter",
    categoryId: "home_trade",
    name: "Master Carpenter & Woodwork",
    nameHi: "कारपेंटर / बढ़ई",
    description: "Custom carpentry, door lock repairs, modular kitchen channel & hinge alignment, bed assembly, and wardrobe wood repairs.",
    keywords: ["carpenter", "woodwork", "furniture", "door lock", "hinge", "drawer", "wardrobe", "bed", "kitchen cabinet", "badhai"],
    commonProblems: [
      "Door lock jam ho gaya ya kharab hai",
      "Modular kitchen hydraulic hinges loose hain",
      "New furniture ya bed assemble karwana hai",
      "Darwaza atak raha hai floor par touch ho raha hai"
    ],
    relatedServices: ["mason_service", "painter_service"],
    urgencyPossible: ["normal", "urgent"],
    baseVisitFee: 149,
    estimatedLaborFee: 299
  },
  {
    serviceId: "painter",
    categoryId: "home_trade",
    name: "Professional House Painter",
    nameHi: "पेंटर / रंगाई-पुताई",
    description: "Interior and exterior wall painting, waterproof wall putty, texture coating, dampness treatment, and door varnish.",
    keywords: ["painter", "painting", "wall paint", "putty", "distemper", "texture", "waterproofing", "dampness", "varnish"],
    commonProblems: [
      "Deewar par seelan (dampness) aur paint chhoot raha hai",
      "Ek room ya poore ghar me fresh paint karwana hai",
      "Wall putty aur touchup repair chahiye"
    ],
    relatedServices: ["mason_service", "home_cleaning"],
    urgencyPossible: ["normal"],
    baseVisitFee: 199,
    estimatedLaborFee: 499
  },
  {
    serviceId: "home_cleaning",
    categoryId: "cleaning",
    name: "Professional Home & Deep Cleaning",
    nameHi: "होम डीप क्लीनिंग",
    description: "Mechanized deep cleaning for full houses, kitchen chimney degreasing, bathroom tile scaling, sofa & carpet shampooing.",
    keywords: ["cleaning", "deep cleaning", "sofa cleaning", "bathroom cleaning", "kitchen cleaning", "carpet shampoo", "floor scrubbing"],
    commonProblems: [
      "New flat shift hone se pehle deep cleaning karwani hai",
      "Sofa aur mattress shampoo dry cleaning",
      "Bathroom tiles ke hard water stains hatane hain",
      "Kitchen oil and grease deep clean"
    ],
    relatedServices: ["plumbing", "painter"],
    urgencyPossible: ["normal"],
    baseVisitFee: 299,
    estimatedLaborFee: 799
  },
  {
    serviceId: "appliance_repair",
    categoryId: "appliances",
    name: "General Appliance Repair",
    nameHi: "घरेलू उपकरण रिपेयर",
    description: "Microwave ovens, water geysers, induction cooktops, room heaters, and kitchen chimneys.",
    keywords: ["appliance", "geyser", "microwave", "chimney", "induction", "heater", "iron", "mixer grinder"],
    commonProblems: [
      "Geyser paani garam nahi kar raha",
      "Microwave me heating nahi ho rahi",
      "Kitchen chimney aawaz kar rahi hai suction kam hai"
    ],
    relatedServices: ["electrician", "ro_repair"],
    urgencyPossible: ["normal", "urgent"],
    baseVisitFee: 149,
    estimatedLaborFee: 299
  },
  {
    serviceId: "ro_repair",
    categoryId: "appliances",
    name: "RO & Water Purifier Service",
    nameHi: "आरओ वॉटर प्यूरीफायर सर्विस",
    description: "RO membrane replacement, carbon & sediment filter change, booster pump repair, TDS calibration, and UV lamp fixes.",
    keywords: ["ro", "water purifier", "filter", "membrane", "tds", "kent", "aquaguard", "livpure"],
    commonProblems: [
      "RO se paani nahi aa raha bilkul",
      "RO paani ka taste badal gaya hai TDS high hai",
      "RO lagatar beep sound kar raha hai filter change alarm",
      "RO waste water lagatar beh raha hai band nahi ho raha"
    ],
    relatedServices: ["plumbing", "appliance_repair"],
    urgencyPossible: ["normal", "urgent"],
    baseVisitFee: 149,
    estimatedLaborFee: 249
  },
  {
    serviceId: "cctv_service",
    categoryId: "security",
    name: "CCTV Installation & Repair",
    nameHi: "सीसीटीवी कैमरा इंस्टालेशन",
    description: "HD & IP security camera installation, DVR/NVR hard disk configuration, mobile live-view setup, and wire fault fixing.",
    keywords: ["cctv", "camera", "security camera", "dvr", "nvr", "ip camera", "night vision", "surveillance"],
    commonProblems: [
      "CCTV camera me video loss aa raha hai",
      "DVR hard disk record nahi kar rahi",
      "Mobile par live CCTV camera view connect karna hai",
      "New CCTV camera installation karwana hai"
    ],
    relatedServices: ["wifi_technician", "electrician"],
    urgencyPossible: ["normal"],
    baseVisitFee: 199,
    estimatedLaborFee: 449
  },
  {
    serviceId: "wifi_technician",
    categoryId: "networking",
    name: "Internet & WiFi Router Technician",
    nameHi: "इंटरनेट और वाईफाई टेक्नीशियन",
    description: "Home WiFi dead zone elimination, mesh router configuration, LAN cable crimping, router security, and bandwidth optimization.",
    keywords: ["wifi", "internet", "router", "broadband", "lan cable", "optical fiber", "network", "mesh wifi"],
    commonProblems: [
      "WiFi signal dusre room me nahi aa raha range badhani hai",
      "Router bar bar disconnect ho raha hai",
      "LAN wiring aur Ethernet cable lagwani hai"
    ],
    relatedServices: ["computer_repair", "cctv_service"],
    urgencyPossible: ["normal", "urgent"],
    baseVisitFee: 149,
    estimatedLaborFee: 249
  },
  {
    serviceId: "electric_appliance",
    categoryId: "appliances",
    name: "Electric Appliance Repair",
    nameHi: "इलेक्ट्रिक अप्लायंस रिपेयर",
    description: "Inverter, UPS, voltage stabilizer, mixer grinder, and heavy electric tools maintenance.",
    keywords: ["stabilizer", "inverter repair", "ups", "mixer", "grinder", "power tools"],
    commonProblems: [
      "Voltage stabilizer output voltage nahi de raha",
      "Mixer grinder chalte chalte dhua chhod diya",
      "Heavy appliance sparking"
    ],
    relatedServices: ["electrician", "appliance_repair"],
    urgencyPossible: ["normal"],
    baseVisitFee: 149,
    estimatedLaborFee: 249
  },
  {
    serviceId: "emergency_roadside",
    categoryId: "automotive",
    name: "Emergency Roadside Assistance & SOS",
    nameHi: "इमरजेंसी रोडसाइड असिस्टेंस",
    description: "24/7 priority highway and local roadside breakdown dispatch: battery jumpstart, flat tyre repair, emergency fuel delivery, and flatbed towing.",
    keywords: ["roadside assistance", "sos", "breakdown", "highway fasa", "jumpstart", "puncture", "towing", "emergency help"],
    commonProblems: [
      "Car/Bike highway par achanak band ho gayi",
      "Battery dead ho gayi jumpstart chahiye",
      "Tyre puncture ho gaya stepney nahi hai",
      "Car accident ya mechanical lock ho gayi towing crane chahiye"
    ],
    relatedServices: ["car_repair", "bike_repair"],
    urgencyPossible: ["urgent", "emergency"],
    baseVisitFee: 249,
    estimatedLaborFee: 499
  }
];

module.exports = { SEEDED_SERVICES };

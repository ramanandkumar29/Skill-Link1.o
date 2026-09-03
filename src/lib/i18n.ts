export type LanguageCode = "en" | "hi" | "pa" | "bn" | "ta";

export interface TranslationStrings {
  appName: string;
  tagline: string;
  ministryLabel: string;
  roleCustomer: string;
  roleWorker: string;
  roleAdmin: string;
  searchPlaceholder: string;
  speakVoice: string;
  allServices: string;
  electrician: string;
  plumber: string;
  carpenter: string;
  painter: string;
  cleaner: string;
  driver: string;
  gardener: string;
  caregiver: string;
  technician: string;
  verifiedCoopMember: string;
  trustScore: string;
  bookNow: string;
  viewProfile: string;
  whyRecommended: string;
  emergencySos: string;
  emergencyDesc: string;
  welfareFundLabel: string;
  demandForecastTitle: string;
  onlineStatus: string;
  acceptJob: string;
  rejectJob: string;
  earningsPassbook: string;
  todayEarnings: string;
  welfareCess: string;
  netPayout: string;
  kycPending: string;
  kycVerified: string;
}

export const TRANSLATIONS: Record<LanguageCode, TranslationStrings> = {
  en: {
    appName: "Skill-Link",
    tagline: "AI-Powered Cooperative Platform for Household & Community Services",
    ministryLabel: "Supported under Ministry of Cooperation • SIH26089",
    roleCustomer: "Customer Portal",
    roleWorker: "Worker Portal",
    roleAdmin: "Cooperative Admin",
    searchPlaceholder: "Search for Electrician, Plumber, Carpenter, Driver, Caregiver...",
    speakVoice: "Speak / आवाज़",
    allServices: "All Services",
    electrician: "Electrician",
    plumber: "Plumber",
    carpenter: "Carpenter",
    painter: "Painter",
    cleaner: "Deep Cleaning",
    driver: "Driver",
    gardener: "Gardener",
    caregiver: "Caregiver",
    technician: "AC & Appliances",
    verifiedCoopMember: "Cooperative Member",
    trustScore: "Trust Score",
    bookNow: "Book Service",
    viewProfile: "View Profile",
    whyRecommended: "Why Recommended",
    emergencySos: "Emergency Utility SOS",
    emergencyDesc: "15-minute priority dispatch for critical home & roadside utility breakdowns.",
    welfareFundLabel: "3% Cooperative Welfare Pool",
    demandForecastTitle: "AI Demand Forecasting",
    onlineStatus: "Ready for Jobs (Online)",
    acceptJob: "Accept Job",
    rejectJob: "Decline",
    earningsPassbook: "Earnings & Welfare Passbook",
    todayEarnings: "Today's Gross",
    welfareCess: "Coop Welfare (3%)",
    netPayout: "Net Payout",
    kycPending: "Verification Pending",
    kycVerified: "Cooperative Verified",
  },
  hi: {
    appName: "स्किल-लिंक",
    tagline: "घरेलू और सामुदायिक सेवाओं के लिए एआई-संचालित सहकारी मंच",
    ministryLabel: "सहकारिता मंत्रालय समर्थित • SIH26089",
    roleCustomer: "ग्राहक पोर्टल",
    roleWorker: "श्रमिक पोर्टल",
    roleAdmin: "सहकारी समिति एडमिन",
    searchPlaceholder: "इलेक्ट्रीशियन, प्लंबर, बढ़ई, पेंटर, ड्राइवर खोजें...",
    speakVoice: "बोलकर खोजें",
    allServices: "सभी सेवाएं",
    electrician: "इलेक्ट्रीशियन",
    plumber: "प्लंबर (नलसाज)",
    carpenter: "बढ़ई (कारपेंटर)",
    painter: "पेंटर (रंगाई)",
    cleaner: "सफाई कर्मी",
    driver: "ड्राइवर",
    gardener: "माली",
    caregiver: "देखभाल सहायक",
    technician: "एसी व उपकरण मैकेनिक",
    verifiedCoopMember: "प्रमाणित सहकारी सदस्य",
    trustScore: "विश्वास स्कोर",
    bookNow: "बुक करें",
    viewProfile: "प्रोफ़ाइल देखें",
    whyRecommended: "सिफारिश का कारण",
    emergencySos: "आपातकालीन सेवा (SOS)",
    emergencyDesc: "गंभीर खराबी के लिए 15 मिनट में तत्काल कारीगर सहायता।",
    welfareFundLabel: "3% सहकारी श्रमिक कल्याण कोष",
    demandForecastTitle: "एआई मांग पूर्वानुमान",
    onlineStatus: "कार्य के लिए तैयार (ऑनलाइन)",
    acceptJob: "कार्य स्वीकार करें",
    rejectJob: "अस्वीकार करें",
    earningsPassbook: "कमाई और कल्याण पासबुक",
    todayEarnings: "आज की कुल कमाई",
    welfareCess: "सहकारी कल्याण (3%)",
    netPayout: "शुद्ध भुगतान",
    kycPending: "सत्यापन लंबित",
    kycVerified: "सहकारी प्रमाणित",
  },
  pa: {
    appName: "ਸਕਿੱਲ-ਲਿੰਕ",
    tagline: "ਘਰੇਲੂ ਅਤੇ ਭਾਈਚਾਰਕ ਸੇਵਾਵਾਂ ਲਈ ਏਆਈ-ਸੰਚਾਲਿਤ ਸਹਿਕਾਰੀ ਪਲੇਟਫਾਰਮ",
    ministryLabel: "ਸਹਿਕਾਰਤਾ ਮੰਤਰਾਲਾ ਸਮਰਥਿਤ • SIH26089",
    roleCustomer: "ਗਾਹਕ ਪੋਰਟਲ",
    roleWorker: "ਕਾਰੀਗਰ ਪੋਰਟਲ",
    roleAdmin: "ਸਹਿਕਾਰੀ ਸੁਸਾਇਟੀ ਐਡਮਿਨ",
    searchPlaceholder: "ਬਿਜਲੀ ਮਿਸਤਰੀ, ਪਲੰਬਰ, ਤਰਖਾਣ, ਡਰਾਈਵਰ ਲੱਭੋ...",
    speakVoice: "ਬੋਲ ਕੇ ਲੱਭੋ",
    allServices: "ਸਾਰੀਆਂ ਸੇਵਾਵਾਂ",
    electrician: "ਬਿਜਲੀ ਮਿਸਤਰੀ",
    plumber: "ਪਲੰਬਰ",
    carpenter: "ਤਰਖਾਣ",
    painter: "ਪੇਂਟਰ",
    cleaner: "ਸਫ਼ਾਈ ਸੇਵਾ",
    driver: "ਡਰਾਈਵਰ",
    gardener: "ਮਾਲੀ",
    caregiver: "ਦੇਖਭਾਲ ਕਰਤਾ",
    technician: "ਏਸੀ ਅਤੇ ਉਪਕਰਣ ਮਿਸਤਰੀ",
    verifiedCoopMember: "ਪ੍ਰਮਾਣਿਤ ਸਹਿਕਾਰੀ ਮੈਂਬਰ",
    trustScore: "ਭਰੋਸਾ ਸਕੋਰ",
    bookNow: "ਬੁੱਕ ਕਰੋ",
    viewProfile: "ਪ੍ਰੋਫਾਈਲ ਵੇਖੋ",
    whyRecommended: "ਸਿਫਾਰਸ਼ ਦਾ ਕਾਰਨ",
    emergencySos: "ਐਮਰਜੈਂਸੀ ਸੇਵਾ (SOS)",
    emergencyDesc: "ਜ਼ਰੂਰੀ ਮੁਰੰਮਤ ਲਈ 15 ਮਿੰਟ ਵਿੱਚ ਤੁਰੰਤ ਮਦਦ।",
    welfareFundLabel: "3% ਸਹਿਕਾਰੀ ਭਲਾਈ ਫੰਡ",
    demandForecastTitle: "ਏਆਈ ਮੰਗ ਅਨੁਮਾਨ",
    onlineStatus: "ਕੰਮ ਲਈ ਤਿਆਰ (ਆਨਲਾਈਨ)",
    acceptJob: "ਕੰਮ ਸਵੀਕਾਰ ਕਰੋ",
    rejectJob: "ਅਸਵੀਕਾਰ ਕਰੋ",
    earningsPassbook: "ਕਮਾਈ ਅਤੇ ਭਲਾਈ ਪਾਸਬੁੱਕ",
    todayEarnings: "ਅੱਜ ਦੀ ਕੁੱਲ ਕਮਾਈ",
    welfareCess: "ਸਹਿਕਾਰੀ ਭਲਾਈ (3%)",
    netPayout: "ਕੁੱਲ ਭੁਗਤਾਨ",
    kycPending: "ਪੜਤਾਲ ਬਕਾਇਆ",
    kycVerified: "ਸਹਿਕਾਰੀ ਪ੍ਰਮਾਣਿਤ",
  },
  bn: {
    appName: "স্কিল-লিঙ্ক",
    tagline: "পারিবারিক এবং সম্প্রদায়ের সেবার জন্য এআই-চালিত সমবায় প্ল্যাটফর্ম",
    ministryLabel: "সমবায় মন্ত্রক দ্বারা সমর্থিত • SIH26089",
    roleCustomer: "গ্রাহক পোর্টাল",
    roleWorker: "শ্রমিক পোর্টাল",
    roleAdmin: "সমবায় সমিতি অ্যাডমিন",
    searchPlaceholder: "ইলেকট্রিশিয়ান, প্লাম্বার, ছুতার, ড্রাইভার খুঁজুন...",
    speakVoice: "কথা বলে খুঁজুন",
    allServices: "সমস্ত পরিষেবা",
    electrician: "ইলেকট্রিশিয়ান",
    plumber: "প্লাম্বার",
    carpenter: "ছুতার",
    painter: "রংমিস্ত্রি",
    cleaner: "পরিচ্ছন্নতাকর্মী",
    driver: "ড্রাইভার",
    gardener: "মালী",
    caregiver: "সেবাকারী",
    technician: "এসি ও যন্ত্রপাতি টেকনিশিয়ান",
    verifiedCoopMember: "যাচাইকৃত সমবায় সদস্য",
    trustScore: "বিশ্বাসযোগ্যতা স্কোর",
    bookNow: "বুক করুন",
    viewProfile: "প্রোফাইল দেখুন",
    whyRecommended: "সুপারিশের কারণ",
    emergencySos: "জরুরি সেবা (SOS)",
    emergencyDesc: "জরুরি গৃহস্থালি সমস্যার জন্য ১৫ মিনিটে দ্রুত কারিগর।",
    welfareFundLabel: "৩% সমবায় শ্রমিক কল্যাণ তহবিল",
    demandForecastTitle: "এআই চাহিদা পূর্বাভাস",
    onlineStatus: "কাজের জন্য প্রস্তুত (অনলাইন)",
    acceptJob: "কাজ গ্রহণ করুন",
    rejectJob: "প্রত্যাখ্যান",
    earningsPassbook: "উপার্জন ও কল্যাণ পাসবুক",
    todayEarnings: "আজকের উপার্জন",
    welfareCess: "সমবায় কল্যাণ (৩%)",
    netPayout: "চূড়ান্ত প্রদেয়",
    kycPending: "যাচাইকরণ বাকি",
    kycVerified: "সমবায় যাচাইকৃত",
  },
  ta: {
    appName: "ஸ்கில்-லிங்க்",
    tagline: "வீட்டு மற்றும் சமூக சேவைகளுக்கான கூட்டுறவு தளம்",
    ministryLabel: "கூட்டுறவு அமைச்சக ஆதரவு • SIH26089",
    roleCustomer: "வாடிக்கையாளர் தளம்",
    roleWorker: "பணியாளர் தளம்",
    roleAdmin: "கூட்டுறவு நிர்வாகி",
    searchPlaceholder: "எலக்ட்ரீஷியன், பிளம்பர், தச்சர், ஓட்டுநர் தேடவும்...",
    speakVoice: "பேசி தேடவும்",
    allServices: "அனைத்து சேவைகள்",
    electrician: "மின் பணியாளர்",
    plumber: "குழாய் பழுதுபார்ப்பவர்",
    carpenter: "தச்சர்",
    painter: "வர்ணம் பூசுபவர்",
    cleaner: "துப்புரவு பணியாளர்",
    driver: "ஓட்டுநர்",
    gardener: "தோட்டக்காரர்",
    caregiver: "பராமரிப்பாளர்",
    technician: "ஏசி & உபகரண தொழில்நுட்ப வல்லுநர்",
    verifiedCoopMember: "சரிபார்க்கப்பட்ட கூட்டுறவு உறுப்பினர்",
    trustScore: "நம்பகத்தன்மை மதிப்பீடு",
    bookNow: "முன்பதிவு செய்",
    viewProfile: "விவரக்குறிப்பு காண்க",
    whyRecommended: "பரிந்துரைக்கப்பட்ட காரணம்",
    emergencySos: "அவசர சேவை (SOS)",
    emergencyDesc: "அவசர வீட்டுப் பழுதுகளுக்கு 15 நிமிடங்களில் உதவி.",
    welfareFundLabel: "3% கூட்டுறவு நல நிதி",
    demandForecastTitle: "AI தேவை முன்கணிப்பு",
    onlineStatus: "பணிக்கு தயார் (ஆன்லைன்)",
    acceptJob: "பணியை ஏற்றுக்கொள்",
    rejectJob: "நிராகரி",
    earningsPassbook: "வருமானம் & நல பாஸ்புக்",
    todayEarnings: "இன்றைய வருமானம்",
    welfareCess: "கூட்டுறவு நலன் (3%)",
    netPayout: "நிகர பணம்",
    kycPending: "சரிபார்ப்பு நிலுவையில்",
    kycVerified: "கூட்டுறவு சரிபார்க்கப்பட்டது",
  },
};

export const LANGUAGES = [
  { code: "en" as const, label: "English", flag: "🇬🇧" },
  { code: "hi" as const, label: "हिन्दी (Hindi)", flag: "🇮🇳" },
  { code: "pa" as const, label: "ਪੰਜਾਬੀ (Punjabi)", flag: "🇮🇳" },
  { code: "bn" as const, label: "বাংলা (Bengali)", flag: "🇮🇳" },
  { code: "ta" as const, label: "தமிழ் (Tamil)", flag: "🇮🇳" },
];

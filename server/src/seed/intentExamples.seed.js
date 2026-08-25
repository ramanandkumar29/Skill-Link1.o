/**
 * Seeded Intent Examples Dataset (14 Intent Categories)
 */

const SEEDED_INTENTS = [
  {
    intent: "conversation",
    description: "Casual conversation, small talk, check-ins, greetings, jokes, without booking services.",
    examples: [
      "hi", "hello", "hey", "namaste", "kaise ho", "kya haal hai", "mai bhi thik hu",
      "sab badhiya", "aur batao", "kya chal raha hai", "kuch nahi", "tell me a joke",
      "i am bored", "my brother is an electrician", "thanks", "thank you", "bye", "alvida"
    ]
  },
  {
    intent: "skill_link_question",
    description: "Questions regarding how Skill-Link works, its features, pricing guarantees, or future vision.",
    examples: [
      "What is Skill-Link?", "Skill-Link kya hai?", "How does Skill-Link work?",
      "Kaise kaam karta hai?", "What is the future of Skill-Link?", "Skill-Link ka future kya hai?",
      "Are workers verified?", "What is the visiting fee?"
    ]
  },
  {
    intent: "service_request",
    description: "User indicates a real-world home, vehicle, electronics, or appliance maintenance requirement.",
    examples: [
      "mere bike kharab ho gayi hai mujhe worker chahiye", "meri bike start nahi ho rahi",
      "mujhe plumber chahiye", "tap leak kar raha hai", "switchboard se spark aa raha hai",
      "electrician chahiye", "AC thanda nahi kar raha", "laptop blue screen error",
      "washing machine paani nahi nikal rahi", "RO se paani nahi aa raha"
    ]
  },
  {
    intent: "worker_search",
    description: "User explicitly wants to find and review available technicians near a specific location.",
    examples: [
      "mere paas koi electrician available hai?", "Sector 17 mein plumbers dhoondo",
      "find mechanics near Chandigarh", "nearby workers dikhao"
    ]
  },
  {
    intent: "worker_details",
    description: "User requests detailed profile, skills, ratings, and price breakdown for a specific worker.",
    examples: [
      "Raj ke baare mein batao", "Ramanand mechanic ki rating kya hai?",
      "Worker profile dikhao", "How much does Vikram plumber charge?"
    ]
  },
  {
    intent: "availability_check",
    description: "User checks if a specific worker is online or available at a preferred time.",
    examples: [
      "Raj kal subah available hai?", "Is the mechanic available right now?",
      "Can the electrician come today evening?"
    ]
  },
  {
    intent: "booking_request",
    description: "User expresses intent to book a selected worker.",
    examples: [
      "Raj ko book karna hai", "I want to book this plumber",
      "Ramanand mechanic ko mere location par bhej do"
    ]
  },
  {
    intent: "booking_confirmation",
    description: "User gives explicit confirmation to proceed with the verified booking.",
    examples: [
      "haan book kar do", "yes proceed with booking", "confirm booking", "theek hai book kardo"
    ]
  },
  {
    intent: "booking_status",
    description: "User inquires about an existing booking ID or arrival status.",
    examples: [
      "meri booking ka kya hua?", "where is my mechanic?", "check status of BK-1001",
      "booking status batao"
    ]
  },
  {
    intent: "booking_cancellation",
    description: "User wants to cancel an active booking before arrival.",
    examples: [
      "booking cancel karni hai", "cancel my booking", "technician mat bhejo",
      "cancel order #BK-1001"
    ]
  },
  {
    intent: "emergency_service",
    description: "Critical safety, highway breakdown, or sudden flooding requiring immediate 15-20 min dispatch.",
    examples: [
      "meri car highway par band ho gayi", "short circuit se aag lagne ka khatra hai",
      "pipe burst ho gaya ghar me paani bhar raha", "urgent roadside breakdown help"
    ]
  },
  {
    intent: "complaint",
    description: "Feedback or dispute regarding service quality, rework warranty, or worker conduct.",
    examples: [
      "worker late aaya", "kaam theek se nahi kiya", "same pipe dobara leak ho raha hai 7 day rework chahiye"
    ]
  },
  {
    intent: "general_question",
    description: "General technical, coding, or educational inquiry (ChatGPT-like non-marketplace response).",
    examples: [
      "what is javascript", "what is python", "explain object oriented programming", "capital of france"
    ]
  }
];

module.exports = { SEEDED_INTENTS };

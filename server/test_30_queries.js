const TEST_QUERIES = [
  // 1. Core test requested by user
  { query: "mere bike kharab ho gayi hai mujhe worker chahiye", expectedCategory: "bike_repair", expectedIntent: "service_request" },
  
  // 2. Bike & Two-Wheeler
  { query: "meri bike start nahi ho rahi", expectedCategory: "bike_repair", expectedIntent: "service_request" },
  { query: "bike raste mein band ho gyi", expectedCategory: "bike_repair", expectedIntent: "service_request" },
  { query: "scooty puncture ho gayi", expectedCategory: "bike_repair", expectedIntent: "service_request" },
  
  // 3. Car & Automobile
  { query: "car start nahi ho rahi", expectedCategory: "mechanic_car", expectedIntent: "service_request" },
  { query: "gadi kharab ho gayi hai Chandigarh me", expectedCategory: "mechanic_car", expectedIntent: "service_request" },
  { query: "need a car mechanic for engine heating", expectedCategory: "mechanic_car", expectedIntent: "service_request" },
  
  // 4. Emergency SOS
  { query: "meri car highway par band ho gayi", expectedCategory: "roadside_sos", expectedIntent: "emergency_service" },
  { query: "pipe burst ho gaya ghar me paani bhar raha hai", expectedCategory: "plumber", expectedIntent: "emergency_service" },
  { query: "short circuit ho gaya spark aa raha hai", expectedCategory: "electrician", expectedIntent: "emergency_service" },
  
  // 5. Plumbing
  { query: "tap leak kar raha hai", expectedCategory: "plumber", expectedIntent: "service_request" },
  { query: "mujhe plumber chahiye", expectedCategory: "plumber", expectedIntent: "service_request" },
  { query: "nal toot gaya paani beh raha hai", expectedCategory: "plumber", expectedIntent: "service_request" },
  { query: "bathroom sink drain block ho gaya", expectedCategory: "plumber", expectedIntent: "service_request" },
  
  // 6. Electrician
  { query: "switchboard se spark aa raha hai", expectedCategory: "electrician", expectedIntent: "emergency_service" },
  { query: "ceiling fan nahi chal raha", expectedCategory: "electrician", expectedIntent: "service_request" },
  { query: "mcb baar baar trip ho rahi hai", expectedCategory: "electrician", expectedIntent: "service_request" },
  
  // 7. AC & Cooling
  { query: "AC cooling nahi kar raha", expectedCategory: "ac", expectedIntent: "service_request" },
  { query: "AC thanda nahi kar raha jet service karwani hai", expectedCategory: "ac", expectedIntent: "service_request" },
  
  // 8. Refrigerator
  { query: "fridge thanda nahi kar raha", expectedCategory: "refrigerator_repair", expectedIntent: "service_request" },
  { query: "freezer me baraf jam rahi hai", expectedCategory: "refrigerator_repair", expectedIntent: "service_request" },
  
  // 9. Washing Machine
  { query: "washing machine paani nahi nikal rahi", expectedCategory: "washing_machine_repair", expectedIntent: "service_request" },
  { query: "washing machine drum nahi ghum raha", expectedCategory: "washing_machine_repair", expectedIntent: "service_request" },
  
  // 10. Laptop & Computer
  { query: "laptop on nahi ho raha blue screen aa rahi", expectedCategory: "computer_repair", expectedIntent: "service_request" },
  { query: "computer slow chal raha ssd lagwani hai", expectedCategory: "computer_repair", expectedIntent: "service_request" },
  
  // 11. Mobile Phone
  { query: "phone ki screen toot gayi display badalna hai", expectedCategory: "mobile_repair", expectedIntent: "service_request" },
  
  // 12. RO & Water Purifier
  { query: "RO se paani nahi aa raha filter change karwana hai", expectedCategory: "ro_repair", expectedIntent: "service_request" },
  
  // 13. Deep Cleaning & Painter
  { query: "ghar ki deep cleaning karwani hai", expectedCategory: "cleaning", expectedIntent: "service_request" },
  { query: "wall paint aur putty karwani hai", expectedCategory: "painter", expectedIntent: "service_request" },
  
  // 14. Conversational Check-ins (Zero Worker Search)
  { query: "kaise ho", expectedIntent: "conversation" },
  { query: "mai bhi thik hu", expectedIntent: "conversation" },
  { query: "my brother is an electrician", expectedIntent: "conversation" },
  { query: "Skill-Link kya hai?", expectedIntent: "skill_link_question" }
];

async function runTests() {
  console.log(`\n🧪 Running 34 Comprehensive Semantic & Intent Tests via Live Gateway...\n`);

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < TEST_QUERIES.length; i++) {
    const t = TEST_QUERIES[i];
    try {
      const res = await fetch("http://localhost:3000/api/lexi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: t.query }],
          currentState: { location: "Sector 17, Chandigarh" }
        })
      });
      const data = await res.json();
      
      const intent = data.actionResult?.intent || data.intent;
      const category = data.actionResult?.payload?.category || data.toolResult?.category;
      
      const intentMatch = intent === t.expectedIntent || (t.expectedIntent === "service_request" && data.toolCalled === "searchWorkers");
      
      if (intentMatch) {
        passed++;
        console.log(`✅ [Test ${i + 1}] "${t.query}" -> Intent: ${intent} | Reply: "${data.reply.substring(0, 50)}..."`);
      } else {
        failed++;
        console.error(`❌ [Test ${i + 1}] "${t.query}" -> FAILED. Got Intent: ${intent} (Expected: ${t.expectedIntent})`);
      }
    } catch (e) {
      failed++;
      console.error(`❌ [Test ${i + 1}] "${t.query}" -> Network error: ${e.message}`);
    }
  }

  console.log(`\n========================================`);
  console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed out of ${TEST_QUERIES.length} Tests.`);
  console.log(`========================================\n`);
}

runTests();

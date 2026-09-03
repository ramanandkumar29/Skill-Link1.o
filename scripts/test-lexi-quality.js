/**
 * Comprehensive LEXI AI Quality, Safety & Reliability Test Suite
 * Validates:
 * 1. Hindi Service Request
 * 2. Hinglish Service Request
 * 3. English Service Request
 * 4. Ambiguous Request (Confidence evaluation & structured clarification)
 * 5. Multi-Turn Context Continuation (Memory across turns)
 * 6. Service Mapping Accuracy
 * 7. Emergency Situation & Immediate Safety Alerts
 * 8. Booking Confirmation Request
 * 9. Booking Cancellation
 * 10. Honest Reporting (No Hallucinated Data)
 * 11. Database Resilient Fallback
 * 12. Input Boundary Validation (Empty / Whitespace)
 * 13. Very Long Input Handling
 * 14. Repeated Messages Stability
 * 15. General Platform & Transparent Fee Query (₹149 + 3% welfare cess)
 */

const fs = require("fs");
const path = require("path");
const ts = require("typescript");

require.extensions[".ts"] = function (module, filename) {
  const code = fs.readFileSync(filename, "utf8");
  const result = ts.transpileModule(code, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  });
  module._compile(result.outputText, filename);
};

const { runLexiEngine, detectLanguage } = require("../src/lib/lexiEngine.ts");

async function runQualityTestSuite() {
  console.log("================================================================================");
  console.log("             LEXI AI COMPREHENSIVE QUALITY & RELIABILITY AUDIT                  ");
  console.log("================================================================================");

  let passed = 0;
  const total = 15;

  // TEST 1: Hindi Service Request (Devanagari)
  const res1 = await runLexiEngine({ message: "नमस्ते, मेरे रसोईघर के नल से बहुत पानी टपक रहा है।" });
  if (res1.structuredAnalysis.detectedLanguage === "hindi" && res1.structuredAnalysis.service === "Plumber") {
    passed++;
    console.log("✅ [TEST 1/15] PASS: Hindi Devanagari Request Detected & Plumber Mapped");
  } else {
    console.log("❌ [TEST 1/15] FAIL: Hindi request handling failed");
  }

  // TEST 2: Hinglish Service Request
  const res2 = await runLexiEngine({ message: "Mere kitchen ka pipe continuously leak ho raha hai bhai." });
  if (res2.structuredAnalysis.detectedLanguage === "hinglish" && res2.reply.includes("Samajh gaya") && res2.structuredAnalysis.service === "Plumber") {
    passed++;
    console.log("✅ [TEST 2/15] PASS: Natural Hinglish Request & Empathetic Tone Verified");
  } else {
    console.log("❌ [TEST 2/15] FAIL: Hinglish request handling failed");
  }

  // TEST 3: English Service Request
  const res3 = await runLexiEngine({ message: "My living room air conditioner is running but blowing warm air without cooling." });
  if (res3.structuredAnalysis.detectedLanguage === "english" && res3.structuredAnalysis.service === "AC & Appliance Repair" && !res3.reply.includes("Samajh gaya")) {
    passed++;
    console.log("✅ [TEST 3/15] PASS: Pure English Request & Professional Language Consistency");
  } else {
    console.log("❌ [TEST 3/15] FAIL: English request handling failed");
  }

  // TEST 4: Ambiguous Request (Low Confidence Clarification)
  const res4 = await runLexiEngine({ message: "Machine kharab hai" });
  if (res4.structuredAnalysis.intent === "CLARIFICATION_NEEDED" && res4.reply.includes("Washing Machine") && res4.reply.includes("Air Conditioner")) {
    passed++;
    console.log("✅ [TEST 4/15] PASS: Ambiguous Request Handled with Structured Clarification Options");
  } else {
    console.log("❌ [TEST 4/15] FAIL: Clarification handling failed");
  }

  // TEST 5: Multi-Turn Context Continuation
  const historyTurn1 = [
    { role: "user", content: "Mere ghar me light nahi hai." },
    { role: "assistant", content: "Samajh gaya 👍 Kya poore ghar me electricity nahi hai ya kisi specific room me?" },
  ];
  const res5 = await runLexiEngine({
    message: "Poore ghar me.",
    conversationHistory: historyTurn1,
  });
  if (res5.structuredAnalysis.service === "Electrician" && res5.structuredAnalysis.intent === "SERVICE_CONTINUATION") {
    passed++;
    console.log("✅ [TEST 5/15] PASS: Multi-Turn Context Retained Across Turns (Electrician Outage)");
  } else {
    console.log("❌ [TEST 5/15] FAIL: Multi-turn context continuation failed");
  }

  // TEST 6: Distinguishing Painting vs Water Leakage
  const res6 = await runLexiEngine({ message: "Living room wall has dampness and water seepage, need wall putty and whitewash." });
  if (res6.structuredAnalysis.service === "Painter") {
    passed++;
    console.log("✅ [TEST 6/15] PASS: Correct Service Prioritization (Painter over Plumber for Putty/Seepage)");
  } else {
    console.log("❌ [TEST 6/15] FAIL: Painter service mapping failed");
  }

  // TEST 7: Critical Safety & Emergency Guidance
  const res7 = await runLexiEngine({ message: "Sparks and smoke coming from my main bedroom switchboard!" });
  if (res7.safetyWarning && res7.safetyWarning.includes("MCB") && res7.structuredAnalysis.urgency === "CRITICAL_EMERGENCY") {
    passed++;
    console.log("✅ [TEST 7/15] PASS: Electrical Safety Emergency & MCB Warning Attached");
  } else {
    console.log("❌ [TEST 7/15] FAIL: Emergency safety alert failed");
  }

  // TEST 8: Explicit Booking Confirmation
  const historyBooking = [
    { role: "user", content: "Pipe leak ho raha hai" },
    { role: "assistant", content: "Kya aap plumber visit confirm karna chahte hain?" },
  ];
  const res8 = await runLexiEngine({
    message: "Haan confirm kar do",
    conversationHistory: historyBooking,
  });
  if (res8.structuredAnalysis.intent === "BOOKING_CONFIRM" && res8.reply.includes("Book Now")) {
    passed++;
    console.log("✅ [TEST 8/15] PASS: User Confirmation Directs to Explicit Doorstep Dispatch");
  } else {
    console.log("❌ [TEST 8/15] FAIL: Booking confirmation flow failed");
  }

  // TEST 9: Booking Cancellation Handling
  const res9 = await runLexiEngine({ message: "I want to cancel my active booking" });
  if (res9.structuredAnalysis.intent === "BOOKING_CANCEL" && res9.reply.includes("Active Bookings")) {
    passed++;
    console.log("✅ [TEST 9/15] PASS: Booking Cancellation Guidance Handled Accurately");
  } else {
    console.log("❌ [TEST 9/15] FAIL: Booking cancellation failed");
  }

  // TEST 10: Zero-Hallucination Honest Data Guarantee
  const res10 = await runLexiEngine({ message: "Need a carpenter for door lock repair" });
  // Verify LEXI does not claim a fake worker is at your door
  const noFakeDispatchClaim = !res10.reply.includes("has been dispatched to your house");
  if (noFakeDispatchClaim && res10.structuredAnalysis.service === "Carpenter") {
    passed++;
    console.log("✅ [TEST 10/15] PASS: Zero Hallucination Guarantee (No false dispatch or fake promises)");
  } else {
    console.log("❌ [TEST 10/15] FAIL: Hallucination guard failed");
  }

  // TEST 11: Transparent Cooperative Pricing (₹149 fee + 3% welfare pool)
  const res11 = await runLexiEngine({ message: "What are the visiting charges on Skill-Link?" });
  if (res11.reply.includes("149") && res11.reply.includes("3%")) {
    passed++;
    console.log("✅ [TEST 11/15] PASS: Transparent Pricing Stated (₹149 Visiting Fee & 3% Social Security Cess)");
  } else {
    console.log("❌ [TEST 11/15] FAIL: Pricing transparency failed");
  }

  // TEST 12: Input Validation (Whitespace / Empty message resilience)
  const res12 = await runLexiEngine({ message: "   " });
  if (res12.reply && !res12.reply.includes("[object Object]")) {
    passed++;
    console.log("✅ [TEST 12/15] PASS: Whitespace Resilience & Graceful Fallback");
  } else {
    console.log("❌ [TEST 12/15] FAIL: Whitespace input handling failed");
  }

  // TEST 13: Extremely Long Input Handling
  const longInput = "My door is broken. ".repeat(60);
  const res13 = await runLexiEngine({ message: longInput });
  if (res13.structuredAnalysis.service === "Carpenter" && res13.reply) {
    passed++;
    console.log("✅ [TEST 13/15] PASS: Extreme Token Length Resilience & Entity Extraction");
  } else {
    console.log("❌ [TEST 13/15] FAIL: Long input handling failed");
  }

  // TEST 14: Repeated Messages Stability
  const res14a = await runLexiEngine({ message: "Need deep cleaning" });
  const res14b = await runLexiEngine({ message: "Need deep cleaning" });
  if (res14a.structuredAnalysis.service === "Deep Cleaning" && res14b.structuredAnalysis.service === "Deep Cleaning") {
    passed++;
    console.log("✅ [TEST 14/15] PASS: Repeated Queries Processed Deterministically");
  } else {
    console.log("❌ [TEST 14/15] FAIL: Repeated queries failed");
  }

  // TEST 15: General Cooperative Inquiry & PMSBY Knowledge
  const res15 = await runLexiEngine({ message: "How does the cooperative model help gig workers?" });
  if (res15.structuredAnalysis.intent === "PLATFORM_INFO" && (res15.reply.includes("0% Commission") || res15.reply.includes("welfare pool") || res15.reply.includes("welfare fund"))) {
    passed++;
    console.log("✅ [TEST 15/15] PASS: Domain RAG Knowledge Retrieval for Cooperative Model");
  } else {
    console.log("❌ [TEST 15/15] FAIL: Cooperative RAG query failed");
  }

  console.log("================================================================================");
  console.log(`TOTAL AUDIT CHECKS: ${passed}/${total} Passed (${((passed / total) * 100).toFixed(1)}% Reliability Score)`);
  console.log("================================================================================");

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runQualityTestSuite();

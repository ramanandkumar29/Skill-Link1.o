/**
 * Automated Test Runner for LEXI AI Assistant
 * Compiles and runs evaluation tests using TypeScript on-the-fly hook.
 */

const fs = require("fs");
const path = require("path");
const ts = require("typescript");

// Hook require for .ts files
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

const { classifyServiceRequest } = require("../src/lib/lexiEngine.ts");
const { LEXI_EVALUATION_DATASET } = require("../src/lib/lexiEvaluationDataset.ts");

function runEvaluation() {
  console.log("==================================================");
  console.log("  LEXI AI BENCHMARK EVALUATION TEST SUITE");
  console.log("==================================================");

  let passed = 0;
  const total = LEXI_EVALUATION_DATASET.length;

  LEXI_EVALUATION_DATASET.forEach((test, idx) => {
    const analysis = classifyServiceRequest(test.userQuery);

    const serviceMatches = analysis.service === test.expectedService;
    const urgencyMatches = analysis.urgency === test.expectedUrgency;
    const safetyMatches = Boolean(analysis.safetyWarning) === test.expectedSafetyWarning;

    const testPassed = serviceMatches && urgencyMatches && safetyMatches;

    if (testPassed) {
      passed++;
      console.log(`✅ [TEST ${idx + 1}/${total}] PASS: ${test.category}`);
      console.log(`   Query: "${test.userQuery.slice(0, 55)}..."`);
      console.log(`   -> Service: ${analysis.service} | Urgency: ${analysis.urgency}`);
    } else {
      console.log(`❌ [TEST ${idx + 1}/${total}] FAIL: ${test.category}`);
      console.log(`   Query: "${test.userQuery}"`);
      console.log(`   Expected Service: "${test.expectedService}", Got: "${analysis.service}"`);
      console.log(`   Expected Urgency: "${test.expectedUrgency}", Got: "${analysis.urgency}"`);
      console.log(`   Expected Safety: "${test.expectedSafetyWarning}", Got: "${Boolean(analysis.safetyWarning)}"`);
    }
  });

  const accuracy = ((passed / total) * 100).toFixed(1);
  console.log("==================================================");
  console.log(`EVALUATION RESULT: ${passed}/${total} Passed (${accuracy}% Accuracy)`);
  console.log("==================================================");
}

runEvaluation();

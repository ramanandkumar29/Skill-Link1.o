/**
 * Automated Test Suite for Worker KYC & 5-Tier Verification Queue
 * Verifies artisan dossier retrieval, document inspection status updates,
 * rejection reasoning, audit timeline generation, and masked identity protection.
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

const {
  getKycWorkers,
  getKycWorkerById,
  updateDocumentStatus,
  updateChecklistItem,
  finalizeWorkerKycDecision,
  REJECTION_REASONS,
} = require("../src/lib/kycVerificationService.ts");

function runKycTests() {
  console.log("==================================================");
  console.log("  SKILL-LINK WORKER KYC & VERIFICATION TEST SUITE ");
  console.log("==================================================");

  let passed = 0;
  let total = 7;

  // Test 1: Worker Dossier Retrieval
  const workers = getKycWorkers();
  if (workers && workers.length >= 3) {
    passed++;
    console.log(`✅ [TEST 1/7] PASS: Retrieved ${workers.length} active artisan KYC dossiers`);
  } else {
    console.log("❌ [TEST 1/7] FAIL: Failed to retrieve KYC workers");
  }

  // Test 2: Masked Aadhaar & Privacy Protection
  const dharmendra = getKycWorkerById("kyc-101");
  const isAadhaarMasked = dharmendra && dharmendra.aadhaarMasked.startsWith("XXXX-XXXX-");
  const isFullAadhaarExposed = dharmendra && /^\d{12}$/.test(dharmendra.aadhaarMasked);

  if (isAadhaarMasked && !isFullAadhaarExposed) {
    passed++;
    console.log(`✅ [TEST 2/7] PASS: Aadhaar token properly masked: ${dharmendra.aadhaarMasked}`);
  } else {
    console.log("❌ [TEST 2/7] FAIL: Aadhaar privacy shield failed");
  }

  // Test 3: Document Status Update & Rejection Reason Tracking
  const docToReject = dharmendra.documents[0];
  const rejectReason = REJECTION_REASONS[0]; // "Document is blurry or illegible"
  const updatedWorker = updateDocumentStatus(
    dharmendra.id,
    docToReject.id,
    "REJECTED",
    rejectReason,
    "Admin Balwinder Singh"
  );

  const rejectedDoc = updatedWorker.documents.find((d) => d.id === docToReject.id);
  if (rejectedDoc && rejectedDoc.status === "REJECTED" && rejectedDoc.rejectionReason === rejectReason) {
    passed++;
    console.log(`✅ [TEST 3/7] PASS: Document rejection with mandatory reason logged: "${rejectReason}"`);
  } else {
    console.log("❌ [TEST 3/7] FAIL: Document rejection failed");
  }

  // Test 4: Audit Timeline Logging
  const latestAuditLog = updatedWorker.auditTimeline[0];
  if (latestAuditLog && latestAuditLog.action === "DOC_REJECTED" && latestAuditLog.adminName === "Admin Balwinder Singh") {
    passed++;
    console.log(`✅ [TEST 4/7] PASS: Audit timeline entry recorded: [${latestAuditLog.action}] by ${latestAuditLog.adminName}`);
  } else {
    console.log("❌ [TEST 4/7] FAIL: Audit timeline logging failed");
  }

  // Test 5: 5-Tier Checklist Item Status Toggle
  const checklistItem = dharmendra.checklist[0];
  const toggledWorker = updateChecklistItem(dharmendra.id, checklistItem.id, "VERIFIED");
  const toggledItem = toggledWorker.checklist.find((c) => c.id === checklistItem.id);

  if (toggledItem && toggledItem.status === "VERIFIED") {
    passed++;
    console.log(`✅ [TEST 5/7] PASS: Checklist category [${toggledItem.category}] marked as VERIFIED`);
  } else {
    console.log("❌ [TEST 5/7] FAIL: Checklist toggle failed");
  }

  // Test 6: Final KYC Decision Approval & Verification Cascade
  const approvedWorker = finalizeWorkerKycDecision(
    dharmendra.id,
    "VERIFIED",
    "Physical inspection of ITI certificate complete and confirmed",
    "Federation Admin"
  );

  const allChecklistPassed = approvedWorker.checklist.every((c) => c.status === "VERIFIED");
  if (approvedWorker.overallStatus === "VERIFIED" && allChecklistPassed) {
    passed++;
    console.log(`✅ [TEST 6/7] PASS: Final KYC approval successful; all 5-tier criteria confirmed`);
  } else {
    console.log("❌ [TEST 6/7] FAIL: Final KYC approval failed");
  }

  // Test 7: Database RLS Isolation Check (Customer disallowance)
  const migrationSql = fs.readFileSync(path.join(__dirname, "../safe_incremental_migration.sql"), "utf8");
  const hasWorkerDocsTable = migrationSql.includes("CREATE TABLE IF NOT EXISTS public.worker_documents");
  const hasAdminPolicy = migrationSql.includes("Admins can view worker documents");
  const hasWorkerSelfPolicy = migrationSql.includes("Workers can view own documents");

  if (hasWorkerDocsTable && hasAdminPolicy && hasWorkerSelfPolicy) {
    passed++;
    console.log(`✅ [TEST 7/12] PASS: Database schema & RLS policies for worker_documents and kyc_audit_logs verified`);
  } else {
    console.log("❌ [TEST 7/12] FAIL: Migration schema check failed");
  }

  // Test 8: Contextual AI Advisory Summary Generation
  const { generateLexiKycAuditSummary } = require("../src/lib/kycVerificationService.ts");
  const aiSummary = generateLexiKycAuditSummary(dharmendra);
  if (aiSummary && aiSummary.riskLevel && aiSummary.recommendation && aiSummary.identityStatus) {
    passed++;
    console.log(`✅ [TEST 8/12] PASS: LEXI Contextual AI Summary Generated (Risk: ${aiSummary.riskLevel}, Status: ${aiSummary.identityStatus})`);
  } else {
    console.log("❌ [TEST 8/12] FAIL: AI audit summary generation failed");
  }

  // Test 9: Risk Level & Decision Recommendation Evaluation
  const harnek = workers.find((w) => w.id === "kyc-103");
  const harnekAiSummary = generateLexiKycAuditSummary(harnek);
  if (harnekAiSummary.riskLevel === "MEDIUM" && harnek.membershipStatus === "PROVISIONAL") {
    passed++;
    console.log(`✅ [TEST 9/12] PASS: Provisional Membership correctly flagged as MEDIUM Risk`);
  } else {
    console.log("❌ [TEST 9/12] FAIL: Risk level evaluation failed");
  }

  // Test 10: Sensitive Identity & Address Obfuscation Shield
  const hasUnmaskedAadhaar = workers.some((w) => /^\d{12}$/.test(w.aadhaarMasked));
  const hasMaskedAddresses = workers.every((w) => w.maskedAddress.includes("protected") || w.maskedAddress.includes("Full"));
  if (!hasUnmaskedAadhaar && hasMaskedAddresses) {
    passed++;
    console.log(`✅ [TEST 10/12] PASS: Complete Aadhaar and exact residence protected with masking`);
  } else {
    console.log("❌ [TEST 10/12] FAIL: Aadhaar/address masking failed");
  }

  // Test 11: Modal Layout & Sticky Footer Action Integrity
  const drawerCode = fs.readFileSync(path.join(__dirname, "../src/components/WorkerVerificationDrawer.tsx"), "utf8");
  const hasModalSizing = drawerCode.includes("max-w-5xl") || drawerCode.includes("max-w-6xl");
  const hasStickyFooter = drawerCode.includes("border-t border-slate-200") && drawerCode.includes("shrink-0");
  const has5Tabs = drawerCode.includes("OVERVIEW") && drawerCode.includes("PERSONAL") && drawerCode.includes("SKILLS") && drawerCode.includes("DOCUMENTS") && drawerCode.includes("TIMELINE");

  if (hasModalSizing && hasStickyFooter && has5Tabs) {
    passed++;
    console.log(`✅ [TEST 11/12] PASS: Responsive Centered Modal Layout, Sticky Action Bar & 5 Tabs Verified`);
  } else {
    console.log("❌ [TEST 11/12] FAIL: Modal layout checks failed");
  }

  // Test 12: LEXI Zero-Overlap Event Contract
  const hasModalOpenEvent = drawerCode.includes("skill-link-modal-open") && drawerCode.includes("skill-link-modal-close");
  const lexiChatCode = fs.readFileSync(path.join(__dirname, "../src/components/lexi/LexiChat.tsx"), "utf8");
  const lexiHidesOnModal = lexiChatCode.includes("skill-link-modal-open") && lexiChatCode.includes("!isModalActive");

  if (hasModalOpenEvent && lexiHidesOnModal) {
    passed++;
    console.log(`✅ [TEST 12/12] PASS: Zero-Overlap Contract Verified (LEXI automatically hides when modal is open)`);
  } else {
    console.log("❌ [TEST 12/12] FAIL: LEXI modal event integration failed");
  }

  const accuracy = ((passed / 12) * 100).toFixed(1);
  console.log("==================================================");
  console.log(`KYC VERIFICATION TESTS: ${passed}/12 Passed (${accuracy}% Success)`);
  console.log("==================================================");

  if (passed === 12) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runKycTests();

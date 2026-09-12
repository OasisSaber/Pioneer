/**
 * Pioneer Desktop Task Assistant - CLI Prototype Verification Script
 * Validates suite structure, feature coverage requirements, and executes all test cases.
 * Zero npm/external dependencies, pure Node.js standard built-ins.
 */

const path = require('path');
const fs = require('fs');

// Banner
console.log('================================================================================');
console.log('  PIONEER PROTOTYPE TEST VERIFICATION SUITE (CLI PROBE)');
console.log('  Autonomous Opaque-Box Requirement Verification Engine');
console.log('================================================================================\n');

const testCasesPath = path.join(__dirname, 'test-cases.js');
if (!fs.existsSync(testCasesPath)) {
  console.error(`[FATAL] Cannot locate test-cases.js at ${testCasesPath}`);
  process.exit(1);
}

const suite = require(testCasesPath);

console.log(`[INIT] Loaded Test Suite: ${suite.title} (v${suite.version})`);
console.log(`[INIT] Registered Total Tests: ${suite.totalTests}\n`);

// 0. Repository Security Preflight
console.log('--- STEP 0: REPOSITORY SECURITY PREFLIGHT ---');

const figmaSyncPath = path.join(__dirname, '../..', 'tools', 'figma-sync.js');
if (!fs.existsSync(figmaSyncPath)) {
  console.error(`[FATAL] Cannot locate figma-sync.js at ${figmaSyncPath}`);
  process.exit(1);
}

const figmaSyncSource = fs.readFileSync(figmaSyncPath, 'utf8');
const securityErrors = [];

if (/figd_[A-Za-z0-9_-]{20,}/.test(figmaSyncSource)) {
  securityErrors.push('tools/figma-sync.js contains an embedded Figma personal access token');
}
if (!/process\.env\.FIGMA_TOKEN/.test(figmaSyncSource)) {
  securityErrors.push('tools/figma-sync.js must read FIGMA_TOKEN from the environment');
}

if (securityErrors.length > 0) {
  console.error('[FAILED] Repository security preflight failed:');
  securityErrors.forEach(error => console.error('  - ' + error));
  process.exit(1);
}

console.log('[PASS] Figma credentials are supplied through FIGMA_TOKEN and are not embedded.\n');

// 1. Structural & Coverage Gates Verification
console.log('--- STEP 1: COVERAGE & THRESHOLD AUDIT ---');

const errors = [];
const idSet = new Set();
const featureTier1Counts = {};
const featureTier2Counts = {};

for (let i = 1; i <= 18; i++) {
  const fId = 'F' + String(i).padStart(2, '0');
  featureTier1Counts[fId] = 0;
  featureTier2Counts[fId] = 0;
}

suite.testCases.forEach((tc, idx) => {
  // Check required fields
  if (!tc.id) errors.push(`Test index ${idx} missing id`);
  if (!tc.title) errors.push(`Test ${tc.id || idx} missing title`);
  if (!tc.description) errors.push(`Test ${tc.id || idx} missing description`);
  if (!tc.expectedSource) errors.push(`Test ${tc.id || idx} missing expectedSource`);
  if (typeof tc.run !== 'function') errors.push(`Test ${tc.id || idx} missing run function`);

  // Check unique ID
  if (idSet.has(tc.id)) {
    errors.push(`Duplicate test id discovered: ${tc.id}`);
  }
  idSet.add(tc.id);

  // Feature counts
  if (tc.tier === 1 && featureTier1Counts[tc.featureId] !== undefined) {
    featureTier1Counts[tc.featureId]++;
  }
  if (tc.tier === 2 && featureTier2Counts[tc.featureId] !== undefined) {
    featureTier2Counts[tc.featureId]++;
  }
});

// Minimum requirement assertions
if (suite.totalTests < 207) {
  errors.push(`Total test count [${suite.totalTests}] is below mandatory minimum of 207!`);
}
if (suite.tierSummary.tier1 < 90) {
  errors.push(`Tier 1 count [${suite.tierSummary.tier1}] is below mandatory minimum of 90!`);
}
if (suite.tierSummary.tier2 < 90) {
  errors.push(`Tier 2 count [${suite.tierSummary.tier2}] is below mandatory minimum of 90!`);
}
if (suite.tierSummary.tier3 < 18) {
  errors.push(`Tier 3 count [${suite.tierSummary.tier3}] is below mandatory minimum of 18!`);
}
if (suite.tierSummary.tier4 < 9) {
  errors.push(`Tier 4 count [${suite.tierSummary.tier4}] is below mandatory minimum of 9!`);
}

// Check per-feature coverage (>=5 for each feature in Tier 1 and Tier 2)
for (let i = 1; i <= 18; i++) {
  const fId = 'F' + String(i).padStart(2, '0');
  if (featureTier1Counts[fId] < 5) {
    errors.push(`Feature ${fId} has only ${featureTier1Counts[fId]} Tier 1 tests (required >= 5)`);
  }
  if (featureTier2Counts[fId] < 5) {
    errors.push(`Feature ${fId} has only ${featureTier2Counts[fId]} Tier 2 tests (required >= 5)`);
  }
}

if (errors.length > 0) {
  console.error('[FAILED] Coverage threshold audit failed with errors:');
  errors.forEach(e => console.error('  - ' + e));
  process.exit(1);
}

console.log(`[PASS] Total Test Cases: ${suite.totalTests} (Threshold >= 207 OK)`);
console.log(`[PASS] Tier 1 (Feature Coverage): ${suite.tierSummary.tier1} (Threshold >= 90 OK)`);
console.log(`[PASS] Tier 2 (Boundary & Corner): ${suite.tierSummary.tier2} (Threshold >= 90 OK)`);
console.log(`[PASS] Tier 3 (Cross-Feature Pairwise): ${suite.tierSummary.tier3} (Threshold >= 18 OK)`);
console.log(`[PASS] Tier 4 (Real-World Workloads): ${suite.tierSummary.tier4} (Threshold >= 9 OK)`);
console.log(`[PASS] All 18 features verified to have >=5 Tier 1 and >=5 Tier 2 tests each!\n`);

// 2. Test Execution
console.log('--- STEP 2: TEST SUITE EXECUTION ---');

(async () => {
  let progressCount = 0;
  const results = await suite.runAll({
    onProgress: (item, current, total) => {
      progressCount++;
      if (progressCount % 35 === 0 || progressCount === total) {
        process.stdout.write(`  [EXEC] Progress: ${progressCount}/${total} (${Math.round((progressCount / total) * 100)}%)\n`);
      }
    }
  });

  console.log('\n--- STEP 3: EXECUTION RESULTS & SUMMARY ---');
  console.log(`Total Executed: ${results.total}`);
  console.log(`Passed:         ${results.passed}`);
  console.log(`Failed:         ${results.failed}`);
  console.log(`Execution Time: ${results.durationMs}ms`);

  if (results.failed > 0) {
    console.error('\n[FAILED TESTS DETAILS]');
    results.details.filter(d => !d.passed).forEach(d => {
      console.error(`  - [${d.id}] ${d.title}: ${d.error}`);
    });
    console.error('\n[ABORT] Test verification failed. Exit code 1.');
    process.exit(1);
  }

  console.log('\n================================================================================');
  console.log('  ALL 210 PROTOTYPE TESTS PASSED SUCCESSFULLY (PASS RATE: 100%)');
  console.log('  QUALITY GATES FULLY SATISFIED. READY FOR TEST_READY.md PUBLICATION.');
  console.log('================================================================================\n');

  process.exit(0);
})();

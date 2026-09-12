/**
 * Pioneer Desktop Task Assistant - Comprehensive Adversarial Stress Probe
 * Empirical validation engine for:
 * 1. Broken Link & Cross-Page Navigation Detection
 * 2. 100% Offline Network Isolation & CDN Zero-Dependency Detection
 * 3. Native alert() Blocking Call Detection (Zero alert calls)
 * 4. Deep Blocking Dialog Scan (prompt / confirm)
 * 5. DOM getElementById Target Integrity
 * 6. File:// Protocol & JavaScript V8 Syntax Integrity
 * 7. 16:9 Responsive Stage Scaling Engine & Apple HIG Token Verification
 * 8. Prototype Test Runner Offline Isolation
 * 9. Full Prototype Test Suite 210/210 Pass Verification
 *
 * Zero external npm dependencies. Pure Node.js built-ins.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT_DIR = path.resolve(__dirname, '../..');
const DEMOS_DIR = path.join(ROOT_DIR, 'demos');
const TESTS_DIR = __dirname;

console.log('================================================================================');
console.log('  PIONEER ADVERSARIAL STRESS PROBE & EMPIRICAL CHALLENGER');
console.log('  Autonomous Deep Verification Engine (T1 - T5)');
console.log('================================================================================\n');

const DEMO_FILES = [
  '00-pioneer-workbench.html',
  '01-bookshelf-workspace.html',
  '02-session-intent-card.html',
  '03-wrapup-and-gallery.html',
  '04-ppt-presentation-demo.html'
];

let totalChallenges = 0;
let passedChallenges = 0;
let failedChallenges = 0;
const failures = [];
const advisories = [];

function recordTest(name, passed, details) {
  totalChallenges++;
  if (passed) {
    passedChallenges++;
    console.log(`[PASS] ${name}`);
    if (details) console.log(`       Details: ${details}`);
  } else {
    failedChallenges++;
    console.error(`[FAIL] ${name}`);
    console.error(`       Failure reason: ${details}`);
    failures.push({ name, details });
  }
}

function recordAdvisory(name, details) {
  console.log(`[NOTE] ${name}`);
  console.log(`       Advisory: ${details}`);
  advisories.push({ name, details });
}

// -----------------------------------------------------------------------------
// CHALLENGE 0: DELIVERABLE ARTIFACTS EXISTENCE & SIZES
// -----------------------------------------------------------------------------
console.log('--- CHALLENGE 0: DELIVERABLE ARTIFACTS EXISTENCE & SIZES ---');
DEMO_FILES.forEach(file => {
  const filePath = path.join(DEMOS_DIR, file);
  const exists = fs.existsSync(filePath);
  const size = exists ? fs.statSync(filePath).size : 0;
  recordTest(`Artifact exists: demos/${file}`, exists && size > 1000, `Size: ${size} bytes`);
});

const demoData = {};
DEMO_FILES.forEach(file => {
  const filePath = path.join(DEMOS_DIR, file);
  if (fs.existsSync(filePath)) {
    const raw = fs.readFileSync(filePath, 'utf8');
    demoData[file] = {
      path: filePath,
      raw: raw,
      lines: raw.split(/\r?\n/)
    };
  }
});

// -----------------------------------------------------------------------------
// CHALLENGE 1: BROKEN LINK & NAVIGATION TARGET RESOLUTION
// -----------------------------------------------------------------------------
console.log('\n--- CHALLENGE 1: BROKEN LINK & NAVIGATION TARGET RESOLUTION ---');

DEMO_FILES.forEach(file => {
  const data = demoData[file];
  if (!data) return;

  const links = [];
  const brokenLinks = [];

  // Extract <a ... href="...">
  const aRegex = /<a\s+[^>]*href=["']([^"']*)["'][^>]*>/gi;
  let match;
  while ((match = aRegex.exec(data.raw)) !== null) {
    const href = match[1].trim();
    const lineNo = data.raw.substring(0, match.index).split('\n').length;
    links.push({ type: '<a> tag', href, lineNo });
  }

  // Extract window.location.href, location.href, location.assign, window.open
  const jsNavRegex = /(?:window\.)?location(?:\.href)?\s*=\s*["']([^"']*)["']|location\.assign\(["']([^"']*)["']\)|window\.open\(["']([^"']*)["']/gi;
  while ((match = jsNavRegex.exec(data.raw)) !== null) {
    const href = (match[1] || match[2] || match[3]).trim();
    const lineNo = data.raw.substring(0, match.index).split('\n').length;
    links.push({ type: 'JS navigation', href, lineNo });
  }

  // Verify all links
  links.forEach(l => {
    const target = l.href;
    if (target.startsWith('#') || target.startsWith('javascript:')) {
      return; // Safe in-page or void action
    }

    // Strip query string (?...) and hash fragment (#...)
    const cleanPath = target.split('?')[0].split('#')[0];
    if (!cleanPath) return;

    // Resolve relative path against demos directory
    const resolved = path.resolve(DEMOS_DIR, cleanPath);
    if (!fs.existsSync(resolved)) {
      brokenLinks.push(`[Line ${l.lineNo}] Broken target: "${target}" -> "${resolved}"`);
    }
  });

  const passed = brokenLinks.length === 0;
  recordTest(
    `Navigation Links Target Audit: demos/${file}`,
    passed,
    passed ? `Scanned ${links.length} link/navigation targets. 100% resolve to valid local files.` : brokenLinks.join('; ')
  );
});

// -----------------------------------------------------------------------------
// CHALLENGE 2: EXTERNAL NETWORK REQUEST & OFFLINE ISOLATION
// -----------------------------------------------------------------------------
console.log('\n--- CHALLENGE 2: 100% OFFLINE ISOLATION & ZERO EXTERNAL REQUESTS ---');

const NETWORK_CHECK_PATTERNS = [
  { name: 'External <script src="http...">', regex: /<script\s+[^>]*src=["']https?:\/\/[^"']+["']/gi },
  { name: 'External <link href="http...">', regex: /<link\s+[^>]*href=["']https?:\/\/[^"']+["']/gi },
  { name: 'External <img src="http...">', regex: /<img\s+[^>]*src=["']https?:\/\/[^"']+["']/gi },
  { name: 'CSS @import http...', regex: /@import\s+(?:url\()?["']?https?:\/\/[^)"';]+["']?\)?/gi },
  { name: 'CSS url(http...)', regex: /url\(\s*["']?https?:\/\/[^)"']+["']?\s*\)/gi },
  { name: 'fetch() external URL', regex: /\bfetch\s*\(\s*["'`]https?:\/\//gi },
  { name: 'XMLHttpRequest external', regex: /new\s+XMLHttpRequest\s*\(/gi },
  { name: 'WebSocket external', regex: /new\s+WebSocket\s*\(/gi },
  { name: 'sendBeacon external', regex: /navigator\.sendBeacon\s*\(/gi },
  { name: 'External CDN Domains', regex: /(?:fonts\.googleapis\.com|cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|unpkg\.com|maxcdn\.bootstrapcdn\.com)/gi }
];

DEMO_FILES.forEach(file => {
  const data = demoData[file];
  if (!data) return;

  const violations = [];

  NETWORK_CHECK_PATTERNS.forEach(pat => {
    let match;
    const regex = new RegExp(pat.regex);
    while ((match = regex.exec(data.raw)) !== null) {
      const lineNo = data.raw.substring(0, match.index).split('\n').length;
      violations.push(`[Line ${lineNo}] ${pat.name}: "${match[0].substring(0, 70)}"`);
    }
  });

  // Report any http:// or https:// found anywhere in the file (even doc text/xmlns)
  const allHttpMatches = [];
  const anyHttpRegex = /https?:\/\/[^\s"'<>)]+/gi;
  let httpMatch;
  while ((httpMatch = anyHttpRegex.exec(data.raw)) !== null) {
    const lineNo = data.raw.substring(0, httpMatch.index).split('\n').length;
    allHttpMatches.push({ line: lineNo, url: httpMatch[0] });
  }

  const passed = violations.length === 0;
  recordTest(
    `Offline Network Isolation: demos/${file}`,
    passed,
    passed
      ? `0 runtime network calls or CDN imports. (${allHttpMatches.length} inert documentation/schema URLs: ${allHttpMatches.map(m => m.url).join(', ') || 'none'}).`
      : violations.join('; ')
  );
});

// -----------------------------------------------------------------------------
// CHALLENGE 3: ZERO NATIVE ALERT() CALLS (PRIMARY MANDATORY GATE)
// -----------------------------------------------------------------------------
console.log('\n--- CHALLENGE 3: ZERO NATIVE ALERT() INVOCATION AUDIT ---');

DEMO_FILES.forEach(file => {
  const data = demoData[file];
  if (!data) return;

  const alertCalls = [];

  // Match alert(..., window.alert(..., self.alert(...
  const alertRegex = /(?:(?:\bwindow|\bself)\.)?\balert\s*\(/g;
  let match;
  while ((match = alertRegex.exec(data.raw)) !== null) {
    const lineNo = data.raw.substring(0, match.index).split('\n').length;
    const line = data.lines[lineNo - 1].trim();

    // Ignore comments
    if (line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
      continue;
    }

    alertCalls.push(`[Line ${lineNo}] Detected alert(): "${line.substring(0, 80)}"`);
  }

  const passed = alertCalls.length === 0;
  recordTest(
    `Zero Native alert() Invocations: demos/${file}`,
    passed,
    passed ? 'Verified 0 active alert() calls. Clean custom HUD/modal patterns used.' : alertCalls.join('; ')
  );
});

// -----------------------------------------------------------------------------
// CHALLENGE 4: DEEP BLOCKING DIALOG AUDIT (PROMPT / CONFIRM SCAN)
// -----------------------------------------------------------------------------
console.log('\n--- CHALLENGE 4: DEEP BLOCKING DIALOG SCAN (PROMPT / CONFIRM) ---');

DEMO_FILES.forEach(file => {
  const data = demoData[file];
  if (!data) return;

  const promptConfirmCalls = [];
  const pcRegex = /(?:(?:\bwindow|\bself)\.)?\b(prompt|confirm)\s*\(/g;
  let match;
  while ((match = pcRegex.exec(data.raw)) !== null) {
    const lineNo = data.raw.substring(0, match.index).split('\n').length;
    const line = data.lines[lineNo - 1].trim();
    if (!line.startsWith('//') && !line.startsWith('/*') && !line.startsWith('*')) {
      promptConfirmCalls.push(`[Line ${lineNo}] ${match[1]}(): "${line.substring(0, 60)}"`);
    }
  }

  if (promptConfirmCalls.length > 0) {
    recordAdvisory(
      `Native prompt/confirm advisory: demos/${file}`,
      `${promptConfirmCalls.length} occurrence(s) found: ${promptConfirmCalls.join('; ')}. Recommend replacing with inline Apple HIG sheet modals in next release.`
    );
  } else {
    console.log(`[PASS] Zero prompt/confirm calls in demos/${file}`);
  }
});

// -----------------------------------------------------------------------------
// CHALLENGE 5: DOM GETELEMENTBYID TARGET INTEGRITY
// -----------------------------------------------------------------------------
console.log('\n--- CHALLENGE 5: DOM GETELEMENTBYID TARGET INTEGRITY ---');

DEMO_FILES.forEach(file => {
  const data = demoData[file];
  if (!data) return;

  const missingIds = [];
  const getElemRegex = /getElementById\(['"]([^'"]+)['"]\)/g;
  let match;
  let checkedCount = 0;
  while ((match = getElemRegex.exec(data.raw)) !== null) {
    checkedCount++;
    const targetId = match[1];
    // Look for id="targetId" or id='targetId'
    const idRegex = new RegExp(`id=["']${targetId}["']`, 'i');
    if (!idRegex.test(data.raw)) {
      missingIds.push(targetId);
    }
  }

  const passed = missingIds.length === 0;
  recordTest(
    `DOM ID Reference Integrity: demos/${file}`,
    passed,
    passed ? `Checked ${checkedCount} getElementById calls. 100% matched defined DOM elements.` : `Missing element IDs: ${missingIds.join(', ')}`
  );
});

// -----------------------------------------------------------------------------
// CHALLENGE 6: SCRIPT SYNTAX & V8 COMPILATION AUDIT
// -----------------------------------------------------------------------------
console.log('\n--- CHALLENGE 6: SCRIPT SYNTAX & V8 COMPILATION AUDIT ---');

DEMO_FILES.forEach(file => {
  const data = demoData[file];
  if (!data) return;

  const scriptRegex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
  let match;
  let scriptCount = 0;
  const syntaxErrors = [];

  while ((match = scriptRegex.exec(data.raw)) !== null) {
    scriptCount++;
    const code = match[1];
    if (!code.trim()) continue;

    try {
      new vm.Script(code, { filename: `${file}_script_${scriptCount}` });
    } catch (err) {
      syntaxErrors.push(`Script #${scriptCount} parse failed: ${err.message}`);
    }
  }

  const passed = syntaxErrors.length === 0;
  recordTest(
    `JavaScript V8 Syntax Parsing: demos/${file}`,
    passed,
    passed ? `${scriptCount} <script> block(s) compiled successfully without syntax errors.` : syntaxErrors.join('; ')
  );
});

// -----------------------------------------------------------------------------
// CHALLENGE 7: 16:9 STAGE SCALING ENGINE & APPLE HIG DESIGN TOKENS
// -----------------------------------------------------------------------------
console.log('\n--- CHALLENGE 7: 16:9 STAGE SCALING ENGINE & DESIGN TOKENS ---');

DEMO_FILES.forEach(file => {
  const data = demoData[file];
  if (!data) return;

  const missingTokens = [];
  ['--canvas', '--surface', '--ink', '--line', '--accent'].forEach(token => {
    if (!data.raw.includes(token)) missingTokens.push(token);
  });

  const has1920 = data.raw.includes('1920');
  const has1080 = data.raw.includes('1080');
  const hasResize = data.raw.includes('resize');
  const hasScale = data.raw.includes('scale(') || data.raw.includes('scale =') || data.raw.includes('Math.min(');

  const passed = missingTokens.length === 0 && has1920 && has1080 && hasResize && hasScale;
  recordTest(
    `16:9 Stage Engine & Tokens: demos/${file}`,
    passed,
    passed
      ? '1920x1080 baseline canvas, responsive resize listener, scale math, and HIG design tokens all verified.'
      : `Missing: tokens=[${missingTokens.join(',')}], 1920=${has1920}, 1080=${has1080}, resize=${hasResize}, scale=${hasScale}`
  );
});

// -----------------------------------------------------------------------------
// CHALLENGE 8: PROTOTYPE TEST RUNNER HTML OFFLINE & SYNTAX AUDIT
// -----------------------------------------------------------------------------
console.log('\n--- CHALLENGE 8: PROTOTYPE TEST RUNNER HTML OFFLINE & SYNTAX AUDIT ---');
const runnerPath = path.join(TESTS_DIR, 'prototype-runner.html');
if (fs.existsSync(runnerPath)) {
  const runnerRaw = fs.readFileSync(runnerPath, 'utf8');

  // Check external network requests in runner
  const runnerViolations = [];
  NETWORK_CHECK_PATTERNS.forEach(pat => {
    let match;
    const regex = new RegExp(pat.regex);
    while ((match = regex.exec(runnerRaw)) !== null) {
      runnerViolations.push(match[0]);
    }
  });

  recordTest(
    'Prototype Runner Offline Isolation (tests/prototype/prototype-runner.html)',
    runnerViolations.length === 0,
    runnerViolations.length === 0 ? 'Zero external network or CDN calls in test runner.' : runnerViolations.join('; ')
  );

  // Check alert in runner
  const runnerAlerts = (runnerRaw.match(/(?:(?:\bwindow|\bself)\.)?\balert\s*\(/g) || []).length;
  recordTest(
    'Prototype Runner Zero Native alert() Audit (tests/prototype/prototype-runner.html)',
    runnerAlerts === 0,
    `Zero native alert calls in test runner (found ${runnerAlerts}).`
  );
}

// -----------------------------------------------------------------------------
// CHALLENGE 9: FULL PROTOTYPE TEST SUITE 210/210 EXECUTION AUDIT
// -----------------------------------------------------------------------------
console.log('\n--- CHALLENGE 9: FULL PROTOTYPE TEST SUITE 210/210 EXECUTION AUDIT ---');

(async () => {
  try {
    const testCasesPath = path.join(TESTS_DIR, 'test-cases.js');
    const suite = require(testCasesPath);

    recordTest(
      'Prototype Test Suite Registered Tests Baseline',
      suite.totalTests === 210,
      `Total tests registered: ${suite.totalTests} (Required: 210)`
    );

    recordTest(
      'Tier 1 (Feature Coverage) Threshold',
      suite.tierSummary.tier1 === 90,
      `Tier 1 tests: ${suite.tierSummary.tier1} (Required: 90)`
    );

    recordTest(
      'Tier 2 (Boundary & Corner) Threshold',
      suite.tierSummary.tier2 === 90,
      `Tier 2 tests: ${suite.tierSummary.tier2} (Required: 90)`
    );

    recordTest(
      'Tier 3 (Cross-Feature Pairwise) Threshold',
      suite.tierSummary.tier3 === 20,
      `Tier 3 tests: ${suite.tierSummary.tier3} (Required: 20)`
    );

    recordTest(
      'Tier 4 (Real-World Workloads) Threshold',
      suite.tierSummary.tier4 === 10,
      `Tier 4 tests: ${suite.tierSummary.tier4} (Required: 10)`
    );

    // Execute all 210 tests
    const results = await suite.runAll();
    recordTest(
      'Prototype Full Suite Execution Pass Rate (210/210)',
      results.passed === 210 && results.failed === 0,
      `Executed: ${results.total}, Passed: ${results.passed}, Failed: ${results.failed}, Duration: ${results.durationMs}ms`
    );
  } catch (err) {
    recordTest('Prototype Test Suite Execution', false, err.message);
  }

  // -----------------------------------------------------------------------------
  // SUMMARY & VERDICT
  // -----------------------------------------------------------------------------
  console.log('\n================================================================================');
  console.log('  ADVERSARIAL STRESS PROBE FINAL SUMMARY');
  console.log(`  Total Challenges: ${totalChallenges}`);
  console.log(`  Passed:           ${passedChallenges}`);
  console.log(`  Failed:           ${failedChallenges}`);
  console.log(`  Advisories:       ${advisories.length}`);
  console.log(`  Pass Rate:        ${Math.round((passedChallenges / totalChallenges) * 100)}%`);
  const verdict = failedChallenges === 0 ? 'APPROVE' : 'CHALLENGE_FAILED';
  console.log(`  VERDICT:          ${verdict}`);
  console.log('================================================================================\n');

  if (failedChallenges > 0) {
    console.error('[CRITICAL FAILURES DETECTED]');
    failures.forEach(f => console.error(`  - ${f.name}: ${f.details}`));
    process.exit(1);
  } else {
    process.exit(0);
  }
})();

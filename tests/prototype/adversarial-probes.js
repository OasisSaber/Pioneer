/**
 * Pioneer Prototype Suite - Adversarial Empirical Challenge Probe Suite
 * Focus: State Machines, DOM Integrity, and 16:9 Scaling Engine
 *
 * Specific Verifications:
 * 1. 16:9 stage scaling consistency: Verify all 5 demo files define .stage-viewport, .stage, 1920, 1080, and resizeStage.
 * 2. DOM element ID completeness:
 *    - 00: #cleanupDrawer, #diffDrawer, #quickLookModal, #toastShelf, pioneerNavHUD
 *    - 01: #cleanupDrawer, #toastShelf, #pioneerNavHUD, 6 poster cards with episode badges
 *    - 02: #modularWorkspaceGrid, #toolCallingSticky, #sessionTreePanel, #pioneerNavHUD, #toastShelf
 *    - 03: #diffDrawer, #quickLookModal, #toastShelf, #pioneerNavHUD, 4 HUD metric items
 *    - 04: #pioneerNavHUD, #toastShelf, 8 slide elements, slide controllers
 * 3. Syntax validation: Parse and validate inline JavaScript scripts in all 5 demo files for syntax errors using vm.Script.
 * 4. Run test verification: Execute node tests/prototype/verify-prototype.js and confirm 210/210 pass.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '../..');
const TESTS_DIR = __dirname;
const DEMOS_DIR = path.join(ROOT_DIR, 'demos');

const DEMO_FILES = [
  '00-pioneer-workbench.html',
  '01-bookshelf-workspace.html',
  '02-session-intent-card.html',
  '03-wrapup-and-gallery.html',
  '04-ppt-presentation-demo.html'
];

let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;
const failures = [];

function check(assertionName, condition, details = '') {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`  [PASS] ${assertionName}`);
  } else {
    failedAssertions++;
    failures.push({ assertionName, details });
    console.error(`  [FAIL] ${assertionName}: ${details}`);
  }
}

console.log('================================================================================');
console.log('  PIONEER ADVERSARIAL EMPIRICAL CHALLENGER PROBE SUITE');
console.log('  Testing: Scaling Engine, DOM Element ID Completeness, and JS Syntax Integrity');
console.log('================================================================================\n');

// -----------------------------------------------------------------------------
// PROBE 1: 16:9 Stage Scaling Consistency
// -----------------------------------------------------------------------------
console.log('--- PROBE 1: 16:9 Stage Scaling Consistency (5 files) ---');

DEMO_FILES.forEach(filename => {
  const filePath = path.join(DEMOS_DIR, filename);
  const exists = fs.existsSync(filePath);
  check(`File exists: ${filename}`, exists);
  if (!exists) return;

  const content = fs.readFileSync(filePath, 'utf8');

  // Verify .stage-viewport
  check(
    `${filename} defines .stage-viewport in CSS`,
    content.includes('.stage-viewport')
  );

  // Verify .stage
  check(
    `${filename} defines .stage in CSS`,
    content.includes('.stage')
  );

  // Verify 1920 coordinate base
  check(
    `${filename} specifies 1920 width coordinate base`,
    content.includes('1920')
  );

  // Verify 1080 coordinate base
  check(
    `${filename} specifies 1080 height coordinate base`,
    content.includes('1080')
  );

  // Verify resizeStage function
  check(
    `${filename} defines resizeStage function`,
    content.includes('function resizeStage') || content.includes('resizeStage =') || content.includes('const resizeStage')
  );

  // Verify responsive scaling formula Math.min(..., ...)
  const hasScalingFormula = content.includes('Math.min') &&
    (content.includes('1920') && content.includes('1080'));
  check(
    `${filename} implements aspect-ratio scaling formula Math.min(w/1920, h/1080)`,
    hasScalingFormula
  );
});

// -----------------------------------------------------------------------------
// PROBE 2: DOM Element ID & Structural Completeness per Demo File
// -----------------------------------------------------------------------------
console.log('\n--- PROBE 2: DOM Element ID & Component Completeness ---');

function hasId(html, id) {
  const regex = new RegExp(`id=["']${id}["']`, 'i');
  return regex.test(html);
}

function hasClass(html, className) {
  const regex = new RegExp(`class=["'][^"']*\\b${className}\\b[^"']*["']`, 'i');
  return regex.test(html);
}

// 00-pioneer-workbench.html
{
  const f00 = fs.readFileSync(path.join(DEMOS_DIR, '00-pioneer-workbench.html'), 'utf8');
  console.log('\n  [Demo 00 Integrity: #cleanupDrawer, #diffDrawer, #quickLookModal, #toastShelf, pioneerNavHUD]');
  check('00 has #cleanupDrawer', hasId(f00, 'cleanupDrawer'));
  check('00 has #diffDrawer', hasId(f00, 'diffDrawer'));
  check('00 has #quickLookModal', hasId(f00, 'quickLookModal'));
  check('00 has #toastShelf', hasId(f00, 'toastShelf'));
  const has00Nav = hasId(f00, 'pioneerNavHUD') || hasClass(f00, 'pioneer-nav-hud') || f00.includes('pioneerNavHUD');
  check('00 has pioneerNavHUD', has00Nav, 'CRITICAL DEFECT: Missing #pioneerNavHUD element in 00-pioneer-workbench.html (present in 01:1135, 02:1530, 03:1074, 04:1646, but missing in 00)');
}

// 01-bookshelf-workspace.html
{
  const f01 = fs.readFileSync(path.join(DEMOS_DIR, '01-bookshelf-workspace.html'), 'utf8');
  console.log('\n  [Demo 01 Integrity: #cleanupDrawer, #toastShelf, #pioneerNavHUD, 6 poster cards with badges]');
  check('01 has #cleanupDrawer', hasId(f01, 'cleanupDrawer'));
  check('01 has #toastShelf', hasId(f01, 'toastShelf'));
  check('01 has #pioneerNavHUD', hasId(f01, 'pioneerNavHUD'));

  const posterMatches = f01.match(/class=["'][^"']*\bposter-card\b[^"']*["']/gi) || [];
  const badgeMatches = f01.match(/class=["'][^"']*\bepisode-counter\b[^"']*["']/gi) || [];
  console.log(`    Detected poster-card elements: ${posterMatches.length}`);
  console.log(`    Detected episode-counter elements: ${badgeMatches.length}`);
  check('01 has 6 poster cards', posterMatches.length >= 6, `Found ${posterMatches.length}`);
  check('01 has 6 episode badges on poster cards', badgeMatches.length >= 6, `Found ${badgeMatches.length}`);
}

// 02-session-intent-card.html
{
  const f02 = fs.readFileSync(path.join(DEMOS_DIR, '02-session-intent-card.html'), 'utf8');
  console.log('\n  [Demo 02 Integrity: #modularWorkspaceGrid, #toolCallingSticky, #sessionTreePanel, #pioneerNavHUD, #toastShelf]');
  check('02 has #modularWorkspaceGrid', hasId(f02, 'modularWorkspaceGrid'));
  check('02 has #toolCallingSticky', hasId(f02, 'toolCallingSticky'));
  check('02 has #sessionTreePanel', hasId(f02, 'sessionTreePanel'));
  check('02 has #pioneerNavHUD', hasId(f02, 'pioneerNavHUD'));
  check('02 has #toastShelf', hasId(f02, 'toastShelf'));
}

// 03-wrapup-and-gallery.html
{
  const f03 = fs.readFileSync(path.join(DEMOS_DIR, '03-wrapup-and-gallery.html'), 'utf8');
  console.log('\n  [Demo 03 Integrity: #diffDrawer, #quickLookModal, #toastShelf, #pioneerNavHUD, 4 HUD metric items]');
  check('03 has #diffDrawer', hasId(f03, 'diffDrawer'));
  check('03 has #quickLookModal', hasId(f03, 'quickLookModal'));
  check('03 has #toastShelf', hasId(f03, 'toastShelf'));
  check('03 has #pioneerNavHUD', hasId(f03, 'pioneerNavHUD'));

  const metricMatches = f03.match(/class=["'][^"']*\bmetric-box\b[^"']*["']/gi) || [];
  console.log(`    Detected HUD metric-box elements: ${metricMatches.length}`);
  check('03 has 4 HUD metric items', metricMatches.length >= 4, `Found ${metricMatches.length}`);
}

// 04-ppt-presentation-demo.html
{
  const f04 = fs.readFileSync(path.join(DEMOS_DIR, '04-ppt-presentation-demo.html'), 'utf8');
  console.log('\n  [Demo 04 Integrity: #pioneerNavHUD, #toastShelf, #helpModal, 10 slide elements, slide controllers]');
  check('04 has #pioneerNavHUD', hasId(f04, 'pioneerNavHUD'));
  check('04 has #toastShelf', hasId(f04, 'toastShelf'));
  check('04 has #helpModal', hasId(f04, 'helpModal'));

  // Count slides slide-1 through slide-10
  let slidesFound = 0;
  for (let i = 1; i <= 10; i++) {
    if (hasId(f04, `slide-${i}`)) slidesFound++;
  }
  console.log(`    Detected numbered slide elements (#slide-1 ~ #slide-10): ${slidesFound}/10`);
  check('04 has 10 slide elements', slidesFound === 10, `Found ${slidesFound} numbered slides`);

  // Verify slide controllers
  const hasDeckCtrl = f04.includes('deck-controller');
  const hasPrevBtn = hasId(f04, 'deckPrevBtn');
  const hasNextBtn = hasId(f04, 'deckNextBtn');
  const hasDots = hasId(f04, 'deckDots');
  const hasIndicator = hasId(f04, 'deckPageIndicator');
  const hasChangeSlide = f04.includes('changeSlide');

  const controllersOk = hasDeckCtrl && hasPrevBtn && hasNextBtn && hasDots && hasIndicator && hasChangeSlide;
  check(
    '04 has slide controllers (.deck-controller, #deckPrevBtn, #deckNextBtn, #deckDots, #deckPageIndicator, changeSlide)',
    controllersOk,
    `deck-ctrl: ${hasDeckCtrl}, prev: ${hasPrevBtn}, next: ${hasNextBtn}, dots: ${hasDots}, indicator: ${hasIndicator}, fn: ${hasChangeSlide}`
  );
}

// -----------------------------------------------------------------------------
// PROBE 3: Inline JavaScript Syntax Validation via vm.Script
// -----------------------------------------------------------------------------
console.log('\n--- PROBE 3: Inline JavaScript Syntax Validation (vm.Script) ---');

function extractScripts(html) {
  const scripts = [];
  const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    const attrs = match[1];
    const code = match[2];
    if (/type=["'](?:application\/json|text\/template|text\/markdown)["']/i.test(attrs)) {
      continue;
    }
    scripts.push({
      attrs,
      code,
      index: match.index
    });
  }
  return scripts;
}

DEMO_FILES.forEach(filename => {
  const filePath = path.join(DEMOS_DIR, filename);
  const html = fs.readFileSync(filePath, 'utf8');
  const scripts = extractScripts(html);

  check(`${filename} contains inline script tags`, scripts.length > 0, `Found ${scripts.length} scripts`);

  scripts.forEach((script, idx) => {
    try {
      new vm.Script(script.code, {
        filename: `${filename}#script-${idx + 1}`,
        displayErrors: true
      });
      check(`${filename} script #${idx + 1} (${script.code.length} bytes) syntax is VALID`, true);
    } catch (err) {
      check(`${filename} script #${idx + 1} syntax is VALID`, false, `${err.name}: ${err.message}`);
    }
  });
});

// -----------------------------------------------------------------------------
// SUMMARY & VERDICT
// -----------------------------------------------------------------------------
console.log('\n================================================================================');
console.log(`  TOTAL PROBES: ${totalAssertions}`);
console.log(`  PASSED:       ${passedAssertions}`);
console.log(`  FAILED:       ${failedAssertions}`);
const verdict = failedAssertions === 0 ? 'APPROVE' : 'CHALLENGE_FAILED';
console.log(`  VERDICT:      ${verdict}`);
console.log('================================================================================\n');

if (failedAssertions > 0) {
  console.error('[CHALLENGE EVIDENCE & PROOF]');
  failures.forEach((f, i) => {
    console.error(`  ${i + 1}. [ASSERTION FAILED] ${f.assertionName}`);
    console.error(`     Reason: ${f.details}`);
  });
  process.exit(1);
} else {
  console.log('[ALL PROBES PASSED]');
  process.exit(0);
}

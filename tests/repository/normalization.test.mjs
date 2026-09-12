import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const currentDocs = [
  'README.md',
  'AGENTS.md',
  'PROJECT.md',
  'TEST_INFRA.md',
  'TEST_READY.md',
  'themasterplan/THEMASTERPLAN.md',
  'themasterplan/ROADMAP.md',
  'figma-bridge/README.md',
  '开题PPT逐页文案.md',
];

const testTruthDocs = [
  'README.md',
  'AGENTS.md',
  'PROJECT.md',
  'TEST_INFRA.md',
  'TEST_READY.md',
  'themasterplan/ROADMAP.md',
];

function assert210ClaimsArePrototypeQualified(content, relativePath) {
  const lines = content.split(/\r?\n/);

  for (const [lineIndex, line] of lines.entries()) {
    if (!/\b210\b/i.test(line)) continue;

    const lineNumber = lineIndex + 1;
    assert.doesNotMatch(
      line,
      /\be2e\b/i,
      `${relativePath}:${lineNumber} labels a 210 claim as E2E`,
    );
    assert.ok(
      /\bprototype\b/i.test(line),
      `${relativePath}:${lineNumber} must qualify its 210 claim as Prototype Tests`,
    );
  }
}

function assertProjectDoesNotClassifyPrototypeTiersAsE2E(content) {
  const normalized = content.replace(/\r?\n/g, ' ');
  const tierRange = '\\bTiers?\\s*1\\s*(?:[-–—]|to)\\s*4\\b';
  const e2e = '\\b(?:Real\\s+)?E2E\\b';

  assert.doesNotMatch(
    normalized,
    new RegExp(`(?:${tierRange}[^.]{0,240}${e2e}|${e2e}[^.]{0,240}${tierRange})`, 'i'),
    'PROJECT.md must not classify the M1 Prototype Test tiers as an E2E suite',
  );
}

test('current documentation uses the canonical Pioneer identity', async () => {
  for (const relativePath of currentDocs) {
    const content = await readFile(path.join(repoRoot, relativePath), 'utf8');
    assert.doesNotMatch(content, /Pionner/i, `${relativePath} contains the legacy misspelling`);
    assert.doesNotMatch(content, /D:[\\/]+Project[\\/]+demo-thesis-2027/i, `${relativePath} contains the legacy checkout`);
    assert.doesNotMatch(content, /file:\/\/[\/]?[a-z]:\//i, `${relativePath} contains an absolute file link`);
  }
});

test('every current 210 claim is locally qualified as Prototype Tests', async () => {
  for (const relativePath of testTruthDocs) {
    const content = await readFile(path.join(repoRoot, relativePath), 'utf8');
    assert210ClaimsArePrototypeQualified(content, relativePath);
  }
});

test('current docs link to the implemented desktop application directory', async () => {
  const desktopDirectory = path.join(repoRoot, 'apps', 'desktop');
  assert.ok((await stat(desktopDirectory)).isDirectory(), 'apps/desktop must exist');

  for (const relativePath of ['README.md', 'PROJECT.md']) {
    const content = await readFile(path.join(repoRoot, relativePath), 'utf8');
    assert.match(
      content,
      /\[[^\]]*apps\/desktop[^\]]*\]\(apps\/desktop\/?\)/i,
      `${relativePath} must link to the implemented desktop directory`,
    );
  }
});

test('PROJECT keeps the M1 prototype tiers out of the Real E2E taxonomy', async () => {
  const project = await readFile(path.join(repoRoot, 'PROJECT.md'), 'utf8');
  assertProjectDoesNotClassifyPrototypeTiersAsE2E(project);
});

test('taxonomy policy rejects an E2E label for M1 prototype tiers', () => {
  assert.throws(
    () => assertProjectDoesNotClassifyPrototypeTiersAsE2E('M6 runs E2E validation (Tiers 1-4).'),
    /must not classify the M1 Prototype Test tiers as an E2E suite/,
  );
  assert.doesNotThrow(() =>
    assertProjectDoesNotClassifyPrototypeTiersAsE2E(
      'The four M1 simulator tiers are Prototype Tests evidence.',
    ),
  );
});

test('210 claim qualification rejects E2E and unqualified claims', () => {
  assert.throws(
    () => assert210ClaimsArePrototypeQualified('210/210 E2E passed', 'README.md'),
    /labels a 210 claim as E2E/,
  );
  assert.throws(
    () => assert210ClaimsArePrototypeQualified('210/210 passed', 'README.md'),
    /must qualify its 210 claim as Prototype Tests/,
  );
  assert.throws(
    () => assert210ClaimsArePrototypeQualified(
      '[EXEC] Progress: 210/210 (100%)',
      'TEST_READY.md',
    ),
    /must qualify its 210 claim as Prototype Tests/,
  );
  assert.doesNotThrow(
    () => assert210ClaimsArePrototypeQualified('Prototype Tests: 210/210 passed', 'README.md'),
  );
  assert.doesNotThrow(
    () => assert210ClaimsArePrototypeQualified(
      '[Prototype Tests] Progress: 210/210 (100%)',
      'TEST_READY.md',
    ),
  );
});

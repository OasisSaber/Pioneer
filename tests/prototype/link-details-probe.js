const fs = require('fs');
const path = require('path');

const DEMOS_DIR = path.resolve(__dirname, '../..', 'demos');
const files = fs.readdirSync(DEMOS_DIR).filter(f => f.endsWith('.html'));

console.log('Detailed Link & Navigation Audit:');
files.forEach(file => {
  const content = fs.readFileSync(path.join(DEMOS_DIR, file), 'utf8');
  console.log(`\n=== File: demos/${file} ===`);
  
  // Find all <a ... href="...">
  const aRegex = /<a\s+[^>]*href=["']([^"']*)["'][^>]*>/gi;
  let match;
  let count = 0;
  while ((match = aRegex.exec(content)) !== null) {
    count++;
    const href = match[1].trim();
    let status = 'UNKNOWN';
    let resolved = '';
    if (href.startsWith('#')) {
      status = 'IN-PAGE HASH';
    } else if (href.startsWith('javascript:')) {
      status = 'JS VOID';
    } else {
      const cleanPath = href.split('?')[0].split('#')[0];
      resolved = path.resolve(DEMOS_DIR, cleanPath);
      const exists = fs.existsSync(resolved);
      status = exists ? 'EXISTS (OK)' : 'BROKEN (MISSING!)';
    }
    console.log(`  [Link ${count}] href="${href}" -> ${status} ${resolved ? '(' + resolved + ')' : ''}`);
  }

  // Find all JS navigations
  const jsRegex = /(?:window\.)?location(?:\.href)?\s*=\s*["']([^"']*)["']|location\.assign\(["']([^"']*)["']\)|window\.open\(["']([^"']*)["']/gi;
  let jsCount = 0;
  while ((match = jsRegex.exec(content)) !== null) {
    jsCount++;
    const href = (match[1] || match[2] || match[3]).trim();
    let status = 'UNKNOWN';
    let resolved = '';
    if (href.startsWith('#')) {
      status = 'IN-PAGE HASH';
    } else if (href.startsWith('javascript:')) {
      status = 'JS VOID';
    } else {
      const cleanPath = href.split('?')[0].split('#')[0];
      resolved = path.resolve(DEMOS_DIR, cleanPath);
      const exists = fs.existsSync(resolved);
      status = exists ? 'EXISTS (OK)' : 'BROKEN (MISSING!)';
    }
    console.log(`  [JS Nav ${jsCount}] target="${href}" -> ${status} ${resolved ? '(' + resolved + ')' : ''}`);
  }

  if (count === 0 && jsCount === 0) {
    console.log('  No static <a> links or direct JS location assignments.');
  }
});

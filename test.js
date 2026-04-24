#!/usr/bin/env node
/**
 * Static site integrity tests for Perma Holdings LLC
 * Run: node test.js
 * No dependencies required.
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    failures.push(message);
    console.log(`  ✗ ${message}`);
  }
}

function readFile(filePath) {
  const abs = path.join(ROOT, filePath);
  if (!fs.existsSync(abs)) return null;
  return fs.readFileSync(abs, 'utf8');
}

function fileExists(filePath) {
  return fs.existsSync(path.join(ROOT, filePath));
}

// Extract all href and src attribute values from HTML
function extractAttrValues(html, attr) {
  const pattern = new RegExp(`${attr}="([^"]*)"`, 'g');
  const matches = [];
  let m;
  while ((m = pattern.exec(html)) !== null) {
    matches.push(m[1]);
  }
  return matches;
}

function extractTagContent(html, tag) {
  const m = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return m ? m[1].trim() : null;
}

// ─────────────────────────────────────────────
// Suite 1: Required files exist
// ─────────────────────────────────────────────
console.log('\n── Required files ───────────────────────────────');

const requiredFiles = [
  '.nojekyll',
  'CNAME',
  'index.html',
  'about.html',
  'approach.html',
  'portfolio.html',
  'contact.html',
  '404.html',
  'assets/css/main.css',
  'assets/css/_variables.css',
  'assets/css/_reset.css',
  'assets/css/_typography.css',
  'assets/css/_layout.css',
  'assets/css/_components.css',
  'assets/css/_pages.css',
  'assets/js/main.js',
  'assets/images/favicon.svg',
];

for (const f of requiredFiles) {
  assert(fileExists(f), `${f} exists`);
}

const removedFiles = [
  '_config.yml',
  'Gemfile',
  'Gemfile.lock',
  'index.md',
  'about.md',
];

console.log('\n── Jekyll files removed ─────────────────────────');
for (const f of removedFiles) {
  assert(!fileExists(f), `${f} has been removed`);
}

// ─────────────────────────────────────────────
// Suite 2: Per-page structure
// ─────────────────────────────────────────────
const pages = ['index.html', 'about.html', 'approach.html', 'portfolio.html', 'contact.html', '404.html'];

const expectedNavLinks = ['/about.html', '/approach.html', '/portfolio.html', '/contact.html'];

for (const page of pages) {
  console.log(`\n── ${page} ─────────────────────────────────────`);
  const html = readFile(page);

  assert(html !== null, 'file is readable');
  if (!html) continue;

  // DOCTYPE and lang
  assert(html.includes('<!DOCTYPE html>'), 'has DOCTYPE');
  assert(html.includes('lang="en"'), 'has lang attribute');

  // <title> is set and not empty
  const title = extractTagContent(html, 'title');
  assert(title && title.length > 0 && !title.includes('TODO'), `<title> is set: "${title}"`);

  // Stylesheet and script references resolve
  const hrefs = extractAttrValues(html, 'href');
  const srcs = extractAttrValues(html, 'src');
  const localHrefs = hrefs.filter(h => h.startsWith('/assets/'));
  const localSrcs = srcs.filter(s => s.startsWith('/assets/'));

  for (const h of localHrefs) {
    assert(fileExists(h.replace(/^\//, '')), `stylesheet exists: ${h}`);
  }
  for (const s of localSrcs) {
    assert(fileExists(s.replace(/^\//, '')), `script exists: ${s}`);
  }

  // Nav links present (skip on 404 — still has nav but checking is fine)
  for (const link of expectedNavLinks) {
    assert(html.includes(`href="${link}"`), `nav link to ${link} present`);
  }

  // Logo link back to home
  assert(html.includes('href="/"'), 'logo links to /');

  // Footer copyright
  assert(html.includes('Perma Holdings LLC'), 'footer contains firm name');
  assert(html.includes('Not an investment advisor'), 'footer has legal disclaimer');

  // No placeholder text left in
  assert(!html.includes('TODO'), 'no TODO placeholders');
  assert(!html.includes('Lorem ipsum'), 'no lorem ipsum placeholder text');
}

// ─────────────────────────────────────────────
// Suite 3: Internal link integrity
// ─────────────────────────────────────────────
console.log('\n── Internal link integrity ──────────────────────');

for (const page of pages) {
  const html = readFile(page);
  if (!html) continue;

  const hrefs = extractAttrValues(html, 'href');
  const internalHtmlLinks = hrefs.filter(h =>
    h.endsWith('.html') && !h.startsWith('http') && !h.startsWith('//')
  );

  for (const link of internalHtmlLinks) {
    const target = link.replace(/^\//, '');
    assert(fileExists(target), `${page}: link "${link}" resolves`);
  }
}

// ─────────────────────────────────────────────
// Suite 4: CSS @import chain
// ─────────────────────────────────────────────
console.log('\n── CSS @import chain ────────────────────────────');

const mainCss = readFile('assets/css/main.css');
assert(mainCss !== null, 'main.css is readable');

if (mainCss) {
  const importPattern = /@import '([^']+)'/g;
  let m;
  while ((m = importPattern.exec(mainCss)) !== null) {
    const importedFile = path.join('assets/css', m[1]);
    assert(fileExists(importedFile), `@import '${m[1]}' resolves`);
  }
}

// ─────────────────────────────────────────────
// Suite 5: Contact form placeholder reminder
// ─────────────────────────────────────────────
console.log('\n── Contact form ─────────────────────────────────');

const contactHtml = readFile('contact.html');
if (contactHtml) {
  const hasFormspree = contactHtml.includes('formspree.io/f/');
  const hasPlaceholder = contactHtml.includes('YOUR_FORMSPREE_ID');

  if (hasPlaceholder) {
    console.log('  ⚠ contact.html: Formspree ID is still a placeholder — replace YOUR_FORMSPREE_ID');
  } else {
    assert(hasFormspree, 'Formspree endpoint is configured');
  }
}

// ─────────────────────────────────────────────
// Suite 6: Nav consistency across all pages
// ─────────────────────────────────────────────
console.log('\n── Nav consistency across pages ─────────────────');

const navSnapshots = {};
for (const page of pages) {
  const html = readFile(page);
  if (!html) continue;
  const navMatch = html.match(/<ul class="nav-list">([\s\S]*?)<\/ul>/);
  navSnapshots[page] = navMatch ? navMatch[1].replace(/\s+/g, ' ').trim() : '';
}

const referenceNav = navSnapshots['index.html'];
for (const page of pages) {
  if (page === 'index.html') continue;
  assert(
    navSnapshots[page] === referenceNav,
    `${page}: nav matches index.html`
  );
}

// ─────────────────────────────────────────────
// Results
// ─────────────────────────────────────────────
console.log(`\n${'─'.repeat(52)}`);
console.log(`  ${passed + failed} tests: ${passed} passed, ${failed} failed`);

if (failures.length > 0) {
  console.log('\nFailed:');
  failures.forEach(f => console.log(`  ✗ ${f}`));
  process.exit(1);
} else {
  console.log('\n  All tests passed.');
  process.exit(0);
}

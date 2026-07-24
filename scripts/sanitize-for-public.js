#!/usr/bin/env node
/**
 * sanitize-for-public.js — Scrub personal data from the ATLAS public mirror.
 *
 * Supersedes `sync-from-local.sh`, which only handled username path patterns
 * and missed names, school/course identifiers, project names, and emails.
 *
 * Usage:
 *   node scripts/sanitize-for-public.js <dir>            # rewrite files in place
 *   node scripts/sanitize-for-public.js <dir> --check    # scan only, exit 1 on any leak
 *   node scripts/sanitize-for-public.js <dir> --dry-run  # report what would change
 *
 * The identifiers to scrub are deliberately NOT hardcoded here: this file is
 * itself published, so baking real names/emails into it would leak exactly what
 * it exists to remove. They live in `scripts/sanitize-identity.json`, which is
 * gitignored. Copy `sanitize-identity.example.json` and fill it in.
 *
 * Fails closed: with no config, sanitize and check both refuse to run rather
 * than silently passing unsanitized content.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const CONFIG_NAME = 'sanitize-identity.json';
const CONFIG_PATH = path.join(__dirname, CONFIG_NAME);

// This script and its config both hold raw identifiers by necessity.
// .gitignore is functional: rewriting a path inside a rule silently breaks the
// rule, so it is never scrubbed — keep its patterns name-free by hand instead.
const SKIP_FILES = new Set([path.basename(__filename), CONFIG_NAME, '.gitignore']);

const SKIP_EXT = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.avif', '.pdf',
  '.woff', '.woff2', '.ttf', '.otf', '.eot', '.zip', '.gz', '.tgz', '.tar',
  '.exe', '.dll', '.so', '.dylib', '.db', '.sqlite', '.sqlite3', '.bin',
  '.mp4', '.mp3', '.wav', '.mov', '.class', '.jar', '.pyc',
]);

const SKIP_DIR = new Set(['.git', 'node_modules']);

// --- Config -----------------------------------------------------------------

function loadIdentity() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error(`ERROR: missing ${CONFIG_NAME}\n`);
    console.error(`  cp scripts/sanitize-identity.example.json scripts/${CONFIG_NAME}`);
    console.error('  then fill in the values for your machine.\n');
    console.error('Refusing to run: without it nothing would be scrubbed, and the');
    console.error('check would pass on unsanitized content.');
    process.exit(1);
  }
  const raw = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  const list = (k) => (Array.isArray(raw[k]) ? raw[k].filter(Boolean) : []);
  return {
    usernames: list('usernames'),
    names: list('names'),
    emails: list('emails'),
    school: list('school'),
    courses: list('courses'),
    projects: list('projects'),
    protected: list('protected'),
    allowExamples: list('allowExamples'),
  };
}

const IDENTITY = loadIdentity();

// --- Rule construction ------------------------------------------------------

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Ordered replacement rules; most specific patterns must come first. */
function buildRules() {
  const rules = [];

  for (const u of IDENTITY.usernames) {
    const u_ = esc(u);
    rules.push(
      [new RegExp(`[Cc]:[\\\\/]Users[\\\\/]${u_}[\\\\/]\\.claude[\\\\/]`, 'g'), '~/.claude/'],
      [new RegExp(`/c/Users/${u_}/\\.claude/`, 'g'), '~/.claude/'],
      [new RegExp(`[Cc]:[\\\\/]Users[\\\\/]${u_}[\\\\/]\\.agents[\\\\/]`, 'g'), '~/.agents/'],
      [new RegExp(`/c/Users/${u_}/\\.agents/`, 'g'), '~/.agents/'],
      [new RegExp(`[Cc]:[\\\\/]Users[\\\\/]${u_}[\\\\/]Documents[\\\\/]Wiki[\\\\/]`, 'g'), '<your-vault-path>/'],
      [new RegExp(`/c/Users/${u_}/Documents/Wiki/`, 'g'), '<your-vault-path>/'],
      [new RegExp(`[Cc]--Users-${u_}--claude`, 'g'), '<your-cwd-slug>'],
      [new RegExp(`[Cc]_Users_${u_}_\\.claude`, 'g'), '<your-cwd-slug>'],
      [new RegExp(`[Cc]_Users_${u_}`, 'g'), '<your-cwd-slug>'],
      [new RegExp(`[Cc]:[\\\\/]Users[\\\\/]${u_}[\\\\/]`, 'g'), '~/'],
      [new RegExp(`/c/Users/${u_}/`, 'g'), '~/'],
      [new RegExp(`[Cc]:[\\\\/]Users[\\\\/]${u_}\\b`, 'g'), '~'],
      [new RegExp(`\\b${u_}\\b`, 'g'), '<user>'],
    );
  }

  // Personal knowledge vault referenced without a drive prefix.
  rules.push([/~\/Documents\/Wiki\//g, '<your-vault-path>/']);

  for (const e of IDENTITY.emails) {
    rules.push([new RegExp(esc(e), 'gi'), '<your-email>']);
  }

  // Names, longest first. Possessive and hyphenated forms before the bare name.
  // Case-insensitive: identifiers leak in lowercase too (stopword lists, slugs).
  const byLength = [...IDENTITY.names].sort((a, b) => b.length - a.length);
  for (const n of byLength) {
    const n_ = esc(n);
    rules.push(
      [new RegExp(`\\b${n_}'s\\b`, 'gi'), "the user's"],
      [new RegExp(`\\b${n_}-(requested|approved|confirmed|reported|authored|driven|facing|only)\\b`, 'gi'), 'user-$1'],
      [new RegExp(`\\b${n_}\\b`, 'gi'), 'the user'],
    );
  }

  // Longest first, so a compound entry is consumed whole before a shorter
  // entry that is a prefix of it would partially match.
  const longest = (arr) => [...arr].sort((a, b) => b.length - a.length);
  for (const s of longest(IDENTITY.school)) rules.push([new RegExp(`\\b${esc(s)}`, 'gi'), '[school]']);
  for (const c of longest(IDENTITY.courses)) rules.push([new RegExp(`\\b${esc(c)}\\b`, 'gi'), '[course]']);
  for (const p of longest(IDENTITY.projects)) rules.push([new RegExp(`\\b${esc(p)}`, 'gi'), '[personal-project]']);

  return rules;
}

const RULES = buildRules();

// --- Protection round-trip --------------------------------------------------
// Protected strings (e.g. the repo's own public URL) may contain a personal
// name, so mask them before the name rules run and restore them afterwards.

const TOKEN = (i) => ` ATLASPROTECT${i} `;

const protect = (text) =>
  IDENTITY.protected.reduce((acc, p, i) => acc.split(p).join(TOKEN(i)), text);

const restore = (text) =>
  IDENTITY.protected.reduce((acc, p, i) => acc.split(TOKEN(i)).join(p), text);

function sanitize(text) {
  let out = protect(text);
  for (const [re, rep] of RULES) out = out.replace(re, rep);
  return restore(out);
}

// --- Leak detection ---------------------------------------------------------

function buildLeakPatterns() {
  const pats = [];
  for (const u of IDENTITY.usernames) pats.push([`username:${u}`, new RegExp(`\\b${esc(u)}\\b`, 'i')]);
  for (const e of IDENTITY.emails) pats.push([`email:${e}`, new RegExp(esc(e), 'i')]);
  // Case-insensitive, and school/project names match as prefixes so glued
  // variants (name run together with a suffix) cannot slip past the gate.
  // List spaced, hyphenated, and glued spellings separately in the config —
  // a word-boundary match alone will not catch all three.
  for (const n of IDENTITY.names) pats.push([`name:${n}`, new RegExp(`\\b${esc(n)}\\b`, 'i')]);
  for (const s of IDENTITY.school) pats.push([`school:${s}`, new RegExp(`\\b${esc(s)}`, 'i')]);
  for (const c of IDENTITY.courses) pats.push([`course:${c}`, new RegExp(`\\b${esc(c)}\\b`, 'i')]);
  for (const p of IDENTITY.projects) pats.push([`project:${p}`, new RegExp(`\\b${esc(p)}`, 'i')]);
  // Credential shapes must never appear, regardless of identity config.
  pats.push(
    ['secret:anthropic-key', /sk-ant-[A-Za-z0-9._-]{8,}/],
    ['secret:openai-key', /\bsk-[A-Za-z0-9]{32,}\b/],
    ['secret:github-token', /\bgh[pousr]_[A-Za-z0-9]{20,}\b/],
    ['secret:aws-key', /\bAKIA[0-9A-Z]{16}\b/],
    ['secret:slack-token', /\bxox[baprs]-[A-Za-z0-9-]{10,}/],
    ['secret:private-key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  );
  return pats;
}

const LEAK_PATTERNS = buildLeakPatterns();

/** Findings for one file's text, ignoring PROTECTED substrings. */
function findLeaks(text) {
  const masked = protect(text);
  const found = [];
  for (const [label, re] of LEAK_PATTERNS) {
    const m = masked.match(re);
    if (m) found.push({ label, sample: m[0].slice(0, 60) });
  }
  return found;
}

// --- Walk -------------------------------------------------------------------

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIR.has(entry.name)) continue;
      yield* walk(path.join(dir, entry.name));
    } else if (entry.isFile()) {
      if (SKIP_FILES.has(entry.name)) continue;
      yield path.join(dir, entry.name);
    }
  }
}

function isTextFile(file) {
  if (SKIP_EXT.has(path.extname(file).toLowerCase())) return false;
  let fd;
  try {
    fd = fs.openSync(file, 'r');
    const buf = Buffer.alloc(4096);
    const n = fs.readSync(fd, buf, 0, 4096, 0);
    const head = buf.subarray(0, n);
    // NUL byte is the standard binary heuristic.
    if (head.includes(0)) return false;
    // Reject invalid UTF-8: decoding then writing back would corrupt the file.
    return !head.toString('utf8').includes('�');
  } catch {
    return false;
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
}

// --- Main -------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  const target = args.find((a) => !a.startsWith('--'));
  const check = args.includes('--check');
  const dryRun = args.includes('--dry-run');

  if (!target) {
    console.error('usage: node scripts/sanitize-for-public.js <dir> [--check|--dry-run]');
    process.exit(1);
  }
  if (!fs.existsSync(target)) {
    console.error(`ERROR: no such directory: ${target}`);
    process.exit(1);
  }

  let scanned = 0;
  let changed = 0;
  const leakFiles = [];

  for (const file of walk(target)) {
    if (!isTextFile(file)) continue;
    scanned++;

    const original = fs.readFileSync(file, 'utf8');

    if (check) {
      let leaks = findLeaks(original);
      // Allowlisted docs may contain credential-SHAPED examples (pattern tables,
      // truncated PEM stubs). Identity findings are never suppressed.
      const rel = path.relative(target, file).replace(/\\/g, '/');
      if (IDENTITY.allowExamples.some((a) => rel.endsWith(a))) {
        leaks = leaks.filter((l) => !l.label.startsWith('secret:'));
      }
      if (leaks.length) leakFiles.push({ file, leaks });
      continue;
    }

    const cleaned = sanitize(original);
    if (cleaned !== original) {
      changed++;
      if (dryRun) console.log(`would clean: ${path.relative(target, file)}`);
      else fs.writeFileSync(file, cleaned);
    }
  }

  if (check) {
    console.log(`scanned ${scanned} text file(s)`);
    if (leakFiles.length === 0) {
      console.log('CLEAN — no personal identifiers or credential shapes found');
      process.exit(0);
    }
    console.error(`\nLEAKS FOUND in ${leakFiles.length} file(s):\n`);
    for (const { file, leaks } of leakFiles) {
      console.error(`  ${path.relative(target, file)}`);
      for (const l of leaks) console.error(`      ${l.label}  ->  ${JSON.stringify(l.sample)}`);
    }
    process.exit(1);
  }

  console.log(`scanned ${scanned} text file(s); ${dryRun ? 'would clean' : 'cleaned'} ${changed}`);
}

main();

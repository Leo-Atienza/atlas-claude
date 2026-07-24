// lib/system-manifest.js — single source of truth for Capability System manifests.
//
// Parses systems/<name>/SYSTEM.md YAML frontmatter (the strict template subset —
// scalars, inline lists, block lists, one nested map level for `detect:`) and
// derives systems/registry.json from it. Consumed by:
//   - scripts/validate-systems.js   (11th validator)
//   - scripts/systems-registry.js   (CLI regen)
//   - hooks/system-detect.js        (SessionStart staleness guard + scoring)
// The parser is deliberately NOT a full YAML implementation: SYSTEM.md files are
// authored from the /system new template; anything outside that shape should
// fail loudly here rather than parse silently wrong.

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = path.join(os.homedir(), '.claude');
const SYSTEMS_DIR = path.join(ROOT, 'systems');
const REGISTRY_FILE = path.join(SYSTEMS_DIR, 'registry.json');

// Strip a trailing `# comment` outside quotes. Template values never contain
// a bare " #" sequence, so a simple cut is correct for this subset.
function stripComment(s) {
  const i = s.indexOf(' #');
  return (i >= 0 ? s.slice(0, i) : s).trim();
}

function parseScalar(raw) {
  const v = stripComment(raw);
  if (v === '') return '';
  if (v === '[]') return [];
  if (/^\[.*\]$/.test(v)) {
    return v.slice(1, -1).split(',')
      .map(x => x.trim().replace(/^["']|["']$/g, ''))
      .filter(Boolean);
  }
  if (/^-?\d+$/.test(v)) return parseInt(v, 10);
  return v.replace(/^["']|["']$/g, '');
}

/**
 * Parse the frontmatter block of a SYSTEM.md. Returns { fm, body } or throws.
 * Supports: `key: value`, `key: [a, b]`, `key:` + `  - item` block lists,
 * and one nested map level (`detect:` + indented keys, whose values may
 * themselves be scalars, inline lists, or block lists).
 */
function parseManifest(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new Error('no frontmatter block (--- ... ---)');
  const fm = {};
  const body = m[2] || '';
  const lines = m[1].split(/\r?\n/);

  let topKey = null;       // current top-level key collecting a block
  let subKey = null;       // current nested key under topKey (e.g. detect.detect_files)

  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const indent = line.match(/^ */)[0].length;
    const t = line.trim();

    if (indent === 0) {
      subKey = null;
      const kv = t.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
      if (!kv) throw new Error(`unparseable line: "${t}"`);
      const [, key, rest] = kv;
      if (stripComment(rest) === '') {
        // Block start — type (array vs map) is decided by the first child line.
        fm[key] = null;
        topKey = key;
      } else {
        fm[key] = parseScalar(rest);
        topKey = null;
      }
      continue;
    }

    if (indent === 2) {
      if (!topKey) throw new Error(`indented line without parent: "${t}"`);
      if (t.startsWith('- ')) {
        // block list item under a top-level key
        if (!Array.isArray(fm[topKey])) fm[topKey] = [];
        fm[topKey].push(parseScalar(t.slice(2)));
        subKey = null;
      } else {
        // nested map entry (the detect: block)
        const kv = t.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
        if (!kv) throw new Error(`unparseable nested line: "${t}"`);
        if (fm[topKey] === null || Array.isArray(fm[topKey])) fm[topKey] = {};
        const [, key, rest] = kv;
        if (stripComment(rest) === '') { fm[topKey][key] = []; subKey = key; }
        else { fm[topKey][key] = parseScalar(rest); subKey = null; }
      }
      continue;
    }

    if (indent === 4 && t.startsWith('- ')) {
      if (!topKey || !subKey) throw new Error(`deep list item without parent: "${t}"`);
      if (!Array.isArray(fm[topKey][subKey])) fm[topKey][subKey] = [];
      fm[topKey][subKey].push(parseScalar(t.slice(2)));
      continue;
    }

    throw new Error(`unsupported indentation (${indent}): "${t}"`);
  }

  return { fm, body };
}

/** Load every systems/<dir>/SYSTEM.md. Returns { systems: [...], errors: [...] }. */
function loadSystems() {
  const systems = [];
  const errors = [];
  if (!fs.existsSync(SYSTEMS_DIR)) return { systems, errors };
  for (const entry of fs.readdirSync(SYSTEMS_DIR)) {
    const dir = path.join(SYSTEMS_DIR, entry);
    const manifest = path.join(dir, 'SYSTEM.md');
    let stat;
    try { stat = fs.statSync(dir); } catch { continue; }
    if (!stat.isDirectory() || !fs.existsSync(manifest)) continue;
    try {
      const { fm, body } = parseManifest(fs.readFileSync(manifest, 'utf8'));
      systems.push({ dir: entry, manifest, fm, body, mtimeMs: fs.statSync(manifest).mtimeMs });
    } catch (err) {
      errors.push({ dir: entry, error: err.message });
    }
  }
  return { systems, errors };
}

/** Derive the registry.json object from parsed systems (frontmatter is the source of truth). */
function deriveRegistry(systems) {
  const out = {};
  for (const s of systems) {
    const fm = s.fm;
    if (!fm.id) continue;
    out[fm.id] = {
      name: fm.name || s.dir,
      domain: fm.domain || null,
      status: fm.status || 'active',
      when_to_use: fm.when_to_use || '',
      priority: (fm.detect && fm.detect.priority) || 0,
      detect_files: (fm.detect && fm.detect.detect_files) || [],
      detect_packages: (fm.detect && fm.detect.detect_packages) || [],
      companions: fm.companions || [],
      manifest: `systems/${s.dir}/SYSTEM.md`,
    };
  }
  return {
    _description: 'Machine index of Capability Systems. DERIVED from systems/*/SYSTEM.md frontmatter by scripts/systems-registry.js (also regenerated inline by hooks/system-detect.js when stale). DO NOT HAND-EDIT.',
    _updated: new Date().toISOString().slice(0, 10),
    systems: out,
  };
}

function writeRegistry(registry) {
  fs.mkdirSync(SYSTEMS_DIR, { recursive: true });
  fs.writeFileSync(REGISTRY_FILE, JSON.stringify(registry, null, 2) + '\n');
}

function readRegistry() {
  try { return JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf8')); } catch { return null; }
}

module.exports = { ROOT, SYSTEMS_DIR, REGISTRY_FILE, parseManifest, loadSystems, deriveRegistry, writeRegistry, readRegistry };

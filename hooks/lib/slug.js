// lib/slug.js — single source of truth for every name-normalization in ATLAS.
//
// THE LOAD-BEARING DISTINCTION: storage IDs vs matching keys.
//   - Storage IDs (entitySlug, cwdSlug, fileSlug) are FROZEN formats — they key
//     persisted data (atlas-kg/entities.json, handoffs/<slug>.md, vault
//     filenames). Changing their algorithm orphans existing data. Never "improve"
//     them; add a new function instead.
//   - Matching keys (canonKey) are for CROSS-SYSTEM comparison only (atlas-kg
//     entity name ↔ graphify node label ↔ vault page title). They are never
//     persisted as identifiers, so the algorithm may evolve.
//
// Callers (keep this list current):
//   entitySlug — hooks/atlas-kg.js (entityId re-export)
//   canonKey   — scripts/atlas-kg-vault-sync.js, scripts/recall.js
//   cwdSlug    — hooks/session-handoff.js, hooks/lib/session.js
//                (hooks/session-stop.sh keeps a parallel BASH implementation for
//                 hot-path speed — scripts/smoke-test.sh asserts parity)
// (fileSlug was removed 2026-06-09 same-day: speculative, zero callers — YAGNI.)

'use strict';

const crypto = require('crypto');

/**
 * Byte-identical port of atlas-kg.js entityId() (formerly atlas-kg.js:64-74).
 * Keys atlas-kg/entities.json — FROZEN. Hash suffix preserves uniqueness for
 * names like "C++", "C#", "C" that would otherwise collapse.
 */
function entitySlug(name) {
  const normalized = name.toLowerCase().trim();
  const slug = normalized.replace(/['\s]+/g, '_').replace(/[^a-z0-9_+#.-]/g, '');
  if (slug.length < 2) {
    const hash = crypto.createHash('md5').update(normalized).digest('hex').slice(0, 6);
    return slug + '_' + hash;
  }
  return slug;
}

/**
 * Cross-system MATCHING key (never persisted as an identifier).
 * Lowercase, accent-stripped, keeps letters/digits/+/# (so "C++" ≠ "C#" ≠ "C"),
 * collapses everything else to single spaces.
 */
function canonKey(name) {
  return String(name || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip combining accents
    .toLowerCase()
    .replace(/[^a-z0-9+#]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * The handoff/session-hot directory-name slug. FROZEN — keys
 * handoffs/<slug>.md, handoffs/<slug>/, cache/session-hot/<slug>.md.
 * Mirrors session-stop.sh's bash cwd_slug() exactly.
 */
function cwdSlug(cwd) {
  return String(cwd || '').replace(/[/\\:]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

module.exports = { entitySlug, canonKey, cwdSlug };

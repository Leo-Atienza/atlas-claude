#!/usr/bin/env node
/**
 * systems-registry.js — regenerate systems/registry.json from
 * systems/<name>/SYSTEM.md frontmatter (the single source of truth).
 *
 * Usage: node scripts/systems-registry.js [--check]
 *   --check  exit 1 if the stored registry differs from the derived one
 *            (no write) — used by tests; the validator does this too.
 *
 * The SessionStart hook (hooks/system-detect.js) also regenerates inline
 * when it detects a SYSTEM.md newer than registry.json, so forgetting to
 * run this is self-healing within one session start.
 */

'use strict';

const { loadSystems, deriveRegistry, writeRegistry, readRegistry, REGISTRY_FILE } = require('./lib/system-manifest');

const CHECK = process.argv.includes('--check');

const { systems, errors } = loadSystems();
for (const e of errors) {
  process.stderr.write(`parse error in systems/${e.dir}/SYSTEM.md: ${e.error}\n`);
}
if (errors.length) process.exit(2);

const derived = deriveRegistry(systems);

if (CHECK) {
  const stored = readRegistry();
  const same = stored && JSON.stringify(stored.systems) === JSON.stringify(derived.systems);
  process.stdout.write(same ? 'registry.json up to date\n' : 'registry.json STALE — rerun without --check\n');
  process.exit(same ? 0 : 1);
}

writeRegistry(derived);
const names = Object.values(derived.systems).map(s => s.name);
process.stdout.write(`registry.json written (${names.length} system${names.length === 1 ? '' : 's'}${names.length ? ': ' + names.join(', ') : ''}) → ${REGISTRY_FILE}\n`);

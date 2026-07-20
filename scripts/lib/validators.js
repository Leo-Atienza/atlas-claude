'use strict';

/**
 * Canonical validator manifest — the SINGLE source of truth for both
 * scripts/system-doctor.js (the scoreboard) and scripts/test-validators.js
 * (the meta-test). Add or remove validators HERE only, so the consumers can
 * never drift apart.
 *
 * Each entry: { id, file, args? }. Only validators that need a flag to emit
 * JSON carry `args` (the rest emit JSON to stdout by default).
 */
module.exports = [
  { id: 'skill-counts',        file: 'validate-skill-counts.js',        args: ['--json'] },
  { id: 'cross-listed-skills', file: 'validate-cross-listed-skills.js' },
  { id: 'archive-counts',      file: 'validate-archive-counts.js' },
  { id: 'symlinks',            file: 'validate-symlinks.js' },
  { id: 'archive-manifest',    file: 'validate-archive-manifest.js' },
  { id: 'commands',            file: 'validate-commands.js' },
  { id: 'hooks',               file: 'validate-hooks.js' },
  { id: 'knowledge',           file: 'validate-knowledge.js' },
  { id: 'references',          file: 'validate-references.js' },
];

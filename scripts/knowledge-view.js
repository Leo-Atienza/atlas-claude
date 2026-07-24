#!/usr/bin/env node
/**
 * knowledge-view.js — generate a per-domain view of the engineering knowledge
 * vault (read-only over the 5 source files; never mutates them).
 *
 * Usage: node scripts/knowledge-view.js <domain> [--json] [--force]
 *   <domain>  web | native | atlas | security | general | <any **Domain** tag>
 *   --json    print { domain, counts } instead of writing the view
 *   --force   regenerate even when vault mtimes are unchanged
 *
 * Output: cache/knowledge-view-<domain>.md (a CACHE artifact — regenerated on
 * /system activate, pruned by cleanup-config knowledge-view-prune).
 *
 * Domain resolution per entry, in order:
 *   1. explicit `**Domain**: <token>` on the entry metadata line (written by
 *      /remember when a capability system is active — the closed loop)
 *   2. census-derived hashtag map below (DATA-DERIVED from the real tag
 *      distribution of the vault, 2026-06-10: #css 18, #animation 14, #nextjs 11,
 *      #tailwind 9, #framer-motion 9, #react 7 … a literal #web-only map would
 *      catch 2/97 entries — that is why this map is broad)
 *   3. `general` (surfaced in a collapsed cross-cutting section, never hidden)
 *
 * Efficiency: skips regeneration when the 5 vault mtimes are unchanged
 * (cache/knowledge-view-<domain>.meta.json) and skips the write when output
 * is byte-identical, so the view's mtime stays meaningful.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const VAULT = path.join(os.homedir(), 'Documents', 'Wiki', 'wiki', 'engineering');
const CACHE = path.join(os.homedir(), '.claude', 'cache');
const PAGES = ['patterns.md', 'solutions.md', 'errors.md', 'preferences.md', 'failures.md'];
const TYPE_LABEL = { pattern: 'Patterns', solution: 'Solutions', error: 'Errors', preference: 'Preferences', failure: 'Failures' };

// Census-derived tag → domain map. Extend when new stacks enter the vault.
const TAG_DOMAINS = {
  web: ['web', 'css', 'nextjs', 'next-js', 'react', 'tailwind', 'frontend', 'animation', 'framer-motion', 'gsap', 'ssr', 'server-components', 'vercel', 'threejs', 'three-js', 'drizzle', 'neon', 'auth', 'typescript', 'javascript', 'dom', 'browser', 'lighthouse', 'fonts', 'responsive', 'dark-mode'],
  native: ['mobile', 'native', 'react-native', 'expo', 'flutter', 'swift', 'swiftui', 'android', 'ios', 'apk', 'kotlin', 'tauri', 'gradle'],
  atlas: ['atlas', 'hooks', 'skills', 'skill', 'validators', 'mcp', 'preview-mcp', 'knowledge', 'wiki', 'memory', 'claude-code', 'claude', 'session', 'handoff', 'ollama', 'local-llm', 'agents', 'workflow'],
  security: ['security', 'cve', 'secrets', 'vulnerability', 'injection', 'xss', 'csrf'],
  data: ['sql', 'postgres', 'postgresql', 'database', 'db', 'migration'],
};

function resolveDomain(metaLine, tags) {
  const explicit = metaLine.match(/\*\*Domain\*\*:\s*([\w-]+)/);
  if (explicit) return explicit[1].toLowerCase();
  for (const [domain, words] of Object.entries(TAG_DOMAINS)) {
    if (tags.some(t => words.includes(t))) return domain;
  }
  return 'general';
}

function extractEntries(text) {
  const entries = [];
  const re = /^##\s+KNOWLEDGE-(\d+)\s*:\s*(.+?)\s*$/gm;
  let m;
  const indices = [];
  while ((m = re.exec(text)) !== null) indices.push({ idx: m.index, id: `KNOWLEDGE-${m[1]}`, title: m[2] });
  for (let i = 0; i < indices.length; i++) {
    const block = text.slice(indices[i].idx, i + 1 < indices.length ? indices[i + 1].idx : text.length);
    const lines = block.split(/\r?\n/);
    const metaLine = lines.find(l => l.includes('**Type**')) || '';
    const type = (metaLine.match(/\*\*Type\*\*:\s*(\w+)/) || [])[1] || 'unknown';
    const tags = [...metaLine.matchAll(/#([\w-]+)/g)].map(x => x[1].toLowerCase());
    const firstBody = lines.find(l => l.trim() && !l.startsWith('#') && !l.includes('**Type**')) || '';
    entries.push({
      id: indices[i].id,
      title: indices[i].title,
      type,
      domain: resolveDomain(metaLine, tags),
      summary: firstBody.trim().slice(0, 140),
    });
  }
  return entries;
}

function main() {
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const domain = (args[0] || '').toLowerCase();
  const JSON_OUT = process.argv.includes('--json');
  const FORCE = process.argv.includes('--force');
  if (!domain) {
    process.stderr.write('usage: node scripts/knowledge-view.js <domain> [--json] [--force]\n');
    process.exit(2);
  }

  const outFile = path.join(CACHE, `knowledge-view-${domain}.md`);
  const metaFile = path.join(CACHE, `knowledge-view-${domain}.meta.json`);

  // Mtime short-circuit
  const mtimes = {};
  for (const p of PAGES) {
    try { mtimes[p] = fs.statSync(path.join(VAULT, p)).mtimeMs; } catch { mtimes[p] = 0; }
  }
  if (!FORCE && !JSON_OUT && fs.existsSync(outFile)) {
    try {
      const prev = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
      if (JSON.stringify(prev.mtimes) === JSON.stringify(mtimes)) {
        process.stdout.write(`unchanged (vault mtimes identical) → ${outFile}\n`);
        process.exit(0);
      }
    } catch { /* regenerate */ }
  }

  const all = [];
  for (const p of PAGES) {
    let text = '';
    try { text = fs.readFileSync(path.join(VAULT, p), 'utf8'); } catch { continue; }
    all.push(...extractEntries(text));
  }

  const counts = {};
  for (const e of all) counts[e.domain] = (counts[e.domain] || 0) + 1;

  if (JSON_OUT) {
    process.stdout.write(JSON.stringify({ domain, total: all.length, by_domain: counts, in_domain: counts[domain] || 0 }, null, 2) + '\n');
    process.exit(0);
  }

  const inDomain = all.filter(e => e.domain === domain);
  const general = domain === 'general' ? [] : all.filter(e => e.domain === 'general');

  const lines = [
    `> GENERATED VIEW — do not edit. Source: <your-vault-path>/wiki/engineering/*.md`,
    `> Regenerate: \`node scripts/knowledge-view.js ${domain}\` · Generated: ${new Date().toISOString().slice(0, 10)}`,
    '',
    `# Knowledge view: ${domain} (${inDomain.length} entries; vault total ${all.length})`,
    '',
  ];
  for (const type of Object.keys(TYPE_LABEL)) {
    const group = inDomain.filter(e => e.type === type);
    if (!group.length) continue;
    lines.push(`## ${TYPE_LABEL[type]} (${group.length})`, '');
    for (const e of group) lines.push(`- **${e.id}: ${e.title}** — ${e.summary}`);
    lines.push('');
  }
  if (general.length) {
    lines.push('<details><summary>Cross-cutting (general) — ' + general.length + ' entries</summary>', '');
    for (const e of general) lines.push(`- ${e.id}: ${e.title} (${e.type})`);
    lines.push('', '</details>', '');
  }

  const content = lines.join('\n');
  fs.mkdirSync(CACHE, { recursive: true });
  const existing = fs.existsSync(outFile) ? fs.readFileSync(outFile, 'utf8') : null;
  if (existing !== content) fs.writeFileSync(outFile, content);
  fs.writeFileSync(metaFile, JSON.stringify({ mtimes, generated: new Date().toISOString() }, null, 2) + '\n');

  const domainCounts = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([d, n]) => `${d}:${n}`).join(' ');
  process.stdout.write(`knowledge-view-${domain}.md written (${inDomain.length} in-domain, ${general.length} general) → ${outFile}\n  per-domain: ${domainCounts}\n`);
}

main();

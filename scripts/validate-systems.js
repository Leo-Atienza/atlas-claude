#!/usr/bin/env node
/**
 * validate-systems.js
 *
 * Verifies Capability System overlay manifests (systems/<name>/SYSTEM.md)
 * against the assets they reference. Overlay rule: systems only REFERENCE
 * skills/MCPs/commands/agents/rules — so the failure mode this validator
 * exists to catch is dangling references (asset renamed/archived/typo'd)
 * and a stale derived registry.json.
 *
 * Checks (per status:active system):
 *   1. skills:  every entry resolves — SK-### row in skills/ACTIVE-DIRECTORY.md,
 *      OR bare name = top-level dir under skills/, OR entry in skills/SYMLINKS.md.
 *      (Single directory-file parse + ONE top-level readdir — never a recursive walk.)
 *   2. preferred_mcp: every name in the known set, four categories:
 *      root .mcp.json ∪ user-scope (baked from ARCHITECTURE.md "User scope" list —
 *      we never open ~/.claude.json) ∪ plugin MCPs ∪ session-managed/connectors.
 *   3. commands: resolve to a commands/**.md file (basename or frontmatter name)
 *      or a user-invocable skill slug (skills/<name>/SKILL.md).
 *   4. agents: resolve to agents/**.md (top level or one subdir level).
 *   5. rules: resolve to skills/RULES-<X>.md.
 *   6. domain single-token; companions resolve to existing system names.
 *   7. detect_files: leading-'**' patterns rejected (unbounded traversal guard).
 *   8. registry.json coherence at VALUE level (derived-vs-stored per system).
 *   9. id/name uniqueness. SYSTEM.md body >60 lines → warning (echoed on activation).
 *
 * Self-skips ({ok:true, skipped:true}) when systems/ does not exist, so the
 * validator joins the board before any system is created.
 *
 * Exit 0 = clean. Exit 1 = drift. Output JSON to stdout.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { ROOT, SYSTEMS_DIR, REGISTRY_FILE, loadSystems, deriveRegistry, readRegistry } = require('./lib/system-manifest');

const SKILLS_DIR = path.join(ROOT, 'skills');
const ACTIVE_DIRECTORY = path.join(SKILLS_DIR, 'ACTIVE-DIRECTORY.md');
const SYMLINKS_MD = path.join(SKILLS_DIR, 'SYMLINKS.md');
const COMMANDS_DIR = path.join(ROOT, 'commands');
const AGENTS_DIR = path.join(ROOT, 'agents');

// MCP known set. User-scope names are baked from ARCHITECTURE.md § MCP Servers
// "User scope" (~/.claude.json is never opened by tooling — hand-sync with that
// line when servers are added/removed there).
const MCP_USER_SCOPE = ['MCP_DOCKER', 'code-review-graph', 'tauri-mcp', 'lighthouse', 'context-mode', 'mobile', 'cloudflare', 'expo', 'vercel', 'obsidian', 'shadcn', 'unsplash', 'claude-design'];
const MCP_PLUGINS = ['firebase', 'github'];
const MCP_SESSION_MANAGED = ['Claude_Browser', 'Claude_Preview', 'Context7', 'Claude_in_Chrome', 'scheduled-tasks', 'mcp-registry', 'local-agent'];

function safe(fn, fallback) { try { return fn(); } catch { return fallback; } }

function knownSkillRefs() {
  const ids = new Set();
  const names = new Set();
  const dirText = safe(() => fs.readFileSync(ACTIVE_DIRECTORY, 'utf8'), '');
  for (const m of dirText.matchAll(/\|\s*(SK-\d+)\s*\|/g)) ids.add(m[1]);
  for (const entry of safe(() => fs.readdirSync(SKILLS_DIR), [])) {
    if (!entry.startsWith('_') && !entry.includes('.')) names.add(entry);
  }
  const symText = safe(() => fs.readFileSync(SYMLINKS_MD, 'utf8'), '');
  for (const m of symText.matchAll(/^[-|]\s*`?([a-z0-9][a-z0-9-]+)`?\s/gim)) names.add(m[1]);
  return { ids, names };
}

function knownMcp() {
  const set = new Set([...MCP_USER_SCOPE, ...MCP_PLUGINS, ...MCP_SESSION_MANAGED]);
  const rootMcp = safe(() => JSON.parse(fs.readFileSync(path.join(ROOT, '.mcp.json'), 'utf8')), {});
  for (const name of Object.keys(rootMcp.mcpServers || {})) set.add(name);
  return set;
}

function knownCommands() {
  const set = new Set();
  const walk = (dir, depth) => {
    for (const entry of safe(() => fs.readdirSync(dir, { withFileTypes: true }), [])) {
      if (entry.isDirectory() && depth < 2) walk(path.join(dir, entry.name), depth + 1);
      else if (entry.name.endsWith('.md')) {
        set.add(entry.name.replace(/\.md$/, ''));
        const fmName = safe(() => fs.readFileSync(path.join(dir, entry.name), 'utf8').match(/^name:\s*([^\n#]+)/m), null);
        if (fmName) set.add(fmName[1].trim());
      }
    }
  };
  walk(COMMANDS_DIR, 0);
  return set;
}

function skillSlashSlugExists(name) {
  return fs.existsSync(path.join(SKILLS_DIR, name, 'SKILL.md'));
}

function knownAgents() {
  const set = new Set();
  const walk = (dir, depth) => {
    for (const entry of safe(() => fs.readdirSync(dir, { withFileTypes: true }), [])) {
      if (entry.isDirectory() && depth < 2) walk(path.join(dir, entry.name), depth + 1);
      else if (entry.name.endsWith('.md')) set.add(entry.name.replace(/\.md$/, ''));
    }
  };
  walk(AGENTS_DIR, 0);
  return set;
}

function main() {
  if (!fs.existsSync(SYSTEMS_DIR)) {
    process.stdout.write(JSON.stringify({ ok: true, skipped: true, reason: 'no systems/ directory' }, null, 2) + '\n');
    process.exit(0);
  }

  const { systems, errors: parseErrors } = loadSystems();
  const active = systems.filter(s => (s.fm.status || 'active') === 'active');

  const skillRefs = knownSkillRefs();
  const mcpSet = knownMcp();
  const cmdSet = knownCommands();
  const agentSet = knownAgents();
  const systemNames = new Set(systems.map(s => s.fm.name).filter(Boolean));

  const dangling = { skills: [], mcp: [], commands: [], agents: [], rules: [], companions: [] };
  const badDetect = [];
  const badDomains = [];
  let warnings = 0;
  const warningNotes = [];

  for (const s of active) {
    const fm = s.fm;
    const tag = fm.name || s.dir;

    for (const ref of fm.skills || []) {
      const ok = /^SK-\d+$/.test(ref) ? skillRefs.ids.has(ref) : skillRefs.names.has(ref);
      if (!ok) dangling.skills.push({ system: tag, ref });
    }
    for (const ref of fm.preferred_mcp || []) {
      if (!mcpSet.has(ref)) dangling.mcp.push({ system: tag, ref });
    }
    for (const ref of fm.commands || []) {
      if (!cmdSet.has(ref) && !skillSlashSlugExists(ref)) dangling.commands.push({ system: tag, ref });
    }
    for (const ref of fm.agents || []) {
      if (!agentSet.has(ref)) dangling.agents.push({ system: tag, ref });
    }
    for (const ref of fm.rules || []) {
      if (!fs.existsSync(path.join(SKILLS_DIR, `${ref}.md`))) dangling.rules.push({ system: tag, ref });
    }
    for (const ref of fm.companions || []) {
      if (!systemNames.has(ref)) dangling.companions.push({ system: tag, ref });
    }
    if (fm.domain && /\s/.test(String(fm.domain))) badDomains.push({ system: tag, domain: fm.domain });
    for (const pat of (fm.detect && fm.detect.detect_files) || []) {
      if (String(pat).startsWith('**')) badDetect.push({ system: tag, pattern: pat });
    }
    const bodyLines = s.body.split(/\r?\n/).filter(l => l.trim()).length;
    if (bodyLines > 60) { warnings++; warningNotes.push(`${tag}: body ${bodyLines} lines (>60 — activation echo bloat)`); }
  }

  // id/name uniqueness
  const dupes = [];
  const seen = new Set();
  for (const s of systems) {
    for (const key of [s.fm.id, s.fm.name].filter(Boolean)) {
      if (seen.has(key)) dupes.push(key);
      seen.add(key);
    }
  }

  // Registry coherence at value level: derived-from-frontmatter vs stored.
  const derived = deriveRegistry(systems).systems;
  const stored = (readRegistry() || {}).systems || {};
  const registryDrift = [];
  for (const id of new Set([...Object.keys(derived), ...Object.keys(stored)])) {
    if (!stored[id]) registryDrift.push({ id, drift: 'missing from registry.json' });
    else if (!derived[id]) registryDrift.push({ id, drift: 'orphan in registry.json' });
    else if (JSON.stringify(derived[id]) !== JSON.stringify(stored[id])) registryDrift.push({ id, drift: 'value mismatch (regen: node scripts/systems-registry.js)' });
  }

  const danglingTotal = Object.values(dangling).reduce((n, a) => n + a.length, 0);
  const result = {
    ok: parseErrors.length === 0 && danglingTotal === 0 && badDetect.length === 0 &&
        badDomains.length === 0 && dupes.length === 0 && registryDrift.length === 0,
    counts: {
      systems: systems.length,
      active: active.length,
      parse_errors: parseErrors.length,
      dangling_refs: danglingTotal,
      bad_detect_patterns: badDetect.length,
      registry_drift: registryDrift.length,
      duplicate_ids: dupes.length,
    },
    dangling,
    parse_errors: parseErrors,
    bad_detect_patterns: badDetect,
    bad_domains: badDomains,
    duplicate_ids: dupes,
    registry_drift: registryDrift,
    warnings: warnings || undefined,
    warning_notes: warningNotes.length ? warningNotes : undefined,
    sources: { systems_dir: SYSTEMS_DIR, registry: REGISTRY_FILE, active_directory: ACTIVE_DIRECTORY },
  };
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  process.exit(result.ok ? 0 : 1);
}

main();

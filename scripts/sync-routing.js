#!/usr/bin/env node
// scripts/sync-routing.js
// Routing config generator — regenerate config/routing-rules.yml
// from the canonical JSON block embedded in commands/remember.md.
//
// remember.md is the single source of truth for routing logic. The YAML file
// is a derived artifact, kept around for legacy callers (context-router skill,
// older docs). Run this script after editing the JSON block in remember.md.
//

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const REMEMBER_MD = path.join(CLAUDE_DIR, 'commands', 'remember.md');
const ROUTING_YML = path.join(CLAUDE_DIR, 'config', 'routing-rules.yml');
const DRY_RUN = process.argv.includes('--dry-run');

const FENCE_OPEN = '<!-- routing-rules-json -->';
const FENCE_CLOSE = '<!-- /routing-rules-json -->';

function extractRulesJson(remember) {
  const open = remember.indexOf(FENCE_OPEN);
  const close = remember.indexOf(FENCE_CLOSE, open + 1);
  if (open < 0 || close < 0) {
    throw new Error(
      `Could not find routing-rules JSON fence in commands/remember.md. ` +
        `Expected open marker "${FENCE_OPEN}" and close marker "${FENCE_CLOSE}".`
    );
  }
  const inner = remember.slice(open + FENCE_OPEN.length, close);
  // Inner should contain ```json ... ``` — pick out the code block.
  const match = inner.match(/```json\s*\n([\s\S]+?)\n```/);
  if (!match) {
    throw new Error('Found fence but no ```json``` code block inside.');
  }
  try {
    return JSON.parse(match[1]);
  } catch (e) {
    throw new Error(`Failed to parse JSON block: ${e.message}`);
  }
}

// ── tiny YAML emitter for the routing-rules schema ─────────────────────────

function yamlScalar(v) {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  const s = String(v);
  // Quote if contains chars that would confuse YAML, or is empty/numeric-looking.
  if (s === '' || /^[-?:,\[\]{}#&*!|>'"%@`]/.test(s) || /[:#]/.test(s) || /\n/.test(s)) {
    // Use double quotes; escape backslashes and double quotes.
    return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return s;
}

function yamlStringList(arr, indent) {
  // Use flow style for keyword arrays — that's what the existing file uses.
  return '[' + arr.map(yamlScalar).join(', ') + ']';
}

function emitMatch(match, baseIndent) {
  const lines = [];
  if (Array.isArray(match.keywords)) {
    lines.push(`${baseIndent}keywords: ${yamlStringList(match.keywords, baseIndent)}`);
  }
  if (typeof match.intent === 'string') {
    lines.push(`${baseIndent}intent: ${yamlScalar(match.intent)}`);
  }
  return lines;
}

function emitRoute(route, baseIndent) {
  const lines = [];
  // Preserve a stable key order for readability.
  const keyOrder = ['system', 'type', 'namespace_dir', 'cli', 'skill', 'mode', 'writer', 'path', 'reason'];
  const seen = new Set();
  for (const k of keyOrder) {
    if (route[k] === undefined) continue;
    lines.push(`${baseIndent}${k}: ${yamlScalar(route[k])}`);
    seen.add(k);
  }
  for (const k of Object.keys(route)) {
    if (seen.has(k)) continue;
    lines.push(`${baseIndent}${k}: ${yamlScalar(route[k])}`);
  }
  return lines;
}

function buildYaml(data) {
  const out = [];
  out.push('# ATLAS Routing Rules — where new facts go');
  out.push('#');
  out.push('# AUTO-GENERATED from commands/remember.md by scripts/sync-routing.js.');
  out.push('# DO NOT HAND-EDIT. Edit the JSON block in commands/remember.md instead,');
  out.push('# then run: node ~/.claude/scripts/sync-routing.js');
  out.push('#');
  out.push('# Read by /remember and the context-router skill. Each rule has a `match`');
  out.push('# (regex patterns or content-type keywords) and a `route` (target system +');
  out.push('# suggested file/path). First match wins. Default route at the bottom.');
  out.push('');
  out.push(`version: ${yamlScalar(data.version ?? 1)}`);
  out.push(`updated: ${yamlScalar(data.updated || new Date().toISOString().slice(0, 10))}`);
  out.push('');
  out.push('rules:');
  for (const rule of data.rules || []) {
    out.push('');
    out.push(`  - name: ${yamlScalar(rule.name)}`);
    if (rule.match) {
      out.push('    match:');
      out.push(...emitMatch(rule.match, '      '));
    }
    if (rule.route) {
      out.push('    route:');
      out.push(...emitRoute(rule.route, '      '));
    }
  }
  out.push('');
  out.push('# Notes:');
  out.push('# - Rules are ordered. First match wins. Move more-specific rules above more-general ones.');
  out.push('# - `${slug}` is a kebab-case slug derived from the fact\'s first 4-6 words.');
  out.push('# - `${cwd_slug}` follows session-stop.sh convention: replace [/\\:] with _, collapse repeats.');
  out.push('');
  return out.join('\n');
}

function main() {
  const remember = fs.readFileSync(REMEMBER_MD, 'utf8');
  const data = extractRulesJson(remember);
  const yaml = buildYaml(data);

  if (DRY_RUN) {
    process.stdout.write(yaml);
    return;
  }

  let existing = '';
  try {
    existing = fs.readFileSync(ROUTING_YML, 'utf8');
  } catch {
    // file missing — fine
  }
  if (existing === yaml) {
    console.error('[sync-routing] no changes — routing-rules.yml is up to date');
    return;
  }

  fs.writeFileSync(ROUTING_YML, yaml);
  console.error(`[sync-routing] wrote ${data.rules.length} rules to ${path.relative(CLAUDE_DIR, ROUTING_YML)}`);
}

try {
  main();
} catch (e) {
  console.error(`[sync-routing] ${e.message}`);
  process.exit(1);
}

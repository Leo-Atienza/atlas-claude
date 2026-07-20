#!/usr/bin/env node
/**
 * validate-commands.js
 *
 * Cross-checks `commands/**\/*.md` filesystem against `REFERENCE.md`.
 * Reports drift in both directions:
 *
 *   - filesystem command → no row in REFERENCE.md  (undocumented)
 *   - REFERENCE.md slash command → no command file (ghost reference)
 *
 * Exit 0 = clean. Exit 1 = drift.
 *
 * Note: REFERENCE.md is a CURATED quick-lookup, not exhaustive — so
 * undocumented commands raise a WARNING, not an error. Ghost references
 * are always errors (they mislead Claude every session).
 */

'use strict';

const fs = require('fs');
const path = require('path');

const HOME = require('os').homedir();
const COMMANDS_DIR = path.join(HOME, '.claude', 'commands');
const REFERENCE_FILE = path.join(HOME, '.claude', 'REFERENCE.md');

function walkCommands(dir, prefix = '') {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkCommands(full, prefix ? `${prefix}/${entry.name}` : entry.name));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      const name = entry.name.replace(/\.md$/, '');
      out.push({
        slash: prefix ? `/${prefix}:${name}` : `/${name}`,
        path: full,
      });
    }
  }
  return out;
}

function extractRefSlashCmds(text) {
  // Match `/word`, `/foo:bar`, `/group:sub:cmd`, `/group/sub:cmd` in the doc body.
  // The slug allows `/` so multi-level plugin namespaces like
  // `/cctools/aichat:recover-context` (emitted by walkCommands for
  // commands ≥2 dirs deep) match against REFERENCE.md.
  const cmds = new Set();
  const RE = /(?:^|[\s(`])\/([a-z][\w:/-]+)(?=[\s)`,.]|$)/gm;
  let m;
  while ((m = RE.exec(text)) !== null) {
    const slash = '/' + m[1];
    // Skip false positives like file paths or URL fragments
    if (slash.includes('//')) continue;
    if (slash.endsWith(':')) continue;
    if (slash.endsWith('/')) continue;
    // A slug with `/` but no `:` is a file path, not a command — the walker
    // always joins the leaf name with `:`, so real commands with `/` also have `:`.
    if (slash.includes('/', 1) && !slash.includes(':')) continue;
    cmds.add(slash);
  }
  return cmds;
}

function loadEnabledPluginNamespaces() {
  // Slash commands of the form /<plugin>:<sub> are provided by plugins
  // listed under enabledPlugins in settings.json. These should not be
  // counted as ghosts — they live inside the plugin package, not commands/.
  const SETTINGS = path.join(HOME, '.claude', 'settings.json');
  try {
    const cfg = JSON.parse(fs.readFileSync(SETTINGS, 'utf8'));
    const plugins = cfg.enabledPlugins || {};
    return new Set(Object.keys(plugins).map(k => k.split('@')[0]));
  } catch { return new Set(); }
}

function main() {
  if (!fs.existsSync(REFERENCE_FILE)) {
    process.stderr.write(`missing: ${REFERENCE_FILE}\n`);
    process.exit(2);
  }
  const refText = fs.readFileSync(REFERENCE_FILE, 'utf8');
  const fsCmds = walkCommands(COMMANDS_DIR);
  const fsSlashes = new Set(fsCmds.map(c => c.slash));
  const refSlashes = extractRefSlashCmds(refText);
  const pluginNs = loadEnabledPluginNamespaces();

  // Some REFERENCE entries are conceptual placeholders or built-ins
  // (e.g. /install-github-app is a Claude Code built-in). Allow-list them.
  const ALLOW_GHOST = new Set([
    '/install-github-app',  // Claude Code built-in
    '/skill-creator',       // Anthropic skill, not a local command file
    '/loop',                // skill, no command file
    '/schedule',            // skill, no command file
    '/audit',               // routed via skill `audit`, not a commands/ file
    '/critique',            // sub-step of /audit skill (when present in REFERENCE)
    '/polish',              // sub-step of /audit skill (when present in REFERENCE)
  ]);

  // Plugin-provided commands of the form /<plugin>:<sub> are real.
  function isPluginCommand(slash) {
    if (!slash.includes(':')) return false;
    const head = slash.slice(1).split(':')[0];
    return pluginNs.has(head);
  }

  const undocumented = [...fsSlashes].filter(c => !refSlashes.has(c));
  const ghosts = [...refSlashes].filter(c =>
    !fsSlashes.has(c) && !ALLOW_GHOST.has(c) && !isPluginCommand(c)
  );

  const result = {
    ok: ghosts.length === 0,                    // ghosts are errors
    warnings: undocumented.length,              // undocumented are warnings only
    counts: {
      fs_commands: fsSlashes.size,
      ref_slashes: refSlashes.size,
      plugin_namespaces: pluginNs.size,
      ghosts: ghosts.length,
      undocumented: undocumented.length,
    },
    ghosts,
    undocumented,
    sources: { fs: COMMANDS_DIR, ref: REFERENCE_FILE, settings: 'settings.json#enabledPlugins' },
  };
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  process.exit(result.ok ? 0 : 1);
}

main();
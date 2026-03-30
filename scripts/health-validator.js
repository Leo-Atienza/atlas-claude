#!/usr/bin/env node
/**
 * Health Validator — Automated health checks for Claude Code configuration.
 *
 * Usage:
 *   node health-validator.js                        # Run all checks
 *   node health-validator.js --check registry       # Single check
 *   node health-validator.js --skip-network          # Skip version checks (fast)
 *   node health-validator.js --check versions --skip-network  # Dry-run versions
 *
 * Checks: registry, knowledge, versions, hooks, behavior
 * Output: JSON to stdout. Exit code always 0 (reporter, not gate).
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const SKILLS_DIR = path.join(CLAUDE_DIR, 'skills');
const MEMORY_DIR = path.join(CLAUDE_DIR, 'projects', '<PROJECT_MEMORY_DIR>', 'memory');
const MANIFEST_PATH = path.join(SKILLS_DIR, 'VERSION-MANIFEST.json');
const REGISTRY_PATH = path.join(SKILLS_DIR, 'REGISTRY.md');
const INDEX_PATH = path.join(MEMORY_DIR, 'INDEX.md');
const SETTINGS_PATH = path.join(CLAUDE_DIR, 'settings.json');
const SESSIONS_DIR = path.join(MEMORY_DIR, 'sessions');

// ─── Helpers ─────────────────────────────────────────────────────────

function safeExec(cmd, timeoutMs = 5000) {
  try {
    return execSync(cmd, { timeout: timeoutMs, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
}

function safeReadFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

function daysSince(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return Infinity;
  return Math.round((Date.now() - d.getTime()) / 86400000);
}

// ─── Check 1: Registry Integrity ─────────────────────────────────────

function registryIntegrity() {
  const result = { total: 0, missing: 0, details: [] };

  const content = safeReadFile(REGISTRY_PATH);
  if (!content) {
    result.details.push('REGISTRY.md not found');
    return result;
  }

  // Match backtick-quoted paths in table rows: | ID | Name | Purpose | `path` |
  const pathRegex = /\|\s*`([^`]+)`\s*\|?\s*$/gm;
  let match;

  while ((match = pathRegex.exec(content)) !== null) {
    const relPath = match[1];

    // Skip non-path entries (plugin IDs, marketplace refs, Docker refs, etc.)
    if (relPath.includes('@') || relPath.startsWith('Docker') || relPath.startsWith('Built-in') || relPath.startsWith('Plugin')) continue;
    // Skip MCP access descriptions (not file paths)
    if (/^[A-Z]/.test(relPath) && !relPath.startsWith('skills/') && !relPath.startsWith('commands/') && !relPath.startsWith('agents/')) continue;

    result.total++;

    // Resolve path relative to ~/.claude/
    const absPath = path.join(CLAUDE_DIR, relPath);

    if (!fs.existsSync(absPath)) {
      result.missing++;
      result.details.push(`NOT FOUND: ${relPath}`);
    }
  }

  return result;
}

// ─── Check 2: Knowledge Staleness ────────────────────────────────────

function knowledgeStaleness() {
  const result = { total: 0, stale: 0, stale_threshold_days: 90, details: [] };

  const content = safeReadFile(INDEX_PATH);
  if (!content) {
    result.details.push('INDEX.md not found');
    return result;
  }

  // Match table rows with ID and Date columns: | G-PAT-001 | Name | Summary | Tags | 2026-02-27 |
  const rowRegex = /^\|\s*(G-\w+-\d+)\s*\|\s*([^|]+)\|[^|]+\|[^|]+\|\s*(\d{4}-\d{2}-\d{2})\s*\|/gm;
  let match;

  while ((match = rowRegex.exec(content)) !== null) {
    const id = match[1].trim();
    const name = match[2].trim();
    const date = match[3].trim();
    result.total++;

    const days = daysSince(date);
    if (days > result.stale_threshold_days) {
      result.stale++;
      result.details.push(`${id} "${name}" — last verified ${date} (${days} days ago)`);
    }
  }

  return result;
}

// ─── Check 3: Version Manifest ───────────────────────────────────────

function versionManifest(skipNetwork = false) {
  const result = {
    npm_updates: [],
    gh_updates: [],
    git_updates: [],
    errors: []
  };

  const content = safeReadFile(MANIFEST_PATH);
  if (!content) {
    result.errors.push('VERSION-MANIFEST.json not found');
    return result;
  }

  let manifest;
  try {
    manifest = JSON.parse(content);
  } catch (e) {
    result.errors.push(`VERSION-MANIFEST.json parse error: ${e.message}`);
    return result;
  }

  if (skipNetwork) {
    // Report staleness from dates only
    for (const [name, info] of Object.entries(manifest.cli_tools || {})) {
      const days = daysSince(info.last_checked);
      if (days > 14) {
        result.npm_updates.push({ name, current: info.installed, latest: '(check needed)', days_since_check: days });
      }
    }
    for (const [name, info] of Object.entries(manifest.skill_packs || {})) {
      const days = daysSince(info.last_checked);
      if (days > 14) {
        result.gh_updates.push({ name, days_since_check: days, latest_commit: '(check needed)' });
      }
    }
    return result;
  }

  // npm tools
  for (const [name, info] of Object.entries(manifest.cli_tools || {})) {
    if (info.source && info.source.startsWith('npm:')) {
      const pkg = info.source.replace('npm:', '');
      const latest = safeExec(`npm view ${pkg} version`);
      if (latest && latest !== info.installed) {
        result.npm_updates.push({ name, current: info.installed, latest });
      }
    }
    // go tools — check if go is available and tool can be queried
    if (info.source && info.source.startsWith('go:')) {
      // Go doesn't have a simple "view latest" — report days since check
      const days = daysSince(info.last_checked);
      if (days > 30) {
        result.npm_updates.push({ name, current: info.installed, latest: '(go — manual check)', days_since_check: days });
      }
    }
    // github releases
    if (info.source && info.source.startsWith('github:')) {
      const repo = info.source.replace('github:', '');
      const latest = safeExec(`gh api repos/${repo}/releases/latest --jq ".tag_name" 2>/dev/null`);
      if (latest && latest !== info.installed && latest !== `v${info.installed}`) {
        result.npm_updates.push({ name, current: info.installed, latest, source: 'github-release' });
      }
    }
  }

  // GitHub skill packs
  for (const [name, info] of Object.entries(manifest.skill_packs || {})) {
    if (info.pinned) continue;
    if (info.source && info.source.startsWith('github:')) {
      const repo = info.source.replace('github:', '');
      const latestDate = safeExec(`gh api repos/${repo}/commits?per_page=1 --jq ".[0].commit.committer.date"`);
      if (latestDate) {
        const daysSinceCommit = daysSince(latestDate);
        const daysSinceCheck = daysSince(info.last_checked);
        // If repo has commits newer than our last check
        if (new Date(latestDate) > new Date(info.last_checked)) {
          result.gh_updates.push({
            name,
            days_since_check: daysSinceCheck,
            latest_commit: latestDate,
            repo
          });
        }
      }
    }
  }

  // Git-tracked skills
  for (const [name, info] of Object.entries(manifest.git_skills || {})) {
    const skillPath = path.join(CLAUDE_DIR, info.path);
    if (fs.existsSync(path.join(skillPath, '.git'))) {
      const fetchResult = safeExec(`git -C "${skillPath}" fetch --dry-run 2>&1`);
      if (fetchResult && fetchResult.length > 0) {
        result.git_updates.push({ name, behind: true, path: info.path });
      }
    }
  }

  return result;
}

// ─── Check 4: Hook Integrity ─────────────────────────────────────────

function hookIntegrity() {
  const result = { total: 0, missing: 0, details: [] };

  const content = safeReadFile(SETTINGS_PATH);
  if (!content) {
    result.details.push('settings.json not found');
    return result;
  }

  let settings;
  try {
    settings = JSON.parse(content);
  } catch {
    result.details.push('settings.json parse error');
    return result;
  }

  // settings.json structure: hooks.EventName[].hooks[].command (nested)
  const hookEvents = settings.hooks || {};
  for (const [event, matchers] of Object.entries(hookEvents)) {
    if (!Array.isArray(matchers)) continue;
    for (const matcher of matchers) {
      const innerHooks = matcher.hooks || [];
      if (!Array.isArray(innerHooks)) continue;
      for (const hook of innerHooks) {
        if (hook.type !== 'command' || !hook.command) continue;
        result.total++;

        // Extract script path from command string
        // Patterns: "bash ~/.claude/hooks/foo.sh", "node ~/.claude/hooks/bar.js", "~/.claude/bin/claudio || true"
        const cmd = hook.command.replace(/\|\|.*$/, '').trim(); // strip || true fallbacks
        const parts = cmd.split(/\s+/).filter(p => p.startsWith('~') || p.startsWith('/'));

        for (const part of parts) {
          const resolved = part.replace(/^~/, os.homedir()).replace(/"/g, '');
          if (!fs.existsSync(resolved)) {
            result.missing++;
            result.details.push(`${event}: ${part} — not found`);
          }
        }
      }
    }
  }

  return result;
}

// ─── Check 5: Behavioral Audit ───────────────────────────────────────

function behavioralAudit() {
  const result = {
    last_3_reflected: true,
    pending_flags: false,
    sessions_without_security: [],
    total_sessions: 0
  };

  // Check pending reflection flag
  const flagPath = path.join(CLAUDE_DIR, '.pending-reflection');
  result.pending_flags = fs.existsSync(flagPath);

  // Check sessions index
  const indexPath = path.join(SESSIONS_DIR, 'sessions-index.md');
  const indexContent = safeReadFile(indexPath);

  if (!indexContent) {
    result.last_3_reflected = false;
    return result;
  }

  // Parse session entries — format varies, look for date-based filenames
  const sessionFiles = [];
  try {
    const files = fs.readdirSync(SESSIONS_DIR)
      .filter(f => f.endsWith('.md') && f !== 'sessions-index.md')
      .sort()
      .reverse();
    result.total_sessions = files.length;

    // Check last 3 sessions for reflection (they exist = reflection happened)
    if (files.length < 3) {
      result.last_3_reflected = files.length > 0;
    }

    // Check last 5 sessions for security scan mentions
    const recentFiles = files.slice(0, 5);
    for (const file of recentFiles) {
      const content = safeReadFile(path.join(SESSIONS_DIR, file));
      if (content && !(/security|sharp-edges|differential-review|security-scan/i.test(content))) {
        result.sessions_without_security.push(file);
      }
    }
  } catch {
    // Sessions dir might not exist
  }

  return result;
}

// ─── Main ────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const checkArg = args.indexOf('--check');
  const specificCheck = checkArg !== -1 ? args[checkArg + 1] : null;
  const skipNetwork = args.includes('--skip-network');

  const results = {};

  if (!specificCheck || specificCheck === 'registry') {
    results.registry = registryIntegrity();
  }
  if (!specificCheck || specificCheck === 'knowledge') {
    results.knowledge = knowledgeStaleness();
  }
  if (!specificCheck || specificCheck === 'versions') {
    results.versions = versionManifest(skipNetwork);
  }
  if (!specificCheck || specificCheck === 'hooks') {
    results.hooks = hookIntegrity();
  }
  if (!specificCheck || specificCheck === 'behavior') {
    results.behavior = behavioralAudit();
  }

  console.log(JSON.stringify(results, null, 2));
}

main();

#!/usr/bin/env node
/**
 * Health Validator — Automated health checks for Claude Code configuration.
 *
 * Usage:
 *   node health-validator.js                        # Run all checks
 *   node health-validator.js --check versions       # Single check
 *   node health-validator.js --skip-network          # Skip version checks (fast)
 *   node health-validator.js --check versions --skip-network  # Dry-run versions
 *
 * Checks: knowledge, versions, behavior (hook-wiring integrity is owned by system-doctor.js)
 * Output: JSON to stdout. Exit code always 0 (reporter, not gate).
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const SKILLS_DIR = path.join(CLAUDE_DIR, 'skills');
const MANIFEST_PATH = path.join(SKILLS_DIR, 'VERSION-MANIFEST.json');
// Knowledge migrated to the Obsidian vault in v8.0.0 (was topics/KNOWLEDGE-DIRECTORY.md).
const ENGINEERING_DIR = path.join(os.homedir(), 'Documents', 'Wiki', 'wiki', 'engineering');
const KNOWLEDGE_FILES = ['patterns', 'solutions', 'errors', 'preferences', 'failures'];

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

// ─── Check 1: Knowledge Staleness ────────────────────────────────────

function knowledgeStaleness() {
  const result = { total: 0, stale: 0, stale_threshold_days: 90, details: [] };

  result.files_found = 0;
  for (const name of KNOWLEDGE_FILES) {
    const content = safeReadFile(path.join(ENGINEERING_DIR, name + '.md'));
    if (content == null) continue;
    result.files_found++;

    // Each entry is an H2 header: "## KNOWLEDGE-NNN ...".
    const entries = content.match(/^## KNOWLEDGE-\d+/gm);
    result.total += entries ? entries.length : 0;

    // File-level freshness from frontmatter `updated:` — per-entry dates aren't
    // reliably present after the v8.0.0 vault migration, so file freshness is
    // the honest staleness signal (no false positives).
    const um = content.match(/^updated:\s*['"]?(\d{4}-\d{2}-\d{2})/m);
    if (um) {
      const days = daysSince(um[1]);
      if (days > result.stale_threshold_days) {
        result.stale++;
        result.details.push(`${name}.md — last updated ${um[1]} (${days} days ago)`);
      }
    }
  }

  if (result.files_found === 0) {
    result.details.push(`engineering vault not found at ${ENGINEERING_DIR}`);
  }

  return result;
}

// ─── Check 3: Version Manifest ───────────────────────────────────────

function versionManifest(skipNetwork = false) {
  const result = {
    tool_updates: [],   // npm, go, and github-release CLI tools
    gh_updates: [],     // GitHub skill pack updates
    git_updates: [],    // Git-tracked skill updates
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
        result.tool_updates.push({ name, current: info.installed, latest: '(check needed)', days_since_check: days });
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
        result.tool_updates.push({ name, current: info.installed, latest });
      }
    }
    // go tools — check if go is available and tool can be queried
    if (info.source && info.source.startsWith('go:')) {
      // Go doesn't have a simple "view latest" — report days since check
      const days = daysSince(info.last_checked);
      if (days > 30) {
        result.tool_updates.push({ name, current: info.installed, latest: '(go — manual check)', days_since_check: days });
      }
    }
    // github releases
    if (info.source && info.source.startsWith('github:')) {
      const repo = info.source.replace('github:', '');
      const latest = safeExec(`gh api repos/${repo}/releases/latest --jq ".tag_name"`);
      if (latest && latest !== info.installed && latest !== `v${info.installed}`) {
        result.tool_updates.push({ name, current: info.installed, latest, source: 'github-release' });
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

// ─── Check: Behavioral Audit ─────────────────────────────────────────
// (Hook-wiring integrity moved to system-doctor.js `hooks` validator — /health
//  reads that scoreboard row in §1 instead of re-checking here.)

function behavioralAudit() {
  const result = {
    pending_flags: false,
    knowledge_health: { total: 0, pages_found: 0, pages_expected: 5 },
  };

  // Check pending reflection flag
  const flagPath = path.join(CLAUDE_DIR, '.pending-reflection');
  result.pending_flags = fs.existsSync(flagPath);

  // Check knowledge store health (all 5 engineering vault files present)
  for (const name of KNOWLEDGE_FILES) {
    const content = safeReadFile(path.join(ENGINEERING_DIR, name + '.md'));
    if (content == null) continue;
    result.knowledge_health.pages_found++;
    const entries = content.match(/^## KNOWLEDGE-\d+/gm);
    result.knowledge_health.total += entries ? entries.length : 0;
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

  if (!specificCheck || specificCheck === 'knowledge') {
    results.knowledge = knowledgeStaleness();
  }
  if (!specificCheck || specificCheck === 'versions') {
    results.versions = versionManifest(skipNetwork);
  }
  if (!specificCheck || specificCheck === 'behavior') {
    results.behavior = behavioralAudit();
  }

  console.log(JSON.stringify(results, null, 2));
}

main();

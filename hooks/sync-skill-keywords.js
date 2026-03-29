#!/usr/bin/env node
// SessionStart hook — Regenerates skill keyword cache from REGISTRY.md + SKILL.md frontmatter.
//
// Reads active skills from REGISTRY.md, extracts `keywords` arrays from each SKILL.md
// frontmatter, and writes cache/skill-keyword-map.json for skill-injector.js to consume.
// This ensures newly created skills (via self-evolve) are discoverable by keyword matching.

const fs = require('fs');
const os = require('os');
const path = require('path');

const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const REGISTRY_PATH = path.join(CLAUDE_DIR, 'skills', 'REGISTRY.md');
const CACHE_DIR = path.join(CLAUDE_DIR, 'cache');
const CACHE_PATH = path.join(CACHE_DIR, 'skill-keyword-map.json');

// Stop words to exclude when deriving keywords from name/description
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
  'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'may', 'might', 'shall', 'can', 'this', 'that', 'these', 'those', 'it', 'its',
  'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such',
  'no', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just',
  'skill', 'skills', 'use', 'using', 'used', 'create', 'guide', 'tool', 'tools',
]);

function parseRegistryTable(content) {
  const skills = [];
  const lines = content.split('\n');
  let inActiveTable = false;

  for (const line of lines) {
    // Detect active skill table headers
    if (/^## Standalone Skills \(Active\)/.test(line) || /^## Fullstack Dev Specialists \(Active\)/.test(line)) {
      inActiveTable = true;
      continue;
    }
    // Stop at next section
    if (inActiveTable && /^## /.test(line) && !/Active\)/.test(line)) {
      inActiveTable = false;
      continue;
    }

    if (!inActiveTable) continue;

    // Parse table rows: | ID | Name | Purpose | Path |
    const match = line.match(/^\|\s*(SK-\d+|FS-\d+)\s*\|\s*(\S+)\s*\|\s*(.+?)\s*\|\s*`(.+?)`\s*\|/);
    if (match) {
      skills.push({
        id: match[1],
        name: match[2],
        purpose: match[3].trim(),
        path: match[4].trim(),
      });
    }
  }
  return skills;
}

function parseSkillFrontmatter(skillPath) {
  const fullPath = path.join(CLAUDE_DIR, skillPath);
  // Resolve SKILL.md if path is a directory
  let filePath = fullPath;
  if (!fullPath.endsWith('.md')) {
    filePath = path.join(fullPath, 'SKILL.md');
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) return null;

    const fm = fmMatch[1];
    // Extract keywords array from YAML frontmatter
    const kwMatch = fm.match(/^keywords:\s*\[(.+?)\]/m);
    if (kwMatch) {
      return kwMatch[1]
        .split(',')
        .map(k => k.trim().replace(/^["']|["']$/g, ''))
        .filter(k => k.length > 0);
    }
  } catch (e) {
    // File doesn't exist or can't be read
  }
  return null;
}

function deriveKeywords(name, purpose) {
  const text = `${name} ${purpose}`.toLowerCase();
  const words = text.split(/[^\w]+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
  // Deduplicate
  return [...new Set(words)];
}

function buildCache() {
  let registryContent;
  try {
    registryContent = fs.readFileSync(REGISTRY_PATH, 'utf8');
  } catch (e) {
    return; // No registry, nothing to do
  }

  const registrySkills = parseRegistryTable(registryContent);
  const skills = [];

  for (const skill of registrySkills) {
    // Try to get explicit keywords from SKILL.md frontmatter
    const explicit = parseSkillFrontmatter(skill.path);

    let patterns;
    if (explicit && explicit.length > 0) {
      // Use explicit keywords — escape regex special chars, join as alternation
      patterns = explicit.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*'));
    } else {
      // Derive from name + purpose
      const derived = deriveKeywords(skill.name, skill.purpose);
      if (derived.length === 0) continue;
      // Use the most distinctive words (skip very common ones)
      patterns = derived.slice(0, 6);
    }

    skills.push({
      id: skill.id,
      name: skill.name,
      path: skill.path,
      patterns,
      source: explicit ? 'frontmatter' : 'derived',
    });
  }

  // Write cache
  try { fs.mkdirSync(CACHE_DIR, { recursive: true }); } catch (e) {}

  const cache = {
    _meta: {
      generated: new Date().toISOString(),
      source: 'REGISTRY.md',
      skill_count: skills.length,
    },
    skills,
  };

  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
}

try {
  buildCache();
} catch (e) {
  // Silent failure — graceful degradation per CLAUDE.md rules
}

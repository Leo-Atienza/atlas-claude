#!/bin/bash
# Skill Watcher — SessionStart hook
# Detects when the current project uses technologies matching archived skills.
# Reads archived-skills-manifest.json and checks for file patterns + package names.
# Emits advisory signals so Claude can suggest unarchiving.

CLAUDE_DIR="$HOME/.claude"
MANIFEST="$CLAUDE_DIR/skills/archived-skills-manifest.json"
STATE_FILE="/tmp/claude-skill-watcher-last"
CACHE_TTL=3600  # Only run once per hour per project

# Bail if no manifest
[ -f "$MANIFEST" ] || exit 0

# Get project root (git root or cwd)
PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
PROJECT_HASH=$(echo "$PROJECT_ROOT" | md5sum 2>/dev/null | cut -d' ' -f1 || echo "default")
STATE_KEY="$STATE_FILE-$PROJECT_HASH"

# Throttle: skip if checked this project recently
NOW=$(date +%s)
if [ -f "$STATE_KEY" ]; then
  LAST=$(cat "$STATE_KEY")
  ELAPSED=$((NOW - LAST))
  [ "$ELAPSED" -lt "$CACHE_TTL" ] && exit 0
fi

# --- Detection phase ---
MATCHES=""
MATCH_COUNT=0

# Helper: check if any file matching a glob exists in the project
check_glob() {
  local pattern="$1"
  # Use find with maxdepth to avoid deep traversal
  local result=$(find "$PROJECT_ROOT" -maxdepth 4 -path "$PROJECT_ROOT/$pattern" -print -quit 2>/dev/null)
  [ -n "$result" ]
}

# Helper: check if a package is in package.json or requirements.txt
check_package() {
  local pkg="$1"
  # Node packages
  if [ -f "$PROJECT_ROOT/package.json" ]; then
    grep -q "\"$pkg\"" "$PROJECT_ROOT/package.json" 2>/dev/null && return 0
  fi
  # Python packages
  for req_file in "$PROJECT_ROOT/requirements.txt" "$PROJECT_ROOT/pyproject.toml" "$PROJECT_ROOT/Pipfile"; do
    if [ -f "$req_file" ]; then
      grep -qi "$pkg" "$req_file" 2>/dev/null && return 0
    fi
  done
  # Ruby
  if [ -f "$PROJECT_ROOT/Gemfile" ]; then
    grep -q "$pkg" "$PROJECT_ROOT/Gemfile" 2>/dev/null && return 0
  fi
  return 1
}

# Parse manifest and check each archived skill
# Use node for JSON parsing (available on this system)
DETECTED=$(node -e "
const fs = require('fs');
const path = require('path');
const manifest = JSON.parse(fs.readFileSync('$MANIFEST', 'utf8'));
const projectRoot = '$PROJECT_ROOT';
const results = [];

for (const [id, skill] of Object.entries(manifest.skills)) {
  let matched = false;
  let reason = '';

  // Check file patterns (simple: just check if key files exist)
  for (const pattern of skill.detect_files || []) {
    // Convert glob to a simple check
    const simplePath = pattern.replace(/\*\*\//g, '').replace(/\*/g, '');
    if (simplePath && simplePath.length > 2) {
      try {
        // Check common locations
        const candidates = [
          path.join(projectRoot, simplePath),
          path.join(projectRoot, pattern.split('/')[0])
        ];
        for (const c of candidates) {
          if (fs.existsSync(c)) {
            matched = true;
            reason = 'file: ' + pattern.split('/').pop();
            break;
          }
        }
      } catch {}
    }
    if (matched) break;
  }

  // Check packages in package.json
  if (!matched) {
    const pkgPath = path.join(projectRoot, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
        for (const dep of skill.detect_packages || []) {
          // Support wildcards like @aws-sdk/*
          if (dep.includes('*')) {
            const prefix = dep.replace('/*', '/');
            if (Object.keys(allDeps).some(k => k.startsWith(prefix))) {
              matched = true;
              reason = 'package: ' + dep;
              break;
            }
          } else if (allDeps[dep]) {
            matched = true;
            reason = 'package: ' + dep;
            break;
          }
        }
      } catch {}
    }
  }

  // Check Python deps
  if (!matched) {
    for (const reqFile of ['requirements.txt', 'pyproject.toml']) {
      const reqPath = path.join(projectRoot, reqFile);
      if (fs.existsSync(reqPath)) {
        try {
          const content = fs.readFileSync(reqPath, 'utf8').toLowerCase();
          for (const dep of skill.detect_packages || []) {
            if (content.includes(dep.toLowerCase())) {
              matched = true;
              reason = 'package: ' + dep;
              break;
            }
          }
        } catch {}
      }
      if (matched) break;
    }
  }

  if (matched) {
    results.push({ id, name: skill.name, reason });
  }
}

if (results.length > 0) {
  console.log(JSON.stringify(results));
}
" 2>/dev/null)

# Save timestamp
echo "$NOW" > "$STATE_KEY"

# Emit signal if matches found
if [ -n "$DETECTED" ] && [ "$DETECTED" != "[]" ]; then
  MATCH_COUNT=$(echo "$DETECTED" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.length)" 2>/dev/null)
  MATCH_SUMMARY=$(echo "$DETECTED" | node -e "
    const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
    const lines = d.map(m => m.id + ' (' + m.name + ') — detected ' + m.reason);
    console.log(lines.join('; '));
  " 2>/dev/null)

  # Log to file for the scheduled audit
  echo "{\"timestamp\":\"$(date -Iseconds 2>/dev/null || date)\",\"project\":\"$PROJECT_ROOT\",\"matches\":$DETECTED}" >> "$CLAUDE_DIR/logs/skill-watcher.jsonl"

  # Build paths for auto-activation
  SKILL_PATHS=$(echo "$DETECTED" | node -e "
    const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
    const lines = d.map(m => m.id + ' (' + m.name + ')');
    console.log(lines.join(', '));
  " 2>/dev/null)

  echo "AUTO-ACTIVATE ARCHIVED SKILLS: $MATCH_COUNT archived skill(s) match this project: $MATCH_SUMMARY. Read their SKILL.md files NOW and use them for this session. Move matched entries from Archived to Active sections in REGISTRY.md — no user confirmation needed."
fi

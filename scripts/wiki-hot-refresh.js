#!/usr/bin/env node
/**
 * wiki-hot-refresh.js — keep the wiki recall surface alive
 * =========================================================
 * hot.md is the per-session recall surface for ~/Documents/Wiki: session-start
 * §6a prints its top rows, but ONLY if hot.md's own mtime is <30 days old.
 * Historically only the wiki-manage ingest path wrote hot.md, so when ingests
 * paused (last: 2026-05-06) the surface went silently dark on ~2026-06-05 even
 * though engineering/ and personal/ pages were being written daily.
 *
 * This regenerates hot.md from BOTH sources:
 *   1. existing hand-written rows (rich ingest descriptions) are preserved
 *   2. any vault page with a filesystem mtime in the last WINDOW_DAYS that has
 *      no row at least that fresh gets an auto row ("touched (auto-detected)")
 * Rows are sorted newest-first and capped. Atomic write, fail-open: any error
 * leaves hot.md untouched and exits 0 so session-start never blocks.
 *
 * Wiring: session-start.sh §6a runs this before reading hot.md, self-throttled
 * (skipped when hot.md mtime <24h). Also safe to run manually or from weekly
 * tasks. Zero dependencies.
 *
 * Also regenerates each namespace's _index.md (File/Topic/Confidence/Updated/
 * Summary table from page frontmatter). Those indices were stamped
 * `auto_generated: true` by the one-shot v8.0.0 migration but had no living
 * writer — personal/_index.md claimed file_count: 2 while the folder held 30+.
 */

"use strict";

const fs = require("fs");
const path = require("path");

const HOME = process.env.HOME || process.env.USERPROFILE;
const WIKI_ROOT = process.env.ATLAS_WIKI_ROOT || path.join(HOME, "Documents", "Wiki");
const WIKI_DIR = path.join(WIKI_ROOT, "wiki");
const HOT = path.join(WIKI_DIR, "hot.md");
// Namespaces that count as "the knowledge base". session-log (churning write-only
// archive), graph artifacts, and raw/ drops are deliberately excluded as noise.
const NAMESPACES = ["concept", "entity", "source", "synthesis", "engineering", "personal", "web-dev", "app-dev"];
const WINDOW_DAYS = Number(process.env.WIKI_HOT_WINDOW_DAYS || 30);
const MAX_ROWS = Number(process.env.WIKI_HOT_MAX_ROWS || 40);
const MAX_DEPTH = 3;

const NOW = new Date();
const TODAY = NOW.toISOString().slice(0, 10);
const CUTOFF = NOW.getTime() - WINDOW_DAYS * 86400000;

function listPages() {
  const out = [];
  const walk = (dir, rel, depth) => {
    if (depth > MAX_DEPTH) return;
    let names;
    try {
      names = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of names) {
      // Skip dotfiles AND _-prefixed entries (_index.md etc.) — the namespace
      // indices are regenerated artifacts; listing them as "touched" floods
      // hot.md with self-generated noise (v8.14 audit; matches recall.js).
      if (e.name.startsWith(".") || e.name.startsWith("_")) continue;
      const full = path.join(dir, e.name);
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) walk(full, r, depth + 1);
      else if (e.name.endsWith(".md")) {
        try {
          out.push({ rel: r, mtime: fs.statSync(full).mtime });
        } catch {
          /* skip unreadable */
        }
      }
    }
  };
  for (const ns of NAMESPACES) walk(path.join(WIKI_DIR, ns), ns, 0);
  // index.md / log.md changes are themselves recall-relevant
  for (const f of ["index.md"]) {
    try {
      out.push({ rel: f, mtime: fs.statSync(path.join(WIKI_DIR, f)).mtime });
    } catch {
      /* absent — fine */
    }
  }
  return out;
}

function parseExistingRows() {
  // Rows look like: | page | YYYY-MM-DD | action text |
  const rows = [];
  let text;
  try {
    text = fs.readFileSync(HOT, "utf8");
  } catch {
    return rows;
  }
  for (const line of text.split("\n")) {
    const m = line.match(/^\|\s*([^|]+?)\s*\|\s*(\d{4}-\d{2}-\d{2})\s*\|\s*(.+?)\s*\|\s*$/);
    if (!m) continue;
    if (/^Page$/i.test(m[1]) || /^-+$/.test(m[1])) continue;
    rows.push({ page: m[1], date: m[2], action: m[3] });
  }
  return rows;
}

function build() {
  const existing = parseExistingRows().filter((r) => new Date(r.date + "T00:00:00Z").getTime() >= CUTOFF);
  // newest hand-written date per page (hand rows carry rich descriptions — keep them authoritative when fresh)
  const newestByPage = new Map();
  for (const r of existing) {
    const prev = newestByPage.get(r.page);
    if (!prev || r.date > prev) newestByPage.set(r.page, r.date);
  }
  const auto = [];
  for (const p of listPages()) {
    if (p.mtime.getTime() < CUTOFF) continue;
    const d = p.mtime.toISOString().slice(0, 10);
    const known = newestByPage.get(p.rel);
    if (known && known >= d) continue; // a hand-written row already covers this write
    auto.push({ page: p.rel, date: d, action: "touched (auto-detected fs write)" });
  }
  const rows = existing
    .concat(auto)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, MAX_ROWS);

  const lines = [
    "---",
    "title: Hot Cache",
    "type: hot",
    `updated: ${TODAY}`,
    "---",
    "",
    "# Hot Cache",
    "",
    `> Pages touched in the last ${WINDOW_DAYS} days. Claude checks this before index.md for fast retrieval.`,
    "",
    "<!-- Regenerated by ~/.claude/scripts/wiki-hot-refresh.js (session-start §6a, ≤1x/24h). -->",
    "<!-- Hand-written ingest rows are preserved; 'touched (auto-detected ...)' rows fill the gaps. -->",
    "",
    "| Page | Last Touched | Action |",
    "|------|-------------|--------|",
    ...rows.map((r) => `| ${r.page} | ${r.date} | ${r.action} |`),
    "",
  ];
  return lines.join("\n");
}

// ── namespace _index.md regeneration ─────────────────────────────────
function frontmatter(file) {
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    return {};
  }
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const fm = {};
  let lastKey = null;
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (kv) {
      lastKey = kv[1];
      fm[lastKey] = kv[2].replace(/^['"]|['"]$/g, "").trim();
    } else if (lastKey && /^\s+\S/.test(line)) {
      fm[lastKey] += " " + line.trim().replace(/^['"]|['"]$/g, ""); // folded multi-line scalar
    }
  }
  return fm;
}

function regenIndex(ns) {
  const dir = path.join(WIKI_DIR, ns);
  const label = ns.split("/").pop(); // heading/title use the leaf: personal/project-state → "project-state/"
  const pages = [];
  const walk = (d, rel, depth) => {
    if (depth > MAX_DEPTH) return;
    let names;
    try {
      names = fs.readdirSync(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of names) {
      if (e.name.startsWith(".") || e.name === "_index.md") continue;
      const full = path.join(d, e.name);
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) walk(full, r, depth + 1);
      else if (e.name.endsWith(".md")) pages.push({ rel: r, full });
    }
  };
  walk(dir, "", 0);
  if (!pages.length) return false;

  const rows = pages
    .map((p) => {
      const fm = frontmatter(p.full);
      const link = p.rel.replace(/\.md$/, "");
      const summary = (fm.summary || "").replace(/\|/g, "/").slice(0, 110);
      let updated = fm.updated || "";
      if (!updated) {
        try {
          updated = fs.statSync(p.full).mtime.toISOString().slice(0, 10);
        } catch {
          /* leave blank */
        }
      }
      return { link, topic: fm.topic || fm.type || "", conf: fm.confidence || "", updated, summary };
    })
    .sort((a, b) => (a.updated < b.updated ? 1 : a.updated > b.updated ? -1 : a.link.localeCompare(b.link)));

  const lines = [
    "---",
    `title: "Index — ${label}/"`,
    "type: folder-index",
    "auto_generated: true",
    `updated: ${TODAY}`,
    `file_count: ${rows.length}`,
    "---",
    "",
    `# ${label}/`,
    "",
    "<!-- Regenerated by ~/.claude/scripts/wiki-hot-refresh.js alongside hot.md (≤1x/24h). -->",
    "",
    "| File | Topic | Confidence | Updated | Summary |",
    "|---|---|---|---|---|",
    ...rows.map((r) => `| [[${r.link}]] | ${r.topic} | ${r.conf} | ${r.updated} | ${r.summary} |`),
    "",
  ];
  const out = path.join(dir, "_index.md");
  const tmp = out + ".tmp";
  fs.writeFileSync(tmp, lines.join("\n"));
  fs.renameSync(tmp, out);
  return true;
}

function main() {
  try {
    const content = build();
    const tmp = HOT + ".tmp";
    fs.writeFileSync(tmp, content);
    fs.renameSync(tmp, HOT);
    // Top-level namespaces + each personal/ subdirectory. The subdirs
    // (project-state, feedback, arcs, procedures, references, reflections) carry
    // their own _index.md that the v8.0.0 migration stamped but left no writer for,
    // so they drifted stale until added here. Discovered dynamically so a new
    // personal/ subdir self-indexes without another edit.
    const indexTargets = [...NAMESPACES];
    try {
      for (const e of fs.readdirSync(path.join(WIKI_DIR, "personal"), { withFileTypes: true })) {
        if (e.isDirectory() && !e.name.startsWith(".")) indexTargets.push(`personal/${e.name}`);
      }
    } catch {
      /* personal/ absent — fine */
    }
    let indexed = 0;
    for (const ns of indexTargets) {
      try {
        if (regenIndex(ns)) indexed++;
      } catch {
        /* per-namespace fail-open */
      }
    }
    if (!process.argv.includes("--quiet")) {
      const n = (content.match(/^\|/gm) || []).length - 2;
      console.log(
        `hot.md regenerated: ${Math.max(0, n)} row(s) in the ${WINDOW_DAYS}d window; ${indexed} namespace _index.md file(s) refreshed.`
      );
    }
  } catch {
    process.exit(0); // fail-open: stale hot.md beats a broken session start
  }
}

main();

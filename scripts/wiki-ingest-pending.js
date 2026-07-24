#!/usr/bin/env node
/**
 * wiki-ingest-pending.js — detect the wiki ingest backlog
 * =======================================================
 * Obsidian Web Clipper (and manual drops) land raw sources in
 * <your-vault-path>/raw/{articles,clips,papers,...}. They stay raw until
 * someone runs /wiki-ingest to compile them into wiki/source/ pages — and
 * compile is deliberately human-in-the-loop (the skill presents takeaways
 * and asks what to emphasize). So raw drops silently drift out of sync with
 * the compiled knowledge base, with nothing surfacing the backlog.
 *
 * This finds that backlog and surfaces it — it does NOT auto-compile (that
 * would skip the emphasis step). A raw file counts as compiled iff its
 * basename is referenced by any compiled page in wiki/{source,synthesis,
 * concept,entity}/ (ingest sometimes compiles straight into synthesis/ and
 * lists raws in its `sources:` frontmatter, so scanning source/ alone yields
 * false positives); we scan the full page text so both frontmatter and body
 * references count.
 *
 * Zero dependencies. Fail-open: any error prints nothing and exits 0, so it
 * can run blind in session-start without ever blocking startup.
 *
 * Modes:
 *   --surface   one throttled block for session-start (silent if backlog==0
 *               or surfaced within the throttle window; default 24h)
 *   --report    full markdown list (for the weekly-wiki-lint fold; no throttle)
 *   --json      machine-readable {generated_at, count, backlog:[...]}
 *   (default)   --report
 */

"use strict";

const fs = require("fs");
const path = require("path");

const HOME = process.env.HOME || process.env.USERPROFILE;
const CLAUDE_DIR = path.join(HOME, ".claude");
const WIKI_ROOT = process.env.ATLAS_WIKI_ROOT || path.join(HOME, "Documents", "Wiki");
const RAW_DIRS = ["raw/articles", "raw/clips", "raw/papers", "raw/presentations", "raw/spreadsheets"];
// Every namespace a compile can land in — a raw referenced by any of these is ingested.
const REF_DIRS = ["source", "synthesis", "concept", "entity"].map((d) => path.join(WIKI_ROOT, "wiki", d));
const STATE_FILE = path.join(CLAUDE_DIR, "cache", "wiki-ingest-pending.json");
const THROTTLE_HOURS = Number(process.env.WIKI_INGEST_THROTTLE_HOURS || 24);
const SURFACE_CAP = 3; // raw files listed in the surface block before "(+N more)"

const NOW = new Date();
const TODAY = NOW.toISOString().slice(0, 10);

// ── detection ────────────────────────────────────────────────────────
function listRaw() {
  const out = [];
  for (const rel of RAW_DIRS) {
    const dir = path.join(WIKI_ROOT, rel);
    let names;
    try {
      names = fs.readdirSync(dir);
    } catch {
      continue;
    }
    for (const name of names) {
      if (name.startsWith(".")) continue; // .gitkeep, dotfiles
      const full = path.join(dir, name);
      try {
        if (!fs.statSync(full).isFile()) continue;
      } catch {
        continue;
      }
      out.push({ name, rel, full });
    }
  }
  return out;
}

function referencedBasenames() {
  // Union of every raw basename mentioned anywhere in any compiled page.
  const texts = [];
  for (const dir of REF_DIRS) {
    let names;
    try {
      names = fs.readdirSync(dir);
    } catch {
      continue; // namespace may not exist — skip
    }
    for (const f of names) {
      if (!f.endsWith(".md")) continue;
      try {
        texts.push(fs.readFileSync(path.join(dir, f), "utf8"));
      } catch {
        /* unreadable page — skip */
      }
    }
  }
  const blob = texts.join("\n");
  return blob; // membership tested by substring (robust + cheap); "" → everything is backlog
}

function ageDays(name, full) {
  const m = name.match(/^(\d{4})-(\d{2})-(\d{2})/);
  let then;
  if (m) {
    then = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00Z`);
  } else {
    try {
      then = fs.statSync(full).mtime;
    } catch {
      then = NOW;
    }
  }
  return Math.max(0, Math.round((NOW - then) / 86400000));
}

function detectBacklog() {
  const raws = listRaw();
  const blob = referencedBasenames();
  const isReferenced = (name) => typeof blob === "string" && blob.includes(name);
  const backlog = raws
    .filter((r) => !isReferenced(r.name))
    .map((r) => ({ file: r.name, dir: r.rel, age_days: ageDays(r.name, r.full) }))
    .sort((a, b) => b.age_days - a.age_days);
  return backlog;
}

// ── throttle state ───────────────────────────────────────────────────
function readState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return null;
  }
}
function writeState(obj) {
  try {
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
    const tmp = STATE_FILE + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(obj, null, 2));
    fs.renameSync(tmp, STATE_FILE);
  } catch {
    /* fail-open: throttle just won't persist */
  }
}

// ── renderers ────────────────────────────────────────────────────────
function renderSurface(backlog) {
  const oldest = backlog[0].age_days;
  const lines = [];
  lines.push(
    `PENDING INGEST (<your-vault-path>/raw/): ${backlog.length} source` +
      `${backlog.length === 1 ? "" : "s"} clipped but not compiled (oldest ${oldest}d)`
  );
  for (const b of backlog.slice(0, SURFACE_CAP)) {
    lines.push(`  · ${b.file}  (${b.age_days}d)`);
  }
  const more = backlog.length - SURFACE_CAP;
  if (more > 0) lines.push(`  · (+${more} more)`);
  lines.push("  Compile with /wiki-ingest <file> (human-in-the-loop) — surfaced at most once/day.");
  return lines.join("\n");
}

function renderReport(backlog) {
  if (!backlog.length) return `Wiki ingest backlog: none — all raw/ drops are compiled (as of ${TODAY}).`;
  const lines = [`Wiki ingest backlog: ${backlog.length} raw source(s) not yet compiled into wiki/source/ (as of ${TODAY}):`];
  for (const b of backlog) lines.push(`  - ${b.dir}/${b.file}  (${b.age_days}d old)`);
  lines.push(`Compile each with /wiki-ingest <file> — compile is human-in-the-loop, so this is a reminder, not an auto-action.`);
  return lines.join("\n");
}

// ── main ─────────────────────────────────────────────────────────────
function main() {
  const argv = process.argv.slice(2);
  const mode = argv.includes("--surface")
    ? "surface"
    : argv.includes("--json")
    ? "json"
    : "report";

  let backlog;
  try {
    backlog = detectBacklog();
  } catch {
    process.exit(0); // fail-open
  }

  if (mode === "json") {
    console.log(JSON.stringify({ generated_at: NOW.toISOString(), count: backlog.length, backlog }, null, 2));
    return;
  }

  if (mode === "report") {
    console.log(renderReport(backlog));
    return;
  }

  // surface: throttled, silent when empty
  if (!backlog.length) return; // nothing to say
  const state = readState();
  if (state && state.last_surfaced) {
    const hrs = (NOW - new Date(state.last_surfaced)) / 3600000;
    if (hrs < THROTTLE_HOURS) return; // within throttle window — stay silent
  }
  console.log(renderSurface(backlog));
  writeState({ last_surfaced: NOW.toISOString(), count: backlog.length });
}

main();

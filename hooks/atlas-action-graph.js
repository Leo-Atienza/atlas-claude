#!/usr/bin/env node
/**
 * atlas-action-graph.js — In-session retrieval tracking & duplicate detection
 * ===========================================================================
 *
 * Records every file/resource retrieved in a Claude Code session. Computes
 * priority scores, detects duplicate reads, and (Tier 2) produces a "hot set"
 * digest for PreCompact survival.
 *
 * Mirrors atlas-kg.js in structure: JSON-backed, atomic writes, zero deps,
 * fail-open at every boundary.
 *
 * Storage:
 *   ~/.claude/atlas-action-graph/${session_id}.jsonl       (append-only log)
 *   ~/.claude/atlas-action-graph/${session_id}.state.json  (rolling priority state)
 *
 * Called by:
 *   - post-tool-monitor.js   → logRetrieval() on every matched tool call
 *   - context-guard.js       → isDuplicateRead() advisory before Read tool fires
 *   - precompact-reflect.sh  → compactDigest() for hot-set survival (Tier 2)
 *
 * Design goals:
 *   - Fail-open: every function try/catches and returns a safe default
 *   - Atomic writes: .tmp → rename (matches atlas-kg.js pattern)
 *   - Zero LLM: pure heuristics + byte/4 token approximation
 *   - Scratchpad-skip: /tmp/**, C:/tmp/**, os.tmpdir()/** never tracked
 *   - Profile-gated: honors ATLAS_HOOK_PROFILE via isHookEnabled
 *   - Idempotent: calling logRetrieval for the same target just bumps count
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const os = require("os");

// ── Lazy lib load (survives missing lib.js) ──────────────────────────
let _lib = null;
function lib() {
  if (_lib === null) {
    try { _lib = require("./lib"); }
    catch (_) { _lib = {}; }
  }
  return _lib;
}

const AG_DIR = path.join(
  process.env.HOME || process.env.USERPROFILE || os.homedir(),
  ".claude",
  "atlas-action-graph"
);

const MAX_LOG_BYTES = 10_000_000; // 10MB per-session jsonl rotation threshold
const MAX_KEY_LENGTH = 512;        // Truncate overly long keys (e.g., huge Bash cmds)
const HOT_SET_HARD_CAP = 20;       // Max items in a hot-set digest

// ── Profile gate ────────────────────────────────────────────────────
let _profileGate = null;
function isEnabled() {
  if (_profileGate === null) {
    try {
      const { isHookEnabled } = lib();
      _profileGate = typeof isHookEnabled === "function"
        ? isHookEnabled("atlas-action-graph")
        : true;
    } catch (_) {
      _profileGate = true; // Fail-open
    }
  }
  return _profileGate;
}

// ── Storage primitives ──────────────────────────────────────────────
function ensureDir() {
  if (!fs.existsSync(AG_DIR)) {
    try { fs.mkdirSync(AG_DIR, { recursive: true }); } catch (_) {}
  }
}

function sanitizeId(s) {
  return String(s || "unknown").replace(/[^a-zA-Z0-9_.-]/g, "_").slice(0, 64);
}

function stateFile(sessionId) {
  return path.join(AG_DIR, `${sanitizeId(sessionId)}.state.json`);
}

function logFilePath(sessionId) {
  return path.join(AG_DIR, `${sanitizeId(sessionId)}.jsonl`);
}

function emptyState(sessionId) {
  return {
    session: sessionId,
    cwd: null, // stamped on first logRetrieval so carryover can filter by project
    items: {},
    total_retrieved_tokens: 0,
    call_counter: 0,
    last_updated: null,
  };
}

function loadState(sessionId) {
  const fp = stateFile(sessionId);
  if (!fs.existsSync(fp)) return emptyState(sessionId);
  try {
    const raw = fs.readFileSync(fp, "utf8");
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) throw new Error("not-object");
    // Schema evolution safety
    parsed.session = parsed.session || sessionId;
    parsed.items = parsed.items || {};
    parsed.total_retrieved_tokens = parsed.total_retrieved_tokens || 0;
    parsed.call_counter = parsed.call_counter || 0;
    return parsed;
  } catch (err) {
    const backupPath = fp + ".corrupt." + Date.now();
    try { fs.copyFileSync(fp, backupPath); } catch (_) {}
    process.stderr.write(
      `[atlas-action-graph] Corrupt state: ${fp} — backed up to ${backupPath}\n`
    );
    return emptyState(sessionId);
  }
}

function saveState(sessionId, state) {
  ensureDir();
  const fp = stateFile(sessionId);
  const tmpPath = fp + ".tmp";
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2));
    fs.renameSync(tmpPath, fp);
  } catch (err) {
    process.stderr.write(
      `[atlas-action-graph] saveState failed: ${err.code || err.message}\n`
    );
  }
}

function appendJsonl(sessionId, entry) {
  ensureDir();
  const fp = logFilePath(sessionId);
  try {
    fs.appendFileSync(fp, JSON.stringify(entry) + "\n");
  } catch (err) {
    process.stderr.write(
      `[atlas-action-graph] appendJsonl failed: ${err.code || err.message}\n`
    );
    return;
  }
  // Rotate if log grows large
  try {
    const libMod = lib();
    if (typeof libMod.rotateIfLarge === "function") {
      libMod.rotateIfLarge(fp, MAX_LOG_BYTES);
    } else if (fs.existsSync(fp) && fs.statSync(fp).size > MAX_LOG_BYTES) {
      fs.renameSync(fp, fp + ".bak");
    }
  } catch (_) {}
}

// ── Path normalization ──────────────────────────────────────────────
// Canonical form (case-insensitive on Windows) used as the storage key.
// Original form (case-preserved) used for human-readable display.

function normalizePath(p) {
  if (!p) return "";
  return String(p).replace(/\\/g, "/");
}

function canonicalPath(p) {
  const n = normalizePath(p);
  return process.platform === "win32" ? n.toLowerCase() : n;
}

const SKIP_PATH_RE = /^(\/tmp\/|C:\/tmp\/|c:\/tmp\/|\/c\/tmp\/|\/var\/folders\/)/i;
const OS_TMP_CANON = canonicalPath(os.tmpdir());

function shouldSkipPath(canon) {
  if (!canon) return true;
  if (SKIP_PATH_RE.test(canon)) return true;
  if (OS_TMP_CANON && canon.startsWith(OS_TMP_CANON)) return true;
  // Skip action-graph's own state files (prevent self-reference loops)
  if (canon.includes("/.claude/atlas-action-graph/")) return true;
  return false;
}

// ── Target extraction ───────────────────────────────────────────────
// Returns { key, target } for a tool call, or null if not trackable.
// `key` is the canonicalized storage identifier (used for state lookups).
// `target` is the human-readable version (used for display in digests).

function getKey(tool, toolInput) {
  if (!toolInput || typeof toolInput !== "object") return null;

  switch (tool) {
    case "Read": {
      const display = normalizePath(toolInput.file_path || "");
      const canon = canonicalPath(toolInput.file_path || "");
      if (!canon || shouldSkipPath(canon)) return null;
      return { key: `read:${canon}`, target: display };
    }
    case "Glob": {
      const pattern = String(toolInput.pattern || "").slice(0, 200);
      if (!pattern) return null;
      const pathPart = toolInput.path ? `@${normalizePath(toolInput.path)}` : "";
      const display = `${pattern}${pathPart}`;
      const canonPart = toolInput.path ? `@${canonicalPath(toolInput.path)}` : "";
      return {
        key: truncKey(`glob:${pattern}${canonPart}`),
        target: display,
      };
    }
    case "Grep": {
      const pattern = String(toolInput.pattern || "").slice(0, 200);
      if (!pattern) return null;
      const pathPart = toolInput.path ? `@${normalizePath(toolInput.path)}` : "";
      const typePart = toolInput.type ? `#${toolInput.type}` : "";
      const globPart = toolInput.glob ? `*${toolInput.glob}` : "";
      const display = `${pattern}${pathPart}${typePart}${globPart}`;
      const canonPart = toolInput.path ? `@${canonicalPath(toolInput.path)}` : "";
      return {
        key: truncKey(`grep:${pattern}${canonPart}${typePart}${globPart}`),
        target: display,
      };
    }
    // Write/Edit/Bash/Agent are NOT retrievals — they're actions.
    // Tier 2 will scan their inputs for references to retrieved targets
    // and call markUsed(). For Tier 1 they return null (not logged as retrievals).
    default:
      return null;
  }
}

function truncKey(k) {
  return k.length > MAX_KEY_LENGTH ? k.slice(0, MAX_KEY_LENGTH) : k;
}

function keyTarget(key) {
  const colon = key.indexOf(":");
  return colon < 0 ? key : key.slice(colon + 1);
}

// ── Size & token approximation ──────────────────────────────────────
// 4 bytes ~ 1 token (English/code), conservative.

function approximateSize(toolResponse) {
  if (toolResponse === null || toolResponse === undefined) {
    return { bytes: 0, tokens: 0 };
  }
  let bytes = 0;
  try {
    if (typeof toolResponse === "string") {
      bytes = Buffer.byteLength(toolResponse, "utf8");
    } else if (typeof toolResponse === "object") {
      // Prefer known content fields over stringifying the full object
      const candidates = [
        toolResponse.content,
        toolResponse.stdout,
        toolResponse.output,
        toolResponse.file && toolResponse.file.content,
      ];
      let found = null;
      for (const c of candidates) {
        if (typeof c === "string") { found = c; break; }
      }
      if (found !== null) {
        bytes = Buffer.byteLength(found, "utf8");
      } else {
        try {
          const json = JSON.stringify(toolResponse);
          bytes = Math.min(Buffer.byteLength(json || "", "utf8"), 100_000);
        } catch (_) {
          bytes = 0;
        }
      }
    }
  } catch (_) {
    bytes = 0;
  }
  return { bytes, tokens: Math.round(bytes / 4) };
}

function shortHash(key) {
  return crypto.createHash("md5").update(String(key)).digest("hex").slice(0, 10);
}

// ── Write Operations ────────────────────────────────────────────────

/**
 * Record a retrieval event. Appends to jsonl AND updates state atomically.
 * Idempotent + fail-open. Returns the storage key, or null if skipped.
 */
function logRetrieval(sessionId, tool, toolInput, toolResponse) {
  if (!isEnabled()) return null;
  if (!sessionId || !tool) return null;

  const extracted = getKey(tool, toolInput);
  if (!extracted) return null;
  const { key, target } = extracted;

  try {
    const state = loadState(sessionId);
    // Stamp CWD once so carryover can filter by project. process.cwd() is
    // authoritative at retrieval time — before any agent cd'ing could shift it.
    if (!state.cwd) {
      try { state.cwd = process.cwd(); } catch (_) { state.cwd = null; }
    }
    state.call_counter = (state.call_counter || 0) + 1;
    const callN = state.call_counter;

    const { bytes, tokens } = approximateSize(toolResponse);
    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();
    const hash = shortHash(key);

    const existing = state.items[key];
    if (existing) {
      existing.retrieved_count = (existing.retrieved_count || 1) + 1;
      existing.last_ts = nowMs;
      existing.last_call_n = callN;
      // Keep the max observed size — first read is usually full, later may be partial
      if (tokens > (existing.approx_tokens || 0)) existing.approx_tokens = tokens;
      if (bytes > (existing.approx_bytes || 0)) existing.approx_bytes = bytes;
    } else {
      state.items[key] = {
        key,
        tool,
        target,
        hash,
        approx_bytes: bytes,
        approx_tokens: tokens,
        retrieved_count: 1,
        used_count: 0,
        first_ts: nowMs,
        last_ts: nowMs,
        first_call_n: callN,
        last_call_n: callN,
        priority: 0.5, // neutral starter; computed live by priorityScore()
        pinned: false,
      };
    }
    state.total_retrieved_tokens = (state.total_retrieved_tokens || 0) + tokens;
    state.last_updated = nowMs;
    saveState(sessionId, state);

    appendJsonl(sessionId, {
      ts: nowMs,
      ts_iso: nowIso,
      call_n: callN,
      tool,
      key,
      target,
      hash,
      bytes,
      approx_tokens: tokens,
      session: sanitizeId(sessionId),
    });

    return key;
  } catch (err) {
    process.stderr.write(
      `[atlas-action-graph] logRetrieval failed: ${err.message}\n`
    );
    return null;
  }
}

/**
 * Non-blocking advisory: check whether a Read target was already retrieved
 * in this session. Skips the warning if file mtime is newer than the stored
 * retrieval (file may legitimately have changed on disk).
 *
 * Returns:
 *   { duplicate: false }                               — allow normally
 *   { duplicate: false, reason: "file_modified" }      — mtime check rejected
 *   { duplicate: true, lastCallN, approxTokensSaved,
 *     retrievedCount }                                 — advisory should fire
 */
function isDuplicateRead(sessionId, filePath) {
  if (!isEnabled()) return { duplicate: false };
  if (!sessionId || !filePath) return { duplicate: false };

  const canon = canonicalPath(filePath);
  if (!canon || shouldSkipPath(canon)) return { duplicate: false };

  try {
    const state = loadState(sessionId);
    const key = `read:${canon}`;
    const item = state.items[key];
    if (!item) return { duplicate: false };

    // mtime check — if the file changed since we read it, don't flag
    try {
      const stat = fs.statSync(filePath);
      const fileMtimeMs = stat.mtimeMs || 0;
      if (fileMtimeMs > (item.last_ts || 0)) {
        return { duplicate: false, reason: "file_modified" };
      }
    } catch (_) {
      // File doesn't exist or can't stat — let the Read attempt fail naturally
      return { duplicate: false };
    }

    return {
      duplicate: true,
      lastCallN: item.last_call_n || 0,
      approxTokensSaved: item.approx_tokens || 0,
      retrievedCount: item.retrieved_count || 1,
    };
  } catch (err) {
    process.stderr.write(
      `[atlas-action-graph] isDuplicateRead failed: ${err.message}\n`
    );
    return { duplicate: false };
  }
}

/**
 * Bump the used_count for an item. Called by Tier 2's reference scanner
 * when a retrieved target appears in a later tool_input.
 */
function markUsed(sessionId, keyOrTarget, increment = 1) {
  if (!isEnabled()) return false;
  if (!sessionId || !keyOrTarget) return false;
  try {
    const state = loadState(sessionId);
    const matched = [];

    // 1. Direct key match (fast path for CLI / explicit callers)
    if (state.items[keyOrTarget]) {
      matched.push(state.items[keyOrTarget]);
    } else {
      const needle = canonicalPath(keyOrTarget);

      // 2. Canonical equality match — handles case differences,
      //    slash normalization, and full-path callers.
      let exactFound = false;
      for (const [k, v] of Object.entries(state.items)) {
        const hay = canonicalPath(v.target || keyTarget(k));
        if (hay === needle) { matched.push(v); exactFound = true; break; }
      }

      // 3. Substring containment match (reference scanner).
      //    The scanner passes whole tool_input strings (e.g. an Edit's
      //    old_string that mentions a previously-retrieved path). Accept
      //    only path-like hays (≥ 8 chars, contains `/`) to avoid trivial
      //    false positives on short generic tokens.
      if (!exactFound) {
        for (const [k, v] of Object.entries(state.items)) {
          const hay = canonicalPath(v.target || keyTarget(k));
          if (hay.length >= 8 && hay.includes("/") && needle.includes(hay)) {
            matched.push(v);
          }
        }
      }
    }

    if (matched.length === 0) return false;

    // Cap used_count at retrieved_count × 3 so a noisy reference scan
    // (e.g. 40 matches of the same path inside one Bash command) can't
    // run away with the priority score. Invariant lives on the writer.
    for (const item of matched) {
      const retrieved = item.retrieved_count || 1;
      item.used_count = Math.min((item.used_count || 0) + increment, retrieved * 3);
    }
    state.last_updated = Date.now();
    saveState(sessionId, state);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Pin an item so it's never evicted from the hot set. Manual override.
 */
function pin(sessionId, keyOrTarget, pinned = true) {
  if (!sessionId || !keyOrTarget) return false;
  try {
    const state = loadState(sessionId);
    let item = state.items[keyOrTarget];
    if (!item) {
      const needle = canonicalPath(keyOrTarget);
      for (const [k, v] of Object.entries(state.items)) {
        const hay = canonicalPath(v.target || keyTarget(k));
        if (hay === needle) { item = v; break; }
      }
    }
    if (!item) return false;
    item.pinned = Boolean(pinned);
    state.last_updated = Date.now();
    saveState(sessionId, state);
    return true;
  } catch (_) {
    return false;
  }
}

// ── Priority scoring ────────────────────────────────────────────────
// priority = 0.4·freq + 0.4·usage + 0.2·recency   (bounded [0,1])
//   freq    — log-scaled retrieval count, saturates around 5 retrievals
//   usage   — used_count / retrieved_count
//   recency — exponential decay, ~10 min half-life
// Pinned items always score 1.0.

function priorityScore(item, now = Date.now()) {
  if (!item) return 0;
  if (item.pinned) return 1.0;

  const retrieved = Math.max(item.retrieved_count || 1, 1);
  const used = item.used_count || 0;

  const freqComponent = Math.min(Math.log(retrieved + 1) / Math.log(6), 1);
  const usageComponent = Math.min(used / retrieved, 1);

  const ageMs = Math.max(now - (item.last_ts || now), 0);
  const ageMinutes = ageMs / 60000;
  const recencyComponent = Math.exp(-ageMinutes / 15); // half-life ~10 min

  const raw = 0.4 * freqComponent + 0.4 * usageComponent + 0.2 * recencyComponent;
  return Math.max(0, Math.min(1, raw));
}

/**
 * Top-N items sorted by priority, summing ≤ budget approx_tokens.
 * Pinned items are ALWAYS included even if they blow the budget.
 */
function hotSet(sessionId, budget = 2000) {
  try {
    const state = loadState(sessionId);
    const now = Date.now();
    const scored = Object.values(state.items).map((item) => ({
      ...item,
      priority: priorityScore(item, now),
    }));
    scored.sort((a, b) => b.priority - a.priority);

    const picked = [];
    const dropped = [];
    let spent = 0;
    for (const item of scored) {
      const cost = item.approx_tokens || 0;
      if (item.pinned || spent + cost <= budget) {
        picked.push(item);
        spent += cost;
        if (picked.length >= HOT_SET_HARD_CAP) {
          // Remaining items count as dropped (for digest visibility)
          for (const rest of scored.slice(scored.indexOf(item) + 1)) {
            dropped.push(rest);
          }
          break;
        }
      } else {
        dropped.push(item);
      }
    }
    return { items: picked, dropped, spent, total_items: scored.length };
  } catch (_) {
    return { items: [], dropped: [], spent: 0, total_items: 0 };
  }
}

/**
 * Format the hot set as a markdown block ready for PreCompact injection.
 * Returns "" if empty (caller should skip injection in that case).
 */
function compactDigest(sessionId, budget = 2000) {
  const { items, dropped, spent, total_items } = hotSet(sessionId, budget);
  if (items.length === 0) return "";

  const lines = [];
  lines.push("ACTION_GRAPH_DIGEST:");
  lines.push(
    `  Working set (${items.length}/${total_items} items, ~${spent} tokens):`
  );
  for (const item of items) {
    const star = item.pinned ? "★" : "·";
    const uses = item.used_count ? ` used ${item.used_count}x` : "";
    lines.push(
      `  ${star} ${item.target} — read ${item.retrieved_count}x, priority ${item.priority.toFixed(2)}${uses}`
    );
  }
  if (dropped.length > 0) {
    lines.push(`  (dropped ${dropped.length} lower-priority item(s) from digest)`);
  }
  lines.push(
    "  Re-read any of the above only if you believe the file has changed since."
  );
  return lines.join("\n");
}

/**
 * Cross-session carryover digest. Top-N items by priority, formatted for
 * SessionStart injection. Distinct header from compactDigest so downstream
 * consumers can tell them apart. Uses a huge token budget so the slice is
 * taken by n, not tokens — the whole context window is available at start.
 */
function carryoverDigest(sessionId, n = 5) {
  const { items, total_items } = hotSet(sessionId, 1_000_000);
  if (items.length === 0) return "";
  const slice = items.slice(0, n);
  const lines = [];
  lines.push(
    `ACTION-GRAPH CARRYOVER: previous session top ${slice.length}/${total_items}`
  );
  for (const item of slice) {
    const star = item.pinned ? "★" : "·";
    const uses = item.used_count ? ` used ${item.used_count}x` : "";
    lines.push(
      `  ${star} ${item.target} — read ${item.retrieved_count}x, priority ${item.priority.toFixed(2)}${uses}`
    );
  }
  lines.push(
    "  Consider re-reading above only if you expect the files to have changed."
  );
  return lines.join("\n");
}

// ── Stats & maintenance ─────────────────────────────────────────────

function stats(sessionId) {
  const state = loadState(sessionId);
  const items = Object.values(state.items);
  const now = Date.now();
  const scored = items.map((i) => ({ ...i, priority: priorityScore(i, now) }));
  const duplicateCount = scored.filter((i) => (i.retrieved_count || 1) > 1).length;
  const totalRetrievals = scored.reduce((s, i) => s + (i.retrieved_count || 1), 0);
  const pinnedCount = scored.filter((i) => i.pinned).length;
  return {
    session: sessionId,
    unique_items: items.length,
    total_retrievals: totalRetrievals,
    duplicate_items: duplicateCount,
    pinned_items: pinnedCount,
    approx_total_tokens: state.total_retrieved_tokens || 0,
    call_counter: state.call_counter || 0,
    last_updated: state.last_updated,
  };
}

/**
 * One-shot summary of a completed session. Appends a single JSON line to
 * logs/action-graph-stats.jsonl (shared across sessions). Called from
 * session-stop.sh. Fail-open — never throws.
 */
function statsRollup(sessionId) {
  try {
    const s = stats(sessionId);
    const { items, spent } = hotSet(sessionId, 2000);
    const state = loadState(sessionId);
    const now = Date.now();
    const allItems = Object.values(state.items);
    const meanPriority = allItems.length
      ? allItems.reduce((a, i) => a + priorityScore(i, now), 0) / allItems.length
      : 0;

    const line = {
      ts: now,
      ts_iso: new Date(now).toISOString(),
      session: sanitizeId(sessionId),
      unique_targets: s.unique_items,
      total_retrievals: s.total_retrievals,
      duplicate_items: s.duplicate_items,
      pinned_items: s.pinned_items,
      approx_total_tokens: s.approx_total_tokens,
      call_counter: s.call_counter,
      hot_set_size: items.length,
      hot_set_tokens: spent,
      mean_priority: Number(meanPriority.toFixed(3)),
    };

    // Write to shared logs dir via lazy lib loader (same pattern as the module)
    const libMod = lib();
    const logsDir =
      (libMod.paths && libMod.paths.logs) ||
      path.join(
        process.env.HOME || process.env.USERPROFILE || os.homedir(),
        ".claude",
        "logs"
      );
    try { fs.mkdirSync(logsDir, { recursive: true }); } catch (_) {}
    fs.appendFileSync(
      path.join(logsDir, "action-graph-stats.jsonl"),
      JSON.stringify(line) + "\n"
    );
    return line;
  } catch (err) {
    process.stderr.write(
      `[atlas-action-graph] statsRollup failed: ${err.message}\n`
    );
    return null;
  }
}

/**
 * Remove state/jsonl files older than maxAgeDays (default 7).
 * Called from session-start.sh cleanup sweep.
 */
function pruneOldSessions(maxAgeDays = 7) {
  ensureDir();
  let removed = 0;
  try {
    const cutoffMs = Date.now() - maxAgeDays * 86400000;
    const files = fs.readdirSync(AG_DIR);
    for (const name of files) {
      if (!/\.(state\.json|jsonl|bak)$/.test(name)) continue;
      const fp = path.join(AG_DIR, name);
      try {
        const stat = fs.statSync(fp);
        if (stat.mtimeMs < cutoffMs) {
          fs.unlinkSync(fp);
          removed++;
        }
      } catch (_) {}
    }
  } catch (_) {}
  return removed;
}

// ── CLI ─────────────────────────────────────────────────────────────

function cli() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  const flags = {};
  const positional = [];
  for (const arg of args.slice(1)) {
    if (arg.startsWith("--") && arg.includes("=")) {
      const [k, v] = arg.split("=", 2);
      flags[k.replace(/^--/, "")] = v;
    } else if (!arg.startsWith("--")) {
      positional.push(arg);
    }
  }

  switch (cmd) {
    case "log": {
      const [session, tool, inputJson, responseJson] = positional;
      if (!session || !tool) {
        return console.error(
          "Usage: atlas-action-graph log <session_id> <tool> <tool_input_json> [tool_response_json]"
        );
      }
      let toolInput = {};
      let toolResponse = {};
      try { toolInput = JSON.parse(inputJson || "{}"); } catch (_) {}
      try { toolResponse = JSON.parse(responseJson || "{}"); } catch (_) {}
      const key = logRetrieval(session, tool, toolInput, toolResponse);
      console.log(key ? `Logged: ${key}` : "Skipped (not trackable)");
      break;
    }
    case "check": {
      const [session, filePath] = positional;
      if (!session || !filePath) {
        return console.error(
          "Usage: atlas-action-graph check <session_id> <file_path>"
        );
      }
      const result = isDuplicateRead(session, filePath);
      console.log(JSON.stringify(result, null, 2));
      break;
    }
    case "hot": {
      const session = positional[0];
      const budget = parseInt(flags.budget || "2000", 10);
      if (!session) {
        return console.error(
          "Usage: atlas-action-graph hot <session_id> [--budget=N]"
        );
      }
      const result = hotSet(session, budget);
      console.log(JSON.stringify(result, null, 2));
      break;
    }
    case "digest": {
      const session = positional[0];
      const budget = parseInt(flags.budget || "2000", 10);
      if (!session) {
        return console.error(
          "Usage: atlas-action-graph digest <session_id> [--budget=N]"
        );
      }
      const digest = compactDigest(session, budget);
      console.log(digest || "Action graph empty.");
      break;
    }
    case "stats": {
      const session = positional[0];
      if (!session) {
        return console.error("Usage: atlas-action-graph stats <session_id>");
      }
      console.log(JSON.stringify(stats(session), null, 2));
      break;
    }
    case "rollup": {
      const session = positional[0];
      if (!session) {
        return console.error("Usage: atlas-action-graph rollup <session_id>");
      }
      const line = statsRollup(session);
      console.log(line ? JSON.stringify(line, null, 2) : "Rollup failed.");
      break;
    }
    case "carryover": {
      const session = positional[0];
      const n = parseInt(flags.n || "5", 10);
      if (!session) {
        return console.error(
          "Usage: atlas-action-graph carryover <session_id> [--n=5]"
        );
      }
      const out = carryoverDigest(session, n);
      console.log(out || "No carryover (action graph empty).");
      break;
    }
    case "query": {
      const session = positional[0];
      if (!session) {
        return console.error("Usage: atlas-action-graph query <session_id>");
      }
      const state = loadState(session);
      const items = Object.values(state.items);
      if (items.length === 0) return console.log("No items.");
      items.sort((a, b) => (b.retrieved_count || 0) - (a.retrieved_count || 0));
      for (const item of items) {
        const pin = item.pinned ? " ★" : "";
        console.log(
          `  ${item.tool} ${item.target} — ×${item.retrieved_count}` +
          ` (used ${item.used_count || 0}, ~${item.approx_tokens || 0}tok)${pin}`
        );
      }
      break;
    }
    case "mark-used": {
      const [session, key] = positional;
      if (!session || !key) {
        return console.error(
          "Usage: atlas-action-graph mark-used <session_id> <key_or_target>"
        );
      }
      const ok = markUsed(session, key);
      console.log(ok ? `Marked used: ${key}` : `Not found: ${key}`);
      break;
    }
    case "pin": {
      const [session, key] = positional;
      if (!session || !key) {
        return console.error(
          "Usage: atlas-action-graph pin <session_id> <key_or_target>"
        );
      }
      const ok = pin(session, key, true);
      console.log(ok ? `Pinned: ${key}` : `Not found: ${key}`);
      break;
    }
    case "unpin": {
      const [session, key] = positional;
      if (!session || !key) {
        return console.error(
          "Usage: atlas-action-graph unpin <session_id> <key_or_target>"
        );
      }
      const ok = pin(session, key, false);
      console.log(ok ? `Unpinned: ${key}` : `Not found: ${key}`);
      break;
    }
    case "prune": {
      const days = parseInt(flags.days || "7", 10);
      const n = pruneOldSessions(days);
      console.log(`Pruned ${n} old action-graph file(s) (> ${days} days)`);
      break;
    }
    case "latest-for-cwd": {
      // Find the most recent state file whose recorded cwd matches --cwd.
      // Prints the session_id on success, nothing on no match. Used by
      // session-start.sh §7i so carryover can't leak across projects.
      const wantCwd = flags.cwd || process.cwd();
      const maxAgeH = parseInt(flags.hours || "48", 10);
      const wantCanon = canonicalPath(wantCwd);
      const cutoff = Date.now() - maxAgeH * 3600 * 1000;

      ensureDir();
      let best = null;
      try {
        const files = fs.readdirSync(AG_DIR).filter((n) => /\.state\.json$/.test(n));
        for (const name of files) {
          const fp = path.join(AG_DIR, name);
          let stat;
          try { stat = fs.statSync(fp); } catch (_) { continue; }
          if (stat.mtimeMs < cutoff) continue;
          let parsed;
          try { parsed = JSON.parse(fs.readFileSync(fp, "utf8")); } catch (_) { continue; }
          if (!parsed || !parsed.cwd) continue;
          if (canonicalPath(parsed.cwd) !== wantCanon) continue;
          if (!best || stat.mtimeMs > best.mtime) {
            best = {
              sessionId: name.replace(/\.state\.json$/, ""),
              mtime: stat.mtimeMs,
            };
          }
        }
      } catch (_) {}
      if (best) console.log(best.sessionId);
      break;
    }
    default:
      console.log("atlas-action-graph — In-session retrieval tracking");
      console.log("");
      console.log("Commands:");
      console.log("  log <session> <tool> <tool_input_json> [tool_response_json]");
      console.log("  check <session> <file_path>                  — duplicate-read check");
      console.log("  hot <session> [--budget=2000]                — top-N by priority");
      console.log("  digest <session> [--budget=2000]             — markdown digest (PreCompact)");
      console.log("  stats <session>                              — session summary");
      console.log("  rollup <session>                             — append one-line summary to logs/action-graph-stats.jsonl");
      console.log("  carryover <session> [--n=5]                  — top-N formatted for SessionStart");
      console.log("  query <session>                              — dump all items");
      console.log("  mark-used <session> <key_or_target>          — bump usage counter");
      console.log("  pin <session> <key_or_target>                — protect from eviction");
      console.log("  unpin <session> <key_or_target>");
      console.log("  prune [--days=7]                             — clean old session files");
      console.log("  latest-for-cwd --cwd=<path> [--hours=48]     — most-recent session_id whose state.cwd matches");
  }
}

// ── Exports ─────────────────────────────────────────────────────────

module.exports = {
  logRetrieval,
  isDuplicateRead,
  markUsed,
  pin,
  priorityScore,
  hotSet,
  compactDigest,
  carryoverDigest,
  stats,
  statsRollup,
  pruneOldSessions,
  getKey,
  keyTarget,
  canonicalPath,
  shouldSkipPath,
};

// Run CLI if executed directly
if (require.main === module) cli();

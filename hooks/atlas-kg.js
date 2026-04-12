#!/usr/bin/env node
/**
 * atlas-kg.js — Temporal Knowledge Graph for ATLAS
 * =================================================
 * Extracted from mempalace/knowledge_graph.py, evolved for ATLAS.
 *
 * JSON-backed temporal entity-relationship graph. Zero dependencies.
 * Tracks: entities, typed relationships, temporal validity windows.
 * Answers: "What do we know about X?", "What was true in January?",
 *          "When did we decide Y?", "What changed recently?"
 *
 * Storage: ~/.claude/atlas-kg/entities.json + triples.json
 * Integration: session-start (query), session-stop (capture), precompact (extract)
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const KG_DIR = path.join(
  process.env.HOME || process.env.USERPROFILE,
  ".claude",
  "atlas-kg"
);
const ENTITIES_FILE = path.join(KG_DIR, "entities.json");
const TRIPLES_FILE = path.join(KG_DIR, "triples.json");

// ── Storage ──────────────────────────────────────────────────────────

let _tripleCounter = 0;

function ensureDir() {
  if (!fs.existsSync(KG_DIR)) fs.mkdirSync(KG_DIR, { recursive: true });
}

function loadJSON(filepath) {
  if (!fs.existsSync(filepath)) return {};
  try {
    const raw = fs.readFileSync(filepath, "utf8");
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    return parsed;
  } catch (err) {
    // Corruption detected — preserve the corrupt file for recovery, return empty
    const backupPath = filepath + ".corrupt." + Date.now();
    try { fs.copyFileSync(filepath, backupPath); } catch (_) {}
    process.stderr.write(`[atlas-kg] Corrupt JSON detected: ${filepath} — backed up to ${backupPath}\n`);
    return {};
  }
}

function saveJSON(filepath, data) {
  ensureDir();
  // Atomic write: write to temp file, then rename (prevents partial writes on crash)
  const tmpPath = filepath + ".tmp";
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2));
  fs.renameSync(tmpPath, filepath);
}

function entityId(name) {
  // Hash-based ID preserves uniqueness for names like "C++", "C#", "C"
  const normalized = name.toLowerCase().trim();
  const slug = normalized.replace(/['\s]+/g, "_").replace(/[^a-z0-9_+#.-]/g, "");
  // If slug would be ambiguous (too short or stripped to nothing), use hash suffix
  if (slug.length < 2) {
    const hash = crypto.createHash("md5").update(normalized).digest("hex").slice(0, 6);
    return slug + "_" + hash;
  }
  return slug;
}

function tripleId(sub, pred, obj) {
  // Use counter + random bytes instead of Date.now() to avoid same-millisecond collisions
  _tripleCounter++;
  const hash = crypto
    .createHash("md5")
    .update(`${sub}|${pred}|${obj}|${_tripleCounter}|${crypto.randomBytes(4).toString("hex")}`)
    .digest("hex")
    .slice(0, 8);
  return `t_${sub}_${pred}_${obj}_${hash}`;
}

// ── Predicate-Based Type Inference ───────────────────────────────────

const PREDICATE_TYPE_MAP = {
  worked_on:   { subject: "project",   object: "branch" },
  last_commit: { subject: "project",   object: "commit" },
  session_in:  { subject: "user",      object: "directory" },
  version:     { subject: "system",    object: "version" },
  integrated:  { subject: "system",    object: "component" },
  source_of:   { subject: "project",   object: "component" },
  pruned_skills_to: { subject: "system", object: "metric" },
};

function inferType(predicate, role) {
  const map = PREDICATE_TYPE_MAP[predicate];
  return map ? map[role] : null;
}

// ── Write Operations ─────────────────────────────────────────────────

function addEntity(name, type = "unknown", properties = {}) {
  const entities = loadJSON(ENTITIES_FILE);
  const id = entityId(name);
  entities[id] = {
    id,
    name,
    type,
    properties: { ...(entities[id]?.properties || {}), ...properties },
    created_at: entities[id]?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  saveJSON(ENTITIES_FILE, entities);
  return id;
}

function addTriple(subject, predicate, object, opts = {}) {
  const {
    valid_from = null,
    valid_to = null,
    confidence = 1.0,
    source = null,
  } = opts;

  const subId = entityId(subject);
  const objId = entityId(object);
  const pred = predicate.toLowerCase().replace(/\s+/g, "_");

  // Auto-create entities with inferred types
  const entities = loadJSON(ENTITIES_FILE);
  const subType = inferType(pred, "subject") || "unknown";
  const objType = inferType(pred, "object") || "unknown";
  let entitiesChanged = false;

  if (!entities[subId]) {
    entities[subId] = {
      id: subId,
      name: subject,
      type: subType,
      properties: {},
      created_at: new Date().toISOString(),
    };
    entitiesChanged = true;
  } else if (entities[subId].type === "unknown" && subType !== "unknown") {
    entities[subId].type = subType;
    entities[subId].updated_at = new Date().toISOString();
    entitiesChanged = true;
  }
  if (!entities[objId]) {
    entities[objId] = {
      id: objId,
      name: object,
      type: objType,
      properties: {},
      created_at: new Date().toISOString(),
    };
    entitiesChanged = true;
  } else if (entities[objId].type === "unknown" && objType !== "unknown") {
    entities[objId].type = objType;
    entities[objId].updated_at = new Date().toISOString();
    entitiesChanged = true;
  }

  // Check for existing identical active triple
  const triples = loadJSON(TRIPLES_FILE);
  const existing = Object.values(triples).find(
    (t) =>
      t.subject === subId &&
      t.predicate === pred &&
      t.object === objId &&
      !t.valid_to
  );
  if (existing) {
    if (entitiesChanged) saveJSON(ENTITIES_FILE, entities);
    return existing.id;
  }

  // Create new triple
  const id = tripleId(subId, pred, objId);
  triples[id] = {
    id,
    subject: subId,
    subject_name: subject,
    predicate: pred,
    object: objId,
    object_name: object,
    valid_from,
    valid_to,
    confidence,
    source,
    created_at: new Date().toISOString(),
  };

  // Save both atomically — entities first (referenced by triples), then triples
  if (entitiesChanged) saveJSON(ENTITIES_FILE, entities);
  saveJSON(TRIPLES_FILE, triples);
  return id;
}

function invalidate(subject, predicate, object, ended = null) {
  const subId = entityId(subject);
  const objId = entityId(object);
  const pred = predicate.toLowerCase().replace(/\s+/g, "_");
  ended = ended || new Date().toISOString().slice(0, 10);

  const triples = loadJSON(TRIPLES_FILE);
  let invalidated = 0;
  for (const t of Object.values(triples)) {
    if (
      t.subject === subId &&
      t.predicate === pred &&
      t.object === objId &&
      !t.valid_to
    ) {
      t.valid_to = ended;
      invalidated++;
    }
  }
  if (invalidated > 0) saveJSON(TRIPLES_FILE, triples);
  return invalidated;
}

function invalidateByPredicate(subject, predicate, ended = null) {
  const subId = entityId(subject);
  const pred = predicate.toLowerCase().replace(/\s+/g, "_");
  ended = ended || new Date().toISOString().slice(0, 10);

  const triples = loadJSON(TRIPLES_FILE);
  let invalidated = 0;
  for (const t of Object.values(triples)) {
    if (t.subject === subId && t.predicate === pred && !t.valid_to) {
      t.valid_to = ended;
      invalidated++;
    }
  }
  if (invalidated > 0) saveJSON(TRIPLES_FILE, triples);
  return invalidated;
}

function prune(maxAgeDays = 30) {
  const cutoff = new Date(Date.now() - maxAgeDays * 86400000).toISOString();
  const triples = loadJSON(TRIPLES_FILE);
  let pruned = 0;
  for (const t of Object.values(triples)) {
    if (t.valid_to && t.valid_to < cutoff.slice(0, 10)) {
      delete triples[t.id];
      pruned++;
    }
  }
  if (pruned > 0) saveJSON(TRIPLES_FILE, triples);

  // Also clean orphaned entities and git-derivable data
  const cleaned = cleanEntities();
  const deduped = deduplicateTriples();

  return pruned + cleaned + deduped;
}

// Remove entities not referenced by any triple + git-derivable entity types
function cleanEntities() {
  const entities = loadJSON(ENTITIES_FILE);
  const triples = loadJSON(TRIPLES_FILE);

  // Build set of all entity IDs referenced by any triple
  const referenced = new Set();
  for (const t of Object.values(triples)) {
    referenced.add(t.subject);
    referenced.add(t.object);
  }

  // Git-derivable types that should never be stored
  const GIT_TYPES = new Set(["commit", "branch"]);

  let cleaned = 0;
  for (const [id, entity] of Object.entries(entities)) {
    const isOrphan = !referenced.has(id);
    const isGitType = GIT_TYPES.has(entity.type);
    if (isOrphan || isGitType) {
      delete entities[id];
      cleaned++;
    }
  }

  if (cleaned > 0) saveJSON(ENTITIES_FILE, entities);
  return cleaned;
}

// Remove duplicate active triples (same subject+predicate+object, both active)
function deduplicateTriples() {
  const triples = loadJSON(TRIPLES_FILE);
  const seen = {};
  let deduped = 0;

  for (const t of Object.values(triples)) {
    if (t.valid_to) continue; // Only check active triples
    const key = `${t.subject}|${t.predicate}|${t.object}`;
    if (seen[key]) {
      // Keep the older one (first seen), remove the newer duplicate
      delete triples[t.id];
      deduped++;
    } else {
      seen[key] = t.id;
    }
  }

  if (deduped > 0) saveJSON(TRIPLES_FILE, triples);
  return deduped;
}

// ── Query Operations ─────────────────────────────────────────────────

function queryEntity(name, opts = {}) {
  const { as_of = null, direction = "both" } = opts;
  const id = entityId(name);
  const triples = loadJSON(TRIPLES_FILE);
  const results = [];

  for (const t of Object.values(triples)) {
    const isSubject = t.subject === id;
    const isObject = t.object === id;

    if (direction === "outgoing" && !isSubject) continue;
    if (direction === "incoming" && !isObject) continue;
    if (direction === "both" && !isSubject && !isObject) continue;

    // Temporal filter
    if (as_of) {
      if (t.valid_from && t.valid_from > as_of) continue;
      if (t.valid_to && t.valid_to < as_of) continue;
    }

    results.push({
      direction: isSubject ? "outgoing" : "incoming",
      subject: t.subject_name || t.subject,
      predicate: t.predicate,
      object: t.object_name || t.object,
      valid_from: t.valid_from,
      valid_to: t.valid_to,
      confidence: t.confidence,
      source: t.source,
      current: !t.valid_to,
    });
  }

  return results;
}

function queryRelationship(predicate, as_of = null) {
  const pred = predicate.toLowerCase().replace(/\s+/g, "_");
  const triples = loadJSON(TRIPLES_FILE);
  const results = [];

  for (const t of Object.values(triples)) {
    if (t.predicate !== pred) continue;
    if (as_of) {
      if (t.valid_from && t.valid_from > as_of) continue;
      if (t.valid_to && t.valid_to < as_of) continue;
    }
    results.push({
      subject: t.subject_name || t.subject,
      predicate: t.predicate,
      object: t.object_name || t.object,
      valid_from: t.valid_from,
      valid_to: t.valid_to,
      current: !t.valid_to,
    });
  }
  return results;
}

function timeline(entityName = null) {
  const triples = loadJSON(TRIPLES_FILE);
  let items = Object.values(triples);

  if (entityName) {
    const id = entityId(entityName);
    items = items.filter((t) => t.subject === id || t.object === id);
  }

  items.sort((a, b) => {
    const aDate = a.valid_from || "9999";
    const bDate = b.valid_from || "9999";
    return aDate.localeCompare(bDate);
  });

  return items.slice(0, 100).map((t) => ({
    subject: t.subject_name || t.subject,
    predicate: t.predicate,
    object: t.object_name || t.object,
    valid_from: t.valid_from,
    valid_to: t.valid_to,
    current: !t.valid_to,
  }));
}

function recentFacts(days = 7) {
  const cutoff = new Date(Date.now() - days * 86400000)
    .toISOString()
    .slice(0, 10);
  const triples = loadJSON(TRIPLES_FILE);

  return Object.values(triples)
    .filter((t) => t.created_at && t.created_at >= cutoff)
    .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
    .slice(0, 20)
    .map((t) => ({
      subject: t.subject_name || t.subject,
      predicate: t.predicate,
      object: t.object_name || t.object,
      valid_from: t.valid_from,
      current: !t.valid_to,
      created_at: t.created_at,
    }));
}

function stats() {
  const entities = loadJSON(ENTITIES_FILE);
  const triples = loadJSON(TRIPLES_FILE);
  const tripleList = Object.values(triples);
  const current = tripleList.filter((t) => !t.valid_to).length;
  const predicates = [...new Set(tripleList.map((t) => t.predicate))].sort();

  return {
    entities: Object.keys(entities).length,
    triples: tripleList.length,
    current_facts: current,
    expired_facts: tripleList.length - current,
    relationship_types: predicates,
  };
}

// ── Compact Summary (for session-start injection) ────────────────────

function compactSummary(maxLines = 10) {
  const recent = recentFacts(14);
  if (recent.length === 0) return "";

  // Only show active (non-ended) facts — ended triples are noise
  const active = recent.filter((f) => f.current);
  if (active.length === 0) return "";

  const lines = ["KG_RECENT:"];
  for (const f of active.slice(0, maxLines)) {
    lines.push(
      `  ${f.subject} → ${f.predicate} → ${f.object}`
    );
  }
  return lines.join("\n");
}

// ── CLI ──────────────────────────────────────────────────────────────

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
    case "add-entity": {
      const name = positional[0];
      if (!name) return console.error("Usage: atlas-kg add-entity <name> [--type=TYPE]");
      const id = addEntity(name, flags.type || "unknown");
      console.log(`Entity added: ${id}`);
      break;
    }
    case "add": {
      const [subject, predicate, object] = positional;
      if (!subject || !predicate || !object)
        return console.error("Usage: atlas-kg add <subject> <predicate> <object> [--from=DATE]");
      const id = addTriple(subject, predicate, object, {
        valid_from: flags.from || new Date().toISOString().slice(0, 10),
        source: flags.source || null,
      });
      console.log(`Triple added: ${id}`);
      break;
    }
    case "invalidate": {
      const [s, p, o] = positional;
      if (!s || !p || !o)
        return console.error("Usage: atlas-kg invalidate <subject> <predicate> <object>");
      const n = invalidate(s, p, o, flags.ended);
      console.log(`Invalidated ${n} triple(s)`);
      break;
    }
    case "invalidate-pred": {
      const [sp, pp] = positional;
      if (!sp || !pp)
        return console.error("Usage: atlas-kg invalidate-pred <subject> <predicate>");
      const np = invalidateByPredicate(sp, pp, flags.ended);
      console.log(`Invalidated ${np} triple(s) for ${sp} → ${pp}`);
      break;
    }
    case "prune": {
      const days = parseInt(flags.days || "30", 10);
      const np = prune(days);
      console.log(`Pruned/cleaned ${np} item(s) (expired triples, orphaned entities, duplicates, git-derivable data)`);
      break;
    }
    case "clean-entities": {
      const nc = cleanEntities();
      console.log(`Cleaned ${nc} orphaned/git-derivable entity(ies)`);
      break;
    }
    case "deduplicate": {
      const nd = deduplicateTriples();
      console.log(`Removed ${nd} duplicate active triple(s)`);
      break;
    }
    case "query": {
      const entity = positional[0];
      if (!entity) return console.error("Usage: atlas-kg query <entity> [--as_of=DATE]");
      const results = queryEntity(entity, {
        as_of: flags.as_of,
        direction: flags.direction || "both",
      });
      if (results.length === 0) return console.log("No facts found.");
      for (const r of results) {
        const arrow = r.direction === "outgoing" ? "→" : "←";
        const status = r.current ? "" : ` [ended ${r.valid_to}]`;
        console.log(`  ${r.subject} ${arrow} ${r.predicate} ${arrow} ${r.object}${status}`);
      }
      break;
    }
    case "timeline": {
      const entity = positional[0] || null;
      const items = timeline(entity);
      if (items.length === 0) return console.log("No timeline entries.");
      for (const t of items) {
        const from = t.valid_from || "?";
        const status = t.current ? "active" : `ended ${t.valid_to}`;
        console.log(`  [${from}] ${t.subject} → ${t.predicate} → ${t.object} (${status})`);
      }
      break;
    }
    case "recent": {
      const days = parseInt(flags.days || "7", 10);
      const items = recentFacts(days);
      if (items.length === 0) return console.log("No recent facts.");
      for (const f of items) {
        console.log(`  ${f.subject} → ${f.predicate} → ${f.object}`);
      }
      break;
    }
    case "summary": {
      const s = compactSummary();
      console.log(s || "Knowledge graph empty.");
      break;
    }
    case "stats": {
      const s = stats();
      console.log(JSON.stringify(s, null, 2));
      break;
    }
    default:
      console.log("atlas-kg — Temporal Knowledge Graph for ATLAS");
      console.log("");
      console.log("Commands:");
      console.log("  add-entity <name> [--type=TYPE]");
      console.log("  add <subject> <predicate> <object> [--from=DATE]");
      console.log("  invalidate <subject> <predicate> <object> [--ended=DATE]");
      console.log("  invalidate-pred <subject> <predicate> [--ended=DATE]");
      console.log("  prune [--days=30]");
      console.log("  query <entity> [--as_of=DATE] [--direction=both|outgoing|incoming]");
      console.log("  timeline [entity]");
      console.log("  recent [--days=7]");
      console.log("  summary");
      console.log("  stats");
  }
}

// ── Exports (for use by other hooks) ─────────────────────────────────

module.exports = {
  addEntity,
  addTriple,
  invalidate,
  invalidateByPredicate,
  prune,
  cleanEntities,
  deduplicateTriples,
  queryEntity,
  queryRelationship,
  timeline,
  recentFacts,
  stats,
  compactSummary,
};

// Run CLI if executed directly
if (require.main === module) cli();

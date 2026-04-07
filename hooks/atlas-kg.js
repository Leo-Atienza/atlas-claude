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

function ensureDir() {
  if (!fs.existsSync(KG_DIR)) fs.mkdirSync(KG_DIR, { recursive: true });
}

function loadJSON(filepath) {
  try {
    return JSON.parse(fs.readFileSync(filepath, "utf8"));
  } catch {
    return {};
  }
}

function saveJSON(filepath, data) {
  ensureDir();
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}

function entityId(name) {
  return name.toLowerCase().replace(/['\s]+/g, "_").replace(/[^a-z0-9_-]/g, "");
}

function tripleId(sub, pred, obj) {
  const hash = crypto
    .createHash("md5")
    .update(`${sub}|${pred}|${obj}|${Date.now()}`)
    .digest("hex")
    .slice(0, 8);
  return `t_${sub}_${pred}_${obj}_${hash}`;
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

  // Auto-create entities
  const entities = loadJSON(ENTITIES_FILE);
  if (!entities[subId]) {
    entities[subId] = {
      id: subId,
      name: subject,
      type: "unknown",
      properties: {},
      created_at: new Date().toISOString(),
    };
  }
  if (!entities[objId]) {
    entities[objId] = {
      id: objId,
      name: object,
      type: "unknown",
      properties: {},
      created_at: new Date().toISOString(),
    };
  }
  saveJSON(ENTITIES_FILE, entities);

  // Check for existing identical active triple
  const triples = loadJSON(TRIPLES_FILE);
  const existing = Object.values(triples).find(
    (t) =>
      t.subject === subId &&
      t.predicate === pred &&
      t.object === objId &&
      !t.valid_to
  );
  if (existing) return existing.id;

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

  const lines = ["KG_RECENT:"];
  for (const f of recent.slice(0, maxLines)) {
    const status = f.current ? "" : " [ended]";
    lines.push(
      `  ${f.subject} → ${f.predicate} → ${f.object}${status}`
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
  queryEntity,
  queryRelationship,
  timeline,
  recentFacts,
  stats,
  compactSummary,
};

// Run CLI if executed directly
if (require.main === module) cli();

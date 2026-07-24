#!/usr/bin/env node
/**
 * atlas-kg-vault-sync.js — export the atlas-kg operational graph into the vault
 * ============================================================================
 * Companion to graphify's weekly-graph-sync. graphify maps the *knowledge*
 * namespaces (concepts, entities, sources) into wiki/graph/; this maps the
 * *operational* graph (atlas-kg: sessions, components, integrations) into
 * wiki/personal/atlas-kg-view.md so the two graphs live side-by-side in the
 * vault and Obsidian's own graph view connects them via shared [[wikilinks]].
 *
 * It also computes an explicit cross-graph bridge layer, honestly split into:
 *   - exact bridges      — normalized entity name == graphify node label (authoritative)
 *   - candidate anchors  — denoised string-similar matches (advisory, not asserted)
 * The operational and knowledge graphs are largely disjoint domains today; the
 * bridge is correct-by-construction and grows automatically as they converge.
 *
 * Source of truth stays ~/.claude/atlas-kg/{entities,triples}.json — the vault
 * file is a generated, read-only view. Zero dependencies. Fail-open. Idempotent.
 *
 * Usage:
 *   node scripts/atlas-kg-vault-sync.js          # write the vault view
 *   node scripts/atlas-kg-vault-sync.js --dry    # print the report, write nothing
 */

const fs = require("fs");
const path = require("path");

const HOME = process.env.HOME || process.env.USERPROFILE;
const KG_DIR = path.join(HOME, ".claude", "atlas-kg");
const ENTITIES_FILE = path.join(KG_DIR, "entities.json");
const VAULT = process.env.ATLAS_VAULT || path.join(HOME, "Documents", "Wiki", "wiki");
const GRAPHIFY_JSON = path.join(VAULT, "graphify-out", "graph.json");
const OUT_FILE = path.join(VAULT, "personal", "atlas-kg-view.md");

// Reuse the atlas-kg engine (stats + per-predicate queries) — no duplicated graph logic.
const kg = require(path.join(HOME, ".claude", "hooks", "atlas-kg.js"));

const TODAY = new Date().toISOString().slice(0, 10);

// ── helpers ──────────────────────────────────────────────────────────
// v8.5: normalization unified on lib/slug.canonKey (the system-wide MATCHING
// key — keeps +/# so "C++" ≠ "C#", strips accents). Local norm() retired.
const { canonKey: norm } = require(path.join(HOME, ".claude", "hooks", "lib", "slug.js"));

// Dice coefficient over character bigrams — the promotion gate's similarity
// measure (order-insensitive, robust to small word-form differences).
function diceBigram(a, b) {
  const grams = (s) => {
    const g = new Set();
    for (let i = 0; i < s.length - 1; i++) g.add(s.slice(i, i + 2));
    return g;
  };
  const A = grams(a);
  const B = grams(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const g of A) if (B.has(g)) inter++;
  return (2 * inter) / (A.size + B.size);
}
const PROMOTE_DICE = 0.85;

function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function atomicWrite(file, content) {
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, content);
  fs.renameSync(tmp, file);
}

// ── bridge computation ───────────────────────────────────────────────
// Advisory candidates are gated by entity type so raw cwd-basename captures
// (.claude, memory, fonts, <user> …) don't string-match into the knowledge
// graph as noise. Real ATLAS layers that happen to be directories are allowed.
const ADVISORY_TYPES = new Set(["system", "component", "project", "user"]);
const ADVISORY_LAYER_DIRS = new Set(["hooks", "skills"]);
const CAND_CAP = 3; // max advisory anchors surfaced per entity

function computeBridges(entities, graphNodes) {
  // Dedup graphify nodes by exact label (the chunked extractor emits some dupes).
  const byLabel = new Map(); // normalized label -> { label, communities:Set }
  for (const n of graphNodes) {
    const k = norm(n.label);
    if (!k) continue;
    if (!byLabel.has(k)) byLabel.set(k, { label: n.label, communities: new Set() });
    if (n.community != null) byLabel.get(k).communities.add(n.community);
  }
  const labels = [...byLabel.entries()].map(([k, v]) => ({ k, ...v }));

  const exact = [];
  const promoted = []; // v8.5 third tier: high-confidence auto-matched, honestly labeled
  const candidates = [];

  for (const e of Object.values(entities)) {
    const k = norm(e.name);
    if (!k) continue;
    const toks = k.split(" ");
    const eligible = ADVISORY_TYPES.has(e.type) || ADVISORY_LAYER_DIRS.has(k);

    const seen = new Set();
    const cand = [];
    for (const L of labels) {
      if (seen.has(L.k)) continue;
      let conf = null;
      if (L.k === k) conf = "exact";
      else if (toks.length >= 2 && (" " + L.k + " ").includes(" " + k + " ")) conf = "phrase";
      else if (toks.length === 1 && L.k.split(" ")[0] === k) conf = "head-token";
      if (!conf) continue;
      seen.add(L.k);
      const community = [...L.communities].sort((a, b) => a - b)[0];
      if (conf === "exact") {
        exact.push({ entity: e.name, type: e.type, label: L.label, community });
      } else if (eligible && conf === "phrase" && diceBigram(L.k, k) >= PROMOTE_DICE) {
        // Promoted: phrase match + type-eligible + near-identical character
        // shape. Never silently merged into "exact" — rendered in its own
        // section AND asserted into the KG as a bridges_to triple (deduped).
        promoted.push({ entity: e.name, type: e.type, label: L.label, dice: diceBigram(L.k, k), community });
      } else if (eligible) {
        cand.push({ entity: e.name, type: e.type, label: L.label, conf, community });
      }
    }
    // phrase before head-token; cap per entity to keep the advisory list tight.
    cand.sort((a, b) => (a.conf === b.conf ? 0 : a.conf === "phrase" ? -1 : 1));
    candidates.push(...cand.slice(0, CAND_CAP));
  }
  return { exact, promoted, candidates };
}

// ── markdown rendering ───────────────────────────────────────────────
function render(stats, predicates, bridges, graphNodeCount) {
  const { exact, promoted, candidates } = bridges;
  const wl = (name) => `[[${name}]]`;
  const lines = [];

  // Frontmatter (vault schema: title/type/topic/tags/summary/keywords/created/updated/status/related).
  lines.push("---");
  lines.push('title: "atlas-kg — operational graph (live view)"');
  lines.push("type: reference");
  lines.push("topic: atlas-kg-operational-graph");
  lines.push("tags: [atlas-kg, knowledge-graph, operational, sync]");
  lines.push(
    'summary: "Auto-exported view of the atlas-kg temporal knowledge graph ' +
      "(sessions, components, integrations) with bridges into the graphify " +
      'knowledge graph. Refreshed weekly by the atlas-kg-sync scheduled task."'
  );
  lines.push("keywords: [atlas-kg, temporal-knowledge-graph, operational, bridges, graphify, sync]");
  lines.push("created: 2026-06-03");
  lines.push(`updated: ${TODAY}`);
  lines.push("status: active");
  lines.push('related: ["[[system-overview]]", "[[profile]]"]');
  lines.push("generator: scripts/atlas-kg-vault-sync.js");
  lines.push("---");
  lines.push("");
  lines.push("# atlas-kg — operational graph (live view)");
  lines.push("");
  lines.push(
    "> **Generated, read-only.** Source of truth is `~/.claude/atlas-kg/{entities,triples}.json` " +
      "(captured by the `atlas-kg` session hooks). Regenerated by `scripts/atlas-kg-vault-sync.js`, " +
      "run weekly by the `atlas-kg-sync` scheduled task. Do not hand-edit — changes are overwritten."
  );
  lines.push("");
  lines.push(
    "This is the **operational** half of the brain's graph — where you've worked and what the " +
      "system is wired to — rendered beside graphify's **knowledge** graph (`graph/`, `graphify-out/`). " +
      "Entities use `[[wikilinks]]`, so Obsidian's graph view links this page to any knowledge note " +
      "whose title matches."
  );
  lines.push("");

  // Stats
  lines.push("## Snapshot");
  lines.push("");
  lines.push(`- **Entities:** ${stats.entities}`);
  lines.push(
    `- **Triples:** ${stats.triples} (${stats.current_facts} active, ${stats.expired_facts} expired)`
  );
  lines.push(`- **Relationship types:** ${stats.relationship_types.join(", ") || "—"}`);
  lines.push(`- **As of:** ${TODAY}`);
  lines.push("");

  // Relations grouped by predicate
  for (const pred of predicates) {
    const facts = kg.queryRelationship(pred).filter((f) => f.current);
    if (!facts.length) continue;
    const heading =
      pred === "session_in"
        ? "Sessions & projects (`session_in`)"
        : pred === "integrated"
        ? "System integrations (`integrated`)"
        : pred === "source_of"
        ? "Provenance (`source_of`)"
        : pred === "retrieved_in"
        ? "Working files by project (`retrieved_in`)"
        : pred === "bridges_to"
        ? "Promoted knowledge-graph bridges (`bridges_to`)"
        : `\`${pred}\``;
    lines.push(`## ${heading}`);
    lines.push("");
    if (pred === "session_in") {
      // Chronological "where you've worked" timeline.
      facts.sort((a, b) => String(a.valid_from).localeCompare(String(b.valid_from)));
      for (const f of facts) {
        lines.push(`- \`${f.valid_from || "?"}\` — ${wl(f.object)}`);
      }
      lines.push("");
      lines.push(
        "> Targets are session working-directory basenames; some are ATLAS infrastructure " +
          "subdirectories (`hooks`, `skills`, `memory` …) rather than standalone projects."
      );
    } else {
      for (const f of facts) {
        lines.push(`- ${wl(f.subject)} → ${wl(f.object)}`);
      }
    }
    lines.push("");
  }

  // Cross-graph bridges
  lines.push("## Bridges into the knowledge graph");
  lines.push("");
  lines.push(
    `Cross-links between this operational graph and graphify's ${graphNodeCount}-node knowledge graph. ` +
      "The two are largely **disjoint domains** (operations vs. AI/ML knowledge) and meet chiefly at " +
      "the ATLAS-system spine, so this layer is honest about what actually overlaps."
  );
  lines.push("");
  lines.push(`### Exact bridges (${exact.length})`);
  lines.push("");
  lines.push("_Normalized entity name equals a knowledge-graph node label. Authoritative._");
  lines.push("");
  if (exact.length) {
    const seen = new Set();
    for (const b of exact) {
      if (seen.has(b.label)) continue;
      seen.add(b.label);
      lines.push(`- **${b.entity}** (${b.type}) ↔ ${wl(b.label)}  · community ${b.community}`);
    }
  } else {
    lines.push(
      "- _None today._ No entity name matches a knowledge-node label exactly. This populates " +
        "automatically as the graphs converge (e.g. when graphify ingests a concept you also " +
        "track operationally)."
    );
  }
  lines.push("");
  lines.push(`### Promoted bridges (${promoted.length})`);
  lines.push("");
  lines.push(
    "_High-confidence, auto-matched (phrase match + type-gated + Dice bigram ≥ " +
      PROMOTE_DICE +
      "). Asserted into the KG as `bridges_to` triples, but NOT counted as exact — " +
      "the names still differ._"
  );
  lines.push("");
  if (promoted.length) {
    for (const b of promoted) {
      lines.push(
        `- **${b.entity}** (${b.type}) ⇒ ${wl(b.label)}  · dice ${b.dice.toFixed(2)}, community ${b.community}`
      );
    }
  } else {
    lines.push("- _None._");
  }
  lines.push("");
  lines.push(`### Candidate anchors (${candidates.length})`);
  lines.push("");
  lines.push(
    "_String-similar matches (denoised, type-gated). **Advisory** — these are leads, not asserted " +
      "identity. Promote one to an exact bridge by aligning the names._"
  );
  lines.push("");
  if (candidates.length) {
    for (const b of candidates) {
      lines.push(
        `- **${b.entity}** (${b.type}) ~ ${wl(b.label)}  · _${b.conf}_, community ${b.community}`
      );
    }
  } else {
    lines.push("- _None._");
  }
  lines.push("");

  // Footer
  lines.push("---");
  lines.push("");
  lines.push(
    `<sub>Generated ${TODAY} by \`scripts/atlas-kg-vault-sync.js\`. Refresh manually with ` +
      "`node scripts/atlas-kg-vault-sync.js`, or let the weekly `atlas-kg-sync` task do it. " +
      "Query the live graph: `node hooks/atlas-kg.js query <entity>`.</sub>"
  );
  lines.push("");
  return lines.join("\n");
}

// ── main ─────────────────────────────────────────────────────────────
function main() {
  const dry = process.argv.includes("--dry") || process.argv.includes("--dry-run");

  const entities = readJSON(ENTITIES_FILE);
  if (!entities) {
    console.error(`[atlas-kg-sync] no atlas-kg data at ${ENTITIES_FILE} — nothing to sync.`);
    process.exit(0); // fail-open
  }

  const stats = kg.stats();
  const predicates = stats.relationship_types;

  const graph = readJSON(GRAPHIFY_JSON);
  const graphNodes = graph && Array.isArray(graph.nodes) ? graph.nodes : [];
  if (!graphNodes.length) {
    console.error(
      `[atlas-kg-sync] graphify graph not found at ${GRAPHIFY_JSON} — rendering view without bridges.`
    );
  }
  const bridges = computeBridges(entities, graphNodes);

  const md = render(stats, predicates, bridges, graphNodes.length);

  // Concise report (relayed by the scheduled task).
  console.log("atlas-kg → vault sync");
  console.log(`  entities: ${stats.entities} | triples: ${stats.triples} ` +
    `(${stats.current_facts} active, ${stats.expired_facts} expired)`);
  console.log(`  predicates: ${predicates.join(", ") || "—"}`);
  console.log(
    `  exact bridges: ${bridges.exact.length} | promoted: ${bridges.promoted.length} | candidate anchors: ${bridges.candidates.length}`
  );

  if (dry) {
    console.log(`  [dry-run] would write: ${OUT_FILE} (${md.length} bytes)`);
    return;
  }

  // v8.5: assert promoted bridges into the KG (deduped — re-running is a no-op),
  // so `atlas-kg query <entity>` and /recall surface the knowledge-graph link.
  let bridgesAdded = 0;
  let bridgesSkipped = 0;
  for (const b of bridges.promoted) {
    try {
      const r = kg.addTripleUnique(b.entity, "bridges_to", b.label, {
        valid_from: TODAY,
        source: "atlas-kg-vault-sync (promoted bridge)",
      });
      r.existed ? bridgesSkipped++ : bridgesAdded++;
    } catch {
      /* fail-open: a bridge write must not break the sync */
    }
  }
  if (bridges.promoted.length)
    console.log(`  bridges_to triples: ${bridgesAdded} added, ${bridgesSkipped} already present`);

  try {
    fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
    atomicWrite(OUT_FILE, md);
    console.log(`  artifact: ${OUT_FILE} (written, ${md.length} bytes)`);
  } catch (err) {
    console.error(`[atlas-kg-sync] write failed: ${err.message}`);
    process.exit(1);
  }
}

main();

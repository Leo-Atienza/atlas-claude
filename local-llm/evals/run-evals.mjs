#!/usr/bin/env node
// run-evals.mjs — B4 (ATLAS v9 Wave 1). A lean, zero-dependency golden-set eval
// runner for the local delegation engine. Two jobs:
//   Phase A (model gate): run every golden with its template across candidate
//     models → pass-rate table. This is the eval-gated B2 default-model decision.
//   Phase B (template value): run the golden with NO template (plain prompt) for
//     the candidate default → confirm the template beats its no-template baseline
//     (B5 acceptance).
//
// Faithful to the engine: loads the SAME templates/<task>.md (+ .schema.json),
// uses think:false, temperature 0, and the template/case schema as Ollama `format`.
// Speaks /api/chat directly (no MCP/SDK dependency — the harness lives outside the
// server dir). promptfoo is the documented upgrade path if llm-rubric grading or a
// web viewer is ever wanted; a deterministic runner is enough for these decisions.
//
// Usage: node run-evals.mjs [model1 model2 ...]   (default: qwen2.5:7b qwen3.5:4b)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const BASE = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const ROOT = path.join(os.homedir(), ".claude", "local-llm");
const TPL = path.join(ROOT, "templates");
const GOLDEN = path.join(ROOT, "evals", "golden");
const MODELS = process.argv.slice(2).length ? process.argv.slice(2) : ["qwen2.5:7b", "qwen3.5:4b"];
const BASELINE_MODEL = MODELS[MODELS.length - 1]; // the candidate we're considering as default

function loadTemplate(task) {
  try {
    const raw = fs.readFileSync(path.join(TPL, `${task}.md`), "utf8");
    const fm = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    const meta = {}; let system = raw.trim();
    if (fm) { for (const l of fm[1].split("\n")) { const m = l.match(/^([a-z_]+):\s*(.+)$/i); if (m) meta[m[1]] = m[2].trim(); } system = fm[2].trim(); }
    let schema = null; try { schema = JSON.parse(fs.readFileSync(path.join(TPL, `${task}.schema.json`), "utf8")); } catch {}
    return { system, schema, num_ctx: meta.num_ctx ? Number(meta.num_ctx) : undefined };
  } catch { return { system: "", schema: null }; }
}

async function callModel({ model, system, prompt, format, num_ctx }) {
  const messages = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: prompt });
  // num_predict cap: delegation answers are short; without the template's "be terse"
  // instruction a model can otherwise ramble unboundedly (Phase B hang, fixed here).
  const body = { model, messages, stream: false, think: false, options: { temperature: 0, num_predict: 400, ...(num_ctx ? { num_ctx } : {}) } };
  if (format) body.format = format;
  const r = await fetch(`${BASE}/api/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const d = await r.json();
  return d.message?.content ?? "";
}

function tryParse(t) { try { return JSON.parse(t.trim()); } catch {} const m = t.match(/[{[][\s\S]*[}\]]/); if (m) { try { return JSON.parse(m[0]); } catch {} } return null; }

function assertCase(task, expect, reply, structured) {
  if (structured) {
    const p = tryParse(reply);
    if (!p) return false;
    if (expect.category != null) return p.category === expect.category;
    if (expect.json) return Object.entries(expect.json).every(([k, v]) => p[k] === v);
    if (expect.found != null) {
      if (p.found !== expect.found) return false;
      if (expect.answerContains) return String(p.answer || "").toLowerCase().includes(String(expect.answerContains).toLowerCase());
      return true;
    }
    return false;
  }
  const low = reply.toLowerCase();
  const anyIn = (arr) => arr.some((k) => low.includes(String(k).toLowerCase()));
  if (expect.containsAny && !anyIn(expect.containsAny)) return false;
  if (expect.containsAny2 && !anyIn(expect.containsAny2)) return false;
  if (expect.regex && !new RegExp(expect.regex, "i").test(reply)) return false;
  return true;
}

function loadGoldens() {
  const files = fs.readdirSync(GOLDEN).filter((f) => f.endsWith(".json"));
  return files.map((f) => JSON.parse(fs.readFileSync(path.join(GOLDEN, f), "utf8")));
}

async function runSuite(model, { useTemplate }) {
  const goldens = loadGoldens();
  const perTask = {};
  let pass = 0, total = 0;
  for (const g of goldens) {
    const tpl = loadTemplate(g.task);
    const schema = g.format || tpl.schema || null;
    const structured = !!schema;
    let tp = 0;
    for (const c of g.cases) {
      const reply = await callModel({ model, system: useTemplate ? tpl.system : "", prompt: c.prompt, format: schema, num_ctx: tpl.num_ctx });
      const okc = assertCase(g.task, c.expect, reply, structured);
      if (okc) { tp++; pass++; }
      total++;
    }
    perTask[g.task] = `${tp}/${g.cases.length}`;
  }
  return { model, pass, total, rate: (pass / total), perTask };
}

(async () => {
  console.log(`# local-llm eval — golden set (${MODELS.join(" vs ")})\n`);
  const results = [];
  // Phase A — model gate (with template)
  console.log("## Phase A — model comparison (with template)");
  for (const m of MODELS) {
    process.stdout.write(`  ${m} ... `);
    const t0 = Date.now();
    const res = await runSuite(m, { useTemplate: true });
    console.log(`${res.pass}/${res.total} (${(res.rate * 100).toFixed(0)}%)  ${Math.round((Date.now() - t0) / 1000)}s  ${JSON.stringify(res.perTask)}`);
    results.push({ phase: "with_template", ...res });
  }
  // Phase B — template value (no template, baseline model)
  console.log(`\n## Phase B — template value on ${BASELINE_MODEL} (no template = baseline)`);
  const withT = results.find((r) => r.model === BASELINE_MODEL && r.phase === "with_template");
  const noT = await runSuite(BASELINE_MODEL, { useTemplate: false });
  console.log(`  no-template: ${noT.pass}/${noT.total} (${(noT.rate * 100).toFixed(0)}%)  ${JSON.stringify(noT.perTask)}`);
  console.log(`  with-template: ${withT.pass}/${withT.total} (${(withT.rate * 100).toFixed(0)}%)`);
  const templateHelps = withT.rate >= noT.rate;
  console.log(`  => templates ${templateHelps ? "HELP (>= baseline)" : "DO NOT beat baseline — review"}`);
  results.push({ phase: "no_template", ...noT });

  // Verdict for the B2 default swap
  const best = [...results.filter((r) => r.phase === "with_template")].sort((a, b) => b.rate - a.rate)[0];
  console.log(`\n## Verdict\n  best model on golden set: ${best.model} (${(best.rate * 100).toFixed(0)}%)`);

  const out = path.join(ROOT, "evals", "results.json");
  fs.writeFileSync(out, JSON.stringify({ date: process.env.BASELINE_DATE || new Date().toISOString().slice(0, 10), models: MODELS, results, template_helps: templateHelps, best_model: best.model }, null, 2));
  console.log(`\n(results → local-llm/evals/results.json)`);
})().catch((e) => { console.error("EVAL ERROR:", e.message); process.exit(1); });

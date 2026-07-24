#!/usr/bin/env node
/**
 * SessionEnd hook — dated, persistent session handoff.
 *
 * Complements session-stop.sh (which writes a terse OVERWRITING per-CWD
 * snapshot to ~/.claude/handoffs/<slug>.md on every Stop). This fires once at
 * true session end and writes a DATED, non-overwriting handoff so every session
 * leaves a durable record:
 *   ~/.claude/handoffs/<slug>/<ISO-timestamp>.md
 *
 * Content = deterministic git/state snapshot + (optional) a local-LLM narrative
 * of the session transcript via Ollama (zero-cost, ATLAS-native). The narrative
 * is best-effort: if Ollama isn't running or anything fails, it's skipped and
 * the deterministic snapshot still writes.
 *
 * FAIL-OPEN by design: any error -> exit 0. A handoff writer must never break
 * the session it's summarizing.
 */
const fs = require("fs");
const path = require("path");
const os = require("os");
// Shared libs (2026-06-09): slug/git/ollama unified — see hooks/lib/.
const { cwdSlug } = require("./lib/slug");
const { getGitState } = require("./lib/git");
const { ollamaGenerate } = require("./lib/ollama");

// Extract readable conversation turns from the JSONL transcript. Feeding raw
// JSONL to the 7B model produced garbage narratives (audit 2026-06-09: 38/40
// handoffs empty, the other 2 off-language filler) — the model needs prose.
function extractConversation(transcriptPath, budget = 12000) {
  let lines;
  try {
    lines = fs.readFileSync(transcriptPath, "utf8").split("\n").filter(Boolean);
  } catch {
    return "";
  }
  const turns = [];
  let used = 0;
  for (let i = lines.length - 1; i >= 0 && used < budget; i--) {
    let o;
    try {
      o = JSON.parse(lines[i]);
    } catch {
      continue;
    }
    const msg = o && o.message;
    if (!msg || !msg.role) continue;
    let text = "";
    if (typeof msg.content === "string") text = msg.content;
    else if (Array.isArray(msg.content)) {
      text = msg.content
        .filter((b) => b && b.type === "text" && typeof b.text === "string")
        .map((b) => b.text)
        .join("\n");
    }
    text = text.trim();
    if (!text || text.startsWith("<system-reminder>") || text.startsWith("<task-notification>")) continue;
    const turn = `${msg.role.toUpperCase()}: ${text.slice(0, 1500)}`;
    turns.push(turn);
    used += turn.length;
  }
  return turns.reverse().join("\n\n");
}

async function summarize(transcriptPath) {
  try {
    const conversation = extractConversation(transcriptPath);
    if (!conversation) return "";
    const prompt =
      "You are writing a terse engineering session handoff for the NEXT session. " +
      "From this conversation, output 4-8 markdown bullets: what was done, " +
      "key decisions, and the single most important next step. Be concrete — name files, " +
      "commands, decisions. No preamble, no headers, bullets only.\n\nCONVERSATION:\n" + conversation;
    // 15s: cold qwen2.5:7b load can take >10s; warm is ~1-3s. Breaker + fail-open in lib/ollama.
    return (await ollamaGenerate({ prompt, timeoutMs: 15000, forceEnglish: true })) || "";
  } catch {
    return "";
  }
}

(async () => {
  try {
    let input = "";
    try { input = fs.readFileSync(0, "utf8"); } catch {}
    let data = {};
    try { data = JSON.parse(input || "{}"); } catch {}

    const cwd = data.cwd || process.cwd();
    const sessionId = data.session_id || "unknown";
    const reason = data.reason || "";
    const transcriptPath = data.transcript_path || "";

    const git = getGitState(cwd);
    const { branch, statusRaw } = git;
    const commits = git.commits.join("\n");
    const changed = git.changedCount;

    let workflow = "none";
    if (fs.existsSync(path.join(cwd, ".flow", "state.yaml"))) workflow = "flow (active)";
    else if (fs.existsSync(path.join(cwd, ".hackathon", "scope.md"))) workflow = "hackathon (scope locked)";
    else if (fs.existsSync(path.join(cwd, ".hackathon"))) workflow = "hackathon";

    let narrative = "";
    if (transcriptPath && fs.existsSync(transcriptPath)) {
      narrative = await summarize(transcriptPath);
    }

    const now = new Date();
    const stamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const dir = path.join(os.homedir(), ".claude", "handoffs", cwdSlug(cwd));
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, stamp + ".md");

    const L = [];
    L.push(`# Session handoff — ${now.toISOString()}`);
    L.push("");
    L.push(`- cwd: \`${cwd}\``);
    L.push(`- session_id: ${sessionId}`);
    L.push(`- branch: ${branch || "(not a git repo)"}`);
    L.push(`- uncommitted_changes: ${changed}`);
    L.push(`- workflow_state: ${workflow}`);
    if (reason) L.push(`- end_reason: ${reason}`);
    L.push("");
    if (narrative) {
      L.push("## What happened (local-LLM summary — verify before trusting)");
      L.push(narrative);
      L.push("");
    } else {
      L.push("> No narrative (transcript absent or local LLM offline). Run `/reflect` or `/handoff` for a full narrative.");
      L.push("");
    }
    if (commits) {
      L.push("## Recent commits");
      L.push("```");
      L.push(commits);
      L.push("```");
      L.push("");
    }
    if (statusRaw) {
      L.push("## Uncommitted at session end");
      L.push("```");
      L.push(statusRaw.slice(0, 4000));
      L.push("```");
      L.push("");
    }

    fs.writeFileSync(file, L.join("\n"));
    process.exit(0);
  } catch {
    process.exit(0);
  }
})();

#!/usr/bin/env node
/**
 * atlas-extractor.js — Heuristic Memory Auto-Extractor for ATLAS
 * ================================================================
 * Extracted from mempalace/general_extractor.py, evolved for ATLAS.
 *
 * Pure regex/heuristic classifier — zero LLM calls, zero dependencies.
 * Classifies text into ATLAS knowledge taxonomy:
 *   G-PAT (pattern)    — reusable approach, convention, or technique
 *   G-SOL (solution)   — specific problem + fix
 *   G-ERR (error)      — mistake to avoid, what went wrong
 *   G-PREF (preference) — user preference, style choice, "always/never" rules
 *   G-FAIL (failure)   — approach that was tried and didn't work
 *
 * Integration: session-stop (auto-extract), precompact (extract before compaction)
 */

const fs = require("fs");
const path = require("path");

// ── Marker Sets (engineering-focused) ────────────────────────────────

const MARKERS = {
  pattern: [
    /\bpattern\b/i,
    /\bconvention\b/i,
    /\bbest practice\b/i,
    /\balways (use|do|prefer|start with)\b/i,
    /\bthe (right|correct|proper) way\b/i,
    /\bapproach\b.*\b(works|worked|better)\b/i,
    /\breusable\b/i,
    /\babstraction\b/i,
    /\barchitecture\b/i,
    /\bstructure\b.*\b(like|as|follows)\b/i,
    /\bwe (use|follow|adopt)\b/i,
    /\bstandard\b.*\b(way|approach|method)\b/i,
    /\bidiom(atic)?\b/i,
    /\btemplate\b/i,
    /\bscaffold\b/i,
    /\bboilerplate\b/i,
    /\bthe trick (is|was)\b/i,
    /\bthe key (is|was|insight)\b/i,
    /\blearned that\b/i,
    /\bturns out\b.*\b(should|need to|works)\b/i,
  ],
  solution: [
    /\bfixed\b.*\bby\b/i,
    /\bsolved\b.*\bby\b/i,
    /\bresolved\b.*\bby\b/i,
    /\bthe fix (is|was)\b/i,
    /\bthe solution (is|was)\b/i,
    /\bworkaround\b/i,
    /\bgot it working\b/i,
    /\bit works?\b.*\b(now|after|when|if)\b/i,
    /\broot cause\b/i,
    /\bthe (problem|issue|bug) was\b/i,
    /\bbecause\b.*\b(was|were|had)\b.*\b(wrong|missing|broken|stale|outdated)\b/i,
    /\bhad to\b.*\binstead\b/i,
    /\bchanging\b.*\b(to|from)\b.*\bfixed\b/i,
    /\bthe answer\b/i,
    /\bdiagnos(ed|is)\b/i,
    /\bpatched\b/i,
    /\bnailed it\b/i,
    /\bfigured (it )?out\b/i,
    /\bcracked (it|the)\b/i,
  ],
  error: [
    /\bmistake\b/i,
    /\bdon'?t (do|make|use|forget)\b.*\b(this|that|it)\b/i,
    /\bshould(n'?t| not) have\b/i,
    /\bwasted\b.*\b(time|hours|effort)\b/i,
    /\bwrong\b.*\b(approach|way|assumption)\b/i,
    /\btrap\b/i,
    /\bgotcha\b/i,
    /\bpitfall\b/i,
    /\bfoot ?gun\b/i,
    /\bregret\b/i,
    /\bnever again\b/i,
    /\blearned.*hard way\b/i,
    /\bwarn(ing)?\b.*\b(about|against)\b/i,
    /\bavoid\b/i,
    /\bcareful\b.*\b(with|about|not to)\b/i,
    /\bcost us\b/i,
    /\bbroke\b.*\b(production|prod|deploy|build)\b/i,
    /\bincident\b/i,
    /\bpostmortem\b/i,
  ],
  preference: [
    /\bi prefer\b/i,
    /\balways use\b/i,
    /\bnever use\b/i,
    /\bdon'?t (ever )?use\b/i,
    /\bi like (to|when|how)\b/i,
    /\bi (hate|dislike) (when|how|it when)\b/i,
    /\bplease (always|never|don'?t)\b/i,
    /\bmy (preference|style|convention|rule)\b/i,
    /\bwe (always|never)\b/i,
    /\binstead of\b/i,
    /\brather than\b/i,
    /\bstop (doing|using|adding)\b/i,
    /\bkeep (doing|using)\b/i,
    /\bexactly\b.*\b(like|how|what)\b/i,
    /\bperfect\b.*\b(keep|exactly|that'?s)\b/i,
    /\byes\b.*\b(that|this|exactly)\b/i,
    /\bthat'?s (right|correct|what i want)\b/i,
    /\bdon'?t (change|touch|modify)\b/i,
  ],
  failure: [
    /\btried\b.*\b(didn'?t|doesn'?t|won'?t) work\b/i,
    /\bdoesn'?t (work|help|solve|fix)\b/i,
    /\bfailed\b/i,
    /\bdidn'?t work\b/i,
    /\bwon'?t work\b/i,
    /\babandoned\b/i,
    /\bscrapped\b/i,
    /\brolled back\b/i,
    /\breverted\b/i,
    /\bdead end\b/i,
    /\bwaste of time\b/i,
    /\bnot (worth|viable|practical|feasible)\b/i,
    /\btoo (complex|slow|heavy|fragile|brittle)\b/i,
    /\boverkill\b/i,
    /\bover-?engineer(ed|ing)\b/i,
    /\bpremature\b.*\b(optimization|abstraction)\b/i,
    /\btried (and|but)\b/i,
    /\bwe (tried|attempted|experimented)\b/i,
  ],
};

// ── Scoring ──────────────────────────────────────────────────────────

function scoreMarkers(text, markers) {
  let score = 0;
  const hits = [];
  for (const rx of markers) {
    const matches = text.match(new RegExp(rx.source, rx.flags + "g"));
    if (matches) {
      score += matches.length;
      hits.push(rx.source.slice(0, 40));
    }
  }
  return { score, hits };
}

// ── Disambiguation ───────────────────────────────────────────────────

const RESOLUTION_PATTERNS = [
  /\bfixed\b/i,
  /\bsolved\b/i,
  /\bresolved\b/i,
  /\bgot it working\b/i,
  /\bit works\b/i,
  /\bthe (fix|answer|solution)\b/i,
];

function hasResolution(text) {
  return RESOLUTION_PATTERNS.some((rx) => rx.test(text));
}

function disambiguate(type, text, scores) {
  // A "failure" with resolution → solution
  if (type === "failure" && hasResolution(text) && scores.solution > 0) {
    return "solution";
  }
  // An "error" that describes a specific fix → solution
  if (type === "error" && hasResolution(text) && scores.solution > scores.error) {
    return "solution";
  }
  return type;
}

// ── Code Filtering ───────────────────────────────────────────────────

const CODE_PATTERNS = [
  /^\s*[$#]\s/,
  /^\s*(import|from|def|class|function|const|let|var|return)\s/,
  /^\s*[A-Z_]{2,}=/,
  /^\s*```/,
  /^\s*[{}[\]]\s*$/,
  /^\s*(if|for|while|try|except|elif|else:)\b/,
  /^\s*\w+\.\w+\(/,
];

function extractProse(text) {
  const lines = text.split("\n");
  const prose = [];
  let inCode = false;
  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      inCode = !inCode;
      continue;
    }
    if (inCode) continue;
    if (!CODE_PATTERNS.some((rx) => rx.test(line))) {
      prose.push(line);
    }
  }
  const result = prose.join("\n").trim();
  return result || text;
}

// ── Segment Splitting ────────────────────────────────────────────────

function splitSegments(text) {
  // Try paragraph splitting first
  const paragraphs = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 30);

  // If single block, chunk by line groups
  if (paragraphs.length <= 1 && text.split("\n").length > 20) {
    const lines = text.split("\n");
    const segments = [];
    for (let i = 0; i < lines.length; i += 25) {
      const chunk = lines.slice(i, i + 25).join("\n").trim();
      if (chunk.length > 30) segments.push(chunk);
    }
    return segments;
  }

  return paragraphs;
}

// ── Main Extraction ──────────────────────────────────────────────────

function extractMemories(text, opts = {}) {
  const { minConfidence = 0.3, maxResults = 20 } = opts;
  const segments = splitSegments(text);
  const memories = [];

  for (const segment of segments) {
    if (segment.length < 30) continue;

    const prose = extractProse(segment);
    const scores = {};

    for (const [type, markers] of Object.entries(MARKERS)) {
      const { score } = scoreMarkers(prose, markers);
      if (score > 0) scores[type] = score;
    }

    if (Object.keys(scores).length === 0) continue;

    // Length bonus for substantial content
    const lengthBonus = segment.length > 500 ? 2 : segment.length > 200 ? 1 : 0;

    let maxType = Object.keys(scores).reduce((a, b) =>
      scores[a] > scores[b] ? a : b
    );
    const maxScore = scores[maxType] + lengthBonus;

    // Disambiguate
    maxType = disambiguate(maxType, prose, scores);

    // Confidence
    const confidence = Math.min(1.0, maxScore / 5.0);
    if (confidence < minConfidence) continue;

    memories.push({
      content: segment.trim(),
      type: maxType,
      atlas_tag: typeToTag(maxType),
      confidence: Math.round(confidence * 100) / 100,
      preview: segment.trim().replace(/\n/g, " ").slice(0, 100),
    });
  }

  // Sort by confidence descending, cap results
  memories.sort((a, b) => b.confidence - a.confidence);
  return memories.slice(0, maxResults);
}

function typeToTag(type) {
  const map = {
    pattern: "G-PAT",
    solution: "G-SOL",
    error: "G-ERR",
    preference: "G-PREF",
    failure: "G-FAIL",
  };
  return map[type] || "G-PAT";
}

// ── Compact Output (for hook integration) ────────────────────────────

function extractCompact(text) {
  const memories = extractMemories(text, { minConfidence: 0.5 });
  if (memories.length === 0) return "";

  const lines = ["EXTRACTED_MEMORIES:"];
  for (const m of memories.slice(0, 5)) {
    lines.push(`  [${m.atlas_tag}] (${m.confidence}) ${m.preview}...`);
  }
  return lines.join("\n");
}

// ── CLI ──────────────────────────────────────────────────────────────

function cli() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  switch (cmd) {
    case "extract": {
      const filepath = args[1];
      if (!filepath) return console.error("Usage: atlas-extractor extract <file>");
      let text;
      try {
        text = fs.readFileSync(filepath, "utf8");
      } catch (err) {
        console.error(`Error reading file: ${filepath} — ${err.code || err.message}`);
        process.exit(1);
      }
      const memories = extractMemories(text);
      if (memories.length === 0) return console.log("No extractable memories found.");
      console.log(`Extracted ${memories.length} memories:\n`);
      for (const m of memories) {
        console.log(`  [${m.atlas_tag}] (${m.confidence}) ${m.preview}`);
      }
      break;
    }
    case "extract-stdin": {
      let data = "";
      process.stdin.setEncoding("utf8");
      process.stdin.on("data", (chunk) => (data += chunk));
      process.stdin.on("end", () => {
        const memories = extractMemories(data);
        console.log(JSON.stringify(memories, null, 2));
      });
      break;
    }
    case "compact": {
      const filepath = args[1];
      if (!filepath) return console.error("Usage: atlas-extractor compact <file>");
      let text;
      try {
        text = fs.readFileSync(filepath, "utf8");
      } catch (err) {
        console.error(`Error reading file: ${filepath} — ${err.code || err.message}`);
        process.exit(1);
      }
      const result = extractCompact(text);
      console.log(result || "No high-confidence memories found.");
      break;
    }
    default:
      console.log("atlas-extractor — Heuristic Memory Auto-Extractor for ATLAS");
      console.log("");
      console.log("Commands:");
      console.log("  extract <file>    Extract and classify memories from a file");
      console.log("  extract-stdin     Extract from stdin (JSON output)");
      console.log("  compact <file>    Compact extraction (for hook output)");
  }
}

// ── Exports ──────────────────────────────────────────────────────────

module.exports = {
  extractMemories,
  extractCompact,
};

if (require.main === module) cli();

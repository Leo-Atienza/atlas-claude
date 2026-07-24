#!/usr/bin/env node
/**
 * ensure-frontend-mcp.js — auto-provision the frontend MCP bundle into a
 * frontend project's own .mcp.json (project scope).
 *
 * Context: the 5 UI-component MCP servers (shadcn, heroui, aceternity,
 * magicuidesign-mcp, iconify) were demoted from GLOBAL user scope on
 * 2026-05-28 (jazzy-wren audit) to cut global tool-surface bloat. This restores
 * them automatically — but only in projects that actually need them (detected
 * via package.json frontend deps) — satisfying the requirement that demoted
 * servers stay automatically available to relevant new/current projects.
 *
 * Model: PROVISION ONCE. The first time a frontend project is seen, the bundle
 * is merged into its .mcp.json and a marker is written to
 * ~/.claude/cache/frontend-mcp/<slug>.done. After that the project is never
 * touched again — you freely add/remove servers and they stay as you set them.
 *
 * Safety: writes ONLY the small project-scope .mcp.json (never ~/.claude.json),
 * never clobbers existing keys, atomic temp+rename, fail-open (never blocks
 * session start). Servers still require Claude Code's normal one-time
 * project-MCP approval prompt before they activate.
 *
 * CWD source: SessionStart hook payload (.cwd on stdin) → argv[2] → process.cwd().
 * Usage (direct): node ensure-frontend-mcp.js [projectDir]
 */
const fs = require("fs");
const path = require("path");

const CLAUDE_DIR = path.resolve(__dirname, "..");
const BUNDLE = path.join(CLAUDE_DIR, "templates", "frontend-mcp.json");
const MARKER_DIR = path.join(CLAUDE_DIR, "cache", "frontend-mcp");

const FRONTEND_DEPS = [
  "react", "next", "vue", "svelte", "solid-js", "astro", "@angular/core",
  "tailwindcss", "nativewind", "expo", "@remix-run/react", "preact",
];

function debug(msg) { if (process.env.EFM_DEBUG) console.error("[ensure-frontend-mcp]", msg); }
function slug(p) { return p.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120) || "root"; }

function run(targetRaw) {
  try {
    const target = path.resolve(targetRaw || process.cwd());
    if (target === CLAUDE_DIR) return debug("target is ~/.claude — skip");

    const marker = path.join(MARKER_DIR, slug(target) + ".done");
    if (fs.existsSync(marker)) return debug("already provisioned once — hands off");

    const pkgPath = path.join(target, "package.json");
    if (!fs.existsSync(pkgPath)) return debug("no package.json — not a frontend project (no marker; will recheck)");
    let pkg; try { pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")); } catch { return debug("package.json unparseable"); }
    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    if (!FRONTEND_DEPS.some((d) => d in deps)) return debug("no frontend deps — skip (no marker; will recheck)");

    let bundle; try { bundle = JSON.parse(fs.readFileSync(BUNDLE, "utf8")); } catch { return debug("bundle missing/unreadable"); }
    const servers = bundle.mcpServers || {};

    const mcpPath = path.join(target, ".mcp.json");
    let cfg = { mcpServers: {} };
    if (fs.existsSync(mcpPath)) {
      try { cfg = JSON.parse(fs.readFileSync(mcpPath, "utf8")); }
      catch { return debug(".mcp.json exists but unparseable — refuse to clobber"); }
      if (!cfg.mcpServers || typeof cfg.mcpServers !== "object") cfg.mcpServers = {};
    }

    const added = [];
    for (const [name, def] of Object.entries(servers)) {
      if (!(name in cfg.mcpServers)) { cfg.mcpServers[name] = def; added.push(name); }
    }

    if (added.length) {
      if (!cfg._comment_frontend_mcp) {
        cfg._comment_frontend_mcp = "Frontend UI-component MCP servers auto-added once by ~/.claude/scripts/ensure-frontend-mcp.js (jazzy-wren audit). This project is now marked provisioned and will NOT be touched again — add/remove freely.";
      }
      const tmp = mcpPath + ".tmp";
      fs.writeFileSync(tmp, JSON.stringify(cfg, null, 2));
      fs.renameSync(tmp, mcpPath);
      console.log(`[ensure-frontend-mcp] added ${added.join(", ")} to ${target}/.mcp.json — approve on next session to activate`);
    }

    // Mark provisioned (whether we added or all were already present).
    fs.mkdirSync(MARKER_DIR, { recursive: true });
    fs.writeFileSync(marker, new Date().toISOString() + "\n");
  } catch (e) { debug(String((e && e.message) || e)); /* fail-open */ }
}

// CWD resolution: stdin payload (.cwd) for hook use, else argv, else process.cwd().
if (process.argv[2] || process.stdin.isTTY) {
  run(process.argv[2]);
} else {
  let raw = "";
  process.stdin.on("data", (c) => (raw += c));
  process.stdin.on("end", () => {
    let cwd = null;
    if (raw) { try { cwd = JSON.parse(raw).cwd; } catch { /* ignore */ } }
    run(cwd);
  });
  process.stdin.on("error", () => run(null));
}

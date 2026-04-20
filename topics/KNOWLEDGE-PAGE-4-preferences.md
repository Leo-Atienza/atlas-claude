# Knowledge Store — Page 4: Preferences (G-PREF)

> User preferences that guide Claude's behavior. Each entry captures what the user wants and when to apply it.

---

## G-PREF-001: Flow for Multi-Phase
**Date**: 2026-02-25 | **Tags**: #workflow #flow

Use Flow lifecycle for multi-phase projects (10+ files, multiple architectural layers). `/flow:start` auto-detects depth. Single-file fixes → just do it. Small features (<5 files) → `/flow:quick`. Unclear requirements → brainstorm first.

---

## G-PREF-004: Continuous Evolution
**Date**: 2026-02-27 | **Tags**: #learning #memory

Every session should leave a trace. If you learn something reusable, capture it immediately. Knowledge Directory is the source of truth. Topic files provide depth. Don't wait to be asked.

---

## G-PREF-006: Community Best Practices
**Date**: 2026-02-27 | **Tags**: #setup #optimization

Interested in applying community best practices to Claude Code setup: hook patterns, skill architecture, MCP server selection, CLAUDE.md structure, memory systems.

---

## G-PREF-007: Pending Web Libraries (npm)
**Date**: 2026-04-09 | **Tags**: #web #libraries #react #next.js

Libraries the user wants to add to web projects when the time comes. Do not install automatically — suggest when the use case arises.

| Library | Purpose | Notes |
|---------|---------|-------|
| `sonner` | Toast notifications (React) | 12.2k stars, MIT, actively maintained by emilkowalski |
| `vaul` | Drawer/bottom-sheet (React) | 8.3k stars, MIT, actively maintained by emilkowalski through 2025–2026 |
| `popper.js` | Tooltip/popover positioning | Industry standard, used under the hood by many UI libs |
| `animate-on-scroll` (AOS) | Scroll-triggered CSS animations | Lightweight, good for marketing pages |
| `chart.js` | Canvas-based charting | Best for simple charts; react-chartjs-2 is the React wrapper |
| `luxon` | Date/time manipulation | Modern successor to moment.js; timezone-aware |
| `sweetalert2` | Styled modal/alert dialogs | Rich replacement for browser alert/confirm/prompt |

---

## G-PREF-008: Done Workflow Commit+Reflect
**Date**: 2026-03-08 | **Tags**: #workflow #git #reflection

`/done` closes sessions with commit + reflect as a paired ritual. Commit captures code changes, reflection captures knowledge. One without the other is incomplete.

---

## G-PREF-009: Bundle Related Commits
**Date**: 2026-03-08 | **Tags**: #git #commits

Bundle related changes into a single descriptive commit. One logical unit of work = one commit. Commit messages describe the *why*, not "update files".

---

## G-PREF-010: Premium Non-Generic UI
**Date**: 2026-03-10 | **Tags**: #design #ui #magic-ui #animation

Unique, advanced designs over plain layouts. Motion (Framer Motion, scroll effects), depth (gradients, shadows, glassmorphism), premium components (Magic UI, Aceternity, shadcn/ui), variable fonts, gradient headings, hover states, loading skeletons, dark mode. Never plain white with centered text.

---

## G-PREF-012: Full Codebase Scan Before Implementation
**Date**: 2026-03-31 | **Tags**: #workflow #discovery

For "improve/polish/upgrade" requests: scan entire codebase first with parallel agents, produce a scored scorecard with file references, then use scores to drive implementation priority. Never jump to implementing without scanning.

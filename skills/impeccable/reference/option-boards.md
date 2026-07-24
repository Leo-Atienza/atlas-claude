# Option Boards — presenting design variations the user can point at

The rest of impeccable is *commit to one bold direction*. This file is the other mode: when the
right move is to put **several** built variations in front of the user and let them mix and match.
Use it during shape/craft exploration, never as the shipped artifact.

> Provenance: the board protocol and the variation stance are adapted from Anthropic's Claude
> Design `hifi-design` skill (read 2026-07-23), rewritten to run as a plain local HTML file.
> The original depends on that product's host canvas for pan/zoom; this version does not.

---

## When to build a board

Ask two questions before choosing a format:

| Situation | Format |
|---|---|
| The brief is settled and you're refining one thing | **No board.** Build the real thing; iterate per [craft.md](craft.md) step 4. |
| Direction is open, or the user said "show me some options" | **Board** — a vertical stack of anchored option cards |
| One option, but it needs to be felt at real size (a landing hero, a full page) | **Single full-size responsive prototype**, not a board |
| 3+ options, each small enough to read side by side | **Board** |

The heuristic is how *design-y* vs *prototype-y* the ask is. Prototype-y work wants one thing at
full size. Design-y work wants comparison.

---

## The variation stance

**The goal is not to find the perfect option. It's to expose atomic variations the user can
recombine.** This is a real departure from the rest of this skill — here you are deliberately
NOT committing.

- **Give 3+ variations, varied across several dimensions** — not three shades of one idea.
- **Mix by-the-book with novel.** Some options should match existing patterns; others should try
  an unusual layout, metaphor, or type treatment.
- **Ramp the risk.** Start with the safe reading of the brief, get more creative as you go. The
  last option should be the one you're least sure about.
- **Vary the axes independently** so they can be recombined: scale, fill vs outline, texture,
  visual rhythm, layering, type treatment, with-iconography vs without, color-forward vs restrained.
- **Every option still obeys the floors.** The absolute bans, the reflex-font list, contrast, focus,
  and reduced-motion are not relaxed because it's an exploration. Variation happens *inside* the
  constraints — that is the entire point of having them.

**Missing an icon, image, or component? Draw a placeholder.** In an exploration board a labelled
placeholder beats a bad attempt at the real thing. This is scoped to board assets only — it does
**not** loosen the "real copy, never lorem ipsum" rule, which still holds everywhere including here.

---

## The board protocol

The protocol is what makes a board conversational. The user replies *"more like 2a but with the
serif from 1c"* — that only works if the ids are stable and visible.

**Rules, all load-bearing:**

1. Each round of options is one `<section class="dv-turn">` with id `t1`, `t2`, `t3`…
2. Each option gets a `{turn}{letter}` id — `1a`, `1b`, `2a` — on the option's **outermost**
   element (`.dv-opt`), never on the badge, so `#1b` scrolls the whole option into view.
3. **Newest turn goes on top**, inserted above the existing sections.
4. **Ids are permanent.** Never reorder, renumber, delete, or reuse an earlier turn. The user's
   vocabulary depends on `1b` still meaning what it meant an hour ago.
5. **Every id reference in the file is a link** — `<a class="dv-oid" href="#1b">1b</a>` — in turn
   headings, option labels, and the follow-up line. Never a bare `1b` in the HTML. In chat, write
   plain `1b`.
6. End each turn with one `.dv-next` line offering 2–3 plain-English follow-ups the user can paste
   straight back.

### Skeleton

Board chrome is deliberately neutral — it is furniture, and it must not compete with the options
sitting on it. Style the options, not the board.

```html
<!doctype html>
<meta charset="utf-8" />
<title>Options — {project}</title>
<style>
  body { margin: 0; background: #f0eee9; font-family: system-ui, sans-serif; }
  .dv-turn { padding: 40px 44px 32px; border-bottom: 1px solid rgba(0,0,0,.08); scroll-margin-top: 16px; }
  .dv-thd { display: flex; align-items: baseline; gap: 10px; margin: 0 0 20px; }
  .dv-tid { font: 600 10px ui-monospace, Menlo, monospace; padding: 3px 7px;
            background: #1a1a1a; color: #fdfcfa; border-radius: 4px; text-decoration: none; }
  .dv-tname { font: 600 13px/1.2 system-ui, sans-serif; color: #1a1a1a; }
  .dv-opts { display: flex; flex-wrap: wrap; gap: 28px; align-items: flex-start; }
  .dv-opt { flex: none; display: flex; flex-direction: column; gap: 9px; scroll-margin-top: 16px; }
  .dv-oid { font: 600 10.5px ui-monospace, Menlo, monospace; padding: 3px 7px;
            background: rgba(0,0,0,.08); color: #1a1a1a; border-radius: 5px; text-decoration: none; }
  .dv-olabel { display: flex; align-items: baseline; gap: 8px;
               font: 400 11px/1.3 system-ui, sans-serif; color: rgba(0,0,0,.55); }
  .dv-card { max-width: 100%; background: #fdfcfa; border: 1px solid rgba(0,0,0,.08);
             border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,.06); overflow: hidden; }
  .dv-opt:target .dv-oid { background: #2a78d6; color: #fdfcfa; }
  .dv-next { margin: 22px 0 0; font: 12px/1.5 system-ui, sans-serif; color: rgba(0,0,0,.5); }
  :focus-visible { outline: 2px solid #2a78d6; outline-offset: 2px; }
</style>

<section class="dv-turn" id="t2">
  <div class="dv-thd">
    <a class="dv-tid" href="#t2">2</a>
    <span class="dv-tname">Riffs on <a class="dv-oid" href="#1b">1b</a></span>
  </div>
  <div class="dv-opts">
    <div class="dv-opt" id="2a">
      <div class="dv-olabel"><a class="dv-oid" href="#2a">2a</a>Tighter spacing</div>
      <div class="dv-card" style="width:360px">…design…</div>
    </div>
    <div class="dv-opt" id="2b">…</div>
  </div>
  <p class="dv-next">
    Try next: "more like <a class="dv-oid" href="#2a">2a</a> but with the serif from
    <a class="dv-oid" href="#1c">1c</a>" · "make <a class="dv-oid" href="#2b">2b</a> full-bleed" ·
    "new directions"
  </p>
</section>

<section class="dv-turn" id="t1">…turn 1, unchanged…</section>
```

Size each `.dv-card` to its content — an explicit `width` is fine. Never `height: 100%`.

### Showing it

Write the board to the project (or the scratchpad for throwaway explorations) and open it with the
browser preview, then screenshot it for the user. It is a plain HTML file: no build step, no
runtime, no server beyond whatever is already running.

---

## Exit condition

A board is scaffolding. Once the user picks — a whole option, or a recombination — record the
result in `.impeccable.md` under *Costume & Theme*, then leave board mode and go build the real
thing through [craft.md](craft.md). Do not keep iterating options after the direction is settled;
that is how exploration turns into procrastination.

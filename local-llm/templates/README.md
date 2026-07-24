# local-llm task templates (B5)

"Skills for the local model." Each `<task>.md` is loaded by the `local_llm_agent`
MCP tool's `task` param (ATLAS v9 Wave 1, B3). A template supplies a tuned role +
few-shot exemplars + a refusal rule for one ALWAYS-delegate class, so the caller
just passes `{ task: "<name>", prompt: "<the text>" }`.

## Format
```
---
temperature: 0        # optional scalar overrides
num_ctx: 8192         # optional — bound context for RAM/latency on small tasks
model: qwen3.5:4b     # optional — usually OMITTED so the server default (the
                      #   eval-winning worker) propagates to every template
---
<system prompt: role line + rules + 2–3 few-shot examples + a refusal rule>
```
An optional sibling `<task>.schema.json` is used as the default structured-output
schema for that task (the caller's `format` overrides it).

## The 9 classes (mirror RULES-LOCAL-LLM's ALWAYS table)
| task | structured? | use for |
|---|---|---|
| `summarize-file` | prose | "what does this file do?" |
| `explain-grep` | prose | "what do these search results mean?" |
| `boilerplate` | prose/code | test stubs, config templates, fixtures |
| `extract-fields` | caller schema | "list all X", "what version is in package.json?" |
| `describe-snippet` | prose | "what does this function do?" (no cross-file ctx) |
| `classify` | schema ✓ | "what type is this?" (category + confidence) |
| `convert-format` | prose | diff→English, JSON→bullets, log→table |
| `answer-doc` | schema ✓ | bounded Q&A from ONE doc (found + refusal) |
| `draft-changelog` | prose | changelog rows, commit drafts, table rows |

## Acceptance (B4)
Each template must beat its no-template baseline on the promptfoo golden set
(`local-llm/evals/`). A template that doesn't beat baseline is not worth its tokens.

## Refusal rule (every template carries a form of this)
> If the provided text does not contain the answer, respond exactly `INSUFFICIENT`.
> Never invent facts not present in the input.

The engine's `self_check.insufficient` flag is set when the model emits `INSUFFICIENT`,
so the calling Claude session knows to handle it rather than trust a guess.

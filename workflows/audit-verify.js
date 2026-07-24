export const meta = {
  name: 'audit-verify',
  description: 'ATLAS audit shape (v9 G1): parallel find across dimensions → adversarially verify each finding → synthesize survivors. Keeps intermediate results out of main context.',
  whenToUse: 'Auditing ~/.claude or a codebase/subsystem where findings must be adversarially verified before acting (historical refutation rate is material — 8 refuted in the v8.14 audit).',
  phases: [
    { title: 'Find', detail: 'parallel finders, one per dimension' },
    { title: 'Verify', detail: 'independent skeptic re-derives each finding (default-refute)' },
    { title: 'Synthesize', detail: 'rank survivors' },
  ],
}

// args: { target?: string, dimensions?: string[] }  — target defaults to ~/.claude
const target = (args && args.target) || '~/.claude'
const DIMENSIONS = (args && args.dimensions) || [
  { key: 'correctness', prompt: 'dead code, wired-but-dead paths, silent-failure/fail-open bugs, stale references' },
  { key: 'drift', prompt: 'docs/counts that disagree with reality (registries, changelog, version rows)' },
  { key: 'safety', prompt: 'safety-invariant gaps: rm/delete paths, vault-push risk, secret exposure, over-granted permissions' },
  { key: 'redundancy', prompt: 'duplicate machinery / capabilities that should defer-not-duplicate' },
]

const FINDINGS = {
  type: 'object', additionalProperties: false, required: ['findings'],
  properties: { findings: { type: 'array', items: {
    type: 'object', additionalProperties: false, required: ['claim', 'evidence', 'severity'],
    properties: { claim: { type: 'string' }, evidence: { type: 'string' }, file: { type: 'string' }, severity: { type: 'string', enum: ['high', 'medium', 'low'] } } } } },
}
const VERDICT = {
  type: 'object', additionalProperties: false, required: ['confirmed', 'why'],
  properties: { confirmed: { type: 'boolean' }, why: { type: 'string' } },
}

// FIND (parallel) → VERIFY (each finding, adversarial) as a pipeline so a
// dimension's findings verify as soon as that finder returns.
const perDim = await pipeline(
  DIMENSIONS,
  (d) => agent(
    `Audit ${target} for this dimension — ${d.prompt}. Read the actual files; cite file:line. Report only real, evidenced findings (empty is fine). Do NOT fix anything.`,
    { label: `find:${d.key}`, phase: 'Find', schema: FINDINGS }),
  (found, d) => parallel((found?.findings || []).map((f) => () =>
    agent(
      `Adversarially verify this audit finding by INDEPENDENTLY re-deriving it from ${target}. Default to confirmed=false unless the evidence holds under a second look. Finding: "${f.claim}" — evidence: ${f.evidence}${f.file ? ` (${f.file})` : ''}.`,
      { label: `verify:${d.key}`, phase: 'Verify', schema: VERDICT })
      .then((v) => ({ ...f, dimension: d.key, verdict: v }))
      .catch(() => null))),
)

phase('Synthesize')
const confirmed = perDim.flat().filter(Boolean).filter((f) => f.verdict && f.verdict.confirmed)
const sev = { high: 0, medium: 1, low: 2 }
confirmed.sort((a, b) => (sev[a.severity] ?? 3) - (sev[b.severity] ?? 3))
log(`audit-verify: ${confirmed.length} findings survived adversarial verification`)
return { target, confirmed, dropped: perDim.flat().filter(Boolean).length - confirmed.length }

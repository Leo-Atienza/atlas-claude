---
name: flow:complete
description: "Archive phase/milestone + retrospective + system doc update"
argument-hint: "[version|phase-number]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
  - AskUserQuestion
---
<objective>
Complete and archive a phase or milestone.

Replaces: gsd:complete-milestone, fullstack:complete-epic

**Phase completion (default):**
- Mark phase as done
- Run brief retrospective
- Update state and roadmap

**Milestone completion (with version argument):**
- Verify all phases complete
- Archive roadmap and requirements
- Generate retrospective report
- Update SYSTEM.md
- Git tag
- Prepare for next milestone
</objective>

<context>
$ARGUMENTS
</context>

<process>

## Phase Completion

1. Verify all plans in phase have SUMMARY.md files
2. Verify VERIFICATION.md shows PASS (or run /flow:verify)
3. Mark phase complete in ROADMAP.md
4. Update state.yaml position to next phase
5. Brief retrospective:
   - What went well?
   - What was harder than expected?
   - What should we do differently?
6. Record lessons in quality metrics

## Milestone Completion (version argument)

1. Verify all phases in milestone are complete
2. Run `/flow:verify --audit` if not already done
3. Archive:
   - `.flow/milestones/v{X.Y}-ROADMAP.md`
   - `.flow/milestones/v{X.Y}-REQUIREMENTS.md`
   - `.flow/milestones/v{X.Y}-RETROSPECTIVE.md`
4. Generate comprehensive retrospective:
   - Deliverables review
   - Quality metrics summary (all phases)
   - Velocity analysis
   - Lessons learned
   - Risk review (planned vs actual)
5. Update SYSTEM.md with post-milestone changes
6. Update PROJECT.md with current state
7. Git tag: `v{X.Y}`
8. Collapse completed phases in ROADMAP.md
9. Offer: `/flow:start --depth epic` for next milestone

</process>

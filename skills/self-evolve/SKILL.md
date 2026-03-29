---
name: self-evolve
description: "Detect capability gaps and autonomously create skills, add free MCP servers, or organize agent teams. Trigger when: a task requires tools you don't have, a workflow pattern repeats 3+ times, a tool call fails because the capability is missing, or the user says 'there should be a skill for this' or 'can you learn to do X'. Always ask before adding external MCP servers."
auto-generated: false
---

# Self-Evolve — Autonomous Capability Growth

The system's meta-skill. When Claude detects it lacks a capability needed for the current task, this skill provides the decision framework to fill the gap — by creating skills, adding MCP servers, or recommending community tools.

## Gap Detection Signals

Activate self-evolve when ANY of these occur:

1. **Missing tool**: A task requires an integration or tool that isn't available (e.g., "connect to Jira" but no Jira MCP)
2. **Repeated pattern**: The same multi-step workflow has been executed 3+ times across sessions — check `~/.claude/logs/failures.jsonl` and memory `INDEX.md` for patterns
3. **Explicit request**: User says "can you learn to do X", "there should be a skill for this", "add a tool for X"
4. **Tool failure**: A tool call fails because the capability doesn't exist, not because of a bug
5. **Inefficiency signal**: Claude catches itself doing >5 manual steps that could be automated

## Decision Tree

```
┌─ Is the gap about a TOOL or INTEGRATION?
│  YES → Search MCP registry
│  │  ├─ mcp-find "{keyword}" → found free server?
│  │  │  YES → Show user: name, capabilities, source → on approval: mcp-add → register in REGISTRY.md
│  │  │  NO  → Can a skill wrap existing CLI tools?
│  │  │       YES → Create skill (see Skill Creation Protocol)
│  │  │       NO  → Inform user, suggest alternatives or manual install
│  │
│  NO ↓
│
├─ Is the gap about a REPEATED WORKFLOW?
│  YES → Create skill using Skill Creation Protocol
│  │     1. Capture the workflow steps from conversation history
│  │     2. Abstract into reusable instructions
│  │     3. Write SKILL.md with proper frontmatter
│  │     4. Register in REGISTRY.md
│  │
│  NO ↓
│
├─ Is the gap about DOMAIN KNOWLEDGE?
│  YES → Search Context7 first (no skill needed)
│  │     If recurring → create lightweight reference skill
│  │
│  NO ↓
│
└─ Is the gap about AGENT COORDINATION?
   YES → Suggest /flow:smart-swarm (SK-039) for complex multi-agent tasks
```

## MCP Server Addition Protocol

1. **Search**: Use `mcp-find` with relevant keywords
   ```
   mcp-find "jira" / "slack" / "database" / "email" / etc.
   ```

2. **Evaluate**: Check each result for:
   - Free tier available (no API key required, or user has the key)
   - Relevant to the task at hand
   - Not redundant with existing MCP servers (check REGISTRY.md MCP Servers section)

3. **Propose**: Show the user:
   ```
   Found MCP server: {name}
   Capabilities: {list of tools it provides}
   Source: {catalog entry}
   Requires: {any API keys or auth needed}

   Want me to add it?
   ```

4. **Install** (on user approval):
   ```
   mcp-add "{server-name}"
   ```

5. **Verify**: Make a test call to confirm tools are working

6. **Register**: Add entry to `~/.claude/skills/REGISTRY.md` under MCP Servers:
   ```
   | MCP-NNN | {name} | {purpose} | {access method} |
   ```

7. **Log**: Update `~/.claude/SYSTEM_CHANGELOG.md`

## Skill Creation Protocol

1. **Template**: Read `~/.claude/skills/self-evolve/templates/skill-template.md`

2. **Write**: Create `~/.claude/skills/{name}/SKILL.md` with:
   - Proper frontmatter (name, description with trigger conditions)
   - `auto-generated: true` tag in frontmatter
   - `keywords: [keyword1, keyword2, "multi word phrase"]` in frontmatter — these feed the keyword detection system so the skill is auto-suggested on matching prompts
   - Clear "When to Use" section
   - Step-by-step "Process" section
   - Expected "Output Format"

3. **Register**: Append to `~/.claude/skills/REGISTRY.md` Standalone Skills table:
   ```
   | SK-NNN | {name} | {purpose} | `skills/{name}/SKILL.md` |
   ```
   Use the next available SK number (check last entry).

4. **Changelog**: Update `~/.claude/SYSTEM_CHANGELOG.md`

5. **Verify**: Read back the skill to confirm it's well-formed

## Safety Rules — Non-Negotiable

- **NEVER** install paid services or servers requiring paid API keys without explicit user confirmation
- **NEVER** add MCP servers that require authentication tokens the user hasn't provided
- **ALWAYS** verify free tier availability before suggesting
- **ALWAYS** show the user what will be added and get confirmation for MCP servers
- **ALWAYS** check REGISTRY.md for duplicates before creating (grep for similar names/purposes)
- **MAX 1** auto-created skill per session unless user explicitly requests more
- Skills are local files only — no external downloads or binary installations
- If uncertain whether something is free, ASK the user

## Examples

### Example 1: Missing MCP Server
```
User: "Can you check my Asana tasks?"
Gap: No Asana MCP server connected
Action: mcp-find "asana" → found → propose → user approves → mcp-add → register
```

### Example 2: Repeated Pattern
```
Pattern: Claude has formatted markdown tables 4 times this session using the same 6-step process
Action: Create skill "markdown-table-formatter" with the 6 steps abstracted
```

### Example 3: Domain Knowledge
```
User: "How do I use the Stripe API?"
Action: Context7 search first → if sufficient, use inline → if recurring need, create reference skill
```

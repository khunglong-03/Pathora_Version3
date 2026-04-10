---
name: dev-commands
description: Development workflow commands: code-review, build-fix, checkpoint, aside, hookify
command: true
---

# Dev Commands

Available commands: `/code-review`, `/build-fix`, `/checkpoint`, `/aside`, `/hookify`, `/feature-dev`

---

## /code-review

Code review — local uncommitted changes or GitHub PR.

```
/code-review [pr-number | pr-url | blank for local]
```

**Local Review:**
```bash
git diff --name-only HEAD
```
Check: hardcoded credentials, SQL injection, XSS, missing input validation, large functions (>50 lines), deep nesting (>4), missing error handling, console.log, missing tests.

**PR Review:**
```bash
gh pr view <NUMBER> --json number,title,body,author,baseRefName,headRefName
gh pr diff <NUMBER>
```

Validation commands:
```bash
# TypeScript
npm run typecheck 2>/dev/null || npx tsc --noEmit
npm test

# C# / .NET
dotnet build
dotnet format --verify-no-changes
```

Decision:
- **APPROVE**: No CRITICAL/HIGH issues, validation passes
- **REQUEST CHANGES**: HIGH issues or validation failures
- **BLOCK**: CRITICAL issues found

---

## /build-fix

Incrementally fix build and type errors with minimal, safe changes.

**Step 1: Detect Build System**

| Indicator | Command |
|-----------|---------|
| `package.json` with `build` | `npm run build` |
| TypeScript | `npx tsc --noEmit --pretty` |
| Cargo.toml | `cargo build 2>&1` |
| go.mod | `go build ./...` |

**Step 2: Parse and Group Errors**
1. Run build → capture stderr
2. Group by file path
3. Sort by dependency order (fix imports/types before logic)
4. Count total errors

**Step 3: Fix Loop (One at a Time)**
1. Read file (10 lines around error)
2. Diagnose root cause
3. Fix minimally
4. Re-run build
5. Next error

**Guardrails:** Stop and ask if fix introduces more errors, same error persists 3x, or requires architecture changes.

---

## /checkpoint

Create or verify a checkpoint in your workflow.

```
/checkpoint [create|verify|list|clear] [name]
```

**Create:**
1. Ensure current state is clean
2. Commit or stash with checkpoint name
3. Log to `.claude/checkpoints.log`:
```bash
echo "$(date +%Y-%m-%d-%H:%M) | $NAME | $(git rev-parse --short HEAD)" >> .claude/checkpoints.log
```

**Verify:**
```
CHECKPOINT COMPARISON: $NAME
============================
Files changed: X
Tests: +Y passed / -Z failed
Build: [PASS/FAIL]
```

---

## /aside

Answer a quick side question without losing context from the current task.

```
/aside <your question>
/aside what does this function return?
/aside is this pattern thread-safe?
```

**Process:**
1. **Freeze** — Note what task was in progress. Do NOT edit/create/delete files.
2. **Answer** — Concise, lead with the answer. Reference file:line if relevant.
3. **Resume** — Continue immediately from where left off.

Format:
```
ASIDE: [question briefly]

[Answer here]

— Back to task: [one-line description]
```

**Edge cases:**
- No question → Ask user
- Question reveals a problem → Flag: "WARNING: This suggests [issue]. Address now or proceed?"
- Task redirect → Clarify: "(a) Info only, keep plan (b) Pause and change approach"

---

## /hookify

Create hooks to prevent unwanted Claude Opus behaviors.

```
/hookify [description of behavior to prevent]
```

**With arguments:** Parse user's description of unwanted behavior.
**Without arguments:** Analyze conversation for:
- Explicit corrections ("No, don't do that")
- Frustrated reactions to repeated mistakes
- Reverted changes
- Repeated similar issues

**Generate rule file** at `.claude/hookify.{name}.local.md`:
```yaml
---
name: descriptive-name
enabled: true
event: bash|file|stop|prompt|all
action: block|warn
pattern: "regex pattern"
---
Message shown when rule triggers.
```

**Event types:** `bash` (Bash commands), `file` (file paths), `stop` (session end), `prompt` (user messages), `all` (all events)

**Related:** `/hookify-list` (list rules), `/hookify-configure` (toggle rules), `/hookify-help` (full docs)

---

## /feature-dev

Guided feature development workflow.

### Phases

1. **Discovery** — Read feature request, identify requirements, constraints, acceptance criteria
2. **Codebase Exploration** — Trace execution paths, map architecture layers, understand conventions
3. **Clarifying Questions** — Present findings, ask design/edge-case questions, wait for response
4. **Architecture Design** — Design the feature, provide blueprint, wait for approval
5. **Implementation** — Build following approved design, prefer TDD, small focused commits
6. **Quality Review** — Review implementation, address critical issues, verify test coverage
7. **Summary** — What was built, follow-up items, testing instructions

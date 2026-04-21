# Codex Agent Instructions

## Project-Specific Commands

Commands tailored for the Pathora workspace (Next.js 16 frontend + .NET 10 backend).

| Command | Description |
|---------|-------------|
| `/plan` | Create implementation plan. WAIT for user confirmation before coding. |
| `/feature-dev` | Guided end-to-end feature development (Domain → API → Frontend) |
| `/investigate` | Debug and trace errors, find root causes, suggest fixes |
| `/code-review` | Review local changes or GitHub PR for security/quality/correctness |
| `/validate` | Run lint, build, and test gates for frontend and/or backend |
| `/commit` | Stage and commit with conventional commit message |
| `/aside` | Answer a quick side question without losing current task context |
| `/autoplan` | Auto-review pipeline — runs CEO, Design, Eng, and DX reviews with auto-decisions. One command, fully reviewed plan out. |

## OpenSpec Workflow Commands

Structured change management: propose → explore → apply → archive.

| Command | Description |
|---------|-------------|
| `/opsx-explore` | Think through ideas, investigate problems, clarify requirements (no code) |
| `/opsx-propose` | Create a full change proposal with design, specs, and task list |
| `/opsx-apply` | Implement tasks from an OpenSpec change |
| `/opsx-archive` | Archive a completed change |

## gstack — Web Browsing & Design Tools

This workspace is configured to use **gstack** for all web browsing and design tasks. The `/browse` skill replaces any `mcp__claude-in-chrome__*` tools.

**Important:** Always use gstack skills for web-related operations. Do not use MCP Chrome tools.

### Available gstack Skills

| Skill | Purpose |
|-------|---------|
| `/browse` | Browse websites and retrieve content |
| `/office-hours` | Schedule and manage office hours |
| `/review` | Conduct reviews |
| `/ship` | Ship/deploy features |
| `/qa` | Quality assurance testing |
| `/qa-only` | QA-focused testing only |
| `/investigate` | Investigate issues |
| `/design-consultation` | Get design consultation |
| `/design-review` | Design review process |
| `/design-html` | Generate HTML from designs |
| `/benchmark` | Performance benchmarking |
| `/connect-chrome` | Connect to Chrome browser |
| `/careful` | Caution mode for risky operations |
| `/learn` | Learning resources |
| `/gstack-upgrade` | Upgrade gstack itself |

## Workspace Conventions

- **Frontend**: `pathora/frontend/` — Next.js 16, port 3003, React 18.3.1
- **Backend**: `panthora_be/` — .NET 10, Clean Architecture, CQRS
- **Validation gate**: Always lint → build (FE) or build → test (BE) before completing a task
- **i18n**: Use `useTranslation()` — never hardcode UI strings
- **Data fetching**: Extend existing layer (RTK Query or Axios services), don't add a third pattern
- **Error handling**: `ErrorOr<T>` on backend, `handleApiError()` on frontend

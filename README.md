# GitBack

**Persistent development memory for coding agents.**

Your coding agent knows your code. GitBack remembers your journey.

---

## The Problem

Every developer has abandoned side projects. Not because of lack of skill — because of **context loss**. You come back after two weeks and waste an hour just remembering where you were.

Modern coding agents like Claude Code can inspect your repository. But they start every session from scratch. They can tell you *what the code does* — not *what you were trying to accomplish*.

## The Solution

GitBack preserves developer context across sessions and makes it available to coding agents through MCP.

- **Save context:** Tell your agent "GitBack, remember where I am" and it captures your intent, git state, branch, commits, TODOs, and diffs.
- **Resume context:** Come back later and ask "GitBack, where was I?" to get an AI-powered briefing combining your saved intent with current repository state.
- **Compare changes:** Ask "GitBack, what changed?" to see commits, file changes, and diffs since your last checkpoint.

## How It Works

```
Developer
    |
Claude Code / Cursor / MCP-compatible agent
    |
GitBack MCP Server (local)
    |--- git status, diff, log, branch
    |--- developer checkpoints
    |--- TODO scanning
    |
GitBack Cloud (AWS)
    |--- DynamoDB (persistent memory)
    |--- Bedrock (AI context synthesis)
```

**Two types of memory:**

| Type | Source | Example |
|------|--------|---------|
| **Explicit** | Developer tells GitBack | "I'm halfway through Stripe webhooks. Signature done, idempotency not." |
| **Observed** | GitBack reads from git | Branch: `feature/stripe`, 4 modified files, 2 TODOs |

**Evidence-backed conclusions:** Every conclusion cites its source (CHECKPOINT, COMMIT, DIFF, FILE, TODO, BRANCH) so GitBack never appears to hallucinate.

## Quick Start

### 1. Install the MCP server

Add GitBack to your Claude Code configuration:

```bash
claude mcp add gitback \
  -e GITBACK_AWS_REGION=us-west-2 \
  -e GITBACK_TABLE=claude-code-gitback \
  -s user \
  -- node /path/to/gitback/packages/mcp/dist/index.js
```

### 2. Save a checkpoint

In any git repository, tell your agent:

> "Use gitback_remember — I'm implementing user auth. Login endpoint works, refresh tokens are stubbed out. Next: finish token rotation."

GitBack captures your note plus git state (branch, commit, changed files, diffs, TODOs) and syncs to DynamoDB.

### 3. Resume later

Come back to the project and ask:

> "Use gitback_resume"

GitBack combines your saved checkpoint with the current git state, calls Bedrock for AI synthesis, and returns a briefing:

> **Last checkpoint** — 2 days ago
>
> You were implementing user authentication. Login works, refresh tokens are stubbed.
>
> **Since then:** 3 new commits, `auth/refresh.js` has 14 new lines.
>
> **What's next:** 1. Finish token rotation in `auth/refresh.js:34` 2. Add auth middleware 3. Write tests
>
> **Evidence:** CHECKPOINT (your note), DIFF (refresh.js +14 lines), COMMIT (3 since checkpoint)

### 4. View the dashboard

Start the API server and frontend:

```bash
# Terminal 1 — API server
GITBACK_AWS_REGION=us-west-2 GITBACK_TABLE=claude-code-gitback node packages/api/dist/index.js

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open http://localhost:5173 to see all your projects, checkpoints, and AI-generated context.

## MCP Tools

| Tool | Purpose |
|------|---------|
| `gitback_remember` | Save a development checkpoint with your note + git state |
| `gitback_resume` | Get an AI-powered briefing of where you left off |
| `gitback_compare` | See what changed since your last checkpoint |

## Architecture

| Component | Technology | Purpose |
|-----------|------------|---------|
| MCP Server | TypeScript, `@modelcontextprotocol/sdk` | Local interface for coding agents |
| Core Library | TypeScript, Node.js | Git state collection, checkpoints, evidence |
| Cloud Storage | AWS DynamoDB | Persistent checkpoint and context storage |
| AI Synthesis | AWS Bedrock (Claude) | Resume briefings, structured context generation |
| API Server | Express.js | Serves dashboard data from DynamoDB |
| Dashboard | React, Vite, Tailwind CSS | Web UI for project overview and Resume View |

### AWS Services Used

- **DynamoDB** — Single-table store for users, projects, checkpoints, and context snapshots
- **Bedrock** — AI-powered context synthesis and resume briefing generation
- **S3 + CloudFront** — Static frontend hosting (production)
- **API Gateway + Lambda** — REST API (production architecture)
- **Secrets Manager** — GitHub token storage (production)
- **EventBridge + SNS** — Stale project alerts (production)
- **Step Functions** — GitHub onboarding pipeline (production)

## Project Structure

```
gitback/
  packages/
    core/         # Shared library (git, checkpoints, evidence, storage, bedrock)
    mcp/          # MCP server (remember, resume, compare tools)
    api/          # Express API server for web dashboard
  frontend/       # React + Vite + Tailwind dashboard
  PRD.md          # Product Requirements Document
```

## Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Build frontend
cd frontend && npm run build
```

## Resume View Sections

The web dashboard's Resume View shows 7 sections per project:

1. **Where You Left Off** — Last checkpoint note + AI narrative
2. **What Changed Since Then** — Commits and file changes since checkpoint
3. **What's Next** — Prioritized, actionable next steps
4. **What's Done** — Completed work with evidence
5. **Decisions and Memory** — Developer decisions and rationale
6. **Files and TODOs** — Git status snapshot and TODO items
7. **Evidence** — Cited sources for every conclusion

## Why GitBack?

| | Claude Code / Cursor | GitBack |
|---|---|---|
| **Answers** | "What's in this repo right now?" | "What was I trying to do, and what's left?" |
| **Memory** | Session-scoped (ephemeral) | Persistent across sessions |
| **Context** | Code and git state | Developer intent + observed state + history |

GitBack doesn't replace coding agents. It's a **memory layer underneath them**.

---

*Come back to any project and know exactly where you left off.*

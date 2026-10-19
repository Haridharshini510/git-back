# GitBack

**Persistent development memory for coding agents.**

Your coding agent knows your code. GitBack remembers your journey.

---

Every developer has abandoned side projects — not from lack of skill, but from context loss. You come back after two weeks and spend an hour just remembering where you were.

GitBack solves this. It saves development checkpoints — your intent, decisions, and progress — alongside the actual git state. When you come back, it reconstructs exactly where you left off.

Works as an **MCP server** (for Claude Code, Cursor, etc.), a **CLI**, or through a **web dashboard**.

## Quickstart

### CLI

```bash
# In any git repository:
npx @gitback/cli remember "Halfway through auth. Login works, refresh tokens next."

# Later, when you come back:
npx @gitback/cli resume
```

### MCP Server (Claude Code / Cursor)

Add to your Claude Code settings (`~/.claude/settings.json`):

```json
{
  "mcpServers": {
    "gitback": {
      "command": "npx",
      "args": ["@gitback/mcp"]
    }
  }
}
```

Then just talk to your coding agent:

> "GitBack, remember where I am. I'm implementing Stripe webhooks. Signature validation is done, idempotency is not."

> "GitBack, where was I?"

## What Gets Captured

When you save a checkpoint, GitBack records:

| What | Source |
|---|---|
| Your note | What you said you were doing, your intent, decisions, next steps |
| Branch & commit | Current git branch and HEAD commit |
| Changed files | Modified, staged, and untracked files with their status |
| Diff summary | Summary of uncommitted changes |
| TODOs | TODO/FIXME comments found in changed files |
| Recent commits | Last 10 commit messages |

When you resume, GitBack combines your saved checkpoint with the current git state to show:
- Where you left off (your own words + observed state)
- What changed since then (new commits, file changes)
- What to do next (prioritized, actionable steps)
- Evidence supporting each conclusion

## AI-Powered Briefings (Optional)

GitBack works without any LLM — it shows you structured checkpoint data and git state.

For AI-synthesized briefings, configure any OpenAI-compatible endpoint:

```bash
# Ollama (local, free)
export GITBACK_LLM_BASE_URL=http://localhost:11434/v1
export GITBACK_LLM_MODEL=llama3.1:8b

# OpenRouter (many models, some free)
export GITBACK_LLM_BASE_URL=https://openrouter.ai/api/v1
export GITBACK_LLM_API_KEY=sk-or-...
export GITBACK_LLM_MODEL=anthropic/claude-sonnet-4-5

# OpenAI
export GITBACK_LLM_BASE_URL=https://api.openai.com/v1
export GITBACK_LLM_API_KEY=sk-...
export GITBACK_LLM_MODEL=gpt-4o

# Google AI Studio (free tier)
export GITBACK_LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
export GITBACK_LLM_API_KEY=...
export GITBACK_LLM_MODEL=gemini-2.0-flash
```

## MCP Tools

| Tool | Description |
|---|---|
| `gitback_remember` | Save a development checkpoint with your note + auto-collected git state |
| `gitback_resume` | Reconstruct where you left off, with optional AI briefing |
| `gitback_compare` | Show what changed since your last checkpoint |
| `gitback_status` | List all tracked projects with activity status |

## CLI Commands

```
gitback remember <note> [--tags tag1,tag2]   Save a checkpoint
gitback resume [--full]                       Pick up where you left off
gitback compare                               What changed since last checkpoint
gitback status                                List tracked projects
```

## Web Dashboard

GitBack includes a web dashboard for viewing all your projects at a glance.

```bash
# Start the API server
cp .env.example .env
npm run start:api

# Start the frontend dev server
cd frontend && npm run dev
```

The dashboard shows project cards with activity status (Active / Stalling / Dormant) and a Resume View with full context for each project.

## Architecture

```
Developer
    |
    v
Coding Agent (Claude Code / Cursor)
    |
    v
GitBack MCP Server (local)
    |--- Local git repo (status, diff, log, branch)
    |--- Local storage (~/.gitback/)
    |--- Optional: LLM (any OpenAI-compatible API)
    |--- Optional: Cloud sync (DynamoDB)
```

**Packages:**

| Package | Purpose |
|---|---|
| `packages/core` | Shared library: git operations, checkpoint creation, evidence gathering, LLM client |
| `packages/mcp` | MCP server exposing GitBack tools |
| `packages/cli` | Terminal interface |
| `packages/api` | Express API server for the web dashboard |
| `frontend/` | React + Vite + Tailwind dashboard |

## How It Works

**Two types of memory:**

| Type | Source | Example |
|---|---|---|
| **Explicit** | Developer tells GitBack | "I'm halfway through Stripe webhooks. Signature done, idempotency not." |
| **Observed** | GitBack reads from git | Branch: `feature/stripe`, 4 modified files, 2 TODOs |

**Evidence-backed conclusions:** Every conclusion cites its source (CHECKPOINT, COMMIT, DIFF, FILE, TODO, BRANCH) so GitBack never appears to hallucinate.

## Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run the CLI
node packages/cli/dist/index.js help

# Run the API server
npm run start:api

# Run the frontend
cd frontend && npm run dev
```

## Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

## License

[MIT](LICENSE)

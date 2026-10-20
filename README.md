# GitBack

**Persistent development memory for coding agents.**

Your coding agent knows your code. GitBack remembers your journey.

---

Every developer has abandoned side projects — not from lack of skill, but from context loss. You come back after two weeks and spend an hour just remembering where you were.

GitBack solves this. It saves development checkpoints — your intent, decisions, and progress — alongside the actual git state. When you come back, it reconstructs exactly where you left off.

Works as an **MCP server** (for Claude Code, Cursor, etc.) or as a **CLI tool**. Fully local, zero accounts, zero cloud dependencies.

## Quickstart

### MCP Server (Claude Code / Cursor)

Add to your MCP config:

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

### CLI

```bash
# In any git repository:
npx @gitback/cli remember "Halfway through auth. Login works, refresh tokens next."

# Later, when you come back:
npx @gitback/cli resume
```

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

GitBack works without any LLM — it shows structured checkpoint data and git state.

For AI-synthesized briefings, configure any OpenAI-compatible endpoint:

```bash
# Ollama (local, free)
export GITBACK_LLM_BASE_URL=http://localhost:11434/v1
export GITBACK_LLM_MODEL=llama3.1:8b

# Or use the config command:
gitback config set llm.base-url http://localhost:11434/v1
gitback config set llm.model llama3.1:8b
```

See `.env.example` for more provider examples (OpenRouter, OpenAI, Google AI Studio).

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
gitback config [show|set|unset|path]          Manage LLM provider config
```

## Architecture

```
Developer
    |
    v
Coding Agent (Claude Code / Cursor / Windsurf)
    |
    v
GitBack MCP Server (local)
    |--- Local git repo (status, diff, log, branch)
    |--- Local storage (~/.gitback/)
    |--- Optional: LLM (any OpenAI-compatible API)
```

**Packages:**

| Package | Purpose |
|---|---|
| `packages/core` | Shared library: git operations, checkpoint creation, evidence gathering, LLM client |
| `packages/mcp` | MCP server exposing GitBack tools |
| `packages/cli` | Terminal interface |

All data is stored locally in `~/.gitback/`. No accounts, no cloud, no API keys required.

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

# Run the MCP server
npm run start:mcp
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for dev setup, build instructions, and PR process.

## License

[MIT](LICENSE)

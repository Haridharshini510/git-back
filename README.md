# GitBack

[![npm version](https://img.shields.io/npm/v/gitback-core.svg)](https://www.npmjs.com/package/gitback-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Development memory for your git projects.**

When you come back to a project after days or weeks, GitBack reconstructs exactly where you left off — your intent, your progress, and what to do next.

Works as a **CLI tool** or **MCP server** (for Claude Code, Cursor, etc.). Fully local, zero accounts, zero setup.

> **Packages**: [gitback-core](https://www.npmjs.com/package/gitback-core) · [@hari2006/gitback-cli](https://www.npmjs.com/package/@hari2006/gitback-cli) · [@hari2006/gitback-mcp](https://www.npmjs.com/package/@hari2006/gitback-mcp)

---

## Quick Start

```bash
# Install
npm install -g @hari2006/gitback-cli

# Go to your project
cd your-project

# Save a checkpoint
gitback remember "Halfway through user auth. Login works, refresh tokens next."

# Later, come back and resume
gitback resume
```

---

## Install

### CLI Tool

```bash
npm install -g @hari2006/gitback-cli
```

### From Source

```bash
git clone https://github.com/Haridharshini510/git-back.git
cd git-back
npm install
npm run build
npm install -g ./packages/cli
```

### MCP Server (for AI Coding Agents)

Add to your MCP config:
- **Mac/Linux**: `~/.config/claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "gitback": {
      "command": "npx",
      "args": ["@hari2006/gitback-mcp"]
    }
  }
}
```

Or if installing from source:

```json
{
  "mcpServers": {
    "gitback": {
      "command": "node",
      "args": ["/absolute/path/to/gitback/packages/mcp/dist/index.js"]
    }
  }
}
```

---

## How to Use

### CLI

```bash
# When you're in the middle of something, save a checkpoint
gitback remember "Halfway through auth. Login works, refresh tokens next."

# Later, when you come back
gitback resume

# See what changed since your last checkpoint
gitback compare

# List all your tracked projects
gitback status
```

### MCP (with Claude Code or Cursor)

Just talk to your coding agent:

```
You: "GitBack, remember where I am. I'm implementing Stripe webhooks. 
     Signature validation is done, idempotency is not."

You: "GitBack, where was I?"
```

The agent will use the `gitback_remember` and `gitback_resume` tools automatically.

### Example Output

When you run `gitback resume`, you'll see:

```
WHERE YOU LEFT OFF
  2 hours ago (2026-11-18 10:30:15)
  "Halfway through auth. Login works, refresh tokens next."
  Branch: feature/auth
  Commit: a3f2c1d — Add login endpoint

WHAT CHANGED SINCE THEN
  2 new commits:
    b5e8f3a Refactor auth middleware
    c9d1a7e Add token validation
  3 uncommitted files:
    M src/auth/tokens.ts
    M src/middleware/auth.ts
    ? tests/auth.test.ts

TODOS FROM LAST SESSION
  TODO src/auth/tokens.ts:42 — Implement refresh token rotation
  FIXME src/middleware/auth.ts:15 — Handle expired tokens

EVIDENCE
  [CHECKPOINT] Checkpoint from 2026-11-18T10:30:15.000Z: Halfway through auth...
  [BRANCH] Current branch: feature/auth
  [COMMIT] b5e8f3a: Refactor auth middleware
  [COMMIT] c9d1a7e: Add token validation
```

---

## Features

- **Zero Setup** — Just install and run. No configuration required.
- **Fully Local** — All data stays on your machine in `~/.gitback/`. No cloud, no tracking.
- **Evidence-Based** — Every conclusion cites its source (commit, diff, TODO, etc.). No hallucinations.
- **LLM Optional** — Works great with structured output. Add Ollama/OpenRouter for AI briefings.
- **Multi-Project** — Track unlimited projects. `gitback status` shows them all.
- **MCP Compatible** — Works with Claude Code, Cursor, and any MCP-compatible AI agent.

---

## What Gets Captured

When you save a checkpoint, GitBack records:

- Your note (what you're doing, intent, decisions, next steps)
- Current branch and commit
- Modified, staged, and untracked files
- TODO/FIXME comments in changed files
- Recent commit history
- Diff summary

When you resume, it shows:
- Where you left off (your words + observed state)
- What changed since then (new commits, file changes)
- What to do next (prioritized action items)
- Evidence supporting each conclusion

---

## Optional: AI-Powered Briefings

GitBack works perfectly without any LLM — it shows structured data and git state.

For **AI-synthesized briefings**, configure any OpenAI-compatible endpoint:

### Recommended: Ollama (free, local)

```bash
# Install Ollama from https://ollama.ai
ollama pull llama3.1:8b

# Configure GitBack
gitback config set llm.base-url http://localhost:11434/v1
gitback config set llm.model llama3.1:8b

# Now resume will give you AI briefings
gitback resume
```

### Other Providers

```bash
# OpenRouter (many models, some free)
gitback config set llm.base-url https://openrouter.ai/api/v1
gitback config set llm.api-key sk-or-...
gitback config set llm.model anthropic/claude-sonnet-4-5

# OpenAI
gitback config set llm.base-url https://api.openai.com/v1
gitback config set llm.api-key sk-...
gitback config set llm.model gpt-4o

# Google AI Studio (free tier)
gitback config set llm.base-url https://generativelanguage.googleapis.com/v1beta/openai
gitback config set llm.api-key your-key
gitback config set llm.model gemini-2.0-flash
```

See `.env.example` for more provider examples.

---

## All Commands

```bash
gitback remember <note> [--tags tag1,tag2]   # Save a checkpoint
gitback resume [--full]                       # Pick up where you left off
gitback compare                               # What changed since last checkpoint
gitback status                                # List all tracked projects
gitback config [show|set|unset|path]          # Manage LLM config
gitback help                                  # Show help
```

---

## MCP Tools

| Tool | Description |
|---|---|
| `gitback_remember` | Save a checkpoint with your note + auto-collected git state |
| `gitback_resume` | Reconstruct where you left off, with optional AI briefing |
| `gitback_compare` | Show what changed since your last checkpoint |
| `gitback_status` | List all tracked projects with activity status |

---

## How It Works

**Two types of memory:**

1. **Explicit** — You tell GitBack what you're doing
2. **Observed** — GitBack reads from git automatically

**Evidence-backed conclusions:** Every conclusion cites its source (CHECKPOINT, COMMIT, DIFF, TODO, BRANCH) so GitBack never hallucinates.

**All data is local:** Everything is stored in `~/.gitback/` on your machine. No cloud, no accounts, no API keys required.

---

## Use Cases

- **Context switching** — Juggling multiple projects? Save your mental state before switching.
- **After breaks** — Coming back after lunch, weekend, or vacation? Resume instantly.
- **Bug investigation** — Save checkpoints as you investigate. Reconstruct your debugging path.
- **Handoffs** — Leaving detailed notes for teammates (or future you).
- **Progress tracking** — Natural checkpoints throughout the day show real progress.
- **Branch hopping** — Switch branches often? GitBack remembers context per branch.

---

## Development

### Setup

```bash
# Clone the repo
git clone https://github.com/Haridharshini510/git-back.git
cd git-back

# Install dependencies
npm install

# Build all packages
npm run build
```

### Project Structure

```
gitback/
├── packages/
│   ├── core/       # Shared library (git, checkpoints, LLM, storage)
│   ├── cli/        # CLI tool (gitback command)
│   └── mcp/        # MCP server for AI coding agents
```

### Build Commands

```bash
npm run build           # Build everything
npm run build:core      # Build core library
npm run build:cli       # Build CLI
npm run build:mcp       # Build MCP server
```

### Test Locally

```bash
# Test the CLI
npm run build
node packages/cli/dist/index.js help

# Test the MCP server
npm run start:mcp
```

---

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Development setup
- Project structure
- How to submit PRs
- Code style guidelines
- Areas where we need help

### Publishing

For maintainers: See [CONTRIBUTING.md](CONTRIBUTING.md) for publishing instructions.

---

## FAQ

**Q: Do I need an LLM API key?**  
A: No! GitBack works great with structured output. LLM integration is optional for AI-synthesized briefings.

**Q: Where is my data stored?**  
A: Everything is stored locally in `~/.gitback/projects/` on your machine. Each project gets its own folder.

**Q: Can I use this with private repos?**  
A: Yes! GitBack never sends data anywhere. It's completely local.

**Q: Does it work with monorepos?**  
A: Yes! Each git repository is tracked separately.

**Q: Can I export my checkpoints?**  
A: Yes! They're just JSON files in `~/.gitback/projects/{projectId}/checkpoints/`. Copy them anywhere.

**Q: Why is the CLI package `@hari2006/gitback-cli` but the command is `gitback`?**  
A: The package name is scoped to avoid npm naming conflicts, but the actual command you type is just `gitback` (defined in the package's `bin` field). Think of it like installing `@angular/cli` but typing `ng`.

---

## Roadmap

- [ ] Cloud sync (optional, encrypted)
- [ ] Team workspaces
- [ ] GitHub/GitLab integration
- [ ] VS Code extension
- [ ] Checkpoint branching (save multiple states per branch)
- [ ] Automatic checkpoint suggestions based on work patterns

---

## License

[MIT](LICENSE)

---

## Acknowledgments

Built by [@Haridharshini510](https://github.com/Haridharshini510)

If GitBack helps you, consider:
- Starring the repo
- Reporting bugs
- Suggesting features
- Contributing code

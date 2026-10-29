# GitBack

**Development memory for your git projects.**

When you come back to a project after days or weeks, GitBack reconstructs exactly where you left off — your intent, your progress, and what to do next.

Works as a **CLI tool** or **MCP server** (for Claude Code, Cursor, etc.). Fully local, zero accounts, zero setup.

---

## Install

### As a CLI tool

```bash
npm install -g @gitback/cli
```

### As an MCP server (for Claude Code / Cursor)

Add to your MCP config (`~/.config/claude/claude_desktop_config.json` or similar):

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

## Development

### Setup

```bash
# Clone the repo
git clone https://github.com/Haridharshini510/gitback.git
cd gitback

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

See [CONTRIBUTING.md](CONTRIBUTING.md) for dev setup, build instructions, and PR process.

---

## License

[MIT](LICENSE)

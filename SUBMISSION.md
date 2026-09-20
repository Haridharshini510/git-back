# GitBack — Persistent Development Memory for Coding Agents

> "Your coding agent knows your code. GitBack remembers your journey."

## Problem

Every developer has abandoned side projects. The root cause isn't lack of ideas or skill — it's **context loss**. Every time you return to a project after days or weeks away, you spend 30-60 minutes rebuilding mental context: what was I building? Why did I write this? What's next?

Modern coding agents like Claude Code can inspect a repository in real time. But they start every session from scratch. They can tell you *what the code does* — not *what you were trying to accomplish, what you already tried, or what you planned to do next*.

## Solution

GitBack is a **persistent development-memory layer for coding agents**, exposed through MCP (Model Context Protocol).

During a coding session, a developer tells their agent: *"GitBack, remember where I am."* GitBack captures their intent alongside the observed git state — branch, commit, changed files, diffs, TODOs — and persists it to the cloud.

When they return, they ask: *"GitBack, where was I?"* GitBack combines the saved checkpoint with the current repository state and uses Amazon Bedrock to generate an AI-powered resume briefing — what was done, what changed, what's next, with evidence backing every conclusion.

A web dashboard provides a visual overview of all projects, checkpoints, and AI-generated context across repositories.

**Core insight:** Developer intent + observed local state = development context. GitBack doesn't pretend to infer intent from code alone. Explicit checkpoints provide ground truth; git evidence provides supporting context.

## How It Works

```
1. Developer: "GitBack, remember where I am — finishing Stripe webhooks"
   --> MCP server captures note + git state --> saves to DynamoDB

2. Developer returns: "GitBack, where was I?"
   --> Loads checkpoint + current git state
   --> Bedrock synthesizes AI briefing
   --> Returns: what you were doing, what changed, what's next

3. Web dashboard at localhost:5173
   --> Shows all projects with status badges
   --> Resume View with 7 sections powered by AI context
```

## Two Types of Memory

| Type | Source | Example |
|------|--------|---------|
| **Explicit** | Developer tells GitBack | "Halfway through Stripe webhooks. Signature done, idempotency not." |
| **Observed** | GitBack reads from git | Branch: `feature/stripe`, 4 modified files, 2 TODOs |

Every conclusion is backed by **evidence** — tagged as CHECKPOINT, COMMIT, DIFF, FILE, TODO, or BRANCH — so GitBack never appears to hallucinate developer intent.

## MCP Tools

| Tool | Purpose |
|------|---------|
| `gitback_remember` | Save a development checkpoint with developer note + full git state |
| `gitback_resume` | AI-powered resume briefing combining saved context + current state |
| `gitback_compare` | Show what changed since the last checkpoint |

## Web Dashboard

The Resume View displays 7 sections per project:

1. **Where You Left Off** — Developer's checkpoint note + AI narrative
2. **What Changed Since Then** — Commits and file changes since checkpoint
3. **What's Next** — Prioritized, actionable next steps (AI-generated)
4. **What's Done** — Completed work with evidence citations
5. **Decisions & Memory** — Developer decisions and rationale
6. **Files & TODOs** — Git status snapshot and TODO items
7. **Evidence** — Cited sources for every conclusion

## Architecture

```
Developer
    |
Claude Code / Cursor / MCP-compatible agent
    |
GitBack MCP Server (local, TypeScript)
    |--- git status, diff, log, branch
    |--- developer checkpoints
    |--- TODO scanning
    |
GitBack Cloud (AWS)
    |--- DynamoDB (persistent memory)
    |--- Bedrock (AI context synthesis)
    |--- S3 + CloudFront (frontend hosting)
    |--- API Gateway + Lambda (REST API)
```

## AWS Services

| Service | How GitBack Uses It |
|---------|-------------------|
| **Amazon DynamoDB** | Single-table design storing users, projects, checkpoints, and AI-generated context snapshots. On-demand billing. |
| **Amazon Bedrock (Claude)** | Generates resume briefings and structured context (What's Next, What's Done, Decisions) from checkpoint + git state. |
| **Amazon S3** | Static hosting for the React dashboard. |
| **Amazon CloudFront** | CDN for frontend delivery. |
| **Amazon API Gateway** | REST API endpoints for the web dashboard. |
| **AWS Lambda** | Serverless backend for API endpoints. |
| **AWS Secrets Manager** | Encrypted storage for GitHub OAuth tokens (production architecture). |
| **Amazon EventBridge** | Daily scheduled rule for stale project detection (production architecture). |
| **Amazon SNS** | Email notifications for dormant project alerts (production architecture). |
| **AWS Step Functions** | Orchestrates the GitHub repository onboarding pipeline (production architecture). |

## Tech Stack

- **Core:** TypeScript, Node.js
- **MCP:** `@modelcontextprotocol/sdk`
- **Cloud:** AWS SDK v3 (DynamoDB, Bedrock)
- **Frontend:** React 19, Vite 8, Tailwind CSS 4
- **API:** Express.js
- **Infrastructure:** AWS SAM (CloudFormation)

## Why GitBack?

| | Claude Code / Cursor | GitBack |
|---|---|---|
| **Question** | "What's in this repo right now?" | "What was I trying to do, and what's left?" |
| **Memory** | Ephemeral (session-scoped) | Persistent across sessions |
| **Context** | Code and git state | Developer intent + observed state + history |

GitBack doesn't replace coding agents. It's a **memory layer underneath them** — any MCP-compatible agent can be a client.

## Links

- **GitHub:** https://github.com/Haridharshini510/git-back
- **Demo Video:** [link]

---

*Come back to any project and know exactly where you left off.*

# GitBack — Product Requirements Document

## Problem Statement

Every developer has abandoned side projects. The root cause isn't lack of ideas, skills, or time — it's **context loss**. Every time you return to a project after days or weeks away, you burn 30–60 minutes rebuilding mental context: what was I trying to accomplish? What did I already try? Why did I choose this approach? What remains unfinished? What was I planning to do next?

Eventually the activation energy to restart exceeds your motivation, and the project quietly dies.

Modern coding agents like Claude Code and Cursor can inspect a local repository — they see files, diffs, git history, and current code. But they start every session from scratch. They can tell you *what the code does*. They cannot tell you *what you were trying to accomplish, what you already attempted, or what you planned to do next*.

A developer doesn't lose productivity because they forgot what files exist. They lose productivity because they forgot their intent.

**GitBack solves this.** It provides persistent, structured development memory across sessions and makes that memory available to coding agents through MCP.

> **"Your coding agent knows your code. GitBack remembers your journey."**

---

## Why GitBack?

### The gap coding agents don't fill

| | Claude Code / Cursor | GitBack |
|---|---|---|
| **Question answered** | "What is happening in this repository right now, and how can I help?" | "What was I trying to accomplish, what did I already try, why did I choose this approach, what changed since my last session, and what remains unfinished?" |
| **Scope** | Current session, current workspace | Persistent across sessions, across days and weeks |
| **Context source** | Live code, git state, file system | Developer intent + observed state + history |
| **Memory** | Ephemeral (session-scoped) | Persistent (project-scoped) |

GitBack does not compete with coding agents. It is a **memory layer underneath them**. Any MCP-compatible coding agent — Claude Code, Cursor, or others — can be a client of GitBack.

GitBack's value is not "AI agents can't see your code." It is:

> **GitBack provides specialized, persistent, structured development memory across sessions and makes that memory available to coding agents.**

---

## Target User

Solo developers and small-team developers who:
- Maintain multiple repos (side projects, open source, work)
- Frequently context-switch between projects
- Lose momentum on projects due to gaps between coding sessions
- Use MCP-compatible coding agents (Claude Code, Cursor, etc.)
- Want to pick up where they left off without re-reading their own code

---

## Product Overview

GitBack is a **persistent development-memory layer for coding agents**.

It runs as a local MCP server that coding agents call directly. During a coding session, a developer tells GitBack what they're working on — their intent, decisions, and plans. GitBack combines this explicit developer input with observed state from the local repository (git status, diffs, branches, commits) to create rich development checkpoints.

When the developer returns — hours, days, or weeks later — GitBack reconstructs where they left off by combining stored checkpoints with the current repository state.

A cloud backend provides long-term storage, cross-device access, a web dashboard, and AI-powered context synthesis via AWS Bedrock.

**Core value proposition:** "Come back to any project and know exactly where you left off."

---

## Core Concepts

### Two Types of Memory

GitBack distinguishes between two categories of development memory:

#### 1. Explicit Memory

Information the developer intentionally tells GitBack to remember. This is high-confidence developer intent.

Examples:
- "I'm halfway through implementing Stripe webhook verification. Signature validation is done, duplicate event handling is not."
- "I'm intentionally using Redis instead of PostgreSQL because I need low-latency cache invalidation."
- "Don't touch the checkout UI yet. Finish webhook verification first."
- "I tried approach A and it caused stale cache invalidation, so I'm switching to approach B."

#### 2. Observed Memory

Information GitBack derives from the local development environment. This is evidence about what actually happened.

Examples:
- Git status (modified, staged, untracked files)
- Git diff (uncommitted changes)
- Current branch name
- Current commit SHA
- Recent commit messages
- Modified/new/deleted file list
- TODO/FIXME comments in changed files
- Repository structure and metadata

**The product combines both.** Developer intent provides ground truth about *why*. Observed state provides evidence about *what*. Neither alone is sufficient.

> **Developer intent + observed local state = development context.**

---

### Evidence

GitBack can explain where every conclusion came from. This prevents the system from appearing to hallucinate developer intent.

Example output:

> You were working on authentication.

> **Evidence:**
> - **CHECKPOINT:** "Finish token rotation" (saved 2 days ago)
> - **BRANCH:** `feature/auth-refresh`
> - **COMMIT:** `implement refresh token endpoint` (3 commits ago)
> - **FILE:** `auth/refresh.js:34` contains a TODO: "implement rotation logic"
> - **DIFF:** `routes/auth.js` has 12 uncommitted lines adding the refresh route

Evidence types:

| Type | Source | Description |
|---|---|---|
| `CHECKPOINT` | Explicit memory | Developer's saved checkpoint note |
| `COMMIT` | Git log | Relevant commit message |
| `DIFF` | Git diff | Uncommitted change in a relevant file |
| `FILE` | File system | File existence, content, or specific line |
| `TODO` | Source code | TODO/FIXME comment in a relevant file |
| `BRANCH` | Git | Current branch name as context signal |

---

### Activity Status

Projects are categorized by recency of development activity:

| Status | Criteria | Meaning |
|---|---|---|
| **Active** | Checkpoint or commit within 7 days | Developer is actively working |
| **Stalling** | 7–21 days since last activity | Momentum is fading |
| **Dormant** | 21+ days since last activity | Project has gone quiet |

These are neutral descriptors of activity, not value judgments. A completed project may legitimately have no commits for months — that is not "unhealthy."

---

## Core Workflow

### During a coding session

The developer is working in a local repository with their coding agent. At a natural stopping point, they say:

> "GitBack, remember where I am. I'm halfway through implementing Stripe webhook verification. I finished signature validation but haven't handled duplicate events yet. Tomorrow I want to continue with idempotency."

GitBack stores a **development checkpoint** containing:

| Field | Source | Description |
|---|---|---|
| Developer's note | Explicit | What they said they were doing |
| Branch | Observed | Current git branch |
| Commit SHA | Observed | Current HEAD commit |
| Git status | Observed | Modified, staged, untracked files |
| Changed files | Observed | List with change types |
| Relevant diffs | Observed | Summary of uncommitted changes |
| TODOs | Observed | TODO/FIXME comments in changed files |
| Recent commits | Observed | Last N commit messages |
| Timestamp | System | When the checkpoint was saved |
| Project identity | System | Stable project identifier |
| AI-generated summary | Synthesized | Structured interpretation of the session |

### When the developer returns

The developer opens the same repository and asks:

> "GitBack, where was I?"

GitBack combines:
1. The stored checkpoint (explicit memory)
2. Current local git state (observed memory)
3. Commits made since the checkpoint
4. File changes since the checkpoint
5. Previous GitBack context history

And returns something like:

> **Last checkpoint** — yesterday at 8:42 PM
>
> You were implementing Stripe webhook handling.
>
> **Completed:** signature verification in `webhook.ts`
> **Incomplete:** duplicate-event / idempotency handling
> **Your stated next step:** implement idempotency before touching the checkout UI
>
> **Since your checkpoint:**
> - `webhook.ts` has 14 new uncommitted lines
> - 2 new commits on this branch
> - No new TODOs added
>
> **Recommended starting point:** `webhook.ts:87`
>
> **Evidence:** CHECKPOINT (your note), DIFF (webhook.ts +14 lines), COMMIT (2 since checkpoint), BRANCH (feature/stripe-webhooks)

---

## Features

### 1. MCP Server (Core Interface)

The GitBack MCP server is the primary product interface. It runs locally and is configured as an MCP server in the developer's coding agent (Claude Code, Cursor, etc.).

The server has direct access to the local repository via git commands and file system reads. It communicates with the GitBack cloud API for persistent storage and AI synthesis.

**MCP Tools:**

#### `gitback_remember`

Save a development checkpoint.

**Input:**
| Parameter | Required | Description |
|---|---|---|
| `note` | Yes | Developer's description of current work, intent, decisions, and next steps |
| `tags` | No | Optional tags for categorization (e.g., "auth", "refactor") |

The tool auto-collects from the local environment:
- Repository identity (remote URL, directory)
- Current branch
- Current commit SHA
- Git status (modified, staged, untracked files)
- Uncommitted diff summary
- Recent commit messages (last 10)
- TODO/FIXME comments in changed files

**Output:** Confirmation with checkpoint ID and summary of what was captured.

**Cloud sync:** The checkpoint is persisted to DynamoDB via the cloud API.

#### `gitback_resume`

Reconstruct where the developer left off.

**Input:**
| Parameter | Required | Description |
|---|---|---|
| `detail` | No | Level of detail: `brief` (default) or `full` |

**Process:**
1. Identify current project from local git remote
2. Collect current local state (git status, branch, recent commits)
3. Fetch the most recent checkpoint from cloud storage
4. Fetch previous context history if available
5. Compute what changed since the checkpoint (new commits, file changes, diff)
6. Call Bedrock to synthesize a resume briefing from checkpoint + current state + history
7. Return the briefing with evidence

**Output:** Resume briefing containing:
- Last checkpoint summary (explicit note + timestamp)
- What changed since the checkpoint
- Recommended next steps
- Evidence supporting each conclusion

#### `gitback_compare`

Explain what changed since the last checkpoint.

**Input:**
| Parameter | Required | Description |
|---|---|---|
| `since` | No | Checkpoint ID to compare against (defaults to most recent) |

**Process:**
1. Fetch the specified checkpoint
2. Collect current git state
3. Compute diff: commits since checkpoint, file changes, new/resolved TODOs
4. Return a structured comparison

**Output:**
- Commits since checkpoint (messages and files changed)
- Files modified, added, or deleted
- Diff summary for key files
- New or resolved TODO/FIXME items
- Branch changes (if any)

#### `gitback_status`

Quick check on all connected projects.

**Input:** None.

**Output:** List of connected projects with:
- Project name
- Activity status (Active / Stalling / Dormant)
- Last checkpoint date and one-line summary
- Whether local uncommitted changes exist (for current repo only)

---

### 2. CLI

A thin CLI wrapping the same GitBack core logic as the MCP server:

```bash
gitback remember "Halfway through Stripe webhooks. Signature done, idempotency not."
gitback resume
gitback compare
gitback status
```

**Architecture:**

```
GitBack Core (shared library)
├── MCP Server (exposes tools via MCP protocol)
└── CLI (exposes commands via terminal)
```

The CLI and MCP server share identical context collection, checkpoint creation, and cloud sync logic. The CLI exists for developers who don't use an MCP-compatible coding agent, or who prefer terminal commands.

---

### 3. Web Dashboard

**What the user sees:**

A grid/list of connected project cards. Each card shows:
- Repository name
- Activity status badge: **Active** / **Stalling** / **Dormant**
- Last checkpoint date and one-line note
- Last commit date
- One-line AI context summary
- Count of unfinished items from last context
- Whether local uncommitted changes exist (if recently synced)

Example card:

> **payment-app**
> `Stalling` — last checkpoint 2 days ago
> Working on: Stripe webhook idempotency
> Next: finish duplicate-event handling
> 4 uncommitted files

**Empty state:** "Connect your first project to get started. Use `gitback remember` in any repo, or add a project from GitHub."

**"Add Project" button:** Opens the GitHub repo selector for initial onboarding of a project that hasn't been used with GitBack locally yet.

---

### 4. Resume View (Hero Feature)

Accessed by clicking a project card on the dashboard, or as the output of `gitback_resume`.

#### Section 1: Where You Left Off

The last explicit checkpoint and reconstructed context.

> **Last checkpoint** — 12 days ago (Sept 8, 8:42 PM)
>
> "I was implementing user authentication. The login endpoint works and returns a JWT. The refresh token flow is started but the rotation logic is stubbed out. Next: finish rotation, then add auth middleware."

- Developer's explicit note (verbatim)
- Timestamp and time since checkpoint
- Branch and commit at time of checkpoint

#### Section 2: What Changed Since Then

Changes between the checkpoint and the current state.

- Commits since checkpoint (with messages)
- Files modified, added, or deleted
- Uncommitted changes summary
- New or resolved TODOs
- Branch changes

#### Section 3: What's Next

Prioritized, actionable next steps based on explicit intent and current state.

1. Finish token rotation in `auth/refresh.js:34` *(from checkpoint note)*
2. Add auth middleware to protected routes *(from checkpoint note)*
3. Address new TODO in `routes/users.js:12` *(from observed state)*
4. Review 3 uncommitted files before committing *(from git status)*

Each recommendation cites its source.

#### Section 4: What's Done

Completed work, supported by evidence.

- [x] Project scaffolding (Express + Prisma + PostgreSQL) — *COMMIT: initial scaffold*
- [x] User registration and login — *FILE: routes/auth.js exists, COMMIT: implement login*
- [x] JWT token generation — *FILE: services/jwt.js, CHECKPOINT: "login endpoint works"*
- [ ] Token refresh flow — *CHECKPOINT: "rotation logic is stubbed out"*
- [ ] Protected route middleware — *CHECKPOINT: "next: add auth middleware"*

#### Section 5: Project Architecture

Technical overview of the project structure.

> This is an Express.js REST API using Prisma ORM with PostgreSQL. Routes are in `/routes`, business logic in `/services`, database models in `/prisma/schema.prisma`. Authentication uses JWT stored in HTTP-only cookies. No frontend — this is an API-only project.

- Tech stack breakdown
- Directory structure and purpose
- Key libraries and their roles

#### Section 6: Decisions & Memory

Accumulated explicit developer decisions and notes across checkpoints.

- "Using Prisma over raw SQL for database access" — *CHECKPOINT (Sept 1)*
- "JWT-based auth over session-based auth" — *CHECKPOINT (Sept 3)*
- "Tried Redis for session storage but switched to JWT because the deployment target doesn't support Redis" — *CHECKPOINT (Sept 5)*
- "Don't touch the checkout UI yet, finish auth first" — *CHECKPOINT (Sept 8)*

This section preserves *why* decisions were made, not just *what* was chosen. It accumulates across checkpoints, forming a project decision log.

#### Section 7: Evidence

A summary of all evidence supporting the Resume View's conclusions.

| Conclusion | Evidence |
|---|---|
| "Working on authentication" | CHECKPOINT: explicit note, BRANCH: `feature/auth`, COMMIT: 3 auth-related commits |
| "Login endpoint complete" | CHECKPOINT: "login works", FILE: `routes/auth.js` (182 lines), COMMIT: "implement login endpoint" |
| "Refresh flow incomplete" | CHECKPOINT: "rotation logic stubbed", FILE: `auth/refresh.js:34` has TODO, DIFF: no changes since checkpoint |

**Technical notes:**
- Resume View content for the web dashboard is pre-generated by the context synthesis pipeline and stored in DynamoDB
- The MCP `gitback_resume` tool generates the same content on-demand, combining stored context with live local state
- Clicking "Re-analyze" on the web dashboard triggers a fresh synthesis
- The web view renders from stored data — no Bedrock call on page load

---

### 5. Login (GitHub OAuth)

**What the user sees:**
- Landing page with one button: "Sign in with GitHub"
- Clicking redirects to GitHub's OAuth authorization screen
- User approves read access to their repositories
- Redirected back to GitBack's dashboard

**Technical flow:**
- Lambda handles the OAuth flow (no Cognito)
- GitHub access token stored in AWS Secrets Manager (encrypted)
- User profile stored in DynamoDB
- Session managed via signed JWT in an HttpOnly cookie
- Subsequent API requests validated by a Lambda authorizer on API Gateway

**What is NOT stored:**
- No passwords (GitHub handles authentication)
- No GitHub token in plaintext in DynamoDB

---

### 6. Add Project Flow (GitHub Onboarding)

For projects the developer hasn't yet used with GitBack locally, GitHub provides the initial onboarding context.

**What the user sees:**
1. Click "Add Project" on the dashboard
2. See a list of their GitHub repos (fetched via GitHub API)
3. Select a repo
4. Onboarding pipeline kicks off
5. Progress indicator:
   - "Fetching project structure..."
   - "Analyzing codebase..."
   - "Generating initial context..."
6. Pipeline completes (10–30 seconds)
7. Redirected to the Resume View

**Technical flow:**
- Lambda fetches repos via GitHub API (`GET /user/repos`)
- On selection, triggers Step Functions execution for initial onboarding
- Frontend polls a status endpoint every 3 seconds
- On completion, frontend navigates to Resume View

This creates an initial context snapshot so the dashboard has something to show. Ongoing context is then maintained through MCP checkpoints.

---

### 7. Stale Project Alerts (Secondary Feature)

**Priority:** Secondary. Cut if Day 4 time is needed for core polish.

**What the user receives:**

An email when a connected project hasn't had a checkpoint or commit in 7+ days:

> **Subject:** GitBack: your project "my-side-project" is going dormant
>
> It's been 12 days since your last activity on my-side-project.
>
> **Where you left off:** "You were building the payment flow. The Stripe webhook handler is complete, but the order confirmation email is half-implemented in services/email.js."
>
> **Your stated next step:** "Finish the email template, then wire up the checkout confirmation."
>
> Come back before you lose context entirely.
>
> [Open in GitBack →]

**Technical flow:**
- EventBridge rule fires daily (e.g., 9 AM UTC)
- Lambda queries DynamoDB for all projects
- Filters for projects where last activity > 7 days ago AND user hasn't been alerted recently
- Uses the **existing stored context** (checkpoint note, last context summary) — does NOT call Bedrock to regenerate
- Publishes to SNS topic (email subscription)
- Records alert timestamp in DynamoDB to prevent duplicates

**Design principle:** The alert uses existing stored context. GitBack already has the "where you left off" and "next steps" from the last checkpoint. Calling Bedrock per alert email is unnecessary.

---

## Architecture

### System Overview

```
Developer
    │
    ▼
Claude Code / Cursor / other MCP-compatible agent
    │
    ▼
┌─────────────────────────────────────────────────┐
│           GitBack MCP Server (local)             │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │           GitBack Core Library            │   │
│  │                                           │   │
│  │  • Git state collection                   │   │
│  │  • Checkpoint creation                    │   │
│  │  • Evidence gathering                     │   │
│  │  • Context reconstruction                 │   │
│  │  • Cloud API client                       │   │
│  └──────────────────────────────────────────┘   │
│         │                          │             │
│    Local Repository          Cloud API Client    │
│    ├── git status                  │             │
│    ├── git diff                    │             │
│    ├── git log                     │             │
│    ├── current branch              │             │
│    ├── local files                 │             │
│    └── TODOs                       │             │
└────────────────────────────────────┼─────────────┘
                                     │
                    Also exposed via: │
                    GitBack CLI       │
                                     │
                                     ▼
┌─────────────────────────────────────────────────┐
│            GitBack Cloud API (AWS)                │
│                                                   │
│  ┌──────────────┐    ┌───────────────────────┐   │
│  │ S3+CloudFront │    │  API Gateway (REST)   │   │
│  │ (React SPA)   │    │  + Lambda Authorizer  │   │
│  └──────────────┘    └──────────┬────────────┘   │
│                                  │                │
│              ┌───────────────────┼────────┐       │
│              ▼                   ▼        ▼       │
│        Lambda: auth      Lambda: API   Lambda:    │
│        (GitHub OAuth)    (CRUD +       stale      │
│             │            sync)         check      │
│             │              │             │        │
│     Secrets Manager    DynamoDB     EventBridge   │
│                            │           + SNS      │
│                        Step Functions             │
│                        (onboarding pipeline)      │
│                            │                      │
│                         Bedrock                   │
│                     (context synthesis)            │
└───────────────────────────────────────────────────┘
```

> **Cloud remembers what happened before. MCP knows what's happening now.**

---

### GitBack Core Library

A shared TypeScript/Node.js library used by both the MCP server and the CLI.

| Module | Responsibility |
|---|---|
| `git.ts` | Execute git commands: status, diff, log, branch, remote, show |
| `checkpoint.ts` | Create checkpoint objects from explicit note + observed state |
| `evidence.ts` | Gather and classify evidence (CHECKPOINT, COMMIT, DIFF, FILE, TODO, BRANCH) |
| `context.ts` | Reconstruct context by combining stored checkpoints with current state |
| `todos.ts` | Scan changed files for TODO/FIXME comments |
| `api-client.ts` | HTTP client for the GitBack cloud API (store/fetch checkpoints, trigger synthesis) |
| `project.ts` | Project identity resolution (map local repo to cloud project) |

---

### Deterministic vs. AI-Powered Logic

| Deterministic (no Bedrock) | AI-Powered (Bedrock) |
|---|---|
| Git state collection (status, diff, log, branch) | Synthesizing a resume briefing from checkpoint + state |
| Diff collection and file change detection | Comparing previous and current context meaningfully |
| File discovery and TODO scanning | Extracting development decisions from checkpoint history |
| Repository metadata collection | Generating concise "where you left off" narratives |
| Timestamp and commit history | Identifying likely next steps from intent + evidence |
| Checkpoint persistence and retrieval | Summarizing evidence into human-readable conclusions |
| Evidence classification | Initial codebase analysis (onboarding) |
| Project identity resolution | |

**Principle:** Do not route through Bedrock what deterministic logic can handle. AI is used for synthesis and interpretation, not data collection.

---

### AWS Services

| Service | Purpose |
|---|---|
| **S3** | Static frontend hosting (React SPA) |
| **CloudFront** | CDN for frontend, HTTPS termination |
| **API Gateway** | REST API with Lambda authorizer (JWT validation) |
| **Lambda** | All backend logic: auth, CRUD, sync, pipeline stages, stale check |
| **Step Functions** | Orchestrates the GitHub onboarding pipeline |
| **Bedrock** | Context synthesis, resume briefing generation, initial codebase analysis |
| **DynamoDB** | Single-table store for users, projects, checkpoints, context, evidence, alerts |
| **Secrets Manager** | Encrypted GitHub access token storage |
| **EventBridge** | Daily scheduled rule for stale project detection |
| **SNS** | Email notifications for stale project alerts |

### Deployment

- **Infrastructure as Code:** AWS SAM (`template.yaml`)
- **Deploy command:** `sam build && sam deploy --guided`
- **Frontend deploy:** Build with Vite, upload to S3, invalidate CloudFront
- **MCP server + CLI:** Published as an npm package, installed locally by the developer

---

## MCP Server Configuration

The developer configures GitBack as an MCP server in their coding agent.

**Claude Code example** (`.claude/settings.json` or `~/.claude/settings.json`):

```json
{
  "mcpServers": {
    "gitback": {
      "command": "npx",
      "args": ["gitback-mcp"],
      "env": {
        "GITBACK_API_URL": "https://api.gitback.dev",
        "GITBACK_API_KEY": "<user-api-key>"
      }
    }
  }
}
```

The MCP server auto-detects the current repository from the working directory.

---

## Cloud API Endpoints

| Method | Path | Lambda | Description |
|---|---|---|---|
| **Auth** | | | |
| GET | `/auth/github` | auth/github-login | Redirects to GitHub OAuth |
| GET | `/auth/github/callback` | auth/github-callback | Exchanges code for token, sets JWT cookie |
| GET | `/auth/me` | auth/me | Returns current user profile |
| POST | `/auth/logout` | auth/logout | Clears session cookie |
| GET | `/auth/api-key` | auth/api-key | Returns or generates API key for MCP/CLI auth |
| **Projects** | | | |
| GET | `/projects` | projects/list | Lists connected projects with summaries |
| POST | `/projects` | projects/connect | Connects a GitHub repo, triggers onboarding pipeline |
| GET | `/projects/:projectId` | projects/get | Gets full Resume View data |
| DELETE | `/projects/:projectId` | projects/delete | Disconnects a project |
| GET | `/projects/:projectId/status` | projects/status | Polls onboarding pipeline status |
| POST | `/projects/:projectId/analyze` | projects/analyze | Re-triggers onboarding pipeline |
| **Checkpoints** | | | |
| POST | `/projects/:projectId/checkpoints` | checkpoints/create | Stores a new checkpoint |
| GET | `/projects/:projectId/checkpoints` | checkpoints/list | Lists checkpoints (paginated, newest first) |
| GET | `/projects/:projectId/checkpoints/latest` | checkpoints/latest | Gets the most recent checkpoint |
| **Context** | | | |
| POST | `/projects/:projectId/context/synthesize` | context/synthesize | Triggers Bedrock synthesis from checkpoint + state |
| GET | `/projects/:projectId/context/latest` | context/latest | Gets the most recent context snapshot |
| **Repos** | | | |
| GET | `/repos/github` | repos/list-github | Lists user's GitHub repos for project connection |

---

## Analysis Pipeline

### Initial Onboarding (GitHub-based, Step Functions)

Runs when a user connects a new project from the web dashboard. Provides initial context for projects that don't yet have MCP checkpoints.

#### Stage 1: Fetch Tree
- **Input:** Repository owner + name, GitHub access token
- **Action:** `GET /repos/:owner/:repo/git/trees/:branch?recursive=1`
- **Output:** Flat list of all file paths in the repo

#### Stage 2: Filter & Select
- **Input:** File tree from Stage 1
- **Action:** Rule-based Lambda (no AI) applies include/exclude patterns

**Include (prioritized):**
1. Manifests: `package.json`, `requirements.txt`, `Cargo.toml`, `go.mod`, `pyproject.toml`, `pom.xml`
2. Config: `Dockerfile`, `docker-compose*`, `*.config.*`, `.env.example`, `tsconfig.json`
3. Documentation: `README*`
4. Source code: `src/**`, `app/**`, `lib/**`, `routes/**`, `api/**`, `components/**`, `models/**`, `services/**`, `pages/**`
5. Tests (limited): up to 5 test files for pattern detection

**Exclude:**
- `node_modules/**`, `.git/**`, `dist/**`, `build/**`, `coverage/**`
- `__pycache__/**`, `.next/**`, `vendor/**`, `.terraform/**`
- `*.lock`, `*.min.*`, `*.map`, `*.png`, `*.jpg`, `*.svg`, `*.ico`
- Binary files, generated files

**Limits:** Maximum 50 files, maximum 500 lines per file (truncated with note). Priority: manifests > config > README > source > tests.

#### Stage 3: Fetch Contents
- **Input:** Filtered file list, GitHub token
- **Action:** `GET /repos/:owner/:repo/contents/:path` for each file
- **Output:** Array of `{ path, content }` objects

#### Stage 4: Analyze Codebase (Bedrock)
- **Input:** File tree + curated file contents + recent commits
- **Prompt asks for:** tech stack, architecture pattern, directory structure mapping, key libraries, project state, architectural decisions
- **Output:** Structured JSON analysis

#### Stage 5: Generate Initial Context (Bedrock)
- **Input:** Analysis from Stage 4 + recent commit messages
- **Generates:** "Where you left off" narrative, completed features, suggested next steps, architecture overview, key decisions, activity status, one-line summary
- **Output:** Structured JSON context object

#### Stage 6: Store Results
- **Input:** Analysis + context from Stages 4–5
- **Action:** Write to DynamoDB (project record, analysis record, context snapshot)

### Ongoing Context Synthesis (MCP-triggered, single Lambda)

Runs when `gitback_resume` needs to generate a fresh briefing.

1. **Collect** — Receive checkpoint + current local state from MCP server (deterministic, runs locally)
2. **Fetch** — Lambda retrieves stored checkpoints and previous context from DynamoDB (deterministic)
3. **Synthesize** — Bedrock combines: last checkpoint (explicit note), current state (branch, diff, status), commits since checkpoint, previous context history, evidence
4. **Store** — Write new context snapshot to DynamoDB
5. **Return** — Send synthesized resume briefing back to MCP server

This is a single Lambda invocation, not a Step Functions workflow. The expensive part (Bedrock) is one call.

---

## Data Model (DynamoDB Single Table)

**Table:** `GitBackTable`

### Project Identity

Every connected project gets a stable `projectId` (UUID). The repository full name (`owner/repo`) is stored as an attribute but is NOT the primary identity, because repositories can be renamed or transferred.

### Schema

| PK (`userId`) | SK (sort key) | Key Attributes |
|---|---|---|
| `user#<github-id>` | `PROFILE` | displayName, email, avatarUrl, apiKey, createdAt |
| `user#<github-id>` | `PROJECT#<projectId>` | projectId, repoFullName, repoUrl, localPath, defaultBranch, techStack, activityStatus, summary, lastCheckpointAt, lastAnalyzedAt, lastCommitDate |
| `user#<github-id>` | `CHECKPOINT#<projectId>#<timestamp>` | checkpointId, explicitNote, tags, branch, commitSha, gitStatusSnapshot, changedFiles, relevantDiffSummary, todosSnapshot, recentCommits, timestamp |
| `user#<github-id>` | `CONTEXT#<projectId>#<timestamp>` | whereYouLeftOff, whatChanged, whatsNext, whatsDone, architecture, decisions, evidence[], activityStatus, oneLinerSummary |
| `user#<github-id>` | `ANALYSIS#<projectId>#latest` | architecture, patterns, techStack, libraries, directoryMap, projectState, decisions |
| `user#<github-id>` | `ALERT#<projectId>#<date>` | alertType, sentAt |

### Access Patterns

| Pattern | Query |
|---|---|
| Get user profile | PK = `user#X`, SK = `PROFILE` |
| List user's projects | PK = `user#X`, SK `begins_with` `PROJECT#` |
| Get a specific project | PK = `user#X`, SK = `PROJECT#<projectId>` |
| List checkpoints for a project | PK = `user#X`, SK `begins_with` `CHECKPOINT#<projectId>#` |
| Get latest checkpoint | PK = `user#X`, SK `begins_with` `CHECKPOINT#<projectId>#`, ScanIndexForward=false, Limit=1 |
| List context snapshots | PK = `user#X`, SK `begins_with` `CONTEXT#<projectId>#` |
| Get latest context | PK = `user#X`, SK `begins_with` `CONTEXT#<projectId>#`, ScanIndexForward=false, Limit=1 |
| Get latest analysis | PK = `user#X`, SK = `ANALYSIS#<projectId>#latest` |
| Check if alert was sent | PK = `user#X`, SK = `ALERT#<projectId>#<date>` |
| Resolve project by repo name | GSI1: PK = `repoFullName`, SK = `userId` → returns projectId |

**GSI1:** `repoFullName` as partition key — enables looking up a project by repository name (used by MCP server to resolve local repo to cloud project).

---

## Non-Functional Requirements

- **Latency:** Onboarding pipeline completes in under 60 seconds for repos with <500 files. `gitback_remember` completes in under 5 seconds (local state collection + async cloud sync). `gitback_resume` completes in under 15 seconds (includes Bedrock synthesis).
- **Security:** No plaintext GitHub tokens in DynamoDB; all tokens in Secrets Manager. JWT signed with a secret in Secrets Manager. API keys for MCP/CLI auth hashed before storage.
- **Privacy:** GitBack stores checkpoint metadata, file paths, diff summaries, and developer notes. It does NOT store full file contents from local repositories in the cloud. Diffs stored are summaries, not complete diffs.
- **Cost:** Stays within AWS Free Tier + credits for hackathon usage. Bedrock calls are the primary cost driver — minimize by using deterministic logic where possible and caching context snapshots.
- **Availability:** Serverless architecture — no servers to manage. DynamoDB on-demand — no capacity planning. MCP server runs locally — no cloud dependency for checkpoint creation (cloud sync can be async).

---

## 4-Day Implementation Plan

### Day 1: Local Core + MCP Server + Basic Cloud

**Morning:**
- Initialize repo, project structure (monorepo: `packages/core`, `packages/mcp`, `packages/cli`, `infra/`, `frontend/`)
- Implement GitBack Core library:
  - `git.ts`: execute git commands (status, diff, log, branch, remote)
  - `checkpoint.ts`: create checkpoint objects from note + observed state
  - `evidence.ts`: gather and classify evidence
  - `todos.ts`: scan files for TODO/FIXME

**Afternoon:**
- Implement MCP server:
  - `gitback_remember`: collect local state + save checkpoint
  - `gitback_resume`: local-only version (retrieve checkpoint, collect current state, return raw comparison without Bedrock synthesis)
- Set up AWS backend (SAM template):
  - DynamoDB table
  - API Gateway + basic Lambda endpoints
  - Checkpoint storage endpoints (POST + GET)
- Wire MCP server to cloud API for checkpoint persistence

**Milestone:** Developer can save a checkpoint with `gitback_remember` and retrieve it with `gitback_resume` from a local repo. Checkpoints persist to DynamoDB.

### Day 2: GitHub + Bedrock + Full Context

**Morning:**
- Implement GitHub OAuth flow (Lambda + Secrets Manager + JWT)
- Implement GitHub integration:
  - List user repos
  - Fetch repo metadata, tree, file contents
- Implement onboarding pipeline (Step Functions: 6 stages)

**Afternoon:**
- Integrate Bedrock for context synthesis:
  - Onboarding analysis prompt (Stage 4 + 5)
  - Resume briefing synthesis prompt (for `gitback_resume`)
- Implement `gitback_compare`
- Implement context history (multiple checkpoints, context snapshots over time)
- Add evidence to synthesized context output

**Milestone:** GitBack can combine explicit memory + local changes + git history + AI synthesis. Full `gitback_resume` works with Bedrock-powered briefing. Onboarding pipeline runs for new projects.

### Day 3: Web Dashboard + Resume View

**Morning:**
- Set up React + Vite + Tailwind frontend scaffold
- Implement GitHub OAuth login flow (frontend)
- Build Dashboard UI:
  - Project cards with activity status, checkpoint info, summary
  - "Add Project" flow (list repos, select, trigger pipeline, poll status)
  - Empty state for new users

**Afternoon:**
- Build Resume View UI (all 7 sections):
  - Where You Left Off
  - What Changed Since Then
  - What's Next
  - What's Done
  - Project Architecture
  - Decisions & Memory
  - Evidence
- Implement "Re-analyze" button
- Deploy frontend to S3 + CloudFront
- Polish MCP tool output formatting

**Milestone:** Full end-to-end workflow works — MCP checkpoints appear in web dashboard, Resume View shows rich context with evidence.

### Day 4: Polish + Demo

**Morning:**
- Implement stale project alerts (EventBridge + Lambda + SNS) — **cut if time is tight**
- Error handling and loading states across frontend
- Edge cases: no checkpoints yet, project with only onboarding analysis, expired sessions

**Afternoon:**
- Build CLI (`gitback remember`, `gitback resume`, `gitback compare`)
- Prepare demo:
  - Seed 2–3 example projects with checkpoint history
  - Test full demo flow end-to-end
- Record 3-minute demo video
- Write hackathon submission

**Milestone:** Submission-ready.

---

## Demo Video Outline (3 minutes)

### 1. The Problem (30s)

"Every developer has abandoned projects. Not because of lack of skill — because of context loss. You come back after two weeks and waste an hour just remembering where you were. And your coding agent? It can see your code, but it doesn't remember what you were trying to do."

### 2. The Solution (15s)

"GitBack is persistent development memory for coding agents. It remembers your journey so you can pick up exactly where you left off."

### 3. Live Demo — Save Context (45s)

- Open a real local project in the terminal with Claude Code
- Show there are uncommitted changes, a feature branch, in-progress work
- Tell Claude: *"GitBack, remember where I am. I'm halfway through Stripe webhook verification. Signature validation is done. Tomorrow I want to tackle idempotency."*
- Show GitBack confirming: checkpoint saved with branch, commit, changed files, and developer note

### 4. Live Demo — Resume Context (60s)

- Simulate returning later (show some new commits or changes have been made)
- Ask Claude: *"GitBack, where was I?"*
- Show the resume briefing:
  - Last checkpoint with developer's exact note
  - What changed since then (new commits, file changes)
  - Recommended next steps
  - Evidence supporting each conclusion
- Show Claude using that context to continue the work seamlessly

### 5. Live Demo — Web Dashboard (15s)

- Open the GitBack web dashboard
- Show 2–3 projects with activity status badges
- Click into one project — show the full Resume View with all 7 sections

### 6. The Architecture (15s)

- Show the architecture diagram
- Call out: MCP server for local context, Bedrock for AI synthesis, DynamoDB for persistent memory, Step Functions for onboarding, 10 AWS services working together

### 7. Closing (15s)

"I didn't have to remember what I was doing. GitBack did."

---

## Open Questions

1. **Bedrock model version:** The current Bedrock model should be confirmed at implementation time. Use the latest available Claude model in Bedrock.
2. **MCP authentication:** The MCP server needs to authenticate with the cloud API. An API key per user (generated on first login, stored locally) is the simplest approach. Alternative: short-lived tokens via OAuth.
3. **Checkpoint size limits:** Large diffs could bloat checkpoints. Consider summarizing diffs over a threshold (e.g., >500 lines) rather than storing them verbatim.
4. **Multi-device:** If a developer uses GitBack from two machines, checkpoints from both should appear in the cloud. The MCP server should handle this gracefully (project identity via git remote URL, not local path).
5. **Rate limiting:** Bedrock calls for `gitback_resume` should be rate-limited to prevent abuse and cost overruns. Consider caching context snapshots and only re-synthesizing if the checkpoint or git state has changed.

# GitBack MVP — 12-Hour Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a demoable GitBack MVP — a persistent development-memory layer for coding agents exposed via MCP, backed by AWS (DynamoDB + Bedrock), with a web dashboard.

**Architecture:** Local MCP server (TypeScript, runs via `npx`) collects git state and developer intent, persists checkpoints to DynamoDB directly via AWS SDK, and calls Bedrock for AI-powered resume briefings. A React + Vite web dashboard reads from the same DynamoDB table via API Gateway + Lambda. Each phase produces an independently demoable product.

**Tech Stack:** TypeScript, Node.js, `@modelcontextprotocol/sdk`, AWS SDK v3, DynamoDB, Bedrock (Claude), SAM, React, Vite, Tailwind CSS

**Spec:** `PRD.md`

## Global Constraints

- Node.js >= 18
- TypeScript strict mode everywhere
- AWS SDK v3 (modular imports: `@aws-sdk/client-dynamodb`, `@aws-sdk/client-bedrock-runtime`)
- MCP SDK: `@modelcontextprotocol/sdk`
- No test framework required for Phase 1 (manual testing via Claude Code) — unit tests are stretch
- All git operations via child_process `execSync`/`execFile` — no git library dependency
- Bedrock model: use `anthropic.claude-sonnet-4-20250514` (latest available in Bedrock; update if newer at deploy time)
- DynamoDB table name: `GitBackTable`
- AWS region: `us-east-1` (configurable via env)
- No secrets in code — all config via environment variables

## Phasing Strategy

```
Phase 1 ─── MCP + Local ────────────── DEMOABLE: save/retrieve context via Claude Code
  │
Phase 2 ─── Cloud + AI ─────────────── DEMOABLE: AI-powered briefings, cloud persistence
  │
Phase 3 ─── Web Dashboard ──────────── DEMOABLE: full product with web UI
  │
Phase 4 ─── Demo + Submission ───────── DEMOABLE: polished submission
```

If time runs out at ANY phase boundary, you have a working demo.

## File Structure

```
gitback/
├── packages/
│   ├── core/                          # Shared library (git, checkpoints, evidence)
│   │   ├── src/
│   │   │   ├── index.ts               # Public API barrel export
│   │   │   ├── types.ts               # All shared types
│   │   │   ├── git.ts                 # Git command execution
│   │   │   ├── checkpoint.ts          # Checkpoint creation
│   │   │   ├── evidence.ts            # Evidence gathering + classification
│   │   │   ├── todos.ts               # TODO/FIXME scanning
│   │   │   ├── project.ts             # Project identity resolution
│   │   │   ├── storage-local.ts       # Local JSON file storage (~/.gitback/)
│   │   │   ├── storage-cloud.ts       # DynamoDB storage (Phase 2)
│   │   │   └── bedrock.ts             # Bedrock synthesis (Phase 2)
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── mcp/                           # MCP server
│       ├── src/
│       │   ├── index.ts               # Server entry point
│       │   └── tools/
│       │       ├── remember.ts        # gitback_remember tool
│       │       ├── resume.ts          # gitback_resume tool
│       │       ├── compare.ts         # gitback_compare tool (Phase 2)
│       │       └── status.ts          # gitback_status tool (Phase 2)
│       ├── package.json
│       └── tsconfig.json
├── infra/                             # AWS SAM
│   ├── template.yaml                  # SAM template
│   └── src/
│       ├── shared/
│       │   ├── dynamo.ts              # DynamoDB helpers
│       │   └── auth.ts                # JWT/API-key validation
│       ├── projects/
│       │   ├── list.ts                # GET /projects
│       │   └── get.ts                 # GET /projects/:projectId
│       └── checkpoints/
│           └── list.ts                # GET /projects/:projectId/checkpoints
├── frontend/                          # React dashboard (Phase 3)
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── api/
│   │   │   └── client.ts             # API client
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   └── ResumeView.tsx
│   │   └── components/
│   │       ├── ProjectCard.tsx
│   │       ├── EvidenceList.tsx
│   │       └── SectionCard.tsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.ts
├── package.json                       # Workspace root
├── tsconfig.base.json
└── PRD.md
```

---

# PHASE 1: MCP Server + Local Storage (~3 hours)

**Demo after this phase:** Open Claude Code in any repo → "GitBack, remember where I am" → save checkpoint → close session → reopen → "GitBack, where was I?" → get structured context back. All local, no cloud, no AI.

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json` (workspace root)
- Create: `tsconfig.base.json`
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/mcp/package.json`
- Create: `packages/mcp/tsconfig.json`
- Create: `.gitignore`

**Interfaces:**
- Consumes: nothing
- Produces: working `npm install`, `npm run build` from root

- [ ] **Step 1: Initialize git and create workspace root**

```bash
cd C:\Users\harid\Desktop\projects\gitback
git init
```

Create `package.json`:
```json
{
  "name": "gitback",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "build": "npm run build --workspaces",
    "build:core": "npm run build -w packages/core",
    "build:mcp": "npm run build -w packages/mcp"
  }
}
```

Create `tsconfig.base.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "declaration": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src"
  }
}
```

Create `.gitignore`:
```
node_modules/
dist/
.env
*.js.map
.DS_Store
```

- [ ] **Step 2: Create core package**

Create `packages/core/package.json`:
```json
{
  "name": "@gitback/core",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc"
  },
  "dependencies": {
    "uuid": "^11.1.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/uuid": "^10.0.0",
    "typescript": "^5.7.0"
  }
}
```

Create `packages/core/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create MCP package**

Create `packages/mcp/package.json`:
```json
{
  "name": "@gitback/mcp",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "gitback-mcp": "dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@gitback/core": "*",
    "@modelcontextprotocol/sdk": "^1.12.1"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.7.0"
  }
}
```

Create `packages/mcp/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Install dependencies and verify build**

```bash
npm install
```

Create placeholder `packages/core/src/index.ts`:
```typescript
export const VERSION = "0.1.0";
```

Create placeholder `packages/mcp/src/index.ts`:
```typescript
#!/usr/bin/env node
console.log("GitBack MCP server starting...");
```

```bash
npm run build
```

Expected: both packages compile without errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: initialize monorepo with core and mcp packages"
```

---

### Task 2: Core Types

**Files:**
- Create: `packages/core/src/types.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `Checkpoint`, `Evidence`, `EvidenceType`, `GitState`, `ProjectIdentity`, `CheckpointSummary`, `ResumeContext` types used by all subsequent tasks

- [ ] **Step 1: Write all shared types**

Create `packages/core/src/types.ts`:
```typescript
export type EvidenceType =
  | "CHECKPOINT"
  | "COMMIT"
  | "DIFF"
  | "FILE"
  | "TODO"
  | "BRANCH";

export interface Evidence {
  type: EvidenceType;
  source: string;
  detail: string;
}

export interface FileChange {
  path: string;
  status: "modified" | "added" | "deleted" | "renamed" | "untracked";
}

export interface GitState {
  branch: string;
  commitSha: string;
  commitMessage: string;
  modifiedFiles: FileChange[];
  stagedFiles: FileChange[];
  untrackedFiles: string[];
  recentCommits: CommitInfo[];
}

export interface CommitInfo {
  sha: string;
  message: string;
  date: string;
  filesChanged: string[];
}

export interface TodoItem {
  file: string;
  line: number;
  text: string;
  type: "TODO" | "FIXME" | "HACK" | "XXX";
}

export interface ProjectIdentity {
  projectId: string;
  repoFullName: string;
  remoteUrl: string;
  localPath: string;
}

export interface Checkpoint {
  checkpointId: string;
  projectId: string;
  timestamp: string;
  explicitNote: string;
  tags: string[];
  branch: string;
  commitSha: string;
  commitMessage: string;
  gitStatus: {
    modified: FileChange[];
    staged: FileChange[];
    untracked: string[];
  };
  changedFiles: FileChange[];
  recentCommits: CommitInfo[];
  todos: TodoItem[];
  diffSummary: string;
}

export interface CheckpointSummary {
  checkpointId: string;
  timestamp: string;
  note: string;
  branch: string;
  commitSha: string;
  fileCount: number;
}

export interface ResumeContext {
  lastCheckpoint: Checkpoint | null;
  currentState: GitState;
  changesSinceCheckpoint: {
    newCommits: CommitInfo[];
    filesChanged: FileChange[];
    diffSummary: string;
  };
  evidence: Evidence[];
  briefing: string | null;
}

export type ActivityStatus = "Active" | "Stalling" | "Dormant";

export interface ProjectRecord {
  projectId: string;
  repoFullName: string;
  remoteUrl: string;
  activityStatus: ActivityStatus;
  summary: string;
  lastCheckpointAt: string | null;
  lastCommitDate: string | null;
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npm run build:core
```

Expected: compiles with no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/types.ts
git commit -m "feat: add core type definitions"
```

---

### Task 3: Git State Collection

**Files:**
- Create: `packages/core/src/git.ts`

**Interfaces:**
- Consumes: `GitState`, `FileChange`, `CommitInfo` from `types.ts`
- Produces: `getGitState(cwd?: string): GitState`, `getGitRemoteUrl(cwd?: string): string`, `getGitDiffSummary(sinceSha?: string, cwd?: string): string`, `isGitRepo(cwd?: string): boolean`

- [ ] **Step 1: Implement git module**

Create `packages/core/src/git.ts`:
```typescript
import { execSync } from "node:child_process";
import type { GitState, FileChange, CommitInfo } from "./types.js";

function git(args: string, cwd?: string): string {
  try {
    return execSync(`git ${args}`, {
      cwd: cwd ?? process.cwd(),
      encoding: "utf-8",
      timeout: 10000,
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch {
    return "";
  }
}

export function isGitRepo(cwd?: string): boolean {
  return git("rev-parse --is-inside-work-tree", cwd) === "true";
}

export function getGitRemoteUrl(cwd?: string): string {
  return git("remote get-url origin", cwd);
}

export function getGitBranch(cwd?: string): string {
  return git("rev-parse --abbrev-ref HEAD", cwd) || "unknown";
}

export function getGitCommitSha(cwd?: string): string {
  return git("rev-parse HEAD", cwd) || "unknown";
}

export function getGitCommitMessage(cwd?: string): string {
  return git("log -1 --pretty=%s", cwd) || "";
}

function parseFileChanges(output: string, status: FileChange["status"]): FileChange[] {
  if (!output) return [];
  return output
    .split("\n")
    .filter(Boolean)
    .map((path) => ({ path: path.trim(), status }));
}

function getModifiedFiles(cwd?: string): FileChange[] {
  const output = git("diff --name-only", cwd);
  return parseFileChanges(output, "modified");
}

function getStagedFiles(cwd?: string): FileChange[] {
  const output = git("diff --cached --name-only", cwd);
  return parseFileChanges(output, "added");
}

function getUntrackedFiles(cwd?: string): string[] {
  const output = git("ls-files --others --exclude-standard", cwd);
  if (!output) return [];
  return output.split("\n").filter(Boolean);
}

export function getRecentCommits(count: number = 10, cwd?: string): CommitInfo[] {
  const SEP = "---GITBACK-SEP---";
  const format = `%H${SEP}%s${SEP}%aI`;
  const output = git(`log -${count} --pretty=format:"${format}"`, cwd);
  if (!output) return [];

  return output
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const clean = line.replace(/^"|"$/g, "");
      const [sha, message, date] = clean.split(SEP);
      const filesOutput = git(`diff-tree --no-commit-id --name-only -r ${sha}`, cwd);
      const filesChanged = filesOutput ? filesOutput.split("\n").filter(Boolean) : [];
      return { sha, message, date, filesChanged };
    });
}

export function getGitDiffSummary(sinceSha?: string, cwd?: string): string {
  if (sinceSha) {
    const stat = git(`diff --stat ${sinceSha}..HEAD`, cwd);
    const summary = git(`diff --shortstat ${sinceSha}..HEAD`, cwd);
    return stat ? `${stat}\n${summary}` : "No changes.";
  }
  const stat = git("diff --stat", cwd);
  const staged = git("diff --cached --stat", cwd);
  const parts: string[] = [];
  if (stat) parts.push(`Unstaged:\n${stat}`);
  if (staged) parts.push(`Staged:\n${staged}`);
  return parts.length > 0 ? parts.join("\n\n") : "No uncommitted changes.";
}

export function getGitState(cwd?: string): GitState {
  return {
    branch: getGitBranch(cwd),
    commitSha: getGitCommitSha(cwd),
    commitMessage: getGitCommitMessage(cwd),
    modifiedFiles: getModifiedFiles(cwd),
    stagedFiles: getStagedFiles(cwd),
    untrackedFiles: getUntrackedFiles(cwd),
    recentCommits: getRecentCommits(10, cwd),
  };
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npm run build:core
```

- [ ] **Step 3: Manual test in a git repo**

```bash
node -e "
import { getGitState, isGitRepo } from './packages/core/dist/git.js';
console.log('Is git repo:', isGitRepo());
console.log(JSON.stringify(getGitState(), null, 2));
"
```

Expected: prints branch, commit SHA, file lists.

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/git.ts
git commit -m "feat: add git state collection module"
```

---

### Task 4: TODO Scanner

**Files:**
- Create: `packages/core/src/todos.ts`

**Interfaces:**
- Consumes: `TodoItem` from `types.ts`
- Produces: `scanTodos(files: string[], cwd?: string): TodoItem[]`

- [ ] **Step 1: Implement TODO scanner**

Create `packages/core/src/todos.ts`:
```typescript
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { TodoItem } from "./types.js";

const TODO_PATTERN = /\b(TODO|FIXME|HACK|XXX)\b[:\s]*(.*)/i;

export function scanTodos(files: string[], cwd?: string): TodoItem[] {
  const basePath = cwd ?? process.cwd();
  const todos: TodoItem[] = [];

  for (const file of files) {
    try {
      const fullPath = resolve(basePath, file);
      const content = readFileSync(fullPath, "utf-8");
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(TODO_PATTERN);
        if (match) {
          todos.push({
            file,
            line: i + 1,
            text: match[2]?.trim() || match[0],
            type: match[1].toUpperCase() as TodoItem["type"],
          });
        }
      }
    } catch {
      // skip files that can't be read
    }
  }

  return todos;
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npm run build:core
```

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/todos.ts
git commit -m "feat: add TODO/FIXME scanner"
```

---

### Task 5: Project Identity

**Files:**
- Create: `packages/core/src/project.ts`

**Interfaces:**
- Consumes: `ProjectIdentity` from `types.ts`, `getGitRemoteUrl` from `git.ts`
- Produces: `resolveProject(cwd?: string): ProjectIdentity`

- [ ] **Step 1: Implement project resolver**

Create `packages/core/src/project.ts`:
```typescript
import { createHash } from "node:crypto";
import { getGitRemoteUrl } from "./git.js";
import type { ProjectIdentity } from "./types.js";

function remoteUrlToRepoName(url: string): string {
  return url
    .replace(/\.git$/, "")
    .replace(/^.*github\.com[:/]/, "")
    .replace(/^.*gitlab\.com[:/]/, "")
    .replace(/^.*bitbucket\.org[:/]/, "");
}

function generateProjectId(remoteUrl: string): string {
  return createHash("sha256").update(remoteUrl).digest("hex").slice(0, 12);
}

export function resolveProject(cwd?: string): ProjectIdentity {
  const basePath = cwd ?? process.cwd();
  const remoteUrl = getGitRemoteUrl(basePath);

  if (!remoteUrl) {
    const fallbackId = createHash("sha256").update(basePath).digest("hex").slice(0, 12);
    return {
      projectId: fallbackId,
      repoFullName: basePath.split(/[/\\]/).pop() || "unknown",
      remoteUrl: "",
      localPath: basePath,
    };
  }

  return {
    projectId: generateProjectId(remoteUrl),
    repoFullName: remoteUrlToRepoName(remoteUrl),
    remoteUrl,
    localPath: basePath,
  };
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npm run build:core
```

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/project.ts
git commit -m "feat: add project identity resolution"
```

---

### Task 6: Checkpoint Creation + Local Storage

**Files:**
- Create: `packages/core/src/checkpoint.ts`
- Create: `packages/core/src/storage-local.ts`

**Interfaces:**
- Consumes: `Checkpoint`, `CheckpointSummary`, `GitState`, `TodoItem` from `types.ts`; `getGitState`, `getGitDiffSummary` from `git.ts`; `scanTodos` from `todos.ts`; `resolveProject` from `project.ts`
- Produces: `createCheckpoint(note: string, tags?: string[], cwd?: string): Checkpoint`, `saveCheckpointLocal(checkpoint: Checkpoint): void`, `loadLatestCheckpointLocal(projectId: string): Checkpoint | null`, `listCheckpointsLocal(projectId: string): CheckpointSummary[]`

- [ ] **Step 1: Implement checkpoint creation**

Create `packages/core/src/checkpoint.ts`:
```typescript
import { v4 as uuidv4 } from "uuid";
import { getGitState, getGitDiffSummary } from "./git.js";
import { scanTodos } from "./todos.js";
import { resolveProject } from "./project.js";
import type { Checkpoint } from "./types.js";

export function createCheckpoint(
  note: string,
  tags: string[] = [],
  cwd?: string
): Checkpoint {
  const project = resolveProject(cwd);
  const gitState = getGitState(cwd);

  const allChangedFiles = [
    ...gitState.modifiedFiles,
    ...gitState.stagedFiles,
  ];
  const allFilePaths = [
    ...allChangedFiles.map((f) => f.path),
    ...gitState.untrackedFiles,
  ];

  const todos = scanTodos(allFilePaths, cwd);
  const diffSummary = getGitDiffSummary(undefined, cwd);

  return {
    checkpointId: uuidv4(),
    projectId: project.projectId,
    timestamp: new Date().toISOString(),
    explicitNote: note,
    tags,
    branch: gitState.branch,
    commitSha: gitState.commitSha,
    commitMessage: gitState.commitMessage,
    gitStatus: {
      modified: gitState.modifiedFiles,
      staged: gitState.stagedFiles,
      untracked: gitState.untrackedFiles,
    },
    changedFiles: allChangedFiles,
    recentCommits: gitState.recentCommits,
    todos,
    diffSummary,
  };
}
```

- [ ] **Step 2: Implement local file storage**

Create `packages/core/src/storage-local.ts`:
```typescript
import { mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import type { Checkpoint, CheckpointSummary } from "./types.js";

function getStorageDir(projectId: string): string {
  const dir = join(homedir(), ".gitback", "projects", projectId, "checkpoints");
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function saveCheckpointLocal(checkpoint: Checkpoint): void {
  const dir = getStorageDir(checkpoint.projectId);
  const filename = `${checkpoint.timestamp.replace(/[:.]/g, "-")}_${checkpoint.checkpointId}.json`;
  writeFileSync(join(dir, filename), JSON.stringify(checkpoint, null, 2), "utf-8");
}

export function loadLatestCheckpointLocal(projectId: string): Checkpoint | null {
  const dir = getStorageDir(projectId);
  if (!existsSync(dir)) return null;

  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .reverse();

  if (files.length === 0) return null;

  const content = readFileSync(join(dir, files[0]), "utf-8");
  return JSON.parse(content) as Checkpoint;
}

export function listCheckpointsLocal(projectId: string): CheckpointSummary[] {
  const dir = getStorageDir(projectId);
  if (!existsSync(dir)) return [];

  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .reverse();

  return files.map((f) => {
    const content = readFileSync(join(dir, f), "utf-8");
    const cp = JSON.parse(content) as Checkpoint;
    return {
      checkpointId: cp.checkpointId,
      timestamp: cp.timestamp,
      note: cp.explicitNote,
      branch: cp.branch,
      commitSha: cp.commitSha,
      fileCount: cp.changedFiles.length + cp.gitStatus.untracked.length,
    };
  });
}
```

- [ ] **Step 3: Verify it compiles**

```bash
npm run build:core
```

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/checkpoint.ts packages/core/src/storage-local.ts
git commit -m "feat: add checkpoint creation and local file storage"
```

---

### Task 7: Evidence Gathering

**Files:**
- Create: `packages/core/src/evidence.ts`

**Interfaces:**
- Consumes: `Evidence`, `Checkpoint`, `GitState`, `CommitInfo` from `types.ts`
- Produces: `gatherEvidence(checkpoint: Checkpoint | null, currentState: GitState, commitsSince: CommitInfo[]): Evidence[]`

- [ ] **Step 1: Implement evidence module**

Create `packages/core/src/evidence.ts`:
```typescript
import type { Evidence, Checkpoint, GitState, CommitInfo } from "./types.js";

export function gatherEvidence(
  checkpoint: Checkpoint | null,
  currentState: GitState,
  commitsSince: CommitInfo[]
): Evidence[] {
  const evidence: Evidence[] = [];

  if (checkpoint) {
    evidence.push({
      type: "CHECKPOINT",
      source: `Checkpoint from ${checkpoint.timestamp}`,
      detail: checkpoint.explicitNote,
    });

    for (const todo of checkpoint.todos) {
      evidence.push({
        type: "TODO",
        source: `${todo.file}:${todo.line}`,
        detail: `${todo.type}: ${todo.text}`,
      });
    }
  }

  evidence.push({
    type: "BRANCH",
    source: "Current branch",
    detail: currentState.branch,
  });

  for (const commit of commitsSince.slice(0, 5)) {
    evidence.push({
      type: "COMMIT",
      source: commit.sha.slice(0, 7),
      detail: commit.message,
    });
  }

  for (const file of currentState.modifiedFiles) {
    evidence.push({
      type: "DIFF",
      source: file.path,
      detail: `${file.status} (uncommitted)`,
    });
  }

  for (const file of currentState.stagedFiles) {
    evidence.push({
      type: "DIFF",
      source: file.path,
      detail: `${file.status} (staged)`,
    });
  }

  return evidence;
}
```

- [ ] **Step 2: Verify and commit**

```bash
npm run build:core
git add packages/core/src/evidence.ts
git commit -m "feat: add evidence gathering module"
```

---

### Task 8: Core Barrel Export

**Files:**
- Modify: `packages/core/src/index.ts`

**Interfaces:**
- Consumes: all core modules
- Produces: single import path `@gitback/core`

- [ ] **Step 1: Write barrel export**

Replace `packages/core/src/index.ts`:
```typescript
export * from "./types.js";
export * from "./git.js";
export * from "./checkpoint.js";
export * from "./evidence.js";
export * from "./todos.js";
export * from "./project.js";
export * from "./storage-local.js";
```

- [ ] **Step 2: Verify and commit**

```bash
npm run build:core
git add packages/core/src/index.ts
git commit -m "feat: add core barrel export"
```

---

### Task 9: MCP Server — `gitback_remember`

**Files:**
- Create: `packages/mcp/src/tools/remember.ts`
- Modify: `packages/mcp/src/index.ts`

**Interfaces:**
- Consumes: `createCheckpoint` from `@gitback/core`, `saveCheckpointLocal` from `@gitback/core`
- Produces: MCP tool `gitback_remember` with input `{ note: string, tags?: string[] }`

- [ ] **Step 1: Implement the remember tool**

Create `packages/mcp/src/tools/remember.ts`:
```typescript
import {
  createCheckpoint,
  saveCheckpointLocal,
  resolveProject,
  isGitRepo,
} from "@gitback/core";

export const rememberToolDefinition = {
  name: "gitback_remember",
  description:
    "Save a development checkpoint. Records your current work context: what you're doing, your intent, decisions, and next steps. Combines your note with the current git state (branch, commit, changed files, diffs, TODOs).",
  inputSchema: {
    type: "object" as const,
    properties: {
      note: {
        type: "string",
        description:
          "Describe what you're working on, what's done, what's not, and what you plan to do next. Be specific — this is what GitBack will remind you of later.",
      },
      tags: {
        type: "array",
        items: { type: "string" },
        description: "Optional tags for categorization (e.g., 'auth', 'refactor', 'bugfix')",
      },
    },
    required: ["note"],
  },
};

export async function handleRemember(args: {
  note: string;
  tags?: string[];
}): Promise<string> {
  if (!isGitRepo()) {
    return "Error: Not inside a git repository. GitBack needs a git repo to track your context.";
  }

  const project = resolveProject();
  const checkpoint = createCheckpoint(args.note, args.tags ?? []);
  saveCheckpointLocal(checkpoint);

  const fileCount =
    checkpoint.gitStatus.modified.length +
    checkpoint.gitStatus.staged.length +
    checkpoint.gitStatus.untracked.length;

  const todoCount = checkpoint.todos.length;

  return [
    `Checkpoint saved for **${project.repoFullName}**`,
    "",
    `- **ID:** ${checkpoint.checkpointId.slice(0, 8)}`,
    `- **Branch:** ${checkpoint.branch}`,
    `- **Commit:** ${checkpoint.commitSha.slice(0, 7)} — ${checkpoint.commitMessage}`,
    `- **Changed files:** ${fileCount}`,
    `- **TODOs detected:** ${todoCount}`,
    `- **Your note:** "${args.note}"`,
    "",
    `Context captured at ${new Date(checkpoint.timestamp).toLocaleString()}.`,
    `You can resume later with gitback_resume.`,
  ].join("\n");
}
```

- [ ] **Step 2: Implement MCP server entry point**

Replace `packages/mcp/src/index.ts`:
```typescript
#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { rememberToolDefinition, handleRemember } from "./tools/remember.js";
import { z } from "zod";

const server = new McpServer({
  name: "gitback",
  version: "0.1.0",
});

server.tool(
  rememberToolDefinition.name,
  rememberToolDefinition.description,
  {
    note: z.string().describe(
      "Describe what you're working on, what's done, what's not, and what you plan to do next."
    ),
    tags: z.array(z.string()).optional().describe(
      "Optional tags for categorization"
    ),
  },
  async ({ note, tags }) => {
    const result = await handleRemember({ note, tags });
    return { content: [{ type: "text", text: result }] };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("GitBack MCP server failed to start:", err);
  process.exit(1);
});
```

- [ ] **Step 3: Add zod dependency**

```bash
cd packages/mcp
npm install zod
cd ../..
```

- [ ] **Step 4: Build and verify**

```bash
npm run build
```

Expected: both packages compile. The MCP server binary exists at `packages/mcp/dist/index.js`.

- [ ] **Step 5: Commit**

```bash
git add packages/mcp/
git commit -m "feat: add MCP server with gitback_remember tool"
```

---

### Task 10: MCP Server — `gitback_resume`

**Files:**
- Create: `packages/mcp/src/tools/resume.ts`
- Modify: `packages/mcp/src/index.ts`

**Interfaces:**
- Consumes: `loadLatestCheckpointLocal`, `resolveProject`, `getGitState`, `getRecentCommits`, `gatherEvidence`, `getGitDiffSummary` from `@gitback/core`
- Produces: MCP tool `gitback_resume` with input `{ detail?: "brief" | "full" }`

- [ ] **Step 1: Implement the resume tool**

Create `packages/mcp/src/tools/resume.ts`:
```typescript
import {
  loadLatestCheckpointLocal,
  resolveProject,
  getGitState,
  getRecentCommits,
  gatherEvidence,
  getGitDiffSummary,
  isGitRepo,
} from "@gitback/core";
import type { CommitInfo, Evidence } from "@gitback/core";

function formatTimeSince(isoDate: string): string {
  const ms = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function commitsSinceCheckpoint(
  recentCommits: CommitInfo[],
  checkpointSha: string
): CommitInfo[] {
  const idx = recentCommits.findIndex((c) => c.sha === checkpointSha);
  if (idx === -1) return recentCommits;
  return recentCommits.slice(0, idx);
}

function formatEvidence(evidence: Evidence[]): string {
  if (evidence.length === 0) return "No evidence collected.";
  return evidence
    .map((e) => `- **${e.type}** (${e.source}): ${e.detail}`)
    .join("\n");
}

export const resumeToolDefinition = {
  name: "gitback_resume",
  description:
    "Reconstruct where you left off. Combines your last saved checkpoint with the current git state to show what you were doing, what changed since then, and what to do next.",
  inputSchema: {
    type: "object" as const,
    properties: {
      detail: {
        type: "string",
        enum: ["brief", "full"],
        description: "Level of detail: 'brief' (default) or 'full'",
      },
    },
  },
};

export async function handleResume(args: {
  detail?: string;
}): Promise<string> {
  if (!isGitRepo()) {
    return "Error: Not inside a git repository.";
  }

  const project = resolveProject();
  const checkpoint = loadLatestCheckpointLocal(project.projectId);
  const currentState = getGitState();

  if (!checkpoint) {
    const fileCount =
      currentState.modifiedFiles.length +
      currentState.stagedFiles.length +
      currentState.untrackedFiles.length;

    return [
      `**No checkpoint found** for ${project.repoFullName}.`,
      "",
      `Current state:`,
      `- Branch: ${currentState.branch}`,
      `- Last commit: ${currentState.commitSha.slice(0, 7)} — ${currentState.commitMessage}`,
      `- Uncommitted changes: ${fileCount} files`,
      "",
      `Use **gitback_remember** to save your first checkpoint.`,
    ].join("\n");
  }

  const newCommits = commitsSinceCheckpoint(
    currentState.recentCommits,
    checkpoint.commitSha
  );
  const diffSummary = getGitDiffSummary(checkpoint.commitSha);
  const evidence = gatherEvidence(checkpoint, currentState, newCommits);

  const sections: string[] = [];

  // Section 1: Where You Left Off
  sections.push(
    `## Where You Left Off`,
    "",
    `**Last checkpoint** — ${formatTimeSince(checkpoint.timestamp)} (${new Date(checkpoint.timestamp).toLocaleString()})`,
    "",
    `> ${checkpoint.explicitNote}`,
    "",
    `- **Branch:** ${checkpoint.branch}`,
    `- **Commit at checkpoint:** ${checkpoint.commitSha.slice(0, 7)} — ${checkpoint.commitMessage}`,
  );

  if (checkpoint.tags.length > 0) {
    sections.push(`- **Tags:** ${checkpoint.tags.join(", ")}`);
  }

  // Section 2: What Changed Since Then
  sections.push("", `## What Changed Since Then`, "");

  if (newCommits.length > 0) {
    sections.push(`**${newCommits.length} new commit${newCommits.length > 1 ? "s" : ""}:**`);
    for (const c of newCommits) {
      sections.push(`- \`${c.sha.slice(0, 7)}\` ${c.message}`);
    }
  } else {
    sections.push("No new commits since checkpoint.");
  }

  const currentFileCount =
    currentState.modifiedFiles.length +
    currentState.stagedFiles.length +
    currentState.untrackedFiles.length;

  if (currentFileCount > 0) {
    sections.push("", `**Current uncommitted changes:** ${currentFileCount} files`);
    for (const f of currentState.modifiedFiles) {
      sections.push(`- Modified: \`${f.path}\``);
    }
    for (const f of currentState.stagedFiles) {
      sections.push(`- Staged: \`${f.path}\``);
    }
    for (const f of currentState.untrackedFiles.slice(0, 10)) {
      sections.push(`- Untracked: \`${f}\``);
    }
  } else {
    sections.push("", "No uncommitted changes.");
  }

  if (args.detail === "full") {
    sections.push("", "**Diff summary:**", "```", diffSummary, "```");
  }

  // Section 3: TODOs at checkpoint
  if (checkpoint.todos.length > 0) {
    sections.push("", `## TODOs From Last Session`, "");
    for (const todo of checkpoint.todos) {
      sections.push(`- **${todo.type}** in \`${todo.file}:${todo.line}\`: ${todo.text}`);
    }
  }

  // Section 4: Evidence
  sections.push("", `## Evidence`, "", formatEvidence(evidence));

  return sections.join("\n");
}
```

- [ ] **Step 2: Register resume tool in server**

Add to `packages/mcp/src/index.ts` — add the import at the top:
```typescript
import { resumeToolDefinition, handleResume } from "./tools/resume.js";
```

Add after the `gitback_remember` registration:
```typescript
server.tool(
  resumeToolDefinition.name,
  resumeToolDefinition.description,
  {
    detail: z.enum(["brief", "full"]).optional().describe(
      "Level of detail: 'brief' (default) or 'full'"
    ),
  },
  async ({ detail }) => {
    const result = await handleResume({ detail });
    return { content: [{ type: "text", text: result }] };
  }
);
```

- [ ] **Step 3: Build and verify**

```bash
npm run build
```

- [ ] **Step 4: Test MCP server with Claude Code**

Add to Claude Code's MCP config (`~/.claude/settings.json` or project `.claude/settings.json`):
```json
{
  "mcpServers": {
    "gitback": {
      "command": "node",
      "args": ["C:\\Users\\harid\\Desktop\\projects\\gitback\\packages\\mcp\\dist\\index.js"]
    }
  }
}
```

Open Claude Code in a test repo. Test:
1. "Use gitback_remember — I'm working on the login page, passport.js integration is done, need to add session handling next"
2. "Use gitback_resume to tell me where I left off"

Verify both tools respond correctly.

- [ ] **Step 5: Commit**

```bash
git add packages/mcp/
git commit -m "feat: add gitback_resume tool to MCP server"
```

---

**PHASE 1 COMPLETE.** At this point you have a working MCP server that saves and retrieves developer context. This is demoable on its own.

---

# PHASE 2: Cloud Persistence + Bedrock AI (~2.5 hours)

**Demo after this phase:** Everything from Phase 1, plus: AI-powered resume briefings that synthesize checkpoint + current state into natural language. Checkpoints persist to DynamoDB. `gitback_compare` shows what changed.

---

### Task 11: SAM Template + DynamoDB

**Files:**
- Create: `infra/template.yaml`
- Create: `infra/samconfig.toml`

**Interfaces:**
- Consumes: nothing
- Produces: deployed DynamoDB table `GitBackTable`, outputs table name and ARN

- [ ] **Step 1: Create SAM template with DynamoDB**

Create `infra/template.yaml`:
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: GitBack - Persistent development memory for coding agents

Globals:
  Function:
    Runtime: nodejs20.x
    Timeout: 30
    MemorySize: 256
    Environment:
      Variables:
        TABLE_NAME: !Ref GitBackTable
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1"

Parameters:
  Stage:
    Type: String
    Default: dev

Resources:
  GitBackTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub GitBackTable-${Stage}
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: PK
          AttributeType: S
        - AttributeName: SK
          AttributeType: S
        - AttributeName: GSI1PK
          AttributeType: S
        - AttributeName: GSI1SK
          AttributeType: S
      KeySchema:
        - AttributeName: PK
          KeyType: HASH
        - AttributeName: SK
          KeyType: RANGE
      GlobalSecondaryIndexes:
        - IndexName: GSI1
          KeySchema:
            - AttributeName: GSI1PK
              KeyType: HASH
            - AttributeName: GSI1SK
              KeyType: RANGE
          Projection:
            ProjectionType: ALL

Outputs:
  TableName:
    Value: !Ref GitBackTable
  TableArn:
    Value: !GetAtt GitBackTable.Arn
```

- [ ] **Step 2: Deploy the table**

```bash
cd infra
sam build
sam deploy --stack-name gitback-dev --resolve-s3 --capabilities CAPABILITY_IAM --no-confirm-changeset --parameter-overrides Stage=dev
cd ..
```

Note the table name from outputs (should be `GitBackTable-dev`).

- [ ] **Step 3: Commit**

```bash
git add infra/
git commit -m "infra: add SAM template with DynamoDB table"
```

---

### Task 12: Cloud Storage Module

**Files:**
- Create: `packages/core/src/storage-cloud.ts`
- Modify: `packages/core/src/index.ts`
- Modify: `packages/core/package.json`

**Interfaces:**
- Consumes: `Checkpoint`, `CheckpointSummary`, `ProjectRecord` from `types.ts`
- Produces: `saveCheckpointCloud(userId: string, checkpoint: Checkpoint): Promise<void>`, `loadLatestCheckpointCloud(userId: string, projectId: string): Promise<Checkpoint | null>`, `listCheckpointsCloud(userId: string, projectId: string): Promise<CheckpointSummary[]>`, `saveProjectRecord(userId: string, project: ProjectRecord): Promise<void>`, `listProjectRecords(userId: string): Promise<ProjectRecord[]>`

- [ ] **Step 1: Add AWS SDK dependencies**

```bash
cd packages/core
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
cd ../..
```

- [ ] **Step 2: Implement cloud storage**

Create `packages/core/src/storage-cloud.ts`:
```typescript
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import type { Checkpoint, CheckpointSummary, ProjectRecord } from "./types.js";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
});
const dynamo = DynamoDBDocumentClient.from(client);

function tableName(): string {
  return process.env.GITBACK_TABLE || "GitBackTable-dev";
}

export async function saveCheckpointCloud(
  userId: string,
  checkpoint: Checkpoint
): Promise<void> {
  await dynamo.send(
    new PutCommand({
      TableName: tableName(),
      Item: {
        PK: `user#${userId}`,
        SK: `CHECKPOINT#${checkpoint.projectId}#${checkpoint.timestamp}`,
        GSI1PK: checkpoint.projectId,
        GSI1SK: checkpoint.timestamp,
        ...checkpoint,
      },
    })
  );
}

export async function loadLatestCheckpointCloud(
  userId: string,
  projectId: string
): Promise<Checkpoint | null> {
  const result = await dynamo.send(
    new QueryCommand({
      TableName: tableName(),
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `user#${userId}`,
        ":sk": `CHECKPOINT#${projectId}#`,
      },
      ScanIndexForward: false,
      Limit: 1,
    })
  );

  if (!result.Items || result.Items.length === 0) return null;
  return result.Items[0] as unknown as Checkpoint;
}

export async function listCheckpointsCloud(
  userId: string,
  projectId: string,
  limit: number = 20
): Promise<CheckpointSummary[]> {
  const result = await dynamo.send(
    new QueryCommand({
      TableName: tableName(),
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `user#${userId}`,
        ":sk": `CHECKPOINT#${projectId}#`,
      },
      ScanIndexForward: false,
      Limit: limit,
      ProjectionExpression:
        "checkpointId, #ts, explicitNote, branch, commitSha, changedFiles, gitStatus",
      ExpressionAttributeNames: {
        "#ts": "timestamp",
      },
    })
  );

  if (!result.Items) return [];
  return result.Items.map((item: Record<string, unknown>) => ({
    checkpointId: item.checkpointId as string,
    timestamp: item.timestamp as string,
    note: item.explicitNote as string,
    branch: item.branch as string,
    commitSha: item.commitSha as string,
    fileCount:
      ((item.changedFiles as unknown[]) || []).length +
      (((item.gitStatus as Record<string, unknown>)?.untracked as unknown[]) || []).length,
  }));
}

export async function saveProjectRecord(
  userId: string,
  project: ProjectRecord
): Promise<void> {
  await dynamo.send(
    new PutCommand({
      TableName: tableName(),
      Item: {
        PK: `user#${userId}`,
        SK: `PROJECT#${project.projectId}`,
        GSI1PK: project.repoFullName,
        GSI1SK: `user#${userId}`,
        ...project,
      },
    })
  );
}

export async function listProjectRecords(
  userId: string
): Promise<ProjectRecord[]> {
  const result = await dynamo.send(
    new QueryCommand({
      TableName: tableName(),
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `user#${userId}`,
        ":sk": "PROJECT#",
      },
    })
  );

  if (!result.Items) return [];
  return result.Items as unknown as ProjectRecord[];
}
```

- [ ] **Step 3: Add to barrel export**

Add to `packages/core/src/index.ts`:
```typescript
export * from "./storage-cloud.js";
```

- [ ] **Step 4: Build and verify**

```bash
npm run build:core
```

- [ ] **Step 5: Commit**

```bash
git add packages/core/
git commit -m "feat: add DynamoDB cloud storage module"
```

---

### Task 13: Bedrock Context Synthesis

**Files:**
- Create: `packages/core/src/bedrock.ts`
- Modify: `packages/core/src/index.ts`
- Modify: `packages/core/package.json`

**Interfaces:**
- Consumes: `Checkpoint`, `GitState`, `Evidence`, `CommitInfo` from `types.ts`
- Produces: `synthesizeResumeBriefing(params: SynthesisInput): Promise<string>`

- [ ] **Step 1: Add Bedrock dependency**

```bash
cd packages/core
npm install @aws-sdk/client-bedrock-runtime
cd ../..
```

- [ ] **Step 2: Implement Bedrock synthesis**

Create `packages/core/src/bedrock.ts`:
```typescript
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import type { Checkpoint, GitState, Evidence, CommitInfo } from "./types.js";

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
});

const MODEL_ID =
  process.env.BEDROCK_MODEL_ID || "anthropic.claude-sonnet-4-20250514-v1:0";

export interface SynthesisInput {
  checkpoint: Checkpoint | null;
  currentState: GitState;
  commitsSinceCheckpoint: CommitInfo[];
  evidence: Evidence[];
  projectName: string;
}

export async function synthesizeResumeBriefing(
  input: SynthesisInput
): Promise<string> {
  const prompt = buildPrompt(input);

  const body = JSON.stringify({
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  const response = await client.send(
    new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: "application/json",
      accept: "application/json",
      body,
    })
  );

  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  return responseBody.content[0].text;
}

function buildPrompt(input: SynthesisInput): string {
  const { checkpoint, currentState, commitsSinceCheckpoint, evidence, projectName } = input;

  const sections: string[] = [
    `You are GitBack, a development memory assistant. Generate a concise resume briefing for a developer returning to their project "${projectName}".`,
    "",
    "Your job is to help them pick up where they left off. Be specific, reference file names and line numbers where available. Use second person (\"you\"). Be direct and actionable.",
    "",
    "Format your response in these sections:",
    "## Where You Left Off",
    "(What the developer was working on, from their own words and observed state)",
    "",
    "## What Changed Since Then",
    "(Commits, file changes, new work since the checkpoint)",
    "",
    "## What's Next",
    "(Prioritized, actionable next steps — numbered list)",
    "",
    "## Key Evidence",
    "(Brief citations showing where conclusions came from)",
    "",
    "---",
    "",
    "Here is the context:",
    "",
  ];

  if (checkpoint) {
    sections.push(
      "### Developer's Last Checkpoint",
      `Saved: ${checkpoint.timestamp}`,
      `Note: "${checkpoint.explicitNote}"`,
      `Branch at checkpoint: ${checkpoint.branch}`,
      `Commit at checkpoint: ${checkpoint.commitSha.slice(0, 7)} — ${checkpoint.commitMessage}`,
      `Tags: ${checkpoint.tags.length > 0 ? checkpoint.tags.join(", ") : "none"}`,
      ""
    );

    if (checkpoint.todos.length > 0) {
      sections.push("### TODOs at checkpoint:");
      for (const todo of checkpoint.todos) {
        sections.push(`- ${todo.type} in ${todo.file}:${todo.line}: ${todo.text}`);
      }
      sections.push("");
    }

    if (checkpoint.changedFiles.length > 0) {
      sections.push("### Files changed at checkpoint:");
      for (const f of checkpoint.changedFiles) {
        sections.push(`- ${f.status}: ${f.path}`);
      }
      sections.push("");
    }
  } else {
    sections.push("### No previous checkpoint exists. This is the developer's first resume request.", "");
  }

  sections.push(
    "### Current Repository State",
    `Branch: ${currentState.branch}`,
    `Latest commit: ${currentState.commitSha.slice(0, 7)} — ${currentState.commitMessage}`,
    `Modified files: ${currentState.modifiedFiles.map((f) => f.path).join(", ") || "none"}`,
    `Staged files: ${currentState.stagedFiles.map((f) => f.path).join(", ") || "none"}`,
    `Untracked files: ${currentState.untrackedFiles.slice(0, 10).join(", ") || "none"}`,
    ""
  );

  if (commitsSinceCheckpoint.length > 0) {
    sections.push("### Commits since checkpoint:");
    for (const c of commitsSinceCheckpoint) {
      sections.push(`- ${c.sha.slice(0, 7)} ${c.message} (files: ${c.filesChanged.join(", ")})`);
    }
    sections.push("");
  }

  if (evidence.length > 0) {
    sections.push("### Evidence:");
    for (const e of evidence) {
      sections.push(`- [${e.type}] ${e.source}: ${e.detail}`);
    }
  }

  return sections.join("\n");
}
```

- [ ] **Step 3: Add to barrel export**

Add to `packages/core/src/index.ts`:
```typescript
export * from "./bedrock.js";
```

- [ ] **Step 4: Build and verify**

```bash
npm run build:core
```

- [ ] **Step 5: Commit**

```bash
git add packages/core/
git commit -m "feat: add Bedrock context synthesis module"
```

---

### Task 14: Upgrade MCP Tools for Cloud + AI

**Files:**
- Modify: `packages/mcp/src/tools/remember.ts`
- Modify: `packages/mcp/src/tools/resume.ts`
- Create: `packages/mcp/src/tools/compare.ts`
- Modify: `packages/mcp/src/index.ts`

**Interfaces:**
- Consumes: `saveCheckpointCloud`, `loadLatestCheckpointCloud`, `saveProjectRecord`, `synthesizeResumeBriefing` from `@gitback/core`
- Produces: upgraded `gitback_remember` (cloud sync), upgraded `gitback_resume` (AI briefing), new `gitback_compare` tool

- [ ] **Step 1: Upgrade remember to sync to cloud**

Add to the end of `handleRemember` in `packages/mcp/src/tools/remember.ts`, before the return statement:

```typescript
// Add these imports at the top:
import {
  createCheckpoint,
  saveCheckpointLocal,
  resolveProject,
  isGitRepo,
  saveCheckpointCloud,
  saveProjectRecord,
} from "@gitback/core";
import type { ActivityStatus } from "@gitback/core";
```

Insert before the `return` in `handleRemember`:
```typescript
  // Cloud sync (best-effort, don't block on failure)
  const userId = process.env.GITBACK_USER_ID || "demo-user";
  try {
    await saveCheckpointCloud(userId, checkpoint);
    await saveProjectRecord(userId, {
      projectId: project.projectId,
      repoFullName: project.repoFullName,
      remoteUrl: project.remoteUrl,
      activityStatus: "Active" as ActivityStatus,
      summary: args.note.slice(0, 200),
      lastCheckpointAt: checkpoint.timestamp,
      lastCommitDate: checkpoint.recentCommits[0]?.date || null,
    });
  } catch (err) {
    // Cloud sync failed — local save already succeeded, so continue
  }
```

- [ ] **Step 2: Upgrade resume to use AI briefing**

Rewrite `packages/mcp/src/tools/resume.ts` — replace the `handleResume` function body to try Bedrock first, fall back to the existing structured output:

Add import at top:
```typescript
import {
  loadLatestCheckpointLocal,
  loadLatestCheckpointCloud,
  resolveProject,
  getGitState,
  getRecentCommits,
  gatherEvidence,
  getGitDiffSummary,
  isGitRepo,
  synthesizeResumeBriefing,
} from "@gitback/core";
```

Replace the body of `handleResume` after the "no checkpoint" early return:

```typescript
  // Try cloud first, fall back to local
  const userId = process.env.GITBACK_USER_ID || "demo-user";
  let checkpoint = null;
  try {
    checkpoint = await loadLatestCheckpointCloud(userId, project.projectId);
  } catch {
    // Cloud unavailable
  }
  if (!checkpoint) {
    checkpoint = loadLatestCheckpointLocal(project.projectId);
  }

  if (!checkpoint) {
    // ... existing no-checkpoint response (keep as is)
  }

  const newCommits = commitsSinceCheckpoint(
    currentState.recentCommits,
    checkpoint.commitSha
  );
  const evidence = gatherEvidence(checkpoint, currentState, newCommits);

  // Try AI-powered briefing
  try {
    const briefing = await synthesizeResumeBriefing({
      checkpoint,
      currentState,
      commitsSinceCheckpoint: newCommits,
      evidence,
      projectName: project.repoFullName,
    });
    return briefing;
  } catch {
    // Bedrock unavailable — fall back to structured output
  }

  // ... keep existing structured output as fallback (everything after this is unchanged)
```

The full logic: try Bedrock → if it fails, return the structured text from Phase 1. This means the tool always works, with or without AWS connectivity.

- [ ] **Step 3: Create gitback_compare tool**

Create `packages/mcp/src/tools/compare.ts`:
```typescript
import {
  loadLatestCheckpointLocal,
  loadLatestCheckpointCloud,
  resolveProject,
  getGitState,
  getGitDiffSummary,
  isGitRepo,
} from "@gitback/core";
import type { CommitInfo } from "@gitback/core";

export const compareToolDefinition = {
  name: "gitback_compare",
  description:
    "Compare what changed since the last GitBack checkpoint. Shows new commits, file changes, and diff summary since you last saved context.",
  inputSchema: {
    type: "object" as const,
    properties: {},
  },
};

function commitsSinceCheckpoint(
  recentCommits: CommitInfo[],
  checkpointSha: string
): CommitInfo[] {
  const idx = recentCommits.findIndex((c) => c.sha === checkpointSha);
  if (idx === -1) return recentCommits;
  return recentCommits.slice(0, idx);
}

export async function handleCompare(): Promise<string> {
  if (!isGitRepo()) {
    return "Error: Not inside a git repository.";
  }

  const project = resolveProject();
  const userId = process.env.GITBACK_USER_ID || "demo-user";

  let checkpoint = null;
  try {
    checkpoint = await loadLatestCheckpointCloud(userId, project.projectId);
  } catch {
    // fall through
  }
  if (!checkpoint) {
    checkpoint = loadLatestCheckpointLocal(project.projectId);
  }

  if (!checkpoint) {
    return "No checkpoint found. Use **gitback_remember** first.";
  }

  const currentState = getGitState();
  const newCommits = commitsSinceCheckpoint(
    currentState.recentCommits,
    checkpoint.commitSha
  );
  const diffSummary = getGitDiffSummary(checkpoint.commitSha);

  const sections: string[] = [
    `## Changes since checkpoint (${new Date(checkpoint.timestamp).toLocaleString()})`,
    "",
    `**Checkpoint note:** "${checkpoint.explicitNote}"`,
    `**Checkpoint branch:** ${checkpoint.branch} → **Current branch:** ${currentState.branch}`,
    `**Checkpoint commit:** ${checkpoint.commitSha.slice(0, 7)} → **Current commit:** ${currentState.commitSha.slice(0, 7)}`,
    "",
  ];

  if (newCommits.length > 0) {
    sections.push(`### ${newCommits.length} New Commits`, "");
    for (const c of newCommits) {
      sections.push(`- \`${c.sha.slice(0, 7)}\` ${c.message}`);
      if (c.filesChanged.length > 0) {
        sections.push(`  Files: ${c.filesChanged.join(", ")}`);
      }
    }
  } else {
    sections.push("### No new commits since checkpoint.");
  }

  sections.push("", "### Diff Summary", "", "```", diffSummary, "```");

  const currentFileCount =
    currentState.modifiedFiles.length +
    currentState.stagedFiles.length +
    currentState.untrackedFiles.length;

  if (currentFileCount > 0) {
    sections.push("", "### Current Uncommitted Changes", "");
    for (const f of currentState.modifiedFiles) {
      sections.push(`- Modified: \`${f.path}\``);
    }
    for (const f of currentState.stagedFiles) {
      sections.push(`- Staged: \`${f.path}\``);
    }
    for (const f of currentState.untrackedFiles.slice(0, 10)) {
      sections.push(`- Untracked: \`${f}\``);
    }
  }

  return sections.join("\n");
}
```

- [ ] **Step 4: Register compare tool in server**

Add to `packages/mcp/src/index.ts`:
```typescript
import { compareToolDefinition, handleCompare } from "./tools/compare.js";
```

Add the tool registration:
```typescript
server.tool(
  compareToolDefinition.name,
  compareToolDefinition.description,
  {},
  async () => {
    const result = await handleCompare();
    return { content: [{ type: "text", text: result }] };
  }
);
```

- [ ] **Step 5: Build, test, commit**

```bash
npm run build
```

Test with Claude Code:
1. Save a checkpoint
2. Make a code change in the test repo
3. Ask Claude to use gitback_compare
4. Ask Claude to use gitback_resume — should now get an AI-generated briefing

```bash
git add packages/
git commit -m "feat: add cloud sync, Bedrock AI briefings, and gitback_compare"
```

---

**PHASE 2 COMPLETE.** You now have an AI-powered development memory system with cloud persistence. Demoable via Claude Code with rich, synthesized resume briefings.

---

# PHASE 3: Web Dashboard + Resume View (~3 hours)

**Demo after this phase:** Full web product — dashboard with project cards, full Resume View with all sections, evidence display. Plus the MCP experience from Phases 1–2.

---

### Task 15: API Gateway + Lambda Endpoints

**Files:**
- Modify: `infra/template.yaml`
- Create: `infra/src/shared/dynamo.ts`
- Create: `infra/src/projects/list.ts`
- Create: `infra/src/projects/get.ts`
- Create: `infra/src/checkpoints/list.ts`

**Interfaces:**
- Consumes: DynamoDB table
- Produces: REST endpoints: `GET /projects`, `GET /projects/{projectId}`, `GET /projects/{projectId}/checkpoints`

- [ ] **Step 1: Add API resources to SAM template**

Add to the `Resources` section of `infra/template.yaml`:

```yaml
  GitBackApi:
    Type: AWS::Serverless::Api
    Properties:
      StageName: !Ref Stage
      Cors:
        AllowOrigin: "'*'"
        AllowHeaders: "'Content-Type,Authorization'"
        AllowMethods: "'GET,POST,OPTIONS'"

  ListProjectsFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: projects/list.handler
      CodeUri: src/
      Events:
        Api:
          Type: Api
          Properties:
            RestApiId: !Ref GitBackApi
            Path: /projects
            Method: GET
      Policies:
        - DynamoDBReadPolicy:
            TableName: !Ref GitBackTable

  GetProjectFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: projects/get.handler
      CodeUri: src/
      Events:
        Api:
          Type: Api
          Properties:
            RestApiId: !Ref GitBackApi
            Path: /projects/{projectId}
            Method: GET
      Policies:
        - DynamoDBReadPolicy:
            TableName: !Ref GitBackTable

  ListCheckpointsFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: checkpoints/list.handler
      CodeUri: src/
      Events:
        Api:
          Type: Api
          Properties:
            RestApiId: !Ref GitBackApi
            Path: /projects/{projectId}/checkpoints
            Method: GET
      Policies:
        - DynamoDBReadPolicy:
            TableName: !Ref GitBackTable
```

Add to `Outputs`:
```yaml
  ApiUrl:
    Value: !Sub "https://${GitBackApi}.execute-api.${AWS::Region}.amazonaws.com/${Stage}"
```

**Note:** For the hackathon demo, we skip JWT auth on the API. The Lambda endpoints use a hardcoded `GITBACK_USER_ID` env var. Add auth later if time allows.

Add to each Function's Environment:
```yaml
      Environment:
        Variables:
          GITBACK_USER_ID: demo-user
```

- [ ] **Step 2: Create shared DynamoDB helper**

Create `infra/src/shared/dynamo.ts`:
```typescript
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
export const dynamo = DynamoDBDocumentClient.from(client);
export const TABLE = process.env.TABLE_NAME || "GitBackTable-dev";
export const USER_ID = process.env.GITBACK_USER_ID || "demo-user";

export function response(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
    },
    body: JSON.stringify(body),
  };
}
```

- [ ] **Step 3: Create list projects handler**

Create `infra/src/projects/list.ts`:
```typescript
import { dynamo, TABLE, USER_ID, response } from "../shared/dynamo.js";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";

export async function handler() {
  const result = await dynamo.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `user#${USER_ID}`,
        ":sk": "PROJECT#",
      },
    })
  );

  return response(200, { projects: result.Items || [] });
}
```

- [ ] **Step 4: Create get project handler (fetches project + latest checkpoint + latest context)**

Create `infra/src/projects/get.ts`:
```typescript
import { dynamo, TABLE, USER_ID, response } from "../shared/dynamo.js";
import { QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

export async function handler(event: { pathParameters: { projectId: string } }) {
  const { projectId } = event.pathParameters;

  const [projectResult, checkpointsResult] = await Promise.all([
    dynamo.send(
      new GetCommand({
        TableName: TABLE,
        Key: { PK: `user#${USER_ID}`, SK: `PROJECT#${projectId}` },
      })
    ),
    dynamo.send(
      new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": `user#${USER_ID}`,
          ":sk": `CHECKPOINT#${projectId}#`,
        },
        ScanIndexForward: false,
        Limit: 10,
      })
    ),
  ]);

  if (!projectResult.Item) {
    return response(404, { error: "Project not found" });
  }

  return response(200, {
    project: projectResult.Item,
    checkpoints: checkpointsResult.Items || [],
  });
}
```

- [ ] **Step 5: Create list checkpoints handler**

Create `infra/src/checkpoints/list.ts`:
```typescript
import { dynamo, TABLE, USER_ID, response } from "../shared/dynamo.js";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";

export async function handler(event: { pathParameters: { projectId: string } }) {
  const { projectId } = event.pathParameters;

  const result = await dynamo.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `user#${USER_ID}`,
        ":sk": `CHECKPOINT#${projectId}#`,
      },
      ScanIndexForward: false,
      Limit: 20,
    })
  );

  return response(200, { checkpoints: result.Items || [] });
}
```

- [ ] **Step 6: Create infra package.json and tsconfig for Lambda builds**

Create `infra/src/package.json`:
```json
{
  "name": "gitback-infra",
  "private": true,
  "type": "module",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.600.0",
    "@aws-sdk/lib-dynamodb": "^3.600.0"
  }
}
```

Create `infra/src/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": ".",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["**/*.ts"]
}
```

**Note:** SAM will handle bundling. For simplicity, write Lambda handlers as plain `.js` files or use `esbuild` in the SAM template. If TypeScript compile step causes issues, convert handlers to `.mjs` files directly.

- [ ] **Step 7: Deploy and verify**

```bash
cd infra
sam build
sam deploy --no-confirm-changeset
cd ..
```

Test the API:
```bash
curl https://<api-id>.execute-api.us-east-1.amazonaws.com/dev/projects
```

Expected: `{"projects": [...]}` (will be empty or have the projects you checkpointed in Phase 2).

- [ ] **Step 8: Commit**

```bash
git add infra/
git commit -m "feat: add API Gateway + Lambda endpoints for dashboard"
```

---

### Task 16: React Frontend — Scaffold + Dashboard

**Files:**
- Create: `frontend/` (Vite + React + Tailwind scaffold)
- Create: `frontend/src/api/client.ts`
- Create: `frontend/src/pages/Dashboard.tsx`
- Create: `frontend/src/components/ProjectCard.tsx`

**Interfaces:**
- Consumes: API endpoints from Task 15
- Produces: web dashboard at `http://localhost:5173`

- [ ] **Step 1: Scaffold frontend**

```bash
cd C:\Users\harid\Desktop\projects\gitback
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install -D tailwindcss @tailwindcss/vite
cd ..
```

- [ ] **Step 2: Configure Tailwind**

Replace `frontend/vite.config.ts`:
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

Replace `frontend/src/index.css`:
```css
@import "tailwindcss";
```

- [ ] **Step 3: Create API client**

Create `frontend/src/api/client.ts`:
```typescript
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export interface ProjectRecord {
  projectId: string;
  repoFullName: string;
  activityStatus: "Active" | "Stalling" | "Dormant";
  summary: string;
  lastCheckpointAt: string | null;
  lastCommitDate: string | null;
}

export interface Checkpoint {
  checkpointId: string;
  timestamp: string;
  explicitNote: string;
  branch: string;
  commitSha: string;
  tags: string[];
  changedFiles: { path: string; status: string }[];
  todos: { file: string; line: number; text: string; type: string }[];
  gitStatus: {
    modified: { path: string }[];
    staged: { path: string }[];
    untracked: string[];
  };
  recentCommits: { sha: string; message: string; date: string }[];
  diffSummary: string;
}

export async function listProjects(): Promise<ProjectRecord[]> {
  const data = await fetchApi<{ projects: ProjectRecord[] }>("/projects");
  return data.projects;
}

export async function getProject(projectId: string): Promise<{
  project: ProjectRecord;
  checkpoints: Checkpoint[];
}> {
  return fetchApi(`/projects/${projectId}`);
}

export async function listCheckpoints(projectId: string): Promise<Checkpoint[]> {
  const data = await fetchApi<{ checkpoints: Checkpoint[] }>(
    `/projects/${projectId}/checkpoints`
  );
  return data.checkpoints;
}
```

- [ ] **Step 4: Create ProjectCard component**

Create `frontend/src/components/ProjectCard.tsx`:
```tsx
import type { ProjectRecord } from "../api/client";

const statusColors = {
  Active: "bg-green-100 text-green-800",
  Stalling: "bg-yellow-100 text-yellow-800",
  Dormant: "bg-red-100 text-red-800",
};

function timeAgo(iso: string | null): string {
  if (!iso) return "never";
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

export function ProjectCard({
  project,
  onClick,
}: {
  project: ProjectRecord;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-lg text-gray-900">
          {project.repoFullName}
        </h3>
        <span
          className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
            statusColors[project.activityStatus] || statusColors.Dormant
          }`}
        >
          {project.activityStatus}
        </span>
      </div>
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {project.summary || "No context yet"}
      </p>
      <div className="text-xs text-gray-400">
        Last checkpoint: {timeAgo(project.lastCheckpointAt)}
      </div>
    </button>
  );
}
```

- [ ] **Step 5: Create Dashboard page**

Create `frontend/src/pages/Dashboard.tsx`:
```tsx
import { useEffect, useState } from "react";
import { listProjects, type ProjectRecord } from "../api/client";
import { ProjectCard } from "../components/ProjectCard";

export function Dashboard({
  onSelectProject,
}: {
  onSelectProject: (id: string) => void;
}) {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listProjects()
      .then(setProjects)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">GitBack</h1>
            <p className="text-sm text-gray-500">
              Your coding agent knows your code. GitBack remembers your journey.
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {loading && (
          <div className="text-center py-12 text-gray-500">
            Loading projects...
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <div className="text-center py-16">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              No projects yet
            </h2>
            <p className="text-gray-500">
              Use <code className="bg-gray-100 px-2 py-0.5 rounded">gitback_remember</code> in your
              coding agent to save your first checkpoint.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <ProjectCard
              key={p.projectId}
              project={p}
              onClick={() => onSelectProject(p.projectId)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 6: Wire up App.tsx with routing**

Replace `frontend/src/App.tsx`:
```tsx
import { useState } from "react";
import { Dashboard } from "./pages/Dashboard";
import { ResumeView } from "./pages/ResumeView";

function App() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  if (selectedProject) {
    return (
      <ResumeView
        projectId={selectedProject}
        onBack={() => setSelectedProject(null)}
      />
    );
  }

  return <Dashboard onSelectProject={setSelectedProject} />;
}

export default App;
```

Create placeholder `frontend/src/pages/ResumeView.tsx`:
```tsx
export function ResumeView({
  projectId,
  onBack,
}: {
  projectId: string;
  onBack: () => void;
}) {
  return (
    <div className="p-8">
      <button onClick={onBack} className="text-blue-600 mb-4">
        ← Back to Dashboard
      </button>
      <p>Resume View for {projectId} — built in next step</p>
    </div>
  );
}
```

- [ ] **Step 7: Test dashboard**

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173` — verify the dashboard loads (will show empty state or projects if API is connected).

Set the API URL:
```bash
VITE_API_URL=https://<your-api-id>.execute-api.us-east-1.amazonaws.com/dev npm run dev
```

- [ ] **Step 8: Commit**

```bash
git add frontend/
git commit -m "feat: add React dashboard with project cards"
```

---

### Task 17: Resume View Page

**Files:**
- Modify: `frontend/src/pages/ResumeView.tsx`
- Create: `frontend/src/components/SectionCard.tsx`
- Create: `frontend/src/components/EvidenceList.tsx`

**Interfaces:**
- Consumes: `getProject` from `api/client.ts`
- Produces: full Resume View with checkpoint details, evidence, and timeline

- [ ] **Step 1: Create SectionCard component**

Create `frontend/src/components/SectionCard.tsx`:
```tsx
export function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Create EvidenceList component**

Create `frontend/src/components/EvidenceList.tsx`:
```tsx
const typeColors: Record<string, string> = {
  CHECKPOINT: "bg-purple-100 text-purple-800",
  COMMIT: "bg-blue-100 text-blue-800",
  DIFF: "bg-orange-100 text-orange-800",
  FILE: "bg-green-100 text-green-800",
  TODO: "bg-yellow-100 text-yellow-800",
  BRANCH: "bg-gray-100 text-gray-800",
};

export function EvidenceList({
  checkpoint,
}: {
  checkpoint: {
    branch: string;
    explicitNote: string;
    timestamp: string;
    changedFiles: { path: string; status: string }[];
    todos: { file: string; line: number; text: string; type: string }[];
    recentCommits: { sha: string; message: string }[];
  };
}) {
  const items: { type: string; source: string; detail: string }[] = [];

  items.push({
    type: "CHECKPOINT",
    source: new Date(checkpoint.timestamp).toLocaleString(),
    detail: checkpoint.explicitNote,
  });

  items.push({
    type: "BRANCH",
    source: "Current branch",
    detail: checkpoint.branch,
  });

  for (const c of checkpoint.recentCommits.slice(0, 3)) {
    items.push({
      type: "COMMIT",
      source: c.sha.slice(0, 7),
      detail: c.message,
    });
  }

  for (const f of checkpoint.changedFiles.slice(0, 5)) {
    items.push({
      type: "DIFF",
      source: f.path,
      detail: f.status,
    });
  }

  for (const t of checkpoint.todos) {
    items.push({
      type: "TODO",
      source: `${t.file}:${t.line}`,
      detail: `${t.type}: ${t.text}`,
    });
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-3 text-sm">
          <span
            className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded ${
              typeColors[item.type] || typeColors.FILE
            }`}
          >
            {item.type}
          </span>
          <span className="text-gray-500 shrink-0 font-mono text-xs">
            {item.source}
          </span>
          <span className="text-gray-700">{item.detail}</span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Build full Resume View page**

Replace `frontend/src/pages/ResumeView.tsx`:
```tsx
import { useEffect, useState } from "react";
import { getProject, type ProjectRecord, type Checkpoint } from "../api/client";
import { SectionCard } from "../components/SectionCard";
import { EvidenceList } from "../components/EvidenceList";

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ResumeView({
  projectId,
  onBack,
}: {
  projectId: string;
  onBack: () => void;
}) {
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProject(projectId)
      .then((data) => {
        setProject(data.project);
        setCheckpoints(data.checkpoints);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return <div className="p-8 text-gray-500">Loading...</div>;
  }

  const latest = checkpoints[0] || null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button
            onClick={onBack}
            className="text-blue-600 text-sm hover:underline mb-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {project?.repoFullName || projectId}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {project?.summary || "No summary available"}
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {!latest ? (
          <div className="text-center py-12 text-gray-500">
            No checkpoints yet. Use <code>gitback_remember</code> to save your
            first checkpoint.
          </div>
        ) : (
          <>
            {/* Section 1: Where You Left Off */}
            <SectionCard title="Where You Left Off">
              <div className="text-sm text-gray-500 mb-2">
                {timeAgo(latest.timestamp)} — {new Date(latest.timestamp).toLocaleString()}
              </div>
              <blockquote className="border-l-4 border-blue-400 pl-4 py-2 bg-blue-50 rounded-r text-gray-800">
                {latest.explicitNote}
              </blockquote>
              <div className="mt-3 flex gap-4 text-xs text-gray-500">
                <span>
                  Branch: <code className="bg-gray-100 px-1 rounded">{latest.branch}</code>
                </span>
                <span>
                  Commit: <code className="bg-gray-100 px-1 rounded">{latest.commitSha.slice(0, 7)}</code>
                </span>
                {latest.tags.length > 0 && (
                  <span>Tags: {latest.tags.join(", ")}</span>
                )}
              </div>
            </SectionCard>

            {/* Section 2: Changed Files */}
            {(latest.gitStatus.modified.length > 0 ||
              latest.gitStatus.staged.length > 0 ||
              latest.gitStatus.untracked.length > 0) && (
              <SectionCard title="Files at Checkpoint">
                <div className="space-y-1 text-sm font-mono">
                  {latest.gitStatus.modified.map((f) => (
                    <div key={f.path} className="text-orange-600">
                      M {f.path}
                    </div>
                  ))}
                  {latest.gitStatus.staged.map((f) => (
                    <div key={f.path} className="text-green-600">
                      A {f.path}
                    </div>
                  ))}
                  {latest.gitStatus.untracked.map((f) => (
                    <div key={f} className="text-gray-400">
                      ? {f}
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Section 3: TODOs */}
            {latest.todos.length > 0 && (
              <SectionCard title="TODOs">
                <div className="space-y-2">
                  {latest.todos.map((todo, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded">
                        {todo.type}
                      </span>
                      <code className="text-xs text-gray-500">
                        {todo.file}:{todo.line}
                      </code>
                      <span className="text-gray-700">{todo.text}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Section 4: Recent Commits */}
            {latest.recentCommits.length > 0 && (
              <SectionCard title="Recent Commits">
                <div className="space-y-2">
                  {latest.recentCommits.slice(0, 5).map((c) => (
                    <div key={c.sha} className="flex items-start gap-2 text-sm">
                      <code className="text-xs text-gray-400 shrink-0">
                        {c.sha.slice(0, 7)}
                      </code>
                      <span className="text-gray-700">{c.message}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Section 5: Evidence */}
            <SectionCard title="Evidence">
              <EvidenceList checkpoint={latest} />
            </SectionCard>

            {/* Section 6: Checkpoint History */}
            {checkpoints.length > 1 && (
              <SectionCard title="Checkpoint History">
                <div className="space-y-3">
                  {checkpoints.map((cp) => (
                    <div
                      key={cp.checkpointId}
                      className="border-l-2 border-gray-200 pl-4 py-1"
                    >
                      <div className="text-xs text-gray-400">
                        {timeAgo(cp.timestamp)} — {cp.branch}
                      </div>
                      <div className="text-sm text-gray-700 mt-0.5">
                        {cp.explicitNote}
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </>
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Test the full dashboard**

```bash
cd frontend
VITE_API_URL=https://<your-api-id>.execute-api.us-east-1.amazonaws.com/dev npm run dev
```

1. Verify dashboard shows projects from DynamoDB
2. Click a project card → Resume View loads
3. Verify all sections render with real checkpoint data

- [ ] **Step 5: Commit**

```bash
git add frontend/
git commit -m "feat: add Resume View with evidence, todos, and checkpoint history"
```

---

**PHASE 3 COMPLETE.** Full web dashboard with Resume View. The product is now demoable end-to-end: MCP checkpoints → AI briefings → web dashboard.

---

# PHASE 4: Demo Prep + Submission (~1.5 hours)

**Demo after this phase:** Polished, recorded, submitted.

---

### Task 18: Demo Data + End-to-End Test

**Files:**
- Create: `scripts/seed-demo.ts` (optional — or just use gitback_remember in real repos)

**Interfaces:**
- Consumes: entire system
- Produces: demo-ready data

- [ ] **Step 1: Seed demo data by using GitBack on real repos**

Open Claude Code in 2–3 real local repos. For each:

```
Use gitback_remember — "<describe what you were working on in this project>"
```

This creates real checkpoints that will show up in the dashboard.

- [ ] **Step 2: Test the full demo flow**

1. Open a project in terminal with Claude Code
2. Say: "Use gitback_remember — I'm halfway through implementing Stripe webhook verification. Signature validation is done. Tomorrow I want to tackle idempotency."
3. Verify checkpoint saved
4. Make a small code change in the repo
5. Say: "Use gitback_resume to tell me where I left off"
6. Verify AI-powered resume briefing returns with evidence
7. Say: "Use gitback_compare to show what changed"
8. Verify comparison output
9. Open web dashboard — verify project appears with correct data
10. Click project — verify Resume View shows checkpoint

- [ ] **Step 3: Commit any demo fixes**

```bash
git add -A
git commit -m "chore: demo prep and polish"
```

---

### Task 19: Record Demo Video + Submit

**No files — this is production work.**

- [ ] **Step 1: Record 3-minute demo**

Follow this script:

**0:00–0:30 — The Problem:**
"Every developer has abandoned projects. Not because of lack of skill — because of context loss. Your coding agent can see your code, but it doesn't remember what you were trying to do. Next session, you start from scratch."

**0:30–0:45 — The Solution:**
"GitBack is persistent development memory for coding agents. It remembers your journey so you can pick up exactly where you left off."

**0:45–1:45 — Live Demo (MCP):**
- Open terminal with Claude Code in a real project
- Show uncommitted changes and in-progress work
- "GitBack, remember where I am." + give note
- Show checkpoint confirmation
- Make a small change, commit
- "GitBack, where was I?"
- Show AI-powered resume briefing with evidence
- "GitBack, what changed since my last checkpoint?"
- Show comparison

**1:45–2:30 — Live Demo (Dashboard):**
- Open web dashboard
- Show 2–3 projects with status badges
- Click into a project
- Walk through Resume View: checkpoint note, files, TODOs, evidence, history
- "All of this was captured automatically from my coding session."

**2:30–2:45 — Architecture:**
- Show or narrate the architecture: MCP server locally, DynamoDB + Bedrock in AWS, 10 services
- "Cloud remembers what happened before. MCP knows what's happening now."

**2:45–3:00 — Closing:**
"I didn't have to remember what I was doing. GitBack did."

- [ ] **Step 2: Write hackathon submission**

Cover:
- Problem: context loss kills developer productivity
- Solution: persistent development memory via MCP
- AWS services used (10): S3, CloudFront, API Gateway, Lambda, DynamoDB, Step Functions, Bedrock, Secrets Manager, EventBridge, SNS (mention even if not all are fully wired — the architecture supports them)
- What makes it different: "Your coding agent knows your code. GitBack remembers your journey."

- [ ] **Step 3: Submit**

---

## Cut List (ordered by priority — cut from the bottom)

If time runs out, cut in this order (bottom = cut first):

1. **Stale project alerts** (EventBridge + SNS) — SKIP
2. **CLI** (`gitback remember/resume/compare`) — SKIP
3. **GitHub OAuth** — use hardcoded demo user
4. **CloudFront deployment** — run frontend locally for demo
5. **gitback_status tool** — nice-to-have, not essential for demo
6. **Step Functions onboarding pipeline** — mention in architecture, don't build
7. **TODO scanning** — nice-to-have, basic checkpoint still works without it

## Time Budget

| Phase | Estimated | Cumulative | Demoable? |
|-------|-----------|------------|-----------|
| Phase 1: MCP + Local | 3h | 3h | Yes — MCP save/retrieve |
| Phase 2: Cloud + AI | 2.5h | 5.5h | Yes — AI briefings + cloud |
| Phase 3: Web Dashboard | 3h | 8.5h | Yes — full product |
| Phase 4: Demo + Submit | 1.5h | 10h | Yes — polished submission |
| **Buffer** | **2h** | **12h** | |

# GitBack — Open Source Production Roadmap

## Phase 1: Fix the Foundation ✅
Make what exists actually correct before adding anything new.

- [x] **Fix staged files misclassification** — Now uses `git diff --cached --name-status` for real statuses.
- [x] **Fix N+1 git subprocess calls** — `getRecentCommits` now fetches everything in one `git log --name-only` call.
- [x] **Fix API discarding checkpoint list** — Returns actual checkpoint summary list + separate `latestCheckpoint`.
- [x] **Add error handling to ResumeView** — Error state with message and back button.
- [x] **Fix EvidenceList** — Uses `context.evidence` when available, falls back to checkpoint reconstruction.
- [x] **Extract duplicated `commitsSinceCheckpoint`** — Moved to `getCommitsSince` in core `git.ts`.
- [x] **Fix git log format quoting** — Removed fragile double-quote wrapping, uses delimiter-based parsing.
- [x] **Sanitize git command arguments** — SHA validation via `isValidSha` before passing to shell.
- [x] **Fix TODO scanner false positives** — Removed case-insensitive flag, require separator after keyword.

## Phase 2: LLM Provider Refactor ✅
Replace Bedrock with a universal OpenAI-compatible client.

- [x] **Create `packages/core/src/llm.ts`** — Plain `fetch` client for any OpenAI-compatible API. Zero new dependencies.
- [x] **Port prompts from `bedrock.ts` to `llm.ts`** — Same prompt logic, calls `/v1/chat/completions`.
- [x] **Implement auto-detection** — `isLlmAvailable()` checks if configured endpoint responds.
- [x] **Keep structured markdown fallback** — Returns `null` when no LLM configured; callers fall through to deterministic output.
- [x] **Remove `@aws-sdk/client-bedrock-runtime` dependency** from `packages/core`.
- [x] **Delete `bedrock.ts`**.
- [x] **Create `.env.example`** with documented config for Ollama, OpenRouter, OpenAI, Google AI Studio.

## Phase 3: Build the CLI ✅
The fastest way for anyone to try GitBack.

- [x] **Create `packages/cli/` package** with `bin: { "gitback": "dist/index.js" }`.
- [x] **`gitback remember "note"` command** — With `--tags` support.
- [x] **`gitback resume` command** — Local checkpoint + optional LLM synthesis. `--full` flag.
- [x] **`gitback compare` command** — Changes since last checkpoint.
- [x] **`gitback status` command** — Scans `~/.gitback/projects/` locally.
- [x] **`gitback config` command** — Set/view LLM provider config. Stores in `~/.gitback/config.json`.
- [x] **Make CLI work fully offline** — All commands use local storage, no cloud dependency.
- [x] **`npx` support** — Package structured with `bin` field.

## Phase 4: Make MCP Server Standalone ✅
The MCP server should work without AWS credentials.

- [x] **Default to local-only mode** — Cloud sync only when `GITBACK_USER_ID` is set.
- [x] **Use `llm.ts` instead of `bedrock.ts`** — Provider-agnostic LLM client.
- [x] **Remove hard dependency on DynamoDB** — Local storage is primary, cloud is opt-in.
- [x] **`gitback_status` local fallback** — Scans `~/.gitback/projects/` when cloud is unavailable.
- [x] **Remove `GITBACK_USER_ID` requirement** — Only needed for cloud sync.

## Phase 5: Clean Up the API & Infra
Make the Express API and SAM template actually work together.

- [ ] **Decide: Express server OR Lambda handlers** — Currently the SAM template references Lambda handlers that don't exist, and the API is Express. Pick one. Recommendation: keep Express for local dev, write real Lambda handlers for deploy.
- [ ] **Create actual Lambda handler files** in `infra/src/` — `listProjectsHandler`, `getProjectHandler`, `listCheckpointsHandler`, `staleCheckHandler`.
- [ ] **Add missing API endpoints** that matter for the dashboard:
  - `POST /projects/:projectId/checkpoints` (create checkpoint via API)
  - `GET /projects/:projectId/checkpoints/latest`
  - `GET /projects/:projectId/context/latest`
  - `DELETE /projects/:projectId`
- [ ] **Add `since` parameter to `gitback_compare`** — PRD specifies optional checkpoint ID to compare against.
- [ ] **Remove CloudFront / S3 hosting from SAM template** — For open source, users self-host. Simplify infra to just DynamoDB + API Gateway + Lambdas.

## Phase 6: Frontend Polish
Make the dashboard production-quality.

- [ ] **Add error boundaries** — Wrap pages in error boundaries with retry buttons.
- [ ] **Add error state to ResumeView** — Show error message with retry option instead of infinite spinner.
- [ ] **Add "Project Architecture" section** to Resume View (PRD Section 5) — Tech stack, directory structure.
- [ ] **Add "Re-analyze" button** to Resume View — Triggers fresh LLM synthesis.
- [ ] **Improve empty state** — Better onboarding copy explaining how to get started. Remove "Add Project from GitHub" (cloud-only feature, defer).
- [ ] **Add loading skeletons** — Replace raw spinners with skeleton cards during load.
- [ ] **Responsive design check** — Test and fix mobile layout.
- [ ] **Add dark/light theme toggle** — Currently dark-only.

## Phase 7: Open Source Readiness (Partial)
Everything needed before the first public release.

- [x] **Write README.md** — Quickstart, MCP setup, LLM config, CLI docs, architecture, contributing.
- [x] **Create `.env.example`** — All env vars documented with provider examples.
- [x] **Add LICENSE** — MIT.
- [x] **Add CONTRIBUTING.md** — Dev setup, how to build, how to run tests, PR process.
- [x] **Create GitHub issue templates** — Bug report, feature request.
- [x] **Add CI with GitHub Actions** — Build, lint, type-check on PR.
- [x] **Add `engines` field to package.json** — Specify minimum Node.js version.
- [x] **Remove `docs/superpowers/` directory** — Internal planning artifact, not relevant to OSS.
- [x] **Remove `docs/demo-script.md`** — Internal hackathon artifact.
- [x] **Set up npm workspace properly** — Ensure `npm install` from root works cleanly for contributors.
- [x] **Add TypeScript strict mode** — Enable `strict: true` across all tsconfigs.

## Phase 8: Testing
Add tests to the critical paths.

- [ ] **Unit tests for `git.ts`** — Mock `execSync`, test parsing logic.
- [ ] **Unit tests for `checkpoint.ts`** — Verify checkpoint structure.
- [ ] **Unit tests for `evidence.ts`** — Test evidence gathering from various inputs.
- [ ] **Unit tests for `todos.ts`** — Test TODO/FIXME pattern matching.
- [ ] **Unit tests for `project.ts`** — Test remote URL parsing, project ID generation.
- [ ] **Unit tests for `llm.ts`** — Mock HTTP calls, test prompt building, test fallback behavior.
- [ ] **Integration test for remember → resume cycle** — Create checkpoint, load it, verify output.
- [ ] **Pick a test framework** — Vitest (already Vite-based project).

## Phase 9: Nice-to-Haves (Post-Launch)
Defer these until after the initial open source release.

- [ ] GitHub OAuth login for dashboard
- [ ] "Add Project" flow with GitHub repo selector
- [ ] Step Functions onboarding pipeline
- [ ] Stale project email alerts (EventBridge + SNS)
- [ ] CloudFront CDN deployment
- [ ] API key generation for cloud sync
- [ ] Rate limiting on LLM calls
- [ ] Checkpoint size limits (truncate large diffs)
- [ ] Multi-device sync
- [ ] Hosted/SaaS version

---

## Suggested Execution Order

Phases 1-4 are the critical path — they make GitBack usable by anyone.

1. **Phase 1** (Fix bugs) — 1 session
2. **Phase 2** (LLM refactor) — 1 session
3. **Phase 3** (CLI) — 1 session
4. **Phase 4** (MCP standalone) — 1 session, overlaps with Phase 2
5. **Phase 7** (OSS readiness) — 1 session, can start after Phase 4
6. **Phase 6** (Frontend polish) — 1 session, parallel with Phase 7
7. **Phase 5** (API cleanup) — 1 session, after frontend
8. **Phase 8** (Tests) — ongoing, start anytime after Phase 2

**Minimum viable open source release = Phases 1 + 2 + 3 + 4 + 7.**

The CLI + MCP server working locally with any LLM (or none) is a shippable product. The dashboard and cloud features are bonuses.

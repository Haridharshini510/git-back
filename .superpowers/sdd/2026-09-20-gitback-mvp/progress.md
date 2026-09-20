# SDD ledger — plan: docs/superpowers/plans/2026-09-20-gitback-mvp.md

## Pre-flight scan

| Task pair | Shared file/interface | Finding |
|---|---|---|
| T1 → T2-8 | packages/core/src/* | T1 creates scaffold, T2-8 add files. Sequential, no conflict. |
| T2 → T3 | types.ts → git.ts | T3 imports GitState, FileChange, CommitInfo from T2. Signatures match. |
| T2 → T4 | types.ts → todos.ts | T4 imports TodoItem from T2. Signatures match. |
| T3,T2 → T5 | git.ts, types.ts → project.ts | T5 imports getGitRemoteUrl from T3, ProjectIdentity from T2. Match. |
| T2-5 → T6 | All core → checkpoint.ts + storage-local.ts | T6 imports from T2,T3,T4,T5. All signatures match plan. |
| T2 → T7 | types.ts → evidence.ts | T7 imports Evidence, Checkpoint, GitState, CommitInfo. Match. |
| T2-7 → T8 | All modules → index.ts barrel | T8 re-exports all. Match. |
| T8 → T9 | @gitback/core → remember.ts | T9 imports createCheckpoint, saveCheckpointLocal, resolveProject, isGitRepo. All produced by T2-8. Match. |
| T8 → T10 | @gitback/core → resume.ts | T10 imports loadLatestCheckpointLocal, getGitState, gatherEvidence, etc. All produced by T2-8. Match. |
| T9 → T10 | packages/mcp/src/index.ts | Both modify index.ts. T9 creates it, T10 adds resume registration. Sequential, no conflict. |

Self-consistency check per task: all tasks specify code that matches their own test expectations and file references. Clean.

Scan result: **clean — no conflicts found.**

## Execution log

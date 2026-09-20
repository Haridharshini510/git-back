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

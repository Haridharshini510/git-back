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

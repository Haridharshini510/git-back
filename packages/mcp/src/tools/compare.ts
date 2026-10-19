import {
  loadLatestCheckpointLocal,
  loadLatestCheckpointCloud,
  resolveProject,
  getGitState,
  getGitDiffSummary,
  getCommitsSince,
  isGitRepo,
} from "@gitback/core";

export const compareToolDefinition = {
  name: "gitback_compare",
  description:
    "Compare what changed since the last GitBack checkpoint. Shows new commits, file changes, and diff summary since you last saved context.",
  inputSchema: {
    type: "object" as const,
    properties: {},
  },
};

export async function handleCompare(): Promise<string> {
  if (!isGitRepo()) {
    return "Error: Not inside a git repository.";
  }

  const project = resolveProject();

  let checkpoint = loadLatestCheckpointLocal(project.projectId);
  const userId = process.env.GITBACK_USER_ID;
  if (!checkpoint && userId) {
    try {
      checkpoint = await loadLatestCheckpointCloud(userId, project.projectId);
    } catch {
      // Cloud unavailable
    }
  }

  if (!checkpoint) {
    return "No checkpoint found. Use **gitback_remember** first.";
  }

  const currentState = getGitState();
  const newCommits = getCommitsSince(
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

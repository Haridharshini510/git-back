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
  const currentState = getGitState();

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

  // Fallback: structured output
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

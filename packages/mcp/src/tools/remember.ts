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

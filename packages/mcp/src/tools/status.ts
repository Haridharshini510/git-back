import { listProjectRecords } from "@gitback/core";
import type { ProjectRecord } from "@gitback/core";

export const statusToolDefinition = {
  name: "gitback_status",
  description:
    "Quick overview of all your GitBack-tracked projects. Shows project name, activity status, last checkpoint, and summary for each connected project.",
  inputSchema: {
    type: "object" as const,
    properties: {},
  },
};

function formatTimeSince(isoDate: string | null): string {
  if (!isoDate) return "never";
  const ms = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const statusEmoji: Record<string, string> = {
  Active: "[Active]",
  Stalling: "[Stalling]",
  Dormant: "[Dormant]",
};

export async function handleStatus(): Promise<string> {
  const userId = process.env.GITBACK_USER_ID || "demo-user";

  let projects: ProjectRecord[] = [];
  try {
    projects = await listProjectRecords(userId);
  } catch {
    return "Could not reach GitBack cloud. Make sure AWS credentials are configured.";
  }

  if (projects.length === 0) {
    return [
      "**No projects tracked yet.**",
      "",
      "Use **gitback_remember** in any git repo to start tracking a project.",
    ].join("\n");
  }

  const lines: string[] = [
    `**${projects.length} project${projects.length > 1 ? "s" : ""} tracked by GitBack:**`,
    "",
  ];

  for (const p of projects) {
    const status = statusEmoji[p.activityStatus] || `[${p.activityStatus}]`;
    lines.push(`### ${p.repoFullName} ${status}`);
    lines.push(`- Last checkpoint: ${formatTimeSince(p.lastCheckpointAt)}`);
    if (p.summary) {
      lines.push(`- ${p.summary}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

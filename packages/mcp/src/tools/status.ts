import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

export const statusToolDefinition = {
  name: "gitback_status",
  description:
    "Quick overview of all your GitBack-tracked projects. Shows project name, activity status, last checkpoint, and summary for each tracked project.",
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

function computeActivityStatus(lastDate: string): "Active" | "Stalling" | "Dormant" {
  const days = (Date.now() - new Date(lastDate).getTime()) / 86400000;
  if (days <= 7) return "Active";
  if (days <= 21) return "Stalling";
  return "Dormant";
}

interface LocalProject {
  name: string;
  activityStatus: string;
  lastCheckpointAt: string;
  summary: string;
  checkpointCount: number;
}

function getLocalProjects(): LocalProject[] {
  const projectsDir = join(homedir(), ".gitback", "projects");
  if (!existsSync(projectsDir)) return [];

  const projects: LocalProject[] = [];
  for (const dir of readdirSync(projectsDir)) {
    const cpDir = join(projectsDir, dir, "checkpoints");
    if (!existsSync(cpDir)) continue;

    const files = readdirSync(cpDir).filter((f) => f.endsWith(".json")).sort().reverse();
    if (files.length === 0) continue;

    try {
      const content = readFileSync(join(cpDir, files[0]), "utf-8");
      const cp = JSON.parse(content);
      projects.push({
        name: cp.branch ? `${dir.slice(0, 8)}... (${cp.branch})` : dir,
        activityStatus: computeActivityStatus(cp.timestamp),
        lastCheckpointAt: cp.timestamp,
        summary: cp.explicitNote?.slice(0, 200) || "",
        checkpointCount: files.length,
      });
    } catch {
      continue;
    }
  }
  return projects;
}

export async function handleStatus(): Promise<string> {
  const localProjects = getLocalProjects();

  if (localProjects.length === 0) {
    return [
      "**No projects tracked yet.**",
      "",
      "Use **gitback_remember** in any git repo to start tracking a project.",
    ].join("\n");
  }

  const lines: string[] = [
    `**${localProjects.length} project${localProjects.length > 1 ? "s" : ""} tracked locally:**`,
    "",
  ];

  for (const p of localProjects) {
    lines.push(`### ${p.name} [${p.activityStatus}]`);
    lines.push(`- Last checkpoint: ${formatTimeSince(p.lastCheckpointAt)} (${p.checkpointCount} total)`);
    if (p.summary) lines.push(`- ${p.summary}`);
    lines.push("");
  }

  return lines.join("\n");
}

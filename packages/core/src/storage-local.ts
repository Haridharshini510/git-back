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

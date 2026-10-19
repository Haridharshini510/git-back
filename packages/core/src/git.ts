import { execSync } from "node:child_process";
import type { GitState, FileChange, CommitInfo } from "./types.js";

function git(args: string, cwd?: string): string {
  try {
    return execSync(`git ${args}`, {
      cwd: cwd ?? process.cwd(),
      encoding: "utf-8",
      timeout: 10000,
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch {
    return "";
  }
}

export function isGitRepo(cwd?: string): boolean {
  return git("rev-parse --is-inside-work-tree", cwd) === "true";
}

export function getGitRemoteUrl(cwd?: string): string {
  return git("remote get-url origin", cwd);
}

export function getGitBranch(cwd?: string): string {
  return git("rev-parse --abbrev-ref HEAD", cwd) || "unknown";
}

export function getGitCommitSha(cwd?: string): string {
  return git("rev-parse HEAD", cwd) || "unknown";
}

export function getGitCommitMessage(cwd?: string): string {
  return git("log -1 --pretty=%s", cwd) || "";
}

const STATUS_MAP: Record<string, FileChange["status"]> = {
  M: "modified",
  A: "added",
  D: "deleted",
  R: "renamed",
};

function parseNameStatusOutput(output: string): FileChange[] {
  if (!output) return [];
  return output
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [statusCode, ...pathParts] = line.split("\t");
      const code = statusCode.trim().charAt(0);
      return {
        path: pathParts[pathParts.length - 1]?.trim() || pathParts[0]?.trim(),
        status: STATUS_MAP[code] || "modified",
      };
    });
}

function getModifiedFiles(cwd?: string): FileChange[] {
  const output = git("diff --name-status", cwd);
  return parseNameStatusOutput(output);
}

function getStagedFiles(cwd?: string): FileChange[] {
  const output = git("diff --cached --name-status", cwd);
  return parseNameStatusOutput(output);
}

function getUntrackedFiles(cwd?: string): string[] {
  const output = git("ls-files --others --exclude-standard", cwd);
  if (!output) return [];
  return output.split("\n").filter(Boolean);
}

export function getRecentCommits(count: number = 10, cwd?: string): CommitInfo[] {
  const SEP = "---GITBACK-SEP---";
  const END = "---GITBACK-END---";
  const format = `${SEP}%H${SEP}%s${SEP}%aI`;
  const output = git(`log -${count} --pretty=format:${format} --name-only`, cwd);
  if (!output) return [];

  const entries = output.split(SEP).filter(Boolean);
  const commits: CommitInfo[] = [];

  for (let i = 0; i < entries.length; i += 3) {
    const sha = entries[i]?.trim();
    const message = entries[i + 1]?.trim();
    const rest = entries[i + 2]?.trim() || "";
    const lines = rest.split("\n").map((l) => l.trim()).filter(Boolean);
    const date = lines[0] || "";
    const filesChanged = lines.slice(1);
    if (sha && message) {
      commits.push({ sha, message, date, filesChanged });
    }
  }

  return commits;
}

function isValidSha(sha: string): boolean {
  return /^[0-9a-f]{4,40}$/i.test(sha);
}

export function getGitDiffSummary(sinceSha?: string, cwd?: string): string {
  if (sinceSha) {
    if (!isValidSha(sinceSha)) return "Invalid commit reference.";
    const stat = git(`diff --stat ${sinceSha}..HEAD`, cwd);
    const summary = git(`diff --shortstat ${sinceSha}..HEAD`, cwd);
    return stat ? `${stat}\n${summary}` : "No changes.";
  }
  const stat = git("diff --stat", cwd);
  const staged = git("diff --cached --stat", cwd);
  const parts: string[] = [];
  if (stat) parts.push(`Unstaged:\n${stat}`);
  if (staged) parts.push(`Staged:\n${staged}`);
  return parts.length > 0 ? parts.join("\n\n") : "No uncommitted changes.";
}

export function getCommitsSince(
  recentCommits: CommitInfo[],
  sinceSha: string
): CommitInfo[] {
  const idx = recentCommits.findIndex((c) => c.sha === sinceSha);
  if (idx === -1) return recentCommits;
  return recentCommits.slice(0, idx);
}

export function getGitState(cwd?: string): GitState {
  return {
    branch: getGitBranch(cwd),
    commitSha: getGitCommitSha(cwd),
    commitMessage: getGitCommitMessage(cwd),
    modifiedFiles: getModifiedFiles(cwd),
    stagedFiles: getStagedFiles(cwd),
    untrackedFiles: getUntrackedFiles(cwd),
    recentCommits: getRecentCommits(10, cwd),
  };
}

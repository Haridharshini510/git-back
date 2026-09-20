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

function parseFileChanges(output: string, status: FileChange["status"]): FileChange[] {
  if (!output) return [];
  return output
    .split("\n")
    .filter(Boolean)
    .map((path) => ({ path: path.trim(), status }));
}

function getModifiedFiles(cwd?: string): FileChange[] {
  const output = git("diff --name-only", cwd);
  return parseFileChanges(output, "modified");
}

function getStagedFiles(cwd?: string): FileChange[] {
  const output = git("diff --cached --name-only", cwd);
  return parseFileChanges(output, "added");
}

function getUntrackedFiles(cwd?: string): string[] {
  const output = git("ls-files --others --exclude-standard", cwd);
  if (!output) return [];
  return output.split("\n").filter(Boolean);
}

export function getRecentCommits(count: number = 10, cwd?: string): CommitInfo[] {
  const SEP = "---GITBACK-SEP---";
  const format = `%H${SEP}%s${SEP}%aI`;
  const output = git(`log -${count} --pretty=format:"${format}"`, cwd);
  if (!output) return [];

  return output
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const clean = line.replace(/^"|"$/g, "");
      const [sha, message, date] = clean.split(SEP);
      const filesOutput = git(`diff-tree --no-commit-id --name-only -r ${sha}`, cwd);
      const filesChanged = filesOutput ? filesOutput.split("\n").filter(Boolean) : [];
      return { sha, message, date, filesChanged };
    });
}

export function getGitDiffSummary(sinceSha?: string, cwd?: string): string {
  if (sinceSha) {
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

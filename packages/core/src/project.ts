import { createHash } from "node:crypto";
import { getGitRemoteUrl } from "./git.js";
import type { ProjectIdentity } from "./types.js";

function remoteUrlToRepoName(url: string): string {
  return url
    .replace(/\.git$/, "")
    .replace(/^.*github\.com[:/]/, "")
    .replace(/^.*gitlab\.com[:/]/, "")
    .replace(/^.*bitbucket\.org[:/]/, "");
}

function generateProjectId(remoteUrl: string): string {
  return createHash("sha256").update(remoteUrl).digest("hex").slice(0, 12);
}

export function resolveProject(cwd?: string): ProjectIdentity {
  const basePath = cwd ?? process.cwd();
  const remoteUrl = getGitRemoteUrl(basePath);

  if (!remoteUrl) {
    const fallbackId = createHash("sha256").update(basePath).digest("hex").slice(0, 12);
    return {
      projectId: fallbackId,
      repoFullName: basePath.split(/[/\\]/).pop() || "unknown",
      remoteUrl: "",
      localPath: basePath,
    };
  }

  return {
    projectId: generateProjectId(remoteUrl),
    repoFullName: remoteUrlToRepoName(remoteUrl),
    remoteUrl,
    localPath: basePath,
  };
}

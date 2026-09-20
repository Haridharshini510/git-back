const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export interface ProjectRecord {
  projectId: string;
  repoFullName: string;
  activityStatus: "Active" | "Stalling" | "Dormant";
  summary: string;
  lastCheckpointAt: string | null;
  lastCommitDate: string | null;
}

export interface Checkpoint {
  checkpointId: string;
  timestamp: string;
  explicitNote: string;
  branch: string;
  commitSha: string;
  tags: string[];
  changedFiles: { path: string; status: string }[];
  todos: { file: string; line: number; text: string; type: string }[];
  gitStatus: {
    modified: { path: string }[];
    staged: { path: string }[];
    untracked: string[];
  };
  recentCommits: { sha: string; message: string; date: string }[];
  diffSummary: string;
}

export interface ContextSnapshot {
  projectId: string;
  timestamp: string;
  checkpointId: string;
  whereYouLeftOff: string;
  whatChanged: string;
  whatsNext: string[];
  whatsDone: string[];
  decisions: string[];
  evidence: { type: string; source: string; detail: string }[];
  oneLinerSummary: string;
}

export async function listProjects(): Promise<ProjectRecord[]> {
  const data = await fetchApi<{ projects: ProjectRecord[] }>("/projects");
  return data.projects;
}

export async function getProject(projectId: string): Promise<{
  project: ProjectRecord;
  checkpoints: Checkpoint[];
  context: ContextSnapshot | null;
}> {
  return fetchApi(`/projects/${projectId}`);
}

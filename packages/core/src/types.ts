export type EvidenceType =
  | "CHECKPOINT"
  | "COMMIT"
  | "DIFF"
  | "FILE"
  | "TODO"
  | "BRANCH";

export interface Evidence {
  type: EvidenceType;
  source: string;
  detail: string;
}

export interface FileChange {
  path: string;
  status: "modified" | "added" | "deleted" | "renamed" | "untracked";
}

export interface GitState {
  branch: string;
  commitSha: string;
  commitMessage: string;
  modifiedFiles: FileChange[];
  stagedFiles: FileChange[];
  untrackedFiles: string[];
  recentCommits: CommitInfo[];
}

export interface CommitInfo {
  sha: string;
  message: string;
  date: string;
  filesChanged: string[];
}

export interface TodoItem {
  file: string;
  line: number;
  text: string;
  type: "TODO" | "FIXME" | "HACK" | "XXX";
}

export interface ProjectIdentity {
  projectId: string;
  repoFullName: string;
  remoteUrl: string;
  localPath: string;
}

export interface Checkpoint {
  checkpointId: string;
  projectId: string;
  timestamp: string;
  explicitNote: string;
  tags: string[];
  branch: string;
  commitSha: string;
  commitMessage: string;
  gitStatus: {
    modified: FileChange[];
    staged: FileChange[];
    untracked: string[];
  };
  changedFiles: FileChange[];
  recentCommits: CommitInfo[];
  todos: TodoItem[];
  diffSummary: string;
}

export interface CheckpointSummary {
  checkpointId: string;
  timestamp: string;
  note: string;
  branch: string;
  commitSha: string;
  fileCount: number;
}

export interface ResumeContext {
  lastCheckpoint: Checkpoint | null;
  currentState: GitState;
  changesSinceCheckpoint: {
    newCommits: CommitInfo[];
    filesChanged: FileChange[];
    diffSummary: string;
  };
  evidence: Evidence[];
  briefing: string | null;
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
  evidence: Evidence[];
  oneLinerSummary: string;
}

export type ActivityStatus = "Active" | "Stalling" | "Dormant";

export interface ProjectRecord {
  projectId: string;
  repoFullName: string;
  remoteUrl: string;
  activityStatus: ActivityStatus;
  summary: string;
  lastCheckpointAt: string | null;
  lastCommitDate: string | null;
}

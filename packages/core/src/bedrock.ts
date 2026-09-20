import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import type { Checkpoint, GitState, Evidence, CommitInfo } from "./types.js";

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-west-2",
});

const MODEL_ID =
  process.env.BEDROCK_MODEL_ID || "us.anthropic.claude-sonnet-4-5-20250929-v1:0";

export interface SynthesisInput {
  checkpoint: Checkpoint | null;
  currentState: GitState;
  commitsSinceCheckpoint: CommitInfo[];
  evidence: Evidence[];
  projectName: string;
}

export async function synthesizeResumeBriefing(
  input: SynthesisInput
): Promise<string> {
  const prompt = buildPrompt(input);

  const body = JSON.stringify({
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  const response = await client.send(
    new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: "application/json",
      accept: "application/json",
      body,
    })
  );

  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  return responseBody.content[0].text;
}

function buildPrompt(input: SynthesisInput): string {
  const { checkpoint, currentState, commitsSinceCheckpoint, evidence, projectName } = input;

  const sections: string[] = [
    `You are GitBack, a development memory assistant. Generate a concise resume briefing for a developer returning to their project "${projectName}".`,
    "",
    "Your job is to help them pick up where they left off. Be specific, reference file names and line numbers where available. Use second person (\"you\"). Be direct and actionable.",
    "",
    "Format your response in these sections:",
    "## Where You Left Off",
    "(What the developer was working on, from their own words and observed state)",
    "",
    "## What Changed Since Then",
    "(Commits, file changes, new work since the checkpoint)",
    "",
    "## What's Next",
    "(Prioritized, actionable next steps — numbered list)",
    "",
    "## Key Evidence",
    "(Brief citations showing where conclusions came from)",
    "",
    "---",
    "",
    "Here is the context:",
    "",
  ];

  if (checkpoint) {
    sections.push(
      "### Developer's Last Checkpoint",
      `Saved: ${checkpoint.timestamp}`,
      `Note: "${checkpoint.explicitNote}"`,
      `Branch at checkpoint: ${checkpoint.branch}`,
      `Commit at checkpoint: ${checkpoint.commitSha.slice(0, 7)} — ${checkpoint.commitMessage}`,
      `Tags: ${checkpoint.tags.length > 0 ? checkpoint.tags.join(", ") : "none"}`,
      ""
    );

    if (checkpoint.todos.length > 0) {
      sections.push("### TODOs at checkpoint:");
      for (const todo of checkpoint.todos) {
        sections.push(`- ${todo.type} in ${todo.file}:${todo.line}: ${todo.text}`);
      }
      sections.push("");
    }

    if (checkpoint.changedFiles.length > 0) {
      sections.push("### Files changed at checkpoint:");
      for (const f of checkpoint.changedFiles) {
        sections.push(`- ${f.status}: ${f.path}`);
      }
      sections.push("");
    }
  } else {
    sections.push("### No previous checkpoint exists. This is the developer's first resume request.", "");
  }

  sections.push(
    "### Current Repository State",
    `Branch: ${currentState.branch}`,
    `Latest commit: ${currentState.commitSha.slice(0, 7)} — ${currentState.commitMessage}`,
    `Modified files: ${currentState.modifiedFiles.map((f) => f.path).join(", ") || "none"}`,
    `Staged files: ${currentState.stagedFiles.map((f) => f.path).join(", ") || "none"}`,
    `Untracked files: ${currentState.untrackedFiles.slice(0, 10).join(", ") || "none"}`,
    ""
  );

  if (commitsSinceCheckpoint.length > 0) {
    sections.push("### Commits since checkpoint:");
    for (const c of commitsSinceCheckpoint) {
      sections.push(`- ${c.sha.slice(0, 7)} ${c.message} (files: ${c.filesChanged.join(", ")})`);
    }
    sections.push("");
  }

  if (evidence.length > 0) {
    sections.push("### Evidence:");
    for (const e of evidence) {
      sections.push(`- [${e.type}] ${e.source}: ${e.detail}`);
    }
  }

  return sections.join("\n");
}

import type { Checkpoint, GitState, Evidence, CommitInfo } from "./types.js";

export interface LlmConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface SynthesisInput {
  checkpoint: Checkpoint | null;
  currentState: GitState;
  commitsSinceCheckpoint: CommitInfo[];
  evidence: Evidence[];
  projectName: string;
}

export interface StructuredContext {
  whereYouLeftOff: string;
  whatChanged: string;
  whatsNext: string[];
  whatsDone: string[];
  decisions: string[];
  oneLinerSummary: string;
}

function getConfig(): LlmConfig | null {
  const baseUrl = process.env.GITBACK_LLM_BASE_URL;
  if (!baseUrl) return null;

  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    apiKey: process.env.GITBACK_LLM_API_KEY || "",
    model: process.env.GITBACK_LLM_MODEL || "llama3.1:8b",
  };
}

export async function isLlmAvailable(): Promise<boolean> {
  const config = getConfig();
  if (!config) return false;

  try {
    const res = await fetch(`${config.baseUrl}/models`, {
      method: "GET",
      headers: config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {},
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function chatCompletion(
  config: LlmConfig,
  messages: { role: string; content: string }[],
  maxTokens: number
): Promise<string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (config.apiKey) headers["Authorization"] = `Bearer ${config.apiKey}`;

  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: config.model,
      messages,
      max_tokens: maxTokens,
      temperature: 0.3,
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`LLM request failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

export async function synthesizeResumeBriefing(
  input: SynthesisInput
): Promise<string | null> {
  const config = getConfig();
  if (!config) return null;

  const prompt = buildPrompt(input);
  return chatCompletion(config, [{ role: "user", content: prompt }], 1500);
}

export async function synthesizeStructuredContext(
  input: SynthesisInput
): Promise<StructuredContext | null> {
  const config = getConfig();
  if (!config) return null;

  const prompt = buildStructuredPrompt(input);
  const text = await chatCompletion(config, [{ role: "user", content: prompt }], 2000);

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  return JSON.parse(jsonMatch[0]) as StructuredContext;
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

function buildStructuredPrompt(input: SynthesisInput): string {
  const { checkpoint, currentState, commitsSinceCheckpoint, projectName } = input;

  const contextLines: string[] = [];

  if (checkpoint) {
    contextLines.push(
      `Developer's last checkpoint (${checkpoint.timestamp}):`,
      `Note: "${checkpoint.explicitNote}"`,
      `Branch: ${checkpoint.branch}`,
      `Commit: ${checkpoint.commitSha.slice(0, 7)} — ${checkpoint.commitMessage}`,
      `Tags: ${checkpoint.tags.length > 0 ? checkpoint.tags.join(", ") : "none"}`,
      ""
    );
    if (checkpoint.todos.length > 0) {
      contextLines.push("TODOs at checkpoint:");
      for (const todo of checkpoint.todos) {
        contextLines.push(`- ${todo.type} in ${todo.file}:${todo.line}: ${todo.text}`);
      }
      contextLines.push("");
    }
    if (checkpoint.changedFiles.length > 0) {
      contextLines.push("Files changed at checkpoint:");
      for (const f of checkpoint.changedFiles) {
        contextLines.push(`- ${f.status}: ${f.path}`);
      }
      contextLines.push("");
    }
  }

  contextLines.push(
    "Current repository state:",
    `Branch: ${currentState.branch}`,
    `Latest commit: ${currentState.commitSha.slice(0, 7)} — ${currentState.commitMessage}`,
    `Modified files: ${currentState.modifiedFiles.map(f => f.path).join(", ") || "none"}`,
    `Staged files: ${currentState.stagedFiles.map(f => f.path).join(", ") || "none"}`,
    `Untracked files: ${currentState.untrackedFiles.slice(0, 10).join(", ") || "none"}`,
    ""
  );

  if (commitsSinceCheckpoint.length > 0) {
    contextLines.push("Commits since checkpoint:");
    for (const c of commitsSinceCheckpoint) {
      contextLines.push(`- ${c.sha.slice(0, 7)} ${c.message}`);
    }
    contextLines.push("");
  }

  return `You are GitBack, a development memory assistant. Analyze this development context for project "${projectName}" and return a JSON object.

${contextLines.join("\n")}

Return ONLY a valid JSON object with these fields:
{
  "whereYouLeftOff": "2-3 sentence narrative of what the developer was working on, from their own words and observed state. Use second person.",
  "whatChanged": "Brief description of what changed since the checkpoint (commits, file changes). Use second person. If nothing changed, say so.",
  "whatsNext": ["Prioritized actionable next step 1", "Next step 2", "Next step 3"],
  "whatsDone": ["Completed item 1 with evidence", "Completed item 2"],
  "decisions": ["Key decision or approach noted by the developer"],
  "oneLinerSummary": "One sentence project summary for a dashboard card"
}

Be specific. Reference file names where possible. Base conclusions on the evidence provided. Do not hallucinate files or features not mentioned in the context.`;
}

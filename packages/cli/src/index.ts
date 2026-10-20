#!/usr/bin/env node

import {
  createCheckpoint,
  saveCheckpointLocal,
  loadLatestCheckpointLocal,
  listCheckpointsLocal,
  resolveProject,
  getGitState,
  getGitDiffSummary,
  getCommitsSince,
  gatherEvidence,
  isGitRepo,
  synthesizeResumeBriefing,
  isLlmAvailable,
} from "gitback-core";
import type { Evidence } from "gitback-core";

const HELP = `
gitback — persistent development memory

Usage:
  gitback remember <note> [--tags tag1,tag2]   Save a checkpoint
  gitback resume [--full]                       Pick up where you left off
  gitback compare                               What changed since last checkpoint
  gitback status                                List tracked projects
  gitback config [show|set|unset|path]          Manage LLM provider config
  gitback help                                  Show this help

Environment:
  GITBACK_LLM_BASE_URL   OpenAI-compatible endpoint (Ollama, OpenRouter, etc.)
  GITBACK_LLM_API_KEY    API key (optional, not needed for Ollama)
  GITBACK_LLM_MODEL      Model name (default: llama3.1:8b)
`.trim();

function formatTimeSince(isoDate: string): string {
  const ms = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatEvidence(evidence: Evidence[]): string {
  return evidence.map((e) => `  [${e.type}] ${e.source}: ${e.detail}`).join("\n");
}

async function cmdRemember(args: string[]) {
  if (!isGitRepo()) {
    console.error("Error: Not inside a git repository.");
    process.exit(1);
  }

  let note = "";
  let tags: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--tags" && args[i + 1]) {
      tags = args[i + 1].split(",").map((t) => t.trim());
      i++;
    } else if (!note) {
      note = args[i];
    }
  }

  if (!note) {
    console.error("Error: Please provide a note. Example:");
    console.error('  gitback remember "Working on auth, login endpoint done, refresh tokens next"');
    process.exit(1);
  }

  const project = resolveProject();
  const checkpoint = createCheckpoint(note, tags);
  saveCheckpointLocal(checkpoint);

  const fileCount =
    checkpoint.gitStatus.modified.length +
    checkpoint.gitStatus.staged.length +
    checkpoint.gitStatus.untracked.length;

  console.log(`\nCheckpoint saved for ${project.repoFullName}`);
  console.log(`  ID:       ${checkpoint.checkpointId.slice(0, 8)}`);
  console.log(`  Branch:   ${checkpoint.branch}`);
  console.log(`  Commit:   ${checkpoint.commitSha.slice(0, 7)} — ${checkpoint.commitMessage}`);
  console.log(`  Files:    ${fileCount} changed`);
  console.log(`  TODOs:    ${checkpoint.todos.length} found`);
  console.log(`  Note:     "${note}"`);
  console.log(`\nResume later with: gitback resume`);
}

async function cmdResume(args: string[]) {
  if (!isGitRepo()) {
    console.error("Error: Not inside a git repository.");
    process.exit(1);
  }

  const full = args.includes("--full");
  const project = resolveProject();
  const currentState = getGitState();
  const checkpoint = loadLatestCheckpointLocal(project.projectId);

  if (!checkpoint) {
    console.log(`\nNo checkpoint found for ${project.repoFullName}.`);
    console.log(`  Branch: ${currentState.branch}`);
    console.log(`  Commit: ${currentState.commitSha.slice(0, 7)} — ${currentState.commitMessage}`);
    console.log(`\nUse 'gitback remember "..."' to save your first checkpoint.`);
    return;
  }

  const newCommits = getCommitsSince(currentState.recentCommits, checkpoint.commitSha);
  const evidence = gatherEvidence(checkpoint, currentState, newCommits);

  const llmReady = await isLlmAvailable();
  if (llmReady) {
    try {
      const briefing = await synthesizeResumeBriefing({
        checkpoint,
        currentState,
        commitsSinceCheckpoint: newCommits,
        evidence,
        projectName: project.repoFullName,
      });
      if (briefing) {
        console.log(`\n${briefing}`);
        return;
      }
    } catch {
      // LLM failed — fall through to structured output
    }
  }

  console.log(`\n=== ${project.repoFullName} ===\n`);

  console.log(`WHERE YOU LEFT OFF`);
  console.log(`  ${formatTimeSince(checkpoint.timestamp)} (${new Date(checkpoint.timestamp).toLocaleString()})`);
  console.log(`  "${checkpoint.explicitNote}"`);
  console.log(`  Branch: ${checkpoint.branch}`);
  console.log(`  Commit: ${checkpoint.commitSha.slice(0, 7)} — ${checkpoint.commitMessage}`);

  console.log(`\nWHAT CHANGED SINCE THEN`);
  if (newCommits.length > 0) {
    console.log(`  ${newCommits.length} new commit${newCommits.length > 1 ? "s" : ""}:`);
    for (const c of newCommits) {
      console.log(`    ${c.sha.slice(0, 7)} ${c.message}`);
    }
  } else {
    console.log(`  No new commits since checkpoint.`);
  }

  const fileCount =
    currentState.modifiedFiles.length +
    currentState.stagedFiles.length +
    currentState.untrackedFiles.length;

  if (fileCount > 0) {
    console.log(`  ${fileCount} uncommitted file${fileCount > 1 ? "s" : ""}:`);
    for (const f of currentState.modifiedFiles) console.log(`    M ${f.path}`);
    for (const f of currentState.stagedFiles) console.log(`    A ${f.path}`);
    for (const f of currentState.untrackedFiles.slice(0, 10)) console.log(`    ? ${f}`);
  }

  if (full) {
    const diffSummary = getGitDiffSummary(checkpoint.commitSha);
    console.log(`\nDIFF SUMMARY`);
    console.log(`  ${diffSummary.split("\n").join("\n  ")}`);
  }

  if (checkpoint.todos.length > 0) {
    console.log(`\nTODOs FROM LAST SESSION`);
    for (const todo of checkpoint.todos) {
      console.log(`  ${todo.type} ${todo.file}:${todo.line} — ${todo.text}`);
    }
  }

  console.log(`\nEVIDENCE`);
  console.log(formatEvidence(evidence));

  if (!llmReady) {
    console.log(`\nTip: Set GITBACK_LLM_BASE_URL for AI-powered briefings.`);
  }
}

async function cmdCompare() {
  if (!isGitRepo()) {
    console.error("Error: Not inside a git repository.");
    process.exit(1);
  }

  const project = resolveProject();
  const checkpoint = loadLatestCheckpointLocal(project.projectId);

  if (!checkpoint) {
    console.log("No checkpoint found. Use 'gitback remember' first.");
    return;
  }

  const currentState = getGitState();
  const newCommits = getCommitsSince(currentState.recentCommits, checkpoint.commitSha);
  const diffSummary = getGitDiffSummary(checkpoint.commitSha);

  console.log(`\nChanges since checkpoint (${new Date(checkpoint.timestamp).toLocaleString()})`);
  console.log(`  Note: "${checkpoint.explicitNote}"`);
  console.log(`  Branch: ${checkpoint.branch} → ${currentState.branch}`);
  console.log(`  Commit: ${checkpoint.commitSha.slice(0, 7)} → ${currentState.commitSha.slice(0, 7)}`);

  if (newCommits.length > 0) {
    console.log(`\n  ${newCommits.length} new commit${newCommits.length > 1 ? "s" : ""}:`);
    for (const c of newCommits) {
      console.log(`    ${c.sha.slice(0, 7)} ${c.message}`);
      if (c.filesChanged.length > 0) {
        console.log(`      Files: ${c.filesChanged.join(", ")}`);
      }
    }
  } else {
    console.log(`\n  No new commits.`);
  }

  console.log(`\n  Diff:`);
  console.log(`    ${diffSummary.split("\n").join("\n    ")}`);
}

async function cmdStatus() {
  const homeDir = process.env.HOME || process.env.USERPROFILE || "";
  const { readdirSync, readFileSync, existsSync } = await import("node:fs");
  const { join } = await import("node:path");

  const projectsDir = join(homeDir, ".gitback", "projects");
  if (!existsSync(projectsDir)) {
    console.log("\nNo projects tracked yet.");
    console.log('Use \'gitback remember "..."\' in any git repo to start.');
    return;
  }

  const projectDirs = readdirSync(projectsDir);
  if (projectDirs.length === 0) {
    console.log("\nNo projects tracked yet.");
    return;
  }

  console.log(`\n${projectDirs.length} project${projectDirs.length > 1 ? "s" : ""} tracked:\n`);

  for (const dir of projectDirs) {
    const cpDir = join(projectsDir, dir, "checkpoints");
    if (!existsSync(cpDir)) continue;

    const files = readdirSync(cpDir).filter((f) => f.endsWith(".json")).sort().reverse();
    if (files.length === 0) continue;

    try {
      const content = readFileSync(join(cpDir, files[0]), "utf-8");
      const cp = JSON.parse(content);

      const ms = Date.now() - new Date(cp.timestamp).getTime();
      const days = ms / 86400000;
      let status = "Active";
      if (days > 21) status = "Dormant";
      else if (days > 7) status = "Stalling";

      const name = cp.projectId ? dir : dir;
      console.log(`  ${cp.branch ? cp.explicitNote?.slice(0, 60) : dir}`);
      console.log(`    [${status}] Last checkpoint: ${formatTimeSince(cp.timestamp)}`);
      console.log(`    Branch: ${cp.branch || "unknown"}  |  ${files.length} checkpoint${files.length > 1 ? "s" : ""}`);
      console.log();
    } catch {
      continue;
    }
  }
}

interface GitBackConfig {
  llm?: {
    baseUrl?: string;
    apiKey?: string;
    model?: string;
  };
}

function getConfigPath(): string {
  const homeDir = process.env.HOME || process.env.USERPROFILE || "";
  return `${homeDir}/.gitback/config.json`;
}

async function loadConfig(): Promise<GitBackConfig> {
  const { readFileSync, existsSync } = await import("node:fs");
  const configPath = getConfigPath();
  if (!existsSync(configPath)) return {};
  try {
    return JSON.parse(readFileSync(configPath, "utf-8"));
  } catch {
    return {};
  }
}

async function saveConfig(config: GitBackConfig): Promise<void> {
  const { writeFileSync, mkdirSync } = await import("node:fs");
  const { dirname } = await import("node:path");
  const configPath = getConfigPath();
  mkdirSync(dirname(configPath), { recursive: true });
  writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
}

async function cmdConfig(args: string[]) {
  const subcommand = args[0];

  if (!subcommand || subcommand === "show") {
    const config = await loadConfig();
    const llm = config.llm || {};

    const baseUrl = process.env.GITBACK_LLM_BASE_URL || llm.baseUrl;
    const apiKey = process.env.GITBACK_LLM_API_KEY || llm.apiKey;
    const model = process.env.GITBACK_LLM_MODEL || llm.model;

    console.log(`\nGitBack Configuration`);
    console.log(`  Config file: ${getConfigPath()}\n`);
    console.log(`  LLM Provider:`);
    console.log(`    Base URL:  ${baseUrl || "(not set)"}`);
    console.log(`    API Key:   ${apiKey ? apiKey.slice(0, 8) + "..." : "(not set)"}`);
    console.log(`    Model:     ${model || "(not set — defaults to llama3.1:8b)"}`);

    if (process.env.GITBACK_LLM_BASE_URL) {
      console.log(`\n  Note: Environment variables override config file values.`);
    }
    return;
  }

  if (subcommand === "set") {
    const key = args[1];
    const value = args[2];

    const validKeys: Record<string, [keyof GitBackConfig, string]> = {
      "llm.base-url": ["llm", "baseUrl"],
      "llm.api-key": ["llm", "apiKey"],
      "llm.model": ["llm", "model"],
    };

    if (!key || !value) {
      console.error("Usage: gitback config set <key> <value>");
      console.error("\nAvailable keys:");
      console.error("  llm.base-url   OpenAI-compatible API endpoint");
      console.error("  llm.api-key    API key (not needed for Ollama)");
      console.error("  llm.model      Model name (e.g. llama3.1:8b, gpt-4o)");
      process.exit(1);
    }

    const mapping = validKeys[key];
    if (!mapping) {
      console.error(`Unknown config key: ${key}`);
      console.error(`Valid keys: ${Object.keys(validKeys).join(", ")}`);
      process.exit(1);
    }

    const config = await loadConfig();
    const [section, field] = mapping;
    if (!config[section]) (config as any)[section] = {};
    (config[section] as any)[field] = value;
    await saveConfig(config);

    const displayValue = key === "llm.api-key" ? value.slice(0, 8) + "..." : value;
    console.log(`Set ${key} = ${displayValue}`);
    return;
  }

  if (subcommand === "unset") {
    const key = args[1];
    if (!key) {
      console.error("Usage: gitback config unset <key>");
      process.exit(1);
    }

    const config = await loadConfig();
    if (key === "llm.base-url" && config.llm) delete config.llm.baseUrl;
    else if (key === "llm.api-key" && config.llm) delete config.llm.apiKey;
    else if (key === "llm.model" && config.llm) delete config.llm.model;
    else {
      console.error(`Unknown config key: ${key}`);
      process.exit(1);
    }

    await saveConfig(config);
    console.log(`Unset ${key}`);
    return;
  }

  if (subcommand === "path") {
    console.log(getConfigPath());
    return;
  }

  console.error(`Unknown config subcommand: ${subcommand}`);
  console.error("Usage: gitback config [show|set|unset|path]");
  process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case "remember":
      await cmdRemember(args.slice(1));
      break;
    case "resume":
      await cmdResume(args.slice(1));
      break;
    case "compare":
      await cmdCompare();
      break;
    case "status":
      await cmdStatus();
      break;
    case "config":
      await cmdConfig(args.slice(1));
      break;
    case "help":
    case "--help":
    case "-h":
    case undefined:
      console.log(HELP);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.log(HELP);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});

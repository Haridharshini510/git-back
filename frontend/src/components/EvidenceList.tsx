const typeConfig: Record<string, { bg: string; text: string }> = {
  CHECKPOINT: { bg: "bg-purple-500/15 border border-purple-500/20", text: "text-purple-300" },
  COMMIT: { bg: "bg-blue-500/15 border border-blue-500/20", text: "text-blue-300" },
  DIFF: { bg: "bg-orange-500/15 border border-orange-500/20", text: "text-orange-300" },
  FILE: { bg: "bg-green-500/15 border border-green-500/20", text: "text-green-300" },
  TODO: { bg: "bg-yellow-500/15 border border-yellow-500/20", text: "text-yellow-300" },
  BRANCH: { bg: "bg-zinc-500/15 border border-zinc-500/20", text: "text-zinc-300" },
};

export function EvidenceList({
  checkpoint,
}: {
  checkpoint: {
    branch: string;
    explicitNote: string;
    timestamp: string;
    changedFiles: { path: string; status: string }[];
    todos: { file: string; line: number; text: string; type: string }[];
    recentCommits: { sha: string; message: string }[];
  };
}) {
  const items: { type: string; source: string; detail: string }[] = [];

  items.push({
    type: "CHECKPOINT",
    source: new Date(checkpoint.timestamp).toLocaleString(),
    detail: checkpoint.explicitNote,
  });

  items.push({
    type: "BRANCH",
    source: "Current branch",
    detail: checkpoint.branch,
  });

  for (const c of checkpoint.recentCommits.slice(0, 3)) {
    items.push({
      type: "COMMIT",
      source: c.sha.slice(0, 7),
      detail: c.message,
    });
  }

  for (const f of checkpoint.changedFiles.slice(0, 5)) {
    items.push({
      type: "DIFF",
      source: f.path,
      detail: f.status,
    });
  }

  for (const t of checkpoint.todos) {
    items.push({
      type: "TODO",
      source: `${t.file}:${t.line}`,
      detail: `${t.type}: ${t.text}`,
    });
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const config = typeConfig[item.type] || typeConfig.FILE;
        return (
          <div key={i} className="flex items-start gap-3 text-sm py-1.5">
            <span className={`shrink-0 text-xs font-mono font-medium px-2 py-0.5 rounded-md ${config.bg} ${config.text}`}>
              {item.type}
            </span>
            <span className="text-zinc-500 shrink-0 font-mono text-xs pt-0.5">
              {item.source}
            </span>
            <span className="text-zinc-300 pt-0.5">{item.detail}</span>
          </div>
        );
      })}
    </div>
  );
}

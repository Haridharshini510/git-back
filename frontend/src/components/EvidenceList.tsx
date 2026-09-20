const typeColors: Record<string, string> = {
  CHECKPOINT: "bg-purple-100 text-purple-800",
  COMMIT: "bg-blue-100 text-blue-800",
  DIFF: "bg-orange-100 text-orange-800",
  FILE: "bg-green-100 text-green-800",
  TODO: "bg-yellow-100 text-yellow-800",
  BRANCH: "bg-gray-100 text-gray-800",
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
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-3 text-sm">
          <span
            className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded ${
              typeColors[item.type] || typeColors.FILE
            }`}
          >
            {item.type}
          </span>
          <span className="text-gray-500 shrink-0 font-mono text-xs">
            {item.source}
          </span>
          <span className="text-gray-700">{item.detail}</span>
        </div>
      ))}
    </div>
  );
}

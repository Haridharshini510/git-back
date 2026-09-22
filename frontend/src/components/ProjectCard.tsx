import type { ProjectRecord } from "../api/client";

const statusConfig: Record<string, { bg: string; dot: string; text: string }> = {
  Active: { bg: "bg-green-500/10 border-green-500/20", dot: "bg-green-400", text: "text-green-400" },
  Stalling: { bg: "bg-yellow-500/10 border-yellow-500/20", dot: "bg-yellow-400", text: "text-yellow-400" },
  Dormant: { bg: "bg-red-500/10 border-red-500/20", dot: "bg-red-400", text: "text-red-400" },
};

function timeAgo(iso: string | null): string {
  if (!iso) return "never";
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

export function ProjectCard({
  project,
  onClick,
}: {
  project: ProjectRecord;
  onClick: () => void;
}) {
  const status = statusConfig[project.activityStatus] || statusConfig.Dormant;

  return (
    <button
      onClick={onClick}
      className="w-full text-left group rounded-xl bg-zinc-900 border border-zinc-800 p-5 hover:border-zinc-700 hover:bg-zinc-900/80 transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-mono font-medium text-sm text-zinc-200 group-hover:text-white transition-colors">
          {project.repoFullName}
        </h3>
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${status.bg}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
          <span className={status.text}>{project.activityStatus}</span>
        </span>
      </div>
      <p className="text-zinc-500 text-sm mb-4 line-clamp-2 leading-relaxed">
        {project.summary || "No context yet"}
      </p>
      <div className="flex items-center gap-2 text-xs text-zinc-600">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {timeAgo(project.lastCheckpointAt)}
      </div>
    </button>
  );
}

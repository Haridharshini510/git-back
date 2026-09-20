import type { ProjectRecord } from "../api/client";

const statusColors: Record<string, string> = {
  Active: "bg-green-100 text-green-800",
  Stalling: "bg-yellow-100 text-yellow-800",
  Dormant: "bg-red-100 text-red-800",
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
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-lg text-gray-900">
          {project.repoFullName}
        </h3>
        <span
          className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
            statusColors[project.activityStatus] || statusColors.Dormant
          }`}
        >
          {project.activityStatus}
        </span>
      </div>
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {project.summary || "No context yet"}
      </p>
      <div className="text-xs text-gray-400">
        Last checkpoint: {timeAgo(project.lastCheckpointAt)}
      </div>
    </button>
  );
}

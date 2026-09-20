import { useEffect, useState } from "react";
import { listProjects, type ProjectRecord } from "../api/client";
import { ProjectCard } from "../components/ProjectCard";

export function Dashboard({
  onSelectProject,
}: {
  onSelectProject: (id: string) => void;
}) {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listProjects()
      .then(setProjects)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">GitBack</h1>
          <p className="text-sm text-gray-500">
            Your coding agent knows your code. GitBack remembers your journey.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {loading && (
          <div className="text-center py-12 text-gray-500">Loading projects...</div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>
        )}

        {!loading && !error && projects.length === 0 && (
          <div className="text-center py-16">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              No projects yet
            </h2>
            <p className="text-gray-500">
              Use <code className="bg-gray-100 px-2 py-0.5 rounded">gitback_remember</code> in
              your coding agent to save your first checkpoint.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <ProjectCard
              key={p.projectId}
              project={p}
              onClick={() => onSelectProject(p.projectId)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

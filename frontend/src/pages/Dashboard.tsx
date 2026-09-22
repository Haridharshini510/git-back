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
    <div className="min-h-screen bg-zinc-950">
      <header className="relative overflow-hidden border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-purple-600/10" />
        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-lg">G</div>
            <h1 className="text-3xl font-bold text-white tracking-tight">GitBack</h1>
          </div>
          <p className="text-lg text-zinc-400 max-w-xl mb-10">
            Your coding agent knows your code. GitBack remembers your journey.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl bg-zinc-900/80 border border-zinc-800 p-5 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="font-semibold text-sm text-blue-400">Remember</span>
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed">Save your intent, decisions, and progress as development checkpoints.</p>
            </div>
            <div className="rounded-xl bg-zinc-900/80 border border-zinc-800 p-5 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="font-semibold text-sm text-green-400">Resume</span>
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed">Get an AI-powered briefing combining saved context with current state.</p>
            </div>
            <div className="rounded-xl bg-zinc-900/80 border border-zinc-800 p-5 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-purple-400" />
                <span className="font-semibold text-sm text-purple-400">Compare</span>
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed">See exactly what changed since your last checkpoint, with evidence.</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Your Projects</h2>
          {!loading && projects.length > 0 && (
            <span className="text-xs text-zinc-600">{projects.length} tracked</span>
          )}
        </div>

        {loading && (
          <div className="text-center py-20">
            <div className="inline-block w-6 h-6 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin mb-3" />
            <p className="text-sm text-zinc-500">Loading projects...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
            {error}
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-zinc-600">+</span>
            </div>
            <h3 className="text-lg font-semibold text-zinc-300 mb-2">
              No projects yet
            </h3>
            <p className="text-zinc-500 text-sm max-w-sm mx-auto">
              Use <code className="bg-zinc-800 text-blue-400 px-2 py-0.5 rounded text-xs">gitback_remember</code> in your coding agent to save your first checkpoint.
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

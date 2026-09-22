import { useEffect, useState } from "react";
import { getProject, type ProjectRecord, type Checkpoint, type ContextSnapshot } from "../api/client";
import { SectionCard } from "../components/SectionCard";
import { EvidenceList } from "../components/EvidenceList";

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const statusDot: Record<string, string> = {
  Active: "bg-green-400",
  Stalling: "bg-yellow-400",
  Dormant: "bg-red-400",
};

export function ResumeView({
  projectId,
  onBack,
}: {
  projectId: string;
  onBack: () => void;
}) {
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [context, setContext] = useState<ContextSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProject(projectId)
      .then((data) => {
        setProject(data.project);
        setCheckpoints(data.checkpoints);
        setContext(data.context);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="inline-block w-6 h-6 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  const latest = checkpoints[0] || null;

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-zinc-500 text-sm hover:text-zinc-300 transition-colors mb-4"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-white font-mono">
              {project?.repoFullName || projectId}
            </h1>
            {project?.activityStatus && (
              <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
                <span className={`w-2 h-2 rounded-full ${statusDot[project.activityStatus] || statusDot.Dormant}`} />
                {project.activityStatus}
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-500">
            {project?.summary || "No summary available"}
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {!latest ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-zinc-600">?</span>
            </div>
            <h3 className="text-lg font-semibold text-zinc-300 mb-2">No checkpoints yet</h3>
            <p className="text-zinc-500 text-sm">
              Use <code className="bg-zinc-800 text-blue-400 px-2 py-0.5 rounded text-xs">gitback_remember</code> to save your first checkpoint.
            </p>
          </div>
        ) : (
          <>
            <SectionCard title="Where You Left Off">
              <div className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {timeAgo(latest.timestamp)} &mdash; {new Date(latest.timestamp).toLocaleString()}
              </div>
              {context?.whereYouLeftOff && (
                <p className="text-zinc-300 text-sm mb-3 leading-relaxed">{context.whereYouLeftOff}</p>
              )}
              <blockquote className="border-l-2 border-blue-500/40 pl-4 py-2 bg-blue-500/5 rounded-r-lg text-zinc-300 text-sm italic">
                {latest.explicitNote}
              </blockquote>
              <div className="mt-4 flex flex-wrap gap-3 text-xs">
                <span className="inline-flex items-center gap-1.5 bg-zinc-800 text-zinc-400 px-2.5 py-1 rounded-md">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <code className="font-mono">{latest.branch}</code>
                </span>
                <span className="inline-flex items-center gap-1.5 bg-zinc-800 text-zinc-400 px-2.5 py-1 rounded-md">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  <code className="font-mono">{latest.commitSha?.slice(0, 7)}</code>
                </span>
                {latest.tags && latest.tags.length > 0 && latest.tags.map((tag) => (
                  <span key={tag} className="bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2.5 py-1 rounded-md font-mono">
                    {tag}
                  </span>
                ))}
              </div>
            </SectionCard>

            {context?.whatChanged && (
              <SectionCard title="What Changed Since Then">
                <p className="text-zinc-300 text-sm leading-relaxed">{context.whatChanged}</p>
              </SectionCard>
            )}

            {context?.whatsNext && context.whatsNext.length > 0 && (
              <SectionCard title="What's Next">
                <ol className="space-y-3">
                  {context.whatsNext.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center text-xs font-mono">
                        {i + 1}
                      </span>
                      <span className="text-zinc-300 pt-0.5 leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </SectionCard>
            )}

            {context?.whatsDone && context.whatsDone.length > 0 && (
              <SectionCard title="What's Done">
                <ul className="space-y-2.5">
                  {context.whatsDone.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="shrink-0 w-5 h-5 rounded bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center mt-0.5">
                        <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      <span className="text-zinc-300 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}

            {context?.decisions && context.decisions.length > 0 && (
              <SectionCard title="Decisions & Memory">
                <ul className="space-y-2.5">
                  {context.decisions.map((decision, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-purple-400 mt-2" />
                      <span className="text-zinc-300 leading-relaxed">{decision}</span>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}

            {latest.gitStatus &&
              (latest.gitStatus.modified?.length > 0 ||
                latest.gitStatus.staged?.length > 0 ||
                latest.gitStatus.untracked?.length > 0) && (
                <SectionCard title="Files at Checkpoint">
                  <div className="space-y-1 text-sm font-mono">
                    {(latest.gitStatus.modified || []).map((f) => (
                      <div key={f.path} className="text-orange-400/80">
                        <span className="text-orange-400 font-semibold">M</span> {f.path}
                      </div>
                    ))}
                    {(latest.gitStatus.staged || []).map((f) => (
                      <div key={f.path} className="text-green-400/80">
                        <span className="text-green-400 font-semibold">A</span> {f.path}
                      </div>
                    ))}
                    {(latest.gitStatus.untracked || []).map((f) => (
                      <div key={f} className="text-zinc-600">
                        <span className="text-zinc-500 font-semibold">?</span> {f}
                      </div>
                    ))}
                  </div>
                </SectionCard>
              )}

            {latest.todos && latest.todos.length > 0 && (
              <SectionCard title="TODOs">
                <div className="space-y-2.5">
                  {latest.todos.map((todo, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <span className="shrink-0 bg-yellow-500/15 border border-yellow-500/20 text-yellow-300 text-xs font-mono px-2 py-0.5 rounded-md">
                        {todo.type}
                      </span>
                      <code className="text-xs text-zinc-500 font-mono pt-0.5">
                        {todo.file}:{todo.line}
                      </code>
                      <span className="text-zinc-300 pt-0.5">{todo.text}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {latest.recentCommits && latest.recentCommits.length > 0 && (
              <SectionCard title="Recent Commits">
                <div className="space-y-2">
                  {latest.recentCommits.slice(0, 5).map((c) => (
                    <div key={c.sha} className="flex items-start gap-3 text-sm">
                      <code className="text-xs text-blue-400/70 font-mono shrink-0 pt-0.5">
                        {c.sha.slice(0, 7)}
                      </code>
                      <span className="text-zinc-300">{c.message}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            <SectionCard title="Evidence">
              <EvidenceList checkpoint={latest} />
            </SectionCard>

            {checkpoints.length > 1 && (
              <SectionCard title="Checkpoint History">
                <div className="space-y-0">
                  {checkpoints.map((cp, i) => (
                    <div
                      key={cp.checkpointId}
                      className={`relative pl-6 py-3 ${i < checkpoints.length - 1 ? "border-l border-zinc-800" : ""}`}
                    >
                      <div className="absolute left-0 top-4 w-2 h-2 rounded-full bg-zinc-700 -translate-x-[4.5px]" />
                      <div className="text-xs text-zinc-600 font-mono">
                        {timeAgo(cp.timestamp)} &mdash; {cp.branch}
                      </div>
                      <div className="text-sm text-zinc-400 mt-1">
                        {cp.explicitNote}
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </>
        )}
      </main>
    </div>
  );
}

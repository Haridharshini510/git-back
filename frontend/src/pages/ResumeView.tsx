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
    return <div className="p-8 text-gray-500">Loading...</div>;
  }

  const latest = checkpoints[0] || null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button
            onClick={onBack}
            className="text-blue-600 text-sm hover:underline mb-2"
          >
            &larr; Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {project?.repoFullName || projectId}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {project?.summary || "No summary available"}
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {!latest ? (
          <div className="text-center py-12 text-gray-500">
            No checkpoints yet. Use <code>gitback_remember</code> to save your
            first checkpoint.
          </div>
        ) : (
          <>
            <SectionCard title="Where You Left Off">
              <div className="text-sm text-gray-500 mb-2">
                {timeAgo(latest.timestamp)} &mdash;{" "}
                {new Date(latest.timestamp).toLocaleString()}
              </div>
              {context?.whereYouLeftOff && (
                <p className="text-gray-700 text-sm mb-3">{context.whereYouLeftOff}</p>
              )}
              <blockquote className="border-l-4 border-blue-400 pl-4 py-2 bg-blue-50 rounded-r text-gray-800 text-sm">
                {latest.explicitNote}
              </blockquote>
              <div className="mt-3 flex gap-4 text-xs text-gray-500">
                <span>
                  Branch:{" "}
                  <code className="bg-gray-100 px-1 rounded">
                    {latest.branch}
                  </code>
                </span>
                <span>
                  Commit:{" "}
                  <code className="bg-gray-100 px-1 rounded">
                    {latest.commitSha?.slice(0, 7)}
                  </code>
                </span>
                {latest.tags && latest.tags.length > 0 && (
                  <span>Tags: {latest.tags.join(", ")}</span>
                )}
              </div>
            </SectionCard>

            {/* AI-Generated: What Changed Since Then */}
            {context?.whatChanged && (
              <SectionCard title="What Changed Since Then">
                <p className="text-gray-700 text-sm">{context.whatChanged}</p>
              </SectionCard>
            )}

            {/* AI-Generated: What's Next */}
            {context?.whatsNext && context.whatsNext.length > 0 && (
              <SectionCard title="What's Next">
                <ol className="list-decimal list-inside space-y-2">
                  {context.whatsNext.map((step, i) => (
                    <li key={i} className="text-sm text-gray-700">
                      {step}
                    </li>
                  ))}
                </ol>
              </SectionCard>
            )}

            {/* AI-Generated: What's Done */}
            {context?.whatsDone && context.whatsDone.length > 0 && (
              <SectionCard title="What's Done">
                <ul className="space-y-2">
                  {context.whatsDone.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 shrink-0 mt-0.5">&#10003;</span>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}

            {/* AI-Generated: Decisions & Memory */}
            {context?.decisions && context.decisions.length > 0 && (
              <SectionCard title="Decisions & Memory">
                <ul className="space-y-2">
                  {context.decisions.map((decision, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-blue-400 shrink-0 mt-0.5">&#9679;</span>
                      <span className="text-gray-700">{decision}</span>
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
                      <div key={f.path} className="text-orange-600">
                        M {f.path}
                      </div>
                    ))}
                    {(latest.gitStatus.staged || []).map((f) => (
                      <div key={f.path} className="text-green-600">
                        A {f.path}
                      </div>
                    ))}
                    {(latest.gitStatus.untracked || []).map((f) => (
                      <div key={f} className="text-gray-400">
                        ? {f}
                      </div>
                    ))}
                  </div>
                </SectionCard>
              )}

            {latest.todos && latest.todos.length > 0 && (
              <SectionCard title="TODOs">
                <div className="space-y-2">
                  {latest.todos.map((todo, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded">
                        {todo.type}
                      </span>
                      <code className="text-xs text-gray-500">
                        {todo.file}:{todo.line}
                      </code>
                      <span className="text-gray-700">{todo.text}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {latest.recentCommits && latest.recentCommits.length > 0 && (
              <SectionCard title="Recent Commits">
                <div className="space-y-2">
                  {latest.recentCommits.slice(0, 5).map((c) => (
                    <div
                      key={c.sha}
                      className="flex items-start gap-2 text-sm"
                    >
                      <code className="text-xs text-gray-400 shrink-0">
                        {c.sha.slice(0, 7)}
                      </code>
                      <span className="text-gray-700">{c.message}</span>
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
                <div className="space-y-3">
                  {checkpoints.map((cp) => (
                    <div
                      key={cp.checkpointId}
                      className="border-l-2 border-gray-200 pl-4 py-1"
                    >
                      <div className="text-xs text-gray-400">
                        {timeAgo(cp.timestamp)} &mdash; {cp.branch}
                      </div>
                      <div className="text-sm text-gray-700 mt-0.5">
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

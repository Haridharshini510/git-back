const iconMap: Record<string, { color: string; icon: string }> = {
  "Where You Left Off": { color: "text-blue-400 border-blue-500/30", icon: "M9 5l7 7-7 7" },
  "What Changed Since Then": { color: "text-orange-400 border-orange-500/30", icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" },
  "What's Next": { color: "text-green-400 border-green-500/30", icon: "M13 7l5 5m0 0l-5 5m5-5H6" },
  "What's Done": { color: "text-emerald-400 border-emerald-500/30", icon: "M5 13l4 4L19 7" },
  "Decisions & Memory": { color: "text-purple-400 border-purple-500/30", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" },
  "Files at Checkpoint": { color: "text-zinc-400 border-zinc-700", icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" },
  "TODOs": { color: "text-yellow-400 border-yellow-500/30", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  "Recent Commits": { color: "text-blue-300 border-blue-500/30", icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" },
  "Evidence": { color: "text-amber-400 border-amber-500/30", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
  "Checkpoint History": { color: "text-zinc-400 border-zinc-700", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
};

export function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const config = iconMap[title] || { color: "text-zinc-400 border-zinc-700", icon: "M4 6h16M4 12h16M4 18h16" };
  const [colorClass, borderClass] = config.color.split(" ");

  return (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-4 border-l-2 ${borderClass || "border-l-zinc-700"}`}>
      <div className="flex items-center gap-2.5 mb-4">
        <svg className={`w-4.5 h-4.5 ${colorClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d={config.icon} />
        </svg>
        <h2 className={`text-sm font-semibold uppercase tracking-wider ${colorClass}`}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

import type { TrainingConsistencySummary } from "@/lib/trainingConsistency";

type TrainingConsistencyCardProps = {
  consistency: TrainingConsistencySummary;
  compact?: boolean;
};

const formatLastSession = (value: string | null) => {
  if (!value) return "No session logged yet";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
};

export default function TrainingConsistencyCard({
  consistency,
  compact = false,
}: TrainingConsistencyCardProps) {
  const completedSessions = Math.min(consistency.currentWeekSessions, 5);
  const statusClass =
    consistency.status === "Excellent"
      ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-200"
      : consistency.status === "Good"
      ? "border-amber-500/35 bg-amber-400/10 text-amber-100"
      : "border-neutral-700 bg-black/30 text-neutral-200";

  return (
    <section
      aria-labelledby="training-consistency-heading"
      className={`rounded-xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-950 shadow-[0_14px_32px_rgba(0,0,0,0.2)] ${
        compact ? "p-4" : "p-5 sm:p-6"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
            Training Consistency
          </p>
          <h2 id="training-consistency-heading" className={`${compact ? "mt-1 text-lg" : "mt-2 text-xl"} font-bold text-white`}>
            Current Week
          </h2>
        </div>
        <span className={`w-fit rounded-full border px-3 py-1.5 text-xs font-semibold ${statusClass}`}>
          {consistency.status}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex gap-1" aria-label={`${consistency.currentWeekSessions} of 5 recommended sessions`}>
          {Array.from({ length: 5 }, (_, index) => (
            <span
              key={index}
              className={`h-3 w-3 rounded-sm border ${
                index < completedSessions
                  ? "border-amber-300 bg-amber-400"
                  : "border-neutral-700 bg-neutral-950"
              }`}
              aria-hidden="true"
            />
          ))}
        </div>
        <p className="text-sm font-semibold text-white">
          {consistency.currentWeekSessions} of 5 Recommended Sessions
        </p>
      </div>

      <p className="mt-3 text-sm leading-6 text-neutral-300">{consistency.message}</p>
      <p className="mt-1 text-sm text-neutral-500">Aim for 3-5 focused sessions each week.</p>

      <dl className={`mt-4 grid gap-3 ${compact ? "grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-5"}`}>
        <div className="min-w-0 rounded-lg border border-neutral-800 bg-black/30 p-3">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">Current Status</dt>
          <dd className="mt-1 text-sm font-semibold text-white">{consistency.status}</dd>
        </div>
        <div className="min-w-0 rounded-lg border border-neutral-800 bg-black/30 p-3">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">Sessions This Week</dt>
          <dd className="mt-1 text-sm font-semibold text-white">{consistency.currentWeekSessions}</dd>
        </div>
        <div className="min-w-0 rounded-lg border border-neutral-800 bg-black/30 p-3">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">Average Weekly Sessions</dt>
          <dd className="mt-1 text-sm font-semibold text-white">{consistency.averageWeeklySessions}</dd>
        </div>
        <div className="min-w-0 rounded-lg border border-neutral-800 bg-black/30 p-3">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">Last Session</dt>
          <dd className="mt-1 break-words text-sm font-semibold text-white">{formatLastSession(consistency.lastSessionDate)}</dd>
        </div>
        {!compact && (
          <div className="min-w-0 rounded-lg border border-neutral-800 bg-black/30 p-3">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">Trend</dt>
            <dd className="mt-1 text-sm font-semibold text-white">{consistency.trend}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}

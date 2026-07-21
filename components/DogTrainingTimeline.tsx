"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type TimelineFilter = "all" | "sessions" | "progress" | "goals" | "case-file";

type TimelineEvent = {
  id: string;
  event_type: string;
  title: string;
  summary: string | null;
  metadata: Record<string, unknown>;
  source_type: string | null;
  source_id: string | null;
  occurred_at: string;
};

type TimelineResponse = {
  events: TimelineEvent[];
  nextCursor: string | null;
};

const filters: { value: TimelineFilter; label: string }[] = [
  { value: "all", label: "All Activity" },
  { value: "sessions", label: "Sessions" },
  { value: "progress", label: "Progress" },
  { value: "goals", label: "Goals" },
  { value: "case-file", label: "Case File" },
];

const eventIcons: Record<string, string> = {
  profile_created: "M4 2.8h5l3 3v7.4H4V2.8Zm2 5.1h4M6 10.4h3",
  session_logged: "M4 2.8v2.4M12 2.8v2.4M3 5.2h10v8.3H3V5.2Zm2.2 3h5.6",
  goal_updated: "m8 2.5 1.4 3.1 3.4.3-2.6 2.2.8 3.4L8 9.7l-3 1.8.8-3.4-2.6-2.2 3.4-.3L8 2.5Z",
  consistency_update: "M3 12.5h10M4.5 10V6.8M8 10V4M11.5 10V2.8",
  profile_updated: "M4 2.8h5l3 3v7.4H4V2.8Zm4 2.5h2.2M6 8h4M6 10.5h3",
};

const formatDate = (value: string, includeTime = false) =>
  new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    ...(includeTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(new Date(value));

const getDateKey = (value: string) => new Date(value).toLocaleDateString("en-CA");

const getDetails = (event: TimelineEvent) => {
  const labels: Record<string, string> = {
    duration: "Duration",
    focus: "Focus",
    wins: "Win",
    issues: "Challenge",
    session_date: "Session Date",
    previous_goal: "Previous Goal",
    new_goal: "New Goal",
    updated_fields: "Updated",
    sessions_this_week: "Sessions This Week",
    status: "Consistency Status",
  };

  return Object.entries(event.metadata ?? {})
    .filter(([key, value]) => labels[key] && value !== null && value !== undefined && value !== "")
    .map(([key, value]) => [labels[key], String(value)] as const);
};

const TimelineIcon = ({ type }: { type: string }) => (
  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-amber-500/25 bg-amber-400/10 text-amber-200">
    <svg viewBox="0 0 16 16" className="h-4 w-4 fill-none stroke-current stroke-[1.5]" aria-hidden="true">
      <path d={eventIcons[type] ?? eventIcons.profile_updated} />
    </svg>
  </span>
);

export default function DogTrainingTimeline({
  dogProfileId,
  refreshKey = 0,
  preview = false,
}: {
  dogProfileId: string;
  refreshKey?: number;
  preview?: boolean;
}) {
  const [filter, setFilter] = useState<TimelineFilter>("all");
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const loadEvents = useCallback(async (cursor?: string | null) => {
    const params = new URLSearchParams({ dog_profile_id: dogProfileId, filter });
    if (cursor) params.set("cursor", cursor);
    const response = await fetch(`/api/dog-timeline?${params.toString()}`, { cache: "no-store" });
    const data = (await response.json()) as TimelineResponse & { error?: string };
    if (!response.ok) throw new Error(data.error || "Unable to load training timeline.");
    return data;
  }, [dogProfileId, filter]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setEvents([]);
    setNextCursor(null);

    loadEvents()
      .then((data) => {
        if (!active) return;
        setEvents(preview ? data.events.slice(0, 3) : data.events);
        setNextCursor(preview ? null : data.nextCursor);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load training timeline.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [dogProfileId, filter, loadEvents, refreshKey, preview]);

  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await loadEvents(nextCursor);
      setEvents((currentEvents) => [...currentEvents, ...data.events]);
      setNextCursor(data.nextCursor);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load earlier activity.");
    } finally {
      setLoadingMore(false);
    }
  };

  const groupedEvents = events.reduce<Record<string, TimelineEvent[]>>((groups, event) => {
    const dateKey = getDateKey(event.occurred_at);
    groups[dateKey] = [...(groups[dateKey] ?? []), event];
    return groups;
  }, {});

  if (preview) {
    return (
      <section className="rounded-xl border border-neutral-800 bg-black/30 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Recent Activity</p>
            <h2 className="mt-1 text-xl font-bold text-white">Training Record</h2>
          </div>
          <Link href="/train#dog-training-timeline" className="text-sm font-semibold text-amber-200 hover:text-amber-100">
            View Timeline
          </Link>
        </div>
        {loading ? <p className="mt-4 text-sm text-neutral-400">Loading activity...</p> : null}
        {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
        {!loading && !error && events.length === 0 ? <p className="mt-4 text-sm text-neutral-400">No activity recorded yet.</p> : null}
        <div className="mt-4 space-y-3">
          {events.map((event) => (
            <div key={event.id} className="flex gap-3 rounded-lg border border-neutral-800 bg-neutral-950/70 p-3">
              <TimelineIcon type={event.event_type} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">{event.title}</p>
                <p className="mt-1 text-xs text-neutral-500">{formatDate(event.occurred_at)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section id="dog-training-timeline" aria-labelledby="dog-training-timeline-heading" className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Case File</p>
          <h2 id="dog-training-timeline-heading" className="mt-2 text-2xl font-bold text-white">Training Timeline</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400">Consistent session logging gives your AI trainer the context needed to track real progress and make better recommendations.</p>
        </div>
        <select aria-label="Filter training timeline" value={filter} onChange={(event) => setFilter(event.target.value as TimelineFilter)} className="min-h-11 w-full rounded-lg border border-neutral-700 bg-black px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-300 sm:w-44">
          {filters.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </div>

      {loading ? <p className="mt-6 text-sm text-neutral-400" role="status">Loading training activity...</p> : null}
      {error ? <p className="mt-6 text-sm text-red-300" role="alert">{error}</p> : null}
      {!loading && !error && events.length === 0 ? (
        <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-400/5 p-5">
          <h3 className="text-lg font-semibold text-white">Your dog&apos;s training journey starts here.</h3>
          <p className="mt-2 text-sm leading-6 text-neutral-300">Log training sessions consistently to build a useful record of progress, challenges, and recommendations.</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => document.getElementById("session-log-section")?.scrollIntoView({ behavior: "smooth" })} className="inline-flex min-h-11 items-center justify-center rounded bg-amber-400 px-4 py-3 text-sm font-semibold text-black hover:bg-amber-300">Log a Training Session</button>
            <button type="button" onClick={() => document.getElementById("patriot-k9-coach")?.scrollIntoView({ behavior: "smooth" })} className="inline-flex min-h-11 items-center justify-center rounded border border-neutral-700 px-4 py-3 text-sm font-semibold text-white hover:bg-neutral-900">Open AI Trainer</button>
          </div>
        </div>
      ) : null}

      <div className="mt-6 space-y-7">
        {Object.entries(groupedEvents).map(([dateKey, eventsForDate]) => (
          <div key={dateKey}>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">{formatDate(eventsForDate[0].occurred_at)}</h3>
            <div className="mt-3 space-y-3 border-l border-neutral-800 pl-4 sm:pl-5">
              {eventsForDate.map((event) => {
                const details = getDetails(event);
                return (
                  <article key={event.id} className="relative rounded-xl border border-neutral-800 bg-black/30 p-4">
                    <span className="absolute -left-[1.45rem] top-5 h-3 w-3 rounded-full border-2 border-neutral-950 bg-amber-400 sm:-left-[1.72rem]" aria-hidden="true" />
                    <div className="flex gap-3"><TimelineIcon type={event.event_type} /><div className="min-w-0 flex-1"><h4 className="text-base font-semibold text-white">{event.title}</h4><p className="mt-1 text-xs text-neutral-500">{formatDate(event.occurred_at, true)}</p>{event.summary ? <p className="mt-2 break-words text-sm leading-6 text-neutral-300">{event.summary}</p> : null}
                      {details.length > 0 ? <details className="mt-3"><summary className="cursor-pointer text-sm font-semibold text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-300">View details</summary><dl className="mt-3 grid gap-2 sm:grid-cols-2">{details.map(([label, value]) => <div key={label} className="rounded border border-neutral-800 bg-neutral-950 p-3"><dt className="text-[11px] uppercase tracking-[0.14em] text-neutral-500">{label}</dt><dd className="mt-1 break-words text-sm text-white">{value}</dd></div>)}</dl></details> : null}
                    </div></div>
                  </article>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {nextCursor ? <button type="button" onClick={handleLoadMore} disabled={loadingMore} className="mt-6 min-h-11 w-full rounded border border-neutral-700 px-4 py-3 text-sm font-semibold text-white hover:bg-neutral-900 disabled:opacity-60 sm:w-auto">{loadingMore ? "Loading..." : "Load Earlier Activity"}</button> : null}
    </section>
  );
}

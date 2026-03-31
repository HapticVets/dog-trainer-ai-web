"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type DashboardSummary = {
  totalDogs: number;
  totalSessions: number;
  latestDog: {
    id: string;
    name: string;
    goal_type: string;
    main_goal: string;
    reward_type: string;
    skill_level: string;
    custom_notes: string;
    created_at: string;
  } | null;
  latestSession: {
    id: string;
    dog_name: string;
    session_date: string;
    duration: number | null;
    focus: string;
    wins: string;
    issues: string;
    created_at: string;
  } | null;
  latestProgressReport: {
    id: string;
    content: string;
    created_at: string;
  } | null;
  latestNextSessionPlan: {
    id: string;
    content: string;
    created_at: string;
  } | null;
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const res = await fetch("/api/dashboard-summary", {
          method: "GET",
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok) {
          console.error("Failed to load dashboard summary:", data.error);
          setSummary(null);
          return;
        }

        setSummary(data);
      } catch (error) {
        console.error("Failed to load dashboard summary:", error);
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, []);

  return (
    <main className="min-h-screen bg-[#0b0f17] px-6 py-12 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">
              Dashboard
            </p>
            <h1 className="mt-2 text-4xl font-bold">Training Overview</h1>
            <p className="mt-3 max-w-2xl text-slate-400">
              Quick summary of saved dogs, logged sessions, and latest training outputs.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/train"
              className="rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-black hover:brightness-110"
            >
              Open Trainer
            </Link>
          </div>
        </div>

        {loading && (
          <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="text-slate-300">Loading dashboard...</p>
          </div>
        )}

        {!loading && !summary && (
          <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="text-slate-300">Unable to load dashboard summary.</p>
          </div>
        )}

        {!loading && summary && (
          <>
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm text-slate-400">Total Dogs</p>
                <p className="mt-3 text-4xl font-bold">{summary.totalDogs}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm text-slate-400">Total Sessions</p>
                <p className="mt-3 text-4xl font-bold">{summary.totalSessions}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm text-slate-400">Latest Dog</p>
                <p className="mt-3 text-2xl font-bold">
                  {summary.latestDog?.name || "None yet"}
                </p>
                {summary.latestDog && (
                  <p className="mt-2 text-sm text-slate-400">
                    {summary.latestDog.goal_type} • {summary.latestDog.main_goal}
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm text-slate-400">Latest Session Dog</p>
                <p className="mt-3 text-2xl font-bold">
                  {summary.latestSession?.dog_name || "None yet"}
                </p>
                {summary.latestSession && (
                  <p className="mt-2 text-sm text-slate-400">
                    {summary.latestSession.session_date || "No date"}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-8 grid gap-8 xl:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-2xl font-semibold">Latest Session</h2>

                {!summary.latestSession && (
                  <p className="mt-4 text-slate-400">No session logs yet.</p>
                )}

                {summary.latestSession && (
                  <div className="mt-4 space-y-3">
                    <p className="text-lg font-semibold">
                      {summary.latestSession.dog_name}{" "}
                      {summary.latestSession.duration
                        ? `• ${summary.latestSession.duration} min`
                        : ""}
                    </p>
                    <p className="text-sm text-slate-400">
                      Date: {summary.latestSession.session_date || "Not provided"}
                    </p>
                    <p className="text-sm text-slate-300">
                      <strong>Focus:</strong> {summary.latestSession.focus || "None"}
                    </p>
                    <p className="text-sm text-slate-300">
                      <strong>Wins:</strong> {summary.latestSession.wins || "None"}
                    </p>
                    <p className="text-sm text-slate-300">
                      <strong>Issues:</strong> {summary.latestSession.issues || "None"}
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-2xl font-semibold">Latest Dog Profile</h2>

                {!summary.latestDog && (
                  <p className="mt-4 text-slate-400">No saved dogs yet.</p>
                )}

                {summary.latestDog && (
                  <div className="mt-4 space-y-3">
                    <p className="text-lg font-semibold">{summary.latestDog.name}</p>
                    <p className="text-sm text-slate-300">
                      <strong>Goal Type:</strong> {summary.latestDog.goal_type || "None"}
                    </p>
                    <p className="text-sm text-slate-300">
                      <strong>Main Goal:</strong> {summary.latestDog.main_goal || "None"}
                    </p>
                    <p className="text-sm text-slate-300">
                      <strong>Reward Type:</strong> {summary.latestDog.reward_type || "None"}
                    </p>
                    <p className="text-sm text-slate-300">
                      <strong>Skill Level:</strong> {summary.latestDog.skill_level || "None"}
                    </p>
                    <p className="text-sm text-slate-300">
                      <strong>Notes:</strong> {summary.latestDog.custom_notes || "None"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 grid gap-8 xl:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-2xl font-semibold">Latest Progress Report</h2>

                {!summary.latestProgressReport && (
                  <p className="mt-4 text-slate-400">No saved progress reports yet.</p>
                )}

                {summary.latestProgressReport && (
                  <div className="mt-4">
                    <p className="mb-3 text-sm text-slate-400">
                      Saved {new Date(summary.latestProgressReport.created_at).toLocaleString()}
                    </p>
                    <div className="whitespace-pre-wrap rounded-xl border border-white/10 bg-[#08111f] p-4 text-sm text-slate-200">
                      {summary.latestProgressReport.content}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-2xl font-semibold">Latest Next Session Plan</h2>

                {!summary.latestNextSessionPlan && (
                  <p className="mt-4 text-slate-400">No saved next session plans yet.</p>
                )}

                {summary.latestNextSessionPlan && (
                  <div className="mt-4">
                    <p className="mb-3 text-sm text-slate-400">
                      Saved {new Date(summary.latestNextSessionPlan.created_at).toLocaleString()}
                    </p>
                    <div className="whitespace-pre-wrap rounded-xl border border-white/10 bg-[#08111f] p-4 text-sm text-slate-200">
                      {summary.latestNextSessionPlan.content}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
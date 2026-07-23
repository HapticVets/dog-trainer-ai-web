"use client";

import { useEffect, useState } from "react";
import type { DogTrainingPhase } from "@/lib/dogTrainingPhase";

const Detail = ({ label, value }: { label: string; value: string | null }) => (
  <div className="rounded-lg border border-neutral-800 bg-black/30 p-3">
    <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">{label}</dt>
    <dd className="mt-1 break-words text-sm leading-6 text-white">{value || "Not assigned"}</dd>
  </div>
);

export default function TrainingPhaseCard({ dogProfileId }: { dogProfileId: string }) {
  const [phase, setPhase] = useState<DogTrainingPhase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    fetch(`/api/dog-training-phase?dog_profile_id=${encodeURIComponent(dogProfileId)}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load training phase.");
        if (active) setPhase(data.phase);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load training phase.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [dogProfileId]);

  return (
    <section aria-labelledby="training-phase-heading" className="rounded-xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-950 p-4 shadow-[0_14px_32px_rgba(0,0,0,0.2)] sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Case File</p>
      <h2 id="training-phase-heading" className="mt-2 text-xl font-bold text-white">Training Phase</h2>

      {loading ? <p className="mt-4 text-sm text-neutral-400" role="status">Loading phase details...</p> : null}
      {error ? <p className="mt-4 text-sm text-red-300" role="alert">{error}</p> : null}
      {!loading && !error && !phase ? (
        <div className="mt-4 rounded-lg border border-neutral-800 bg-black/30 p-4">
          <p className="font-semibold text-white">No training phase assigned</p>
          <p className="mt-1 text-sm leading-6 text-neutral-400">Your proprietary training phase will appear here when it is assigned. No phase has been inferred or created automatically.</p>
        </div>
      ) : null}
      {!loading && !error && phase ? (
        <div className="mt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div><h3 className="text-lg font-semibold text-white">{phase.phaseTitle || "Training phase not titled"}</h3><p className="mt-1 text-sm leading-6 text-neutral-400">{phase.phaseDescription || "No phase description assigned."}</p></div>
            <span className="w-fit rounded-full border border-amber-500/30 bg-amber-400/10 px-3 py-1.5 text-sm font-semibold text-amber-100">{phase.progressPercent}%</span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-black" aria-label={`${phase.progressPercent}% phase progress`}><div className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-200 transition-[width] duration-700 ease-out" style={{ width: `${phase.progressPercent}%` }} /></div>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2"><Detail label="Current Objective" value={phase.currentObjective} /><Detail label="Estimated Time Remaining" value={phase.estimatedTimeRemaining} /></dl>
          <div className="mt-4 rounded-lg border border-neutral-800 bg-black/30 p-4"><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">Graduation Requirements</p>{phase.graduationRequirements.length ? <ul className="mt-3 space-y-2">{phase.graduationRequirements.map((requirement) => <li key={requirement.title} className="flex gap-2 text-sm leading-6 text-neutral-200"><span className={requirement.completed ? "text-emerald-300" : "text-neutral-500"} aria-hidden="true">{requirement.completed ? "✓" : "○"}</span><span>{requirement.title}</span></li>)}</ul> : <p className="mt-2 text-sm text-neutral-400">No graduation requirements assigned.</p>}</div>
          <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-400/5 p-4"><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-300">Next Phase</p><p className="mt-1 text-sm font-semibold text-white">{phase.nextPhaseTitle || "Not assigned"}</p>{phase.nextPhasePreview ? <p className="mt-1 text-sm leading-6 text-neutral-300">{phase.nextPhasePreview}</p> : null}</div>
        </div>
      ) : null}
    </section>
  );
}

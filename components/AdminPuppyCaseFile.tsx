"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

const traitGroups = [
  {
    title: "Engagement & Relationship",
    traits: [
      ["handler_engagement", "Handler Engagement"],
      ["handler_orientation", "Handler Orientation"],
      ["recall_tendency", "Recall Tendency"],
    ],
  },
  {
    title: "Confidence & Recovery",
    traits: [
      ["environmental_confidence", "Environmental Confidence"],
      ["recovery", "Recovery"],
      ["adaptability", "Adaptability"],
      ["sound_recovery", "Sound Recovery"],
    ],
  },
  {
    title: "Drive & Regulation",
    traits: [
      ["food_motivation", "Food Motivation"],
      ["toy_drive", "Toy / Prey Drive"],
      ["drive_regulation", "Drive Regulation"],
      ["frustration_tolerance", "Frustration Tolerance"],
    ],
  },
  {
    title: "Stability & Neutrality",
    traits: [
      ["neutrality", "Neutrality"],
      ["disengagement", "Disengagement"],
      ["crate_settling", "Crate Settling"],
    ],
  },
  {
    title: "Independence & Handling",
    traits: [
      ["independence", "Independence"],
      ["handling_tolerance", "Handling Tolerance"],
    ],
  },
] as const;

type TraitKey = (typeof traitGroups)[number]["traits"][number][0];
type Evaluation = Record<TraitKey, number | null> & {
  id: string;
  evaluation_week: string;
  evaluation_date: string;
  strengths: string | null;
  development_focus: string | null;
  overall_notes: string | null;
};
type Puppy = {
  id: string;
  puppy_code: string;
  temporary_name: string | null;
  sex: string | null;
  collar_color: string | null;
  status: string;
};
type PuppyData = { puppy: Puppy; nextPuppy: Puppy | null };
type Draft = Record<TraitKey, number | null> & {
  evaluation_week: string;
  evaluation_date: string;
  strengths: string;
  development_focus: string;
  overall_notes: string;
};

const traitKeys = traitGroups.flatMap((group) => group.traits.map(([key]) => key));
const emptyDraft = (): Draft => ({
  evaluation_week: "Week 5",
  evaluation_date: new Date().toISOString().slice(0, 10),
  strengths: "",
  development_focus: "",
  overall_notes: "",
  ...Object.fromEntries(traitKeys.map((key) => [key, null])),
} as Draft);

async function readResponse(response: Response) {
  const body = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) throw new Error(body.error || "Unable to complete the request.");
  return body;
}

export default function AdminPuppyCaseFile({
  litterId,
  puppyId,
}: {
  litterId: string;
  puppyId: string;
}) {
  const [data, setData] = useState<PuppyData | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Evaluation | null>(null);
  const [deleting, setDeleting] = useState(false);

  const evaluationUrl = `/api/admin/litters/${litterId}/puppies/${puppyId}/evaluations`;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [puppyResponse, evaluationsResponse] = await Promise.all([
        fetch(`/api/admin/litters/${litterId}/puppies/${puppyId}`),
        fetch(evaluationUrl),
      ]);
      const [puppyBody, evaluationsBody] = await Promise.all([
        readResponse(puppyResponse),
        readResponse(evaluationsResponse),
      ]);
      setData(puppyBody as PuppyData);
      setEvaluations((evaluationsBody as { evaluations: Evaluation[] }).evaluations ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load puppy evaluations.");
    } finally {
      setLoading(false);
    }
  }, [evaluationUrl, litterId, puppyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const openNewEvaluation = () => {
    setDraft(emptyDraft());
    setEditingId(null);
    setError("");
    setFormOpen(true);
  };

  const openEditEvaluation = (evaluation: Evaluation) => {
    setDraft({
      evaluation_week: evaluation.evaluation_week,
      evaluation_date: evaluation.evaluation_date,
      strengths: evaluation.strengths ?? "",
      development_focus: evaluation.development_focus ?? "",
      overall_notes: evaluation.overall_notes ?? "",
      ...Object.fromEntries(traitKeys.map((key) => [key, evaluation[key] ?? null])),
    } as Draft);
    setEditingId(evaluation.id);
    setError("");
    setFormOpen(true);
  };

  const saveEvaluation = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch(editingId ? `${evaluationUrl}/${editingId}` : evaluationUrl, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      await readResponse(response);
      setFormOpen(false);
      setEditingId(null);
      setNotice("Evaluation saved.");
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save evaluation.");
    } finally {
      setSaving(false);
    }
  };

  const deleteEvaluation = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError("");
    try {
      const response = await fetch(`${evaluationUrl}/${deleteTarget.id}`, { method: "DELETE" });
      await readResponse(response);
      setDeleteTarget(null);
      setNotice("Evaluation deleted.");
      await load();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete evaluation.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <p className="p-6 text-neutral-300">Loading puppy case file...</p>;
  if (!data) return <p className="p-6 text-red-300">{error || "Puppy case file not found."}</p>;

  const { puppy, nextPuppy } = data;
  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6">
      <Link href={`/admin/litters/${litterId}`} className="text-sm text-amber-200 hover:text-amber-100">
        Back to Litter
      </Link>
      <header className="mt-4 flex flex-col gap-4 rounded-2xl border border-amber-400/20 bg-neutral-950 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-300">Puppy Development</p>
          <h1 className="mt-1 text-3xl font-bold text-white">{puppy.puppy_code}</h1>
          <p className="mt-1 text-neutral-400">
            {puppy.temporary_name || "Temporary name pending"} · {puppy.sex || "Sex not set"} · {puppy.status}
          </p>
        </div>
        <button type="button" onClick={openNewEvaluation} className="min-h-11 rounded-lg bg-amber-400 px-4 py-2 font-bold text-black hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200">
          Add Evaluation
        </button>
      </header>

      {notice && <p className="mt-4 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200" role="status">{notice}</p>}
      {error && !formOpen && !deleteTarget && <p className="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200" role="alert">{error}</p>}

      <section className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-300">Puppy Development Evaluations</p>
            <h2 className="mt-1 text-xl font-bold text-white">Evaluation History</h2>
          </div>
          <p className="text-sm text-neutral-400">{evaluations.length} saved {evaluations.length === 1 ? "evaluation" : "evaluations"}</p>
        </div>
        {evaluations.length === 0 ? (
          <p className="mt-5 rounded-xl border border-dashed border-neutral-700 p-4 text-sm leading-6 text-neutral-400">No evaluations have been recorded. Add a Week 5 or Week 6 observation to begin this puppy&apos;s development history.</p>
        ) : (
          <div className="mt-5 space-y-3">
            {evaluations.map((evaluation) => (
              <article key={evaluation.id} className="rounded-xl border border-neutral-800 bg-black/40 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-bold text-white">{evaluation.evaluation_week}</h3>
                    <p className="mt-1 text-sm text-neutral-400">{new Date(`${evaluation.evaluation_date}T12:00:00`).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => openEditEvaluation(evaluation)} className="min-h-10 rounded-lg border border-amber-400/35 px-3 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-400/10">Edit</button>
                    <button type="button" onClick={() => setDeleteTarget(evaluation)} className="min-h-10 rounded-lg border border-red-400/35 px-3 py-2 text-sm font-semibold text-red-200 hover:bg-red-400/10">Delete Evaluation</button>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                  {traitKeys.map((key) => <span key={key} className="rounded bg-neutral-900 px-2 py-1.5 text-neutral-300">{key.replaceAll("_", " ")}: <strong className="text-white">{evaluation[key] ?? "-"}</strong></span>)}
                </div>
                {(evaluation.strengths || evaluation.development_focus || evaluation.overall_notes) && <div className="mt-4 grid gap-3 text-sm leading-6 text-neutral-300 sm:grid-cols-3">{evaluation.strengths && <p><strong className="block text-amber-200">Strengths</strong>{evaluation.strengths}</p>}{evaluation.development_focus && <p><strong className="block text-amber-200">Development focus</strong>{evaluation.development_focus}</p>}{evaluation.overall_notes && <p><strong className="block text-amber-200">Trainer notes</strong>{evaluation.overall_notes}</p>}</div>}
              </article>
            ))}
          </div>
        )}
      </section>

      {evaluations.length > 0 && nextPuppy && <Link href={`/admin/litters/${litterId}/puppies/${nextPuppy.id}`} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg border border-amber-400/35 px-4 py-2 font-semibold text-amber-100 hover:bg-amber-400/10">Evaluate Next Puppy: {nextPuppy.puppy_code}</Link>}

      {formOpen && <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-4" role="dialog" aria-modal="true" aria-labelledby="evaluation-form-title"><div className="mx-auto my-4 max-w-3xl rounded-2xl border border-amber-400/25 bg-neutral-950 p-5 shadow-2xl sm:my-8"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-300">Puppy Development</p><h2 id="evaluation-form-title" className="mt-1 text-2xl font-bold text-white">{editingId ? "Edit Evaluation" : "Add Evaluation"}</h2></div><button type="button" onClick={() => { setFormOpen(false); setEditingId(null); }} disabled={saving} className="min-h-10 rounded-lg px-3 text-neutral-300 hover:bg-neutral-800">Close</button></div><form onSubmit={saveEvaluation} className="mt-5 space-y-6"><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm text-neutral-200">Evaluation Week<input required value={draft.evaluation_week} onChange={(event) => setDraft({ ...draft, evaluation_week: event.target.value })} placeholder="Week 5" className="mt-1 min-h-11 w-full rounded-lg border border-neutral-700 bg-black px-3 text-white" /></label><label className="text-sm text-neutral-200">Evaluation Date<input required type="date" value={draft.evaluation_date} onChange={(event) => setDraft({ ...draft, evaluation_date: event.target.value })} className="mt-1 min-h-11 w-full rounded-lg border border-neutral-700 bg-black px-3 text-white" /></label></div><p className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-sm leading-6 text-amber-100">1 - Very Low / Significant Support Needed · 2 - Low / Developing · 3 - Moderate / Age-Appropriate · 4 - Strong · 5 - Very Strong<br />Scores are observations, not grades. Higher is not always better for every trait or placement.</p>{traitGroups.map((group) => <fieldset key={group.title} className="rounded-xl border border-neutral-800 p-4"><legend className="px-1 text-sm font-semibold uppercase tracking-[0.12em] text-amber-300">{group.title}</legend><div className="mt-2 space-y-4">{group.traits.map(([key, label]) => <div key={key} className="flex flex-col gap-2 border-b border-neutral-800 pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"><span className="text-sm font-medium text-white">{label}</span><div className="grid grid-cols-5 gap-2" role="group" aria-label={label}>{[1,2,3,4,5].map((score) => <button key={score} type="button" onClick={() => setDraft({ ...draft, [key]: score })} aria-pressed={draft[key] === score} className={`min-h-10 min-w-10 rounded-lg border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-200 ${draft[key] === score ? "border-amber-300 bg-amber-400 text-black" : "border-neutral-700 bg-black text-neutral-200 hover:border-amber-400/60"}`}>{score}</button>)}</div></div>)}</div></fieldset>)}<div className="grid gap-4"><label className="text-sm text-neutral-200">Strengths Observed<textarea value={draft.strengths} onChange={(event) => setDraft({ ...draft, strengths: event.target.value })} className="mt-1 min-h-24 w-full rounded-lg border border-neutral-700 bg-black p-3 text-white" /></label><label className="text-sm text-neutral-200">Development Focus<textarea value={draft.development_focus} onChange={(event) => setDraft({ ...draft, development_focus: event.target.value })} className="mt-1 min-h-24 w-full rounded-lg border border-neutral-700 bg-black p-3 text-white" /></label><label className="text-sm text-neutral-200">Overall Trainer Notes<textarea value={draft.overall_notes} onChange={(event) => setDraft({ ...draft, overall_notes: event.target.value })} className="mt-1 min-h-24 w-full rounded-lg border border-neutral-700 bg-black p-3 text-white" /></label></div>{error && <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200" role="alert">{error}</p>}<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" disabled={saving} onClick={() => { setFormOpen(false); setEditingId(null); }} className="min-h-11 rounded-lg border border-neutral-700 px-4 py-2 font-semibold text-white">Cancel</button><button disabled={saving} className="min-h-11 rounded-lg bg-amber-400 px-4 py-2 font-bold text-black disabled:cursor-not-allowed disabled:opacity-70">{saving ? "Saving..." : "Save Evaluation"}</button></div></form></div></div>}

      {deleteTarget && <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-evaluation-title"><div className="w-full max-w-md rounded-2xl border border-red-400/25 bg-neutral-950 p-5 shadow-2xl"><h2 id="delete-evaluation-title" className="text-xl font-bold text-white">Delete this evaluation?</h2><p className="mt-2 text-sm leading-6 text-neutral-300">This will permanently remove this evaluation record. The puppy record will remain.</p>{error && <p className="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200" role="alert">{error}</p>}<div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" disabled={deleting} onClick={() => setDeleteTarget(null)} className="min-h-11 rounded-lg border border-neutral-700 px-4 py-2 font-semibold text-white">Cancel</button><button type="button" disabled={deleting} onClick={() => void deleteEvaluation()} className="min-h-11 rounded-lg bg-red-500 px-4 py-2 font-bold text-white disabled:cursor-not-allowed disabled:opacity-70">{deleting ? "Deleting..." : "Delete Evaluation"}</button></div></div></div>}
    </main>
  );
}

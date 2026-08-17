"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import AssignCollarColors from "@/components/AssignCollarColors";
import DeleteLitterButton from "@/components/DeleteLitterButton";
import AdminLitterPublicListing from "@/components/AdminLitterPublicListing";
import { collarLabel, collarSwatch } from "@/lib/admin-puppy-collars";

type Puppy = {
  id: string; puppy_code: string; temporary_name: string | null; sex: string | null; collar_color: string | null; status: string;
  evaluationCount: number; latestEvaluationWeek: string | null; is_public?: boolean; public_status?: string | null;
};
type Litter = { litter_code: string; name: string; status: string; birth_date: string | null; estimated_due_date: string | null; is_public?: boolean; public_slug?: string | null; public_title?: string | null; public_summary?: string | null; public_status?: string | null };
type Data = { litter: Litter; puppies: Puppy[] };

async function loadLitter(litterId: string) {
  const response = await fetch(`/api/admin/litters/${litterId}`, { cache: "no-store" });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Unable to refresh litter records.");
  return body as Data;
}

export default function AdminLitterCaseFile({ litterId }: { litterId: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [count, setCount] = useState("1");
  const [notice, setNotice] = useState("");
  const [togglingPuppyId, setTogglingPuppyId] = useState<string | null>(null);

  useEffect(() => { void loadLitter(litterId).then(setData).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to load litter.")); }, [litterId]);

  const add = async (event: FormEvent) => {
    event.preventDefault(); setError("");
    const response = await fetch(`/api/admin/litters/${litterId}/puppies`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ count }) });
    const body = await response.json();
    if (!response.ok) { setError(body.error); return; }
    setData((current) => current ? { ...current, puppies: [...current.puppies, ...body.puppies.map((puppy: Puppy) => ({ ...puppy, evaluationCount: 0, latestEvaluationWeek: null }))] } : current);
    setNotice(body.unassignedCount ? `${body.unassignedCount} new ${body.unassignedCount === 1 ? "puppy needs" : "puppies need"} a manual collar assignment.` : "Puppy codes and standard collar colors generated.");
  };

  const togglePublic = async (puppy: Puppy) => {
    setTogglingPuppyId(puppy.id); setError("");
    try {
      const response = await fetch(`/api/admin/litters/${litterId}/puppies/${puppy.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_public: !puppy.is_public }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Unable to update puppy publication.");
      if (!body.puppy || body.puppy.is_public !== !puppy.is_public) throw new Error("Could not confirm the puppy publication update.");
      const refreshed = await loadLitter(litterId);
      const refreshedPuppy = refreshed.puppies.find((candidate) => candidate.id === puppy.id);
      if (!refreshedPuppy || refreshedPuppy.is_public !== !puppy.is_public) throw new Error("Could not confirm the puppy publication update.");
      setData(refreshed);
      setNotice(refreshedPuppy.is_public ? `${collarLabel(puppy.collar_color)} is now public.` : `${collarLabel(puppy.collar_color)} is now private.`);
    } catch (toggleError) { setError(toggleError instanceof Error ? toggleError.message : "Unable to update puppy publication."); } finally { setTogglingPuppyId(null); }
  };

  if (!data) return <p className="p-6 text-neutral-300">{error || "Loading litter..."}</p>;
  return <main className="mx-auto max-w-6xl p-4 sm:p-6"><Link href="/admin/litters" className="text-sm text-amber-200">Back to Litters</Link><header className="mt-4 flex flex-col gap-4 rounded-2xl border border-amber-400/20 bg-neutral-950 p-5 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-amber-300">{data.litter.litter_code}</p><h1 className="text-3xl font-bold text-white">{data.litter.name}</h1><p className="mt-2 text-neutral-400">{data.litter.status} · Due: {data.litter.estimated_due_date || "Not set"} · Born: {data.litter.birth_date || "Not set"}</p></div><DeleteLitterButton litterId={litterId} label="Delete Litter" onDeleted={() => window.location.assign("/admin/litters?deleted=1")} /></header><AdminLitterPublicListing litterId={litterId} litter={data.litter} onSaved={(litter) => setData((current) => current ? { ...current, litter: { ...current.litter, ...litter } } : current)} /><div className="mt-6 flex flex-col gap-3 rounded-xl border border-neutral-800 bg-neutral-950 p-4 sm:flex-row sm:items-end sm:justify-between"><form onSubmit={add} className="flex flex-col gap-3 sm:flex-row sm:items-end"><label className="text-sm text-neutral-300">Add Multiple Puppies<input type="number" min="1" max="20" value={count} onChange={(event) => setCount(event.target.value)} className="ml-2 w-20 rounded bg-black p-2" /></label><button className="min-h-11 rounded bg-amber-400 px-4 py-2 font-bold text-black">Generate Puppy Codes</button></form><AssignCollarColors litterId={litterId} puppies={data.puppies} onSaved={(puppies) => { const byId = new Map(puppies.map((puppy) => [puppy.id, puppy.collar_color])); setData((current) => current ? { ...current, puppies: current.puppies.map((puppy) => ({ ...puppy, collar_color: byId.get(puppy.id) ?? puppy.collar_color })) } : current); setNotice("Collar assignments saved."); }} /></div>{notice && <p className="mt-3 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200" role="status">{notice}</p>}{error && <p className="mt-3 text-red-300" role="alert">{error}</p>}<section className="mt-6"><div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-300">Puppy Development Overview</p><h2 className="mt-1 text-xl font-bold text-white">Puppy Case Files</h2></div><p className="text-sm text-neutral-400">{data.puppies.length} puppies</p></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{data.puppies.map((puppy) => <article key={puppy.id} className="rounded-xl border border-neutral-800 bg-neutral-950 p-4"><p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.1em] text-white"><span aria-hidden="true" className="h-3 w-3 rounded-full border border-white/30" style={{ backgroundColor: collarSwatch(puppy.collar_color) }} />{collarLabel(puppy.collar_color)}</p><p className="mt-2 font-bold text-amber-200">{puppy.puppy_code}</p><p className="mt-2 text-white">{puppy.temporary_name || "Temporary name pending"}</p><p className="text-sm text-neutral-400">{puppy.sex || "Sex not set"}</p><p className="mt-3 text-sm text-neutral-400">Latest: <span className="text-neutral-200">{puppy.latestEvaluationWeek || "Not evaluated"}</span> · {puppy.evaluationCount} {puppy.evaluationCount === 1 ? "evaluation" : "evaluations"}</p><div className={`mt-3 rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] ${puppy.is_public ? "border-emerald-400/35 bg-emerald-400/10 text-emerald-200" : "border-neutral-700 bg-black/40 text-neutral-400"}`}><p>{puppy.is_public ? "Public" : "Private"}</p>{puppy.is_public && <p className="mt-1 text-amber-100">{puppy.public_status || "Status not set"}</p>}</div><div className="mt-4 flex flex-wrap gap-2"><Link href={`/admin/litters/${litterId}/puppies/${puppy.id}`} className="inline-flex min-h-10 items-center rounded-lg border border-amber-400/35 px-3 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-400/10">Open Puppy</Link><Link href={`/admin/litters/${litterId}/puppies/${puppy.id}`} className="inline-flex min-h-10 items-center rounded-lg border border-neutral-700 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800">Public Listing</Link><button type="button" disabled={togglingPuppyId === puppy.id} onClick={() => void togglePublic(puppy)} className="inline-flex min-h-10 items-center rounded-lg border border-emerald-400/35 px-3 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-400/10 disabled:opacity-60">{togglingPuppyId === puppy.id ? "Saving..." : puppy.is_public ? "Make Private" : "Quick Publish"}</button></div></article>)}</div></section></main>;
}

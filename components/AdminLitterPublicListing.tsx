"use client";

import { FormEvent, useEffect, useState } from "react";

type Litter = { name?: string; is_public?: boolean; public_slug?: string | null; public_title?: string | null; public_summary?: string | null; public_status?: string | null };
const statuses = ["Planned", "Expected", "Born", "Accepting Applications", "Available", "Fully Reserved", "Placed", "Archived"];

function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

export default function AdminLitterPublicListing({ litterId, litter, onSaved }: { litterId: string; litter: Litter; onSaved: (litter: Litter) => void }) {
  const [form, setForm] = useState<Litter>(litter);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  useEffect(() => setForm({ ...litter, public_slug: litter.public_slug || slugify(litter.public_title || litter.name || "") }), [litter]);
  const save = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/admin/litters/${litterId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Unable to update public listing.");
      onSaved(body.litter); setNotice(form.is_public ? "Litter published to the public API." : "Litter unpublished.");
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Unable to update public listing."); } finally { setSaving(false); }
  };
  return <section className="mt-6 rounded-2xl border border-amber-400/20 bg-neutral-950 p-5"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-300">Public Listing</p><h2 className="mt-1 text-xl font-bold text-white">Litter Publishing</h2><p className="mt-2 text-sm leading-6 text-neutral-400">Only this approved buyer-safe information is available through the public litter API. Internal notes and operational fields remain private.</p></div><form onSubmit={save} className="mt-5 grid gap-4 sm:grid-cols-2"><label className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-black/40 p-3 text-sm font-semibold text-white sm:col-span-2"><input type="checkbox" checked={form.is_public === true} onChange={(event) => setForm({ ...form, is_public: event.target.checked })} className="h-4 w-4 accent-amber-400" />{form.is_public ? "Published" : "Unpublished"}</label><label className="text-sm text-neutral-200">Public slug<input required={form.is_public === true} value={form.public_slug ?? ""} onChange={(event) => setForm({ ...form, public_slug: slugify(event.target.value) })} placeholder="adolf-x-anna-2026-a" className="mt-1 min-h-11 w-full rounded-lg border border-neutral-700 bg-black px-3 text-white" /></label><label className="text-sm text-neutral-200">Public title<input value={form.public_title ?? ""} onChange={(event) => setForm({ ...form, public_title: event.target.value })} className="mt-1 min-h-11 w-full rounded-lg border border-neutral-700 bg-black px-3 text-white" /></label><label className="text-sm text-neutral-200 sm:col-span-2">Public status<select value={form.public_status ?? ""} onChange={(event) => setForm({ ...form, public_status: event.target.value || null })} className="mt-1 min-h-11 w-full rounded-lg border border-neutral-700 bg-black px-3 text-white"><option value="">Select public status</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label><label className="text-sm text-neutral-200 sm:col-span-2">Public litter summary<textarea value={form.public_summary ?? ""} onChange={(event) => setForm({ ...form, public_summary: event.target.value })} placeholder="Buyer-safe litter update" className="mt-1 min-h-24 w-full rounded-lg border border-neutral-700 bg-black p-3 text-white" /></label>{notice && <p className="text-sm text-emerald-200 sm:col-span-2" role="status">{notice}</p>}{error && <p className="text-sm text-red-200 sm:col-span-2" role="alert">{error}</p>}<div className="sm:col-span-2"><button disabled={saving} className="min-h-11 rounded-lg bg-amber-400 px-4 py-2 font-bold text-black disabled:opacity-70">{saving ? "Saving..." : form.is_public ? "Update Public Listing" : "Save Public Listing"}</button></div></form></section>;
}

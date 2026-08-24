"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Testimonial, TestimonialStatus } from "@/lib/testimonials";

type Filter = "all" | TestimonialStatus | "featured";
type FormValues = {
  clientName: string;
  dogName: string;
  rating: string;
  testimonial: string;
  source: string;
  clientEmail: string;
  adminNotes: string;
};

const emptyForm: FormValues = {
  clientName: "", dogName: "", rating: "", testimonial: "", source: "", clientEmail: "", adminNotes: "",
};

const formatDate = (value: string) => new Intl.DateTimeFormat("en-US", {
  month: "short", day: "numeric", year: "numeric",
}).format(new Date(value));

const statusClass = (status: TestimonialStatus) => status === "approved"
  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
  : status === "rejected"
    ? "border-red-500/30 bg-red-500/10 text-red-200"
    : "border-amber-400/30 bg-amber-400/10 text-amber-100";

const formFrom = (testimonial: Testimonial): FormValues => ({
  clientName: testimonial.client_name,
  dogName: testimonial.dog_name ?? "",
  rating: testimonial.rating?.toString() ?? "",
  testimonial: testimonial.testimonial,
  source: testimonial.source ?? "",
  clientEmail: testimonial.client_email ?? "",
  adminNotes: testimonial.admin_notes ?? "",
});

export default function AdminTestimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Testimonial | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadTestimonials = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/testimonials", { cache: "no-store" });
      const data = await response.json() as { testimonials?: Testimonial[]; error?: string };
      if (!response.ok) throw new Error(data.error || "Unable to load testimonials.");
      setTestimonials(data.testimonials ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load testimonials.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadTestimonials(); }, []);

  const visibleTestimonials = useMemo(() => testimonials.filter((testimonial) =>
    filter === "all" || (filter === "featured" ? testimonial.is_featured : testimonial.status === filter),
  ), [filter, testimonials]);

  const updateForm = (key: keyof FormValues, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch(editing ? `/api/admin/testimonials/${encodeURIComponent(editing.id)}` : "/api/admin/testimonials", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing ? { ...form, status: editing.status, isFeatured: editing.is_featured } : form),
      });
      const data = await response.json() as { testimonial?: Testimonial; error?: string };
      if (!response.ok || !data.testimonial) throw new Error(data.error || "Unable to save testimonial.");
      setTestimonials((current) => editing ? current.map((item) => item.id === data.testimonial!.id ? data.testimonial! : item) : [data.testimonial!, ...current]);
      setForm(emptyForm); setEditing(null);
      setNotice(editing ? "Testimonial updated." : "Testimonial added as pending.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save testimonial.");
    } finally { setSaving(false); }
  };

  const moderate = async (testimonial: Testimonial, status: TestimonialStatus, isFeatured = testimonial.is_featured) => {
    setError(""); setNotice("");
    try {
      const response = await fetch(`/api/admin/testimonials/${encodeURIComponent(testimonial.id)}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formFrom(testimonial), status, isFeatured }),
      });
      const data = await response.json() as { testimonial?: Testimonial; error?: string };
      if (!response.ok || !data.testimonial) throw new Error(data.error || "Unable to update testimonial.");
      setTestimonials((current) => current.map((item) => item.id === testimonial.id ? data.testimonial! : item));
      setNotice(status === "approved" ? "Testimonial approved." : status === "rejected" ? "Testimonial rejected." : isFeatured ? "Testimonial featured." : "Testimonial unfeatured.");
    } catch (updateError) { setError(updateError instanceof Error ? updateError.message : "Unable to update testimonial."); }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setDeleting(true); setError("");
    try {
      const response = await fetch(`/api/admin/testimonials/${encodeURIComponent(deleteTarget.id)}`, { method: "DELETE" });
      const data = await response.json() as { success?: boolean; error?: string };
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to delete testimonial.");
      setTestimonials((current) => current.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null); setNotice("Testimonial deleted.");
    } catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : "Unable to delete testimonial."); }
    finally { setDeleting(false); }
  };

  return <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-9">
    <Link href="/admin" className="text-sm font-semibold text-amber-200 hover:text-amber-100">Back to Admin</Link>
    <header className="mt-5"><p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-300">Patriot K9 Admin</p><h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Testimonials</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-300">Review and manage client testimonials before they are ever eligible for future public use.</p></header>

    <section className="mt-7 rounded-2xl border border-amber-400/25 bg-neutral-950 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.2)] sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">{editing ? "Edit Testimonial" : "Add Testimonial"}</p><form onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-neutral-200">Client Name<input required value={form.clientName} onChange={(event) => updateForm("clientName", event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-neutral-700 bg-black px-3 text-white outline-none focus:border-amber-300" /></label><label className="text-sm font-semibold text-neutral-200">Dog Name <span className="font-normal text-neutral-500">optional</span><input value={form.dogName} onChange={(event) => updateForm("dogName", event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-neutral-700 bg-black px-3 text-white outline-none focus:border-amber-300" /></label><label className="text-sm font-semibold text-neutral-200">Rating <span className="font-normal text-neutral-500">optional</span><select value={form.rating} onChange={(event) => updateForm("rating", event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-neutral-700 bg-black px-3 text-white outline-none focus:border-amber-300"><option value="">No rating</option>{[1, 2, 3, 4, 5].map((rating) => <option key={rating} value={rating}>{rating} star{rating === 1 ? "" : "s"}</option>)}</select></label><label className="text-sm font-semibold text-neutral-200">Source <span className="font-normal text-neutral-500">optional</span><input value={form.source} onChange={(event) => updateForm("source", event.target.value)} placeholder="Client, puppy buyer, imported..." className="mt-2 min-h-11 w-full rounded-lg border border-neutral-700 bg-black px-3 text-white outline-none placeholder:text-neutral-600 focus:border-amber-300" /></label><label className="text-sm font-semibold text-neutral-200 sm:col-span-2">Testimonial<textarea required maxLength={2000} value={form.testimonial} onChange={(event) => updateForm("testimonial", event.target.value)} className="mt-2 min-h-32 w-full rounded-lg border border-neutral-700 bg-black p-3 text-white outline-none focus:border-amber-300" /></label><label className="text-sm font-semibold text-neutral-200">Client Email <span className="font-normal text-neutral-500">optional</span><input type="email" value={form.clientEmail} onChange={(event) => updateForm("clientEmail", event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-neutral-700 bg-black px-3 text-white outline-none focus:border-amber-300" /></label><label className="text-sm font-semibold text-neutral-200">Admin Notes <span className="font-normal text-neutral-500">optional</span><textarea maxLength={2000} value={form.adminNotes} onChange={(event) => updateForm("adminNotes", event.target.value)} className="mt-2 min-h-24 w-full rounded-lg border border-neutral-700 bg-black p-3 text-white outline-none focus:border-amber-300" /></label><div className="flex flex-wrap items-center gap-3 sm:col-span-2"><button disabled={saving} className="min-h-11 rounded-lg bg-amber-400 px-5 py-3 text-sm font-bold text-black hover:bg-amber-300 disabled:opacity-60">{saving ? "Saving..." : editing ? "Save Changes" : "Add Testimonial"}</button>{editing && <button type="button" onClick={() => { setEditing(null); setForm(emptyForm); }} className="min-h-11 rounded-lg border border-neutral-700 px-4 py-3 text-sm font-semibold text-neutral-200 hover:bg-neutral-900">Cancel Edit</button>}<p className="text-xs text-neutral-500">New manual entries are always created as pending.</p></div></form></section>

    {(error || notice) && <p className={`mt-4 rounded-lg border px-4 py-3 text-sm ${error ? "border-red-500/35 bg-red-500/10 text-red-200" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"}`} role={error ? "alert" : "status"}>{error || notice}</p>}

    <section className="mt-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Moderation Queue</p><h2 className="mt-2 text-2xl font-bold text-white">Testimonial records</h2></div><div className="flex flex-wrap gap-2">{(["all", "pending", "approved", "rejected", "featured"] as Filter[]).map((value) => <button key={value} type="button" onClick={() => setFilter(value)} className={`min-h-10 rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] ${filter === value ? "border-amber-400 bg-amber-400 text-black" : "border-neutral-700 text-neutral-300 hover:bg-neutral-900"}`}>{value}</button>)}</div></div>{loading ? <p className="mt-5 text-sm text-neutral-400">Loading testimonials...</p> : visibleTestimonials.length === 0 ? <p className="mt-5 rounded-xl border border-dashed border-neutral-800 p-5 text-sm text-neutral-500">No testimonials match this filter.</p> : <div className="mt-5 grid gap-4">{visibleTestimonials.map((testimonial) => <article key={testimonial.id} className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 sm:p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-bold text-white">{testimonial.client_name}</h3>{testimonial.dog_name && <span className="text-sm text-neutral-400">with {testimonial.dog_name}</span>}<span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${statusClass(testimonial.status)}`}>{testimonial.status}</span>{testimonial.is_featured && <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-amber-100">Featured</span>}</div>{testimonial.rating && <p className="mt-2 text-sm text-amber-200" aria-label={`${testimonial.rating} out of 5 stars`}>{"★".repeat(testimonial.rating)}<span className="ml-2 text-neutral-400">{testimonial.rating}/5</span></p>}<p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-neutral-200">{testimonial.testimonial}</p><p className="mt-3 text-xs text-neutral-500">Submitted {formatDate(testimonial.submitted_at)}{testimonial.source ? ` · ${testimonial.source}` : ""}</p>{testimonial.admin_notes && <p className="mt-2 rounded-lg border border-neutral-800 bg-black/30 p-3 text-sm text-neutral-400"><span className="font-semibold text-neutral-200">Admin notes:</span> {testimonial.admin_notes}</p>}</div><div className="flex shrink-0 flex-wrap gap-2"><button type="button" onClick={() => { setEditing(testimonial); setForm(formFrom(testimonial)); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="min-h-10 rounded-lg border border-neutral-700 px-3 py-2 text-xs font-semibold text-neutral-100 hover:bg-neutral-900">Edit</button>{testimonial.status !== "approved" && <button type="button" onClick={() => void moderate(testimonial, "approved", false)} className="min-h-10 rounded-lg border border-emerald-500/35 px-3 py-2 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/10">Approve</button>}{testimonial.status !== "rejected" && <button type="button" onClick={() => void moderate(testimonial, "rejected", false)} className="min-h-10 rounded-lg border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/10">Reject</button>}{testimonial.status === "approved" && <button type="button" onClick={() => void moderate(testimonial, "approved", !testimonial.is_featured)} className="min-h-10 rounded-lg border border-amber-400/35 px-3 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-400/10">{testimonial.is_featured ? "Unfeature" : "Feature"}</button>}<button type="button" onClick={() => setDeleteTarget(testimonial)} className="min-h-10 rounded-lg border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/10">Delete</button></div></div></article>)}</div>}</section>

    {deleteTarget && <div className="fixed inset-0 z-[80] flex items-end bg-black/70 p-4 sm:items-center sm:justify-center"><div role="dialog" aria-modal="true" aria-labelledby="delete-testimonial-title" className="w-full max-w-md rounded-2xl border border-red-500/30 bg-neutral-950 p-6 shadow-2xl"><h2 id="delete-testimonial-title" className="text-2xl font-bold text-white">Delete this testimonial?</h2><p className="mt-3 text-sm leading-6 text-neutral-300">This cannot be undone.</p><div className="mt-6 flex justify-end gap-3"><button type="button" disabled={deleting} onClick={() => setDeleteTarget(null)} className="min-h-10 rounded-lg border border-neutral-700 px-4 py-2 text-sm font-semibold text-neutral-200">Cancel</button><button type="button" disabled={deleting} onClick={() => void remove()} className="min-h-10 rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{deleting ? "Deleting..." : "Delete Testimonial"}</button></div></div></div>}
  </main>;
}

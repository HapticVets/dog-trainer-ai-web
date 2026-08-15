"use client";

import { FormEvent, useEffect, useState } from "react";
import { STANDARD_COLLAR_COLORS } from "@/lib/admin-puppy-collars";

type Puppy = { id: string; puppy_code: string; collar_color: string | null };
type Props = { litterId: string; puppies: Puppy[]; onSaved: (puppies: Puppy[]) => void };
const autoFillColors = [...STANDARD_COLLAR_COLORS];

function getCustomValue(value: string | null) {
  return value && !STANDARD_COLLAR_COLORS.includes(value as (typeof STANDARD_COLLAR_COLORS)[number]) ? value : "";
}

export default function AssignCollarColors({ litterId, puppies, onSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setAssignments(Object.fromEntries(puppies.map((puppy) => [puppy.id, puppy.collar_color ?? ""])));
    setCustomFields(Object.fromEntries(puppies.map((puppy) => [puppy.id, getCustomValue(puppy.collar_color)])));
  }, [puppies]);

  const openPanel = () => {
    setAssignments(Object.fromEntries(puppies.map((puppy) => [puppy.id, puppy.collar_color ?? ""])));
    setCustomFields(Object.fromEntries(puppies.map((puppy) => [puppy.id, getCustomValue(puppy.collar_color)])));
    setError("");
    setOpen(true);
  };

  const autoFill = () => {
    const next = { ...assignments };
    puppies.forEach((puppy, index) => {
      if (!next[puppy.id]) next[puppy.id] = autoFillColors[index] ?? "";
    });
    setAssignments(next);
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = Object.fromEntries(puppies.map((puppy) => [puppy.id, assignments[puppy.id] === "Custom" ? customFields[puppy.id] : assignments[puppy.id]]));
      const response = await fetch(`/api/admin/litters/${litterId}/puppies/collars`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assignments: payload }) });
      const body = (await response.json().catch(() => ({}))) as { puppies?: Puppy[]; error?: string };
      if (!response.ok) throw new Error(body.error || "Unable to save collar assignments.");
      onSaved(body.puppies ?? []);
      setOpen(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save collar assignments.");
    } finally {
      setSaving(false);
    }
  };

  return <><button type="button" onClick={openPanel} className="min-h-11 rounded-lg border border-amber-400/35 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-400/10">Assign Collar Colors</button>{open && <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-4" role="dialog" aria-modal="true" aria-labelledby="collar-assignment-title"><form onSubmit={save} className="mx-auto my-4 max-w-2xl rounded-2xl border border-amber-400/25 bg-neutral-950 p-5 shadow-2xl sm:my-8"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-300">Litter Management</p><h2 id="collar-assignment-title" className="mt-1 text-2xl font-bold text-white">Assign Collar Colors</h2><p className="mt-2 text-sm leading-6 text-neutral-400">Puppy codes remain permanent. Collar labels are the physical identifier used during daily handling.</p></div><button type="button" disabled={saving} onClick={() => setOpen(false)} className="min-h-10 rounded-lg px-3 text-neutral-300 hover:bg-neutral-800">Close</button></div><div className="mt-5 flex flex-col gap-3 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-amber-100">Auto-fill standard colors only fills unassigned puppies. Review and save to confirm.</p><button type="button" onClick={autoFill} className="min-h-11 shrink-0 rounded-lg border border-amber-400/35 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-400/10">Auto-Fill Standard Colors</button></div><div className="mt-5 space-y-3">{puppies.map((puppy) => <div key={puppy.id} className="rounded-xl border border-neutral-800 bg-black/40 p-4"><label className="block text-sm font-semibold text-white">{puppy.puppy_code}<span className="mt-1 block font-normal text-neutral-400">{assignments[puppy.id] ? `${assignments[puppy.id] === "Custom" ? customFields[puppy.id] || "Custom" : assignments[puppy.id]} Collar` : "Collar not assigned"}</span><select value={assignments[puppy.id] ?? ""} onChange={(event) => setAssignments({ ...assignments, [puppy.id]: event.target.value })} className="mt-3 min-h-11 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 text-white"><option value="">No collar assigned</option>{STANDARD_COLLAR_COLORS.map((color) => <option key={color} value={color}>{color}</option>)}<option value="Custom">Custom</option></select></label>{assignments[puppy.id] === "Custom" && <label className="mt-3 block text-sm text-neutral-300">Custom collar label<input required maxLength={40} value={customFields[puppy.id] ?? ""} onChange={(event) => setCustomFields({ ...customFields, [puppy.id]: event.target.value })} className="mt-1 min-h-11 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 text-white" placeholder="e.g. Light blue" /></label>}</div>)}</div>{error && <p className="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200" role="alert">{error}</p>}<div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" disabled={saving} onClick={() => setOpen(false)} className="min-h-11 rounded-lg border border-neutral-700 px-4 py-2 font-semibold text-white">Cancel</button><button disabled={saving} className="min-h-11 rounded-lg bg-amber-400 px-4 py-2 font-bold text-black disabled:cursor-not-allowed disabled:opacity-70">{saving ? "Saving..." : "Save Assignments"}</button></div></form></div>}</>;
}

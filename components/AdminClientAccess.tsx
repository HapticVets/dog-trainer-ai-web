"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import type { AdminDogProfile } from "@/lib/adminDogs";

type ClientAccessData = {
  link: { customer_clerk_user_id: string; customer_dog_profile_id: string | null } | null;
  customerProfiles: Array<{ id: string; name: string }>;
  clientAccess: boolean;
};

export default function AdminClientAccess({ dog }: { dog: AdminDogProfile }) {
  const [data, setData] = useState<ClientAccessData | null>(null);
  const [email, setEmail] = useState(dog.client_owner_email ?? "");
  const [selectedDogId, setSelectedDogId] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/dogs/${encodeURIComponent(dog.id)}/client-access`, { cache: "no-store" });
      const result = await response.json() as ClientAccessData & { error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to load client access.");
      setData(result);
      setSelectedDogId(result.link?.customer_dog_profile_id ?? "");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load client access.");
    } finally {
      setLoading(false);
    }
  }, [dog.id]);

  useEffect(() => { void load(); }, [load]);

  const update = async (action: string, extras: Record<string, string> = {}) => {
    setWorking(true); setMessage("");
    try {
      const response = await fetch(`/api/admin/dogs/${encodeURIComponent(dog.id)}/client-access`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extras }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to update client access.");
      setMessage(action === "grant_access" ? "Patriot K9 Client Access granted." : "Client access updated.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update client access.");
    } finally { setWorking(false); }
  };

  const submitAccount = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void update("link_account", { email });
  };

  return <section className="rounded-2xl border border-amber-400/25 bg-neutral-950/80 p-5">
    <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Client AI Access</p>
    <h2 className="mt-2 text-xl font-bold text-white">Trainer-to-client link</h2>
    <p className="mt-2 text-sm leading-6 text-neutral-400">Only approved homework is shared with the linked customer profile.</p>
    {loading ? <p className="mt-4 text-sm text-neutral-500">Loading client link...</p> : <>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
        <span className="rounded-full border border-neutral-700 px-2.5 py-1 text-neutral-300">{data?.link ? "Client Account Linked" : "Not Linked"}</span>
        <span className="rounded-full border border-neutral-700 px-2.5 py-1 text-neutral-300">{data?.link?.customer_dog_profile_id ? "Dog Profile Linked" : "Dog Profile Not Linked"}</span>
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-200">{data?.clientAccess ? "Client Access Included" : "Access Not Granted"}</span>
      </div>
      <form onSubmit={submitAccount} className="mt-4 space-y-2"><label className="block text-sm font-semibold text-neutral-200">Client account email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-lg border border-neutral-700 bg-black/40 px-3 py-2.5 text-white" /></label><button type="submit" disabled={working} className="min-h-10 rounded-lg border border-amber-400/35 px-3 py-2 text-sm font-semibold text-amber-100 disabled:opacity-60">Link Client Account</button></form>
      {data?.link && <div className="mt-4 space-y-3"><label className="block text-sm font-semibold text-neutral-200">Customer dog profile<select value={selectedDogId} onChange={(event) => setSelectedDogId(event.target.value)} className="mt-2 w-full rounded-lg border border-neutral-700 bg-black/40 px-3 py-2.5 text-white"><option value="">Select client dog profile</option>{data.customerProfiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select></label><div className="flex flex-wrap gap-2"><button type="button" disabled={working || !selectedDogId} onClick={() => void update("link_dog", { customerDogProfileId: selectedDogId })} className="min-h-10 rounded-lg border border-neutral-700 px-3 py-2 text-sm font-semibold text-neutral-200 disabled:opacity-60">Link Dog Profile</button><button type="button" disabled={working} onClick={() => void update(data.clientAccess ? "revoke_access" : "grant_access")} className="min-h-10 rounded-lg bg-amber-400 px-3 py-2 text-sm font-bold text-black disabled:opacity-60">{data.clientAccess ? "Revoke Client Access" : "Grant Patriot K9 Client Access"}</button></div></div>}
    </>}
    {message && <p className="mt-4 text-sm text-amber-100" role="status">{message}</p>}
  </section>;
}

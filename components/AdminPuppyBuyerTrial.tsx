"use client";

import Image from "next/image";
import QRCode from "qrcode";
import { FormEvent, useCallback, useEffect, useState } from "react";

type BuyerTrial = {
  id: string;
  code: string;
  status: "available" | "redeemed" | "revoked";
  buyer_email: string | null;
  created_at: string;
  redeemed_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  redemptionUrl: string;
};

const formatDate = (value: string | null) =>
  value ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value)) : "Not set";

const activeDays = (expiresAt: string | null) =>
  expiresAt ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000)) : 0;

export default function AdminPuppyBuyerTrial({ litterId, puppyId }: { litterId: string; puppyId: string }) {
  const endpoint = `/api/admin/litters/${litterId}/puppies/${puppyId}/buyer-trial`;
  const [trial, setTrial] = useState<BuyerTrial | null>(null);
  const [buyerEmail, setBuyerEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      const data = await response.json() as { trial?: BuyerTrial | null; error?: string };
      if (!response.ok) throw new Error(data.error || "Unable to load buyer trial.");
      const currentTrial = data.trial ?? null;
      setTrial(currentTrial);
      setBuyerEmail(currentTrial?.buyer_email ?? "");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load buyer trial.");
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    let mounted = true;
    if (!trial?.redemptionUrl || !showQr) {
      setQrDataUrl("");
      return;
    }
    void QRCode.toDataURL(trial.redemptionUrl, { width: 280, margin: 1, color: { dark: "#090909", light: "#ffffff" }, errorCorrectionLevel: "M" })
      .then((url) => { if (mounted) setQrDataUrl(url); })
      .catch(() => { if (mounted) setError("Unable to generate this QR image."); });
    return () => { mounted = false; };
  }, [showQr, trial?.redemptionUrl]);

  const createTrial = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (working) return;
    setWorking(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ buyerEmail }) });
      const data = await response.json() as { trial?: BuyerTrial; error?: string };
      if (data.trial) setTrial(data.trial);
      if (!response.ok) throw new Error(data.error || "Unable to generate buyer trial.");
      setBuyerEmail(data.trial?.buyer_email ?? buyerEmail.trim().toLowerCase());
      setShowQr(true);
      setNotice("Buyer trial QR generated.");
    } catch (creationError) {
      setError(creationError instanceof Error ? creationError.message : "Unable to generate buyer trial.");
    } finally {
      setWorking(false);
    }
  };

  const updateBuyerEmail = async () => {
    if (working || !trial) return;
    setWorking(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(endpoint, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ buyerEmail }) });
      const data = await response.json() as { trial?: BuyerTrial; error?: string };
      if (!response.ok || !data.trial) throw new Error(data.error || "Unable to update buyer email.");
      setTrial(data.trial);
      setBuyerEmail(data.trial.buyer_email ?? "");
      setNotice("Buyer email updated for this available invitation.");
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update buyer email.");
    } finally {
      setWorking(false);
    }
  };

  const revoke = async () => {
    if (!trial || working || !window.confirm("Revoke this buyer trial? The QR will no longer work.")) return;
    setWorking(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/promotional-trials/${encodeURIComponent(trial.id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "revoke" }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Unable to revoke buyer trial.");
      setTrial(null);
      setShowQr(false);
      setNotice("Buyer trial revoked. You can generate a new invitation if needed.");
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : "Unable to revoke buyer trial.");
    } finally {
      setWorking(false);
    }
  };

  const copy = async () => {
    if (!trial) return;
    await navigator.clipboard.writeText(trial.redemptionUrl);
    setNotice("Buyer trial link copied.");
  };

  const share = async () => {
    if (!trial) return;
    if (navigator.share) {
      await navigator.share({ title: "Patriot K9 Puppy AI Trainer Trial", text: "Your puppy includes 30 days of Patriot K9 AI Trainer access.", url: trial.redemptionUrl });
      return;
    }
    await copy();
  };

  const isActive = trial?.status === "redeemed" && !trial.revoked_at && Boolean(trial.expires_at) && new Date(trial.expires_at!).getTime() > Date.now();
  const trialStatusLabel = isActive ? "Active" : trial?.status === "redeemed" ? "Expired" : trial?.status ?? "";
  return (
    <section className="mt-6 rounded-2xl border border-amber-400/20 bg-neutral-950 p-5">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-300">Buyer AI Trainer Trial</p>
      <h2 className="mt-1 text-xl font-bold text-white">30-Day AI Trainer Trial</h2>
      <p className="mt-2 text-sm leading-6 text-neutral-400">Issue one email-bound invitation included with this puppy. The buyer&apos;s verified Clerk email must match before activation.</p>
      {loading ? <p className="mt-4 text-sm text-neutral-400">Loading buyer trial...</p> : !trial ? <form onSubmit={createTrial} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end"><label className="min-w-0 flex-1 text-sm font-semibold text-neutral-200">Buyer Email<input required type="email" value={buyerEmail} onChange={(event) => setBuyerEmail(event.target.value)} placeholder="buyer@example.com" className="mt-2 min-h-11 w-full rounded-lg border border-neutral-700 bg-black px-3 text-white placeholder:text-neutral-600" /></label><button disabled={working} className="min-h-11 rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-black hover:bg-amber-300 disabled:opacity-60">{working ? "Generating..." : "Generate Buyer Trial QR"}</button></form> : <div className="mt-5 rounded-xl border border-neutral-800 bg-black/35 p-4"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${isActive ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100" : trial.status === "available" ? "border-amber-400/30 bg-amber-400/10 text-amber-100" : "border-neutral-700 text-neutral-300"}`}>{trialStatusLabel}</span><span className="font-mono text-xs text-neutral-400">{trial.code}</span></div><p className="mt-3 text-sm text-white">Buyer: {trial.buyer_email}</p><p className="mt-1 text-xs text-neutral-500">Generated {formatDate(trial.created_at)}{trial.redeemed_at ? ` · Redeemed ${formatDate(trial.redeemed_at)}` : ""}{trial.expires_at ? ` · Expires ${formatDate(trial.expires_at)}` : ""}{isActive ? ` · ${activeDays(trial.expires_at)} days remaining` : ""}</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setShowQr((value) => !value)} className="min-h-10 rounded-lg border border-neutral-700 px-3 py-2 text-xs font-semibold text-neutral-100 hover:bg-neutral-900">{showQr ? "Hide QR" : "View QR"}</button><button type="button" onClick={() => void revoke()} disabled={working} className="min-h-10 rounded-lg border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/10 disabled:opacity-60">{working ? "Working..." : "Revoke"}</button></div></div>{trial.status === "available" && <div className="mt-4 flex flex-col gap-3 border-t border-neutral-800 pt-4 sm:flex-row sm:items-end"><label className="min-w-0 flex-1 text-sm font-semibold text-neutral-200">Buyer Email<input type="email" value={buyerEmail} onChange={(event) => setBuyerEmail(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 text-white" /></label><button type="button" onClick={() => void updateBuyerEmail()} disabled={working || buyerEmail.trim().toLowerCase() === trial.buyer_email} className="min-h-11 rounded-lg border border-amber-400/35 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-400/10 disabled:opacity-50">Update Buyer Email</button></div>}{showQr && <div className="mt-4 border-t border-neutral-800 pt-4"><div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">{qrDataUrl && <Image src={qrDataUrl} alt={`Buyer trial QR code for ${trial.buyer_email}`} width={128} height={128} unoptimized className="h-32 w-32 rounded-lg bg-white p-2" />}<div className="min-w-0"><p className="break-all font-mono text-xs text-neutral-300">{trial.redemptionUrl}</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => void copy()} className="min-h-10 rounded-lg border border-neutral-700 px-3 py-2 text-xs font-semibold text-neutral-100 hover:bg-neutral-900">Copy Link</button><button type="button" onClick={() => void share()} className="min-h-10 rounded-lg border border-neutral-700 px-3 py-2 text-xs font-semibold text-neutral-100 hover:bg-neutral-900">Share</button>{qrDataUrl && <a href={qrDataUrl} download={`${trial.code}.png`} className="inline-flex min-h-10 items-center rounded-lg border border-amber-400/35 px-3 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-400/10">Download QR</a>}</div></div></div></div>}</div>}
      {(error || notice) && <p className={`mt-4 rounded-lg border px-3 py-2 text-sm ${error ? "border-red-400/30 bg-red-400/10 text-red-200" : "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"}`} role={error ? "alert" : "status"}>{error || notice}</p>}
    </section>
  );
}

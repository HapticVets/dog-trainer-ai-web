"use client";

import QRCode from "qrcode";
import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Trial = {
  id: string;
  code: string;
  trial_days: number;
  trial_type: "general" | "puppy_buyer";
  status: "available" | "redeemed" | "revoked";
  campaign_name: string | null;
  organization_name: string | null;
  notes: string | null;
  buyer_email: string | null;
  redeemed_by_email: string | null;
  created_at: string;
  redeemed_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  redemptionUrl: string;
};

type TrialFeedback = {
  id: string;
  promotional_trial_code_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

type TrialConversionEvent = {
  id: string;
  promotional_trial_code_id: string;
  event_type: "trial_upgrade_cta_clicked" | "trial_converted_to_premium";
  created_at: string;
};

type DateRange = "all" | "30" | "90";

const formatDate = (value: string | null) =>
  value ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value)) : "Not set";

const daysRemaining = (expiresAt: string | null) =>
  expiresAt ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000)) : 0;

const percent = (numerator: number, denominator: number) =>
  denominator ? `${Math.round((numerator / denominator) * 100)}%` : "0%";

function TrialQr({ trial }: { trial: Trial }) {
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    let mounted = true;
    void QRCode.toDataURL(trial.redemptionUrl, {
      width: 280,
      margin: 1,
      color: { dark: "#090909", light: "#ffffff" },
      errorCorrectionLevel: "M",
    }).then((url) => { if (mounted) setDataUrl(url); });
    return () => { mounted = false; };
  }, [trial.redemptionUrl]);

  const copy = async () => {
    await navigator.clipboard.writeText(trial.redemptionUrl);
  };

  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: "Patriot K9 AI Trainer Trial", text: `Your complimentary ${trial.trial_days}-day Patriot K9 AI Trainer trial.`, url: trial.redemptionUrl });
      return;
    }
    await copy();
  };

  return (
    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
      {dataUrl && <Image src={dataUrl} alt={`QR code for trial ${trial.code}`} width={128} height={128} unoptimized className="h-32 w-32 rounded-lg bg-white p-2" />}
      <div className="min-w-0 space-y-2">
        <p className="break-all font-mono text-xs text-neutral-300">{trial.redemptionUrl}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void copy()} className="rounded-lg border border-neutral-700 px-3 py-2 text-xs font-semibold text-neutral-100 hover:bg-neutral-900">Copy Link</button>
          <button type="button" onClick={() => void share()} className="rounded-lg border border-neutral-700 px-3 py-2 text-xs font-semibold text-neutral-100 hover:bg-neutral-900">Share</button>
          {dataUrl && <a href={dataUrl} download={`${trial.code}.png`} className="rounded-lg border border-amber-400/35 px-3 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-400/10">Download QR</a>}
        </div>
      </div>
    </div>
  );
}

export default function AdminPromotionalTrials() {
  const [trials, setTrials] = useState<Trial[]>([]);
  const [quantity, setQuantity] = useState("1");
  const [campaignName, setCampaignName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [expandedQrId, setExpandedQrId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedTrialIds, setSelectedTrialIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<TrialFeedback[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(true);
  const [feedbackError, setFeedbackError] = useState("");
  const [conversionEvents, setConversionEvents] = useState<TrialConversionEvent[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>("all");

  const isPrintableTrial = (trial: Trial) =>
    trial.trial_type === "general" && trial.status === "available" && !trial.revoked_at;

  const openPrintableSheet = (trialIds: string[]) => {
    const uniqueIds = [...new Set(trialIds)];
    if (!uniqueIds.length) return;

    const searchParams = new URLSearchParams();
    uniqueIds.forEach((id) => searchParams.append("id", id));
    window.open(`/admin/trials/print?${searchParams.toString()}`, "_blank", "noopener");
  };

  const toggleTrialSelection = (trialId: string) => {
    setSelectedTrialIds((current) =>
      current.includes(trialId)
        ? current.filter((id) => id !== trialId)
        : [...current, trialId],
    );
  };

  const loadTrials = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/promotional-trials", { cache: "no-store" });
      const data = await response.json() as { trials?: Trial[]; conversionEvents?: TrialConversionEvent[]; error?: string };
      if (!response.ok) throw new Error(data.error || "Unable to load trial QR codes.");
      setTrials(data.trials ?? []);
      setConversionEvents(data.conversionEvents ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load trial QR codes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadTrials(); }, []);

  useEffect(() => {
    let active = true;
    void fetch("/api/admin/promotional-trials/feedback", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json() as { feedback?: TrialFeedback[]; error?: string };
        if (!response.ok) throw new Error(data.error || "Unable to load trial feedback.");
        if (active) setFeedback(data.feedback ?? []);
      })
      .catch((loadError) => { if (active) setFeedbackError(loadError instanceof Error ? loadError.message : "Unable to load trial feedback."); })
      .finally(() => { if (active) setFeedbackLoading(false); });
    return () => { active = false; };
  }, []);

  const conversionSummary = useMemo(() => {
    const cutoff = dateRange === "all" ? null : Date.now() - Number(dateRange) * 86_400_000;
    const selectedTrials = cutoff
      ? trials.filter((trial) => new Date(trial.created_at).getTime() >= cutoff)
      : trials;
    const selectedIds = new Set(selectedTrials.map((trial) => trial.id));
    const selectedEvents = conversionEvents.filter((event) => selectedIds.has(event.promotional_trial_code_id));
    const redeemed = selectedTrials.filter((trial) => Boolean(trial.redeemed_at)).length;
    const clicks = selectedEvents.filter((event) => event.event_type === "trial_upgrade_cta_clicked").length;
    const paidTrialIds = new Set(selectedEvents.filter((event) => event.event_type === "trial_converted_to_premium").map((event) => event.promotional_trial_code_id));
    const campaigns = new Map<string, { label: string; generated: number; redeemed: number; paid: number }>();

    selectedTrials.forEach((trial) => {
      const campaign = trial.campaign_name || "Unspecified";
      const label = trial.organization_name ? `${campaign} - ${trial.organization_name}` : campaign;
      const entry = campaigns.get(label) ?? { label, generated: 0, redeemed: 0, paid: 0 };
      entry.generated += 1;
      if (trial.redeemed_at) entry.redeemed += 1;
      if (paidTrialIds.has(trial.id)) entry.paid += 1;
      campaigns.set(label, entry);
    });

    return {
      generated: selectedTrials.length,
      redeemed,
      clicks,
      paid: paidTrialIds.size,
      campaignRows: [...campaigns.values()].sort((a, b) => b.generated - a.generated || a.label.localeCompare(b.label)),
    };
  }, [conversionEvents, dateRange, trials]);

  const convertedTrialIds = useMemo(
    () => new Set(conversionEvents.filter((event) => event.event_type === "trial_converted_to_premium").map((event) => event.promotional_trial_code_id)),
    [conversionEvents],
  );

  const feedbackTrialIds = useMemo(
    () => new Set(feedback.map((entry) => entry.promotional_trial_code_id)),
    [feedback],
  );

  const generate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGenerating(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/promotional-trials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: Number(quantity), campaignName, organizationName, notes }),
      });
      const data = await response.json() as { trials?: Trial[]; error?: string };
      if (!response.ok) throw new Error(data.error || "Unable to generate trial QR codes.");
      const generated = data.trials ?? [];
      setTrials((current) => [...generated, ...current]);
      setExpandedQrId(generated.length === 1 ? generated[0].id : null);
      setSelectedTrialIds(generated.filter(isPrintableTrial).map((trial) => trial.id));
      setNotice(`${generated.length} unique 15-day trial ${generated.length === 1 ? "code was" : "codes were"} generated.`);
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "Unable to generate trial QR codes.");
    } finally {
      setGenerating(false);
    }
  };

  const revoke = async (trial: Trial) => {
    if (!window.confirm(`Revoke ${trial.code}? It can no longer be redeemed and any active trial from it will end.`)) return;
    setRevokingId(trial.id);
    setError("");
    try {
      const response = await fetch(`/api/admin/promotional-trials/${encodeURIComponent(trial.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke" }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Unable to revoke trial code.");
      setTrials((current) => current.map((item) => item.id === trial.id ? { ...item, status: "revoked", revoked_at: new Date().toISOString() } : item));
      setSelectedTrialIds((current) => current.filter((id) => id !== trial.id));
      setNotice("Trial code revoked.");
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : "Unable to revoke trial code.");
    } finally {
      setRevokingId(null);
    }
  };

  const deleteRevoked = async (trial: Trial) => {
    if ((trial.status !== "revoked" && !trial.revoked_at) || deletingId || !window.confirm("Delete this revoked trial record? This cannot be undone.")) return;
    setDeletingId(trial.id);
    setError("");
    try {
      const response = await fetch(`/api/admin/promotional-trials/${encodeURIComponent(trial.id)}`, { method: "DELETE" });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Unable to delete revoked trial record.");
      setTrials((current) => current.filter((item) => item.id !== trial.id));
      setSelectedTrialIds((current) => current.filter((id) => id !== trial.id));
      setExpandedQrId((current) => current === trial.id ? null : current);
      setNotice("Revoked trial record deleted.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete revoked trial record.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-9">
      <div className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-300">Patriot K9 Admin</p>
        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Trial QR Codes</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-300">Generate a unique, one-time 15-day AI Trainer invitation for a referral, shelter, rescue, or community event.</p>
      </div>

      <form onSubmit={generate} className="mt-6 rounded-2xl border border-amber-400/25 bg-neutral-950 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.22)] sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">Generate Free AI Trainer Trial</p><p className="mt-1 text-sm text-neutral-400">Every QR is unique and grants one authenticated account 15 days of full trainer access.</p></div><span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-100">15 days fixed</span></div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm font-semibold text-neutral-200">Quantity<input value={quantity} onChange={(event) => setQuantity(event.target.value)} type="number" min="1" max="50" required className="mt-2 min-h-11 w-full rounded-lg border border-neutral-700 bg-black/40 px-3 text-white outline-none focus:border-amber-300" /></label>
          <label className="text-sm font-semibold text-neutral-200">Campaign / Source<input value={campaignName} onChange={(event) => setCampaignName(event.target.value)} placeholder="Shelter, referral..." className="mt-2 min-h-11 w-full rounded-lg border border-neutral-700 bg-black/40 px-3 text-white placeholder:text-neutral-600 outline-none focus:border-amber-300" /></label>
          <label className="text-sm font-semibold text-neutral-200">Organization<input value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} placeholder="Optional" className="mt-2 min-h-11 w-full rounded-lg border border-neutral-700 bg-black/40 px-3 text-white placeholder:text-neutral-600 outline-none focus:border-amber-300" /></label>
          <label className="text-sm font-semibold text-neutral-200">Internal Notes<input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional" className="mt-2 min-h-11 w-full rounded-lg border border-neutral-700 bg-black/40 px-3 text-white placeholder:text-neutral-600 outline-none focus:border-amber-300" /></label>
        </div>
        <button type="submit" disabled={generating} className="mt-5 min-h-12 w-full rounded-lg bg-amber-400 px-5 py-3 text-sm font-bold text-black transition hover:bg-amber-300 disabled:cursor-wait disabled:opacity-60 sm:w-auto">{generating ? "Generating..." : Number(quantity) > 1 ? "Generate Trial QRs" : "Generate Trial QR"}</button>
      </form>

      {(error || notice) && <p className={`mt-4 rounded-lg border px-4 py-3 text-sm ${error ? "border-red-500/35 bg-red-500/10 text-red-200" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"}`} role={error ? "alert" : "status"}>{error || notice}</p>}

      <section className="mt-8 rounded-2xl border border-amber-400/20 bg-neutral-950 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.18)] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Conversion Funnel</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Trial-to-Premium performance</h2>
            <p className="mt-2 text-sm text-neutral-400">Paid conversions are confirmed from Stripe subscription lifecycle events, not checkout clicks.</p>
          </div>
          <label className="text-sm font-semibold text-neutral-200">Date range<select value={dateRange} onChange={(event) => setDateRange(event.target.value as DateRange)} className="mt-2 min-h-10 w-full rounded-lg border border-neutral-700 bg-black px-3 text-sm text-white outline-none focus:border-amber-300 sm:w-40"><option value="all">All time</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select></label>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[
            ["Generated", conversionSummary.generated],
            ["Redeemed", conversionSummary.redeemed],
            ["Redeemed rate", percent(conversionSummary.redeemed, conversionSummary.generated)],
            ["Upgrade CTA clicks", conversionSummary.clicks],
            ["Paid conversions", conversionSummary.paid],
            ["Trial-to-paid rate", percent(conversionSummary.paid, conversionSummary.redeemed)],
          ].map(([label, value]) => <div key={label} className="rounded-xl border border-neutral-800 bg-black/40 p-4"><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500">{label}</p><p className="mt-2 text-2xl font-bold text-white">{value}</p></div>)}
        </div>
        <div className="mt-6 overflow-x-auto rounded-xl border border-neutral-800">
          <table className="min-w-full text-left text-sm"><caption className="caption-top px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.16em] text-amber-300">Campaign / source breakdown</caption><thead className="border-y border-neutral-800 bg-black/40 text-xs uppercase tracking-[0.12em] text-neutral-500"><tr><th className="px-4 py-3 font-semibold">Campaign</th><th className="px-4 py-3 font-semibold">Generated</th><th className="px-4 py-3 font-semibold">Redeemed</th><th className="px-4 py-3 font-semibold">Paid</th><th className="px-4 py-3 font-semibold">Conversion</th></tr></thead><tbody>{conversionSummary.campaignRows.length ? conversionSummary.campaignRows.map((row) => <tr key={row.label} className="border-t border-neutral-800 text-neutral-300"><td className="px-4 py-3 font-medium text-white">{row.label}</td><td className="px-4 py-3">{row.generated}</td><td className="px-4 py-3">{row.redeemed}</td><td className="px-4 py-3">{row.paid}</td><td className="px-4 py-3 text-amber-200">{percent(row.paid, row.redeemed)}</td></tr>) : <tr><td colSpan={5} className="px-4 py-5 text-neutral-500">No trial activity in this date range.</td></tr>}</tbody></table>
        </div>
      </section>

      <section className="mt-7"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Trial History</p><h2 className="mt-2 text-2xl font-bold text-white">Generated invitations</h2></div><span className="rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-300">{trials.length} total</span></div>
        {loading ? <p className="mt-5 text-sm text-neutral-400">Loading trial QR codes...</p> : trials.length === 0 ? <p className="mt-5 rounded-xl border border-dashed border-neutral-700 p-5 text-sm text-neutral-400">No promotional trial codes have been generated yet.</p> : <><div className="mt-5 flex flex-col gap-3 rounded-xl border border-neutral-800 bg-black/30 p-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-wrap items-center gap-2"><button type="button" onClick={() => setSelectedTrialIds(trials.filter(isPrintableTrial).map((trial) => trial.id))} className="rounded-lg border border-neutral-700 px-3 py-2 text-xs font-semibold text-neutral-100 hover:bg-neutral-900">Select All Printable</button><button type="button" onClick={() => setSelectedTrialIds([])} disabled={!selectedTrialIds.length} className="rounded-lg border border-neutral-700 px-3 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-45">Clear Selection</button><span className="text-xs text-neutral-400">{selectedTrialIds.length} selected</span></div><button type="button" onClick={() => openPrintableSheet(selectedTrialIds)} disabled={!selectedTrialIds.length} className="min-h-10 rounded-lg bg-amber-400 px-4 py-2 text-xs font-bold text-black hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-45">Open Printable Sheet</button></div><div className="mt-5 grid gap-4">{trials.map((trial) => { const active = trial.status === "redeemed" && !trial.revoked_at && Boolean(trial.expires_at) && new Date(trial.expires_at!).getTime() > Date.now(); const revoked = trial.status === "revoked" || Boolean(trial.revoked_at); const printable = isPrintableTrial(trial); const converted = convertedTrialIds.has(trial.id); const hasFeedback = feedbackTrialIds.has(trial.id); return <article key={trial.id} className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 sm:p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2">{printable && <label className="flex min-h-8 cursor-pointer items-center gap-2 rounded-lg border border-amber-400/25 bg-amber-400/5 px-2 text-xs font-semibold text-amber-100"><input type="checkbox" checked={selectedTrialIds.includes(trial.id)} onChange={() => toggleTrialSelection(trial.id)} className="h-4 w-4 accent-amber-400" aria-label={`Select ${trial.code} for printing`} />Print</label>}<p className="font-mono text-sm font-bold text-white">{trial.code}</p><span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${trial.status === "available" ? "border-amber-400/30 bg-amber-400/10 text-amber-100" : revoked ? "border-red-500/30 bg-red-500/10 text-red-200" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"}`}>{active ? "Active" : revoked ? "revoked" : trial.status}</span>{converted && <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-100">Paid conversion</span>}{hasFeedback && <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-amber-100">Feedback</span>}</div><p className="mt-2 text-sm text-neutral-300">{trial.campaign_name || "General invitation"}{trial.organization_name ? ` · ${trial.organization_name}` : ""}</p><p className="mt-1 text-xs text-neutral-500">Created {formatDate(trial.created_at)}{trial.redeemed_at ? ` · Redeemed ${formatDate(trial.redeemed_at)}` : ""}{active ? ` · ${daysRemaining(trial.expires_at)} days remaining` : ""}</p>{trial.redeemed_by_email && <p className="mt-1 text-xs text-neutral-400">Redeemed by {trial.redeemed_by_email}</p>}</div><div className="flex shrink-0 flex-wrap gap-2"><button type="button" onClick={() => setExpandedQrId((value) => value === trial.id ? null : trial.id)} className="rounded-lg border border-neutral-700 px-3 py-2 text-xs font-semibold text-neutral-100 hover:bg-neutral-900">{expandedQrId === trial.id ? "Hide QR" : "View QR"}</button>{printable && <button type="button" onClick={() => openPrintableSheet([trial.id])} className="rounded-lg border border-amber-400/35 px-3 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-400/10">Print Card</button>}{revoked ? <button type="button" onClick={() => void deleteRevoked(trial)} disabled={deletingId === trial.id} className="rounded-lg border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/10 disabled:opacity-60">{deletingId === trial.id ? "Deleting..." : "Delete"}</button> : <button type="button" onClick={() => void revoke(trial)} disabled={revokingId === trial.id} className="rounded-lg border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/10 disabled:opacity-60">{revokingId === trial.id ? "Revoking..." : "Revoke"}</button>}</div></div>{expandedQrId === trial.id && <div className="mt-4 border-t border-neutral-800 pt-4"><TrialQr trial={trial} /></div>}</article>; })}</div></>}
      </section>

      <section className="mt-8"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Trial Feedback</p><h2 className="mt-2 text-2xl font-bold text-white">Recent ratings</h2></div>{feedbackLoading ? <p className="mt-5 text-sm text-neutral-400">Loading trial feedback...</p> : feedbackError ? <p className="mt-5 rounded-xl border border-amber-500/30 bg-amber-400/10 p-4 text-sm text-amber-100">{feedbackError}</p> : feedback.length === 0 ? <p className="mt-5 rounded-xl border border-dashed border-neutral-800 p-5 text-sm text-neutral-500">No trial feedback has been submitted yet.</p> : <div className="mt-5 grid gap-3">{feedback.map((entry) => { const trial = trials.find((item) => item.id === entry.promotional_trial_code_id); return <article key={entry.id} className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-lg font-bold text-amber-200">{"★".repeat(entry.rating)}<span className="ml-2 text-sm font-normal text-neutral-300">{entry.rating} / 5</span></p><p className="mt-2 text-sm text-neutral-300">{entry.comment || "No comment provided."}</p></div><div className="text-sm text-neutral-400 sm:text-right"><p>{formatDate(entry.created_at)}</p><p className="mt-1 font-mono text-xs text-neutral-500">{trial?.code || "Trial record unavailable"}</p><p className="mt-1 text-xs">{trial?.campaign_name || trial?.organization_name || trial?.status || "Trial feedback"}</p></div></div></article>; })}</div>}</section>
    </main>
  );
}

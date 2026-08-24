"use client";

import { useEffect, useState } from "react";

type Feedback = { id: string; rating: number; comment: string | null; created_at: string };
const ratingLabels = ["Poor", "Fair", "Good", "Very Good", "Excellent"];

export default function PromotionalTrialFeedbackCard() {
  const [loading, setLoading] = useState(true);
  const [eligible, setEligible] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void fetch("/api/promotional-trials/feedback", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json() as { eligible?: boolean; feedback?: Feedback | null };
        if (!response.ok) throw new Error("Unable to load trial feedback.");
        if (!active) return;
        setEligible(data.eligible === true);
        setFeedback(data.feedback ?? null);
      })
      .catch(() => { if (active) setEligible(false); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const submit = async () => {
    if (!rating || saving) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/promotional-trials/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      const data = await response.json() as { feedback?: Feedback; error?: string };
      if (!response.ok || !data.feedback) throw new Error(data.error || "Unable to submit feedback right now.");
      setFeedback(data.feedback);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit feedback right now.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !eligible) return null;
  if (feedback) {
    const message = feedback.rating >= 4
      ? "Thanks - we're glad the Trainer has been useful."
      : feedback.rating <= 2
        ? "Thanks for the feedback. This helps us improve the Trainer."
        : "Thank you for your feedback.";
    return <section className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Trial Feedback Received</p><p className="mt-3 text-lg font-bold text-white">{message}</p></section>;
  }

  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-950/80 p-5 shadow-[0_16px_44px_rgba(0,0,0,0.2)] sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Trial Feedback</p>
      <h2 className="mt-3 text-xl font-bold text-white">How has the AI Trainer been working for you?</h2>
      <p className="mt-2 text-sm leading-6 text-neutral-300">Rate your experience so far. Your comment is optional.</p>
      <div className="mt-5 flex flex-wrap gap-2" role="radiogroup" aria-label="Rate your trial experience">
        {ratingLabels.map((label, index) => { const value = index + 1; const selected = rating === value; return <button key={label} type="button" role="radio" aria-checked={selected} onClick={() => setRating(value)} className={`min-h-11 min-w-11 rounded-lg border px-3 text-lg transition focus:outline-none focus:ring-2 focus:ring-amber-300 ${selected ? "border-amber-400 bg-amber-400 text-black" : "border-neutral-700 text-amber-200 hover:bg-neutral-900"}`} aria-label={`${value} stars: ${label}`}>★<span className="sr-only">{label}</span></button>; })}
      </div>
      <p className="mt-2 text-sm text-neutral-400">{rating ? `${rating} - ${ratingLabels[rating - 1]}` : "1 Poor · 2 Fair · 3 Good · 4 Very Good · 5 Excellent"}</p>
      <label className="mt-5 block text-sm font-semibold text-neutral-200">Optional comment<textarea value={comment} onChange={(event) => setComment(event.target.value.slice(0, 1000))} rows={3} maxLength={1000} placeholder="What has been helpful or what could be better?" className="mt-2 w-full rounded-lg border border-neutral-700 bg-black/40 px-3 py-2.5 text-white placeholder:text-neutral-500 outline-none focus:border-amber-400" /></label>
      {error && <p className="mt-3 text-sm text-red-200" role="alert">{error}</p>}
      <button type="button" onClick={() => void submit()} disabled={!rating || saving} className="mt-5 min-h-11 w-full rounded-lg bg-amber-400 px-5 py-3 text-sm font-bold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">{saving ? "Submitting..." : "Submit Feedback"}</button>
    </section>
  );
}

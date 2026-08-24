"use client";

import { useEffect, useMemo, useState } from "react";

type ActiveTrial = {
  expiresAt: string;
  daysRemaining: number;
};

type TrialStage = "subtle" | "notice" | "urgent" | "tomorrow" | "today";

export const getPromotionalTrialCountdown = (expiresAt: string, now = new Date()) => {
  const expires = new Date(expiresAt);
  const millisecondsRemaining = expires.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(millisecondsRemaining / 86_400_000));
  const endsToday = expires.toDateString() === now.toDateString();

  return { daysRemaining, endsToday };
};

const formatExpirationDate = (expiresAt: string) =>
  new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(
    new Date(expiresAt),
  );

export default function PromotionalTrialConversionCard({
  trial,
  expiredTrial,
  checkoutLoading,
  checkoutError,
  onUpgrade,
}: {
  trial: ActiveTrial | null;
  expiredTrial: { expiresAt: string } | null;
  checkoutLoading: boolean;
  checkoutError: string;
  onUpgrade: () => void;
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  const countdown = useMemo(
    () => (trial ? getPromotionalTrialCountdown(trial.expiresAt, now) : null),
    [now, trial],
  );

  if (!trial && !expiredTrial) return null;

  if (!trial || !countdown || countdown.daysRemaining === 0) {
    return (
      <section className="rounded-xl border border-amber-500/35 bg-gradient-to-br from-amber-400/10 via-neutral-950 to-neutral-950 p-5 shadow-[0_16px_44px_rgba(0,0,0,0.2)] sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Complimentary Trial Ended</p>
        <h2 className="mt-3 text-2xl font-bold text-white">Your Patriot K9 complimentary trial has ended.</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-300">Your dog&apos;s profile and training history are still here. Upgrade to Premium to continue with full AI Trainer access.</p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button type="button" onClick={onUpgrade} disabled={checkoutLoading} className="min-h-11 rounded-lg bg-amber-400 px-5 py-3 text-sm font-bold text-black transition hover:bg-amber-300 disabled:cursor-wait disabled:opacity-60">{checkoutLoading ? "Starting checkout..." : "Upgrade to Premium"}</button>
          <p className="text-sm text-neutral-400">You can continue using the Free plan.</p>
        </div>
        {checkoutError && <p className="mt-4 text-sm text-red-200" role="alert">{checkoutError}</p>}
      </section>
    );
  }

  const stage: TrialStage = countdown.endsToday
    ? "today"
    : countdown.daysRemaining === 1
      ? "tomorrow"
      : countdown.daysRemaining <= 3
        ? "urgent"
        : countdown.daysRemaining <= 5
          ? "notice"
          : "subtle";
  const ctaLabel = stage === "today" ? "Continue Premium" : stage === "tomorrow" ? "Keep Premium Access" : "Continue with Premium";
  const heading = stage === "today"
    ? "Your complimentary trial ends today."
    : stage === "tomorrow"
      ? "Your free trial ends tomorrow."
      : stage === "urgent"
        ? `${countdown.daysRemaining} days left in your Patriot K9 AI Trainer trial.`
        : stage === "notice"
          ? `Your complimentary trial ends in ${countdown.daysRemaining} days.`
          : "Patriot K9 Complimentary Trial";

  return (
    <section className={`rounded-xl border p-5 shadow-[0_16px_44px_rgba(0,0,0,0.2)] sm:p-6 ${stage === "subtle" ? "border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-neutral-950 to-neutral-950" : "border-amber-500/35 bg-gradient-to-br from-amber-400/10 via-neutral-950 to-neutral-950"}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-3xl">
          <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${stage === "subtle" ? "text-emerald-300" : "text-amber-300"}`}>Complimentary Access</p>
          <h2 className="mt-3 text-2xl font-bold text-white">{heading}</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-300">{stage === "urgent" || stage === "tomorrow" || stage === "today" ? "Keep your personalized training plans, AI coaching, and full Trainer access available without interruption." : `${countdown.daysRemaining} ${countdown.daysRemaining === 1 ? "day" : "days"} remaining. Trial ends ${formatExpirationDate(trial.expiresAt)}.`}</p>
        </div>
        <button type="button" onClick={onUpgrade} disabled={checkoutLoading} className={`min-h-11 w-full shrink-0 rounded-lg px-5 py-3 text-sm font-bold transition disabled:cursor-wait disabled:opacity-60 sm:w-auto ${stage === "subtle" ? "border border-emerald-500/35 text-emerald-100 hover:bg-emerald-500/10" : "bg-amber-400 text-black hover:bg-amber-300"}`}>{checkoutLoading ? "Starting checkout..." : ctaLabel}</button>
      </div>
      {(stage === "urgent" || stage === "tomorrow" || stage === "today") && <p className="mt-4 text-sm font-medium text-amber-200">Trial ends {formatExpirationDate(trial.expiresAt)}.</p>}
      {checkoutError && <p className="mt-4 text-sm text-red-200" role="alert">{checkoutError}</p>}
    </section>
  );
}

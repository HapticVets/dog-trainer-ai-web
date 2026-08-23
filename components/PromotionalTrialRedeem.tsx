"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type TrialState =
  | "loading"
  | "available"
  | "invalid"
  | "revoked"
  | "claimed"
  | "account_used"
  | "already_has_access"
  | "active"
  | "success"
  | "error";

const formatDate = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(value))
    : "";

export default function PromotionalTrialRedeem({ code }: { code: string }) {
  const [state, setState] = useState<TrialState>("loading");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [trialDays, setTrialDays] = useState(15);
  const [message, setMessage] = useState("");
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch(`/api/promotional-trials/${encodeURIComponent(code)}`, { cache: "no-store" });
        const data = await response.json() as { authenticated?: boolean; state?: TrialState; expiresAt?: string; trialDays?: number; error?: string };
        if (!active) return;
        if (!response.ok) {
          setState("error");
          setMessage(data.error || "Unable to check this complimentary trial right now.");
          return;
        }
        if (Number.isInteger(data.trialDays) && data.trialDays! > 0) setTrialDays(data.trialDays!);
        if (!data.authenticated) {
          setState("available");
          setMessage("signin");
          return;
        }
        setState(data.state ?? "error");
        setExpiresAt(data.expiresAt ?? null);
      } catch {
        if (active) {
          setState("error");
          setMessage("Unable to check this complimentary trial right now.");
        }
      }
    };
    void load();
    return () => { active = false; };
  }, [code]);

  const activate = async () => {
    if (activating) return;
    setActivating(true);
    setMessage("");
    try {
      const response = await fetch(`/api/promotional-trials/${encodeURIComponent(code)}`, { method: "POST" });
      const data = await response.json() as { expiresAt?: string; error?: string; state?: TrialState };
      if (!response.ok || !data.expiresAt) {
        setState(data.state ?? "error");
        setMessage(data.error || "Unable to activate this complimentary trial right now.");
        return;
      }
      setExpiresAt(data.expiresAt);
      setState("success");
    } catch {
      setState("error");
      setMessage("Unable to activate this complimentary trial right now.");
    } finally {
      setActivating(false);
    }
  };

  const signInTarget = `/sign-in?redirect_url=${encodeURIComponent(`/redeem/${code}`)}`;
  const signUpTarget = `/sign-up?redirect_url=${encodeURIComponent(`/redeem/${code}`)}`;
  const heading = state === "success" || state === "active" ? `Your ${trialDays}-Day Trial Is Active` : `${trialDays} Days of AI Training Included`;

  return (
    <main className="min-h-screen bg-[#080a08] px-4 py-10 text-white sm:px-6 sm:py-16">
      <section className="mx-auto max-w-xl rounded-2xl border border-amber-400/30 bg-neutral-950 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.42)] sm:p-9">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-300">Patriot K9 Command</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{heading}</h1>
        {state === "loading" ? (
          <p className="mt-4 text-neutral-300" role="status">Checking your complimentary trial...</p>
        ) : state === "success" || state === "active" ? (
          <>
            <p className="mt-4 text-lg leading-7 text-neutral-200">Your Patriot K9 AI Trainer access is active through <span className="font-semibold text-amber-200">{formatDate(expiresAt)}</span>.</p>
            <Link href="/train" className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-amber-400 px-5 py-3 text-sm font-bold text-black transition hover:bg-amber-300 sm:w-auto">Start Training</Link>
          </>
        ) : message === "signin" ? (
          <>
            <p className="mt-4 text-lg leading-7 text-neutral-200">You&apos;ve received a complimentary {trialDays}-day trial of the Patriot K9 AI Trainer. No credit card required.</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <Link href={signUpTarget} className="inline-flex min-h-12 items-center justify-center rounded-lg bg-amber-400 px-5 py-3 text-sm font-bold text-black transition hover:bg-amber-300">Create Account</Link>
              <Link href={signInTarget} className="inline-flex min-h-12 items-center justify-center rounded-lg border border-neutral-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-neutral-900">Sign In</Link>
            </div>
          </>
        ) : state === "available" ? (
          <>
            <p className="mt-4 text-lg leading-7 text-neutral-200">Your complimentary Patriot K9 AI Training trial is ready. Your {trialDays}-day trial begins when you activate it. No credit card required.</p>
            <button type="button" onClick={() => void activate()} disabled={activating} className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-amber-400 px-5 py-3 text-sm font-bold text-black transition hover:bg-amber-300 disabled:cursor-wait disabled:opacity-60 sm:w-auto">{activating ? "Activating..." : "Activate My Free Trial"}</button>
          </>
        ) : (
          <>
            <p className="mt-4 text-lg leading-7 text-neutral-200" role="alert">{message || (state === "claimed" ? "This complimentary trial has already been claimed." : state === "revoked" ? "This complimentary trial is no longer available." : state === "account_used" ? "This account has already used a complimentary Patriot K9 trial." : state === "already_has_access" ? "Your account already has Premium training access." : "This complimentary trial is not available.")}</p>
            <Link href="/train" className="mt-7 inline-flex min-h-12 items-center justify-center rounded-lg border border-amber-400/40 px-5 py-3 text-sm font-bold text-amber-100 transition hover:bg-amber-400/10">Back to AI Trainer</Link>
          </>
        )}
      </section>
    </main>
  );
}

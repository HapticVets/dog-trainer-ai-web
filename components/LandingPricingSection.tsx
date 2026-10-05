"use client";

import Link from "next/link";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";

export default function LandingPricingSection() {
  const { isSignedIn } = useUser();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleCheckout = async () => {
    if (checkoutLoading) return;
    setCheckoutLoading(true);
    try {
      const response = await fetch("/api/checkout", { method: "POST" });
      const data = await response.json();
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      alert(data?.error || "Unable to start checkout right now.");
    } catch (error) {
      console.error(error);
      alert("Unable to start checkout right now.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <section id="pricing" className="scroll-mt-24 border-b border-neutral-800 px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-400">Simple Pricing</p>
        <h2 className="mt-4 text-3xl font-bold md:text-4xl">Try the complete first training cycle free</h2>
        <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-neutral-300">Create your dog’s profile, receive a personalized first session, log the result, and ask up to 8 AI-coach questions. No credit card is required.</p>

        <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-neutral-700 bg-neutral-950 p-7 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">Free Trial</p>
            <p className="mt-3 text-4xl font-bold">$0</p>
            <ul className="mt-6 space-y-3 text-sm leading-7 text-neutral-300"><li>• 1 dog profile</li><li>• 1 personalized first session</li><li>• 1 completed-session log</li><li>• 8 AI-coach messages</li></ul>
            {!isSignedIn && <Link href="/sign-up" className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded bg-white px-5 py-3 font-semibold text-black transition hover:bg-neutral-200">Create Free Account</Link>}
            {isSignedIn && <Link href="/train" className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded bg-white px-5 py-3 font-semibold text-black transition hover:bg-neutral-200">Start First Session</Link>}
          </article>

          <article className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-7 text-left shadow-[0_18px_44px_rgba(245,158,11,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Premium</p>
            <p className="mt-3 text-4xl font-bold">$20<span className="text-lg font-medium text-neutral-300">/month</span></p>
            <ul className="mt-6 space-y-3 text-sm leading-7 text-neutral-200"><li>• Unlimited AI coaching</li><li>• Unlimited session progression</li><li>• Saved training history and progress</li><li>• Multiple dog profiles</li></ul>
            {!isSignedIn && <Link href="/sign-up" className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded bg-amber-400 px-5 py-3 font-semibold text-black transition hover:bg-amber-300">Start Free, Upgrade Later</Link>}
            {isSignedIn && <button type="button" onClick={handleCheckout} disabled={checkoutLoading} className="mt-7 min-h-12 w-full rounded bg-amber-400 px-5 py-3 font-semibold text-black transition hover:bg-amber-300 disabled:cursor-wait disabled:opacity-60">{checkoutLoading ? "Starting checkout..." : "Upgrade to Premium"}</button>}
          </article>
        </div>
      </div>
    </section>
  );
}

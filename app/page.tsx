"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import PricingSection from "@/components/PricingSection";

export default function Home() {
  const { isSignedIn } = useUser();

  const handleCheckout = async () => {
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      alert("Checkout failed.");
    } catch (err) {
      console.error(err);
      alert("Error starting checkout.");
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {/* HERO */}
      <section className="px-6 py-24 border-b border-neutral-800">
        <div className="mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-2">
          <div>
            <h1 className="text-5xl font-bold leading-tight">
              Never wonder what to do with your dog again.
              <span className="text-amber-400"> Real structure. Real results.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg text-neutral-300">
              Patriot K9 Command eliminates guesswork. Log real sessions, track what
              happened, and get structured next steps built around the dog in front of you.
            </p>

            <div className="mt-10 flex gap-4">
              <a
                href="/train"
                className="rounded bg-amber-400 px-6 py-3 font-semibold text-black"
              >
                Start Training
              </a>

              {!isSignedIn && (
                <Link
                  href="/sign-up"
                  className="rounded border border-neutral-600 px-6 py-3 hover:bg-neutral-900"
                >
                  Create Account
                </Link>
              )}

              {isSignedIn && (
                <button
                  onClick={handleCheckout}
                  className="rounded border border-neutral-600 px-6 py-3 hover:bg-neutral-900"
                >
                  Go Premium
                </button>
              )}
            </div>
          </div>

          <div>
            <img
              src="/hero-dog.jpg"
              alt="Dog training action"
              className="w-full rounded-lg border border-neutral-800"
            />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-6 py-24">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {[
            {
              title: "Structured System",
              desc: "Built around real progression, not random tips.",
            },
            {
              title: "Session-Based Training",
              desc: "Log what happened and train off real results.",
            },
            {
              title: "Command-Level Control",
              desc: "Build reliability, boundaries, and real obedience.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="rounded-lg border border-neutral-800 bg-neutral-950 p-6 hover:border-amber-400/40 transition"
            >
              <div className="mb-4 h-10 w-10 rounded bg-amber-400/20" />
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-neutral-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHY DIFFERENT */}
      <section className="border-t border-neutral-800 px-6 py-24">
        <div className="mx-auto max-w-6xl rounded-lg border border-neutral-800 bg-neutral-950 p-8">
          <h2 className="text-3xl font-bold">
            This isn’t another dog training app.
          </h2>

          <p className="mt-4 max-w-3xl text-lg text-neutral-300">
            Most apps give videos or generic plans and leave you guessing.
            Patriot K9 Command removes that uncertainty completely.
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded border border-neutral-800 bg-black/30 p-6">
              <h3 className="text-xl font-semibold text-amber-400">
                Patriot K9 Command
              </h3>
              <ul className="mt-4 space-y-2 text-neutral-300">
                <li>• Log real training sessions</li>
                <li>• Track wins and problems</li>
                <li>• Generate exact next steps</li>
                <li>• Built on a real system</li>
              </ul>
            </div>

            <div className="rounded border border-neutral-800 bg-black/30 p-6">
              <h3 className="text-xl font-semibold text-red-400">Most Apps</h3>
              <ul className="mt-4 space-y-2 text-neutral-300">
                <li>• Watch lessons</li>
                <li>• Try random exercises</li>
                <li>• Follow generic plans</li>
                <li>• Guess what to do next</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xl font-semibold">
              Stop guessing. Start progressing.
            </p>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="border-t border-neutral-800 px-6 py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-2">
          <div>
            <img
              src="/dog-obedience.jpg"
              alt="Obedient dog training"
              className="w-full rounded-lg border border-neutral-800"
            />
          </div>

          <div>
            <h2 className="text-3xl font-bold">
              Built for real obedience.
            </h2>

            <p className="mt-6 text-neutral-400">
              Every session builds on the last so you always know:
              what’s working, what’s breaking, and what comes next.
            </p>

            <ul className="mt-6 space-y-3 text-neutral-300">
              <li>• Track every session</li>
              <li>• Generate structured plans</li>
              <li>• Build long-term reliability</li>
              <li>• Train with purpose</li>
            </ul>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="border-t border-neutral-800 px-6 py-20 text-center">
        <h2 className="text-3xl font-bold">Access Levels</h2>
        <p className="mx-auto mt-4 max-w-2xl text-neutral-400">
          Upgrade for AI-powered coaching, saved plans, and full access inside the
          training app.
        </p>

        <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
          <div className="rounded border border-neutral-800 bg-neutral-950 p-6">
            <h3 className="text-lg font-semibold">Basic Access</h3>
            <p className="mt-2 text-3xl font-bold">$0</p>

            <ul className="mt-4 space-y-2 text-sm text-neutral-300">
              <li>• Session logging</li>
              <li>• Basic tracking</li>
            </ul>
          </div>

          <div className="rounded border border-amber-400/30 bg-amber-400/10 p-6">
            <h3 className="text-lg font-semibold">Full Command Access</h3>
            <p className="mt-2 text-3xl font-bold">$19/mo</p>

            <ul className="mt-4 space-y-2 text-sm text-neutral-200">
              <li>• Unlimited AI coaching</li>
              <li>• Full progress tracking</li>
              <li>• Saved plans</li>
              <li>• Multi-dog support</li>
            </ul>

            {!isSignedIn && (
              <Link
                href="/sign-up"
                className="mt-6 inline-block rounded bg-amber-400 px-5 py-3 font-semibold text-black"
              >
                Create Account
              </Link>
            )}

            {isSignedIn && (
              <button
                onClick={handleCheckout}
                className="mt-6 rounded bg-amber-400 px-5 py-3 font-semibold text-black"
              >
                Upgrade Now
              </button>
            )}
          </div>
        </div>
      </section>

      <PricingSection />
    </main>
  );
}

"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import PricingSection from "@/components/PricingSection";

const howItWorks = [
  {
    title: "Describe Your Dog",
    desc: "Enter your dog's goals, behavior issues, skill level, and current training picture so the AI starts from the real dog in front of you.",
  },
  {
    title: "Get a Structured Plan",
    desc: "Receive doctrine-based guidance for obedience, troubleshooting, progression, and next-session planning built from Patriot K9 Command systems.",
  },
  {
    title: "Track Progress and Continue Training",
    desc: "Log sessions, review what improved, and keep moving forward with clear next steps instead of guessing.",
  },
];

const trainingTopics = [
  "Puppy Foundation",
  "Leash Pulling",
  "Recall",
  "Reactivity",
  "Crate Training",
  "Public Manners",
  "Confidence Building",
  "German Shepherd Working Drive",
];

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
      <section className="border-b border-neutral-800 px-6 py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-2">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
              Patriot K9 Command AI Trainer
            </p>

            <h1 className="mt-4 text-5xl font-bold leading-tight">
              AI Dog Training Built on Real
              <span className="text-amber-400"> Patriot K9 Command Doctrine</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg text-neutral-300">
              Get structured training plans, behavior troubleshooting, puppy
              development, leash work, recall, reactivity, crate training, and
              obedience guidance - generated instantly from Patriot K9 Command's
              training systems.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="/train"
                className="rounded bg-amber-400 px-6 py-3 font-semibold text-black"
              >
                Start Training
              </a>

              <a
                href="#how-it-works"
                className="rounded border border-neutral-600 px-6 py-3 hover:bg-neutral-900"
              >
                View Example Plan
              </a>
            </div>

            <ul className="mt-8 space-y-3 text-sm text-neutral-300">
              <li>• Built from real dog training systems</li>
              <li>• Personalized to your dog and goals</li>
              <li>• Free trial messages included</li>
            </ul>
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

      <section id="how-it-works" className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
              How It Works
            </p>
            <h2 className="mt-4 text-3xl font-bold md:text-4xl">
              Structured AI guidance built for real dog training progress
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {howItWorks.map((item, index) => (
              <div
                key={item.title}
                className="rounded-lg border border-neutral-800 bg-neutral-950 p-6 hover:border-amber-400/40 transition"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded bg-amber-400/20 text-sm font-semibold text-amber-300">
                  {index + 1}
                </div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-neutral-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-800 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
              What the AI Trainer Helps With
            </p>
            <h2 className="mt-4 text-3xl font-bold md:text-4xl">
              Doctrine-based support across obedience, behavior, and progression
            </h2>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {trainingTopics.map((topic) => (
              <div
                key={topic}
                className="rounded-lg border border-neutral-800 bg-black/30 p-6"
              >
                <h3 className="text-lg font-semibold">{topic}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-800 px-6 py-24">
        <div className="mx-auto max-w-6xl rounded-lg border border-neutral-800 bg-neutral-950 p-8">
          <h2 className="text-3xl font-bold">
            Built from Patriot K9 Command systems, not generic AI advice
          </h2>

          <p className="mt-4 max-w-3xl text-lg text-neutral-300">
            This platform is designed to give structured training guidance, usable
            plans, troubleshooting, and progress support based on real training
            doctrine rather than random dog tips.
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded border border-neutral-800 bg-black/30 p-6">
              <h3 className="text-xl font-semibold text-amber-400">
                Patriot K9 AI Trainer
              </h3>
              <ul className="mt-4 space-y-2 text-neutral-300">
                <li>• Structured doctrine-based answers</li>
                <li>• Personalized guidance from your dog's profile</li>
                <li>• Troubleshooting and next-step progression</li>
                <li>• Built for ongoing training support</li>
              </ul>
            </div>

            <div className="rounded border border-neutral-800 bg-black/30 p-6">
              <h3 className="text-xl font-semibold text-red-400">
                What It Is Not
              </h3>
              <ul className="mt-4 space-y-2 text-neutral-300">
                <li>• Not random AI dog advice</li>
                <li>• Not a replacement for serious in-person evaluation</li>
                <li>• Not a guess-based dog app</li>
                <li>• Not hands-on help for severe cases</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

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
            <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
              Transparency
            </p>
            <h2 className="mt-4 text-3xl font-bold">
              AI Guidance with Real-World Training Standards
            </h2>

            <p className="mt-6 text-neutral-400">
              Patriot K9 AI Trainer is an AI-powered training platform built from
              real Patriot K9 Command training systems. It provides structured
              guidance, training direction, and progress support, but it does not
              replace hands-on professional evaluation for serious aggression,
              bite risk, medical concerns, or severe behavioral cases.
            </p>

            <ul className="mt-6 space-y-3 text-neutral-300">
              <li>• Structured guidance from real doctrine</li>
              <li>• Useful for plans, troubleshooting, and progress support</li>
              <li>• In-person help still matters for serious cases</li>
            </ul>
          </div>
        </div>
      </section>

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
            <p className="mt-2 text-3xl font-bold">$20/month</p>

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

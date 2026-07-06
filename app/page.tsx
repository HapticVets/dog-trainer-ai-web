"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";

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

const includedFeatures = [
  "Unlimited AI coaching",
  "Personalized training plans",
  "Progress tracking",
  "Session history",
  "Multi-dog support",
  "Built from Patriot K9 Command doctrine",
];

const landingPageLinks = [
  {
    href: "/puppy-training",
    title: "Puppy Training",
    desc: "Biting, crate training, potty training, socialization, and structure at home.",
  },
  {
    href: "/stop-barking",
    title: "Stop Barking",
    desc: "Door barking, alert barking, crate barking, and calm behavior at home.",
  },
  {
    href: "/leash-training",
    title: "Leash Training",
    desc: "Leash pulling, loose leash walking, heel foundations, and walk structure.",
  },
  {
    href: "/german-shepherd-training",
    title: "German Shepherd Training",
    desc: "Drive, obedience, recall, handler leadership, and control for shepherds.",
  },
];

export default function Home() {
  const { isSignedIn } = useUser();
  const patriotK9ContactUrl = "https://discord.gg/Mmb4KSp9Y8";

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
              Train Your Dog Faster with
              <span className="text-amber-400"> Your Own AI Dog Trainer</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg text-neutral-300">
              Get structured, personalized dog training guidance for puppies,
              leash pulling, recall, crate training, reactivity, obedience, and
              behavior troubleshooting — built from real Patriot K9 Command
              training systems.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="/train"
                className="rounded bg-amber-400 px-6 py-3 font-semibold text-black"
              >
                Start Free Trial
              </a>

              <a
                href="#how-it-works"
                className="rounded border border-neutral-600 px-6 py-3 hover:bg-neutral-900"
              >
                View Example Plan
              </a>
            </div>

            <div className="mt-8 space-y-3 text-sm text-neutral-300">
              <p>✔ Built from real Patriot K9 Command doctrine</p>
              <p>✔ Personalized training plans for your dog&apos;s needs</p>
              <p>✔ Free trial included — cancel anytime</p>
            </div>

            <p className="mt-5 text-sm text-neutral-400">
              Built for dog owners training puppies, family dogs, and working dogs.
            </p>
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
                <li>• Personalized guidance from your dog&apos;s profile</li>
                <li>• Troubleshooting and next-step progression</li>
                <li>• Built for ongoing training support</li>
              </ul>
            </div>

            <div className="rounded border border-neutral-800 bg-black/30 p-6">
              <h3 className="text-xl font-semibold text-red-400">
                When You Should Contact a Professional Trainer
              </h3>
              <ul className="mt-4 space-y-2 text-neutral-300">
                <li>• Severe aggression or bite risk needs hands-on evaluation</li>
                <li>• Medical concerns should be handled by a veterinarian</li>
                <li>• Some cases require in-person professional support</li>
                <li>• AI guidance supports training, but does not replace serious case evaluation</li>
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

      <section className="border-t border-neutral-800 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
              What&apos;s Included
            </p>
            <h2 className="mt-4 text-3xl font-bold md:text-4xl">
              Everything you need to keep training moving
            </h2>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {includedFeatures.map((item) => (
              <div
                key={item}
                className="rounded-lg border border-neutral-800 bg-black/30 p-6"
              >
                <h3 className="text-lg font-semibold">{item}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-800 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
              Choose What You Need Help With
            </p>
            <h2 className="mt-4 text-3xl font-bold md:text-4xl">
              Start with the problem you want solved first
            </h2>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {landingPageLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg border border-neutral-800 bg-black/30 p-6 transition hover:border-amber-400/40"
              >
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-neutral-400">{item.desc}</p>
              </Link>
            ))}
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
                Start Free Trial
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

      <section className="border-t border-neutral-800 px-6 py-24 text-center">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold">Ready to Transform Your Dog?</h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-neutral-300">
            Create your dog&apos;s profile and start receiving personalized AI
            coaching in minutes.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
            <a
              href="/train"
              className="w-full rounded bg-amber-400 px-6 py-3 text-center font-semibold text-black sm:w-auto"
            >
              Start Free Trial
            </a>

            <a
              href="#how-it-works"
              className="w-full rounded border border-neutral-600 px-6 py-3 text-center font-semibold text-white hover:bg-neutral-900 sm:w-auto"
            >
              View Example Plan
            </a>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-800 px-6 py-16 text-center">
        <div className="mx-auto max-w-4xl rounded-lg border border-neutral-800 bg-black/30 p-6 sm:p-8">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
            Need Hands-On Help?
          </p>
          <p className="mx-auto mt-4 max-w-3xl text-neutral-300">
            For severe aggression, bite risk, medical concerns, or cases that
            need in-person evaluation, Patriot K9 Command can help locally
            through professional training services.
          </p>

          <a
            href={patriotK9ContactUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block w-full rounded border border-neutral-600 px-6 py-3 text-center font-semibold text-white hover:bg-neutral-900 sm:w-auto"
          >
            Contact Patriot K9 Command
          </a>
        </div>
      </section>
    </main>
  );
}

import Link from "next/link";
import type { LandingPageConfig } from "@/lib/landingPages";

type SeoLandingPageProps = {
  config: LandingPageConfig;
};

export default function SeoLandingPage({ config }: SeoLandingPageProps) {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="border-b border-neutral-800 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
            Patriot K9 AI Trainer
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight md:text-6xl">
            {config.heroHeadline}
          </h1>
          <p className="mt-6 max-w-3xl text-lg text-neutral-300">
            {config.heroSubheadline}
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/train"
              className="w-full rounded bg-amber-400 px-6 py-3 text-center font-semibold text-black sm:w-auto"
            >
              Start Free Trial
            </Link>
            <a
              href="#example-plan"
              className="w-full rounded border border-neutral-600 px-6 py-3 text-center font-semibold text-white hover:bg-neutral-900 sm:w-auto"
            >
              View Example Plan
            </a>
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-800 px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
              The Problem
            </p>
            <h2 className="mt-4 text-3xl font-bold md:text-4xl">
              {config.problemTitle}
            </h2>
            <p className="mt-6 max-w-3xl text-neutral-300">
              {config.problemSummary}
            </p>
          </div>

          <div className="rounded-lg border border-neutral-800 bg-black/30 p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-amber-400">
              Common Focus Areas
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {config.focusAreas.map((item) => (
                <div
                  key={item}
                  className="rounded border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-200"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-800 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-neutral-800 bg-black/30 p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-amber-400">
                Common Mistakes
              </p>
              <ul className="mt-5 space-y-3 text-neutral-300">
                {config.commonMistakes.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-neutral-800 bg-black/30 p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-amber-400">
                How Patriot K9 AI Trainer Helps
              </p>
              <ul className="mt-5 space-y-3 text-neutral-300">
                {config.aiHelps.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="example-plan" className="border-b border-neutral-800 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
            Example AI Training Plan Preview
          </p>
          <h2 className="mt-4 text-3xl font-bold md:text-4xl">
            A structured plan instead of random advice
          </h2>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-lg border border-neutral-800 bg-black/30 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-amber-400">
                Objective
              </p>
              <p className="mt-3 text-sm leading-7 text-neutral-200">
                {config.examplePlan.objective}
              </p>
            </div>
            <div className="rounded-lg border border-neutral-800 bg-black/30 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-amber-400">
                Setup
              </p>
              <p className="mt-3 text-sm leading-7 text-neutral-200">
                {config.examplePlan.setup}
              </p>
            </div>
            <div className="rounded-lg border border-neutral-800 bg-black/30 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-amber-400">
                Working Reps
              </p>
              <p className="mt-3 text-sm leading-7 text-neutral-200">
                {config.examplePlan.workingReps}
              </p>
            </div>
            <div className="rounded-lg border border-neutral-800 bg-black/30 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-amber-400">
                Success Criteria
              </p>
              <p className="mt-3 text-sm leading-7 text-neutral-200">
                {config.examplePlan.successCriteria}
              </p>
            </div>
            <div className="rounded-lg border border-neutral-800 bg-black/30 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-amber-400">
                Next Step
              </p>
              <p className="mt-3 text-sm leading-7 text-neutral-200">
                {config.examplePlan.nextStep}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-800 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
            What You Can Ask the AI
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {config.askTheAi.map((item) => (
              <div
                key={item}
                className="rounded-lg border border-neutral-800 bg-neutral-950 p-5 text-neutral-200"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-800 px-6 py-20">
        <div className="mx-auto max-w-6xl rounded-lg border border-neutral-800 bg-black/30 p-8">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
            Safety and Transparency
          </p>
          <h2 className="mt-4 text-3xl font-bold md:text-4xl">
            When to contact a professional trainer
          </h2>
          <p className="mt-6 max-w-4xl text-neutral-300">
            Patriot K9 AI Trainer gives structured training guidance, troubleshooting,
            and progression support, but it does not replace hands-on evaluation for
            serious aggression, bite risk, medical concerns, or severe behavioral cases.
          </p>
        </div>
      </section>

      <section className="border-b border-neutral-800 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
            FAQ
          </p>
          <div className="mt-8 space-y-4">
            {config.faq.map((item) => (
              <div
                key={item.question}
                className="rounded-lg border border-neutral-800 bg-black/30 p-6"
              >
                <h3 className="text-lg font-semibold">{item.question}</h3>
                <p className="mt-3 text-neutral-400">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-800 px-6 py-16">
        <div className="mx-auto max-w-6xl rounded-lg border border-neutral-800 bg-neutral-950 p-8">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
            Related Help
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {config.relatedPages.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded border border-neutral-700 px-5 py-3 text-sm font-semibold text-white hover:bg-neutral-900"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24 text-center">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold">Start structured training support today</h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-neutral-300">
            Describe your dog, the problem you are seeing, and your training goal.
            Patriot K9 AI Trainer will return a structured plan you can start using right away.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/train"
              className="w-full rounded bg-amber-400 px-6 py-3 text-center font-semibold text-black sm:w-auto"
            >
              Start Free Trial
            </Link>
            <a
              href="#example-plan"
              className="w-full rounded border border-neutral-600 px-6 py-3 text-center font-semibold text-white hover:bg-neutral-900 sm:w-auto"
            >
              View Example Plan
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

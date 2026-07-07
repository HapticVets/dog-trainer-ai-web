import Image from "next/image";
import Link from "next/link";

const corePrinciples = [
  {
    title: "Communication",
    desc: "Clear markers, timing, leash pressure, body language, and reward placement help the dog understand exactly what earned success.",
  },
  {
    title: "Consistency",
    desc: "Training improves when the same rules, cues, rewards, and corrections are applied the same way every time.",
  },
  {
    title: "Accountability",
    desc: "Dogs need fair follow-through. The handler sets the standard, guides the dog back to the task, and rewards the correct choice.",
  },
  {
    title: "Drive Management",
    desc: "Working breeds need their energy channeled. The method uses play, food, structure, impulse control, and recovery to build control without crushing drive.",
  },
  {
    title: "Environmental Stability",
    desc: "Training should move from low-distraction settings into real-world environments so obedience holds under pressure.",
  },
];

const realWorldApplications = [
  "Puppy foundation",
  "Leash manners",
  "Recall",
  "Crate training",
  "Reactivity foundations",
  "Confidence building",
  "Public manners",
  "German Shepherd working drive",
  "Owner handling discipline",
];

export default function MethodPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="relative border-b border-neutral-800">
        <Image
          src="/german-shepherd-hero.png"
          alt="German Shepherd training under structured handling"
          fill
          sizes="100vw"
          className="absolute inset-0 object-cover opacity-35"
          priority
        />

        <div className="relative mx-auto max-w-6xl px-6 py-32">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
            Patriot K9 Command Doctrine
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight md:text-6xl">
            The Patriot K9 Method
          </h1>

          <p className="mt-6 max-w-3xl text-lg text-neutral-300">
            Structured dog training guidance built around clarity, consistency,
            drive management, and real-world obedience standards.
          </p>

          <p className="mt-6 max-w-3xl text-base leading-8 text-neutral-300">
            Patriot K9 AI Trainer is designed to follow a repeatable training
            framework instead of giving random tips. Every recommendation should
            help the handler understand the problem, why it is happening, what to
            do next, and how to measure progress.
          </p>
        </div>
      </section>

      <section className="border-b border-neutral-800 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
            Structure Creates Clarity
          </p>

          <h2 className="mt-4 text-3xl font-bold md:text-4xl">
            Calm, repeatable communication is the standard
          </h2>

          <div className="mt-8 space-y-5 text-neutral-300">
            <p>
              Dogs learn best when expectations are consistent. The method is not
              built around chaos, bribery, or emotional correction. It is built
              around repeatable communication that the dog can understand and the
              handler can apply under pressure.
            </p>
            <p>
              The handler's timing, markers, leash communication, body language,
              and follow-through all matter. When those pieces stay clean, the dog
              gets clear information about what is right, what is wrong, and how
              to get back to success.
            </p>
            <p>
              The goal is not noise. The goal is structure that produces stable
              behavior and real obedience in daily life.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-800 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
            Core Training Principles
          </p>

          <h2 className="mt-4 text-3xl font-bold md:text-4xl">
            The standards behind the AI trainer
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {corePrinciples.map((item) => (
              <div
                key={item.title}
                className="rounded-lg border border-neutral-800 bg-neutral-950 p-6"
              >
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-neutral-400">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-800 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
            How the AI Applies the Method
          </p>

          <h2 className="mt-4 text-3xl font-bold md:text-4xl">
            Structured guidance, not disconnected advice
          </h2>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-neutral-800 bg-black/30 p-6">
              <ul className="space-y-3 text-neutral-300">
                <li>• Identifies the problem</li>
                <li>• Explains why it is happening</li>
                <li>• Gives a step-by-step plan</li>
                <li>• Provides criteria for success</li>
                <li>• Warns about common handler mistakes</li>
                <li>• Gives the next practical step</li>
              </ul>
            </div>

            <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-amber-300">
                Response Format
              </p>
              <div className="mt-4 space-y-2 text-sm font-semibold text-white">
                <p>Problem</p>
                <p>Why It&apos;s Happening</p>
                <p>Plan</p>
                <p>Criteria</p>
                <p>Common Mistakes</p>
                <p>Next Step</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-800 px-6 py-24">
        <div className="mx-auto max-w-6xl rounded-lg border border-neutral-800 bg-neutral-950 p-8">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
            What Makes This Different
          </p>

          <h2 className="mt-4 text-3xl font-bold md:text-4xl">
            Built for real dogs in real homes
          </h2>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded border border-neutral-800 bg-black/30 p-6">
              <h3 className="text-xl font-semibold text-amber-400">
                What Patriot K9 AI Trainer is
              </h3>
              <ul className="mt-4 space-y-2 text-neutral-300">
                <li>• Structured</li>
                <li>• Progressive</li>
                <li>• Handler-focused</li>
                <li>• Built for real dogs in real homes</li>
                <li>• Especially useful for high-drive working breeds like German Shepherds</li>
              </ul>
            </div>

            <div className="rounded border border-neutral-800 bg-black/30 p-6">
              <h3 className="text-xl font-semibold text-red-400">
                What it is not
              </h3>
              <ul className="mt-4 space-y-2 text-neutral-300">
                <li>• Random internet dog training advice</li>
                <li>• Disconnected YouTube tips</li>
                <li>• Emotional handling</li>
                <li>• One-size-fits-all programs</li>
                <li>• Advice without progression or measurable criteria</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-800 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
            Real-World Training Applications
          </p>

          <h2 className="mt-4 text-3xl font-bold md:text-4xl">
            Where the method gets applied
          </h2>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {realWorldApplications.map((item) => (
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

      <section className="border-b border-neutral-800 px-6 py-24">
        <div className="mx-auto max-w-5xl rounded-lg border border-amber-400/20 bg-amber-400/10 p-8">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-300">
            Important Transparency
          </p>
          <p className="mt-4 text-lg leading-8 text-neutral-100">
            Patriot K9 AI Trainer is an AI-powered guidance tool. It can help with
            structure, planning, troubleshooting, and handler education, but it
            does not replace veterinary care, emergency intervention, or hands-on
            evaluation for serious aggression, bite risk, medical concerns, or
            severe behavioral cases.
          </p>
        </div>
      </section>

      <section className="px-6 py-20 text-center">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold md:text-4xl">
            Start Training With Structure
          </h2>

          <p className="mt-6 text-lg text-neutral-300">
            Describe your dog, your goal, and the issue you are seeing. The AI
            trainer will return a structured plan you can start applying today.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/train"
              className="rounded bg-amber-400 px-8 py-4 font-semibold text-black"
            >
              Start Training
            </Link>

            <Link
              href="/"
              className="rounded border border-neutral-600 px-8 py-4 font-semibold text-white hover:bg-neutral-900"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

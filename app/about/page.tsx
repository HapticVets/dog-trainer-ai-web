import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Patriot K9 AI Trainer",
  description:
    "Meet John Reese, founder of Patriot K9 Command, and learn the story and philosophy behind Patriot K9 AI Trainer.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="border-b border-neutral-800 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
            About Patriot K9 Command
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight md:text-6xl">
            The Trainer and Philosophy Behind Patriot K9 AI Trainer
          </h1>
          <p className="mt-6 max-w-3xl text-lg text-neutral-300">
            Learn who built Patriot K9 AI Trainer, why the system exists, and how
            Patriot K9 Command turns structured dog training into a clear path owners
            can actually follow.
          </p>
        </div>
      </section>

      <section className="border-b border-neutral-800 px-6 py-20">
        <div className="mx-auto max-w-5xl rounded-lg border border-neutral-800 bg-black/30 p-8">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
            Meet John Reese
          </p>
          <div className="mt-6 space-y-5 text-neutral-300">
            <p>
              John Reese is the founder of Patriot K9 Command and the creator of the
              Patriot K9 AI Trainer.
            </p>
            <p>
              A United States Marine Corps veteran, John has spent years working
              with dogs and helping owners build clear communication, structure, and
              lasting relationships with their companions. His training philosophy
              focuses on leadership, consistency, and teaching owners how to become
              confident handlers, not just teaching dogs commands.
            </p>
            <p>
              Through years of working with family pets, German Shepherds, and
              working-line dogs, John developed the Patriot K9 training system to
              simplify dog training into clear, repeatable steps that owners can
              confidently follow.
            </p>
            <p>
              Patriot K9 AI Trainer brings that same approach online by giving dog
              owners access to structured guidance anytime they need it. Rather than
              replacing a professional trainer, the AI acts as a coaching partner
              that walks owners through each stage of training using the Patriot K9
              methodology.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-800 px-6 py-20">
        <div className="mx-auto max-w-5xl rounded-lg border border-neutral-800 bg-neutral-950 p-8">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
            The Story Behind Patriot K9 Command
          </p>
          <div className="mt-6 space-y-5 text-neutral-300">
            <p>
              Patriot K9 Command was built on a simple belief: dog training should
              create better relationships, not just better obedience.
            </p>
            <p>
              Many owners struggle because they receive conflicting advice from
              videos, social media, or generic training programs. Patriot K9
              Command was created to provide a structured system that helps owners
              understand why their dog behaves the way it does and how to build
              lasting habits through consistent leadership.
            </p>
            <p>
              Our training philosophy emphasizes communication, engagement,
              structure, and gradual progression. Every dog learns at its own pace,
              but every owner deserves a clear plan to follow.
            </p>
            <p>
              That philosophy became the foundation for Patriot K9 AI Trainer.
            </p>
            <p>
              Instead of replacing the experience of working with a trainer,
              Patriot K9 AI organizes proven training principles into personalized
              coaching available whenever owners need guidance. Each dog begins
              with a detailed case file, receives structured training sessions,
              tracks progress over time, and continues building toward long-term
              goals.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-800 px-6 py-20">
        <div className="mx-auto max-w-5xl rounded-lg border border-neutral-800 bg-black/30 p-8">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
            Why Patriot K9 AI Exists
          </p>
          <div className="mt-6 space-y-5 text-neutral-300">
            <p>
              Patriot K9 AI was built to make structured dog training more
              accessible. Not every owner can afford private lessons or
              board-and-train programs, but every owner should be able to get clear
              guidance, realistic next steps, and a training plan built around
              their dog.
            </p>
            <p>
              The goal is not to replace professional trainers. The goal is to
              give owners a better starting point, help them stay consistent, and
              show them when a problem may need hands-on professional help.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-24 text-center">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold">Start Building Your Dog&apos;s Training Plan</h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-neutral-300">
            Create your dog&apos;s case file and get structured AI guidance built
            around your dog&apos;s age, temperament, goals, and behavior.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/train"
              className="w-full rounded bg-amber-400 px-6 py-3 text-center font-semibold text-black sm:w-auto"
            >
              Start Free Trial
            </Link>
            <Link
              href="/#how-it-works"
              className="w-full rounded border border-neutral-600 px-6 py-3 text-center font-semibold text-white hover:bg-neutral-900 sm:w-auto"
            >
              View Example Plan
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

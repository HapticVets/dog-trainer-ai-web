import Image from "next/image";
import Link from "next/link";
import { getLandingPageMetadata, landingPages } from "@/lib/landingPages";

const config = landingPages["leash-training"];

export const metadata = getLandingPageMetadata(config);

const commonProblems = [
  "Pulling hard into the leash",
  "Forging ahead of the handler",
  "Lagging, sniffing, or drifting out of position",
  "Reacting to dogs, people, or movement",
  "Ignoring the handler once the walk starts",
  "Inconsistent heel position from one rep to the next",
];

const progressionSteps = [
  "Build engagement",
  "Establish leash communication",
  "Reward the correct position",
  "Add turns and pace changes",
  "Introduce distractions",
  "Practice in real environments",
];

const outcomeCards = [
  "Walk without being dragged",
  "Regain your dog's attention",
  "Move calmly through distractions",
  "Build a consistent heel position",
];

export default function LeashTrainingPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="border-b border-neutral-800 px-6 py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)]">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
              Patriot K9 AI Trainer
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight md:text-6xl">
              Enjoy Walks Without Being Pulled
            </h1>
            <p className="mt-6 max-w-3xl text-lg text-neutral-300">
              Patriot K9 AI creates personalized leash-training sessions based on
              your dog&apos;s behavior, experience, distractions, and progress.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/train"
                className="w-full rounded bg-amber-400 px-6 py-3 text-center font-semibold text-black sm:w-auto"
              >
                Start Free
              </Link>
              <a
                href="#how-it-works"
                className="w-full rounded border border-neutral-600 px-6 py-3 text-center font-semibold text-white hover:bg-neutral-900 sm:w-auto"
              >
                See How It Works
              </a>
            </div>
          </div>

          <figure className="overflow-hidden rounded-3xl border border-neutral-800 bg-black/30 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
            <Image
              src="/images/obedience/patriot-k9-german-shepherd-field-training.jpg"
              alt="German Shepherd working in structured heel position during Patriot K9 leash training."
              width={2048}
              height={1365}
              sizes="(max-width: 768px) calc(100vw - 48px), (max-width: 1280px) 42vw, 520px"
              className="h-auto w-full object-cover"
              priority
            />
          </figure>
        </div>
      </section>

      <section className="border-b border-neutral-800 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
              Common Leash Problems
            </p>
            <h2 className="mt-4 text-3xl font-bold md:text-4xl">
              Most leash issues start before the walk falls apart
            </h2>
            <p className="mt-6 text-neutral-300">
              Pulling, forging, lagging, and distraction problems usually come
              from weak engagement and unclear walking standards rather than a dog
              that is simply excited.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {commonProblems.map((problem) => (
              <div
                key={problem}
                className="rounded-2xl border border-neutral-800 bg-black/30 p-5 text-neutral-200"
              >
                {problem}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-b border-neutral-800 px-6 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)]">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
              How The Training Progresses
            </p>
            <h2 className="mt-4 text-3xl font-bold md:text-4xl">
              Clean leash work is built in a sequence, not guessed at mid-walk
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {progressionSteps.map((step, index) => (
                <div
                  key={step}
                  className="rounded-2xl border border-neutral-800 bg-black/30 p-5"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-amber-400">
                    Step {index + 1}
                  </p>
                  <p className="mt-3 text-neutral-200">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <figure className="overflow-hidden rounded-3xl border border-neutral-800 bg-black/30 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
            <Image
              src="/images/ai-trainer/engagement-focus-training.jpg"
              alt="German Shepherd engagement and focus work supporting Patriot K9 leash foundations."
              width={1354}
              height={1450}
              sizes="(max-width: 768px) calc(100vw - 48px), (max-width: 1280px) 42vw, 520px"
              className="h-auto w-full object-contain"
            />
            <figcaption className="border-t border-neutral-800 px-5 py-4 text-sm text-neutral-400">
              Engagement comes first. The dog should understand how to stay mentally
              with the handler before distractions are layered in.
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="border-b border-neutral-800 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
              Field Heel Demonstration
            </p>
            <h2 className="mt-4 text-3xl font-bold md:text-4xl">
              Position should stay clean while the dog moves with you
            </h2>
            <p className="mt-6 text-neutral-300">
              These clips show structured heel work away from the house, where the
              dog has to stay with the handler instead of drifting into its own plan.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {[
              {
                title: "Heel moving toward the handler's line",
                src: "/videos/german-shepherd-training/german-shepherd-field-heel-toward.mp4",
                caption:
                  "Forward movement matters because it reveals whether the dog understands where heel position actually lives.",
              },
              {
                title: "Heel moving away under structure",
                src: "/videos/german-shepherd-training/german-shepherd-field-heel-away.mp4",
                caption:
                  "Direction changes and movement away from the handler expose forging, drifting, and disconnect immediately.",
              },
            ].map((video) => (
              <article
                key={video.src}
                className="rounded-3xl border border-neutral-800 bg-black/30 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.25)]"
              >
                <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-black">
                  <video
                    controls
                    muted
                    playsInline
                    preload="metadata"
                    className="aspect-video w-full"
                  >
                    <source src={video.src} type="video/mp4" />
                  </video>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{video.title}</h3>
                <p className="mt-3 text-sm leading-7 text-neutral-400">
                  {video.caption}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-800 px-6 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)]">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
              Heel-To-Sit Progression
            </p>
            <h2 className="mt-4 text-3xl font-bold md:text-4xl">
              Leash work is not just walking. It is position, stops, attention, and transitions.
            </h2>
            <div className="mt-6 space-y-4 text-neutral-300">
              <p>
                A clean heel-to-sit transition shows whether the dog can stay with
                the handler through motion and settle into position without
                wandering, forging, or mentally checking out.
              </p>
              <p>
                That is where leash communication becomes visible. The dog is not
                just moving next to you. The dog is learning how to follow,
                stop, and stay accountable through the whole rep.
              </p>
            </div>
          </div>

          <figure className="overflow-hidden rounded-3xl border border-neutral-800 bg-black/30 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
            <video
              controls
              muted
              playsInline
              preload="metadata"
              poster="/images/obedience/patriot-k9-german-shepherd-field-training.jpg"
              className="aspect-video w-full"
            >
              <source
                src="/videos/german-shepherd-training/german-shepherd-field-heel-to-sit.mp4"
                type="video/mp4"
              />
            </video>
            <figcaption className="border-t border-neutral-800 px-5 py-4 text-sm text-neutral-400">
              Structured transitions show whether the dog can maintain position and
              attention when the rep changes.
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="border-b border-neutral-800 px-6 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)]">
          <figure className="overflow-hidden rounded-3xl border border-neutral-800 bg-black/30 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
            <video
              controls
              muted
              playsInline
              preload="metadata"
              poster="/images/german-shepherd-training/german-shepherd-public-place-command.jpg"
              className="aspect-video w-full"
            >
              <source
                src="/videos/german-shepherd-training/german-shepherd-public-store-heel.mp4"
                type="video/mp4"
              />
            </video>
            <figcaption className="border-t border-neutral-800 px-5 py-4 text-sm text-neutral-400">
              Real-world heel work should progress carefully into public settings
              with people, noise, tighter spaces, and changing surfaces.
            </figcaption>
          </figure>

          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
              Real-World Distractions
            </p>
            <h2 className="mt-4 text-3xl font-bold md:text-4xl">
              Quiet reps are only the beginning
            </h2>
            <div className="mt-6 space-y-4 text-neutral-300">
              <p>
                Good leash training progresses from low-pressure environments into
                realistic ones with people, carts, noise, narrow aisles, and
                changing surfaces.
              </p>
              <p>
                The point is not to rush an unprepared dog into public. The point
                is to prove the standard holds once the dog is ready for more
                pressure.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-800 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
            Outcome-Focused Benefits
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {outcomeCards.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-neutral-800 bg-black/30 p-6"
              >
                <p className="text-lg font-semibold text-white">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-800 px-6 py-20">
        <div className="mx-auto max-w-6xl rounded-3xl border border-neutral-800 bg-black/30 p-8">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
            Safety Note
          </p>
          <p className="mt-4 max-w-4xl text-neutral-300">
            Dogs showing serious aggression, bite risk, or severe reactivity
            should be evaluated by a qualified in-person professional before
            public training expectations are increased.
          </p>
        </div>
      </section>

      <section className="px-6 py-24 text-center">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
            Start With Structure
          </p>
          <h2 className="mt-4 text-3xl font-bold md:text-4xl">
            Start With a Personalized Leash Session
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-neutral-300">
            Create your dog&apos;s profile and receive a first training session
            based on the behavior you are seeing now.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/train"
              className="w-full rounded bg-amber-400 px-6 py-3 text-center font-semibold text-black sm:w-auto"
            >
              Start Free
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

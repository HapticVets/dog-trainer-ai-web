"use client";

import Image from "next/image";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

const problemPoints = [
  "Every dog is different.",
  "Random videos rarely form a complete plan.",
  "Conflicting advice creates confusion.",
  "Progress stalls when sessions do not build on one another.",
];

const solutionPoints = [
  "Learns your dog's profile and goals",
  "Creates personalized sessions",
  "Tracks completed work",
  "Uses session results to guide future training",
  "Provides ongoing AI coaching",
  "Supports multiple dogs for Premium users",
];

const howItWorks = [
  "Add your dog",
  "Receive a personalized session",
  "Complete the training",
  "Log the results",
  "Get the next progression",
];

const realTrainingVideos = [
  {
    title: "Field obedience with clear positioning",
    caption: "Proof heel work in open environments instead of only training inside the house.",
    src: "/videos/german-shepherd-training/german-shepherd-field-heel-toward.mp4",
    poster: "/images/obedience/patriot-k9-german-shepherd-field-training.jpg",
  },
  {
    title: "Calm control in public",
    caption: "Show the dog how to settle and stay accountable when distractions are real.",
    src: "/videos/german-shepherd-training/german-shepherd-public-down-stay.mp4",
    poster: "/images/german-shepherd-training/german-shepherd-public-place-command.jpg",
  },
  {
    title: "Engagement before distractions take over",
    caption: "Build reward timing and focus so the dog chooses to work with the handler.",
    src: "/videos/german-shepherd-training/german-shepherd-engagement-reward-play.mp4",
    poster: "/images/german-shepherd-training/german-shepherd-engagement-eye-contact.JPG",
  },
];

const outcomeCards = [
  {
    title: "Enjoy walks without being dragged",
    body: "Build leash clarity and better handler engagement before pulling turns every walk into a fight.",
  },
  {
    title: "Relax while guests enter your home",
    body: "Use place work and structure so your dog can settle instead of escalating at the door.",
  },
  {
    title: "Build confidence that your dog will return when called",
    body: "Turn recall into a progression with criteria, repetition, and cleaner follow-through.",
  },
  {
    title: "Get your dog's attention before distractions take over",
    body: "Train engagement so obedience starts with focus instead of constant correction.",
  },
];

const comparisonColumns = [
  {
    title: "YouTube",
    accent: "text-neutral-200",
    points: [
      "Helpful demonstrations",
      "Does not know your dog",
      "Does not track progress",
      "Does not build the next session",
      "Advice may be fragmented",
    ],
  },
  {
    title: "Generic ChatGPT or General AI",
    accent: "text-neutral-200",
    points: [
      "Can answer dog-training questions",
      "General-purpose rather than built specifically for this workflow",
      "Does not automatically use your Patriot K9 dog profile and session history",
      "Does not manage the full in-app training workflow",
    ],
  },
  {
    title: "Patriot K9 AI",
    accent: "text-amber-400",
    points: [
      "Built specifically for dog training",
      "Uses your dog's profile and goals",
      "Tracks completed sessions",
      "Builds progressive next steps",
      "Keeps training history in one place",
      "Uses Patriot K9's structured methodology",
    ],
  },
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
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)]">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
              Patriot K9 Command AI Trainer
            </p>

            <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight md:text-6xl">
              Personalized Dog Training Built Around Your Dog
            </h1>

            <p className="mt-6 max-w-2xl text-lg text-neutral-300">
              Get structured training sessions, progress tracking, and AI coaching
              based on your dog&apos;s age, behavior, goals, and previous work.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/train"
                className="w-full rounded bg-amber-400 px-6 py-3 text-center font-semibold text-black sm:w-auto"
              >
                Start Free
              </Link>

              <Link
                href="/#how-it-works"
                className="w-full rounded border border-neutral-600 px-6 py-3 text-center font-semibold text-white hover:bg-neutral-900 sm:w-auto"
              >
                See How It Works
              </Link>
            </div>

            <p className="mt-6 text-sm text-neutral-400">
              Built by a professional dog trainer. No credit card required to
              start.
            </p>
          </div>

          <figure className="overflow-hidden rounded-3xl border border-neutral-800 bg-black/30 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
            <Image
              src="/images/branding/trainer-with-ollie-and-adolf.JPG"
              alt="Patriot K9 trainer working with two German Shepherds in the field."
              width={5184}
              height={3888}
              sizes="(max-width: 768px) calc(100vw - 48px), (max-width: 1280px) 46vw, 560px"
              className="h-auto w-full object-contain"
              priority
            />
          </figure>
        </div>
      </section>

      <section className="border-b border-neutral-800 bg-black px-6 py-20">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl border border-amber-400/25 bg-neutral-950 shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center">
            <div className="order-2 p-8 sm:p-10 lg:order-1 lg:p-12">
              <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
                Real Patriot K9 Training
              </p>
              <h2 className="mt-4 text-3xl font-bold md:text-4xl">
                Train Where Real Dogs Are Trained
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-8 text-neutral-300">
                Every lesson inside Patriot K9 AI is built from real-world training
                sessions on our own property—not generic internet advice.
              </p>
            </div>

            <video
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label="Patriot K9 Command training property"
              className="order-1 aspect-video h-full w-full bg-black object-cover lg:order-2"
            >
              <source
                src="/videos/branding/patriot-k9-training-property-reveal.mp4"
                type="video/mp4"
              />
            </video>
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-800 px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:items-center">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
              The Problem
            </p>
            <h2 className="mt-4 text-3xl font-bold md:text-4xl">
              Stop Guessing What to Train Next
            </h2>
            <p className="mt-6 text-neutral-300">
              Good dog training breaks down when the next session is based on
              random clips, mixed opinions, or whatever tip you saw last. Owners
              need a plan that matches the dog in front of them and keeps
              building instead of restarting.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-black/30 p-6">
            <ul className="space-y-4 text-neutral-300">
              {problemPoints.map((point) => (
                <li key={point} className="flex gap-3">
                  <span className="text-amber-400">&bull;</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-800 px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)] lg:items-center">
          <figure className="overflow-hidden rounded-3xl border border-neutral-800 bg-black/30 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
            <Image
              src="/images/ai-trainer/engagement-focus-training.jpg"
              alt="A Patriot K9 dog working in close engagement and focus with its handler during foundation training."
              width={2160}
              height={2880}
              sizes="(max-width: 768px) calc(100vw - 48px), (max-width: 1280px) 38vw, 460px"
              className="h-auto w-full object-contain"
            />
          </figure>

          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
              The Solution
            </p>
            <h2 className="mt-4 text-3xl font-bold md:text-4xl">
              A Training Plan That Evolves With Your Dog
            </h2>
            <p className="mt-6 text-neutral-300">
              Patriot K9 AI is built to guide the full training workflow. It does
              not just answer questions. It uses your dog&apos;s profile, recent
              work, and logged results to help you train with structure instead of
              chasing disconnected tips.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {solutionPoints.map((point) => (
                <div
                  key={point}
                  className="rounded-xl border border-neutral-800 bg-black/30 px-4 py-3 text-sm text-neutral-200"
                >
                  {point}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-b border-neutral-800 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
              How It Works
            </p>
            <h2 className="mt-4 text-3xl font-bold md:text-4xl">
              A simple workflow built for real progression
            </h2>
            <p className="mt-6 text-neutral-300">
              Start with your dog&apos;s case file, train the session, log the
              outcome, and keep moving forward with the next step already defined.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-5">
            {howItWorks.map((step, index) => (
              <div
                key={step}
                className="rounded-2xl border border-neutral-800 bg-black/30 p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400/15 text-sm font-semibold text-amber-300">
                  {index + 1}
                </div>
                <p className="mt-4 text-lg font-semibold">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-800 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
              Real Training. Real Environments.
            </p>
            <h2 className="mt-4 text-3xl font-bold md:text-4xl">
              Proof that the standards hold up outside theory
            </h2>
            <p className="mt-6 text-neutral-300">
              Patriot K9 AI is built from real sessions in real environments, not
              decorative dog art. These clips show the kinds of outcomes the
              training system is designed to support.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {realTrainingVideos.map((video) => (
              <article
                key={video.src}
                className="rounded-2xl border border-neutral-800 bg-black/30 p-5"
              >
                <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-black">
                  <video
                    controls
                    muted
                    playsInline
                    preload="metadata"
                    poster={video.poster}
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

      <section className="border-b border-neutral-800 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
              Real-Life Outcomes
            </p>
            <h2 className="mt-4 text-3xl font-bold md:text-4xl">
              Train for daily life, not just isolated commands
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {outcomeCards.map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-neutral-800 bg-black/30 p-6"
              >
                <h3 className="text-xl font-semibold">{card.title}</h3>
                <p className="mt-4 text-sm leading-7 text-neutral-400">
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-800 px-6 py-24">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,720px)] lg:items-center">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
              Calm Outcomes
            </p>
            <h2 className="mt-4 text-3xl font-bold md:text-4xl">
              Calm behavior matters more than checking off commands
            </h2>
            <p className="mt-6 text-neutral-300">
              The goal is a dog that can walk with structure, settle under
              pressure, and stay responsive when daily life gets distracting.
              Patriot K9 AI is designed to keep training aimed at those outcomes.
            </p>
          </div>

          <figure className="overflow-hidden rounded-3xl border border-neutral-800 bg-black/30 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
            <Image
              src="/images/homepage/calm-trained-dogs.jpg"
              alt="Calm, trained Patriot K9 dogs holding steady attention during structured obedience work."
              width={2880}
              height={2160}
              sizes="(max-width: 768px) calc(100vw - 48px), (max-width: 1280px) 48vw, 720px"
              className="h-auto w-full object-contain"
            />
          </figure>
        </div>
      </section>

      <section className="border-b border-neutral-800 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-4xl">
            <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
              Comparison
            </p>
            <h2 className="mt-4 text-3xl font-bold md:text-4xl">
              Why Patriot K9 AI Instead of YouTube or Generic AI?
            </h2>
            <p className="mt-6 text-neutral-300">
              Videos and general-purpose AI can be useful. The difference is that
              Patriot K9 AI is built around a dog-training workflow, not just
              isolated answers.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {comparisonColumns.map((column) => (
              <div
                key={column.title}
                className={`rounded-2xl border p-6 ${
                  column.title === "Patriot K9 AI"
                    ? "border-amber-400/35 bg-amber-400/10"
                    : "border-neutral-800 bg-black/30"
                }`}
              >
                <h3 className={`text-xl font-semibold ${column.accent}`}>
                  {column.title}
                </h3>
                <ul className="mt-5 space-y-3 text-sm text-neutral-300">
                  {column.points.map((point) => (
                    <li key={point} className="flex gap-3">
                      <span className="text-amber-400">&bull;</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-800 px-6 py-24">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] lg:items-center">
          <figure className="overflow-hidden rounded-3xl border border-neutral-800 bg-black/30 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
            <Image
              src="/images/branding/trainer-and-german-shepherd-field-overlook.JPG"
              alt="Patriot K9 trainer standing with a German Shepherd overlooking the training field."
              width={5184}
              height={3888}
              sizes="(max-width: 768px) calc(100vw - 48px), (max-width: 1280px) 36vw, 440px"
              className="h-auto w-full object-contain"
            />
          </figure>

          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
              Why Patriot K9
            </p>
            <h2 className="mt-4 text-3xl font-bold md:text-4xl">
              Built From Real Training, Not Generic Prompts
            </h2>
            <div className="mt-6 space-y-4 text-neutral-300">
              <p>
                Patriot K9 AI is built around real Patriot K9 training
                methodology, not generic prompt stacking.
              </p>
              <p>
                The founder is an active professional dog trainer, and the
                software is designed to support owners between in-person lessons
                while also giving them a lower-cost guided option when they need
                structure and next steps.
              </p>
            </div>
            <Link
              href="/about"
              className="mt-8 inline-block rounded border border-neutral-600 px-6 py-3 font-semibold text-white hover:bg-neutral-900"
            >
              Read About Patriot K9 Command
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-800 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
              Start With the Right Problem
            </p>
            <h2 className="mt-4 text-3xl font-bold md:text-4xl">
              Choose what you need help with first
            </h2>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {landingPageLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl border border-neutral-800 bg-black/30 p-6 transition hover:border-amber-400/40"
              >
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-neutral-400">
                  {item.desc}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="scroll-mt-24 border-b border-neutral-800 px-6 py-24">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
            Premium Value
          </p>
          <h2 className="mt-4 text-3xl font-bold md:text-4xl">
            Daily Guidance for Less Than the Cost of One Private Lesson
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-neutral-300">
            Free users can try the core training flow. Premium unlocks unlimited
            dogs, sessions, progression, and AI chat for $20 per month.
          </p>

          <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 text-left">
              <h3 className="text-lg font-semibold">Basic Access</h3>
              <p className="mt-2 text-3xl font-bold">$0</p>

              <ul className="mt-4 space-y-2 text-sm text-neutral-300">
                <li>&bull; Try the core training flow</li>
                <li>&bull; Build a dog profile</li>
                <li>&bull; Log basic progress</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-6 text-left">
              <h3 className="text-lg font-semibold">Full Command Access</h3>
              <p className="mt-2 text-3xl font-bold">$20/month</p>

              <ul className="mt-4 space-y-2 text-sm text-neutral-200">
                <li>&bull; Unlimited AI coaching</li>
                <li>&bull; Unlimited session progression</li>
                <li>&bull; Saved training history</li>
                <li>&bull; Multi-dog support</li>
              </ul>

              {!isSignedIn && (
                <Link
                  href="/sign-up"
                  className="mt-6 inline-block rounded bg-amber-400 px-5 py-3 font-semibold text-black"
                >
                  Start Free
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
        </div>
      </section>

      <section className="border-b border-neutral-800 px-6 py-24 text-center">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold md:text-4xl">
            Start With One Personalized Session
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-neutral-300">
            Create your dog&apos;s profile, receive the first training session,
            and see how the system works before deciding whether to upgrade.
          </p>

          <div className="mt-10">
            <Link
              href="/train"
              className="inline-block rounded bg-amber-400 px-6 py-3 font-semibold text-black"
            >
              Start Free
            </Link>
            <p className="mt-4 text-sm text-neutral-400">
              No credit card required.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-800 bg-black px-6 py-20">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950 shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
          <div className="relative aspect-video">
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label="Patriot K9 Command training property"
              className="h-full w-full object-cover"
            >
              <source
                src="/videos/branding/patriot-k9-training-property-reveal.mp4"
                type="video/mp4"
              />
            </video>
            <div className="absolute inset-0 flex items-center justify-center bg-black/55 p-6 text-center">
              <div className="max-w-2xl">
                <h2 className="text-3xl font-bold md:text-4xl">Ready to Start Training?</h2>
                <Link
                  href="/train"
                  className="mt-7 inline-block rounded bg-amber-400 px-6 py-3 font-semibold text-black"
                >
                  Start Training
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-800 px-6 py-16 text-center">
        <div className="mx-auto max-w-4xl rounded-2xl border border-neutral-800 bg-black/30 p-6 sm:p-8">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
            Important Safety Note
          </p>
          <p className="mx-auto mt-4 max-w-3xl text-neutral-300">
            Patriot K9 AI can help with structure, planning, and progression,
            but serious aggression, bite-risk behavior, and medical concerns
            still require an in-person professional or veterinarian.
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

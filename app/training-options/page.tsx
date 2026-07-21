import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PREMIUM_SUBSCRIPTION_PRICE_CENTS } from "@/lib/subscriptionPricing";
import { siteConfig } from "@/lib/site";

const kennelBaseUrl = "https://patriotk9kennel.com";
const monthlyPrice = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
}).format(PREMIUM_SUBSCRIPTION_PRICE_CENTS / 100);

const serviceOptions = [
  {
    title: "Evaluation",
    description: "Start with a professional assessment of your dog, goals, and the best next training step.",
    href: `${kennelBaseUrl}/training/evaluation`,
  },
  {
    title: "Puppy Foundation",
    description: "Build early structure, engagement, household routines, and foundational obedience.",
    href: `${kennelBaseUrl}/training/puppy-foundation`,
  },
  {
    title: "Private Lessons",
    description: "Work directly with a trainer to improve handling, communication, and practical obedience.",
    href: `${kennelBaseUrl}/training/private-lessons`,
  },
  {
    title: "Day Training",
    description: "Structured daytime work for owners who want focused professional help within a training routine.",
    href: `${kennelBaseUrl}/training/day-training`,
  },
  {
    title: "Board & Train",
    description: "An immersive option built around daily structure, obedience work, and owner transfer sessions.",
    href: `${kennelBaseUrl}/training/board-and-train`,
  },
  {
    title: "Behavior Modification",
    description: "Professional support for behavior concerns that need clear assessment, structure, and handling guidance.",
    href: `${kennelBaseUrl}/training/behavior-modification`,
  },
  {
    title: "Service Dog Foundations",
    description: "Foundation work for dogs and handlers pursuing reliable public manners and advanced goals.",
    href: `${kennelBaseUrl}/training/service-dog-foundations`,
  },
];

const faqItems = [
  {
    question: "Can I use the AI Trainer and in-person training together?",
    answer:
      "Yes. Professional lessons can provide direct feedback and handling instruction, while the AI Trainer can support structured practice, session notes, and consistency between appointments.",
  },
  {
    question: "Do I need to live in Ohio to use the AI Trainer?",
    answer:
      "No. The Patriot K9 AI Trainer is available from anywhere. In-person Patriot K9 Command programs are based in Northeast Ohio and may depend on location and scheduling.",
  },
  {
    question: "How do I know if my dog needs professional help?",
    answer:
      "Direct professional help may be a better fit when safety is a concern, behavior is escalating, handling feels physically difficult, or you need real-time feedback on technique and progression.",
  },
  {
    question: "Does Patriot K9 Command work only with German Shepherds?",
    answer:
      "No. Patriot K9 Command has extensive German Shepherd and working-dog experience, while training services can also support dogs of other breeds based on the individual dog, goals, and program fit.",
  },
  {
    question: "What happens after I request an evaluation?",
    answer:
      "Patriot K9 Command reviews your goals, dog, and location to discuss an appropriate evaluation or next step. Availability and logistics depend on the selected service and scheduling.",
  },
  {
    question: "Can the AI Trainer replace a professional trainer for aggression cases?",
    answer:
      "No. The AI Trainer can provide structured education and planning, but serious aggression, bite risk, immediate safety concerns, or severe behavior cases may require in-person professional evaluation and intervention.",
  },
];

const ServiceIcon = () => (
  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-500/25 bg-amber-400/10 text-amber-200">
    <svg viewBox="0 0 16 16" className="h-5 w-5 fill-none stroke-current stroke-[1.5]" aria-hidden="true">
      <path d="M3 12.6c1.3-3.8 3-5.8 5-5.8s3.7 2 5 5.8M5.2 7.1 4 4.4l2.6.8M10.8 7.1 12 4.4l-2.6.8" />
      <path d="M6.1 10.4h3.8" />
    </svg>
  </span>
);

export const metadata: Metadata = {
  title: "Choose Your Training Path",
  description:
    "Compare the Patriot K9 AI Trainer with professional hands-on dog training from Patriot K9 Command and choose the right training path for your dog.",
  alternates: {
    canonical: "/training-options",
  },
  openGraph: {
    title: "Choose Your Training Path | Patriot K9",
    description:
      "Compare online AI coaching with professional hands-on training from Patriot K9 Command.",
    url: "/training-options",
    images: [
      {
        url: siteConfig.socialShareImagePath,
        alt: "Patriot K9 Command AI Dog Trainer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [
      {
        url: siteConfig.socialShareImagePath,
        alt: "Patriot K9 Command AI Dog Trainer",
      },
    ],
  },
};

export default function TrainingOptionsPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="border-b border-neutral-800 px-6 py-16 sm:py-20 lg:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,540px)] lg:gap-14">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-400">
              AI Coaching or Hands-On Training
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Choose the Right Training Path for Your Dog
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-300">
              Some owners want a structured plan they can follow from home. Others need direct coaching from an experienced professional. Patriot K9 offers both paths, so you can choose the level of support that fits your dog, goals, and lifestyle.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/train"
                className="inline-flex min-h-12 items-center justify-center rounded bg-amber-400 px-6 py-3 text-center font-semibold text-black transition-colors hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:ring-offset-2 focus:ring-offset-neutral-950"
              >
                Start with the AI Trainer
              </Link>
              <a
                href="#in-person-training"
                className="inline-flex min-h-12 items-center justify-center rounded border border-neutral-600 px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-neutral-950"
              >
                Explore In-Person Training
              </a>
            </div>
          </div>

          <figure className="overflow-hidden rounded-3xl border border-neutral-800 bg-black/30 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
            <Image
              src="/images/branding/trainer-with-ollie-and-adolf.JPG"
              alt="Patriot K9 Command trainer working with two German Shepherds outdoors."
              width={5184}
              height={3888}
              sizes="(max-width: 1024px) calc(100vw - 48px), 540px"
              className="h-auto w-full object-contain"
              priority
            />
          </figure>
        </div>
      </section>

      <section className="border-b border-neutral-800 bg-black/30 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-400">
            Compare Your Options
          </p>
          <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Which Training Path Fits You?</h2>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <article className="rounded-2xl border border-amber-500/35 bg-gradient-to-br from-amber-400/10 via-neutral-950 to-neutral-950 p-6 shadow-[0_18px_44px_rgba(0,0,0,0.24)] sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Train From Anywhere</p>
              <h3 className="mt-3 text-2xl font-bold">Patriot K9 AI Trainer</h3>
              <p className="mt-4 leading-7 text-neutral-300">
                Get a personalized training plan, ongoing AI coaching, session tracking, progress tools, and guidance built around your individual dog.
              </p>
              <p className="mt-5 text-3xl font-bold text-white">{monthlyPrice}<span className="text-base font-medium text-neutral-400">/month</span></p>
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-neutral-400">Best for owners who</p>
              <ul className="mt-3 space-y-3 text-sm leading-6 text-neutral-200">
                <li>Want to train at home and lead the daily work themselves</li>
                <li>Need guidance available on their own schedule</li>
                <li>Want an affordable, structured plan and support between lessons</li>
                <li>Live outside the local service area</li>
              </ul>
              <Link
                href="/train"
                className="mt-7 inline-flex min-h-11 w-full items-center justify-center rounded bg-amber-400 px-5 py-3 font-semibold text-black transition-colors hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:ring-offset-2 focus:ring-offset-neutral-950 sm:w-auto"
              >
                Start AI Training
              </Link>
            </article>

            <article className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-[0_18px_44px_rgba(0,0,0,0.24)] sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Work With a Professional</p>
              <h3 className="mt-3 text-2xl font-bold">Patriot K9 Command</h3>
              <p className="mt-4 leading-7 text-neutral-300">
                Get hands-on instruction and a personalized training program directly from Patriot K9 Command for dogs and owners who need professional support.
              </p>
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-neutral-400">Best for owners who</p>
              <ul className="mt-3 space-y-3 text-sm leading-6 text-neutral-200">
                <li>Want one-on-one professional coaching and direct handling feedback</li>
                <li>Are dealing with reactivity or difficult behavior</li>
                <li>Need obedience help in real environments, puppy foundation, or Board &amp; Train</li>
                <li>Live within practical driving distance of Northeast Ohio</li>
              </ul>
              <a
                href="#in-person-training"
                className="mt-7 inline-flex min-h-11 w-full items-center justify-center rounded border border-amber-500/40 px-5 py-3 font-semibold text-amber-200 transition-colors hover:bg-amber-400/10 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-neutral-950 sm:w-auto"
              >
                View Local Training Options
              </a>
            </article>
          </div>

          <p className="mt-6 rounded-xl border border-neutral-800 bg-neutral-950 px-5 py-4 text-sm leading-6 text-neutral-300">
            Many clients can use both paths: professional lessons for direct coaching and the AI Trainer for structured practice between sessions.
          </p>
        </div>
      </section>

      <section id="in-person-training" className="scroll-mt-24 border-b border-neutral-800 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-400">Local Services</p>
            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Train Directly With Patriot K9 Command</h2>
            <p className="mt-5 text-lg leading-8 text-neutral-300">
              For owners who need hands-on help, Patriot K9 Command provides structured, practical training focused on clear communication, confidence, reliability, and real-life results.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {serviceOptions.map((service) => (
              <article key={service.title} className="flex flex-col rounded-xl border border-neutral-800 bg-black/30 p-5 transition-colors hover:border-amber-500/35">
                <div className="flex items-start gap-3">
                  <ServiceIcon />
                  <div>
                    <h3 className="text-lg font-semibold">{service.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-neutral-400">{service.description}</p>
                  </div>
                </div>
                <a
                  href={service.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex min-h-10 items-center text-sm font-semibold text-amber-300 underline underline-offset-4 hover:text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-300"
                >
                  Learn More
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-800 bg-black/30 px-6 py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-400">Service Area</p>
            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Serving Northeast Ohio and the Surrounding Region</h2>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-neutral-300">
              Patriot K9 Command is based in Columbiana County, Ohio, and works with clients throughout Northeast Ohio and the surrounding tri-state region. Travel, pickup, drop-off, and meet-up options may depend on the selected program and location.
            </p>
            <ul className="mt-6 flex flex-wrap gap-2 text-sm text-neutral-200">
              {["Columbiana County", "Mahoning County", "Stark County", "Trumbull County", "Nearby Pennsylvania", "Nearby West Virginia"].map((area) => (
                <li key={area} className="rounded-full border border-neutral-700 bg-neutral-950 px-3 py-2">{area}</li>
              ))}
            </ul>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-neutral-800 bg-black/30 shadow-[0_18px_44px_rgba(0,0,0,0.24)]">
            <Image
              src="/images/branding/patriot-k9-pack-training-property.jpg"
              alt="Patriot K9 Command dogs training on the rural Ohio property."
              width={1536}
              height={1024}
              sizes="(max-width: 1024px) calc(100vw - 48px), 440px"
              className="h-auto w-full object-contain"
            />
          </figure>
        </div>
      </section>

      <section className="border-b border-neutral-800 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl rounded-2xl border border-neutral-800 bg-neutral-950 p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-400">Professional Support</p>
          <h2 className="mt-4 text-3xl font-bold sm:text-4xl">When Hands-On Training May Be the Better Choice</h2>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-neutral-300">
            Direct coaching can be especially valuable when the dog, environment, or handling situation needs in-person assessment and real-time feedback.
          </p>
          <ul className="mt-7 grid gap-3 sm:grid-cols-2">
            {[
              "Aggression or serious bite risk",
              "Severe reactivity or safety concerns involving children or other animals",
              "A handler who feels physically unable to manage the dog",
              "Behavior that is escalating despite consistent practice",
              "Advanced working, service, or public-access goals",
              "Owners who need direct feedback on handling technique",
            ].map((item) => (
              <li key={item} className="rounded-lg border border-neutral-800 bg-black/30 px-4 py-3 text-sm leading-6 text-neutral-200">{item}</li>
            ))}
          </ul>
          <p className="mt-6 rounded-lg border border-amber-500/25 bg-amber-400/5 p-4 text-sm leading-6 text-amber-100">
            The AI Trainer can provide education and structured guidance, but it is not a substitute for emergency veterinary care or direct professional intervention when immediate safety is at risk.
          </p>
        </div>
      </section>

      <section className="border-b border-neutral-800 bg-black/30 px-6 py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-[0_18px_44px_rgba(0,0,0,0.24)] sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-400">Continued Support</p>
            <h2 className="mt-4 text-3xl font-bold">Use Both for Continued Support</h2>
            <p className="mt-5 leading-7 text-neutral-300">
              Professional training can establish skills and improve handling. The Patriot K9 AI Trainer can then help owners continue practicing, track sessions, review progress, and stay consistent between lessons or after a program ends.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/train" className="inline-flex min-h-11 items-center justify-center rounded bg-amber-400 px-5 py-3 font-semibold text-black hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:ring-offset-2 focus:ring-offset-neutral-950">
                Continue with AI Trainer
              </Link>
              <a href={`${kennelBaseUrl}/training/evaluation`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center rounded border border-neutral-600 px-5 py-3 font-semibold text-white hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-neutral-950">
                Contact Patriot K9 Command
              </a>
            </div>
          </div>
          <figure className="overflow-hidden rounded-xl border border-neutral-800 bg-black/30">
            <Image
              src="/images/ai-trainer/engagement-focus-training.jpg"
              alt="German Shepherd practicing engagement and focus during Patriot K9 training."
              width={1600}
              height={1067}
              sizes="(max-width: 1024px) calc(100vw - 96px), 420px"
              className="h-auto w-full object-contain"
            />
          </figure>
        </div>
      </section>

      <section className="border-b border-neutral-800 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-400">Questions</p>
          <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Training Path FAQ</h2>
          <div className="mt-8 space-y-3">
            {faqItems.map((item) => (
              <details key={item.question} className="group rounded-xl border border-neutral-800 bg-black/30">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-base font-semibold text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-300">
                  <span>{item.question}</span>
                  <span className="shrink-0 text-amber-300 transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                </summary>
                <div className="border-t border-neutral-800 px-5 py-4 text-sm leading-7 text-neutral-300">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-400/10 via-neutral-950 to-neutral-950 px-6 py-10 text-center shadow-[0_20px_50px_rgba(0,0,0,0.35)] sm:px-10">
          <h2 className="text-3xl font-bold sm:text-4xl">Ready to Choose Your Training Path?</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-neutral-300">
            Start with guided training from home or connect directly with Patriot K9 Command for hands-on professional support.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/train" className="inline-flex min-h-12 items-center justify-center rounded bg-amber-400 px-6 py-3 font-semibold text-black hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:ring-offset-2 focus:ring-offset-neutral-950">
              Start AI Training
            </Link>
            <a href={`${kennelBaseUrl}/training/evaluation`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center rounded border border-neutral-600 px-6 py-3 font-semibold text-white hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-neutral-950">
              Request In-Person Training
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

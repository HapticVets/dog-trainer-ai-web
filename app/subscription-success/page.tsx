import Link from "next/link";

const supportDiscordUrl = "https://discord.gg/7Et6UU8M67";

const onboardingCards = [
  {
    title: "Start With Your Dog Profile",
    description:
      "Add your dog's age, breed, temperament, training goals, and current issues so the AI trainer can build guidance around the real dog in front of you.",
  },
  {
    title: "Ask for a Training Plan",
    description:
      "Get help with puppy foundation, leash pulling, recall, crate training, reactivity, public manners, confidence building, and obedience.",
  },
  {
    title: "Use the Method",
    description:
      "The AI follows a structured format: Problem / Why It's Happening / Plan / Criteria / Common Mistakes / Next Step.",
  },
  {
    title: "Need Help?",
    description:
      "Join the Discord community for support, follow-up questions, and direct feedback when you need more guidance.",
  },
];

export default function SubscriptionSuccessPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="border-b border-neutral-800 px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
            Subscription Confirmed
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
            Welcome to Patriot K9 AI Trainer
          </h1>

          <p className="mt-6 max-w-3xl text-base text-neutral-300 sm:text-lg">
            Your subscription is active. You can now start using structured AI
            dog training guidance built around Patriot K9 Command doctrine.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/train"
              className="w-full rounded bg-amber-400 px-6 py-3 text-center font-semibold text-black sm:w-auto"
            >
              Start Training
            </Link>

            <Link
              href="/dashboard"
              className="w-full rounded border border-neutral-600 px-6 py-3 text-center font-semibold text-white hover:bg-neutral-900 sm:w-auto"
            >
              Go to Dashboard
            </Link>

            <a
              href={supportDiscordUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full rounded border border-neutral-600 px-6 py-3 text-center font-semibold text-white hover:bg-neutral-900 sm:w-auto"
            >
              Join Discord
            </a>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 md:grid-cols-2">
            {onboardingCards.map((card) => (
              <article
                key={card.title}
                className="rounded-lg border border-neutral-800 bg-black/30 p-6"
              >
                <h2 className="text-2xl font-bold">{card.title}</h2>
                <p className="mt-4 text-neutral-300">{card.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-800 px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-5xl rounded-lg border border-amber-400/20 bg-amber-400/10 p-6 sm:p-8">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-300">
            Getting Started
          </p>
          <p className="mt-4 text-base leading-8 text-neutral-100 sm:text-lg">
            Start by creating your dog profile, then ask the AI trainer for a
            first plan based on your goal and current issue. From there, log what
            happened, troubleshoot what broke down, and keep building forward with
            structured next steps.
          </p>
        </div>
      </section>
    </main>
  );
}

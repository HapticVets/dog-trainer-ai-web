import Image from "next/image";
import Link from "next/link";
import type { LandingPageConfig } from "@/lib/landingPages";

type SeoLandingPageProps = {
  config: LandingPageConfig;
};

export default function SeoLandingPage({ config }: SeoLandingPageProps) {
  const renderExtraSections = (
    placement: NonNullable<LandingPageConfig["extraSections"]>[number]["placement"],
  ) => {
    const sections = config.extraSections?.filter((section) => section.placement === placement);

    if (!sections?.length) {
      return null;
    }

    return sections.map((section) => (
      <section
        key={`${section.placement}-${section.title}`}
        className="border-b border-neutral-800 px-6 py-20"
      >
        <div
          className={`mx-auto grid max-w-6xl items-center gap-10 ${
            section.reverse
              ? "lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)]"
              : "lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)]"
          }`}
        >
          <div className={section.reverse ? "lg:order-2" : ""}>
            <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
              {section.eyebrow}
            </p>
            <h2 className="mt-4 text-3xl font-bold md:text-4xl">
              {section.title}
            </h2>
            <div className="mt-6 space-y-4 text-neutral-300">
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>

          <figure
            className={`w-full overflow-hidden rounded-3xl border border-neutral-800 bg-black/30 shadow-[0_20px_50px_rgba(0,0,0,0.35)] ${
              section.reverse ? "lg:order-1" : ""
            }`}
          >
            {section.media.type === "image" ? (
              <Image
                src={section.media.src}
                alt={section.media.alt}
                width={section.media.width}
                height={section.media.height}
                sizes="(max-width: 768px) calc(100vw - 48px), (max-width: 1280px) 42vw, 520px"
                className="h-auto w-full object-contain"
              />
            ) : (
              <video
                controls
                muted
                playsInline
                preload="metadata"
                poster={section.media.poster}
                className="aspect-video w-full"
              >
                <source src={section.media.src} type="video/mp4" />
              </video>
            )}
            {section.media.caption && (
              <figcaption className="border-t border-neutral-800 px-5 py-4 text-sm text-neutral-400">
                {section.media.caption}
              </figcaption>
            )}
          </figure>
        </div>
      </section>
    ));
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="border-b border-neutral-800 px-6 py-24">
        <div
          className={`mx-auto max-w-6xl ${
            config.heroImage
              ? "grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)]"
              : ""
          }`}
        >
          <div>
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

          {config.heroImage && (
            <figure className="w-full overflow-hidden rounded-3xl border border-neutral-800 bg-black/30 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src={config.heroImage.src}
                  alt={config.heroImage.alt}
                  fill
                  sizes="(max-width: 768px) calc(100vw - 48px), (max-width: 1280px) 42vw, 520px"
                  className="object-contain md:object-cover"
                />
              </div>
              {config.heroImage.caption && (
                <figcaption className="border-t border-neutral-800 px-5 py-4 text-sm text-neutral-400">
                  {config.heroImage.caption}
                </figcaption>
              )}
            </figure>
          )}
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

      {config.heroVideo && (
        <section className="border-b border-neutral-800 px-6 py-20">
          <div className="mx-auto max-w-6xl text-center">
            <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
              {config.heroVideo.eyebrow}
            </p>
            <h2 className="mt-4 text-3xl font-bold md:text-4xl">
              {config.heroVideo.title}
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-neutral-300">
              {config.heroVideo.description}
            </p>

            <div className="mx-auto mt-10 w-full max-w-full overflow-hidden rounded-3xl border border-amber-400/40 bg-black/30 shadow-[0_20px_50px_rgba(0,0,0,0.35)] sm:max-w-[700px] xl:max-w-[850px]">
              <video
                controls
                muted
                playsInline
                preload="metadata"
                className="aspect-video w-full"
              >
                <source src={config.heroVideo.src} type="video/mp4" />
              </video>
            </div>
          </div>
        </section>
      )}

      {config.supportingSection && (
        <section className="border-b border-neutral-800 px-6 py-20">
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)]">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
                {config.supportingSection.eyebrow}
              </p>
              <h2 className="mt-4 text-3xl font-bold md:text-4xl">
                {config.supportingSection.title}
              </h2>
              <div className="mt-6 space-y-4 text-neutral-300">
                {config.supportingSection.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>

            <figure className="w-full overflow-hidden rounded-3xl border border-neutral-800 bg-black/30 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
              <Image
                src={config.supportingSection.image.src}
                alt={config.supportingSection.image.alt}
                width={config.supportingSection.image.width}
                height={config.supportingSection.image.height}
                sizes="(max-width: 768px) calc(100vw - 48px), (max-width: 1280px) 42vw, 520px"
                className="h-auto w-full object-contain"
              />
              {config.supportingSection.image.caption && (
                <figcaption className="border-t border-neutral-800 px-5 py-4 text-sm text-neutral-400">
                  {config.supportingSection.image.caption}
                </figcaption>
              )}
            </figure>
          </div>
        </section>
      )}

      {renderExtraSections("afterSupporting")}

      <section className="border-b border-neutral-800 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-neutral-800 bg-black/30 p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-amber-400">
                Common Mistakes
              </p>
              <ul className="mt-5 space-y-3 text-neutral-300">
                {config.commonMistakes.map((item) => (
                  <li key={item}>&bull; {item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-neutral-800 bg-black/30 p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-amber-400">
                How Patriot K9 AI Trainer Helps
              </p>
              <ul className="mt-5 space-y-3 text-neutral-300">
                {config.aiHelps.map((item) => (
                  <li key={item}>&bull; {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {renderExtraSections("afterCommonMistakes")}

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

      {renderExtraSections("afterExamplePlan")}

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

      {renderExtraSections("afterAskTheAi")}

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

      {renderExtraSections("afterFaq")}

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

          <div className="mt-8 rounded border border-neutral-800 bg-black/30 p-5">
            <p className="text-sm font-semibold text-white">
              Want to know who built Patriot K9 AI Trainer?
            </p>
            <p className="mt-2 text-sm text-neutral-400">
              Learn about John Reese, the story behind Patriot K9 Command, and
              the philosophy guiding the AI trainer.
            </p>
            <Link
              href="/about"
              className="mt-4 inline-block rounded border border-neutral-700 px-4 py-3 text-sm font-semibold text-white hover:bg-neutral-900"
            >
              Read About Patriot K9 Command
            </Link>
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

type PricingCardProps = {
  title: string;
  price: string;
  description?: string;
  bullets?: string[];
  outcome?: string;
  accent?: boolean;
  subtext?: string;
};

const corePhases: PricingCardProps[] = [
  {
    title: "Phase 1: Foundation & Obedience",
    price: "$1,000",
    bullets: [
      "Leash control & heel work",
      "Sit, down, place, stay",
      "Engagement & focus",
      "Owner handling fundamentals",
    ],
    outcome: "Dog listens in controlled environments.",
  },
  {
    title: "Phase 2: Control Under Distraction",
    price: "$1,000",
    bullets: [
      "Outdoor training environments",
      "Distraction proofing",
      "Owner confidence building",
      "Controlled exposure to real-world scenarios",
    ],
    outcome: "Dog listens despite distractions.",
  },
  {
    title: "Phase 3: Real-World Reliability",
    price: "$1,000",
    bullets: [
      "Public training sessions",
      "Advanced obedience",
      "Off-leash progression (if appropriate)",
      "Real-life application training",
    ],
    outcome: "Dog is reliable in everyday situations.",
  },
];

const supportPrograms: PricingCardProps[] = [
  {
    title: "Maintenance Program",
    price: "$200/month",
    bullets: [
      "2 sessions per month",
      "Priority scheduling",
      "Continued behavior refinement",
      "Access to ongoing guidance",
    ],
  },
  {
    title: "Board & Train Programs",
    price: "2 Week Program - $2,200\n4 Week Program - $3,800",
    bullets: [
      "Daily structured training",
      "Obedience foundation + behavior work",
      "Owner transfer session included",
    ],
  },
  {
    title: "Additional Services",
    price:
      "Private Sessions\n1 Session: $120\n6 Sessions: $700\n12 Sessions: $1,200",
    bullets: ["Daycare / Training Day - $80/day", "Boarding - $600/week"],
  },
];

function PricingCard({
  title,
  price,
  description,
  bullets,
  outcome,
  accent = false,
  subtext,
}: PricingCardProps) {
  return (
    <article
      className={`rounded-2xl border p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] transition ${
        accent
          ? "border-amber-400/30 bg-amber-400/10"
          : "border-neutral-800 bg-neutral-950/90"
      }`}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          {description && (
            <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-300">
              {description}
            </p>
          )}
        </div>

        {price && (
          <div className="whitespace-pre-line rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm font-semibold text-amber-300">
            {price}
          </div>
        )}
      </div>

      {bullets && (
        <ul className="mt-6 grid gap-3 text-sm text-neutral-200 sm:grid-cols-2">
          {bullets.map((bullet) => (
            <li
              key={bullet}
              className="rounded-xl border border-white/8 bg-black/25 px-4 py-3"
            >
              {bullet}
            </li>
          ))}
        </ul>
      )}

      {(outcome || subtext) && (
        <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 text-sm">
          {outcome && (
            <p className="text-neutral-300">
              <span className="font-semibold text-amber-300">Outcome:</span>{" "}
              {outcome}
            </p>
          )}
          {subtext && <p className="text-neutral-400">{subtext}</p>}
        </div>
      )}
    </article>
  );
}

export default function PricingSection() {
  return (
    <section className="border-t border-neutral-800 px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-sm uppercase tracking-[0.28em] text-amber-400">
            Training Programs
          </p>
          <h2 className="mt-4 text-3xl font-bold md:text-4xl">
            Professional Dog Training Programs
          </h2>
          <p className="mt-5 text-lg leading-8 text-neutral-300">
            A clear, structured training path designed to take dogs from
            obedience foundations to real-world reliability.
          </p>
        </div>

        <div className="mt-12 space-y-6">
          <PricingCard
            title="Initial Evaluation"
            price="$100"
            description="A one-on-one session to assess your dog's behavior, identify goals, and build a structured training plan."
            bullets={[
              "Behavior assessment",
              "Obedience evaluation",
              "Customized training roadmap",
            ]}
            accent
          />

          <div className="rounded-[28px] border border-neutral-800 bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.12),transparent_40%),rgba(10,10,10,0.9)] p-6 md:p-8">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-amber-400">
                  3-Phase System
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-white">
                  Core Training Program
                </h3>
              </div>

              <div className="rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-200">
                Full Program Commitment - $2,700
              </div>
            </div>

            <p className="mt-4 text-sm text-neutral-400">
              Save $300 when committing upfront.
            </p>

            <div className="mt-8 grid gap-6 xl:grid-cols-3">
              {corePhases.map((phase) => (
                <PricingCard key={phase.title} {...phase} />
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-neutral-800 bg-neutral-950/80 p-6 md:p-8">
            <div className="max-w-3xl">
              <p className="text-sm uppercase tracking-[0.24em] text-amber-400">
                Continued Support
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-white">
                Ongoing Training & Maintenance
              </h3>
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-3">
              {supportPrograms.map((program, index) => (
                <PricingCard
                  key={program.title}
                  {...program}
                  accent={index === 0}
                />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-black/30 px-6 py-8 text-center">
            <p className="mx-auto max-w-4xl text-lg leading-8 text-neutral-200">
              At Patriot K9 Command, we do not just teach commands - we build
              discipline, structure, and real-world reliability.
            </p>
            <a
              href="https://discord.gg/g9EfyjQEcR"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex rounded bg-amber-400 px-6 py-3 font-semibold text-black transition hover:brightness-110"
            >
              Click here to contact me through our community Discord server
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

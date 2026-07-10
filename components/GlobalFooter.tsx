"use client";

import Link from "next/link";

const trainingResourceLinks = [
  { href: "/puppy-training", label: "Puppy Training" },
  { href: "/german-shepherd-training", label: "German Shepherd Training" },
  { href: "/leash-training", label: "Leash Training" },
  { href: "/stop-barking", label: "Stop Barking" },
];

const companyLinks = [
  { href: "/about", label: "About" },
  { href: "/method", label: "Method" },
  { href: "/train", label: "Start Training" },
];

export default function GlobalFooter() {
  return (
    <footer className="border-t border-neutral-800 bg-neutral-950">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="max-w-md">
          <p className="font-semibold text-white">Patriot K9 AI Trainer</p>
          <p className="mt-3 text-sm leading-7 text-neutral-400">
            Structured AI dog training guidance built from real Patriot K9 Command
            doctrine for obedience, behavior troubleshooting, and ongoing
            progression.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
            Training Resources
          </h2>
          <nav className="mt-4 flex flex-col gap-3">
            {trainingResourceLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-neutral-300 transition hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
            Patriot K9
          </h2>
          <nav className="mt-4 flex flex-col gap-3">
            {companyLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-neutral-300 transition hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}

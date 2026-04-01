"use client";

import { useUser } from "@clerk/nextjs";

export default function Home() {
  const { isSignedIn } = useUser();

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
    <div className="min-h-screen bg-[#0b0f17] text-white">
      {/* HERO */}
      <section className="px-6 py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-2">
          <div>
            <h1 className="text-5xl font-bold leading-tight">
              Never wonder what to do with your dog again.
              <span className="text-cyan-400"> Real structure. Real results.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg text-slate-400">
              Patriot K9 Command eliminates guesswork. Log real sessions, track what
              happened, and get structured next steps built around the dog in front of you.
            </p>

            <div className="mt-10 flex gap-4">
              <a
                href="/train"
                className="rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-black hover:brightness-110"
              >
                Start Training
              </a>

              {!isSignedIn && (
                <a
                  href="/sign-up"
                  className="rounded-xl border border-white/20 px-6 py-3 hover:bg-white/10"
                >
                  Create Account
                </a>
              )}

              {isSignedIn && (
                <button
                  onClick={handleCheckout}
                  className="rounded-xl border border-white/20 px-6 py-3 hover:bg-white/10"
                >
                  Go Premium
                </button>
              )}
            </div>
          </div>

          <div>
            <img
              src="/hero-dog.jpg"
              alt="Dog training action"
              className="w-full rounded-2xl border border-white/10 shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-6 pb-24">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {[
            {
              title: "Structured System",
              desc: "Built around real progression, not random tips.",
            },
            {
              title: "Session-Based Training",
              desc: "Log what happened and train off real results.",
            },
            {
              title: "Command-Level Control",
              desc: "Build reliability, boundaries, and real obedience.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-cyan-400/40"
            >
              <div className="mb-4 h-10 w-10 rounded-lg bg-cyan-400/20" />
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHY IT'S DIFFERENT */}
      <section className="border-t border-white/10 px-6 py-24">
        <div className="mx-auto max-w-6xl rounded-2xl border border-white/10 bg-[#0f172a] p-8">
          <h2 className="text-3xl font-bold text-white">
            This isn’t another dog training app.
          </h2>

          <p className="mt-4 max-w-3xl text-lg text-slate-300">
            Most dog training apps give you videos, tips, or generic plans and leave
            you guessing what to do next. Patriot K9 Command is built differently.
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/30 p-6">
              <h3 className="text-xl font-semibold text-red-400">Most Apps</h3>
              <ul className="mt-4 space-y-2 text-slate-300">
                <li>• Watch lessons</li>
                <li>• Try random exercises</li>
                <li>• Follow generic plans</li>
                <li>• Guess what to do next</li>
              </ul>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/30 p-6">
              <h3 className="text-xl font-semibold text-cyan-400">
                Patriot K9 Command
              </h3>
              <ul className="mt-4 space-y-2 text-slate-300">
                <li>• Log real training sessions</li>
                <li>• Track wins and problems</li>
                <li>• Generate the exact next session</li>
                <li>• Built on a real structured system</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xl font-semibold text-white">
              Stop guessing. Start progressing.
            </p>
          </div>
        </div>
      </section>

      {/* TRUST SECTION */}
      <section className="border-t border-white/10 px-6 py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-2">
          <div>
            <img
              src="/dog-obedience.jpg"
              alt="Obedient dog training"
              className="w-full rounded-2xl border border-white/10 shadow-lg"
            />
          </div>

          <div>
            <h2 className="text-3xl font-bold">
              Built for real obedience, not guesswork.
            </h2>

            <p className="mt-6 text-slate-400">
              This system is designed around measurable progress. Every session
              builds on the last, so you always know what the dog understands,
              what is breaking down, and what needs to happen next.
            </p>

            <ul className="mt-6 space-y-3 text-slate-300">
              <li>• Track every training session</li>
              <li>• Generate structured next steps</li>
              <li>• Build long-term consistency</li>
              <li>• Train with purpose, not randomness</li>
            </ul>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="border-t border-white/10 px-6 py-20 text-center">
        <h2 className="text-3xl font-bold">Access Levels</h2>

        <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
          <div className="rounded-xl bg-white/5 p-6">
            <h3 className="text-lg font-semibold">Basic Access</h3>
            <p className="mt-2 text-3xl font-bold">$0</p>

            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li>• Limited coaching</li>
              <li>• Session logging</li>
              <li>• Basic tracking</li>
            </ul>
          </div>

          <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-6">
            <h3 className="text-lg font-semibold">Full Command Access</h3>
            <p className="mt-2 text-3xl font-bold">$19/mo</p>

            <p className="mt-4 text-slate-300">
              Less than one training session. Built to be used every day.
            </p>

            <p className="mt-2 text-sm text-slate-200">
              Know exactly what to do with your dog every time you train.
            </p>

            <ul className="mt-4 space-y-2 text-sm text-slate-200">
              <li>• Unlimited AI coaching</li>
              <li>• Full progress tracking</li>
              <li>• Saved reports & plans</li>
              <li>• Multi-dog management</li>
            </ul>

            {!isSignedIn && (
              <a
                href="/sign-up"
                className="mt-6 inline-block rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-black hover:brightness-110"
              >
                Create Account
              </a>
            )}

            {isSignedIn && (
              <button
                onClick={handleCheckout}
                className="mt-6 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-black hover:brightness-110"
              >
                Upgrade Now
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
"use client";

import { useUser, UserButton } from "@clerk/nextjs";

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

      alert("Stripe checkout link could not be created.");
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Something went wrong starting checkout.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-white">
      {/* NAV */}
      <nav className="relative z-50 flex items-center justify-between border-b border-white/10 px-6 py-5">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Patriot K9 Command"
            className="h-10 w-10 object-contain"
          />
          <h1 className="text-xl font-bold tracking-tight">Patriot K9 Command</h1>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="/train"
            className="text-sm text-slate-300 transition hover:text-white"
          >
            Training
          </a>

          {!isSignedIn && (
            <>
              <a
                href="/sign-in"
                className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Sign In
              </a>
              <a
                href="/sign-up"
                className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110"
              >
                Sign Up
              </a>
            </>
          )}

          {isSignedIn && (
            <>
              <button
                type="button"
                onClick={handleCheckout}
                className="cursor-pointer rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110"
              >
                Upgrade
              </button>
              <UserButton afterSignOutUrl="/" />
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section className="px-6 py-24 text-center">
        <h2 className="mx-auto max-w-4xl text-5xl font-bold leading-tight">
          Structured dog training.
          <span className="text-cyan-400"> Real results.</span>
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
          Patriot K9 Command is a structured training system built to eliminate
          guesswork. Fix behavior, build obedience, and develop competition-level
          control through disciplined progression.
        </p>

        <div className="mt-10 flex justify-center gap-4">
          <a
            href="/train"
            className="rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-black transition hover:brightness-110"
          >
            Start Training
          </a>

          {!isSignedIn && (
            <a
              href="/sign-up"
              className="rounded-xl border border-white/20 px-6 py-3 text-white transition hover:bg-white/10"
            >
              Create Account
            </a>
          )}

          {isSignedIn && (
            <button
              type="button"
              onClick={handleCheckout}
              className="cursor-pointer rounded-xl border border-white/20 px-6 py-3 text-white transition hover:bg-white/10"
            >
              Go Premium
            </button>
          )}
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-6 pb-24">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {[
            {
              title: "Structured System",
              desc: "Clear step-by-step training progression with no guessing.",
            },
            {
              title: "Performance Tracking",
              desc: "Track sessions and adjust based on real outcomes.",
            },
            {
              title: "Command-Level Control",
              desc: "Build obedience, discipline, and competition precision.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="rounded-xl border border-white/10 bg-white/5 p-6"
            >
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{item.desc}</p>
            </div>
          ))}
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
              <li>• Initial training structure</li>
              <li>• System introduction</li>
            </ul>
          </div>

          <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-6">
            <h3 className="text-lg font-semibold">Full Command Access</h3>
            <p className="mt-2 text-3xl font-bold">$10/mo</p>

            <ul className="mt-4 space-y-2 text-sm text-slate-200">
              <li>• Unlimited coaching</li>
              <li>• Full progress tracking system</li>
              <li>• Adaptive training progression</li>
              <li>• Behavior + AKC-level guidance</li>
            </ul>

            {!isSignedIn && (
              <a
                href="/sign-up"
                className="mt-6 inline-block rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-black transition hover:brightness-110"
              >
                Create Account First
              </a>
            )}

            {isSignedIn && (
              <button
                type="button"
                onClick={handleCheckout}
                className="mt-6 cursor-pointer rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-black transition hover:brightness-110"
              >
                Upgrade to Full Access
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
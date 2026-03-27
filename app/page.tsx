export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <section className="px-6 py-20 text-center">
        <h1 className="mb-6 text-5xl font-bold">Dog Trainer AI</h1>

        <p className="mx-auto mb-8 max-w-2xl text-xl text-slate-300">
          Structured dog training that adapts as your dog improves. Fix behavior,
          build obedience, and train for competition with clear step-by-step coaching.
        </p>

        <div className="flex justify-center gap-4">
          <a
            href="/train"
            className="rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-black"
          >
            Start Training
          </a>

          <a
            href="#pricing"
            className="rounded-xl border border-white/20 px-6 py-3"
          >
            View Pricing
          </a>
        </div>
      </section>

      <section className="border-t border-white/10 px-6 py-16">
        <h2 className="mb-10 text-center text-3xl font-semibold">How It Works</h2>

        <div className="mx-auto max-w-4xl space-y-6">
          <div className="rounded-xl bg-white/5 p-5">
            1. Tell the system your dog and your goal
          </div>
          <div className="rounded-xl bg-white/5 p-5">
            2. Get a structured training plan
          </div>
          <div className="rounded-xl bg-white/5 p-5">
            3. Run sessions and report results
          </div>
          <div className="rounded-xl bg-white/5 p-5">
            4. Get your next step based on progress
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-6 py-16">
        <h2 className="mb-10 text-center text-3xl font-semibold">What You Get</h2>

        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
          <div className="rounded-xl bg-white/5 p-6">
            <h3 className="mb-2 text-xl font-semibold">Structured Plans</h3>
            <p className="text-slate-300">
              Step-by-step guidance for behavior, obedience, and competition training.
            </p>
          </div>

          <div className="rounded-xl bg-white/5 p-6">
            <h3 className="mb-2 text-xl font-semibold">Progress Tracking</h3>
            <p className="text-slate-300">
              Track sessions and know exactly what to adjust next.
            </p>
          </div>

          <div className="rounded-xl bg-white/5 p-6">
            <h3 className="mb-2 text-xl font-semibold">Adaptive Coaching</h3>
            <p className="text-slate-300">
              Plans evolve based on what your dog actually does.
            </p>
          </div>

          <div className="rounded-xl bg-white/5 p-6">
            <h3 className="mb-2 text-xl font-semibold">AKC Training Support</h3>
            <p className="text-slate-300">
              Obedience, Rally, and Agility guidance with real mechanics.
            </p>
          </div>
        </div>
      </section>

      <section id="pricing" className="border-t border-white/10 px-6 py-16 text-center">
        <h2 className="mb-10 text-3xl font-semibold">Pricing</h2>

        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          <div className="rounded-xl bg-white/5 p-6">
            <h3 className="text-xl font-semibold">Free</h3>
            <p className="mt-2 text-3xl">$0</p>

            <ul className="mt-4 space-y-2 text-slate-300">
              <li>Guided onboarding</li>
              <li>Starter plans</li>
              <li>Limited coaching</li>
            </ul>
          </div>

          <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-6">
            <h3 className="text-xl font-semibold">Premium</h3>
            <p className="mt-2 text-3xl">$9/mo</p>

            <ul className="mt-4 space-y-2 text-slate-200">
              <li>Unlimited coaching</li>
              <li>Progress tracking</li>
              <li>Adaptive plans</li>
              <li>Behavior + AKC support</li>
            </ul>

            <button className="mt-6 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-black">
              Upgrade to Premium
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 py-10 text-center text-slate-400">
        Dog Trainer AI — Train smarter. Get results.
      </footer>
    </div>
  );
}
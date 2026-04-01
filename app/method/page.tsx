export default function MethodPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">

      {/* HERO */}
      <section className="relative border-b border-neutral-800">
        <img
          src="/german-shepherd-hero.png"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />

        <div className="relative mx-auto max-w-6xl px-6 py-32">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
            The 4C K9 Doctrine
          </p>

          <h1 className="mt-4 text-4xl font-bold md:text-6xl max-w-4xl leading-tight">
            Build a Dog That Is Controlled, Reliable, and Ready for the Real World
          </h1>

          <p className="mt-6 text-lg text-neutral-300 max-w-2xl">
            A structured training system that shows you exactly what to do,
            when to do it, and how to fix your dog’s behavior without guessing.
          </p>

          <div className="mt-10 flex gap-4">
            <a href="/train" className="bg-amber-400 text-black px-6 py-3 font-semibold rounded">
              Start Training Now
            </a>

            <a href="/train" className="border border-neutral-600 px-6 py-3 rounded">
              Generate First Session
            </a>
          </div>
        </div>
      </section>

      {/* BEFORE / AFTER */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-3xl font-bold mb-10 text-center">
          Real Results — Structured Transformation
        </h2>

        <div className="grid md:grid-cols-2 gap-6">

          <div className="relative">
            <img src="/german-shepherd-before.png" className="rounded-lg" />
            <p className="absolute top-3 left-3 bg-black/70 px-3 py-1 text-sm">
              BEFORE
            </p>
          </div>

          <div className="relative">
            <img src="/german-shepherd-after.png" className="rounded-lg" />
            <p className="absolute top-3 left-3 bg-amber-400 text-black px-3 py-1 text-sm font-semibold">
              AFTER
            </p>
          </div>

        </div>
      </section>

      {/* 4 C'S */}
      <section className="mx-auto max-w-5xl px-6 py-20 border-t border-neutral-800">
        <h2 className="text-3xl font-bold mb-10">
          The 4 C’s
        </h2>

        <div className="grid md:grid-cols-2 gap-8">

          <div>
            <h3 className="text-xl font-semibold">Clarity</h3>
            <p className="text-neutral-400">
              Your dog must understand the command before performance is expected.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold">Consistency</h3>
            <p className="text-neutral-400">
              Daily structure and repetition build reliable behavior.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold">Control</h3>
            <p className="text-neutral-400">
              Your dog listens on command, not based on mood or environment.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold">Challenge</h3>
            <p className="text-neutral-400">
              Training must hold under distraction and real-world pressure.
            </p>
          </div>

        </div>
      </section>

      {/* AI SYSTEM IMAGE */}
      <section className="mx-auto max-w-5xl px-6 py-20 border-t border-neutral-800 text-center">
        <h2 className="text-3xl font-bold mb-6">
          This Is Where AI Changes Everything
        </h2>

        <p className="text-neutral-300 leading-8 max-w-2xl mx-auto">
          Your training sessions are tracked, behavior is analyzed,
          and your next session is generated automatically based on real performance.
        </p>

        <img
          src="/k9-training-system-flow.png"
          className="mt-10 rounded-lg mx-auto"
        />
      </section>

      {/* FINAL CTA */}
      <section className="text-center py-20 border-t border-neutral-800">
        <h2 className="text-3xl font-bold mb-6">
          Stop Guessing. Start Training With Structure.
        </h2>

        <a
          href="/train"
          className="bg-amber-400 text-black px-8 py-4 rounded font-semibold"
        >
          Start Your Dog’s Training Plan
        </a>
      </section>

    </main>
  );
}
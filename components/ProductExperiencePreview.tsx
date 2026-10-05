const previews = [
  {
    step: "1",
    eyebrow: "Dog Case File",
    title: "Training starts with your dog",
    body: "Save age, behavior, goals, experience, environment, and priorities so guidance has useful context.",
    panel: (
      <div className="space-y-3 rounded-xl border border-neutral-800 bg-black/45 p-4 text-sm">
        <div className="flex items-center justify-between"><span className="text-neutral-400">Primary goal</span><span className="font-semibold text-white">Loose-leash walking</span></div>
        <div className="flex items-center justify-between"><span className="text-neutral-400">Experience</span><span className="font-semibold text-white">Needs foundations</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-neutral-800"><div className="h-full w-2/3 rounded-full bg-amber-400" /></div>
      </div>
    ),
  },
  {
    step: "2",
    eyebrow: "Today’s Session",
    title: "Know exactly what to work on",
    body: "Follow a structured session with a clear focus, practical steps, and progression suited to the case file.",
    panel: (
      <div className="rounded-xl border border-amber-400/25 bg-amber-400/5 p-4 text-sm">
        <p className="font-semibold text-amber-200">Engagement before movement</p>
        <ol className="mt-3 space-y-2 text-neutral-300"><li>1. Calm setup and reward check</li><li>2. Short engagement repetitions</li><li>3. Add controlled movement</li></ol>
      </div>
    ),
  },
  {
    step: "3",
    eyebrow: "Progress Log",
    title: "Turn every session into the next step",
    body: "Record wins and challenges so future guidance reflects the work you actually completed.",
    panel: (
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-xl border border-neutral-800 bg-black/45 p-3"><p className="text-xl font-bold text-white">3</p><p className="mt-1 text-neutral-400">Sessions</p></div>
        <div className="rounded-xl border border-neutral-800 bg-black/45 p-3"><p className="text-xl font-bold text-emerald-300">Good</p><p className="mt-1 text-neutral-400">Last result</p></div>
        <div className="rounded-xl border border-neutral-800 bg-black/45 p-3"><p className="text-xl font-bold text-amber-300">Next</p><p className="mt-1 text-neutral-400">Progression</p></div>
      </div>
    ),
  },
];

export default function ProductExperiencePreview() {
  return (
    <section className="border-b border-neutral-800 bg-black/35 px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-400">Inside the AI Trainer</p>
          <h2 className="mt-4 text-3xl font-bold sm:text-4xl">See what you receive after creating your account</h2>
          <p className="mt-5 text-lg leading-8 text-neutral-300">The app connects your dog’s details, today’s training, and the results you log into one continuing workflow.</p>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {previews.map((preview) => (
            <article key={preview.step} className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-[0_18px_44px_rgba(0,0,0,0.22)]">
              <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-400 font-bold text-black">{preview.step}</span><p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">{preview.eyebrow}</p></div>
              <h3 className="mt-5 text-2xl font-bold text-white">{preview.title}</h3>
              <p className="mt-3 min-h-20 text-sm leading-7 text-neutral-300">{preview.body}</p>
              <div className="mt-5">{preview.panel}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

type Plan = {
  id: string;
  content: string;
  createdAt: string;
};

type Session = {
  date: string;
  duration: string;
  focus: string;
  wins: string;
  issues: string;
};

const parsePlanSections = (content: string) => {
  const sections: Array<{ label: string; content: string }> = [];
  let label = "Training Plan";
  let lines: string[] = [];

  const addSection = () => {
    const value = lines.join("\n").trim();
    if (value) sections.push({ label, content: value });
  };

  content.split(/\r?\n/).forEach((line) => {
    const candidate = line.trim();
    if (/^[A-Z][A-Z ]+$/.test(candidate)) {
      addSection();
      label = candidate
        .toLowerCase()
        .replace(/\b\w/g, (character) => character.toUpperCase());
      lines = [];
      return;
    }
    lines.push(line);
  });

  addSection();
  return sections;
};

export default function CustomerPlanDetailView({
  dogName,
  plan,
  loading,
  completedSession,
  coachReview,
  onBack,
  onContinue,
  onGenerate,
}: {
  dogName: string;
  plan: Plan | null;
  loading: boolean;
  completedSession: Session | null;
  coachReview: string | null;
  onBack: () => void;
  onContinue: () => void;
  onGenerate: () => void;
}) {
  const sections = plan ? parsePlanSections(plan.content) : [];
  const completed = Boolean(completedSession);

  return (
    <section className="mx-auto max-w-3xl px-4 pb-12 pt-6 sm:px-6 sm:pt-10">
      <header className="flex items-start justify-between gap-3 border-b border-neutral-800 pb-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Training Plan</p>
          <h2 className="mt-2 truncate text-2xl font-bold text-white">{dogName}</h2>
          {plan && <p className="mt-2 text-sm text-neutral-400">Generated {new Date(plan.createdAt).toLocaleString()}</p>}
        </div>
        <button type="button" onClick={onBack} className="min-h-11 shrink-0 rounded-lg border border-neutral-700 px-4 py-2 text-sm font-semibold text-neutral-100 hover:bg-neutral-900">
          Back to Trainer
        </button>
      </header>

      {loading ? (
        <p className="mt-6 rounded-xl border border-neutral-800 bg-neutral-950 p-5 text-sm text-neutral-300">Loading your saved training plan...</p>
      ) : !plan ? (
        <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-950 p-5 sm:p-6">
          <h3 className="text-xl font-bold text-white">No training plan has been generated yet.</h3>
          <p className="mt-3 text-sm leading-6 text-neutral-400">Generate your first structured session to begin training.</p>
          <button type="button" onClick={onGenerate} className="mt-5 min-h-12 w-full rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold uppercase tracking-[0.08em] text-black sm:w-auto">
            Generate First Session
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/25 bg-amber-400/5 p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">Plan Status</p>
              <p className="mt-1 font-semibold text-white">{completed ? "Completed" : "Active session"}</p>
            </div>
            {completed && completedSession?.date && <p className="text-right text-xs text-neutral-400">Completed {completedSession.date}</p>}
          </div>

          {sections.map((section) => (
            <article key={section.label} className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 sm:p-5">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">{section.label}</h3>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-neutral-200">{section.content}</p>
            </article>
          ))}

          {completed && completedSession && (
            <article className="rounded-xl border border-emerald-500/25 bg-emerald-400/5 p-4 sm:p-5">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">Saved Results</h3>
              <p className="mt-3 text-sm font-semibold text-white">{completedSession.focus || "Training session"}</p>
              {completedSession.duration && <p className="mt-1 text-sm text-neutral-400">Duration: {completedSession.duration}</p>}
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-neutral-200">{completedSession.wins}</p>
              {completedSession.issues && <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-neutral-400">Challenges: {completedSession.issues}</p>}
            </article>
          )}

          {completed && coachReview && (
            <article className="rounded-xl border border-amber-500/25 bg-amber-400/5 p-4 sm:p-5">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">Coach Review</h3>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-neutral-100">{coachReview}</p>
            </article>
          )}

          {!completed && (
            <button type="button" onClick={onContinue} className="min-h-12 w-full rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold uppercase tracking-[0.08em] text-black sm:w-auto">
              Continue Session
            </button>
          )}
        </div>
      )}
    </section>
  );
}

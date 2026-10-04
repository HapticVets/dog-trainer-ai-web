"use client";

type ManualSessionDraft = {
  date: string;
  duration: string;
  focus: string;
  result: string;
  issue: string;
  wins: string;
  issues: string;
};

type CustomerManualSessionLogProps = {
  dogName: string;
  draft: ManualSessionDraft;
  durationOptions: readonly string[];
  focusOptions: readonly string[];
  resultOptions: readonly string[];
  issueOptions: readonly string[];
  saving: boolean;
  onChange: (draft: ManualSessionDraft) => void;
  onSave: () => void;
  onBack: () => void;
};

export default function CustomerManualSessionLog({ dogName, draft, durationOptions, focusOptions, resultOptions, issueOptions, saving, onChange, onSave, onBack }: CustomerManualSessionLogProps) {
  return (
    <section className="mx-auto max-w-2xl px-4 pb-12 pt-6 sm:px-6 sm:pt-10" aria-labelledby="manual-session-title">
      <button type="button" onClick={onBack} className="min-h-10 rounded-lg border border-neutral-700 px-3 py-2 text-sm font-semibold text-neutral-200 hover:bg-neutral-900">Back to Training Home</button>
      <div className="mt-4 rounded-2xl border border-amber-500/25 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black p-5 shadow-[0_18px_46px_rgba(0,0,0,0.28)] sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Independent training</p>
        <h2 id="manual-session-title" className="mt-2 text-3xl font-bold text-white">Log your own session</h2>
        <p className="mt-3 text-sm leading-6 text-neutral-300">Record what you worked on with {dogName}. This session will count toward progress and help inform future training.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-neutral-200">Date<input required type="date" value={draft.date} onChange={(event) => onChange({ ...draft, date: event.target.value })} className="mt-2 min-h-12 w-full rounded-xl border border-neutral-700 bg-black px-3 text-white outline-none focus:ring-2 focus:ring-amber-300" /></label>
          <label className="text-sm font-semibold text-neutral-200">Duration<select value={draft.duration} onChange={(event) => onChange({ ...draft, duration: event.target.value })} className="mt-2 min-h-12 w-full rounded-xl border border-neutral-700 bg-black px-3 text-white outline-none focus:ring-2 focus:ring-amber-300">{durationOptions.map((option) => <option key={option} value={option}>{option} min</option>)}</select></label>
          <label className="text-sm font-semibold text-neutral-200">What did you work on?<select value={draft.focus} onChange={(event) => onChange({ ...draft, focus: event.target.value })} className="mt-2 min-h-12 w-full rounded-xl border border-neutral-700 bg-black px-3 text-white outline-none focus:ring-2 focus:ring-amber-300">{focusOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
          <label className="text-sm font-semibold text-neutral-200">Overall result<select value={draft.result} onChange={(event) => onChange({ ...draft, result: event.target.value })} className="mt-2 min-h-12 w-full rounded-xl border border-neutral-700 bg-black px-3 text-white outline-none focus:ring-2 focus:ring-amber-300">{resultOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
          <label className="text-sm font-semibold text-neutral-200 sm:col-span-2">Primary challenge<select value={draft.issue} onChange={(event) => onChange({ ...draft, issue: event.target.value })} className="mt-2 min-h-12 w-full rounded-xl border border-neutral-700 bg-black px-3 text-white outline-none focus:ring-2 focus:ring-amber-300">{issueOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
          <label className="text-sm font-semibold text-neutral-200 sm:col-span-2">What went well?<textarea required value={draft.wins} onChange={(event) => onChange({ ...draft, wins: event.target.value })} rows={4} placeholder="Describe improvements, successful repetitions, or anything you noticed." className="mt-2 w-full rounded-xl border border-neutral-700 bg-black px-3 py-3 text-white placeholder:text-neutral-500 outline-none focus:ring-2 focus:ring-amber-300" /></label>
          <label className="text-sm font-semibold text-neutral-200 sm:col-span-2">Additional challenge notes <span className="font-normal text-neutral-500">(optional)</span><textarea value={draft.issues} onChange={(event) => onChange({ ...draft, issues: event.target.value })} rows={3} placeholder="Add context about anything that was difficult or needs more work." className="mt-2 w-full rounded-xl border border-neutral-700 bg-black px-3 py-3 text-white placeholder:text-neutral-500 outline-none focus:ring-2 focus:ring-amber-300" /></label>
        </div>

        <button type="button" onClick={onSave} disabled={saving || !draft.date.trim() || !draft.wins.trim()} className="mt-6 min-h-14 w-full rounded-xl bg-amber-400 px-5 py-4 text-sm font-bold uppercase tracking-[0.08em] text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50">
          {saving ? "Saving Session..." : "Save Session Log"}
        </button>
      </div>
    </section>
  );
}

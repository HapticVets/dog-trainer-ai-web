"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

type CustomerSessionWorkspaceProps = {
  dogName: string;
  photoUrl?: string | null;
  sessionFocus?: string | null;
  plan: string;
  loading: boolean;
  onBack: () => void;
  onTalkToCoach: () => void;
  onSaveSession: (result: { rating: "Easy" | "About Right" | "Challenging"; wins: string; difficult: string; notes: string; completedSteps: string[] }) => Promise<string | null>;
};

const getSection = (plan: string, heading: string) => {
  const lines = plan.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === heading);
  if (start < 0) return "";
  const content: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (/^[A-Z][A-Z ]+$/.test(line.trim())) break;
    content.push(line);
  }
  return content.join("\n").trim();
};

const getListItems = (value: string) => {
  const items = value
    .split(/\r?\n|(?:^|\s)[•*-]\s+/)
    .map((item) => item.trim().replace(/^[•*-]\s*/, ""))
    .filter(Boolean);
  return items.length ? items : [value.trim()].filter(Boolean);
};

export default function CustomerSessionWorkspace({ dogName, photoUrl, sessionFocus, plan, loading, onBack, onTalkToCoach, onSaveSession }: CustomerSessionWorkspaceProps) {
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rating, setRating] = useState<"Easy" | "About Right" | "Challenging">("About Right");
  const [wins, setWins] = useState("");
  const [difficult, setDifficult] = useState("");
  const [notes, setNotes] = useState("");
  const [review, setReview] = useState<string | null>(null);
  const resultsRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!showResults) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
    const frame = window.requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    return () => window.cancelAnimationFrame(frame);
  }, [showResults]);

  const session = useMemo(() => {
    const rawSteps = getListItems(getSection(plan, "WORKING REPS")).slice(0, 4);
    return {
      goal: getSection(plan, "SESSION OBJECTIVE") || "Follow the current training focus.",
      setup: getListItems(getSection(plan, "SETUP") || "Use the equipment and calm environment noted in your case file."),
      success: getSection(plan, "SUCCESS CRITERIA") || "End on clear, calm repetitions.",
      finish: getSection(plan, "WHEN TO STOP") || "Finish while your dog is successful and composed.",
      steps: rawSteps.length ? rawSteps : ["Engagement warm-up", "Complete the planned working reps", "Calm finish"],
    };
  }, [plan]);

  const completeSession = async () => {
    setSaving(true);
    try {
      setReview(await onSaveSession({ rating, wins, difficult, notes, completedSteps: completedSteps.map((step) => step.replace(/^\d+-/, "")) }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section ref={resultsRef} className="mx-auto w-full max-w-2xl px-3 pb-10 pt-4 sm:px-6 sm:pb-12 sm:pt-8">
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 shadow-[0_18px_46px_rgba(0,0,0,0.24)] sm:p-7">
        <header className="flex items-start justify-between gap-3 border-b border-neutral-800 pb-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-amber-500/30 bg-neutral-900 text-lg font-bold text-amber-300">
              {photoUrl ? <Image src={photoUrl} alt={`${dogName} dog profile`} fill sizes="56px" className="object-cover" /> : dogName.slice(0, 1).toUpperCase() || "K9"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">{showResults ? "Session Complete" : "Today’s Session"}</p>
              <h2 className="mt-1 truncate text-xl font-bold text-white sm:text-2xl">{showResults ? "Log Your Session" : dogName}</h2>
              {!showResults && sessionFocus && <p className="mt-1 truncate text-xs font-semibold text-amber-200">Today&apos;s Focus: {sessionFocus}</p>}
            </div>
          </div>
          <button type="button" onClick={onBack} className="min-h-11 shrink-0 rounded-lg border border-neutral-700 px-3 py-2 text-sm font-semibold text-neutral-100 hover:bg-neutral-900">← Back to Trainer</button>
        </header>

        {review ? <div className="mt-6"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Coach Review</p><div className="mt-3 whitespace-pre-wrap rounded-xl border border-amber-500/25 bg-amber-400/5 p-4 text-sm leading-6 text-neutral-100 sm:p-5">{review}</div><div className="mt-5 grid grid-cols-2 gap-3"><button type="button" onClick={onBack} className="min-h-11 rounded-xl bg-amber-400 px-4 py-3 font-semibold text-black">Done</button><button type="button" onClick={onTalkToCoach} className="min-h-11 rounded-xl border border-neutral-700 px-4 py-3 font-semibold text-neutral-100">Talk to Coach</button></div></div> : loading ? <p className="mt-6 rounded-xl border border-amber-500/20 bg-amber-400/5 p-5 text-sm text-amber-100">Building today&apos;s structured session...</p> : !plan ? <p className="mt-6 rounded-xl border border-neutral-800 bg-black/30 p-5 text-sm text-neutral-300">Your session could not be prepared. Return home and try again.</p> : showResults ? <div className="mt-6 space-y-4"><p className="text-sm leading-6 text-neutral-300">Record what you saw so your Coach can give the next practical direction.</p><label className="block text-sm font-semibold text-neutral-200">How did this session feel?<select value={rating} onChange={(event) => setRating(event.target.value as typeof rating)} className="mt-2 min-h-11 w-full rounded-lg border border-neutral-700 bg-black px-3 text-white"><option>Easy</option><option>About Right</option><option>Challenging</option></select></label><label className="block text-sm font-semibold text-neutral-200">What went well?<textarea value={wins} onChange={(event) => setWins(event.target.value)} rows={3} className="mt-2 w-full rounded-lg border border-neutral-700 bg-black p-3 text-white" /></label><label className="block text-sm font-semibold text-neutral-200">What was difficult?<textarea value={difficult} onChange={(event) => setDifficult(event.target.value)} rows={3} className="mt-2 w-full rounded-lg border border-neutral-700 bg-black p-3 text-white" /></label><label className="block text-sm font-semibold text-neutral-200">Anything else to note?<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className="mt-2 w-full rounded-lg border border-neutral-700 bg-black p-3 text-white" /></label><button type="button" onClick={() => void completeSession()} disabled={saving} className="min-h-12 w-full rounded-xl bg-amber-400 px-5 py-3 font-semibold text-black disabled:opacity-60">{saving ? "Saving results..." : "Save Results"}</button></div> : <div className="mt-6 space-y-5"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Goal</p><p className="mt-2 text-base leading-7 text-white">{session.goal}</p></div><div className="rounded-xl border border-neutral-800 bg-black/30 p-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">What You Need</p><ul className="mt-3 space-y-2 text-sm leading-6 text-neutral-300">{session.setup.map((item) => <li key={item} className="flex gap-2"><span className="text-amber-300" aria-hidden="true">•</span><span>{item}</span></li>)}</ul></div><ol className="space-y-3">{session.steps.map((step, index) => { const key = `${index}-${step}`; const checked = completedSteps.includes(key); return <li key={key} className="rounded-xl border border-neutral-800 bg-black/30 p-4"><label className="flex cursor-pointer items-start gap-3"><input type="checkbox" checked={checked} onChange={() => setCompletedSteps((current) => checked ? current.filter((item) => item !== key) : [...current, key])} className="mt-1 h-5 w-5 shrink-0 accent-amber-400" /><span><span className="block text-sm font-bold text-white">Step {index + 1}</span><span className="mt-1 block text-sm leading-6 text-neutral-300">{step}</span></span></label></li>; })}</ol><div className="rounded-xl border border-amber-500/20 bg-amber-400/5 p-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">What to watch for</p><p className="mt-2 text-sm leading-6 text-neutral-200">{session.success}</p><p className="mt-3 text-sm leading-6 text-neutral-400">Finish: {session.finish}</p></div><button type="button" onClick={() => setShowResults(true)} className="min-h-14 w-full rounded-xl bg-amber-400 px-5 py-4 text-sm font-bold uppercase tracking-[0.08em] text-black hover:bg-amber-300">Complete Session</button><button type="button" onClick={onTalkToCoach} className="min-h-11 w-full rounded-xl border border-neutral-700 px-4 py-3 text-sm font-semibold text-neutral-100 hover:bg-neutral-900">Need Help? Talk to Coach</button></div>}
      </div>
    </section>
  );
}

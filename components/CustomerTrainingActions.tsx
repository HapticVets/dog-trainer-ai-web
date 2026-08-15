"use client";

import Image from "next/image";

type CustomerTrainingActionsProps = {
  dogName: string;
  photoUrl?: string | null;
  trainerFocusActive: boolean;
  onManageDog: () => void;
  onGenerateSession: () => void;
  onViewProgress: () => void;
  onTalkToCoach: () => void;
};

export default function CustomerTrainingActions({
  dogName,
  photoUrl,
  trainerFocusActive,
  onManageDog,
  onGenerateSession,
  onViewProgress,
  onTalkToCoach,
}: CustomerTrainingActionsProps) {
  return (
    <section className="mx-auto max-w-xl px-4 pb-10 pt-6 sm:px-6 sm:pt-10" aria-label="Training home">
      <div className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black p-5 shadow-[0_18px_46px_rgba(0,0,0,0.28)] sm:p-7">
        <div className="flex items-center gap-4">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-amber-500/30 bg-neutral-900 text-2xl font-bold text-amber-300">
            {photoUrl ? <Image src={photoUrl} alt={`${dogName} dog profile`} fill sizes="80px" className="object-cover" /> : dogName.slice(0, 1).toUpperCase() || "K9"}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Active dog</p>
            <h2 className="mt-1 truncate text-3xl font-bold text-white">{dogName}</h2>
            {trainerFocusActive && <span className="mt-2 inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-200">Trainer Focus Active</span>}
            <button type="button" onClick={onManageDog} className="mt-2 block text-xs font-semibold text-amber-300 underline underline-offset-4 hover:text-amber-200">Manage dog</button>
          </div>
        </div>
        <button type="button" onClick={onGenerateSession} className="mt-7 min-h-14 w-full rounded-xl bg-amber-400 px-5 py-4 text-sm font-bold uppercase tracking-[0.08em] text-black transition hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:ring-offset-2 focus:ring-offset-neutral-950">
          Generate Today&apos;s Session
        </button>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <button type="button" onClick={onViewProgress} className="min-h-12 rounded-xl border border-neutral-700 bg-black/30 px-3 py-3 text-sm font-semibold text-neutral-100 hover:border-amber-500/50 hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-300">View Progress</button>
          <button type="button" onClick={onTalkToCoach} className="min-h-12 rounded-xl border border-neutral-700 bg-black/30 px-3 py-3 text-sm font-semibold text-neutral-100 hover:border-amber-500/50 hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-300">Talk to Coach</button>
        </div>
      </div>
    </section>
  );
}

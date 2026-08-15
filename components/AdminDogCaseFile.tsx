"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useEffectEvent, useState } from "react";
import { dogRecordTypeLabel, type AdminDogProfile } from "@/lib/adminDogs";
import { hydrateDogCaseFile } from "@/lib/dogCaseFile";

type AdminNote = {
  id: string;
  note: string;
  created_at: string;
  creatorName: string;
};

type TrainingSession = {
  id: string;
  session_date: string | null;
  duration: number | null;
  focus: string | null;
  wins: string | null;
  issues: string | null;
  main_goal: string | null;
  created_at: string;
};

type CaseFileResponse = {
  profile: AdminDogProfile;
  sessions: TrainingSession[];
  sessionHistoryAvailable: boolean;
  adminSessions: AdminTrainingSession[];
};

type AdminTrainingSession = {
  id: string;
  session_number: number;
  title: string;
  status: "draft" | "planned" | "completed";
  objectives: string;
  training_plan: string;
  trainer_focus: string | null;
  progression_goal: string | null;
  what_went_well: string | null;
  challenges: string | null;
  recovery_notes: string | null;
  homework: string | null;
  additional_notes: string | null;
  outcome: string | null;
  created_at: string;
  completed_at: string | null;
};

type SessionDraft = Pick<AdminTrainingSession, "session_number" | "title" | "objectives" | "training_plan" | "trainer_focus" | "progression_goal">;

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
    : "Date unavailable";

const DogImage = ({ profile, size = "large" }: { profile: AdminDogProfile; size?: "large" | "small" }) => {
  const sizeClasses = size === "large" ? "h-24 w-24 sm:h-32 sm:w-32" : "h-16 w-16";
  return (
    <div className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-amber-400/30 bg-gradient-to-br from-neutral-800 to-black text-3xl font-bold text-amber-200 ${sizeClasses}`}>
      {profile.profile_image_url ? (
        <Image src={profile.profile_image_url} alt={`${profile.name} profile photo`} fill sizes={size === "large" ? "128px" : "64px"} className="object-cover" />
      ) : (
        profile.name.slice(0, 1).toUpperCase()
      )}
    </div>
  );
};

export default function AdminDogCaseFile({ dogId }: { dogId: string }) {
  const [caseFile, setCaseFile] = useState<CaseFileResponse | null>(null);
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [notePendingDeletion, setNotePendingDeletion] = useState<AdminNote | null>(null);
  const [deletingNote, setDeletingNote] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [draft, setDraft] = useState<SessionDraft | null>(null);
  const [generatingSession, setGeneratingSession] = useState(false);
  const [savingSession, setSavingSession] = useState(false);
  const [sessionToComplete, setSessionToComplete] = useState<AdminTrainingSession | null>(null);
  const [completingSession, setCompletingSession] = useState(false);

  const loadCaseFile = useEffectEvent(async () => {
    setLoading(true);
    setError("");
    try {
      const [caseResponse, notesResponse] = await Promise.all([
        fetch(`/api/admin/dogs/${encodeURIComponent(dogId)}`, { cache: "no-store" }),
        fetch(`/api/admin/dogs/${encodeURIComponent(dogId)}/notes`, { cache: "no-store" }),
      ]);
      const caseData = (await caseResponse.json()) as CaseFileResponse & { error?: string };
      const notesData = (await notesResponse.json()) as { notes?: AdminNote[]; error?: string };
      if (!caseResponse.ok) throw new Error(caseData.error || "Unable to load the internal dog record.");
      if (!notesResponse.ok) throw new Error(notesData.error || "Unable to load internal notes.");

      setCaseFile(caseData);
      setNotes(notesData.notes ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load the internal dog record.");
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    void loadCaseFile();
  }, [dogId]);

  const addNote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const note = noteText.trim();
    if (!note) return;

    setSavingNote(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/dogs/${encodeURIComponent(dogId)}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      const data = (await response.json()) as { note?: AdminNote; error?: string };
      if (!response.ok || !data.note) throw new Error(data.error || "Unable to save internal note.");

      setNotes((current) => [data.note as AdminNote, ...current]);
      setNoteText("");
      setNotice("Internal note added.");
    } catch (noteError) {
      setError(noteError instanceof Error ? noteError.message : "Unable to save internal note.");
    } finally {
      setSavingNote(false);
    }
  };

  const deleteNote = async () => {
    if (!notePendingDeletion) return;

    setDeletingNote(true);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/dogs/${encodeURIComponent(dogId)}/notes?noteId=${encodeURIComponent(notePendingDeletion.id)}`,
        { method: "DELETE" },
      );
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Unable to delete internal note.");

      setNotes((current) => current.filter((note) => note.id !== notePendingDeletion.id));
      setNotePendingDeletion(null);
      setNotice("Internal note deleted.");
    } catch (noteError) {
      setError(noteError instanceof Error ? noteError.message : "Unable to delete internal note.");
    } finally {
      setDeletingNote(false);
    }
  };

  const generateSession = async () => {
    setGeneratingSession(true); setError("");
    try {
      const response = await fetch(`/api/admin/dogs/${encodeURIComponent(dogId)}/sessions/generate`, { method: "POST" });
      const data = await response.json() as { draft?: SessionDraft; error?: string };
      if (!response.ok || !data.draft) throw new Error(data.error || "Unable to generate the next training session.");
      setDraft(data.draft); setNotice("Session draft generated. Review and save it when ready.");
    } catch (sessionError) { setError(sessionError instanceof Error ? sessionError.message : "Unable to generate the next training session."); }
    finally { setGeneratingSession(false); }
  };

  const saveSession = async () => {
    if (!draft) return;
    setSavingSession(true); setError("");
    try {
      const response = await fetch(`/api/admin/dogs/${encodeURIComponent(dogId)}/sessions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
      const data = await response.json() as { session?: AdminTrainingSession; error?: string };
      if (!response.ok || !data.session) throw new Error(data.error || "Unable to save the training session.");
      setCaseFile((current) => current ? { ...current, adminSessions: [data.session as AdminTrainingSession, ...current.adminSessions] } : current);
      setDraft(null); setNotice("Training session saved.");
    } catch (sessionError) { setError(sessionError instanceof Error ? sessionError.message : "Unable to save the training session."); }
    finally { setSavingSession(false); }
  };

  const completeSession = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!sessionToComplete) return;
    const form = new FormData(event.currentTarget);
    setCompletingSession(true); setError("");
    try {
      const body = Object.fromEntries(form.entries());
      const response = await fetch(`/api/admin/dogs/${encodeURIComponent(dogId)}/sessions/${encodeURIComponent(sessionToComplete.id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json() as { session?: AdminTrainingSession; error?: string };
      if (!response.ok || !data.session) throw new Error(data.error || "Unable to complete the training session.");
      setCaseFile((current) => current ? { ...current, adminSessions: current.adminSessions.map((session) => session.id === data.session?.id ? data.session as AdminTrainingSession : session) } : current);
      setSessionToComplete(null); setNotice("Training session completed.");
    } catch (sessionError) { setError(sessionError instanceof Error ? sessionError.message : "Unable to complete the training session."); }
    finally { setCompletingSession(false); }
  };

  if (loading) return <p className="mx-auto max-w-7xl px-4 py-16 text-center text-neutral-400">Loading internal case file...</p>;
  if (!caseFile) return <p className="mx-auto max-w-7xl px-4 py-16 text-center text-red-200" role="alert">{error || "Case file unavailable."}</p>;

  const { profile, sessions, sessionHistoryAvailable, adminSessions } = caseFile;
  const currentPlan = adminSessions.find((session) => session.status !== "completed") ?? null;
  const dog = hydrateDogCaseFile(profile);
  const detailItems = [
    ["Breed", dog.breed],
    ["Age", dog.age],
    ["Sex", dog.sex !== "Not set" ? dog.sex : ""],
    ["Training level", dog.skillLevel],
  ].filter(([, value]) => Boolean(value));

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <Link href="/admin" className="inline-flex rounded-lg border border-neutral-700 px-3 py-2 text-sm font-semibold text-neutral-200 transition hover:bg-neutral-900">Back to Admin</Link>
      {notice && <p className="mt-5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100" role="status">{notice}</p>}
      {error && <p className="mt-5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100" role="alert">{error}</p>}

      <header className="mt-5 rounded-2xl border border-amber-400/20 bg-gradient-to-br from-neutral-950 via-neutral-950 to-amber-950/20 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.3)] sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <DogImage profile={profile} />
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-300">Internal digital case file</p>
            <div className="mt-2 flex flex-wrap items-center gap-3"><h1 className="text-3xl font-bold text-white sm:text-4xl">{profile.name}</h1><span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-amber-200">{dogRecordTypeLabel[profile.record_type]}</span></div>
            <p className="mt-3 text-sm text-neutral-300">{detailItems.map(([label, value]) => `${label}: ${value}`).join(" · ") || "Profile details not set"}</p>
            {profile.main_goal?.trim() && <p className="mt-3 text-sm text-amber-100">Training focus: {profile.main_goal}</p>}
          </div>
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Overview</p><h2 className="mt-2 text-2xl font-bold text-white">Training profile</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{detailItems.map(([label, value]) => <div key={label as string} className="rounded-xl border border-neutral-800 bg-black/30 p-3"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">{label}</p><p className="mt-1 text-sm text-neutral-100">{value}</p></div>)}</div></section>

          <section className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Current Training Plan</p><div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h2 className="text-2xl font-bold text-white">Next session</h2><button type="button" onClick={() => void generateSession()} disabled={generatingSession} className="min-h-11 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold text-black disabled:opacity-60">{generatingSession ? "Generating..." : draft ? "Regenerate" : "Generate Next Session"}</button></div>{currentPlan && !draft && <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4"><p className="font-bold text-white">Session {currentPlan.session_number} - {currentPlan.title}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-200">{currentPlan.training_plan}</p><button type="button" onClick={() => setSessionToComplete(currentPlan)} className="mt-4 min-h-11 rounded-lg border border-emerald-400/40 px-4 py-2 text-sm font-bold text-emerald-100 hover:bg-emerald-400/10">Complete Session</button></div>}{draft && <div className="mt-5 space-y-3"><label className="block text-sm font-semibold text-neutral-200">Title<input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className="mt-2 w-full rounded-lg border border-neutral-700 bg-black/40 px-3 py-2.5 text-white" /></label><label className="block text-sm font-semibold text-neutral-200">Objectives<textarea rows={3} value={draft.objectives} onChange={(event) => setDraft({ ...draft, objectives: event.target.value })} className="mt-2 w-full rounded-lg border border-neutral-700 bg-black/40 px-3 py-2.5 text-white" /></label><label className="block text-sm font-semibold text-neutral-200">Training Plan<textarea rows={8} value={draft.training_plan} onChange={(event) => setDraft({ ...draft, training_plan: event.target.value })} className="mt-2 w-full rounded-lg border border-neutral-700 bg-black/40 px-3 py-2.5 text-white" /></label><label className="block text-sm font-semibold text-neutral-200">Trainer Focus<textarea rows={2} value={draft.trainer_focus ?? ""} onChange={(event) => setDraft({ ...draft, trainer_focus: event.target.value })} className="mt-2 w-full rounded-lg border border-neutral-700 bg-black/40 px-3 py-2.5 text-white" /></label><label className="block text-sm font-semibold text-neutral-200">Progression Goal<textarea rows={2} value={draft.progression_goal ?? ""} onChange={(event) => setDraft({ ...draft, progression_goal: event.target.value })} className="mt-2 w-full rounded-lg border border-neutral-700 bg-black/40 px-3 py-2.5 text-white" /></label><button type="button" onClick={() => void saveSession()} disabled={savingSession} className="min-h-11 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold text-black disabled:opacity-60">{savingSession ? "Saving..." : "Save Session"}</button></div>}</section>

          <section className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Trainer Notes</p><h2 className="mt-2 text-2xl font-bold text-white">Internal observations</h2><form onSubmit={addNote} className="mt-5"><label className="text-sm font-semibold text-neutral-200">Add Note<textarea value={noteText} onChange={(event) => setNoteText(event.target.value)} rows={4} placeholder="Record a trainer observation, client update, or training note..." className="mt-2 w-full rounded-xl border border-neutral-700 bg-black/40 px-3 py-3 text-white placeholder:text-neutral-500 outline-none focus:border-amber-400" /></label><button type="submit" disabled={savingNote || !noteText.trim()} className="mt-3 min-h-11 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60">{savingNote ? "Saving..." : "Add Note"}</button></form><div className="mt-6 space-y-3">{notes.length === 0 ? <p className="rounded-xl border border-dashed border-neutral-800 p-4 text-sm text-neutral-500">No internal notes yet.</p> : notes.map((note) => <article key={note.id} className="rounded-xl border border-neutral-800 bg-black/30 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="whitespace-pre-wrap text-sm leading-6 text-neutral-100">{note.note}</p><p className="mt-3 text-xs text-neutral-500">{note.creatorName} · {formatDate(note.created_at)}</p></div><button type="button" onClick={() => setNotePendingDeletion(note)} className="self-start rounded border border-red-500/30 px-3 py-2 text-xs font-bold text-red-200 transition hover:bg-red-500/10">Delete</button></div></article>)}</div></section>

          <section className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Training History</p><h2 className="mt-2 text-2xl font-bold text-white">Logged sessions</h2>{!sessionHistoryAvailable ? <p className="mt-4 text-sm text-neutral-500">Training history will be available after the Phase 2 database migration is applied.</p> : sessions.length === 0 ? <p className="mt-4 text-sm text-neutral-500">No sessions are linked to this case file yet.</p> : <div className="mt-5 space-y-3">{sessions.map((session) => <article key={session.id} className="rounded-xl border border-neutral-800 bg-black/30 p-4"><div className="flex flex-wrap justify-between gap-2"><p className="font-bold text-white">{session.focus || session.main_goal || "Training session"}</p><p className="text-xs text-neutral-500">{formatDate(session.session_date || session.created_at)}</p></div>{session.duration && <p className="mt-2 text-sm text-amber-100">{session.duration} minutes</p>}{session.wins && <p className="mt-3 text-sm text-neutral-200">Wins: {session.wins}</p>}{session.issues && <p className="mt-2 text-sm text-neutral-400">Challenges: {session.issues}</p>}</article>)}</div>}</section>

          <section className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Internal Training History</p><h2 className="mt-2 text-2xl font-bold text-white">Completed sessions</h2>{adminSessions.filter((session) => session.status === "completed").length === 0 ? <p className="mt-4 text-sm text-neutral-500">Completed internal sessions will appear here.</p> : <div className="mt-5 space-y-3">{adminSessions.filter((session) => session.status === "completed").map((session) => <details key={session.id} className="rounded-xl border border-neutral-800 bg-black/30 p-4"><summary className="cursor-pointer font-bold text-white">Session {session.session_number} - {session.title}<span className="ml-2 text-xs font-normal text-amber-100">{session.outcome?.replace("_", " ") || "Completed"}</span></summary><div className="mt-4 space-y-3 text-sm leading-6 text-neutral-200"><p><strong>Objectives:</strong> {session.objectives}</p><p className="whitespace-pre-wrap"><strong>Plan:</strong>{"\n"}{session.training_plan}</p><p><strong>Trainer focus:</strong> {session.trainer_focus || "Not recorded"}</p><p><strong>Progression goal:</strong> {session.progression_goal || "Not recorded"}</p><p><strong>Went well:</strong> {session.what_went_well || "Not recorded"}</p><p><strong>Challenges:</strong> {session.challenges || "Not recorded"}</p><p><strong>Recovery:</strong> {session.recovery_notes || "Not recorded"}</p><p><strong>Homework:</strong> {session.homework || "Not recorded"}</p></div></details>)}</div>}</section>
        </div>

        <aside className="space-y-6"><section className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-5"><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Media</p><h2 className="mt-2 text-xl font-bold text-white">Profile image</h2><div className="mt-4"><DogImage profile={profile} size="small" /></div><p className="mt-4 text-sm leading-6 text-neutral-400">Additional internal media can be added here in a future phase.</p></section><section className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-5"><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Record Details</p><h2 className="mt-2 text-xl font-bold text-white">Administration</h2><dl className="mt-4 space-y-3 text-sm"><div><dt className="text-neutral-500">Record type</dt><dd className="mt-1 text-neutral-100">{dogRecordTypeLabel[profile.record_type]}</dd></div><div><dt className="text-neutral-500">Created</dt><dd className="mt-1 text-neutral-100">{formatDate(profile.created_at)}</dd></div>{profile.record_type === "client" && <><div><dt className="text-neutral-500">Client owner</dt><dd className="mt-1 text-neutral-100">{profile.client_owner_name || "Not provided"}</dd></div><div><dt className="text-neutral-500">Email</dt><dd className="mt-1 break-all text-neutral-100">{profile.client_owner_email || "Not provided"}</dd></div><div><dt className="text-neutral-500">Phone</dt><dd className="mt-1 text-neutral-100">{profile.client_owner_phone || "Not provided"}</dd></div></>}</dl></section></aside>
      </div>

      {notePendingDeletion && <div className="fixed inset-0 z-[60] flex items-end bg-black/70 p-4 sm:items-center sm:justify-center"><div role="dialog" aria-modal="true" aria-labelledby="delete-note-title" className="w-full max-w-md rounded-2xl border border-red-500/30 bg-neutral-950 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.6)]"><p className="text-xs font-bold uppercase tracking-[0.2em] text-red-300">Permanent action</p><h2 id="delete-note-title" className="mt-3 text-xl font-bold text-white">Delete this note?</h2><p className="mt-3 text-sm leading-6 text-neutral-300">This internal trainer note will be permanently removed.</p><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => setNotePendingDeletion(null)} disabled={deletingNote} className="min-h-11 rounded-lg border border-neutral-700 px-4 py-2.5 text-sm font-bold text-neutral-200">Cancel</button><button type="button" onClick={() => void deleteNote()} disabled={deletingNote} className="min-h-11 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{deletingNote ? "Deleting..." : "Delete Note"}</button></div></div></div>}
      {sessionToComplete && <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/70 p-4"><form onSubmit={completeSession} className="mx-auto my-4 w-full max-w-xl rounded-2xl border border-amber-400/25 bg-neutral-950 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.6)]"><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Complete Session {sessionToComplete.session_number}</p><h2 className="mt-2 text-2xl font-bold text-white">Log training results</h2><div className="mt-5 space-y-3">{[["what_went_well", "What went well?"], ["challenges", "Challenges"], ["recovery_notes", "Recovery / Stability"], ["homework", "Homework"], ["additional_notes", "Additional Trainer Notes"]].map(([name, label]) => <label key={name} className="block text-sm font-semibold text-neutral-200">{label}<textarea name={name} rows={3} className="mt-2 w-full rounded-lg border border-neutral-700 bg-black/40 px-3 py-2.5 text-white" /></label>)}<label className="block text-sm font-semibold text-neutral-200">Outcome<select name="outcome" defaultValue="improving" className="mt-2 w-full rounded-lg border border-neutral-700 bg-black/40 px-3 py-2.5 text-white"><option value="strong">Strong</option><option value="improving">Improving</option><option value="needs_work">Needs Work</option><option value="regression_concern">Regression / Concern</option></select></label></div><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => setSessionToComplete(null)} disabled={completingSession} className="min-h-11 rounded-lg border border-neutral-700 px-4 py-2.5 text-sm font-bold text-neutral-200">Cancel</button><button type="submit" disabled={completingSession} className="min-h-11 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold text-black disabled:opacity-60">{completingSession ? "Completing..." : "Complete Session"}</button></div></form></div>}
    </main>
  );
}

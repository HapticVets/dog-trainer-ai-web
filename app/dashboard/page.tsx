"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  buildDogCaseFileContext,
  hydrateDogCaseFile,
  type DogCaseFile,
} from "@/lib/dogCaseFile";

type DashboardSummary = {
  totalDogs: number;
  totalSessions: number;
  latestDog: {
    id: string;
    name: string;
    goal_type: string;
    main_goal: string;
    reward_type: string;
    skill_level: string;
    custom_notes: string;
    created_at: string;
  } | null;
  latestSession: {
    id: string;
    dog_name: string;
    session_date: string;
    duration: number | null;
    focus: string;
    wins: string;
    issues: string;
    created_at: string;
  } | null;
  latestProgressReport: {
    id: string;
    content: string;
    created_at: string;
  } | null;
  latestNextSessionPlan: {
    id: string;
    content: string;
    created_at: string;
  } | null;
};

type SessionLog = {
  id: string;
  date: string;
  duration: string;
  focus: string;
  wins: string;
  issues: string;
};

type SavedOutput = {
  id: string;
  outputType: "initial_session_plan" | "progress_report" | "next_session_plan";
  content: string;
  createdAt: string;
};

const getPlanSection = (plan: string, heading: string) => {
  const lines = plan.split(/\r?\n/);
  const startIndex = lines.findIndex((line) => line.trim() === heading.toUpperCase());

  if (startIndex === -1) return "";

  const content: string[] = [];
  for (const line of lines.slice(startIndex + 1)) {
    if (/^[A-Z][A-Z ]+$/.test(line.trim())) break;
    content.push(line);
  }

  return content.join("\n").trim();
};

const getPlanDuration = (setup: string) =>
  setup.match(/\b(\d{1,2}\s*(?:minutes?|mins?))\b/i)?.[1] ?? "Not specified";

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  const [dogProfiles, setDogProfiles] = useState<DogCaseFile[]>([]);
  const [selectedDogId, setSelectedDogId] = useState<string>("");
  const [selectedDogName, setSelectedDogName] = useState("");
  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>([]);
  const [savedOutputs, setSavedOutputs] = useState<SavedOutput[]>([]);
  const [progressReport, setProgressReport] = useState("");
  const [reportLoading, setReportLoading] = useState(false);

  const hasActiveDog = Boolean(selectedDogId && selectedDogName.trim());

  const selectedDogProfile = useMemo(
    () => dogProfiles.find((dog) => dog.id === selectedDogId) || null,
    [dogProfiles, selectedDogId]
  );

  const activeTrainingPlan = useMemo(
    () =>
      savedOutputs.find(
        (output) =>
          output.outputType === "initial_session_plan" ||
          output.outputType === "next_session_plan"
      ) ?? null,
    [savedOutputs]
  );
  const activeTrainingPhase = activeTrainingPlan
    ? getPlanSection(activeTrainingPlan.content, "CURRENT PHASE") || "Current plan active"
    : "Case file stage";
  const activePlanObjective = activeTrainingPlan
    ? getPlanSection(activeTrainingPlan.content, "SESSION OBJECTIVE") || "Objective not specified"
    : "Your next mission is ready to begin.";
  const activePlanSessionType = activeTrainingPlan
    ? getPlanSection(activeTrainingPlan.content, "SESSION TYPE") || "Not specified"
    : "Not specified";
  const activePlanDuration = activeTrainingPlan
    ? getPlanDuration(getPlanSection(activeTrainingPlan.content, "SETUP"))
    : "Not specified";

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const res = await fetch("/api/dashboard-summary", {
          method: "GET",
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok) {
          console.error("Failed to load dashboard summary:", data.error);
          setSummary(null);
          return;
        }

        setSummary(data);
      } catch (error) {
        console.error("Failed to load dashboard summary:", error);
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, []);

  useEffect(() => {
    const loadDogProfiles = async () => {
      try {
        const res = await fetch("/api/dog-profile", {
          method: "GET",
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok) {
          console.error("Failed to load dog profiles:", data.error);
          return;
        }

        const mapped: DogCaseFile[] = (data.profiles || []).map((profile: any) =>
          hydrateDogCaseFile(profile)
        );

        setDogProfiles(mapped);

        if (mapped.length > 0) {
          setSelectedDogId(mapped[0].id || "");
          setSelectedDogName(mapped[0].name || "");
        }
      } catch (error) {
        console.error("Failed to load dog profiles:", error);
      }
    };

    loadDogProfiles();
  }, []);

  useEffect(() => {
    if (!selectedDogId || !selectedDogName.trim()) {
      setSessionLogs([]);
      setSavedOutputs([]);
      setProgressReport("");
      return;
    }

    const loadSessionLogs = async () => {
      try {
        const res = await fetch(
          `/api/session-logs?dog_name=${encodeURIComponent(selectedDogName)}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await res.json();

        if (!res.ok) {
          console.error("Failed to load session logs:", data.error);
          setSessionLogs([]);
          return;
        }

        const mappedLogs: SessionLog[] = (data.logs || []).map((log: any) => ({
          id: log.id,
          date: log.session_date ?? "",
          duration:
            typeof log.duration === "number" && !Number.isNaN(log.duration)
              ? `${log.duration} min`
              : "",
          focus: log.focus ?? "",
          wins: log.wins ?? "",
          issues: log.issues ?? "",
        }));

        setSessionLogs(mappedLogs);
      } catch (error) {
        console.error("Failed to load session logs:", error);
        setSessionLogs([]);
      }
    };

    const loadOutputs = async () => {
      try {
        const res = await fetch(
          `/api/dog-outputs?dog_profile_id=${encodeURIComponent(selectedDogId)}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await res.json();

        if (!res.ok) {
          console.error("Failed to load dog outputs:", data.error);
          setSavedOutputs([]);
          setProgressReport("");
          return;
        }

        const mappedOutputs: SavedOutput[] = (data.outputs || []).map((output: any) => ({
          id: output.id,
          outputType: output.output_type,
          content: output.content,
          createdAt: output.created_at,
        }));

        setSavedOutputs(mappedOutputs);

        const latestProgress = mappedOutputs.find(
          (output) => output.outputType === "progress_report"
        );

        setProgressReport(latestProgress?.content ?? "");
      } catch (error) {
        console.error("Failed to load dog outputs:", error);
        setSavedOutputs([]);
        setProgressReport("");
      }
    };

    loadSessionLogs();
    loadOutputs();
  }, [selectedDogId, selectedDogName]);

  const handleSelectDog = (id: string) => {
    setSelectedDogId(id);
    const found = dogProfiles.find((dog) => dog.id === id);

    if (found) {
      setSelectedDogName(found.name);
      setProgressReport("");
    } else {
      setSelectedDogName("");
      setProgressReport("");
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedDogId || !selectedDogName.trim()) {
      alert("Select a saved dog first.");
      return;
    }

    if (reportLoading) return;

    if (sessionLogs.length === 0) {
      alert("Log at least one session before generating a progress report.");
      return;
    }

    setReportLoading(true);

    const selectedDog = dogProfiles.find((dog) => dog.id === selectedDogId);

    const sessionSummary = sessionLogs
      .map(
        (log, index) =>
          `Session ${index + 1}
Date: ${log.date}
Duration: ${log.duration || "not provided"}
Focus: ${log.focus}
Wins: ${log.wins}
Issues: ${log.issues}`
      )
      .join("\n\n");

    const reportPrompt = `Generate a structured dog training progress report using the sessions below.

Use this exact format:

CURRENT STATE
PROGRESS MADE
RECURRING PROBLEMS
TRAINING PRIORITIES
NEXT SESSION PLAN

Be direct, structured, and trainer-level.

${selectedDog ? buildDogCaseFileContext(selectedDog) : "No case file loaded."}

SESSION LOGS:
${sessionSummary}`;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: reportPrompt,
            },
          ],
          dogProfile: selectedDog,
          sessionLogs: sessionLogs.slice(0, 10),
        }),
      });

      const data = await res.json();

      const outputText = !res.ok
        ? data.reply ||
          data.error ||
          "Unable to generate progress report right now."
        : data.reply || "No progress report generated.";

      setProgressReport(outputText);

      const saveRes = await fetch("/api/dog-outputs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dogProfileId: selectedDogId,
          outputType: "progress_report",
          content: outputText,
        }),
      });

      const saveData = await saveRes.json();

      if (saveRes.ok) {
        const saved: SavedOutput = {
          id: saveData.output.id,
          outputType: saveData.output.output_type,
          content: saveData.output.content,
          createdAt: saveData.output.created_at,
        };

        setSavedOutputs((prev) => [saved, ...prev]);
      }
    } catch (error) {
      console.error("Progress report error:", error);
      setProgressReport("Error generating progress report.");
    } finally {
      setReportLoading(false);
    }
  };

  const savedProgressReports = savedOutputs.filter(
    (output) => output.outputType === "progress_report"
  );

  const handleManageSubscription = async () => {
    if (portalLoading) return;

    setPortalLoading(true);

    try {
      const res = await fetch("/api/billing-portal", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok || !data?.url) {
        alert(data?.error || "Unable to open subscription management right now.");
        return;
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("Billing portal error:", error);
      alert("Unable to open subscription management right now.");
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="border-b border-neutral-800">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
                Patriot K9 Command
              </p>
              <h1 className="mt-4 text-4xl font-bold md:text-6xl leading-tight">
                Patriot K9 Command Center
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-neutral-300">
                Monitor your dog&apos;s training progress, active objectives, completed missions, and next steps.
              </p>
            </div>

            <div className="flex flex-col items-start gap-4 md:items-end">
              <div className="rounded border border-amber-500/30 bg-amber-400/10 px-6 py-4 text-sm text-amber-200">
                {hasActiveDog ? (
                  <>
                    <span className="font-semibold">Active Dog:</span> {selectedDogName}
                  </>
                ) : (
                  "No active dog selected"
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                  className="rounded border border-neutral-600 px-6 py-3 font-semibold text-white hover:bg-neutral-900 disabled:opacity-50"
                >
                  {portalLoading ? "Opening..." : "Manage Subscription"}
                </button>

                <Link
                  href="/train"
                  className="rounded bg-amber-400 px-6 py-3 font-semibold text-black"
                >
                  Open Trainer
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Active Dog</p>
            <p className="mt-3 text-2xl font-bold text-white">{selectedDogName || "Not set"}</p>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Training Phase</p>
            <p className="mt-3 text-lg font-bold text-white">{hasActiveDog ? activeTrainingPhase : "Not set"}</p>
          </div>

          <div className="hidden">
            <p className="text-sm text-neutral-400">Latest Dog</p>
            <p className="mt-4 text-3xl font-bold">
              {summary?.latestDog?.name || "None yet"}
            </p>
            {summary?.latestDog && (
              <p className="mt-3 text-neutral-300">
                {summary.latestDog.goal_type} • {summary.latestDog.main_goal}
              </p>
            )}
          </div>

          <div className="hidden">
            <p className="text-sm text-neutral-400">Latest Session Dog</p>
            <p className="mt-4 text-3xl font-bold">
              {summary?.latestSession?.dog_name || "None yet"}
            </p>
            {summary?.latestSession && (
              <p className="mt-3 text-neutral-300">
                {summary.latestSession.session_date || "No date"}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Sessions Completed</p>
            <p className="mt-3 text-3xl font-bold text-white">{sessionLogs.length}</p>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Current Focus</p>
            <p className="mt-3 text-lg font-bold text-white">{selectedDogProfile?.mainGoal || "Not set"}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-2">
          <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-6">
            <h2 className="text-3xl font-bold">Latest Session</h2>

            {!summary?.latestSession && (
              <p className="mt-4 text-neutral-400">No session logs yet.</p>
            )}

            {summary?.latestSession && (
              <div className="mt-6 space-y-4">
                <p className="text-2xl font-semibold">
                  {summary.latestSession.dog_name}
                  {summary.latestSession.duration
                    ? ` • ${summary.latestSession.duration} min`
                    : ""}
                </p>
                <p className="text-neutral-400">
                  Date: {summary.latestSession.session_date || "Not provided"}
                </p>
                <p className="text-neutral-300">
                  <strong>Focus:</strong> {summary.latestSession.focus || "None"}
                </p>
                <p className="text-neutral-300">
                  <strong>Wins:</strong> {summary.latestSession.wins || "None"}
                </p>
                <p className="text-neutral-300">
                  <strong>Issues:</strong> {summary.latestSession.issues || "None"}
                </p>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-amber-500/25 bg-gradient-to-br from-amber-400/10 via-neutral-950 to-neutral-950 p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Next Mission</p>
            <h2 className="mt-3 text-3xl font-bold">{hasActiveDog ? activeTrainingPhase : "Training starts here"}</h2>

            {hasActiveDog && activeTrainingPlan ? (
              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-[0.16em] text-neutral-500">Objective</dt>
                  <dd className="mt-2 text-sm leading-6 text-neutral-200">{activePlanObjective}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.16em] text-neutral-500">Session Type</dt>
                  <dd className="mt-2 text-sm font-semibold text-white">{activePlanSessionType}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.16em] text-neutral-500">Estimated Duration</dt>
                  <dd className="mt-2 text-sm font-semibold text-white">{activePlanDuration}</dd>
                </div>
              </dl>
            ) : (
              <p className="mt-5 max-w-xl text-sm leading-6 text-neutral-300">
                Your next mission is ready to begin.
              </p>
            )}

            <Link
              href="/train"
              className="mt-6 inline-flex w-full justify-center rounded bg-amber-400 px-5 py-3 text-sm font-semibold text-black hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:ring-offset-2 focus:ring-offset-neutral-950 sm:w-auto"
            >
              {activeTrainingPlan ? "Open Trainer" : "Start Training"}
            </Link>
          </div>
        </div>

        <section className="mt-8 rounded-xl border border-neutral-800 bg-neutral-950 p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Dog Training Record</p>
          <h2 className="mt-3 text-3xl font-bold">Active Dog Profile</h2>

          {selectedDogProfile ? (
            <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Dog Name", selectedDogProfile.name],
                ["Breed", selectedDogProfile.breed || "Not set"],
                ["Age", selectedDogProfile.age || "Not set"],
                ["Sex", selectedDogProfile.sex || "Not set"],
                ["Training Goal", selectedDogProfile.mainGoal || "Not set"],
                ["Selected Goals", selectedDogProfile.selectedGoals.join(", ") || "Not set"],
                ["Skill Level", selectedDogProfile.skillLevel || "Not set"],
                [
                  "Environment",
                  selectedDogProfile.whereItHappens.join(", ") ||
                    selectedDogProfile.homeEnvironment ||
                    "Not set",
                ],
                ["Equipment Used", selectedDogProfile.equipmentUsed.join(", ") || "Not set"],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0 rounded-lg border border-neutral-800 bg-black/30 p-4">
                  <dt className="text-xs uppercase tracking-[0.16em] text-neutral-500">{label}</dt>
                  <dd className="mt-2 break-words text-sm font-semibold leading-6 text-white">{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-5 text-sm leading-6 text-neutral-400">
              Select a dog to review its professional training record.
            </p>
          )}
        </section>

        <div className="mt-8 rounded-lg border border-neutral-800 bg-neutral-950 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-3xl font-bold">Progress Report Center</h2>
              <p className="mt-3 text-neutral-400">
                Progress reports are generated from real training sessions. Select a dog with logged sessions before generating a report.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGenerateReport}
              disabled={reportLoading || sessionLogs.length === 0 || !selectedDogId}
              className="rounded bg-amber-400 px-6 py-3 font-semibold text-black disabled:opacity-50"
            >
              {reportLoading
                ? "Generating..."
                : sessionLogs.length === 0
                ? "Log a Session First"
                : "Generate Progress Report"}
            </button>
          </div>

          <div className="mt-6">
            <label className="mb-2 block text-sm text-white">Select Dog</label>
            <select
              value={selectedDogId}
              onChange={(e) => handleSelectDog(e.target.value)}
              className="w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
            >
              <option value="">Select a saved dog</option>
              {dogProfiles.map((dog) => (
                <option key={dog.id} value={dog.id}>
                  {dog.name}
                </option>
              ))}
            </select>
          </div>

          {hasActiveDog && selectedDogProfile && (
            <div className="mt-5 rounded border border-amber-500/30 bg-amber-400/10 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-amber-300">
                Active Dog
              </p>
              <p className="mt-3 text-3xl font-bold">{selectedDogProfile.name}</p>
              <p className="mt-2 text-neutral-300">
                {selectedDogProfile.goalType} • {selectedDogProfile.mainGoal}
              </p>
            </div>
          )}

          {sessionLogs.length === 0 && selectedDogId && (
            <div className="mt-5 rounded-lg border border-amber-500/25 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
              Training reports unlock after your first completed mission. Log training sessions to build your dog&apos;s progress history.
            </div>
          )}

          <div className="mt-6 rounded-lg border border-neutral-800 bg-black p-4">
            {progressReport ? (
              <div className="whitespace-pre-wrap text-white">{progressReport}</div>
            ) : (
              <p className="text-neutral-400">
                Select a dog and generate a report when you are ready to review progress.
              </p>
            )}
          </div>

          {savedProgressReports.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="text-xl font-semibold">Saved Progress Reports</h3>
              {savedProgressReports.map((report) => (
                <button
                  key={report.id}
                  type="button"
                  onClick={() => setProgressReport(report.content)}
                  className="block w-full rounded border border-neutral-800 bg-black p-3 text-left text-sm text-neutral-300 hover:bg-neutral-900"
                >
                  {new Date(report.createdAt).toLocaleString()}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 rounded-lg border border-neutral-800 bg-neutral-950 p-6">
          <h2 className="text-3xl font-bold">Latest Next Session Plan</h2>

          {!summary?.latestNextSessionPlan && (
            <p className="mt-4 text-neutral-400">No saved next session plans yet.</p>
          )}

          {summary?.latestNextSessionPlan && (
            <div className="mt-6">
              <p className="mb-3 text-neutral-400">
                Saved {new Date(summary.latestNextSessionPlan.created_at).toLocaleString()}
              </p>
              <div className="whitespace-pre-wrap rounded-lg border border-neutral-800 bg-black p-4 text-neutral-200">
                {summary.latestNextSessionPlan.content}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

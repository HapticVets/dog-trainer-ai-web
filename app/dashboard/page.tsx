"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import DogTrainingTimeline from "@/components/DogTrainingTimeline";
import TrainingConsistencyCard from "@/components/TrainingConsistencyCard";
import {
  buildDogCaseFileContext,
  hydrateDogCaseFile,
  type DogCaseFile,
} from "@/lib/dogCaseFile";
import { getTrainingConsistency } from "@/lib/trainingConsistency";

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
  createdAt?: string;
};

type DashboardDogProfile = DogCaseFile & {
  createdAt?: string;
};

type CoachMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

type SavedOutput = {
  id: string;
  outputType: "initial_session_plan" | "progress_report" | "next_session_plan";
  content: string;
  createdAt: string;
};

type TimelineEvent = {
  id: string;
  type: "case-file" | "plan" | "session" | "report" | "coach";
  title: string;
  description: string;
  createdAt: string;
  action?: {
    label: string;
    href: string;
  };
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

const getPreview = (value: string, limit = 180) =>
  value.length > limit ? `${value.slice(0, limit).trim()}...` : value;

const formatTimelineTimestamp = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const getTimelineWeekKey = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  const weekStart = new Date(date);
  const day = weekStart.getDay();
  weekStart.setDate(weekStart.getDate() - ((day + 6) % 7));
  weekStart.setHours(0, 0, 0, 0);

  return weekStart.toISOString().slice(0, 10);
};

const getTimelineWeekLabel = (weekKey: string) => {
  if (weekKey === "Date unavailable") return weekKey;

  const weekStart = new Date(`${weekKey}T12:00:00`);
  return `Week of ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(weekStart)}`;
};

const TimelineIcon = ({ type }: { type: TimelineEvent["type"] }) => {
  const paths = {
    "case-file": <path d="M4 2.8h5l3 3v7.4H4V2.8Zm4 2.5h2.2M6 8h4M6 10.5h3" />,
    plan: <path d="M3 4.2h10M3 8h10M3 11.8h6M10.8 10.5l1.5 1.5 2.3-3" />,
    session: <path d="M4 2.8v2.4M12 2.8v2.4M3 5.2h10v8.3H3V5.2Zm2.2 3h5.6M5.2 10.7h3.2" />,
    report: <path d="M4 2.8h5l3 3v7.4H4V2.8Zm2 5.1h4M6 10.4h3M10.3 5.8h1.4" />,
    coach: <path d="M3 3.5h10v7H7l-3.3 2.4.5-2.4H3v-7Z" />,
  };

  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-500/25 bg-amber-400/10 text-amber-200">
      <svg viewBox="0 0 16 16" className="h-4 w-4 fill-none stroke-current stroke-[1.5]" aria-hidden="true">
        {paths[type]}
      </svg>
    </span>
  );
};

const DashboardIcon = ({ type }: { type: "dog" | "phase" | "sessions" | "focus" }) => {
  const paths = {
    dog: <path d="M3 12.5c1.4-3.8 3-5.7 5-5.7s3.6 1.9 5 5.7M5.2 7.2 4 4.5l2.6.7M10.8 7.2 12 4.5l-2.6.7" />,
    phase: <path d="M8 2.5v11M3.3 5.2 8 2.5l4.7 2.7L8 8l-4.7-2.8Zm0 5.6L8 8l4.7 2.8L8 13.5l-4.7-2.7Z" />,
    sessions: <path d="M4 2.8v2.4M12 2.8v2.4M3 5.2h10v8.3H3V5.2Zm2.2 3h5.6M5.2 10.7h3.2" />,
    focus: <path d="m8 2.5 1.4 3.1 3.4.3-2.6 2.2.8 3.4L8 9.7l-3 1.8.8-3.4-2.6-2.2 3.4-.3L8 2.5Z" />,
  };

  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-500/25 bg-amber-400/10 text-amber-200">
      <svg viewBox="0 0 16 16" className="h-5 w-5 fill-none stroke-current stroke-[1.5]" aria-hidden="true">
        {paths[type]}
      </svg>
    </span>
  );
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  const [dogProfiles, setDogProfiles] = useState<DashboardDogProfile[]>([]);
  const [selectedDogId, setSelectedDogId] = useState<string>("");
  const [selectedDogName, setSelectedDogName] = useState("");
  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>([]);
  const [savedOutputs, setSavedOutputs] = useState<SavedOutput[]>([]);
  const [coachMessages, setCoachMessages] = useState<CoachMessage[]>([]);
  const [showAllTimelineEvents, setShowAllTimelineEvents] = useState(false);
  const [progressReport, setProgressReport] = useState("");
  const [reportLoading, setReportLoading] = useState(false);

  const hasActiveDog = Boolean(selectedDogId && selectedDogName.trim());
  const trainingConsistency = useMemo(
    () => getTrainingConsistency(sessionLogs),
    [sessionLogs],
  );

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
  const activePlanPrimaryCue = activeTrainingPlan
    ? getPlanSection(activeTrainingPlan.content, "PRIMARY C") || "Not specified"
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

        const mapped: DashboardDogProfile[] = (data.profiles || []).map((profile: any) => ({
          ...hydrateDogCaseFile(profile),
          createdAt: profile.created_at,
        }));

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
      setCoachMessages([]);
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
          createdAt: log.created_at,
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

    const loadCoachMessages = async () => {
      try {
        const res = await fetch(
          `/api/dog-chats?dog_profile_id=${encodeURIComponent(selectedDogId)}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await res.json();

        if (!res.ok) {
          console.error("Failed to load coach messages:", data.error);
          setCoachMessages([]);
          return;
        }

        setCoachMessages(
          (data.chats || []).map((chat: {
            id: string;
            role: "user" | "assistant";
            content: string;
            created_at: string;
          }) => ({
            id: chat.id,
            role: chat.role,
            content: chat.content,
            createdAt: chat.created_at,
          }))
        );
      } catch (error) {
        console.error("Failed to load coach messages:", error);
        setCoachMessages([]);
      }
    };

    loadSessionLogs();
    loadOutputs();
    loadCoachMessages();
  }, [selectedDogId, selectedDogName]);

  const handleSelectDog = (id: string) => {
    setSelectedDogId(id);
    const found = dogProfiles.find((dog) => dog.id === id);

    if (found) {
      setSelectedDogName(found.name);
      setProgressReport("");
      setShowAllTimelineEvents(false);
    } else {
      setSelectedDogName("");
      setProgressReport("");
      setShowAllTimelineEvents(false);
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
  const coachConversationEvents = useMemo(() => {
    const messagesByDate = new Map<string, CoachMessage[]>();

    coachMessages.forEach((message) => {
      if (!message.createdAt) return;

      const date = new Date(message.createdAt);
      if (Number.isNaN(date.getTime())) return;

      const dateKey = date.toISOString().slice(0, 10);
      messagesByDate.set(dateKey, [...(messagesByDate.get(dateKey) ?? []), message]);
    });

    return Array.from(messagesByDate.entries()).map(([dateKey, messages]) => {
      const latestMessage = messages[messages.length - 1];
      const coachMessageCount = messages.filter((message) => message.role === "assistant").length;

      return {
        id: `coach-${dateKey}`,
        type: "coach" as const,
        title: "Coach Conversation",
        description: `${messages.length} messages exchanged${
          coachMessageCount > 0 ? `, including ${coachMessageCount} coach response${coachMessageCount === 1 ? "" : "s"}` : ""
        }.`,
        createdAt: latestMessage.createdAt,
        action: {
          label: "View Coaching",
          href: "/train#patriot-k9-coach",
        },
      };
    });
  }, [coachMessages]);
  const timelineEvents = useMemo(() => {
    const events: TimelineEvent[] = [];

    if (selectedDogProfile?.createdAt) {
      events.push({
        id: `case-file-${selectedDogProfile.id}`,
        type: "case-file",
        title: "Case File Created",
        description: `${selectedDogProfile.name}'s training case file was created for ${selectedDogProfile.mainGoal || "their primary training goal"}.`,
        createdAt: selectedDogProfile.createdAt,
        action: {
          label: "View Case File",
          href: "/train",
        },
      });
    }

    savedOutputs.forEach((output) => {
      if (output.outputType === "progress_report") {
        events.push({
          id: `report-${output.id}`,
          type: "report",
          title: "Mission Report Completed",
          description: "A progress report was generated from completed training sessions.",
          createdAt: output.createdAt,
        });
        return;
      }

      const objective = getPlanSection(output.content, "SESSION OBJECTIVE");
      events.push({
        id: `plan-${output.id}`,
        type: "plan",
        title:
          output.outputType === "initial_session_plan"
            ? "Training Plan Generated"
            : "Next Training Plan Generated",
        description: objective || "A structured training mission was generated.",
        createdAt: output.createdAt,
        action: {
          label: "View Plan",
          href: "/train#current-training-plan",
        },
      });
    });

    sessionLogs.forEach((session) => {
      const timestamp = session.createdAt || session.date;
      if (!timestamp) return;

      events.push({
        id: `session-${session.id}`,
        type: "session",
        title: "Training Session Logged",
        description: `${session.focus || "Training mission"}${session.duration ? ` · ${session.duration}` : ""}${
          session.wins ? ` · Wins: ${getPreview(session.wins, 88)}` : ""
        }`,
        createdAt: timestamp,
        action: {
          label: "View Session",
          href: "/train#mission-reports",
        },
      });
    });

    events.push(...coachConversationEvents);

    return events
      .filter((event) => !Number.isNaN(new Date(event.createdAt).getTime()))
      .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime());
  }, [coachConversationEvents, savedOutputs, selectedDogProfile, sessionLogs]);
  const visibleTimelineEvents = showAllTimelineEvents
    ? timelineEvents
    : timelineEvents.slice(0, 12);
  const timelineWeeks = useMemo(() => {
    const weeks = new Map<string, TimelineEvent[]>();

    visibleTimelineEvents.forEach((event) => {
      const weekKey = getTimelineWeekKey(event.createdAt);
      weeks.set(weekKey, [...(weeks.get(weekKey) ?? []), event]);
    });

    return Array.from(weeks.entries());
  }, [visibleTimelineEvents]);

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
      <section className="relative overflow-hidden border-b border-neutral-800 bg-gradient-to-br from-black via-neutral-950 to-amber-950/20">
        <Image
          src="/logo-icon-white.png"
          alt=""
          width={360}
          height={360}
          className="pointer-events-none absolute -right-16 -top-20 h-80 w-80 opacity-[0.045] sm:right-1/3 sm:top-1/2 sm:h-[28rem] sm:w-[28rem] sm:-translate-y-1/2"
          aria-hidden="true"
        />
        {selectedDogProfile?.profileImageUrl && (
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-2/5 overflow-hidden lg:block">
            <Image
              src={selectedDogProfile.profileImageUrl}
              alt=""
              fill
              sizes="40vw"
              className="object-cover opacity-15"
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-neutral-950/30 via-neutral-950/60 to-neutral-950" />
          </div>
        )}
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
                Patriot K9 Command
              </p>
              <h1 className="mt-4 text-4xl font-bold leading-tight md:text-6xl">
                Patriot K9 Command Center
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-neutral-300">
                Monitor your dog&apos;s training progress, active objectives, completed missions, and next steps.
              </p>
            </div>

            <div className="flex flex-col items-start gap-4 md:items-end">
              <div className="rounded-lg border border-amber-500/30 bg-amber-400/10 px-5 py-3 text-sm text-amber-100 shadow-[0_12px_30px_rgba(0,0,0,0.24)]">
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
                  className="rounded border border-neutral-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-neutral-900 disabled:opacity-50"
                >
                  {portalLoading ? "Opening..." : "Manage Subscription"}
                </button>

                <Link
                  href="/train"
                  className="rounded bg-amber-400 px-5 py-3 font-semibold text-black transition-colors hover:bg-amber-300"
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
          <div className="group rounded-xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-950 p-5 shadow-[0_12px_28px_rgba(0,0,0,0.2)] transition duration-200 hover:-translate-y-0.5 hover:border-amber-500/35 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Active Dog</p>
                <p className="mt-3 text-2xl font-bold text-white">{selectedDogName || "Not set"}</p>
              </div>
              <DashboardIcon type="dog" />
            </div>
            <p className="mt-3 text-sm text-neutral-400">Selected training case</p>
          </div>

          <div className="group rounded-xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-950 p-5 shadow-[0_12px_28px_rgba(0,0,0,0.2)] transition duration-200 hover:-translate-y-0.5 hover:border-amber-500/35 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Training Phase</p>
                <p className="mt-3 text-lg font-bold text-white">{hasActiveDog ? activeTrainingPhase : "Not set"}</p>
              </div>
              <DashboardIcon type="phase" />
            </div>
            <p className="mt-3 text-sm text-neutral-400">Current structured progression</p>
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

          <div className="group rounded-xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-950 p-5 shadow-[0_12px_28px_rgba(0,0,0,0.2)] transition duration-200 hover:-translate-y-0.5 hover:border-amber-500/35 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Sessions Completed</p>
                <p className="mt-3 text-3xl font-bold text-white">{sessionLogs.length}</p>
              </div>
              <DashboardIcon type="sessions" />
            </div>
            <p className="mt-3 text-sm text-neutral-400">Logged missions for this dog</p>
          </div>

          <div className="group rounded-xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-950 p-5 shadow-[0_12px_28px_rgba(0,0,0,0.2)] transition duration-200 hover:-translate-y-0.5 hover:border-amber-500/35 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Current Focus</p>
                <p className="mt-3 text-lg font-bold text-white">{selectedDogProfile?.mainGoal || "Not set"}</p>
              </div>
              <DashboardIcon type="focus" />
            </div>
            <p className="mt-3 text-sm text-neutral-400">Primary training objective</p>
          </div>
        </div>

        <div className="mt-6">
          <TrainingConsistencyCard consistency={trainingConsistency} />
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-2">
          <div className="rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-950 p-6 shadow-[0_18px_44px_rgba(0,0,0,0.24)] sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Mission Report</p>
            <h2 className="mt-3 text-3xl font-bold">Latest Session</h2>

            {!summary?.latestSession && (
              <p className="mt-4 text-sm leading-6 text-neutral-400">Complete and log your first training mission to begin building reports.</p>
            )}

            {summary?.latestSession && (
              <div className="mt-6 space-y-4">
                <p className="text-2xl font-semibold">
                  {summary.latestSession.dog_name}
                  {summary.latestSession.duration
                    ? ` • ${summary.latestSession.duration} min`
                    : ""}
                </p>
                <p className="text-sm text-neutral-400">
                  <span className="font-semibold uppercase tracking-[0.14em] text-neutral-500">Date</span>
                  <span className="ml-3 text-neutral-200">{summary.latestSession.session_date || "Not provided"}</span>
                </p>
                <p className="text-sm text-neutral-300">
                  <span className="font-semibold uppercase tracking-[0.14em] text-neutral-500">Focus</span>
                  <span className="ml-3 text-neutral-100">{summary.latestSession.focus || "None"}</span>
                </p>
                <p className="text-sm leading-6 text-neutral-300">
                  <span className="font-semibold uppercase tracking-[0.14em] text-neutral-500">Wins</span>
                  <span className="ml-3 text-neutral-100">{getPreview(summary.latestSession.wins || "None")}</span>
                </p>
                <p className="text-sm leading-6 text-neutral-300">
                  <span className="font-semibold uppercase tracking-[0.14em] text-neutral-500">Challenges</span>
                  <span className="ml-3 text-neutral-100">{getPreview(summary.latestSession.issues || "None")}</span>
                </p>
                <Link href="/train" className="inline-flex text-sm font-semibold text-amber-300 transition-colors hover:text-amber-200">
                  View full report
                </Link>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-400/15 via-neutral-950 to-neutral-950 p-6 shadow-[0_18px_44px_rgba(0,0,0,0.28)] sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Next Mission</p>
            <h2 className="mt-3 text-3xl font-bold">{hasActiveDog ? activeTrainingPhase : "Training starts here"}</h2>

            {hasActiveDog && activeTrainingPlan ? (
              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-[0.16em] text-neutral-500">Objective</dt>
                  <dd className="mt-2 text-sm leading-6 text-neutral-200">{getPreview(activePlanObjective, 220)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.16em] text-neutral-500">Session Type</dt>
                  <dd className="mt-2 text-sm font-semibold text-white">{activePlanSessionType}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.16em] text-neutral-500">Estimated Duration</dt>
                  <dd className="mt-2 text-sm font-semibold text-white">{activePlanDuration}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.16em] text-neutral-500">Primary Cue</dt>
                  <dd className="mt-2 text-sm font-semibold text-white">{activePlanPrimaryCue}</dd>
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

        {selectedDogId ? (
          <div className="mt-8">
            <DogTrainingTimeline
              dogProfileId={selectedDogId}
              refreshKey={sessionLogs.length}
              preview
            />
          </div>
        ) : null}

        <section className="hidden mt-8 rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-950 p-5 shadow-[0_18px_44px_rgba(0,0,0,0.24)] sm:p-7" aria-hidden="true">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
                Training Progress
              </p>
              <h2 className="mt-3 text-3xl font-bold">Training Timeline</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-400">
                Review {selectedDogName || "your dog"}&apos;s training journey from the first case file through plans, sessions, reports, and coaching.
              </p>
            </div>
            {timelineEvents.length > 0 && (
              <span className="self-start rounded border border-neutral-700 bg-black/30 px-3 py-2 text-xs font-semibold text-neutral-300 sm:self-auto">
                {timelineEvents.length} recorded {timelineEvents.length === 1 ? "event" : "events"}
              </span>
            )}
          </div>

          {!hasActiveDog ? (
            <div className="mt-6 rounded-xl border border-neutral-800 bg-black/30 p-5 text-sm leading-6 text-neutral-400">
              Select a dog to review its complete training timeline.
            </div>
          ) : timelineWeeks.length === 0 ? (
            <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-400/5 p-5 text-sm leading-6 text-neutral-300">
              This timeline will begin as training activity is saved. Create a case file, generate a mission, or log a session to add the first milestone.
            </div>
          ) : (
            <div className="mt-6 space-y-7">
              {timelineWeeks.map(([weekKey, events]) => (
                <div key={weekKey}>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
                    {getTimelineWeekLabel(weekKey)}
                  </p>
                  <div className="mt-3 space-y-3 border-l border-neutral-800 pl-4 sm:pl-5">
                    {events.map((event) => (
                      <article key={event.id} className="relative rounded-xl border border-neutral-800 bg-black/35 p-4 shadow-[0_10px_24px_rgba(0,0,0,0.14)]">
                        <span className="absolute -left-[1.55rem] top-5 h-3 w-3 rounded-full border-2 border-neutral-950 bg-amber-400 sm:-left-[1.8rem]" aria-hidden="true" />
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex min-w-0 gap-3">
                            <TimelineIcon type={event.type} />
                            <div className="min-w-0">
                              <h3 className="text-base font-semibold text-white">{event.title}</h3>
                              <p className="mt-1 text-xs text-neutral-500">{formatTimelineTimestamp(event.createdAt)}</p>
                              <p className="mt-2 break-words text-sm leading-6 text-neutral-300">{event.description}</p>
                            </div>
                          </div>
                          {event.action && (
                            <Link
                              href={event.action.href}
                              className="inline-flex min-h-10 shrink-0 items-center justify-center rounded border border-neutral-700 px-3 py-2 text-xs font-semibold text-amber-200 transition-colors hover:border-amber-500/50 hover:bg-amber-400/10 focus:outline-none focus:ring-2 focus:ring-amber-300 sm:w-auto"
                            >
                              {event.action.label}
                            </Link>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {timelineEvents.length > 12 && (
            <button
              type="button"
              onClick={() => setShowAllTimelineEvents((showAll) => !showAll)}
              className="mt-6 min-h-11 w-full rounded border border-neutral-700 px-4 py-3 text-sm font-semibold text-neutral-200 transition-colors hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-300 sm:w-auto"
            >
              {showAllTimelineEvents
                ? "Show Recent Events"
                : `Show ${timelineEvents.length - 12} Older ${timelineEvents.length - 12 === 1 ? "Event" : "Events"}`}
            </button>
          )}
        </section>

        <section className="mt-8 flex flex-col gap-4 rounded-xl border border-neutral-800 bg-black/30 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Professional Support</p>
            <h2 className="mt-2 text-xl font-bold">Need Hands-On Help?</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400">
              Some training goals benefit from direct coaching with a professional trainer.
            </p>
          </div>
          <Link
            href="/training-options"
            className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded border border-amber-500/40 px-5 py-3 text-sm font-semibold text-amber-200 transition-colors hover:bg-amber-400/10 focus:outline-none focus:ring-2 focus:ring-amber-300 sm:w-auto"
          >
            Explore In-Person Training
          </Link>
        </section>

        <section className="mt-8 rounded-xl border border-neutral-800 bg-neutral-950 p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Dog Training Record</p>
          <h2 className="mt-3 text-3xl font-bold">Active Dog Profile</h2>

          {selectedDogProfile ? (
            <>
              <div className="mt-6 flex flex-col gap-4 rounded-xl border border-amber-500/20 bg-black/30 p-4 sm:flex-row sm:items-center">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-amber-500/30 bg-neutral-900">
                  {selectedDogProfile.profileImageUrl ? (
                    <Image
                      src={selectedDogProfile.profileImageUrl}
                      alt={`${selectedDogProfile.name} profile`}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-800 to-black text-xl font-bold text-amber-300">
                      {selectedDogProfile.name.slice(0, 1).toUpperCase() || "K9"}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{selectedDogProfile.name}</p>
                  <p className="mt-1 text-sm text-neutral-400">Active case file and training record</p>
                </div>
              </div>
              <details className="group mt-4">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-lg border border-neutral-800 bg-black/30 px-4 py-3 text-sm font-semibold text-neutral-200 transition-colors hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-300">
                  View profile details
                  <span className="text-amber-300 transition-transform group-open:rotate-180" aria-hidden="true">⌄</span>
                </summary>
                <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
              </details>
            </>
          ) : (
            <p className="mt-5 text-sm leading-6 text-neutral-400">
              Select a dog to review its professional training record.
            </p>
          )}
        </section>

        <div className="mt-8 rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-950 p-6 shadow-[0_18px_44px_rgba(0,0,0,0.24)] sm:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Progress Intelligence</p>
              <h2 className="text-3xl font-bold">Progress Report Center</h2>
              <p className="mt-3 text-neutral-400">
                Progress reports are generated from real training sessions. Select a dog with logged sessions before generating a report.
              </p>
              <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-400/10 px-4 py-3 text-sm leading-6 text-amber-100">
                Reports unlock as training sessions are completed. Each mission adds context to your dog&apos;s progress history.
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerateReport}
              disabled={reportLoading || sessionLogs.length === 0 || !selectedDogId}
              className="w-full rounded bg-amber-400 px-6 py-3 font-semibold text-black transition-colors hover:bg-amber-300 disabled:opacity-50 md:w-auto"
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
            <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-400/10 p-5">
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
            <details className="group mt-6">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-lg border border-neutral-800 bg-black/30 px-4 py-3 text-sm font-semibold text-neutral-200 transition-colors hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-300">
                Saved Progress Reports
                <span className="text-amber-300 transition-transform group-open:rotate-180" aria-hidden="true">⌄</span>
              </summary>
              <div className="mt-3 space-y-3">
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
            </details>
          )}
        </div>

        <div className="mt-8 rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-950 p-6 shadow-[0_18px_44px_rgba(0,0,0,0.24)] sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Training Plan</p>
          <h2 className="mt-3 text-3xl font-bold">Latest Training Plan</h2>

          {activeTrainingPlan ? (
            <details className="group mt-6">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-lg border border-neutral-800 bg-black/30 px-4 py-3 text-sm font-semibold text-neutral-200 transition-colors hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-300">
                View latest plan details
                <span className="text-amber-300 transition-transform group-open:rotate-180" aria-hidden="true">⌄</span>
              </summary>
              <div className="mt-4 grid gap-4 md:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Current Objective</p>
                <p className="mt-2 text-sm leading-6 text-neutral-200">{getPreview(activePlanObjective, 160)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Current Phase</p>
                <p className="mt-2 text-sm font-semibold text-white">{activeTrainingPhase}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Session Type</p>
                <p className="mt-2 text-sm font-semibold text-white">{activePlanSessionType}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Last Generated</p>
                <p className="mt-2 text-sm font-semibold text-white">{new Date(activeTrainingPlan.createdAt).toLocaleString()}</p>
              </div>
              </div>
            </details>
          ) : (
            <p className="mt-5 text-sm leading-6 text-neutral-400">No saved training plan yet. Start in the Trainer to generate your first mission.</p>
          )}

          <Link
            href="/train"
            className="mt-6 inline-flex w-full justify-center rounded border border-amber-500/40 px-5 py-3 text-sm font-semibold text-amber-200 transition-colors hover:bg-amber-400/10 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:ring-offset-2 focus:ring-offset-neutral-950 sm:w-auto"
          >
            View Full Plan
          </Link>
        </div>
      </section>
    </main>
  );
}

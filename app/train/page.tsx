"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type DogProfile = {
  name: string;
  goalType: string;
  mainGoal: string;
  rewardType: string;
  skillLevel: string;
  customNotes: string;
};

type SessionLog = {
  id: string;
  date: string;
  duration: string;
  focus: string;
  wins: string;
  issues: string;
  nextAdjustment: string;
};

const goalTypeOptions = [
  "Obedience",
  "Behavior Fix",
  "Puppy Foundation",
  "AKC Obedience",
  "Rally",
  "Agility",
  "Service Dog Foundation",
  "Protection Foundation",
];

const mainGoalOptions: Record<string, string[]> = {
  Obedience: [
    "Heel position",
    "Sit stay",
    "Down stay",
    "Recall",
    "Place command",
    "Engagement and focus",
    "Loose leash walking",
  ],
  "Behavior Fix": [
    "Leash reactivity",
    "Jumping on people",
    "Pulling on leash",
    "Whining or demand behavior",
    "Not listening around distractions",
    "Over-arousal around toy or ball",
    "Poor impulse control",
  ],
  "Puppy Foundation": [
    "Name recognition",
    "Marker training",
    "Crate training",
    "Potty routine",
    "Early leash work",
    "Sit and down foundation",
    "Confidence building",
  ],
  "AKC Obedience": [
    "Fronts and finishes",
    "Heel precision",
    "Sit for exam prep",
    "Recall precision",
    "Stand and stay",
    "Ring engagement",
    "Proofing exercises",
  ],
  Rally: [
    "Station work",
    "Handler timing",
    "Pivot positions",
    "Front and finish accuracy",
    "Attention in motion",
    "Course flow practice",
  ],
  Agility: [
    "Start line stay",
    "Jump commitment",
    "Tunnel confidence",
    "Handler focus",
    "Body awareness",
    "Drive and control balance",
  ],
  "Service Dog Foundation": [
    "Public neutrality",
    "Settle under distraction",
    "Task foundation",
    "Loose leash in public",
    "Ignore people and dogs",
    "Engagement with handler",
  ],
  "Protection Foundation": [
    "Drive building",
    "Out command foundation",
    "Handler focus under arousal",
    "Controlled barking",
    "Grip foundation",
    "Neutral obedience before pressure",
  ],
};

const rewardTypeOptions = [
  "Food",
  "Toy",
  "Ball",
  "Food and Toy",
  "Praise",
];

const skillLevelOptions = [
  "Green dog",
  "Beginner",
  "Intermediate",
  "Advanced",
  "Competition ready",
];

export default function TrainPage() {
  const { user } = useUser();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [premium, setPremium] = useState(false);
  const [freeMessagesUsed, setFreeMessagesUsed] = useState(0);
  const [freeMessagesRemaining, setFreeMessagesRemaining] = useState(8);
  const [accessLoaded, setAccessLoaded] = useState(false);

  const [dogProfile, setDogProfile] = useState<DogProfile>({
    name: "",
    goalType: "Obedience",
    mainGoal: "Heel position",
    rewardType: "Food",
    skillLevel: "Beginner",
    customNotes: "",
  });

  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>([]);
  const [sessionForm, setSessionForm] = useState({
    date: "",
    duration: "",
    focus: "",
    wins: "",
    issues: "",
    nextAdjustment: "",
  });

  const [progressReport, setProgressReport] = useState("");
  const [reportLoading, setReportLoading] = useState(false);

  const storageKey = useMemo(() => {
    return `patriot-k9-session-logs-${user?.id ?? "guest"}`;
  }, [user?.id]);

  useEffect(() => {
    const loadAccess = async () => {
      try {
        const res = await fetch("/api/trainer/access");
        const data = await res.json();

        if (res.ok) {
          setPremium(Boolean(data.premium));
          setFreeMessagesUsed(Number(data.freeMessagesUsed ?? 0));
          setFreeMessagesRemaining(Number(data.freeMessagesRemaining ?? 0));
        }
      } catch (error) {
        console.error("Failed to load access:", error);
      } finally {
        setAccessLoaded(true);
      }
    };

    loadAccess();
  }, []);

  useEffect(() => {
    const goals = mainGoalOptions[dogProfile.goalType] || [];
    if (goals.length > 0 && !goals.includes(dogProfile.mainGoal)) {
      setDogProfile((prev) => ({
        ...prev,
        mainGoal: goals[0],
      }));
    }
  }, [dogProfile.goalType, dogProfile.mainGoal]);

  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as SessionLog[];
        setSessionLogs(parsed);
      } catch {
        setSessionLogs([]);
      }
    } else {
      setSessionLogs([]);
    }
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(sessionLogs));
  }, [sessionLogs, storageKey]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const fullUserInput =
      dogProfile.customNotes.trim().length > 0
        ? `${input}\n\nAdditional Notes: ${dogProfile.customNotes}`
        : input;

    const userMessage: ChatMessage = {
      role: "user",
      content: fullUserInput,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages,
          dogProfile,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages([
          ...nextMessages,
          {
            role: "assistant",
            content:
              data.reply ||
              data.error ||
              "You have reached your free limit. Upgrade to continue.",
          },
        ]);

        if (typeof data.premium === "boolean") {
          setPremium(data.premium);
        }
        if (typeof data.freeMessagesUsed === "number") {
          setFreeMessagesUsed(data.freeMessagesUsed);
        }
        if (typeof data.freeMessagesRemaining === "number") {
          setFreeMessagesRemaining(data.freeMessagesRemaining);
        }

        return;
      }

      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: data.reply || "No response generated.",
        },
      ]);

      if (typeof data.premium === "boolean") {
        setPremium(data.premium);
      }
      if (typeof data.freeMessagesUsed === "number") {
        setFreeMessagesUsed(data.freeMessagesUsed);
      }
      if (typeof data.freeMessagesRemaining === "number") {
        setFreeMessagesRemaining(data.freeMessagesRemaining);
      }
    } catch (error) {
      console.error("Chat error:", error);

      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: "Error connecting to Dog Trainer AI.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSession = () => {
    if (
      !sessionForm.date.trim() ||
      !sessionForm.focus.trim() ||
      !sessionForm.wins.trim() ||
      !sessionForm.issues.trim() ||
      !sessionForm.nextAdjustment.trim()
    ) {
      alert("Fill out the session log before saving.");
      return;
    }

    const newLog: SessionLog = {
      id: `${Date.now()}`,
      date: sessionForm.date,
      duration: sessionForm.duration,
      focus: sessionForm.focus,
      wins: sessionForm.wins,
      issues: sessionForm.issues,
      nextAdjustment: sessionForm.nextAdjustment,
    };

    setSessionLogs((prev) => [newLog, ...prev]);
    setSessionForm({
      date: "",
      duration: "",
      focus: "",
      wins: "",
      issues: "",
      nextAdjustment: "",
    });
  };

  const handleDeleteSession = (id: string) => {
    setSessionLogs((prev) => prev.filter((log) => log.id !== id));
  };

  const handleGenerateReport = async () => {
    if (reportLoading) return;

    if (sessionLogs.length === 0) {
      alert("Log at least one session before generating a progress report.");
      return;
    }

    setReportLoading(true);

    const sessionSummary = sessionLogs
      .map(
        (log, index) =>
          `Session ${index + 1}
Date: ${log.date}
Duration: ${log.duration || "not provided"}
Focus: ${log.focus}
Wins: ${log.wins}
Issues: ${log.issues}
Next Adjustment: ${log.nextAdjustment}`
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

Dog Name: ${dogProfile.name || "unknown"}
Goal Type: ${dogProfile.goalType || "unknown"}
Main Goal: ${dogProfile.mainGoal || "unknown"}
Reward Type: ${dogProfile.rewardType || "unknown"}
Skill Level: ${dogProfile.skillLevel || "unknown"}
Additional Notes: ${dogProfile.customNotes || "none"}

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
          dogProfile,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setProgressReport(
          data.reply ||
            data.error ||
            "Unable to generate progress report right now."
        );
      } else {
        setProgressReport(data.reply || "No progress report generated.");
      }

      if (typeof data.premium === "boolean") {
        setPremium(data.premium);
      }
      if (typeof data.freeMessagesUsed === "number") {
        setFreeMessagesUsed(data.freeMessagesUsed);
      }
      if (typeof data.freeMessagesRemaining === "number") {
        setFreeMessagesRemaining(data.freeMessagesRemaining);
      }
    } catch (error) {
      console.error("Progress report error:", error);
      setProgressReport("Error generating progress report.");
    } finally {
      setReportLoading(false);
    }
  };

  const canChat = premium || freeMessagesRemaining > 0;
  const availableMainGoals = mainGoalOptions[dogProfile.goalType] || [];

  return (
    <main className="min-h-screen bg-[#0b0f17] text-white px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-4xl font-bold">Patriot K9 Command Trainer</h1>

        {!accessLoaded && (
          <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="text-slate-300">Loading account access...</p>
          </div>
        )}

        {accessLoaded && (
          <>
            {!premium && (
              <div className="mt-8 rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-6">
                <h2 className="text-2xl font-semibold">Free Trial Active</h2>
                <p className="mt-3 text-slate-200">
                  You have <strong>{freeMessagesRemaining}</strong> free trainer
                  message{freeMessagesRemaining === 1 ? "" : "s"} remaining.
                </p>
                <p className="mt-2 text-slate-400">
                  After 8 total messages, upgrade is required for unlimited access.
                </p>

                {freeMessagesRemaining <= 0 && (
                  <a
                    href="/"
                    className="mt-6 inline-block rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-black hover:brightness-110"
                  >
                    Upgrade Now
                  </a>
                )}
              </div>
            )}

            {premium && (
              <div className="mt-8 rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-6">
                <h2 className="text-2xl font-semibold">Premium Access Active</h2>
                <p className="mt-3 text-slate-200">
                  Unlimited trainer access is unlocked for this account.
                </p>
              </div>
            )}

            <div className="mt-8 grid gap-8 xl:grid-cols-[360px_1fr]">
              <div className="space-y-8">
                <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                  <h2 className="text-2xl font-semibold">Dog Profile</h2>

                  <div className="mt-5 space-y-4">
                    <div>
                      <label className="mb-2 block text-sm text-slate-300">Dog Name</label>
                      <input
                        type="text"
                        value={dogProfile.name}
                        onChange={(e) =>
                          setDogProfile({ ...dogProfile, name: e.target.value })
                        }
                        placeholder="Ex: Henry"
                        className="w-full rounded-lg border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-slate-300">Goal Type</label>
                      <select
                        value={dogProfile.goalType}
                        onChange={(e) =>
                          setDogProfile({
                            ...dogProfile,
                            goalType: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
                      >
                        {goalTypeOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-slate-300">Main Goal</label>
                      <select
                        value={dogProfile.mainGoal}
                        onChange={(e) =>
                          setDogProfile({
                            ...dogProfile,
                            mainGoal: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
                      >
                        {availableMainGoals.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <p className="mt-2 text-xs text-slate-400">
                        Pick the closest match, then use Additional Notes if needed.
                      </p>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-slate-300">Reward Type</label>
                      <select
                        value={dogProfile.rewardType}
                        onChange={(e) =>
                          setDogProfile({
                            ...dogProfile,
                            rewardType: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
                      >
                        {rewardTypeOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-slate-300">Skill Level</label>
                      <select
                        value={dogProfile.skillLevel}
                        onChange={(e) =>
                          setDogProfile({
                            ...dogProfile,
                            skillLevel: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
                      >
                        {skillLevelOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-slate-300">
                        Additional Notes
                      </label>
                      <textarea
                        value={dogProfile.customNotes}
                        onChange={(e) =>
                          setDogProfile({
                            ...dogProfile,
                            customNotes: e.target.value,
                          })
                        }
                        placeholder="Ex: breaks heel when ball comes out, strong food drive, struggles at 20 feet, gets vocal around other dogs..."
                        className="min-h-[120px] w-full rounded-lg border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                  <h2 className="text-2xl font-semibold">Log Training Session</h2>

                  <div className="mt-5 space-y-4">
                    <div>
                      <label className="mb-2 block text-sm text-slate-300">Date</label>
                      <input
                        type="date"
                        value={sessionForm.date}
                        onChange={(e) =>
                          setSessionForm({ ...sessionForm, date: e.target.value })
                        }
                        className="w-full rounded-lg border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-slate-300">
                        Duration
                      </label>
                      <input
                        type="text"
                        value={sessionForm.duration}
                        onChange={(e) =>
                          setSessionForm({ ...sessionForm, duration: e.target.value })
                        }
                        placeholder="Ex: 15 minutes"
                        className="w-full rounded-lg border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-slate-300">Focus</label>
                      <input
                        type="text"
                        value={sessionForm.focus}
                        onChange={(e) =>
                          setSessionForm({ ...sessionForm, focus: e.target.value })
                        }
                        placeholder="Ex: heel position with toy control"
                        className="w-full rounded-lg border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-slate-300">Wins</label>
                      <textarea
                        value={sessionForm.wins}
                        onChange={(e) =>
                          setSessionForm({ ...sessionForm, wins: e.target.value })
                        }
                        placeholder="What improved?"
                        className="min-h-[90px] w-full rounded-lg border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-slate-300">Issues</label>
                      <textarea
                        value={sessionForm.issues}
                        onChange={(e) =>
                          setSessionForm({ ...sessionForm, issues: e.target.value })
                        }
                        placeholder="What broke down?"
                        className="min-h-[90px] w-full rounded-lg border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-slate-300">
                        Next Adjustment
                      </label>
                      <textarea
                        value={sessionForm.nextAdjustment}
                        onChange={(e) =>
                          setSessionForm({
                            ...sessionForm,
                            nextAdjustment: e.target.value,
                          })
                        }
                        placeholder="What will you change next session?"
                        className="min-h-[90px] w-full rounded-lg border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveSession}
                      className="w-full cursor-pointer rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-black hover:brightness-110"
                    >
                      Save Session Log
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">Trainer Chat</h2>

                    {!premium && (
                      <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-300">
                        {freeMessagesRemaining} free left
                      </span>
                    )}

                    {premium && (
                      <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-300">
                        Premium
                      </span>
                    )}
                  </div>

                  <div className="mt-6 h-[420px] overflow-y-auto rounded-xl border border-white/10 bg-[#08111f] p-4">
                    {messages.length === 0 && (
                      <p className="text-slate-400">
                        Start by describing the issue, what the dog is doing, what you
                        want instead, and what happens during training.
                      </p>
                    )}

                    <div className="space-y-4">
                      {messages.map((message, index) => (
                        <div
                          key={index}
                          className={
                            message.role === "user"
                              ? "ml-auto max-w-[85%] rounded-xl bg-cyan-400 px-4 py-3 text-black whitespace-pre-wrap"
                              : "mr-auto max-w-[85%] rounded-xl bg-[#0f172a] px-4 py-3 text-white whitespace-pre-wrap"
                          }
                        >
                          {message.content}
                        </div>
                      ))}

                      {loading && (
                        <div className="mr-auto max-w-[85%] rounded-xl bg-[#0f172a] px-4 py-3 text-slate-300">
                          Thinking...
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={
                        canChat
                          ? "Ask your training question here..."
                          : "Free limit reached. Upgrade to continue."
                      }
                      disabled={!canChat || loading}
                      className="min-h-[90px] flex-1 rounded-xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none disabled:opacity-50"
                    />

                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={!canChat || loading || !input.trim()}
                      className="cursor-pointer self-end rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-black hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Send
                    </button>
                  </div>

                  {!canChat && !premium && (
                    <div className="mt-4">
                      <a
                        href="/"
                        className="inline-block rounded-xl border border-white/20 px-5 py-3 text-white hover:bg-white/10"
                      >
                        Upgrade for Unlimited Access
                      </a>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-2xl font-semibold">Progress Report</h2>

                    <button
                      type="button"
                      onClick={handleGenerateReport}
                      disabled={reportLoading || sessionLogs.length === 0 || !canChat}
                      className="cursor-pointer rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-black hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {reportLoading ? "Generating..." : "Generate Progress Report"}
                    </button>
                  </div>

                  <p className="mt-3 text-sm text-slate-400">
                    Uses your logged sessions to generate a structured progress report.
                  </p>

                  <div className="mt-6 rounded-xl border border-white/10 bg-[#08111f] p-4">
                    {progressReport ? (
                      <div className="whitespace-pre-wrap text-white">
                        {progressReport}
                      </div>
                    ) : (
                      <p className="text-slate-400">
                        No report generated yet. Log sessions, then generate a report.
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                  <h2 className="text-2xl font-semibold">Session History</h2>

                  <div className="mt-6 space-y-4">
                    {sessionLogs.length === 0 && (
                      <p className="text-slate-400">No sessions logged yet.</p>
                    )}

                    {sessionLogs.map((log) => (
                      <div
                        key={log.id}
                        className="rounded-xl border border-white/10 bg-[#08111f] p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-semibold">
                              {log.date} {log.duration ? `• ${log.duration}` : ""}
                            </h3>
                            <p className="mt-2 text-sm text-slate-300">
                              <strong>Focus:</strong> {log.focus}
                            </p>
                            <p className="mt-2 text-sm text-slate-300">
                              <strong>Wins:</strong> {log.wins}
                            </p>
                            <p className="mt-2 text-sm text-slate-300">
                              <strong>Issues:</strong> {log.issues}
                            </p>
                            <p className="mt-2 text-sm text-slate-300">
                              <strong>Next Adjustment:</strong> {log.nextAdjustment}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteSession(log.id)}
                            className="cursor-pointer rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/10"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
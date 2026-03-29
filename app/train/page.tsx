"use client";

import { useEffect, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const STORAGE_KEY = "dog-trainer-ai-web-state";
const FREE_MESSAGE_LIMIT = 8;
const IS_PREMIUM = false;
const UPGRADE_URL = "https://www.patreon.com/c/dogtrainerai/membership";

export default function TrainPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Tell me your dog’s name and what you want to work on.\n\nExample: My dog Ollie breaks heel when he sees the ball.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [progressLoading, setProgressLoading] = useState(false);

  const [dogName, setDogName] = useState("");
  const [goalType, setGoalType] = useState("");
  const [mainGoal, setMainGoal] = useState("");
  const [rewardType, setRewardType] = useState("");
  const [skillLevel, setSkillLevel] = useState("");

  const [sessionNote, setSessionNote] = useState("");
  const [sessionLogs, setSessionLogs] = useState<string[]>([]);
  const [progressSummary, setProgressSummary] = useState("");

  const [freeMessageCount, setFreeMessageCount] = useState(0);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const saved = JSON.parse(raw);

      if (saved.messages?.length) setMessages(saved.messages);
      if (saved.dogName) setDogName(saved.dogName);
      if (saved.goalType) setGoalType(saved.goalType);
      if (saved.mainGoal) setMainGoal(saved.mainGoal);
      if (saved.rewardType) setRewardType(saved.rewardType);
      if (saved.skillLevel) setSkillLevel(saved.skillLevel);
      if (saved.sessionLogs?.length) setSessionLogs(saved.sessionLogs);
      if (saved.progressSummary) setProgressSummary(saved.progressSummary);
      if (typeof saved.freeMessageCount === "number") {
        setFreeMessageCount(saved.freeMessageCount);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const state = {
      messages,
      dogName,
      goalType,
      mainGoal,
      rewardType,
      skillLevel,
      sessionLogs,
      progressSummary,
      freeMessageCount,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [
    messages,
    dogName,
    goalType,
    mainGoal,
    rewardType,
    skillLevel,
    sessionLogs,
    progressSummary,
    freeMessageCount,
  ]);

  const freeMessagesLeft = Math.max(0, FREE_MESSAGE_LIMIT - freeMessageCount);
  const freeLimitReached = freeMessageCount >= FREE_MESSAGE_LIMIT;

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    if (freeLimitReached) {
      window.open(UPGRADE_URL, "_blank", "noopener,noreferrer");
      return;
    }

    const updatedMessages: Message[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages,
          dogProfile: {
            name: dogName,
            goalType,
            mainGoal,
            rewardType,
            skillLevel,
          },
        }),
      });

      const data = await res.json();

      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: data.reply || "I could not generate a response.",
        },
      ]);

      setFreeMessageCount((prev) => prev + 1);
    } catch {
      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: "There was an error connecting to Patriot K9 Command.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleLogSession() {
    if (!IS_PREMIUM) {
      window.open(UPGRADE_URL, "_blank", "noopener,noreferrer");
      return;
    }

    const trimmed = sessionNote.trim();
    if (!trimmed) return;

    setSessionLogs([trimmed, ...sessionLogs]);
    setSessionNote("");
  }

  async function handleGenerateProgress() {
    if (!IS_PREMIUM) {
      window.open(UPGRADE_URL, "_blank", "noopener,noreferrer");
      return;
    }

    if (progressLoading) return;

    setProgressLoading(true);

    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dogProfile: {
            name: dogName,
            goalType,
            mainGoal,
            rewardType,
            skillLevel,
          },
          sessionLogs,
        }),
      });

      const data = await res.json();
      setProgressSummary(data.reply || "No progress summary generated.");
    } catch {
      setProgressSummary("There was an error generating the progress summary.");
    } finally {
      setProgressLoading(false);
    }
  }

  function handleClearAll() {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  }

  return (
    <div className="min-h-screen bg-[#0b0f17] text-white">
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Patriot K9 Command"
              className="h-10 w-10 object-contain"
            />
            <div>
              <div className="text-lg font-bold tracking-tight">Patriot K9 Command</div>
              <div className="text-xs text-slate-400">Structured training system</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/"
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/5"
            >
              Home
            </a>
            <button
              onClick={handleClearAll}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/5"
            >
              Reset
            </button>
            <a
              href={UPGRADE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:brightness-110"
            >
              Upgrade
            </a>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-sm uppercase tracking-[0.2em] text-cyan-300">
              Training Interface
            </div>
            <h1 className="mt-3 text-4xl font-bold tracking-tight">
              Build control through structure.
            </h1>
            <p className="mt-3 max-w-2xl text-slate-400">
              Ask a question, run the plan, log the result, then adjust the next step.
              This is built for behavior work, obedience, and competition progression.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-sm uppercase tracking-[0.2em] text-cyan-300">
              Access Status
            </div>
            {!freeLimitReached ? (
              <>
                <div className="mt-3 text-3xl font-bold">{freeMessagesLeft}</div>
                <div className="mt-1 text-slate-400">free coaching messages left</div>
              </>
            ) : (
              <>
                <div className="mt-3 text-2xl font-bold text-red-300">Free limit reached</div>
                <div className="mt-1 text-slate-400">
                  Upgrade to continue training and unlock progress tracking.
                </div>
              </>
            )}

            <a
              href={UPGRADE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-block rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 hover:brightness-110"
            >
              Unlock Full Access
            </a>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
          <aside className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="mb-5">
              <h2 className="text-lg font-semibold">Dog Profile</h2>
              <p className="mt-1 text-sm text-slate-400">
                Set the working context before you train.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-slate-300">Dog Name</label>
                <input
                  value={dogName}
                  onChange={(e) => setDogName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none placeholder:text-slate-500"
                  placeholder="Ollie"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">Goal Type</label>
                <select
                  value={goalType}
                  onChange={(e) => setGoalType(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none"
                >
                  <option value="">Select goal type</option>
                  <option value="Behavior problem">Behavior problem</option>
                  <option value="Basic obedience">Basic obedience</option>
                  <option value="AKC Obedience">AKC Obedience</option>
                  <option value="AKC Rally">AKC Rally</option>
                  <option value="AKC Agility">AKC Agility</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">Main Goal</label>
                <input
                  value={mainGoal}
                  onChange={(e) => setMainGoal(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none placeholder:text-slate-500"
                  placeholder="Competition heel"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">Primary Reward</label>
                <input
                  value={rewardType}
                  onChange={(e) => setRewardType(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none placeholder:text-slate-500"
                  placeholder="Ball, food, tug, praise"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">Skill Level</label>
                <select
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none"
                >
                  <option value="">Select level</option>
                  <option value="beginner">Beginner</option>
                  <option value="some training">Some training</option>
                  <option value="competition prep">Competition prep</option>
                </select>
              </div>
            </div>

            <div className="mt-8 border-t border-white/10 pt-6">
              <div className="mb-3">
                <h3 className="text-base font-semibold">Session Log</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Premium feature for tracking work across sessions.
                </p>
              </div>

              <textarea
                value={sessionNote}
                onChange={(e) => setSessionNote(e.target.value)}
                placeholder="Example: Ollie held heel for 8 steps but broke when he saw the ball."
                className="min-h-[140px] w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500"
              />

              <button
                onClick={handleLogSession}
                className="mt-3 w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 hover:brightness-110"
              >
                Log Session (Premium)
              </button>

              <button
                onClick={handleGenerateProgress}
                className="mt-3 w-full rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-4 py-3 font-semibold text-cyan-100 hover:bg-cyan-400/20"
              >
                {progressLoading ? "Generating..." : "Generate Progress (Premium)"}
              </button>
            </div>
          </aside>

          <section className="flex min-h-[72vh] flex-col rounded-2xl border border-white/10 bg-white/5">
            <div className="border-b border-white/10 px-5 py-4">
              <div className="text-sm uppercase tracking-[0.2em] text-cyan-300">
                Command Interface
              </div>
              <h2 className="mt-2 text-lg font-semibold">Live Training Coach</h2>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`max-w-3xl rounded-2xl p-4 text-sm leading-7 whitespace-pre-wrap ${
                    message.role === "user"
                      ? "ml-auto bg-cyan-400 text-slate-950"
                      : "bg-slate-900 text-slate-100"
                  }`}
                >
                  {message.content}
                </div>
              ))}

              {loading && (
                <div className="max-w-3xl rounded-2xl bg-slate-900 p-4 text-sm leading-7 text-slate-300 whitespace-pre-wrap">
                  Generating command-level instruction...
                </div>
              )}
            </div>

            <div className="border-t border-white/10 p-4">
              <div className="flex gap-3">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSend();
                  }}
                  placeholder="Ask your training question..."
                  className="flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                />
                <button
                  onClick={handleSend}
                  className="rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:brightness-110"
                >
                  Send
                </button>
              </div>
            </div>
          </section>

          <aside className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="mb-5">
              <h2 className="text-lg font-semibold">Progress Tracking</h2>
              <p className="mt-1 text-sm text-slate-400">
                Premium reporting and session review.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-300">Session History</h3>
              <div className="mt-3 space-y-3">
                {sessionLogs.length === 0 ? (
                  <div className="rounded-xl bg-slate-900 p-4 text-sm text-slate-400">
                    No sessions logged yet.
                  </div>
                ) : (
                  sessionLogs.map((log, index) => (
                    <div
                      key={`${log}-${index}`}
                      className="rounded-xl bg-slate-900 p-4 text-sm leading-6 text-slate-200 whitespace-pre-wrap"
                    >
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-6 border-t border-white/10 pt-6">
              <h3 className="text-sm font-semibold text-slate-300">Progress Summary</h3>
              <div className="mt-3 min-h-[240px] rounded-xl bg-slate-900 p-4 text-sm leading-7 text-slate-100 whitespace-pre-wrap">
                {IS_PREMIUM
                  ? progressSummary || "Generate a progress summary after logging sessions."
                  : "🔒 Upgrade to unlock progress tracking, structured summaries, and adaptive next steps."}
              </div>
            </div>

            <a
              href={UPGRADE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block w-full rounded-xl bg-cyan-400 px-4 py-3 text-center font-semibold text-slate-950 hover:brightness-110"
            >
              Upgrade to Full Access
            </a>
          </aside>
        </div>

        <section className="mt-10 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-6">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="text-sm uppercase tracking-[0.2em] text-cyan-100">
                Premium Access
              </div>
              <h2 className="mt-2 text-2xl font-bold">Unlock the full command system.</h2>
              <p className="mt-3 max-w-2xl text-slate-200">
                Get unlimited coaching, session tracking, progress summaries, and adaptive
                plan adjustments built around real results.
              </p>
            </div>

            <a
              href={UPGRADE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-cyan-400 px-5 py-3 text-center font-semibold text-slate-950 hover:brightness-110"
            >
              Upgrade Now
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
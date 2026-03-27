"use client";

import { useEffect, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const STORAGE_KEY = "dog-trainer-ai-web-state";
const FREE_MESSAGE_LIMIT = 8;

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
    } catch {
      // ignore bad local data
    }
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
      setMessages([
        ...messages,
        {
          role: "assistant",
          content:
            "🔒 You’ve reached the end of the free coaching preview.\n\nUpgrade to Premium to unlock unlimited coaching, progress tracking, and structured plan adjustments.",
        },
      ]);
      setInput("");
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
          content: "There was an error connecting to Dog Trainer AI.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleLogSession() {
    const trimmed = sessionNote.trim();
    if (!trimmed) return;

    setSessionLogs([trimmed, ...sessionLogs]);
    setSessionNote("");
  }

  async function handleGenerateProgress() {
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
    setMessages([
      {
        role: "assistant",
        content:
          "Tell me your dog’s name and what you want to work on.\n\nExample: My dog Ollie breaks heel when he sees the ball.",
      },
    ]);
    setDogName("");
    setGoalType("");
    setMainGoal("");
    setRewardType("");
    setSkillLevel("");
    setSessionNote("");
    setSessionLogs([]);
    setProgressSummary("");
    setInput("");
    setFreeMessageCount(0);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Train Your Dog</h1>
            <p className="mt-2 text-slate-300">
              Structured coaching plus progress tracking for behavior, obedience, and competition work.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleClearAll}
              className="rounded-xl border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/5"
            >
              Reset
            </button>
            <a
              href="/"
              className="rounded-xl border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/5"
            >
              Back Home
            </a>
          </div>
        </div>

        {!freeLimitReached && (
          <div className="mb-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-4 text-sm text-cyan-100">
            Free messages left: <span className="font-semibold">{freeMessagesLeft}</span>
          </div>
        )}

        {freeLimitReached && (
          <div className="mb-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-5 py-4">
            <div className="text-sm font-semibold text-amber-200">
              🔒 You’ve reached the end of the free coaching preview.
            </div>
            <div className="mt-2 text-sm text-amber-100">
              Upgrade to Premium to unlock unlimited coaching, progress tracking, and evolving training plans.
            </div>
            <a
              href="#pricing"
              className="mt-3 inline-block rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:brightness-110"
            >
              View Upgrade Options
            </a>
          </div>
        )}

        <div className="grid flex-1 gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold">Dog Profile</h2>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm text-slate-300">Dog Name</label>
                <input
                  value={dogName}
                  onChange={(e) => setDogName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none"
                  placeholder="Ollie"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">Goal Type</label>
                <select
                  value={goalType}
                  onChange={(e) => setGoalType(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none"
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
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none"
                  placeholder="Competition heel"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">Primary Reward</label>
                <input
                  value={rewardType}
                  onChange={(e) => setRewardType(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none"
                  placeholder="Ball, food, tug, praise"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">Skill Level</label>
                <select
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none"
                >
                  <option value="">Select level</option>
                  <option value="beginner">Beginner</option>
                  <option value="some training">Some training</option>
                  <option value="competition prep">Competition prep</option>
                </select>
              </div>
            </div>

            <div className="mt-8 border-t border-white/10 pt-6">
              <h3 className="text-base font-semibold">Log Session</h3>

              <textarea
                value={sessionNote}
                onChange={(e) => setSessionNote(e.target.value)}
                placeholder="Example: Ollie held heel for 8 steps but broke when he saw the ball."
                className="mt-3 min-h-[120px] w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500"
              />

              <button
                onClick={handleLogSession}
                className="mt-3 w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 hover:brightness-110"
              >
                Log Session
              </button>

              <button
                onClick={handleGenerateProgress}
                disabled={progressLoading}
                className="mt-3 w-full rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-4 py-3 font-semibold text-cyan-100 hover:bg-cyan-400/20 disabled:opacity-60"
              >
                {progressLoading ? "Generating..." : "Generate Progress Summary"}
              </button>
            </div>
          </aside>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <section className="flex min-h-[70vh] flex-col rounded-2xl border border-white/10 bg-white/5">
              <div className="border-b border-white/10 px-5 py-4">
                <h2 className="text-lg font-semibold">Dog Trainer AI</h2>
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
                    Dog Trainer AI is thinking...
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
                    placeholder="Type your training question here..."
                    className="flex-1 rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                  />
                  <button
                    onClick={handleSend}
                    disabled={loading}
                    className="rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:brightness-110 disabled:opacity-60"
                  >
                    Send
                  </button>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-lg font-semibold">Progress</h2>

              <div className="mt-5">
                <h3 className="text-sm font-semibold text-slate-300">Session Log</h3>
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
                <div className="mt-3 min-h-[220px] rounded-xl bg-slate-900 p-4 text-sm leading-7 text-slate-100 whitespace-pre-wrap">
                  {progressSummary || "Generate a progress summary after logging sessions."}
                </div>
              </div>
            </section>
          </div>
        </div>

        <section id="pricing" className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Upgrade to Premium</h2>
          <p className="mt-3 max-w-2xl text-slate-300">
            Unlock unlimited coaching, progress tracking, and adaptive training plans that evolve as your dog improves.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-slate-900 p-5">
              <h3 className="text-lg font-semibold">Free</h3>
              <p className="mt-2 text-3xl font-bold">$0</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                <li>• 8 coaching messages</li>
                <li>• Session logging</li>
                <li>• Basic web trainer access</li>
              </ul>
            </div>

            <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-5">
              <h3 className="text-lg font-semibold">Premium</h3>
              <p className="mt-2 text-3xl font-bold">$9/mo</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                <li>• Unlimited coaching</li>
                <li>• Full progress tracking</li>
                <li>• Adaptive troubleshooting</li>
                <li>• Behavior + AKC support</li>
              </ul>

              <a
                href="#"
                className="mt-5 inline-block rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 hover:brightness-110"
              >
                Upgrade Now
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
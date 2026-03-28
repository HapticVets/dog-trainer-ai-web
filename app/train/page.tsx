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
      window.open(UPGRADE_URL, "_blank");
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
    if (!IS_PREMIUM) {
      window.open(UPGRADE_URL, "_blank");
      return;
    }

    const trimmed = sessionNote.trim();
    if (!trimmed) return;

    setSessionLogs([trimmed, ...sessionLogs]);
    setSessionNote("");
  }

  async function handleGenerateProgress() {
    if (!IS_PREMIUM) {
      window.open(UPGRADE_URL, "_blank");
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
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Train Your Dog</h1>

          <div className="flex gap-3">
            <button
              onClick={handleClearAll}
              className="rounded-xl border border-white/15 px-4 py-2 text-sm text-slate-200"
            >
              Reset
            </button>

            <a
              href={UPGRADE_URL}
              target="_blank"
              className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950"
            >
              Upgrade
            </a>
          </div>
        </div>

        {!freeLimitReached && (
          <div className="mb-6 rounded-xl bg-cyan-400/10 px-4 py-3 text-sm">
            Free messages left: {freeMessagesLeft}
          </div>
        )}

        {freeLimitReached && (
          <div className="mb-6 rounded-xl bg-red-500/10 px-4 py-3 text-sm">
            🔒 Free limit reached — Upgrade to continue
          </div>
        )}

        <div className="flex-1 space-y-4 overflow-y-auto">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`max-w-2xl rounded-xl p-4 whitespace-pre-wrap ${
                message.role === "user"
                  ? "ml-auto bg-cyan-400 text-black"
                  : "bg-gray-800"
              }`}
            >
              {message.content}
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 rounded-xl bg-gray-800 px-4 py-3"
            placeholder="Ask your training question..."
          />
          <button
            onClick={handleSend}
            className="rounded-xl bg-cyan-400 px-5 py-3 text-black font-semibold"
          >
            Send
          </button>
        </div>

        <div className="mt-8">
          <textarea
            value={sessionNote}
            onChange={(e) => setSessionNote(e.target.value)}
            placeholder="Log session..."
            className="w-full rounded-xl bg-gray-800 p-3"
          />
          <button
            onClick={handleLogSession}
            className="mt-2 w-full rounded-xl bg-cyan-400 py-2 text-black"
          >
            Log Session (Premium)
          </button>

          <button
            onClick={handleGenerateProgress}
            className="mt-2 w-full rounded-xl bg-purple-500 py-2"
          >
            Generate Progress (Premium)
          </button>

          <div className="mt-4 whitespace-pre-wrap">
            {IS_PREMIUM
              ? progressSummary
              : "🔒 Upgrade to unlock progress tracking"}
          </div>
        </div>
      </div>
    </div>
  );
}
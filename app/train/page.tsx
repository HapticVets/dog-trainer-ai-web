"use client";

import { useEffect, useState } from "react";

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
};

export default function TrainPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [premium, setPremium] = useState(false);
  const [freeMessagesUsed, setFreeMessagesUsed] = useState(0);
  const [freeMessagesRemaining, setFreeMessagesRemaining] = useState(8);
  const [accessLoaded, setAccessLoaded] = useState(false);

  const [dogProfile, setDogProfile] = useState<DogProfile>({
    name: "",
    goalType: "",
    mainGoal: "",
    rewardType: "",
    skillLevel: "",
  });

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

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input,
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

  const canChat = premium || freeMessagesRemaining > 0;

  return (
    <main className="min-h-screen bg-[#0b0f17] text-white px-6 py-12">
      <div className="mx-auto max-w-6xl">
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

            <div className="mt-8 grid gap-8 lg:grid-cols-[360px_1fr]">
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
                      className="w-full rounded-lg border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-300">Goal Type</label>
                    <input
                      type="text"
                      value={dogProfile.goalType}
                      onChange={(e) =>
                        setDogProfile({ ...dogProfile, goalType: e.target.value })
                      }
                      className="w-full rounded-lg border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-300">Main Goal</label>
                    <input
                      type="text"
                      value={dogProfile.mainGoal}
                      onChange={(e) =>
                        setDogProfile({ ...dogProfile, mainGoal: e.target.value })
                      }
                      className="w-full rounded-lg border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-300">Reward Type</label>
                    <input
                      type="text"
                      value={dogProfile.rewardType}
                      onChange={(e) =>
                        setDogProfile({ ...dogProfile, rewardType: e.target.value })
                      }
                      className="w-full rounded-lg border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-300">Skill Level</label>
                    <input
                      type="text"
                      value={dogProfile.skillLevel}
                      onChange={(e) =>
                        setDogProfile({ ...dogProfile, skillLevel: e.target.value })
                      }
                      className="w-full rounded-lg border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
                    />
                  </div>
                </div>
              </div>

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
                      Start by describing the dog, the training issue, or the behavior you
                      want to fix.
                    </p>
                  )}

                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={
                          message.role === "user"
                            ? "ml-auto max-w-[85%] rounded-xl bg-cyan-400 px-4 py-3 text-black"
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
                        ? "Describe the behavior issue or training goal..."
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
            </div>
          </>
        )}
      </div>
    </main>
  );
}
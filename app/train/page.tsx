"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type DogProfile = {
  id?: string;
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
};

type SavedOutput = {
  id: string;
  outputType: "progress_report" | "next_session_plan";
  content: string;
  createdAt: string;
};

const emptyDogProfile: DogProfile = {
  name: "",
  goalType: "Obedience",
  mainGoal: "Heel position",
  rewardType: "Food",
  skillLevel: "Beginner",
  customNotes: "",
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
  const [freeMessagesRemaining, setFreeMessagesRemaining] = useState(8);
  const [accessLoaded, setAccessLoaded] = useState(false);

  const [dogProfiles, setDogProfiles] = useState<DogProfile[]>([]);
  const [selectedDogId, setSelectedDogId] = useState<string>("");
  const [dogProfile, setDogProfile] = useState<DogProfile>(emptyDogProfile);
  const [profileSaving, setProfileSaving] = useState(false);

  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>([]);
  const [sessionForm, setSessionForm] = useState({
    date: "",
    duration: "",
    focus: "",
    wins: "",
    issues: "",
  });

  const [progressReport, setProgressReport] = useState("");
  const [reportLoading, setReportLoading] = useState(false);

  const [nextSessionPlan, setNextSessionPlan] = useState("");
  const [nextSessionLoading, setNextSessionLoading] = useState(false);

  const [savedOutputs, setSavedOutputs] = useState<SavedOutput[]>([]);

  useEffect(() => {
    const loadAccess = async () => {
      try {
        const res = await fetch("/api/trainer/access");
        const data = await res.json();

        if (res.ok) {
          setPremium(Boolean(data.premium));
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
    if (!user) return;

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

        const mapped: DogProfile[] = (data.profiles || []).map((profile: any) => ({
          id: profile.id,
          name: profile.name ?? "",
          goalType: profile.goal_type ?? "Obedience",
          mainGoal: profile.main_goal ?? "Heel position",
          rewardType: profile.reward_type ?? "Food",
          skillLevel: profile.skill_level ?? "Beginner",
          customNotes: profile.custom_notes ?? "",
        }));

        setDogProfiles(mapped);

        if (mapped.length > 0) {
          setSelectedDogId(mapped[0].id || "");
          setDogProfile(mapped[0]);
        } else {
          setSelectedDogId("");
          setDogProfile(emptyDogProfile);
        }
      } catch (error) {
        console.error("Failed to load dog profiles:", error);
      }
    };

    loadDogProfiles();
  }, [user]);

  useEffect(() => {
    if (!user || !selectedDogId || !dogProfile.name.trim()) {
      setSessionLogs([]);
      setMessages([]);
      setSavedOutputs([]);
      setProgressReport("");
      setNextSessionPlan("");
      return;
    }

    const loadSessionLogs = async () => {
      try {
        const res = await fetch(
          `/api/session-logs?dog_name=${encodeURIComponent(dogProfile.name)}`,
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

    const loadChats = async () => {
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
          console.error("Failed to load dog chats:", data.error);
          setMessages([]);
          return;
        }

        const mappedMessages: ChatMessage[] = (data.chats || []).map((chat: any) => ({
          role: chat.role,
          content: chat.content,
        }));

        setMessages(mappedMessages);
      } catch (error) {
        console.error("Failed to load dog chats:", error);
        setMessages([]);
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
          setNextSessionPlan("");
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
        const latestNextPlan = mappedOutputs.find(
          (output) => output.outputType === "next_session_plan"
        );

        setProgressReport(latestProgress?.content ?? "");
        setNextSessionPlan(latestNextPlan?.content ?? "");
      } catch (error) {
        console.error("Failed to load dog outputs:", error);
        setSavedOutputs([]);
        setProgressReport("");
        setNextSessionPlan("");
      }
    };

    loadSessionLogs();
    loadChats();
    loadOutputs();
  }, [user, selectedDogId, dogProfile.name]);

  const saveChatMessage = async (role: "user" | "assistant", content: string) => {
    if (!selectedDogId || !content.trim()) return;

    try {
      await fetch("/api/dog-chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dogProfileId: selectedDogId,
          role,
          content,
        }),
      });
    } catch (error) {
      console.error("Failed to save chat message:", error);
    }
  };

  const saveOutput = async (
    outputType: "progress_report" | "next_session_plan",
    content: string
  ) => {
    if (!selectedDogId || !content.trim()) return;

    try {
      const res = await fetch("/api/dog-outputs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dogProfileId: selectedDogId,
          outputType,
          content,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Failed to save output:", data.error);
        return;
      }

      const saved: SavedOutput = {
        id: data.output.id,
        outputType: data.output.output_type,
        content: data.output.content,
        createdAt: data.output.created_at,
      };

      setSavedOutputs((prev) => [saved, ...prev]);
    } catch (error) {
      console.error("Failed to save output:", error);
    }
  };

  const handleSelectDog = (id: string) => {
    setSelectedDogId(id);
    const found = dogProfiles.find((dog) => dog.id === id);
    if (found) {
      setDogProfile(found);
      setProgressReport("");
      setNextSessionPlan("");
      setMessages([]);
      setSavedOutputs([]);
    }
  };

  const handleNewDog = () => {
    setSelectedDogId("");
    setDogProfile(emptyDogProfile);
    setSessionLogs([]);
    setMessages([]);
    setProgressReport("");
    setNextSessionPlan("");
    setSavedOutputs([]);
  };

  const handleSaveDogProfile = async () => {
    if (!user) {
      alert("You must be signed in to save the dog profile.");
      return;
    }

    if (!dogProfile.name.trim()) {
      alert("Dog name is required.");
      return;
    }

    setProfileSaving(true);

    try {
      const res = await fetch("/api/dog-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...dogProfile,
          id: selectedDogId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Failed to save dog profile:", data.error);
        alert("Failed to save dog profile.");
        return;
      }

      const saved: DogProfile = {
        id: data.profile.id,
        name: data.profile.name ?? "",
        goalType: data.profile.goal_type ?? "Obedience",
        mainGoal: data.profile.main_goal ?? "Heel position",
        rewardType: data.profile.reward_type ?? "Food",
        skillLevel: data.profile.skill_level ?? "Beginner",
        customNotes: data.profile.custom_notes ?? "",
      };

      setDogProfiles((prev) => {
        const exists = prev.some((dog) => dog.id === saved.id);
        if (exists) {
          return prev.map((dog) => (dog.id === saved.id ? saved : dog));
        }
        return [...prev, saved];
      });

      setSelectedDogId(saved.id || "");
      setDogProfile(saved);

      alert("Dog profile saved.");
    } catch (error) {
      console.error("Failed to save dog profile:", error);
      alert("Failed to save dog profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleDeleteDogProfile = async () => {
    if (!selectedDogId) {
      alert("Select a saved dog first.");
      return;
    }

    const confirmed = window.confirm(
      "Delete this dog profile? Related saved chats and saved outputs will also be removed."
    );

    if (!confirmed) return;

    try {
      const res = await fetch(
        `/api/dog-profile?id=${encodeURIComponent(selectedDogId)}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error("Failed to delete dog profile:", data.error);
        alert("Failed to delete dog profile.");
        return;
      }

      const updated = dogProfiles.filter((dog) => dog.id !== selectedDogId);
      setDogProfiles(updated);

      if (updated.length > 0) {
        setSelectedDogId(updated[0].id || "");
        setDogProfile(updated[0]);
      } else {
        setSelectedDogId("");
        setDogProfile(emptyDogProfile);
      }

      setSessionLogs([]);
      setMessages([]);
      setProgressReport("");
      setNextSessionPlan("");
      setSavedOutputs([]);
    } catch (error) {
      console.error("Failed to delete dog profile:", error);
      alert("Failed to delete dog profile.");
    }
  };

  const handleSend = async () => {
    if (!selectedDogId) {
      alert("Save a dog profile first.");
      return;
    }

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

    await saveChatMessage("user", fullUserInput);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages,
          dogProfile,
          sessionLogs: sessionLogs.slice(0, 10),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const assistantText =
          data.reply ||
          data.error ||
          "You have reached your free limit. Upgrade to continue.";

        setMessages([
          ...nextMessages,
          {
            role: "assistant",
            content: assistantText,
          },
        ]);

        await saveChatMessage("assistant", assistantText);

        if (typeof data.premium === "boolean") {
          setPremium(data.premium);
        }
        if (typeof data.freeMessagesRemaining === "number") {
          setFreeMessagesRemaining(data.freeMessagesRemaining);
        }

        return;
      }

      const assistantText = data.reply || "No response generated.";

      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: assistantText,
        },
      ]);

      await saveChatMessage("assistant", assistantText);

      if (typeof data.premium === "boolean") {
        setPremium(data.premium);
      }
      if (typeof data.freeMessagesRemaining === "number") {
        setFreeMessagesRemaining(data.freeMessagesRemaining);
      }
    } catch (error) {
      console.error("Chat error:", error);

      const assistantText = "Error connecting to Dog Trainer AI.";

      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: assistantText,
        },
      ]);

      await saveChatMessage("assistant", assistantText);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSession = async () => {
    if (!dogProfile.name.trim()) {
      alert("Save a dog profile first.");
      return;
    }

    if (
      !sessionForm.date.trim() ||
      !sessionForm.focus.trim() ||
      !sessionForm.wins.trim() ||
      !sessionForm.issues.trim()
    ) {
      alert("Fill out the session log before saving.");
      return;
    }

    const parsedDuration = sessionForm.duration.trim()
      ? Number.parseInt(sessionForm.duration.replace(/[^\d]/g, ""), 10)
      : null;

    try {
      const res = await fetch("/api/session-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dog_name: dogProfile.name.trim(),
          goal_type: dogProfile.goalType,
          main_goal: dogProfile.mainGoal,
          reward_type: dogProfile.rewardType,
          skill_level: dogProfile.skillLevel,
          custom_notes: dogProfile.customNotes,
          session_date: sessionForm.date,
          duration: Number.isNaN(parsedDuration) ? null : parsedDuration,
          focus: sessionForm.focus,
          wins: sessionForm.wins,
          issues: sessionForm.issues,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Failed to save session log:", data.error);
        alert("Failed to save session log.");
        return;
      }

      const savedLog: SessionLog = {
        id: data.log.id,
        date: data.log.session_date ?? "",
        duration:
          typeof data.log.duration === "number" &&
          !Number.isNaN(data.log.duration)
            ? `${data.log.duration} min`
            : "",
        focus: data.log.focus ?? "",
        wins: data.log.wins ?? "",
        issues: data.log.issues ?? "",
      };

      setSessionLogs((prev) => [savedLog, ...prev]);
      setSessionForm({
        date: "",
        duration: "",
        focus: "",
        wins: "",
        issues: "",
      });
    } catch (error) {
      console.error("Failed to save session log:", error);
      alert("Failed to save session log.");
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      const res = await fetch(`/api/session-logs?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Failed to delete session log:", data.error);
        alert("Failed to delete session log.");
        return;
      }

      setSessionLogs((prev) => prev.filter((log) => log.id !== id));
    } catch (error) {
      console.error("Failed to delete session log:", error);
      alert("Failed to delete session log.");
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedDogId) {
      alert("Save a dog profile first.");
      return;
    }

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
      await saveOutput("progress_report", outputText);

      if (typeof data.premium === "boolean") {
        setPremium(data.premium);
      }
      if (typeof data.freeMessagesRemaining === "number") {
        setFreeMessagesRemaining(data.freeMessagesRemaining);
      }
    } catch (error) {
      console.error("Progress report error:", error);
      const outputText = "Error generating progress report.";
      setProgressReport(outputText);
      await saveOutput("progress_report", outputText);
    } finally {
      setReportLoading(false);
    }
  };

  const handleGenerateNextSessionPlan = async () => {
    if (!selectedDogId) {
      alert("Save a dog profile first.");
      return;
    }

    if (nextSessionLoading) return;

    if (sessionLogs.length === 0) {
      alert("Log at least one session before generating the next session plan.");
      return;
    }

    setNextSessionLoading(true);

    const latestSession = sessionLogs[0];
    const recentHistory = sessionLogs
      .slice(0, 5)
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

    const nextSessionPrompt = `Build the next dog training session plan based on the latest logged session and recent history.

Use this exact format:

SESSION OBJECTIVE
SETUP
WORKING REPS
REWARD RULE
RESET RULE
SUCCESS CRITERIA
WHEN TO STOP
NEXT PROGRESSION

Be direct and specific. Give exact structure, not generic advice.

Dog Name: ${dogProfile.name || "unknown"}
Goal Type: ${dogProfile.goalType || "unknown"}
Main Goal: ${dogProfile.mainGoal || "unknown"}
Reward Type: ${dogProfile.rewardType || "unknown"}
Skill Level: ${dogProfile.skillLevel || "unknown"}
Additional Notes: ${dogProfile.customNotes || "none"}

LATEST SESSION:
Date: ${latestSession.date}
Duration: ${latestSession.duration || "not provided"}
Focus: ${latestSession.focus}
Wins: ${latestSession.wins}
Issues: ${latestSession.issues}

RECENT SESSION HISTORY:
${recentHistory}`;

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
              content: nextSessionPrompt,
            },
          ],
          dogProfile,
          sessionLogs: sessionLogs.slice(0, 10),
        }),
      });

      const data = await res.json();

      const outputText = !res.ok
        ? data.reply ||
          data.error ||
          "Unable to generate the next session plan right now."
        : data.reply || "No next session plan generated.";

      setNextSessionPlan(outputText);
      await saveOutput("next_session_plan", outputText);

      if (typeof data.premium === "boolean") {
        setPremium(data.premium);
      }
      if (typeof data.freeMessagesRemaining === "number") {
        setFreeMessagesRemaining(data.freeMessagesRemaining);
      }
    } catch (error) {
      console.error("Next session plan error:", error);
      const outputText = "Error generating next session plan.";
      setNextSessionPlan(outputText);
      await saveOutput("next_session_plan", outputText);
    } finally {
      setNextSessionLoading(false);
    }
  };

  const canChat = premium || freeMessagesRemaining > 0;
  const availableMainGoals = mainGoalOptions[dogProfile.goalType] || [];
  const savedProgressReports = savedOutputs.filter(
    (output) => output.outputType === "progress_report"
  );
  const savedNextPlans = savedOutputs.filter(
    (output) => output.outputType === "next_session_plan"
  );

  return (
    <main className="min-h-screen bg-[#0b0f17] text-white px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
  <h1 className="text-4xl font-bold">Patriot K9 Command Trainer</h1>

  
</div>

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
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-2xl font-semibold">Dog Profile</h2>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleNewDog}
                        className="rounded-xl border border-white/20 px-4 py-2 font-semibold text-white hover:bg-white/10"
                      >
                        New Dog
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveDogProfile}
                        disabled={profileSaving}
                        className="rounded-xl bg-cyan-400 px-4 py-2 font-semibold text-black hover:brightness-110 disabled:opacity-50"
                      >
                        {profileSaving ? "Saving..." : selectedDogId ? "Update Dog" : "Save Dog"}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="mb-2 block text-sm text-slate-300">Saved Dogs</label>
                      <div className="flex gap-2">
                        <select
                          value={selectedDogId}
                          onChange={(e) => handleSelectDog(e.target.value)}
                          className="w-full rounded-lg border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none"
                        >
                          <option value="">New unsaved dog</option>
                          {dogProfiles.map((dog) => (
                            <option key={dog.id} value={dog.id}>
                              {dog.name}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={handleDeleteDogProfile}
                          disabled={!selectedDogId}
                          className="rounded-xl border border-white/20 px-4 py-2 font-semibold text-white hover:bg-white/10 disabled:opacity-50"
                        >
                          Delete Dog
                        </button>
                      </div>
                    </div>

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
                      <label className="mb-2 block text-sm text-slate-300">Duration</label>
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

                  {savedProgressReports.length > 0 && (
                    <div className="mt-6 space-y-3">
                      <h3 className="text-lg font-semibold">Saved Progress Reports</h3>
                      {savedProgressReports.map((report) => (
                        <button
                          key={report.id}
                          type="button"
                          onClick={() => setProgressReport(report.content)}
                          className="block w-full rounded-xl border border-white/10 bg-[#08111f] p-3 text-left text-sm text-slate-300 hover:bg-white/10"
                        >
                          {new Date(report.createdAt).toLocaleString()}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-2xl font-semibold">Next Session Plan</h2>

                    <button
                      type="button"
                      onClick={handleGenerateNextSessionPlan}
                      disabled={nextSessionLoading || sessionLogs.length === 0 || !canChat}
                      className="cursor-pointer rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-black hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {nextSessionLoading ? "Generating..." : "Generate Next Session Plan"}
                    </button>
                  </div>

                  <p className="mt-3 text-sm text-slate-400">
                    Builds the next training session directly from your most recent logged work.
                  </p>

                  <div className="mt-6 rounded-xl border border-white/10 bg-[#08111f] p-4">
                    {nextSessionPlan ? (
                      <div className="whitespace-pre-wrap text-white">
                        {nextSessionPlan}
                      </div>
                    ) : (
                      <p className="text-slate-400">
                        No next session plan generated yet. Log a session, then generate the next plan.
                      </p>
                    )}
                  </div>

                  {savedNextPlans.length > 0 && (
                    <div className="mt-6 space-y-3">
                      <h3 className="text-lg font-semibold">Saved Next Session Plans</h3>
                      {savedNextPlans.map((plan) => (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => setNextSessionPlan(plan.content)}
                          className="block w-full rounded-xl border border-white/10 bg-[#08111f] p-3 text-left text-sm text-slate-300 hover:bg-white/10"
                        >
                          {new Date(plan.createdAt).toLocaleString()}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                  <h2 className="text-2xl font-semibold">Session History</h2>

                  <div className="mt-6 space-y-4">
                    {sessionLogs.length === 0 && (
                      <p className="text-slate-400">No sessions logged yet for this dog.</p>
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
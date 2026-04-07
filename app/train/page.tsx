"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  outputType: "initial_session_plan" | "next_session_plan";
  content: string;
  createdAt: string;
};

type OnboardingStep = "create" | "generate" | "log" | "done";

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

const sessionFocusOptions = [
  "Heel",
  "Sit",
  "Down",
  "Stay",
  "Recall",
  "Place",
  "Loose leash walking",
  "Engagement",
  "Neutrality",
  "Reactivity work",
  "Public exposure",
  "Impulse control",
  "Toy control",
  "Crate training",
  "Other",
];

const sessionResultOptions = [
  "Excellent",
  "Good",
  "Inconsistent",
  "Poor",
];

const sessionIssueOptions = [
  "None",
  "Breaking command",
  "Lack of focus",
  "Over-arousal",
  "Fear or nerves",
  "Leash pulling",
  "Reactivity",
  "Confusion",
  "Handler timing issue",
  "Other",
];

const sessionDurationOptions = ["5", "10", "15", "20", "30"];

export default function TrainPage() {
  const { user } = useUser();
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [dogProfiles, setDogProfiles] = useState<DogProfile[]>([]);
  const [selectedDogId, setSelectedDogId] = useState<string>("");
  const [dogProfile, setDogProfile] = useState<DogProfile>(emptyDogProfile);
  const [profileSaving, setProfileSaving] = useState(false);

  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>([]);
  const [sessionForm, setSessionForm] = useState({
    date: "",
    duration: "15",
    focus: "Heel",
    result: "Good",
    issue: "None",
    wins: "",
    issues: "",
  });

  const [currentPlan, setCurrentPlan] = useState("");
  const [planLoading, setPlanLoading] = useState(false);
  const [savedOutputs, setSavedOutputs] = useState<SavedOutput[]>([]);
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>("create");

  const hasActiveDog = Boolean(selectedDogId && dogProfile.name.trim());
  const hasSessions = sessionLogs.length > 0;

  const availableMainGoals = useMemo(
    () => mainGoalOptions[dogProfile.goalType] || [],
    [dogProfile.goalType]
  );

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
      setCurrentPlan("");
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
          setCurrentPlan("");
          return;
        }

        const mappedOutputs: SavedOutput[] = (data.outputs || [])
          .filter(
            (output: any) =>
              output.output_type === "initial_session_plan" ||
              output.output_type === "next_session_plan"
          )
          .map((output: any) => ({
            id: output.id,
            outputType: output.output_type,
            content: output.content,
            createdAt: output.created_at,
          }));

        setSavedOutputs(mappedOutputs);

        const latestPlan = mappedOutputs[0];
        setCurrentPlan(latestPlan?.content ?? "");
      } catch (error) {
        console.error("Failed to load dog outputs:", error);
        setSavedOutputs([]);
        setCurrentPlan("");
      }
    };

    loadSessionLogs();
    loadChats();
    loadOutputs();
  }, [user, selectedDogId, dogProfile.name]);

  useEffect(() => {
    if (!hasActiveDog) {
      setOnboardingStep("create");
    } else if (hasActiveDog && sessionLogs.length === 0 && !currentPlan) {
      setOnboardingStep("generate");
    } else if (hasActiveDog && currentPlan && sessionLogs.length === 0) {
      setOnboardingStep("log");
    } else {
      setOnboardingStep("done");
    }
  }, [hasActiveDog, sessionLogs.length, currentPlan]);

  useEffect(() => {
    if (!messages.length) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === "assistant" && chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

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
    content: string,
    outputType: "initial_session_plan" | "next_session_plan"
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
      setCurrentPlan("");
      setMessages([]);
      setSavedOutputs([]);
    }
  };

  const handleAddDog = () => {
    setSelectedDogId("");
    setDogProfile(emptyDogProfile);
    setSessionLogs([]);
    setMessages([]);
    setCurrentPlan("");
    setSavedOutputs([]);
    setSessionForm({
      date: "",
      duration: "15",
      focus: "Heel",
      result: "Good",
      issue: "None",
      wins: "",
      issues: "",
    });
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
      setCurrentPlan("");
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

    const userMessage: ChatMessage = {
      role: "user",
      content: input.trim(),
    };

    const nextMessages: ChatMessage[] = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    await saveChatMessage("user", userMessage.content);

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

      const assistantText = data.reply || "No response generated.";
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: assistantText,
      };

      setMessages([...nextMessages, assistantMessage]);
      await saveChatMessage("assistant", assistantText);
    } catch (error) {
      console.error("Chat error:", error);

      const assistantText = "Error connecting to the AI training assistant.";
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: assistantText,
      };

      setMessages([...nextMessages, assistantMessage]);
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

    if (!sessionForm.date.trim() || !sessionForm.wins.trim()) {
      alert("Fill out the session log before saving.");
      return;
    }

    const parsedDuration = Number.parseInt(sessionForm.duration, 10);

    const issueSummary =
      sessionForm.issue === "None"
        ? "No major issue noted."
        : sessionForm.issues.trim()
        ? `${sessionForm.issue}. ${sessionForm.issues.trim()}`
        : sessionForm.issue;

    const winsSummary = `${sessionForm.result}. ${sessionForm.wins.trim()}`;

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
          wins: winsSummary,
          issues: issueSummary,
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
          typeof data.log.duration === "number" && !Number.isNaN(data.log.duration)
            ? `${data.log.duration} min`
            : "",
        focus: data.log.focus ?? "",
        wins: data.log.wins ?? "",
        issues: data.log.issues ?? "",
      };

      setSessionLogs((prev) => [savedLog, ...prev]);
      setSessionForm({
        date: "",
        duration: "15",
        focus: "Heel",
        result: "Good",
        issue: "None",
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

  const handleGenerateFirstSession = async () => {
    if (!selectedDogId) {
      alert("Save a dog profile first.");
      return;
    }

    if (planLoading) return;

    setPlanLoading(true);

    const firstSessionPrompt = `Build the first structured dog training session for this dog.

CRITICAL RULES:
- There is no session history yet.
- Use the dog profile as the starting point.
- Do not pretend prior work happened.
- Build a realistic first working session based on current skill level, goal, and reward type.
- Be specific and executable.

Use this exact format:

SESSION OBJECTIVE
WHY THIS SESSION
SETUP
WORKING REPS
REWARD RULE
RESET RULE
SUCCESS CRITERIA
WHEN TO STOP
NEXT PROGRESSION
CURRENT PHASE
PRIMARY C
SESSION TYPE
PROGRESSION LOGIC

Dog Name: ${dogProfile.name || "unknown"}
Goal Type: ${dogProfile.goalType || "unknown"}
Main Goal: ${dogProfile.mainGoal || "unknown"}
Reward Type: ${dogProfile.rewardType || "unknown"}
Skill Level: ${dogProfile.skillLevel || "unknown"}
Additional Notes: ${dogProfile.customNotes || "none"}`;

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
              content: firstSessionPrompt,
            },
          ],
          dogProfile,
          sessionLogs: [],
        }),
      });

      const data = await res.json();
      const outputText = data.reply || "No first session generated.";

      setCurrentPlan(outputText);
      await saveOutput(outputText, "initial_session_plan");
    } catch (error) {
      console.error("First session error:", error);
      setCurrentPlan("Error generating first session.");
    } finally {
      setPlanLoading(false);
    }
  };

  const handleGenerateNextSessionPlan = async () => {
    if (!selectedDogId) {
      alert("Save a dog profile first.");
      return;
    }

    if (planLoading) return;

    if (sessionLogs.length === 0) {
      alert("Log at least one session before generating the next session.");
      return;
    }

    setPlanLoading(true);

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

    const nextSessionPrompt = `Build the next dog training session plan.

CRITICAL RULES:
- The latest session is the primary source of current dog state.
- If the latest session conflicts with the dog profile, trust the latest session.
- Use recent session history only to detect patterns.
- Progress directly from the latest session result.
- Reference the latest session wins and issues specifically.
- Do not give generic advice.

Use this exact format:

SESSION OBJECTIVE
WHY THIS SESSION
SETUP
WORKING REPS
REWARD RULE
RESET RULE
SUCCESS CRITERIA
WHEN TO STOP
NEXT PROGRESSION
CURRENT PHASE
PRIMARY C
SESSION TYPE
PROGRESSION LOGIC

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
      const outputText = data.reply || "No next session generated.";

      setCurrentPlan(outputText);
      await saveOutput(outputText, "next_session_plan");
    } catch (error) {
      console.error("Next session plan error:", error);
      setCurrentPlan("Error generating next session.");
    } finally {
      setPlanLoading(false);
    }
  };

  const savedPlans = savedOutputs.filter(
    (output) =>
      output.outputType === "initial_session_plan" ||
      output.outputType === "next_session_plan"
  );

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
                Training Control Center
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-neutral-300">
                Save a dog, generate the first session, log what happened, then build the next session from real results.
              </p>
            </div>

            <div
              className={`rounded border px-6 py-4 text-sm ${
                hasActiveDog
                  ? "border-amber-500/40 bg-amber-400/15 text-amber-200 shadow-[0_0_0_1px_rgba(251,191,36,0.08)]"
                  : "border-neutral-800 bg-black/30 text-neutral-400"
              }`}
            >
              {hasActiveDog ? (
                <>
                  <span className="font-semibold">Active Dog:</span> {dogProfile.name}
                </>
              ) : (
                "No active dog selected"
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-6">
        {onboardingStep !== "done" && (
          <div className="rounded border border-amber-500/30 bg-amber-400/10 p-6">
            {onboardingStep === "create" && (
              <>
                <p className="text-sm uppercase tracking-[0.2em] text-amber-300">
                  Step 1
                </p>
                <h2 className="mt-2 text-2xl font-bold">
                  Create Your Dog Profile
                </h2>
                <p className="mt-2 text-neutral-300">
                  Start by entering your dog’s name, goal, and training level.
                </p>
              </>
            )}

            {onboardingStep === "generate" && (
              <>
                <p className="text-sm uppercase tracking-[0.2em] text-amber-300">
                  Step 2
                </p>
                <h2 className="mt-2 text-2xl font-bold">
                  Generate Your First Training Session
                </h2>
                <p className="mt-2 text-neutral-300">
                  Now build your dog’s first structured session.
                </p>
              </>
            )}

            {onboardingStep === "log" && (
              <>
                <p className="text-sm uppercase tracking-[0.2em] text-amber-300">
                  Step 3
                </p>
                <h2 className="mt-2 text-2xl font-bold">
                  Log Your First Session
                </h2>
                <p className="mt-2 text-neutral-300">
                  Record what happened so the next session can be built correctly.
                </p>
              </>
            )}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-6 py-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div
            className={`rounded border p-5 ${
              onboardingStep === "create"
                ? "border-amber-500/30 bg-amber-400/10"
                : "border-neutral-800 bg-black/30"
            }`}
          >
            <p className="text-xs uppercase tracking-[0.2em] text-amber-400">Step 1</p>
            <h2 className="mt-2 text-xl font-semibold">Save Dog Profile</h2>
            <p className="mt-2 text-neutral-400">
              Enter the dog’s goal, reward type, skill level, and notes.
            </p>
          </div>

          <div
            className={`rounded border p-5 ${
              onboardingStep === "generate"
                ? "border-amber-500/30 bg-amber-400/10"
                : "border-neutral-800 bg-black/30"
            }`}
          >
            <p className="text-xs uppercase tracking-[0.2em] text-amber-400">Step 2</p>
            <h2 className="mt-2 text-xl font-semibold">Generate First Session</h2>
            <p className="mt-2 text-neutral-400">
              Start with a structured first session based on the dog profile.
            </p>
          </div>

          <div
            className={`rounded border p-5 ${
              onboardingStep === "log"
                ? "border-amber-500/30 bg-amber-400/10"
                : "border-neutral-800 bg-black/30"
            }`}
          >
            <p className="text-xs uppercase tracking-[0.2em] text-amber-400">Step 3</p>
            <h2 className="mt-2 text-xl font-semibold">Log and Progress</h2>
            <p className="mt-2 text-neutral-400">
              Log the real session outcome, then generate the next step from actual results.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16 pt-8">
        <div className="grid gap-8 xl:grid-cols-[380px_1fr]">
          <div className="space-y-8">
            <section className="rounded-lg border border-neutral-800 bg-neutral-950 p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-3xl font-bold">Dog Setup</h2>
                  <p className="mt-3 text-neutral-400">
                    Save one dog at a time, then train from that active profile.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddDog}
                    className="rounded border border-neutral-600 px-4 py-3 font-semibold hover:bg-neutral-900"
                  >
                    Add Dog
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDogProfile}
                    disabled={profileSaving}
                    className="rounded bg-amber-400 px-4 py-3 font-semibold text-black disabled:opacity-50"
                  >
                    {profileSaving
                      ? "Saving..."
                      : selectedDogId
                      ? "Update Dog"
                      : "Save Dog"}
                  </button>
                </div>
              </div>

              <div className="mt-6 space-y-5">
                <div>
                  <label className="mb-2 block text-sm text-white">Saved Dogs</label>
                  <div className="flex gap-2">
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

                    <button
                      type="button"
                      onClick={handleDeleteDogProfile}
                      disabled={!selectedDogId}
                      className="rounded border border-neutral-600 px-4 py-3 font-semibold hover:bg-neutral-900 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {hasActiveDog && (
                  <div className="rounded border border-amber-500/40 bg-amber-400/15 p-5 shadow-[0_0_0_1px_rgba(251,191,36,0.08)]">
                    <p className="text-xs uppercase tracking-[0.2em] text-amber-300">
                      Active Dog
                    </p>
                    <p className="mt-3 text-3xl font-bold">{dogProfile.name}</p>
                    <p className="mt-2 text-neutral-300">
                      {dogProfile.goalType} • {dogProfile.mainGoal}
                    </p>
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm text-white">Dog Name</label>
                  <input
                    type="text"
                    value={dogProfile.name}
                    onChange={(e) =>
                      setDogProfile({ ...dogProfile, name: e.target.value })
                    }
                    placeholder="Ex: Henry"
                    className="w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white">Goal Type</label>
                  <select
                    value={dogProfile.goalType}
                    onChange={(e) =>
                      setDogProfile({
                        ...dogProfile,
                        goalType: e.target.value,
                      })
                    }
                    className="w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
                  >
                    {goalTypeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white">Main Goal</label>
                  <select
                    value={dogProfile.mainGoal}
                    onChange={(e) =>
                      setDogProfile({
                        ...dogProfile,
                        mainGoal: e.target.value,
                      })
                    }
                    className="w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
                  >
                    {availableMainGoals.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-sm text-neutral-400">
                    Pick the closest match. Use notes for specifics.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white">Reward Type</label>
                  <select
                    value={dogProfile.rewardType}
                    onChange={(e) =>
                      setDogProfile({
                        ...dogProfile,
                        rewardType: e.target.value,
                      })
                    }
                    className="w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
                  >
                    {rewardTypeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white">Skill Level</label>
                  <select
                    value={dogProfile.skillLevel}
                    onChange={(e) =>
                      setDogProfile({
                        ...dogProfile,
                        skillLevel: e.target.value,
                      })
                    }
                    className="w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
                  >
                    {skillLevelOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white">
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
                    placeholder="Ex: breaks heel when ball appears, strong toy drive, gets vocal around dogs, struggles after 20 feet..."
                    className="min-h-[120px] w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
                  />
                </div>
              </div>
            </section>

            <section
              className={`rounded-lg border p-6 ${
                hasActiveDog
                  ? "border-neutral-800 bg-neutral-950"
                  : "border-neutral-900 bg-black/20 opacity-65"
              }`}
            >
              <h2 className="text-3xl font-bold">Log Session</h2>
              <p className="mt-3 text-neutral-400">
                Log what actually happened so the next session is built from real performance.
              </p>

              {!hasActiveDog && (
                <div className="mt-5 rounded border border-neutral-800 bg-black/40 p-4 text-sm text-neutral-400">
                  This section unlocks after you save or select an active dog.
                </div>
              )}

              {hasActiveDog && (
                <div className="mt-6 space-y-5">
                  <div>
                    <label className="mb-2 block text-sm text-white">Date</label>
                    <input
                      type="date"
                      value={sessionForm.date}
                      onChange={(e) =>
                        setSessionForm({ ...sessionForm, date: e.target.value })
                      }
                      className="w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
                    />
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm text-white">Duration</label>
                      <select
                        value={sessionForm.duration}
                        onChange={(e) =>
                          setSessionForm({ ...sessionForm, duration: e.target.value })
                        }
                        className="w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
                      >
                        {sessionDurationOptions.map((option) => (
                          <option key={option} value={option}>
                            {option} min
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-white">Focus</label>
                      <select
                        value={sessionForm.focus}
                        onChange={(e) =>
                          setSessionForm({ ...sessionForm, focus: e.target.value })
                        }
                        className="w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
                      >
                        {sessionFocusOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm text-white">Result</label>
                      <select
                        value={sessionForm.result}
                        onChange={(e) =>
                          setSessionForm({ ...sessionForm, result: e.target.value })
                        }
                        className="w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
                      >
                        {sessionResultOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-white">Primary Issue</label>
                      <select
                        value={sessionForm.issue}
                        onChange={(e) =>
                          setSessionForm({ ...sessionForm, issue: e.target.value })
                        }
                        className="w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
                      >
                        {sessionIssueOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-white">What improved</label>
                    <textarea
                      value={sessionForm.wins}
                      onChange={(e) =>
                        setSessionForm({ ...sessionForm, wins: e.target.value })
                      }
                      placeholder="Ex: Held heel for 10 clean steps before anticipating ball..."
                      className="min-h-[100px] w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-white">
                      Optional issue details
                    </label>
                    <textarea
                      value={sessionForm.issues}
                      onChange={(e) =>
                        setSessionForm({ ...sessionForm, issues: e.target.value })
                      }
                      placeholder="Ex: Broke position when toy came out at close range..."
                      className="min-h-[100px] w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveSession}
                    disabled={!hasActiveDog || onboardingStep === "create"}
                    className="w-full rounded bg-amber-400 px-5 py-3 font-semibold text-black disabled:opacity-50"
                  >
                    Log Session
                  </button>
                </div>
              )}
            </section>
          </div>

          <div className="space-y-8">
            {!hasActiveDog && (
              <section className="rounded-lg border border-neutral-800 bg-black/20 p-8 text-center">
                <p className="text-sm uppercase tracking-[0.2em] text-amber-400">
                  Locked Until Active Dog
                </p>
                <h2 className="mt-3 text-3xl font-bold">
                  Save or select a dog first
                </h2>
                <p className="mt-3 max-w-2xl mx-auto text-neutral-400">
                  Session generation, AI follow-up help, and session history will appear here after you activate a dog profile.
                </p>
              </section>
            )}

            {hasActiveDog && (
              <>
                <section className="rounded-lg border border-neutral-800 bg-neutral-950 p-6">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h2 className="text-3xl font-bold">Session Generator</h2>
                      <p className="mt-3 text-neutral-400">
                        Start with a first session if the dog is new. Once you log real work, generate the next session from actual results.
                      </p>
                    </div>

                    <div className="rounded border border-amber-500/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
                      AI-generated training plan
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleGenerateFirstSession}
                      disabled={!hasActiveDog || hasSessions || planLoading || onboardingStep === "create"}
                      className="rounded bg-amber-400 px-5 py-3 font-semibold text-black disabled:opacity-50"
                    >
                      {planLoading && !hasSessions ? "Generating..." : "Generate First Session"}
                    </button>

                    <button
                      type="button"
                      onClick={handleGenerateNextSessionPlan}
                      disabled={!hasActiveDog || !hasSessions || planLoading || onboardingStep !== "done"}
                      className="rounded border border-neutral-600 px-5 py-3 font-semibold hover:bg-neutral-900 disabled:opacity-50"
                    >
                      {planLoading && hasSessions ? "Generating..." : "Generate Next Session"}
                    </button>
                  </div>

                  {!hasSessions && (
                    <p className="mt-4 text-sm text-neutral-400">
                      No session logs yet. Start by generating the first session for this dog.
                    </p>
                  )}

                  {hasSessions && (
                    <p className="mt-4 text-sm text-neutral-400">
                      Session history found. Generate the next session from the latest logged work.
                    </p>
                  )}

                  <div className="mt-6 rounded-lg border border-neutral-800 bg-black p-4">
                    {currentPlan ? (
                      <div className="whitespace-pre-wrap text-white">{currentPlan}</div>
                    ) : (
                      <p className="text-neutral-400">
                        No session plan generated yet.
                      </p>
                    )}
                  </div>

                  {savedPlans.length > 0 && (
                    <div className="mt-6 space-y-3">
                      <h3 className="text-xl font-semibold">Saved Session Plans</h3>
                      {savedPlans.map((plan) => (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => setCurrentPlan(plan.content)}
                          className="block w-full rounded border border-neutral-800 bg-black p-3 text-left text-sm text-neutral-300 hover:bg-neutral-900"
                        >
                          {plan.outputType === "initial_session_plan"
                            ? "First Session"
                            : "Next Session"}{" "}
                          • {new Date(plan.createdAt).toLocaleString()}
                        </button>
                      ))}
                    </div>
                  )}
                </section>

                <section className="rounded-lg border border-neutral-800 bg-neutral-950 p-6">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h2 className="text-3xl font-bold">AI Training Assistant</h2>
                      <p className="mt-3 text-neutral-400">
                        Ask follow-up questions about the active dog, current session plan, or recent training history.
                      </p>
                    </div>

                    <div className="rounded border border-neutral-700 bg-black/30 px-4 py-3 text-sm text-neutral-300">
                      AI assistant, not a live trainer
                    </div>
                  </div>

                  <div className="mt-5 rounded border border-amber-500/30 bg-amber-400/10 p-4">
                    <p className="text-sm font-semibold text-amber-300">
                      Need help from a real trainer?
                    </p>
                    <p className="mt-2 text-sm text-neutral-300">
                      Join the{" "}
                      <a
                        href="https://discord.gg/7Et6UU8M67"
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-amber-400 underline underline-offset-4 hover:text-amber-300"
                      >
                        Das Muller Discord Server
                      </a>{" "}
                      to ask questions, get direct feedback, and connect with the kennel community.
                    </p>
                  </div>

                  <div className="mt-6 rounded-lg border border-neutral-800 bg-black p-4">
                    <div
                      ref={chatContainerRef}
                      className="max-h-[420px] space-y-4 overflow-y-auto pr-2"
                    >
                      {messages.length === 0 && (
                        <p className="text-neutral-400">
                          No chat history yet. Use the session generator first, or ask a dog-specific training question.
                        </p>
                      )}

                      {messages.map((message, index) => (
                        <div
                          key={`${message.role}-${index}`}
                          className={`max-w-[85%] whitespace-pre-wrap rounded px-4 py-3 ${
                            message.role === "user"
                              ? "ml-auto bg-amber-400 text-black"
                              : "mr-auto bg-neutral-900 text-white"
                          }`}
                        >
                          {message.content}
                        </div>
                      ))}

                      {loading && (
                        <div className="mr-auto max-w-[85%] rounded bg-neutral-900 px-4 py-3 text-neutral-300">
                          Thinking...
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask your AI training question here..."
                      disabled={loading || !hasActiveDog}
                      className="min-h-[90px] flex-1 rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none disabled:opacity-50"
                    />

                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={loading || !input.trim() || !hasActiveDog}
                      className="self-end rounded bg-amber-400 px-6 py-3 font-semibold text-black disabled:opacity-50"
                    >
                      Send
                    </button>
                  </div>
                </section>

                <section className="rounded-lg border border-neutral-800 bg-neutral-950 p-6">
                  <h2 className="text-3xl font-bold">Session History</h2>

                  <div className="mt-6 space-y-4">
                    {sessionLogs.length === 0 && (
                      <p className="text-neutral-400">No sessions logged yet for this dog.</p>
                    )}

                    {sessionLogs.map((log, index) => (
                      <div
                        key={log.id}
                        className={`rounded-lg border p-4 ${
                          index === 0
                            ? "border-amber-500/30 bg-amber-400/10"
                            : "border-neutral-800 bg-black"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            {index === 0 && (
                              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-amber-300">
                                Latest Session
                              </p>
                            )}

                            <h3 className="text-xl font-semibold">
                              {log.date} {log.duration ? `• ${log.duration}` : ""}
                            </h3>
                            <p className="mt-2 text-sm text-neutral-300">
                              <strong>Focus:</strong> {log.focus}
                            </p>
                            <p className="mt-2 text-sm text-neutral-300">
                              <strong>Wins:</strong> {log.wins}
                            </p>
                            <p className="mt-2 text-sm text-neutral-300">
                              <strong>Issues:</strong> {log.issues}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteSession(log.id)}
                            className="rounded border border-neutral-700 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-900"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
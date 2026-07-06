"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
  getAvailableMainGoals,
  getDefaultMainGoal,
  goalTypeOptions,
} from "@/lib/dogGoals";
import {
  buildDogCaseFileContext,
  durationOptions,
  emptyDogCaseFile,
  ensurePrimaryPriority,
  equipmentOptions,
  homeEnvironmentOptions,
  hydrateDogCaseFile,
  previousTrainingOptions,
  serializeDogCaseFile,
  severityOptions,
  sexOptions,
  toggleMultiValue,
  type DogCaseFile,
  whereItHappensOptions,
} from "@/lib/dogCaseFile";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
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
type EvaluationStep = 1 | 2 | 3 | 4 | 5 | 6;
type TrainingWorkflowState =
  | "no_dog"
  | "case_file_complete"
  | "plan_ready_to_log"
  | "progressing";

type PlanSection = {
  label: string;
  content: string;
};

const rewardTypeOptions = ["Food", "Toy", "Ball", "Food and Toy", "Praise"];

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

const sessionResultOptions = ["Excellent", "Good", "Inconsistent", "Poor"];

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

const planSectionDefinitions = [
  ["SESSION OBJECTIVE", "Objective"],
  ["WHY THIS SESSION", "Why This Session"],
  ["SETUP", "Setup"],
  ["WORKING REPS", "Working Reps"],
  ["REWARD RULE", "Reward Rule"],
  ["RESET RULE", "Reset Rule"],
  ["SUCCESS CRITERIA", "Success Criteria"],
  ["WHEN TO STOP", "When to Stop"],
  ["NEXT PROGRESSION", "Next Progression"],
  ["CURRENT PHASE", "Current Phase"],
  ["PRIMARY C", "Primary Cue"],
  ["SESSION TYPE", "Session Type"],
  ["PROGRESSION LOGIC", "Progression Logic"],
] as const;

const evaluationStepTitles: Record<EvaluationStep, string> = {
  1: "Dog Basics",
  2: "Training Goals",
  3: "Problem Details",
  4: "Home & Training History",
  5: "Equipment & Notes",
  6: "Review Case File",
};

const ACTIVE_DOG_STORAGE_KEY = "patriot-k9-active-dog-id";

const parsePlanSections = (plan: string): PlanSection[] => {
  if (!plan.trim()) return [];

  const headings = Object.fromEntries(planSectionDefinitions) as Record<string, string>;
  const lines = plan.split(/\r?\n/);
  const sections: PlanSection[] = [];
  let activeHeading: string | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (!activeHeading) return;

    sections.push({
      label: headings[activeHeading] || activeHeading,
      content: buffer.join("\n").trim(),
    });
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line in headings) {
      flush();
      activeHeading = line;
      buffer = [];
      continue;
    }

    if (!activeHeading) continue;
    buffer.push(rawLine);
  }

  flush();

  return sections.filter((section) => section.content);
};

const getSessionOutcome = (wins: string) => {
  const trimmed = wins.trim();

  if (!trimmed) {
    return {
      result: "Not set",
      winsSummary: "Not set",
    };
  }

  const match = trimmed.match(/^([^.]+)\.\s*(.*)$/);

  if (!match) {
    return {
      result: "Not set",
      winsSummary: trimmed,
    };
  }

  return {
    result: match[1].trim(),
    winsSummary: match[2].trim() || "Not set",
  };
};

export default function TrainPage() {
  const { user } = useUser();
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [dogProfiles, setDogProfiles] = useState<DogCaseFile[]>([]);
  const [selectedDogId, setSelectedDogId] = useState<string>("");
  const [dogProfile, setDogProfile] = useState<DogCaseFile>(emptyDogCaseFile);
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
  const [profileCollapsed, setProfileCollapsed] = useState(false);
  const [historyCollapsed, setHistoryCollapsed] = useState(false);
  const [evaluationMode, setEvaluationMode] = useState(false);
  const [evaluationStep, setEvaluationStep] = useState<EvaluationStep>(1);
  const [previousActiveDogId, setPreviousActiveDogId] = useState<string>("");
  const [previousActiveDogProfile, setPreviousActiveDogProfile] =
    useState<DogCaseFile | null>(null);

  const hasActiveDog = Boolean(selectedDogId && dogProfile.name.trim());
  const hasSessions = sessionLogs.length > 0;
  const hasCurrentPlan = Boolean(currentPlan.trim());
  const latestSession = sessionLogs[0];
  const selectedGoals = dogProfile.selectedGoals;
  const categoryGoalOptions = useMemo(
    () => getAvailableMainGoals(dogProfile.goalType, dogProfile.mainGoal),
    [dogProfile.goalType, dogProfile.mainGoal]
  );
  const parsedCurrentPlan = useMemo(() => parsePlanSections(currentPlan), [currentPlan]);
  const savedPlans = savedOutputs.filter(
    (output) =>
      output.outputType === "initial_session_plan" ||
      output.outputType === "next_session_plan"
  );

  const workflowState: TrainingWorkflowState = !hasActiveDog
    ? "no_dog"
    : hasSessions
    ? "progressing"
    : hasCurrentPlan
    ? "plan_ready_to_log"
    : "case_file_complete";

  const workflowNextAction =
    workflowState === "no_dog"
      ? "Start a new dog evaluation"
      : workflowState === "case_file_complete"
      ? `Generate ${dogProfile.name || "this dog's"} first session`
      : workflowState === "plan_ready_to_log"
      ? "Log today's training session"
      : "Generate the next session or ask AI follow-up";

  const statusCardItems = [
    {
      label: "Case File",
      value: hasActiveDog ? "Complete" : "Not started",
    },
    {
      label: "Current Plan",
      value: hasCurrentPlan ? "Generated" : "Not generated",
    },
    {
      label: "Last Session",
      value: latestSession?.date || "Not logged",
    },
    {
      label: "Next Action",
      value: workflowNextAction,
    },
  ];

  const activeCaseSummaryItems = [
    { label: "Dog name", value: dogProfile.name || "Not set" },
    { label: "Primary priority", value: dogProfile.mainGoal || "Not set" },
    {
      label: "Selected goals",
      value: dogProfile.selectedGoals.join(", ") || "Not set",
    },
    { label: "Severity", value: dogProfile.severity || "Not set" },
    {
      label: "Where it happens",
      value: dogProfile.whereItHappens.join(", ") || "Not set",
    },
    { label: "Skill level", value: dogProfile.skillLevel || "Not set" },
  ];

  const persistActiveDogId = (id?: string) => {
    if (typeof window === "undefined") return;

    if (id) {
      window.localStorage.setItem(ACTIVE_DOG_STORAGE_KEY, id);
      return;
    }

    window.localStorage.removeItem(ACTIVE_DOG_STORAGE_KEY);
  };

  const getPersistedActiveDogId = () => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(ACTIVE_DOG_STORAGE_KEY) ?? "";
  };

  const activateDog = (dog: DogCaseFile | null) => {
    if (!dog?.id) {
      setSelectedDogId("");
      setDogProfile(emptyDogCaseFile);
      persistActiveDogId();
      return;
    }

    setSelectedDogId(dog.id);
    setDogProfile(dog);
    persistActiveDogId(dog.id);
  };

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

        const mapped: DogCaseFile[] = (data.profiles || []).map((profile: any) =>
          hydrateDogCaseFile(profile)
        );

        setDogProfiles(mapped);

        if (mapped.length > 0) {
          const persistedActiveDogId = getPersistedActiveDogId();
          const persistedDog = mapped.find((dog) => dog.id === persistedActiveDogId) ?? null;
          const newestDog = mapped[mapped.length - 1] ?? null;
          activateDog(persistedDog ?? newestDog);
        } else {
          activateDog(null);
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
        setCurrentPlan(mappedOutputs[0]?.content ?? "");
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
    } else if (sessionLogs.length === 0 && !currentPlan) {
      setOnboardingStep("generate");
    } else if (currentPlan && sessionLogs.length === 0) {
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

  useEffect(() => {
    setProfileCollapsed(hasActiveDog);
  }, [hasActiveDog, selectedDogId]);

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
    const found = dogProfiles.find((dog) => dog.id === id);

    if (found) {
      activateDog(found);
      setCurrentPlan("");
      setMessages([]);
      setSavedOutputs([]);
      return;
    }

    activateDog(null);
  };

  const handleAddDog = () => {
    setPreviousActiveDogId(selectedDogId);
    setPreviousActiveDogProfile(selectedDogId ? dogProfile : null);
    setEvaluationMode(true);
    setEvaluationStep(1);
    setProfileCollapsed(false);
    setSelectedDogId("");
    setDogProfile(emptyDogCaseFile);
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

  const handleCancelEvaluation = () => {
    setEvaluationMode(false);
    setEvaluationStep(1);

    if (previousActiveDogId && previousActiveDogProfile) {
      activateDog(previousActiveDogProfile);
      setProfileCollapsed(true);
    } else {
      activateDog(null);
      setProfileCollapsed(false);
    }

    setPreviousActiveDogId("");
    setPreviousActiveDogProfile(null);
  };

  const updateSelectedGoals = (nextGoals: string[]) => {
    const trimmedGoals = nextGoals.slice(0, 3);

    setDogProfile((current) => ({
      ...current,
      selectedGoals: trimmedGoals,
      mainGoal: ensurePrimaryPriority(trimmedGoals, current.mainGoal) || current.mainGoal,
    }));
  };

  const handleToggleGoal = (goal: string) => {
    const nextGoals = toggleMultiValue(selectedGoals, goal, 3);
    if (nextGoals.length === 0) {
      return;
    }
    updateSelectedGoals(nextGoals);
  };

  const handleToggleWhereItHappens = (value: string) => {
    setDogProfile((current) => ({
      ...current,
      whereItHappens: toggleMultiValue(current.whereItHappens, value),
    }));
  };

  const handleToggleEquipment = (value: string) => {
    setDogProfile((current) => ({
      ...current,
      equipmentUsed: toggleMultiValue(current.equipmentUsed, value),
    }));
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
          customNotes: serializeDogCaseFile(dogProfile),
          id: selectedDogId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Failed to save dog profile:", data.error);
        alert("Failed to save dog profile.");
        return;
      }

      const saved: DogCaseFile = {
        ...hydrateDogCaseFile(data.profile),
      };

      setDogProfiles((prev) => {
        const exists = prev.some((dog) => dog.id === saved.id);
        if (exists) {
          return prev.map((dog) => (dog.id === saved.id ? saved : dog));
        }
        return [...prev, saved];
      });

      activateDog(saved);
      setEvaluationMode(false);
      setEvaluationStep(1);
      setPreviousActiveDogId("");
      setPreviousActiveDogProfile(null);
      setProfileCollapsed(true);
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
      const res = await fetch(`/api/dog-profile?id=${encodeURIComponent(selectedDogId)}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Failed to delete dog profile:", data.error);
        alert("Failed to delete dog profile.");
        return;
      }

      const updated = dogProfiles.filter((dog) => dog.id !== selectedDogId);
      setDogProfiles(updated);

      if (updated.length > 0) {
        const persistedActiveDogId = getPersistedActiveDogId();
        const persistedDog =
          updated.find((dog) => dog.id === persistedActiveDogId) ?? null;
        const fallbackDog = updated[updated.length - 1] ?? null;
        activateDog(persistedDog ?? fallbackDog);
      } else {
        activateDog(null);
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
          custom_notes: dogProfile.additionalNotes,
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
- The selected goal may be an owner-stated problem, not a command.
- Translate the selected problem into structured Patriot K9 Command training steps.

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

DOG CASE FILE
${buildDogCaseFileContext(dogProfile)}`;

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

    const currentSession = sessionLogs[0];
    const recentHistory = sessionLogs
      .slice(0, 5)
      .map(
        (log, index) => `Session ${index + 1}
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
- The selected goal may be an owner-stated problem, not a command.
- Translate the selected problem into structured Patriot K9 Command training steps.

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

DOG CASE FILE
${buildDogCaseFileContext(dogProfile)}

LATEST SESSION:
Date: ${currentSession.date}
Duration: ${currentSession.duration || "not provided"}
Focus: ${currentSession.focus}
Wins: ${currentSession.wins}
Issues: ${currentSession.issues}

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

  const goToPreviousEvaluationStep = () => {
    setEvaluationStep((current) => (current > 1 ? ((current - 1) as EvaluationStep) : current));
  };

  const goToNextEvaluationStep = () => {
    setEvaluationStep((current) => (current < 6 ? ((current + 1) as EvaluationStep) : current));
  };

  const reviewSummaryItems = [
    { label: "Dog name", value: dogProfile.name || "Not set" },
    {
      label: "Breed / age",
      value: [dogProfile.breed, dogProfile.age].filter(Boolean).join(" / ") || "Not set",
    },
    { label: "Primary priority", value: dogProfile.mainGoal || "Not set" },
    {
      label: "Selected goals",
      value: dogProfile.selectedGoals.join(", ") || "Not set",
    },
    { label: "Severity", value: dogProfile.severity || "Not set" },
    { label: "Duration", value: dogProfile.issueDuration || "Not set" },
    {
      label: "Where it happens",
      value: dogProfile.whereItHappens.join(", ") || "Not set",
    },
    {
      label: "Equipment used",
      value: dogProfile.equipmentUsed.join(", ") || "Not set",
    },
    {
      label: "Owner success goal",
      value: dogProfile.successLooksLike || "Not set",
    },
  ];

  const evaluationWizardContent = (
    <div className="mt-6 space-y-6">
      <div className="rounded-lg border border-neutral-800 bg-black/30 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-amber-400">
              Step {evaluationStep} of 6
            </p>
            <h2 className="mt-2 text-2xl font-bold">{evaluationStepTitles[evaluationStep]}</h2>
          </div>
          <button
            type="button"
            onClick={handleCancelEvaluation}
            className="w-full rounded border border-neutral-600 px-4 py-3 font-semibold hover:bg-neutral-900 sm:w-auto"
          >
            Back to Training Center
          </button>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-900">
          <div
            className="h-full rounded-full bg-amber-400 transition-all"
            style={{ width: `${(evaluationStep / 6) * 100}%` }}
          />
        </div>
      </div>

      {evaluationStep === 1 && (
        <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm text-white">Dog Name</label>
              <input
                type="text"
                value={dogProfile.name}
                onChange={(e) => setDogProfile({ ...dogProfile, name: e.target.value })}
                placeholder="Ex: Henry"
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-white">Breed</label>
              <input
                type="text"
                value={dogProfile.breed}
                onChange={(e) => setDogProfile({ ...dogProfile, breed: e.target.value })}
                placeholder="Ex: German Shepherd"
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-white">Age</label>
              <input
                type="text"
                value={dogProfile.age}
                onChange={(e) => setDogProfile({ ...dogProfile, age: e.target.value })}
                placeholder="Ex: 18 months"
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-white">Sex</label>
              <select
                value={dogProfile.sex}
                onChange={(e) => setDogProfile({ ...dogProfile, sex: e.target.value })}
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
              >
                {sexOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm text-white">Weight</label>
              <input
                type="text"
                value={dogProfile.weight}
                onChange={(e) => setDogProfile({ ...dogProfile, weight: e.target.value })}
                placeholder="Ex: 62 lb"
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {evaluationStep === 2 && (
        <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-5 sm:p-6">
          <div>
            <label className="mb-2 block text-sm text-white">Goal Category</label>
            <select
              value={dogProfile.goalType}
              onChange={(e) => {
                const nextGoalType = e.target.value;
                const defaultGoal = getDefaultMainGoal(nextGoalType);

                setDogProfile({
                  ...dogProfile,
                  goalType: nextGoalType,
                  mainGoal: defaultGoal,
                  selectedGoals: [defaultGoal],
                });
              }}
              className="w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
            >
              {goalTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm text-white">Selected goals/problems</label>
            <div className="grid gap-3 sm:grid-cols-2">
              {categoryGoalOptions.map((goal) => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => handleToggleGoal(goal)}
                  aria-pressed={selectedGoals.includes(goal)}
                  className={`rounded border px-4 py-3 text-left text-sm transition ${
                    selectedGoals.includes(goal)
                      ? "border-amber-400 bg-amber-400/15 text-white"
                      : "border-neutral-700 bg-neutral-900 text-neutral-300 hover:border-neutral-500"
                  }`}
                >
                  {goal}
                </button>
              ))}
            </div>
            <p className="mt-3 text-sm text-neutral-400">
              Choose up to three goals. Pick the one that matters most right now.
            </p>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm text-white">Primary Priority</label>
            <select
              value={dogProfile.mainGoal}
              onChange={(e) => setDogProfile({ ...dogProfile, mainGoal: e.target.value })}
              className="w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
            >
              {selectedGoals.map((goal) => (
                <option key={goal} value={goal}>
                  {goal}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {evaluationStep === 3 && (
        <div className="space-y-5 rounded-lg border border-neutral-800 bg-neutral-950 p-5 sm:p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-white">
                How difficult is this problem today?
              </label>
              <select
                value={dogProfile.severity}
                onChange={(e) => setDogProfile({ ...dogProfile, severity: e.target.value })}
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
              >
                {severityOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm text-white">
                How long has this been happening?
              </label>
              <select
                value={dogProfile.issueDuration}
                onChange={(e) =>
                  setDogProfile({
                    ...dogProfile,
                    issueDuration: e.target.value,
                  })
                }
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
              >
                {durationOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-white">Where does this happen most?</label>
            <div className="grid gap-3 sm:grid-cols-2">
              {whereItHappensOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleToggleWhereItHappens(option)}
                  aria-pressed={dogProfile.whereItHappens.includes(option)}
                  className={`rounded border px-4 py-3 text-left text-sm transition ${
                    dogProfile.whereItHappens.includes(option)
                      ? "border-amber-400 bg-amber-400/15 text-white"
                      : "border-neutral-700 bg-neutral-900 text-neutral-300 hover:border-neutral-500"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {evaluationStep === 4 && (
        <div className="space-y-5 rounded-lg border border-neutral-800 bg-neutral-950 p-5 sm:p-6">
          <div>
            <p className="mb-3 text-sm text-white">Household context</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["childrenInHome", "Children in home"],
                ["otherDogsInHome", "Other dogs in home"],
                ["catsOrSmallAnimals", "Cats or small animals in home"],
                ["frequentVisitors", "Frequent visitors"],
              ].map(([field, label]) => (
                <label
                  key={field}
                  className="flex items-center gap-3 rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-neutral-200"
                >
                  <input
                    type="checkbox"
                    checked={dogProfile[field as keyof DogCaseFile] as boolean}
                    onChange={(e) =>
                      setDogProfile({
                        ...dogProfile,
                        [field]: e.target.checked,
                      } as DogCaseFile)
                    }
                    className="h-4 w-4 accent-amber-400"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-white">Home environment</label>
              <select
                value={dogProfile.homeEnvironment}
                onChange={(e) =>
                  setDogProfile({
                    ...dogProfile,
                    homeEnvironment: e.target.value,
                  })
                }
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
              >
                {homeEnvironmentOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm text-white">Previous training</label>
              <select
                value={dogProfile.previousTraining}
                onChange={(e) =>
                  setDogProfile({
                    ...dogProfile,
                    previousTraining: e.target.value,
                  })
                }
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
              >
                {previousTrainingOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm text-white">Reward type</label>
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
              <label className="mb-2 block text-sm text-white">Skill level</label>
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
          </div>
        </div>
      )}

      {evaluationStep === 5 && (
        <div className="space-y-5 rounded-lg border border-neutral-800 bg-neutral-950 p-5 sm:p-6">
          <div>
            <label className="mb-2 block text-sm text-white">Equipment currently used</label>
            <div className="grid gap-3 sm:grid-cols-2">
              {equipmentOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleToggleEquipment(option)}
                  aria-pressed={dogProfile.equipmentUsed.includes(option)}
                  className={`rounded border px-4 py-3 text-left text-sm transition ${
                    dogProfile.equipmentUsed.includes(option)
                      ? "border-amber-400 bg-amber-400/15 text-white"
                      : "border-neutral-700 bg-neutral-900 text-neutral-300 hover:border-neutral-500"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-white">What have you already tried?</label>
            <textarea
              value={dogProfile.triedAlready}
              onChange={(e) =>
                setDogProfile({
                  ...dogProfile,
                  triedAlready: e.target.value,
                })
              }
              placeholder="Ex: front-clip harness, short obedience reps, crate at night, treats on walks..."
              className="min-h-[110px] w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white">What would success look like?</label>
            <textarea
              value={dogProfile.successLooksLike}
              onChange={(e) =>
                setDogProfile({
                  ...dogProfile,
                  successLooksLike: e.target.value,
                })
              }
              placeholder="Ex: calm walks past dogs, settles in crate, comes when called in the yard..."
              className="min-h-[110px] w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white">Additional notes</label>
            <textarea
              value={dogProfile.additionalNotes}
              onChange={(e) =>
                setDogProfile({
                  ...dogProfile,
                  additionalNotes: e.target.value,
                  customNotes: e.target.value,
                })
              }
              placeholder="Ex: gets vocal when the leash comes out, struggles after 20 feet, shuts down in busy public areas..."
              className="min-h-[120px] w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
            />
          </div>
        </div>
      )}

      {evaluationStep === 6 && (
        <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-5 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {reviewSummaryItems.map((item) => (
              <div
                key={item.label}
                className="rounded border border-neutral-800 bg-black/30 p-4"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-amber-400">
                  {item.label}
                </p>
                <p className="mt-3 text-sm leading-7 text-neutral-200">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        {evaluationStep === 1 ? <div /> : (
          <button
            type="button"
            onClick={goToPreviousEvaluationStep}
            className="w-full rounded border border-neutral-600 px-4 py-3 font-semibold hover:bg-neutral-900 sm:w-auto"
          >
            Previous
          </button>
        )}

        {evaluationStep < 6 ? (
          <button
            type="button"
            onClick={goToNextEvaluationStep}
            className="w-full rounded bg-amber-400 px-5 py-3 font-semibold text-black sm:w-auto"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSaveDogProfile}
            disabled={profileSaving}
            className="w-full rounded bg-amber-400 px-5 py-3 font-semibold text-black disabled:opacity-50 sm:w-auto"
          >
            {profileSaving ? "Saving..." : "Save Case File"}
          </button>
        )}
      </div>
    </div>
  );

  const caseFileForm = (
    <div className="mt-6 space-y-5">
      {!evaluationMode && (
        <div>
          <label className="mb-2 block text-sm text-white">Saved Dogs</label>
          <div className="flex flex-col gap-2 sm:flex-row">
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
      )}

      {!evaluationMode && hasActiveDog && (
        <div className="rounded border border-amber-500/40 bg-amber-400/15 p-5 shadow-[0_0_0_1px_rgba(251,191,36,0.08)]">
          <p className="text-xs uppercase tracking-[0.2em] text-amber-300">
            Active Case File
          </p>
          <p className="mt-3 text-3xl font-bold">{dogProfile.name}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <p className="rounded border border-white/10 bg-black/20 px-3 py-2 text-sm text-neutral-200">
              <span className="font-semibold text-white">Primary priority:</span>{" "}
              {dogProfile.mainGoal || "Not set"}
            </p>
            <p className="rounded border border-white/10 bg-black/20 px-3 py-2 text-sm text-neutral-200">
              <span className="font-semibold text-white">Severity:</span>{" "}
              {dogProfile.severity || "Not set"}
            </p>
            <p className="rounded border border-white/10 bg-black/20 px-3 py-2 text-sm text-neutral-200 sm:col-span-2">
              <span className="font-semibold text-white">Where it happens:</span>{" "}
              {dogProfile.whereItHappens.join(", ") || "Not set"}
            </p>
            <p className="rounded border border-white/10 bg-black/20 px-3 py-2 text-sm text-neutral-200 sm:col-span-2">
              <span className="font-semibold text-white">Goals selected:</span>{" "}
              {dogProfile.selectedGoals.join(", ") || "Not set"}
            </p>
          </div>
        </div>
      )}

      {(evaluationMode || !profileCollapsed) && (
        <>
          <div className="rounded-lg border border-neutral-800 bg-black/30 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-400">
              Dog Basics
            </p>
            <p className="mt-2 text-sm text-neutral-400">
              Start the evaluation with the basics you want the trainer to remember.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm text-white">Dog Name</label>
                <input
                  type="text"
                  value={dogProfile.name}
                  onChange={(e) => setDogProfile({ ...dogProfile, name: e.target.value })}
                  placeholder="Ex: Henry"
                  className="w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white">Breed</label>
                <input
                  type="text"
                  value={dogProfile.breed}
                  onChange={(e) => setDogProfile({ ...dogProfile, breed: e.target.value })}
                  placeholder="Ex: German Shepherd"
                  className="w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white">Age</label>
                <input
                  type="text"
                  value={dogProfile.age}
                  onChange={(e) => setDogProfile({ ...dogProfile, age: e.target.value })}
                  placeholder="Ex: 18 months"
                  className="w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white">Sex</label>
                <select
                  value={dogProfile.sex}
                  onChange={(e) => setDogProfile({ ...dogProfile, sex: e.target.value })}
                  className="w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
                >
                  {sexOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white">Weight</label>
                <input
                  type="text"
                  value={dogProfile.weight}
                  onChange={(e) => setDogProfile({ ...dogProfile, weight: e.target.value })}
                  placeholder="Ex: 62 lb"
                  className="w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-neutral-800 bg-black/30 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-400">
              Primary Training Concern
            </p>
            <p className="mt-2 text-sm text-neutral-400">
              Choose the problem or training goal that matters most right now. The AI will translate it into a structured Patriot K9 training plan.
            </p>

            <div className="mt-4">
              <label className="mb-2 block text-sm text-white">Goal Category</label>
              <select
                value={dogProfile.goalType}
                onChange={(e) => {
                  const nextGoalType = e.target.value;
                  const defaultGoal = getDefaultMainGoal(nextGoalType);

                  setDogProfile({
                    ...dogProfile,
                    goalType: nextGoalType,
                    mainGoal: defaultGoal,
                    selectedGoals: [defaultGoal],
                  });
                }}
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
              >
                {goalTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-sm text-neutral-400">
                Start broad, then pick up to three specific problems or training goals inside that category.
              </p>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm text-white">
                What do you want help with first?
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                {categoryGoalOptions.map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => handleToggleGoal(goal)}
                    aria-pressed={selectedGoals.includes(goal)}
                    className={`rounded border px-4 py-3 text-left text-sm transition ${
                      selectedGoals.includes(goal)
                        ? "border-amber-400 bg-amber-400/15 text-white"
                        : "border-neutral-700 bg-neutral-900 text-neutral-300 hover:border-neutral-500"
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-sm text-neutral-400">
                Choose up to three priorities. Every new dog evaluation and every additional dog uses this same full intake flow.
              </p>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm text-white">Primary Priority</label>
              <select
                value={dogProfile.mainGoal}
                onChange={(e) => setDogProfile({ ...dogProfile, mainGoal: e.target.value })}
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
              >
                {selectedGoals.map((goal) => (
                  <option key={goal} value={goal}>
                    {goal}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-lg border border-neutral-800 bg-black/30 p-4">
              <label className="mb-2 block text-sm text-white">Severity</label>
              <select
                value={dogProfile.severity}
                onChange={(e) => setDogProfile({ ...dogProfile, severity: e.target.value })}
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
              >
                {severityOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-lg border border-neutral-800 bg-black/30 p-4">
              <label className="mb-2 block text-sm text-white">Duration</label>
              <select
                value={dogProfile.issueDuration}
                onChange={(e) =>
                  setDogProfile({
                    ...dogProfile,
                    issueDuration: e.target.value,
                  })
                }
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
              >
                {durationOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-lg border border-neutral-800 bg-black/30 p-4">
            <label className="mb-2 block text-sm text-white">Where does it happen?</label>
            <div className="grid gap-3 sm:grid-cols-2">
              {whereItHappensOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleToggleWhereItHappens(option)}
                  aria-pressed={dogProfile.whereItHappens.includes(option)}
                  className={`rounded border px-4 py-3 text-left text-sm transition ${
                    dogProfile.whereItHappens.includes(option)
                      ? "border-amber-400 bg-amber-400/15 text-white"
                      : "border-neutral-700 bg-neutral-900 text-neutral-300 hover:border-neutral-500"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-neutral-800 bg-black/30 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-400">
              Household Context
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ["childrenInHome", "Children in home"],
                ["otherDogsInHome", "Other dogs in home"],
                ["catsOrSmallAnimals", "Cats or small animals in home"],
                ["frequentVisitors", "Frequent visitors"],
              ].map(([field, label]) => (
                <label
                  key={field}
                  className="flex items-center gap-3 rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-neutral-200"
                >
                  <input
                    type="checkbox"
                    checked={dogProfile[field as keyof DogCaseFile] as boolean}
                    onChange={(e) =>
                      setDogProfile({
                        ...dogProfile,
                        [field]: e.target.checked,
                      } as DogCaseFile)
                    }
                    className="h-4 w-4 accent-amber-400"
                  />
                  {label}
                </label>
              ))}
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-sm text-white">Home Environment</label>
              <select
                value={dogProfile.homeEnvironment}
                onChange={(e) =>
                  setDogProfile({
                    ...dogProfile,
                    homeEnvironment: e.target.value,
                  })
                }
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
              >
                {homeEnvironmentOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-lg border border-neutral-800 bg-black/30 p-4">
              <label className="mb-2 block text-sm text-white">Previous Training</label>
              <select
                value={dogProfile.previousTraining}
                onChange={(e) =>
                  setDogProfile({
                    ...dogProfile,
                    previousTraining: e.target.value,
                  })
                }
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
              >
                {previousTrainingOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-lg border border-neutral-800 bg-black/30 p-4">
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
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-lg border border-neutral-800 bg-black/30 p-4">
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
          </div>

          <div className="rounded-lg border border-neutral-800 bg-black/30 p-4">
            <label className="mb-2 block text-sm text-white">Equipment currently used</label>
            <div className="grid gap-3 sm:grid-cols-2">
              {equipmentOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleToggleEquipment(option)}
                  aria-pressed={dogProfile.equipmentUsed.includes(option)}
                  className={`rounded border px-4 py-3 text-left text-sm transition ${
                    dogProfile.equipmentUsed.includes(option)
                      ? "border-amber-400 bg-amber-400/15 text-white"
                      : "border-neutral-700 bg-neutral-900 text-neutral-300 hover:border-neutral-500"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-neutral-800 bg-black/30 p-4">
            <label className="mb-2 block text-sm text-white">What have you already tried?</label>
            <textarea
              value={dogProfile.triedAlready}
              onChange={(e) =>
                setDogProfile({
                  ...dogProfile,
                  triedAlready: e.target.value,
                })
              }
              placeholder="Ex: front-clip harness, short obedience reps, crate at night, treats on walks..."
              className="min-h-[110px] w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
            />
          </div>

          <div className="rounded-lg border border-neutral-800 bg-black/30 p-4">
            <label className="mb-2 block text-sm text-white">What would success look like?</label>
            <textarea
              value={dogProfile.successLooksLike}
              onChange={(e) =>
                setDogProfile({
                  ...dogProfile,
                  successLooksLike: e.target.value,
                })
              }
              placeholder="Ex: calm walks past dogs, settles in crate, comes when called in the yard..."
              className="min-h-[110px] w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
            />
          </div>

          <div className="rounded-lg border border-neutral-800 bg-black/30 p-4">
            <label className="mb-2 block text-sm text-white">Additional Notes</label>
            <textarea
              value={dogProfile.additionalNotes}
              onChange={(e) =>
                setDogProfile({
                  ...dogProfile,
                  additionalNotes: e.target.value,
                  customNotes: e.target.value,
                })
              }
              placeholder="Ex: gets vocal when the leash comes out, struggles after 20 feet, shuts down in busy public areas..."
              className="min-h-[120px] w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
            />
          </div>
        </>
      )}
    </div>
  );

  return (
    <main className="min-h-screen overflow-x-hidden bg-neutral-950 text-white">
      <section className="border-b border-neutral-800">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
                Patriot K9 Command
              </p>
              <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl md:text-6xl">
                {evaluationMode ? "Start New Dog Evaluation" : "Training Control Center"}
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-neutral-300">
                {evaluationMode
                  ? "Build a case file for this dog so the AI can create a structured Patriot K9 training plan."
                  : "Save a dog, generate the first session, log what happened, then build the next session from real results."}
              </p>
            </div>

            {!evaluationMode && (
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
            )}
          </div>
        </div>
      </section>

      {evaluationMode ? (
        <section className="mx-auto max-w-4xl px-4 pb-12 pt-8 sm:px-6 sm:pb-16 sm:pt-10">
          <section className="rounded-lg border border-neutral-800 bg-neutral-950 p-5 sm:p-6">
            {evaluationWizardContent}
          </section>
        </section>
      ) : (
        <>
      <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6">
        <div className="rounded-lg border border-neutral-800 bg-black/40 p-5 sm:p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-amber-400">
            Training Status
          </p>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
            Next relevant action
          </h2>
          <p className="mt-2 text-neutral-400">
            The trainer now guides the active dog forward one clear step at a time.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {statusCardItems.map((item) => (
              <div
                key={item.label}
                className="rounded border border-neutral-800 bg-neutral-950 p-4"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                  {item.label}
                </p>
                <p className="mt-3 text-sm font-semibold text-white sm:text-base">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 sm:pb-16 sm:pt-8">
        <div className="grid gap-6 xl:grid-cols-[380px_1fr] xl:gap-8">
          <div className="space-y-8">
            <section className="rounded-lg border border-neutral-800 bg-neutral-950 p-5 sm:p-6">
              <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
                <div>
                  <h2 className="text-2xl font-bold sm:text-3xl">Dog Case File</h2>
                  <p className="mt-3 text-neutral-400">
                    Tell us the dog problem you want solved first. The AI will translate owner-friendly concerns into a structured Patriot K9 training plan.
                  </p>
                </div>

                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  {hasActiveDog && (
                    <button
                      type="button"
                      onClick={() => setProfileCollapsed((prev) => !prev)}
                      className="w-full rounded border border-neutral-600 px-4 py-3 font-semibold hover:bg-neutral-900 sm:w-auto"
                    >
                      {profileCollapsed ? "View / Edit Case File" : "Hide Case File"}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleAddDog}
                    className="w-full rounded border border-neutral-600 px-4 py-3 font-semibold hover:bg-neutral-900 sm:w-auto"
                  >
                    Start New Dog Evaluation
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveDogProfile}
                    disabled={profileSaving}
                    className="w-full rounded bg-amber-400 px-4 py-3 font-semibold text-black disabled:opacity-50 sm:w-auto"
                  >
                    {profileSaving
                      ? "Saving..."
                      : selectedDogId
                      ? "Update Case File"
                      : "Save Case File"}
                  </button>
                </div>
              </div>

              {dogProfiles.length === 0 && !hasActiveDog && (
                <div className="mt-6 rounded-lg border border-amber-500/30 bg-amber-400/10 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-amber-300">
                    Start Here
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold">
                    Start Your First Dog Evaluation
                  </h3>
                  <p className="mt-3 text-neutral-300">
                    Build the first case file with your dog's basics, main concerns, severity, and home context so the AI can coach from a real training picture.
                  </p>
                </div>
              )}

              {caseFileForm}
            </section>

            {(workflowState === "plan_ready_to_log" || workflowState === "progressing") && (
              <section className="rounded-lg border border-neutral-800 bg-neutral-950 p-5 sm:p-6">
                <h2 className="text-2xl font-bold sm:text-3xl">Log Today's Training Session</h2>
                <p className="mt-3 text-neutral-400">
                  Record what actually happened so the next session is built from real performance.
                </p>

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
                    disabled={!hasActiveDog}
                    className="w-full rounded bg-amber-400 px-5 py-3 font-semibold text-black disabled:opacity-50"
                  >
                    Log Session
                  </button>
                </div>
              </section>
            )}
          </div>

          <div className="space-y-8">
            {workflowState === "no_dog" && (
              <section className="rounded-lg border border-neutral-800 bg-black/20 p-6 text-center sm:p-8">
                <p className="text-sm uppercase tracking-[0.2em] text-amber-400">
                  Start Here
                </p>
                <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
                  Start your first dog evaluation
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-neutral-400">
                  Start your first dog evaluation to build a case file and generate a structured training plan.
                </p>
                <button
                  type="button"
                  onClick={handleAddDog}
                  className="mt-6 rounded bg-amber-400 px-6 py-3 font-semibold text-black"
                >
                  Start New Dog Evaluation
                </button>
              </section>
            )}

            {workflowState === "case_file_complete" && (
              <section className="rounded-lg border border-amber-500/30 bg-amber-400/10 p-6 sm:p-8">
                <p className="text-sm uppercase tracking-[0.2em] text-amber-300">
                  Case File Complete
                </p>
                <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
                  {dogProfile.name}'s case file is ready
                </h2>
                <p className="mt-3 text-neutral-300">
                  Review the current case summary, then generate the first structured training session.
                </p>

                <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {activeCaseSummaryItems.map((item) => (
                    <div
                      key={item.label}
                      className="rounded border border-white/10 bg-black/25 p-4"
                    >
                      <p className="text-xs uppercase tracking-[0.2em] text-amber-200/80">
                        {item.label}
                      </p>
                      <p className="mt-3 text-sm font-semibold text-white">{item.value}</p>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleGenerateFirstSession}
                  disabled={planLoading || !hasActiveDog}
                  className="mt-6 w-full rounded bg-amber-400 px-6 py-4 font-semibold text-black disabled:opacity-50 sm:w-auto"
                >
                  {planLoading
                    ? "Generating..."
                    : `Generate ${dogProfile.name}'s First Training Session`}
                </button>
              </section>
            )}

            {(workflowState === "plan_ready_to_log" || workflowState === "progressing") && (
              <>
                <section className="rounded-lg border border-neutral-800 bg-neutral-950 p-5 sm:p-6">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold sm:text-3xl">Current Training Plan</h2>
                      <p className="mt-3 text-neutral-400">
                        {workflowState === "plan_ready_to_log"
                          ? "Run the current plan, then log what happened so the trainer can progress from real results."
                          : "Review the active plan, log real training results, and then progress to the next session."}
                      </p>
                    </div>

                    <div className="w-full rounded border border-amber-500/30 bg-amber-400/10 px-4 py-3 text-center text-sm text-amber-200 md:w-auto md:text-left">
                      {workflowState === "plan_ready_to_log"
                        ? "Next action: Log today's training session"
                        : "Next action: Generate the next session"}
                    </div>
                  </div>

                  {workflowState === "progressing" && (
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                      <button
                        type="button"
                        onClick={handleGenerateNextSessionPlan}
                        disabled={!hasActiveDog || !hasSessions || planLoading}
                        className="w-full rounded bg-amber-400 px-5 py-3 font-semibold text-black disabled:opacity-50 sm:w-auto"
                      >
                        {planLoading ? "Generating..." : "Generate Next Session"}
                      </button>
                    </div>
                  )}

                  <div className="mt-6 overflow-hidden rounded-lg border border-neutral-800 bg-black p-4 sm:p-5">
                    {currentPlan ? (
                      parsedCurrentPlan.length > 0 ? (
                        <div className="grid gap-4 lg:grid-cols-2">
                          {parsedCurrentPlan.map((section) => (
                            <div
                              key={section.label}
                              className="rounded border border-neutral-800 bg-neutral-950/80 p-4"
                            >
                              <p className="text-xs uppercase tracking-[0.2em] text-amber-400">
                                {section.label}
                              </p>
                              <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-neutral-200">
                                {section.content}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap text-sm leading-7 text-white">
                          {currentPlan}
                        </div>
                      )
                    ) : (
                      <p className="text-neutral-400">No session plan generated yet.</p>
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
                          | {new Date(plan.createdAt).toLocaleString()}
                        </button>
                      ))}
                    </div>
                  )}
                </section>

                {workflowState === "progressing" && (
                <section className="rounded-lg border border-neutral-800 bg-neutral-950 p-5 sm:p-6">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold sm:text-3xl">AI Training Assistant</h2>
                      <p className="mt-3 text-neutral-400">
                        Ask for troubleshooting, progression decisions, or clarification on the current training plan.
                      </p>
                    </div>

                    <div className="w-full rounded border border-neutral-700 bg-black/30 px-4 py-3 text-center text-sm text-neutral-300 md:w-auto md:text-left">
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

                  <p className="mt-6 text-sm text-neutral-400">
                    Ask follow-up questions about the active dog, current plan, or recent session history.
                  </p>

                  <div className="mt-6 overflow-hidden rounded-lg border border-neutral-800 bg-black p-3 sm:p-4">
                    <div
                      ref={chatContainerRef}
                      className="max-h-[420px] space-y-4 overflow-x-hidden overflow-y-auto pr-1 sm:pr-2"
                    >
                      {messages.length === 0 && (
                        <p className="text-neutral-400">
                          No chat history yet. Use the session generator first, or ask a dog-specific training question.
                        </p>
                      )}

                      {messages.map((message, index) => (
                        <div
                          key={`${message.role}-${index}`}
                          className={`max-w-[92%] break-words whitespace-pre-wrap rounded px-3 py-3 text-sm sm:max-w-[85%] sm:px-4 sm:text-base ${
                            message.role === "user"
                              ? "ml-auto bg-amber-400 text-black"
                              : "mr-auto bg-neutral-900 text-white"
                          }`}
                        >
                          {message.content}
                        </div>
                      ))}

                      {loading && (
                        <div className="mr-auto max-w-[92%] rounded bg-neutral-900 px-3 py-3 text-sm text-neutral-300 sm:max-w-[85%] sm:px-4 sm:text-base">
                          Thinking...
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask about today's session... Example: Should I increase distractions? How do I stop forging? Is my dog ready for the next step?"
                      disabled={loading || !hasActiveDog}
                      className="min-h-[120px] w-full flex-1 rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-base text-white outline-none disabled:opacity-50 sm:min-h-[90px]"
                    />

                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={loading || !input.trim() || !hasActiveDog}
                      className="w-full self-end rounded bg-amber-400 px-6 py-3 font-semibold text-black disabled:opacity-50 sm:w-auto"
                    >
                      Send
                    </button>
                  </div>
                </section>
                )}

                {workflowState === "progressing" && (
                <section className="rounded-lg border border-neutral-800 bg-neutral-950 p-5 sm:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold sm:text-3xl">Session History</h2>
                      <p className="mt-3 text-neutral-400">
                        Review saved sessions to spot wins, recurring issues, and when the dog is ready to progress.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setHistoryCollapsed((prev) => !prev)}
                      className="w-full rounded border border-neutral-600 px-4 py-3 font-semibold hover:bg-neutral-900 sm:w-auto"
                    >
                      {historyCollapsed ? "Show History" : "Hide History"}
                    </button>
                  </div>

                  {!historyCollapsed && (
                    <div className="mt-6 space-y-4">
                      {sessionLogs.length === 0 && (
                        <p className="text-neutral-400">No sessions logged yet for this dog.</p>
                      )}

                      {sessionLogs.map((log, index) => {
                        const outcome = getSessionOutcome(log.wins);

                        return (
                          <div
                            key={log.id}
                            className={`rounded-lg border p-4 ${
                              index === 0
                                ? "border-amber-500/30 bg-amber-400/10"
                                : "border-neutral-800 bg-black"
                            }`}
                          >
                            <div className="flex flex-col gap-4">
                              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
                                <div>
                                  {index === 0 && (
                                    <p className="mb-2 text-xs uppercase tracking-[0.2em] text-amber-300">
                                      Latest Session
                                    </p>
                                  )}

                                  <h3 className="text-xl font-semibold">
                                    {log.date || "No date saved"}
                                  </h3>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteSession(log.id)}
                                  className="w-full rounded border border-neutral-700 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-900 sm:w-auto"
                                >
                                  Delete
                                </button>
                              </div>

                              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                <div className="rounded border border-neutral-800 bg-neutral-950/80 p-3">
                                  <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                                    Date
                                  </p>
                                  <p className="mt-2 text-sm font-semibold text-white">
                                    {log.date || "Not set"}
                                  </p>
                                </div>

                                <div className="rounded border border-neutral-800 bg-neutral-950/80 p-3">
                                  <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                                    Duration
                                  </p>
                                  <p className="mt-2 text-sm font-semibold text-white">
                                    {log.duration || "Not set"}
                                  </p>
                                </div>

                                <div className="rounded border border-neutral-800 bg-neutral-950/80 p-3">
                                  <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                                    Focus
                                  </p>
                                  <p className="mt-2 text-sm font-semibold text-white">
                                    {log.focus || "Not set"}
                                  </p>
                                </div>

                                <div className="rounded border border-neutral-800 bg-neutral-950/80 p-3">
                                  <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                                    Result
                                  </p>
                                  <p className="mt-2 text-sm font-semibold text-white">
                                    {outcome.result}
                                  </p>
                                </div>
                              </div>

                              <div className="grid gap-3 lg:grid-cols-2">
                                <div className="rounded border border-neutral-800 bg-neutral-950/80 p-4">
                                  <p className="text-xs uppercase tracking-[0.2em] text-amber-400">
                                    Wins Summary
                                  </p>
                                  <p className="mt-3 text-sm leading-7 text-neutral-200">
                                    {outcome.winsSummary}
                                  </p>
                                </div>

                                <div className="rounded border border-neutral-800 bg-neutral-950/80 p-4">
                                  <p className="text-xs uppercase tracking-[0.2em] text-amber-400">
                                    Issues Summary
                                  </p>
                                  <p className="mt-3 text-sm leading-7 text-neutral-200">
                                    {log.issues || "No issue summary saved."}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
                )}
              </>
            )}
          </div>
        </div>
      </section>
        </>
      )}
    </main>
  );
}

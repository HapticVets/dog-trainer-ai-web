"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import DogProfilePhotoPicker from "@/components/DogProfilePhotoPicker";
import GoogleAdsSignUpConversion from "@/components/GoogleAdsSignUpConversion";
import {
  getAvailableMainGoals,
  getDefaultMainGoal,
  goalTypeOptions,
} from "@/lib/dogGoals";
import {
  buildDogCaseFileContext,
  emptyDogCaseFile,
  ensurePrimaryPriority,
  equipmentOptions,
  getDurationOptionsForValue,
  getSeverityOptionsForValue,
  getWhereItHappensOptionsForValues,
  homeEnvironmentOptions,
  hydrateDogCaseFile,
  previousTrainingOptions,
  serializeDogCaseFile,
  sexOptions,
  toggleMultiValue,
  type DogCaseFile,
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

type TrainerAccessState = {
  premium: boolean;
  freeMessagesUsed: number;
  freeMessagesRemaining: number;
  aiChatMessagesUsed: number;
  aiChatMessagesRemaining: number;
  firstSessionsGenerated: number;
  sessionLogsUsed: number;
  nextSessionsGenerated: number;
  dogProfilesUsed: number;
  canCreateCaseFile: boolean;
  canGenerateFirstSession: boolean;
  canLogSession: boolean;
  canUseAiChat: boolean;
  canGenerateNextSession: boolean;
  hasAccess: boolean;
};

type UpgradeModalState = {
  title: string;
  description: string;
};

type ToastState = {
  message: string;
  variant: "success" | "warning" | "error";
};

type MissionAction = {
  label: string;
  targetId?: string;
};

type EvaluationDraft = {
  version: 1;
  step: EvaluationStep;
  profile: DogCaseFile;
  previousActiveDogId: string;
};

const StatusIcon = ({ complete, current }: { complete: boolean; current?: boolean }) => (
  <span
    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
      complete
        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
        : current
        ? "border-amber-500/40 bg-amber-400/10 text-amber-200"
        : "border-neutral-700 bg-neutral-900 text-neutral-500"
    }`}
    aria-hidden="true"
  >
    <svg viewBox="0 0 16 16" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
      {complete ? <path d="m3.5 8.2 2.6 2.5 6.4-6.1" /> : <circle cx="8" cy="8" r="3" />}
    </svg>
  </span>
);

const rewardTypeOptions = ["Food", "Toy", "Ball", "Food and Toy", "Praise"];

const skillLevelOptions = [
  "Well trained, looking to advance",
  "Knows commands but needs consistency",
  "Needs foundation training",
  "Has behavior challenges",
];

const getSkillLevelOptionsForValue = (currentValue: string) =>
  skillLevelOptions.includes(currentValue)
    ? skillLevelOptions
    : [...skillLevelOptions, currentValue];

const coachPromptSuggestions = [
  "What should I work on today?",
  "Is my dog ready for more distractions?",
  "Why did my dog regress?",
  "Should I shorten the next session?",
  "How do I improve engagement?",
  "What should I do after a bad session?",
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
  3: "Training Goals & Challenges",
  4: "Home & Training History",
  5: "Equipment & Notes",
  6: "Review Case File",
};

const ACTIVE_DOG_STORAGE_KEY = "patriot-k9-active-dog-id";
const EVALUATION_DRAFT_STORAGE_PREFIX = "patriot-k9-evaluation-draft";

const isEvaluationStep = (value: unknown): value is EvaluationStep =>
  typeof value === "number" && value >= 1 && value <= 6;

const getEvaluationDraftStorageKey = (userId: string) =>
  `${EVALUATION_DRAFT_STORAGE_PREFIX}:${userId}`;

const getPersistedEvaluationDraft = (userId: string): EvaluationDraft | null => {
  if (typeof window === "undefined") return null;

  try {
    const rawDraft = window.localStorage.getItem(getEvaluationDraftStorageKey(userId));
    if (!rawDraft) return null;

    const parsedDraft = JSON.parse(rawDraft) as Partial<EvaluationDraft>;
    if (!isEvaluationStep(parsedDraft.step) || !parsedDraft.profile) return null;

    const profile = parsedDraft.profile;
    return {
      version: 1,
      step: parsedDraft.step,
      previousActiveDogId:
        typeof parsedDraft.previousActiveDogId === "string"
          ? parsedDraft.previousActiveDogId
          : "",
      profile: {
        ...emptyDogCaseFile,
        ...profile,
        id: undefined,
        profileImagePath: null,
        profileImageUrl: null,
        selectedGoals: Array.isArray(profile.selectedGoals)
          ? profile.selectedGoals
          : emptyDogCaseFile.selectedGoals,
        whereItHappens: Array.isArray(profile.whereItHappens)
          ? profile.whereItHappens
          : [],
        equipmentUsed: Array.isArray(profile.equipmentUsed)
          ? profile.equipmentUsed
          : [],
      },
    };
  } catch {
    return null;
  }
};

const persistEvaluationDraft = (draft: EvaluationDraft, userId: string) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(getEvaluationDraftStorageKey(userId), JSON.stringify(draft));
  } catch (error) {
    console.warn("Unable to persist dog evaluation draft.", error);
  }
};

const clearPersistedEvaluationDraft = (userId?: string) => {
  if (typeof window === "undefined" || !userId) return;
  window.localStorage.removeItem(getEvaluationDraftStorageKey(userId));
};

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

const getPlanSectionContent = (sections: PlanSection[], label: string) =>
  sections.find((section) => section.label === label)?.content || "";

const getPlanObjectivePreview = (sections: PlanSection[]) => {
  const objective = getPlanSectionContent(sections, "Objective").replace(/\s+/g, " ").trim();
  return objective ? objective.slice(0, 140) : "Objective not available in this saved plan.";
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
  const [pendingProfileImage, setPendingProfileImage] = useState<File | null>(null);
  const [pendingProfileImageRemoval, setPendingProfileImageRemoval] = useState(false);
  const [profileImageError, setProfileImageError] = useState("");

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
  const [openPlanSections, setOpenPlanSections] = useState<string[]>([
    "Objective",
    "Working Reps",
  ]);
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>("create");
  const [profileCollapsed, setProfileCollapsed] = useState(false);
  const [showOlderMissionReports, setShowOlderMissionReports] = useState(false);
  const [evaluationMode, setEvaluationMode] = useState(false);
  const [evaluationStep, setEvaluationStep] = useState<EvaluationStep>(1);
  const [previousActiveDogId, setPreviousActiveDogId] = useState<string>("");
  const [previousActiveDogProfile, setPreviousActiveDogProfile] =
    useState<DogCaseFile | null>(null);
  const [dogProfilesLoaded, setDogProfilesLoaded] = useState(false);
  const [trainerAccess, setTrainerAccess] = useState<TrainerAccessState | null>(null);
  const [upgradeModal, setUpgradeModal] = useState<UpgradeModalState | null>(null);
  const [upgradeCheckoutLoading, setUpgradeCheckoutLoading] = useState(false);
  const [upgradeCheckoutError, setUpgradeCheckoutError] = useState("");
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const hasActiveDog = Boolean(selectedDogId && dogProfile.name.trim());
  const hasNoDogProfiles = dogProfilesLoaded && dogProfiles.length === 0;
  const hasSessions = sessionLogs.length > 0;
  const hasCurrentPlan = Boolean(currentPlan.trim());
  const isInitializingTrainer = !dogProfilesLoaded && !evaluationMode;
  const isPremiumUser = trainerAccess?.premium === true;
  const freeMessagesUsed = trainerAccess?.aiChatMessagesUsed ?? 0;
  const freeMessagesRemaining = trainerAccess?.aiChatMessagesRemaining ?? 0;
  const freeMessageLimit = Math.max(
    freeMessagesUsed + freeMessagesRemaining,
    1
  );
  const freeMessageProgress = Math.min(
    (freeMessagesUsed / freeMessageLimit) * 100,
    100
  );
  const isFreeChatLimitReached =
    !isPremiumUser && trainerAccess?.canUseAiChat === false;
  const latestSession = sessionLogs[0];
  const visibleMissionReports = showOlderMissionReports
    ? sessionLogs
    : sessionLogs.slice(0, 3);
  const olderMissionReportsCount = Math.max(sessionLogs.length - 3, 0);
  const selectedGoals = dogProfile.selectedGoals;
  const categoryGoalOptions = useMemo(
    () => getAvailableMainGoals(dogProfile.goalType, dogProfile.mainGoal),
    [dogProfile.goalType, dogProfile.mainGoal]
  );
  const durationOptionsForProfile = getDurationOptionsForValue(dogProfile.issueDuration);
  const skillLevelOptionsForProfile = getSkillLevelOptionsForValue(dogProfile.skillLevel);
  const severityOptionsForProfile = getSeverityOptionsForValue(dogProfile.severity);
  const whereItHappensOptionsForProfile = getWhereItHappensOptionsForValues(
    dogProfile.whereItHappens
  );
  const parsedCurrentPlan = useMemo(() => parsePlanSections(currentPlan), [currentPlan]);
  const savedPlans = useMemo(
    () =>
      savedOutputs.filter(
        (output) =>
          output.outputType === "initial_session_plan" ||
          output.outputType === "next_session_plan"
      ),
    [savedOutputs]
  );
  const savedPlanSummaries = useMemo(
    () =>
      savedPlans.map((plan) => {
        const sections = parsePlanSections(plan.content);

        return {
          ...plan,
          objectivePreview: getPlanObjectivePreview(sections),
          phase: getPlanSectionContent(sections, "Current Phase"),
        };
      }),
    [savedPlans]
  );
  const hasInitialTrainingPlan = savedPlans.some(
    (plan) => plan.outputType === "initial_session_plan"
  );
  const trackedSkillSummaries = useMemo(() => {
    const skills = new Map<string, { focus: string; sessions: number; lastWorkedOn: string }>();

    sessionLogs.forEach((log) => {
      const focus = log.focus.trim();
      if (!focus) return;

      const existing = skills.get(focus);
      if (existing) {
        existing.sessions += 1;
        return;
      }

      skills.set(focus, {
        focus,
        sessions: 1,
        lastWorkedOn: log.date,
      });
    });

    return Array.from(skills.values()).slice(0, 6);
  }, [sessionLogs]);
  const recentProgressHighlights = sessionLogs
    .slice(0, 3)
    .map((log) => ({
      date: log.date,
      focus: log.focus,
      wins: getSessionOutcome(log.wins).winsSummary,
    }))
    .filter((highlight) => highlight.wins !== "Not set");

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
      : "Generate the next session or ask Patriot K9 Coach";

  const currentPlanPhase =
    getPlanSectionContent(parsedCurrentPlan, "Current Phase") ||
    (hasCurrentPlan ? "Current plan active" : "Case file stage");
  const currentPlanSessionType = getPlanSectionContent(parsedCurrentPlan, "Session Type");
  const currentPlanPrimaryCue = getPlanSectionContent(parsedCurrentPlan, "Primary Cue");
  const durationMatch = getPlanSectionContent(parsedCurrentPlan, "Setup").match(
    /\b(\d{1,2}\s*(?:minutes?|mins?))\b/i
  );
  const currentPlanDuration = durationMatch?.[1] || "Not specified";
  const todaysObjective =
    parsedCurrentPlan.find((section) => section.label === "Objective")?.content ||
    dogProfile.mainGoal ||
    "Create a dog case file";
  const equipmentSummary = dogProfile.equipmentUsed.length
    ? dogProfile.equipmentUsed.join(", ")
    : "No equipment noted";
  const trainingMilestones = [
    { label: "Case File", complete: hasActiveDog, detail: "Dog profile saved" },
    {
      label: "Training Plan",
      complete: hasInitialTrainingPlan,
      detail: hasInitialTrainingPlan ? "First plan generated" : "Generate the first plan",
    },
    {
      label: "Sessions",
      complete: hasSessions,
      detail: hasSessions ? `${sessionLogs.length} logged` : "Log the first session",
    },
    {
      label: "Current Phase",
      complete: hasCurrentPlan,
      detail: hasCurrentPlan ? currentPlanPhase : "Available after plan generation",
    },
  ];
  const completedTrainingMilestones = trainingMilestones.filter(
    (milestone) => milestone.complete
  ).length;
  const workflowSteps = [
    { label: "Case File", complete: hasActiveDog },
    { label: "Plan", complete: hasCurrentPlan },
    { label: "Session Logged", complete: hasSessions },
    {
      label: "Next Session",
      complete: false,
      current: workflowState === "progressing",
    },
  ];
  const completedWorkflowSteps = workflowSteps.filter((step) => step.complete).length;
  const missionAction: MissionAction =
    workflowState === "no_dog"
      ? { label: "Create Dog Case File" }
      : workflowState === "case_file_complete"
      ? { label: "Generate First Session", targetId: "first-session-section" }
      : workflowState === "plan_ready_to_log"
      ? { label: "Log Today’s Session", targetId: "session-log-section" }
      : { label: "Review Current Plan", targetId: "current-plan-section" };

  const statusCardItems = [
    {
      label: "Case File",
      value: hasActiveDog ? "Complete" : "Not started",
      complete: hasActiveDog,
      current: workflowState === "no_dog",
    },
    {
      label: "Current Plan",
      value: hasCurrentPlan ? "Generated" : "Not generated",
      complete: hasCurrentPlan,
      current: workflowState === "case_file_complete",
    },
    {
      label: "Last Session",
      value: latestSession?.date || "Not logged",
      complete: hasSessions,
      current: workflowState === "plan_ready_to_log",
    },
    {
      label: "Next Action",
      value: workflowNextAction,
      complete: false,
      current: workflowState === "progressing",
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

  const showToast = (message: string, variant: ToastState["variant"]) => {
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    setToast({ message, variant });
    toastTimeoutRef.current = window.setTimeout(() => setToast(null), 5000);
  };

  const handleMissionAction = () => {
    if (!missionAction.targetId) {
      handleAddDog();
      return;
    }

    document.getElementById(missionAction.targetId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const togglePlanSection = (label: string) => {
    setOpenPlanSections((openSections) =>
      openSections.includes(label)
        ? openSections.filter((sectionLabel) => sectionLabel !== label)
        : [...openSections, label]
    );
  };

  const refreshTrainerAccess = async () => {
    if (!user) {
      setTrainerAccess(null);
      return;
    }

    try {
      const res = await fetch("/api/trainer/access", {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Failed to load trainer access:", data.error);
        return;
      }

      setTrainerAccess(data);
    } catch (error) {
      console.error("Failed to load trainer access:", error);
    }
  };

  const handleUpgrade = async () => {
    setUpgradeCheckoutLoading(true);
    setUpgradeCheckoutError("");

    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      setUpgradeCheckoutError(data?.error || "Unable to start checkout right now.");
    } catch (error) {
      console.error("Checkout error:", error);
      setUpgradeCheckoutError("Unable to start checkout right now.");
    } finally {
      setUpgradeCheckoutLoading(false);
    }
  };

  const showUpgradePrompt = (description: string) => {
    setUpgradeCheckoutError("");
    setUpgradeModal({
      title: "Upgrade to continue training",
      description,
    });
  };

  const showMultiDogUpgradePrompt = () => {
    setUpgradeCheckoutError("");
    setUpgradeModal({
      title: "Upgrade to train multiple dogs",
      description:
        "The free plan includes one dog profile. Upgrade to add more dogs, generate ongoing sessions, and unlock unlimited AI coaching.",
    });
  };

  const showPhotoUpgradePrompt = () => {
    setUpgradeCheckoutError("");
    setUpgradeModal({
      title: "Upgrade to add dog photos",
      description:
        "Dog profile photos are a Premium personalization feature. Upgrade to add photos to your Training Center and Patriot K9 Coach.",
    });
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
        const evaluationDraft = getPersistedEvaluationDraft(user.id);

        if (evaluationDraft) {
          const persistedActiveDogId = getPersistedActiveDogId();
          const previousDog =
            mapped.find((dog) => dog.id === evaluationDraft.previousActiveDogId) ??
            mapped.find((dog) => dog.id === persistedActiveDogId) ??
            null;

          setEvaluationMode(true);
          setEvaluationStep(evaluationDraft.step);
          setProfileCollapsed(false);
          setPreviousActiveDogId(previousDog?.id ?? "");
          setPreviousActiveDogProfile(previousDog);
          setPendingProfileImage(null);
          setPendingProfileImageRemoval(false);
          setProfileImageError("");
          setSelectedDogId("");
          setDogProfile(evaluationDraft.profile);
          setSessionLogs([]);
          setMessages([]);
          setCurrentPlan("");
          setSavedOutputs([]);
          return;
        }

        if (mapped.length > 0) {
          setEvaluationMode(false);
          const persistedActiveDogId = getPersistedActiveDogId();
          const persistedDog = mapped.find((dog) => dog.id === persistedActiveDogId) ?? null;
          const newestDog = mapped[mapped.length - 1] ?? null;
          activateDog(persistedDog ?? newestDog);
        } else {
          setEvaluationMode(true);
          setEvaluationStep(1);
          setProfileCollapsed(false);
          setPreviousActiveDogId("");
          setPreviousActiveDogProfile(null);
          activateDog(null);
        }
      } catch (error) {
        console.error("Failed to load dog profiles:", error);
      } finally {
        setDogProfilesLoaded(true);
      }
    };

    loadDogProfiles();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setTrainerAccess(null);
      return;
    }

    refreshTrainerAccess();
  }, [user]);

  useEffect(() => {
    if (!user || !evaluationMode) return;

    persistEvaluationDraft(
      {
        version: 1,
        step: evaluationStep,
        profile: {
          ...dogProfile,
          id: undefined,
          profileImagePath: null,
          profileImageUrl: null,
        },
        previousActiveDogId,
      },
      user.id
    );
  }, [
    user,
    evaluationMode,
    evaluationStep,
    dogProfile,
    previousActiveDogId,
  ]);

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
    setShowOlderMissionReports(false);
  }, [selectedDogId]);

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
        if (data.requiresUpgrade) {
          showUpgradePrompt(
            data.error || "Upgrade to continue training."
          );
          await refreshTrainerAccess();
          return;
        }

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
      await refreshTrainerAccess();
    } catch (error) {
      console.error("Failed to save output:", error);
    }
  };

  const handleSelectDog = (id: string) => {
    const found = dogProfiles.find((dog) => dog.id === id);

    if (found) {
      setPendingProfileImage(null);
      setPendingProfileImageRemoval(false);
      setProfileImageError("");
      activateDog(found);
      setCurrentPlan("");
      setMessages([]);
      setSavedOutputs([]);
      return;
    }

    activateDog(null);
  };

  const handleAddDog = () => {
    if (!isPremiumUser && trainerAccess && !trainerAccess.canCreateCaseFile) {
      showMultiDogUpgradePrompt();
      return;
    }

    setUpgradeModal(null);
    setUpgradeCheckoutError("");
    clearPersistedEvaluationDraft(user?.id);
    setPreviousActiveDogId(selectedDogId);
    setPreviousActiveDogProfile(selectedDogId ? dogProfile : null);
    setEvaluationMode(true);
    setEvaluationStep(1);
    setProfileCollapsed(false);
    setPendingProfileImage(null);
    setPendingProfileImageRemoval(false);
    setProfileImageError("");
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
    setUpgradeModal(null);
    setUpgradeCheckoutError("");
    clearPersistedEvaluationDraft(user?.id);
    setEvaluationMode(false);
    setEvaluationStep(1);
    setPendingProfileImage(null);
    setPendingProfileImageRemoval(false);
    setProfileImageError("");

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

  const resetPendingProfileImage = () => {
    setPendingProfileImage(null);
    setPendingProfileImageRemoval(false);
    setProfileImageError("");
  };

  const uploadProfileImage = async (dogProfileId: string, image: File) => {
    const formData = new FormData();
    formData.set("dogProfileId", dogProfileId);
    formData.set("image", image);

    const response = await fetch("/api/dog-profile/photo", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to upload dog photo.");
    }

    return {
      profileImagePath: data.profileImagePath as string,
      profileImageUrl: data.profileImageUrl as string,
    };
  };

  const loadPersistedDogProfile = async (dogProfileId: string) => {
    try {
      const response = await fetch("/api/dog-profile", {
        method: "GET",
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        console.error("Unable to refresh saved dog profile:", data.error);
        return null;
      }

      const profile = (data.profiles ?? []).find(
        (candidate: { id?: string }) => candidate.id === dogProfileId
      );

      return profile ? hydrateDogCaseFile(profile) : null;
    } catch (error) {
      console.error("Unable to refresh saved dog profile:", error);
      return null;
    }
  };

  const removeProfileImage = async (dogProfileId: string) => {
    const response = await fetch(
      `/api/dog-profile/photo?dogProfileId=${encodeURIComponent(dogProfileId)}`,
      { method: "DELETE" }
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to remove dog photo.");
    }
  };

  const handleSaveDogProfile = async () => {
    if (!user) {
      showToast("You must be signed in to save the dog profile.", "warning");
      return;
    }

    if (!dogProfile.name.trim()) {
      showToast("Dog name is required.", "warning");
      return;
    }

    setProfileSaving(true);
    const hadPendingPhotoChange = Boolean(
      pendingProfileImage || pendingProfileImageRemoval
    );

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
        if (data.requiresUpgrade) {
          showMultiDogUpgradePrompt();
          await refreshTrainerAccess();
          return;
        }

        console.error("Failed to save dog profile:", data.error);
        showToast("Unable to save the case file.", "error");
        return;
      }

      let saved: DogCaseFile = {
        ...hydrateDogCaseFile(data.profile),
      };
      let imageUpdateFailed = false;

      try {
        if (pendingProfileImage && saved.id) {
          const dogProfileId = saved.id;
          saved = { ...saved, ...(await uploadProfileImage(dogProfileId, pendingProfileImage)) };
          const persistedProfile = await loadPersistedDogProfile(dogProfileId);
          if (persistedProfile) saved = persistedProfile;
        } else if (pendingProfileImageRemoval && saved.id && saved.profileImagePath) {
          await removeProfileImage(saved.id);
          saved = { ...saved, profileImagePath: null, profileImageUrl: null };
        }
      } catch (imageError) {
        imageUpdateFailed = true;
        const message = imageError instanceof Error ? imageError.message : "Unable to save dog photo.";
        setProfileImageError(message);
        showToast(`Case file saved, but the dog photo could not be updated. ${message}`, "warning");
      }

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
      clearPersistedEvaluationDraft(user.id);
      setPreviousActiveDogId("");
      setPreviousActiveDogProfile(null);
      setProfileCollapsed(true);
      if (!imageUpdateFailed) resetPendingProfileImage();
      setUpgradeModal(null);
      setUpgradeCheckoutError("");
      if (!imageUpdateFailed) {
        showToast(
          hadPendingPhotoChange
            ? "Dog photo updated and case file saved."
            : selectedDogId
            ? "Case file updated."
            : "Case file saved.",
          "success"
        );
      }
    } catch (error) {
      console.error("Failed to save dog profile:", error);
      showToast("Unable to save the case file.", "error");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleDeleteDogProfile = async () => {
    if (!selectedDogId) {
      showToast("Select a saved dog first.", "warning");
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
        showToast("Unable to delete the dog profile.", "error");
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
        clearPersistedEvaluationDraft(user?.id);
        setEvaluationMode(true);
        setEvaluationStep(1);
        setProfileCollapsed(false);
        setPreviousActiveDogId("");
        setPreviousActiveDogProfile(null);
        setPendingProfileImage(null);
        setPendingProfileImageRemoval(false);
        setProfileImageError("");
      }

      setSessionLogs([]);
      setMessages([]);
      setCurrentPlan("");
      setSavedOutputs([]);
    } catch (error) {
      console.error("Failed to delete dog profile:", error);
      showToast("Unable to delete the dog profile.", "error");
    }
  };

  const handleSend = async () => {
    if (!selectedDogId) {
      showToast("Create or select a dog case file before asking Patriot K9 Coach.", "warning");
      return;
    }

    if (!input.trim() || loading) return;

    if (!isPremiumUser && trainerAccess && !trainerAccess.canUseAiChat) {
      showUpgradePrompt(
        "You’ve used your free AI coaching messages. Upgrade to unlock unlimited training sessions, AI coaching, session history, and ongoing progression."
      );
      return;
    }

    const userMessage: ChatMessage = {
      role: "user",
      content: input.trim(),
    };

    const nextMessages: ChatMessage[] = [...messages, userMessage];
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
          requestType: "assistant_chat",
          messages: nextMessages,
          dogProfile,
          sessionLogs: sessionLogs.slice(0, 10),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const assistantText =
          data.reply || data.error || "Upgrade to continue training.";
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: assistantText,
        };

        setMessages([...nextMessages, assistantMessage]);

        if (data.requiresUpgrade) {
          showUpgradePrompt(
            "You’ve used your free AI coaching messages. Upgrade to unlock unlimited training sessions, AI coaching, session history, and ongoing progression."
          );
          await refreshTrainerAccess();
        }

        return;
      }

      const assistantText = data.reply || "No response generated.";
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: assistantText,
      };

      setMessages([...nextMessages, assistantMessage]);
      await saveChatMessage("user", userMessage.content);
      await saveChatMessage("assistant", assistantText);
      setUpgradeModal(null);
      setUpgradeCheckoutError("");
      await refreshTrainerAccess();
    } catch (error) {
      console.error("Chat error:", error);

      const assistantText = "Patriot K9 Coach could not respond right now. Please try again.";
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
      showToast("Save a dog profile first.", "warning");
      return;
    }

    if (!sessionForm.date.trim() || !sessionForm.wins.trim()) {
      showToast("Fill out the session log before saving.", "warning");
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

    if (!isPremiumUser && trainerAccess && !trainerAccess.canLogSession) {
      showUpgradePrompt(
        "You’ve used your free training session. Upgrade to unlock unlimited training sessions, AI coaching, session history, and ongoing progression."
      );
      return;
    }

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
        if (data.requiresUpgrade) {
          showUpgradePrompt(
            data.error ||
              "You’ve used your free training session. Upgrade to unlock unlimited training sessions, AI coaching, session history, and ongoing progression."
          );
          await refreshTrainerAccess();
          return;
        }

        console.error("Failed to save session log:", data.error);
        showToast("Unable to save the session log.", "error");
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
      setUpgradeModal(null);
      setUpgradeCheckoutError("");
      await refreshTrainerAccess();
    } catch (error) {
      console.error("Failed to save session log:", error);
      showToast("Unable to save the session log.", "error");
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
        showToast("Unable to delete the session log.", "error");
        return;
      }

      setSessionLogs((prev) => prev.filter((log) => log.id !== id));
    } catch (error) {
      console.error("Failed to delete session log:", error);
      showToast("Unable to delete the session log.", "error");
    }
  };

  const handleGenerateFirstSession = async () => {
    if (!selectedDogId) {
      showToast("Save a dog profile first.", "warning");
      return;
    }

    if (planLoading) return;

    if (!isPremiumUser && trainerAccess && !trainerAccess.canGenerateFirstSession) {
      showUpgradePrompt(
        "You’ve used your free training session. Upgrade to unlock unlimited training sessions, AI coaching, session history, and ongoing progression."
      );
      return;
    }

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
          requestType: "initial_session_plan",
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
      if (!res.ok) {
        if (data.requiresUpgrade) {
          showUpgradePrompt(
            data.reply ||
              "You’ve used your free training session. Upgrade to unlock unlimited training sessions, AI coaching, session history, and ongoing progression."
          );
          await refreshTrainerAccess();
          return;
        }

        setCurrentPlan("Error generating first session.");
        return;
      }

      const outputText = data.reply || "No first session generated.";

      setCurrentPlan(outputText);
      await saveOutput(outputText, "initial_session_plan");
      setUpgradeModal(null);
      setUpgradeCheckoutError("");
      await refreshTrainerAccess();
    } catch (error) {
      console.error("First session error:", error);
      setCurrentPlan("Error generating first session.");
    } finally {
      setPlanLoading(false);
    }
  };

  const handleGenerateNextSessionPlan = async () => {
    if (!selectedDogId) {
      showToast("Save a dog profile first.", "warning");
      return;
    }

    if (planLoading) return;

    if (sessionLogs.length === 0) {
      showToast("Log at least one session before generating the next session.", "warning");
      return;
    }

    if (!isPremiumUser) {
      showUpgradePrompt(
        "You’ve used your free training session. Upgrade to unlock unlimited training sessions, AI coaching, session history, and ongoing progression."
      );
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
          requestType: "next_session_plan",
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
      if (!res.ok) {
        if (data.requiresUpgrade) {
          showUpgradePrompt(
            data.reply ||
              "You’ve used your free training session. Upgrade to unlock unlimited training sessions, AI coaching, session history, and ongoing progression."
          );
          await refreshTrainerAccess();
          return;
        }

        setCurrentPlan("Error generating next session.");
        return;
      }

      const outputText = data.reply || "No next session generated.";

      setCurrentPlan(outputText);
      await saveOutput(outputText, "next_session_plan");
      setUpgradeModal(null);
      setUpgradeCheckoutError("");
      await refreshTrainerAccess();
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
    { label: "Training experience", value: dogProfile.issueDuration || "Not set" },
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

  const photoUpgradeNotice = (
    <div className="rounded-lg border border-amber-500/30 bg-amber-400/10 p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
        Premium Personalization
      </p>
      <h3 className="mt-2 text-lg font-bold text-white">Add a dog profile photo with Premium</h3>
      <p className="mt-2 text-sm leading-6 text-neutral-300">
        Keep your dog&apos;s Training Center and Patriot K9 Coach personalized with a profile photo.
      </p>
      <button
        type="button"
        onClick={showPhotoUpgradePrompt}
        className="mt-4 w-full rounded bg-amber-400 px-4 py-3 text-sm font-semibold text-black hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:ring-offset-2 focus:ring-offset-neutral-950 sm:w-auto"
      >
        Upgrade to add a photo
      </button>
    </div>
  );

  const evaluationWizardContent = (
    <div className="mt-6 space-y-6">
      {hasNoDogProfiles && (
        <div
          className="rounded-lg border border-amber-500/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100"
          role="status"
        >
          No dog profiles found. Create your first training profile to begin.
        </div>
      )}
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
          {isPremiumUser ? (
            <DogProfilePhotoPicker
              key="new-dog-evaluation-photo"
              dogName={dogProfile.name}
              statusLabel="New Case"
              imageUrl={dogProfile.profileImageUrl}
              pendingImage={pendingProfileImage}
              pendingRemoval={pendingProfileImageRemoval}
              disabled={profileSaving}
              onChange={(image) => {
                setPendingProfileImage(image);
                setPendingProfileImageRemoval(false);
                setProfileImageError("");
              }}
              onRemove={() => {
                setPendingProfileImage(null);
                setPendingProfileImageRemoval(true);
                setProfileImageError("");
              }}
              onReset={resetPendingProfileImage}
            />
          ) : (
            photoUpgradeNotice
          )}
          {profileImageError && (
            <p className="mt-4 text-sm text-red-300" role="alert">{profileImageError}</p>
          )}
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
                What best describes your dog&apos;s current training level and support needed?
              </label>
              <select
                value={dogProfile.severity}
                onChange={(e) => setDogProfile({ ...dogProfile, severity: e.target.value })}
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
              >
                {severityOptionsForProfile.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm text-white">
                How long have you been working toward this goal?
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
                {durationOptionsForProfile.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-white">Where do you want this training to work?</label>
            <div className="grid gap-3 sm:grid-cols-2">
              {whereItHappensOptionsForProfile.map((option) => (
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
              <label className="mb-2 block text-sm text-white">
                What best describes your dog&apos;s current training level?
              </label>
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
                {skillLevelOptionsForProfile.map((option) => (
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
          <div className="flex flex-col gap-2 lg:flex-row">
            <select
              value={selectedDogId}
              onChange={(e) => handleSelectDog(e.target.value)}
              className="min-w-0 flex-1 rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
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
              className="w-full rounded border border-red-500/40 px-4 py-3 font-semibold text-red-200 hover:bg-red-500/10 disabled:opacity-50 lg:w-auto"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {isPremiumUser ? (
        <DogProfilePhotoPicker
          key={selectedDogId || "new-dog-photo"}
          dogName={dogProfile.name}
          statusLabel={hasActiveDog ? "Active Case" : "New Case"}
          imageUrl={dogProfile.profileImageUrl}
          pendingImage={pendingProfileImage}
          pendingRemoval={pendingProfileImageRemoval}
          disabled={profileSaving}
          onChange={(image) => {
            setPendingProfileImage(image);
            setPendingProfileImageRemoval(false);
            setProfileImageError("");
          }}
          onRemove={() => {
            setPendingProfileImage(null);
            setPendingProfileImageRemoval(true);
            setProfileImageError("");
          }}
          onReset={resetPendingProfileImage}
        />
      ) : (
        photoUpgradeNotice
      )}

      {profileImageError && (
        <p className="text-sm text-red-300" role="alert">{profileImageError}</p>
      )}

      {!evaluationMode && hasActiveDog && (
        <div className="rounded-lg border border-amber-500/25 bg-black/30 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
              Active case details
            </p>
            <span className="rounded-full border border-neutral-700 px-2.5 py-1 text-xs font-medium text-neutral-300">
              {dogProfile.goalType}
            </span>
          </div>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="min-w-0 rounded border border-neutral-800 bg-neutral-950/70 px-3 py-2.5">
              <dt className="text-xs uppercase tracking-[0.14em] text-neutral-500">Primary priority</dt>
              <dd className="mt-1 break-words text-sm font-medium text-white">
                {dogProfile.mainGoal || "Not set"}
              </dd>
            </div>
            <div className="min-w-0 rounded border border-neutral-800 bg-neutral-950/70 px-3 py-2.5">
              <dt className="text-xs uppercase tracking-[0.14em] text-neutral-500">Severity</dt>
              <dd className="mt-1">
                <span className="inline-flex rounded-full border border-amber-500/25 bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-200">
                  {dogProfile.severity || "Not set"}
                </span>
              </dd>
            </div>
            <div className="min-w-0 rounded border border-neutral-800 bg-neutral-950/70 px-3 py-2.5">
              <dt className="text-xs uppercase tracking-[0.14em] text-neutral-500">Where it happens</dt>
              <dd className="mt-1 break-words text-sm text-neutral-200">
                {dogProfile.whereItHappens.join(", ") || "Not set"}
              </dd>
            </div>
            <div className="min-w-0 rounded border border-neutral-800 bg-neutral-950/70 px-3 py-2.5">
              <dt className="text-xs uppercase tracking-[0.14em] text-neutral-500">Goals selected</dt>
              <dd className="mt-1 break-words text-sm text-neutral-200">
                {dogProfile.selectedGoals.join(", ") || "Not set"}
              </dd>
            </div>
          </dl>
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
              <label className="mb-2 block text-sm text-white">
                Training level / support needed
              </label>
              <select
                value={dogProfile.severity}
                onChange={(e) => setDogProfile({ ...dogProfile, severity: e.target.value })}
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
              >
                {severityOptionsForProfile.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-lg border border-neutral-800 bg-black/30 p-4">
              <label className="mb-2 block text-sm text-white">Training experience</label>
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
                {durationOptionsForProfile.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-lg border border-neutral-800 bg-black/30 p-4">
            <label className="mb-2 block text-sm text-white">
              Where do you want this training to work?
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              {whereItHappensOptionsForProfile.map((option) => (
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
                {skillLevelOptionsForProfile.map((option) => (
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
      <GoogleAdsSignUpConversion
        userCreatedAt={user?.createdAt?.getTime()}
        userId={user?.id}
      />
      {toast && (
        <div
          className="pointer-events-none fixed inset-x-4 top-4 z-[80] mx-auto w-auto max-w-md sm:left-auto sm:right-6 sm:mx-0"
          aria-live={toast.variant === "error" ? "assertive" : "polite"}
          role={toast.variant === "error" ? "alert" : "status"}
        >
          <div
            className={`pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.45)] ${
              toast.variant === "success"
                ? "border-emerald-500/35 bg-emerald-950 text-emerald-100"
                : toast.variant === "warning"
                ? "border-amber-500/35 bg-neutral-950 text-amber-100"
                : "border-red-500/35 bg-red-950 text-red-100"
            }`}
          >
            <p className="min-w-0 flex-1 text-sm leading-6">{toast.message}</p>
            <button
              type="button"
              onClick={() => {
                if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
                setToast(null);
              }}
              className="rounded px-1 text-lg leading-none text-current opacity-80 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-amber-300"
              aria-label="Dismiss notification"
            >
              x
            </button>
          </div>
        </div>
      )}
      <section className="border-b border-neutral-800">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
                Patriot K9 Command
              </p>
              <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl md:text-6xl">
                {isInitializingTrainer
                  ? "Loading Training Center"
                  : evaluationMode
                  ? "Start New Dog Evaluation"
                  : "Training Control Center"}
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-neutral-300">
                {isInitializingTrainer
                  ? "Checking for saved dog case files so the trainer can open the right workflow."
                  : evaluationMode
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

            {!evaluationMode && isPremiumUser && (
              <div className="rounded border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200">
                Premium Active
              </div>
            )}
          </div>
        </div>
      </section>

      {!isInitializingTrainer && trainerAccess && !trainerAccess.premium && (
        <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
          <div className="rounded-lg border border-amber-500/20 bg-black/30 p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-amber-400">
                  Free Access
                </p>
                <p className="mt-3 max-w-3xl text-neutral-300">
                  Free access includes one first training session, one logged session,
                  and up to three AI training questions before upgrade is required.
                </p>
              </div>
              <div className="w-full max-w-xl rounded-lg border border-neutral-800 bg-neutral-950 p-4">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <p className="font-semibold text-white">AI coaching messages</p>
                  <p className="text-neutral-300">
                    {freeMessagesUsed} used / {freeMessagesRemaining} remaining
                  </p>
                </div>
                <div
                  className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-800"
                  aria-label={`${freeMessagesUsed} of ${freeMessageLimit} free AI messages used`}
                  role="progressbar"
                  aria-valuemax={freeMessageLimit}
                  aria-valuemin={0}
                  aria-valuenow={Math.min(freeMessagesUsed, freeMessageLimit)}
                >
                  <div
                    className="h-full rounded-full bg-amber-400 transition-[width]"
                    style={{ width: `${freeMessageProgress}%` }}
                  />
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-medium text-amber-300">Unlimited with Premium</p>
                  <button
                    type="button"
                    onClick={handleUpgrade}
                    disabled={upgradeCheckoutLoading}
                    className="w-full rounded bg-amber-400 px-4 py-3 text-sm font-semibold text-black hover:bg-amber-300 disabled:opacity-60 sm:w-auto"
                  >
                    {upgradeCheckoutLoading
                      ? "Starting checkout..."
                      : "⭐ Upgrade to Premium"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {upgradeModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4 py-6">
          <div className="w-full max-w-lg rounded-2xl border border-amber-500/40 bg-neutral-950 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.5)] sm:p-7">
            <p className="text-sm uppercase tracking-[0.2em] text-amber-300">
              Upgrade Required
            </p>
            <h2 className="mt-3 text-2xl font-bold">{upgradeModal.title}</h2>
            <p className="mt-4 text-neutral-300">{upgradeModal.description}</p>

            {upgradeCheckoutError && (
              <div className="mt-4 rounded border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {upgradeCheckoutError}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleUpgrade}
                disabled={upgradeCheckoutLoading}
                className="w-full rounded bg-amber-400 px-5 py-3 font-semibold text-black disabled:opacity-60 sm:w-auto"
              >
                {upgradeCheckoutLoading ? "Starting checkout..." : "Upgrade Now"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setUpgradeModal(null);
                  setUpgradeCheckoutError("");
                }}
                disabled={upgradeCheckoutLoading}
                className="w-full rounded border border-neutral-600 px-5 py-3 font-semibold text-white hover:bg-neutral-900 disabled:opacity-60 sm:w-auto"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      )}

      {isInitializingTrainer ? (
        <section className="mx-auto max-w-4xl px-4 pb-12 pt-8 sm:px-6 sm:pb-16 sm:pt-10">
          <section className="rounded-lg border border-neutral-800 bg-neutral-950 p-6 text-center sm:p-8">
            <p className="text-sm uppercase tracking-[0.2em] text-amber-400">
              Preparing Trainer
            </p>
            <p className="mt-4 text-neutral-300">
              Loading your saved dog profiles and deciding the next step.
            </p>
          </section>
        </section>
      ) : evaluationMode ? (
        <section className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 sm:pb-16 sm:pt-10">
          <section className="rounded-lg border border-neutral-800 bg-neutral-950 p-5 sm:p-6">
            {evaluationWizardContent}
          </section>
        </section>
      ) : (
        <>
          <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6">
            <div className="rounded-xl border border-neutral-800 bg-black/45 p-5 shadow-[0_18px_45px_rgba(0,0,0,0.2)] sm:p-6">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
                    Today&apos;s Mission
                  </p>
                  <div className="mt-4 flex min-w-0 items-center gap-4">
                    <div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-xl border border-amber-500/25 bg-neutral-900 sm:h-[104px] sm:w-[104px]">
                      {hasActiveDog && dogProfile.profileImageUrl ? (
                        <Image
                          src={dogProfile.profileImageUrl}
                          alt={`${dogProfile.name} active dog profile`}
                          fill
                          sizes="(max-width: 640px) 88px, 104px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-800 to-black text-3xl font-bold text-amber-300">
                          {dogProfile.name.trim().slice(0, 1).toUpperCase() || "K9"}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-2xl font-bold sm:text-3xl">
                          {hasActiveDog ? dogProfile.name : "No active dog"}
                        </h2>
                        {hasActiveDog && (
                          <span className="rounded-full border border-amber-500/30 bg-amber-400/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-amber-200">
                            Active Case
                          </span>
                        )}
                      </div>
                      <p className="mt-2 break-words text-sm text-neutral-300">
                        {hasActiveDog
                          ? dogProfile.mainGoal || "Training priority not set"
                          : "Create a case file to begin structured coaching."}
                      </p>
                      {hasActiveDog && (
                        <span className="mt-3 inline-flex rounded-full border border-neutral-700 bg-neutral-900 px-2.5 py-1 text-xs font-semibold text-neutral-200">
                          Severity: {dogProfile.severity || "Not set"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="min-w-0 rounded-lg border border-neutral-800 bg-neutral-950/80 p-4 sm:p-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Training phase</p>
                      <p className="mt-2 break-words text-sm font-semibold text-white">{currentPlanPhase}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Session duration</p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {hasCurrentPlan ? "See plan setup" : "Available after plan generation"}
                      </p>
                    </div>
                    <div className="min-w-0 sm:col-span-2">
                      <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Today&apos;s objective</p>
                      <p className="mt-2 break-words text-sm leading-6 text-neutral-200">{todaysObjective}</p>
                    </div>
                    <div className="min-w-0 sm:col-span-2">
                      <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Equipment / setup</p>
                      <p className="mt-2 break-words text-sm text-neutral-300">{equipmentSummary}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleMissionAction}
                    className="mt-5 min-h-11 w-full rounded bg-amber-400 px-5 py-3 font-semibold text-black hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:ring-offset-2 focus:ring-offset-neutral-950 sm:w-auto"
                  >
                    {missionAction.label}
                  </button>
                </div>
              </div>

              <div className="mt-6 border-t border-neutral-800 pt-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">
                      Progress tracker
                    </p>
                    <p className="mt-1 text-sm text-neutral-400">
                      {completedWorkflowSteps} of 3 record-backed workflow steps complete
                    </p>
                  </div>
                  {latestSession && (
                    <p className="text-sm text-neutral-300">Latest session: {latestSession.date}</p>
                  )}
                </div>
                <ol className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {workflowSteps.map((step) => (
                    <li
                      key={step.label}
                      className="flex min-w-0 items-center gap-3 rounded border border-neutral-800 bg-neutral-950/70 px-3 py-3"
                    >
                      <StatusIcon complete={step.complete} current={step.current} />
                      <span className="min-w-0 text-sm font-medium text-white">{step.label}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="mt-5 grid gap-2 border-t border-neutral-800 pt-5 sm:grid-cols-2 xl:grid-cols-4">
                {statusCardItems.map((item) => (
                  <div key={item.label} className="flex min-w-0 items-start gap-3 px-1 py-2">
                    <StatusIcon complete={item.complete} current={item.current} />
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">{item.label}</p>
                      <p className="mt-1 break-words text-sm font-medium text-neutral-200">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 pb-2 sm:px-6 sm:pb-3">
            <div className="rounded-xl border border-neutral-800 bg-black/45 p-5 shadow-[0_18px_45px_rgba(0,0,0,0.16)] sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">
                    Long-Term Record
                  </p>
                  <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Training Progress</h2>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-400">
                    Track your dog&apos;s development through completed training milestones and session history.
                  </p>
                </div>
                {isPremiumUser && (
                  <span className="w-fit rounded border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-200">
                    Premium Active
                  </span>
                )}
              </div>

              {!hasActiveDog ? (
                <div className="mt-6 rounded-lg border border-neutral-800 bg-neutral-950 p-5 sm:p-6">
                  <h3 className="text-lg font-semibold text-white">Your training journey starts here.</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400">
                    Create a dog case file, generate a plan, and complete sessions to build a lasting record of training milestones and progress.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mt-6 grid gap-3 rounded-lg border border-neutral-800 bg-neutral-950 p-4 sm:grid-cols-2 xl:grid-cols-5">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Active dog</p>
                      <p className="mt-1 truncate text-sm font-semibold text-white">{dogProfile.name}</p>
                    </div>
                    {hasCurrentPlan && (
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Current phase</p>
                        <p className="mt-1 break-words text-sm font-semibold text-white">{currentPlanPhase}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Completed sessions</p>
                      <p className="mt-1 text-sm font-semibold text-white">{sessionLogs.length}</p>
                    </div>
                    {latestSession?.date && (
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Last training date</p>
                        <p className="mt-1 text-sm font-semibold text-white">{latestSession.date}</p>
                      </div>
                    )}
                    {latestSession?.focus && (
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Current focus</p>
                        <p className="mt-1 break-words text-sm font-semibold text-white">{latestSession.focus}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="text-lg font-semibold text-white">Training Journey</h3>
                      <p
                        className="text-sm text-neutral-400"
                        role="progressbar"
                        aria-label="Completed training milestones"
                        aria-valuemin={0}
                        aria-valuemax={trainingMilestones.length}
                        aria-valuenow={completedTrainingMilestones}
                      >
                        {completedTrainingMilestones} of {trainingMilestones.length} milestones complete
                      </p>
                    </div>
                    <ol className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {trainingMilestones.map((milestone, index) => {
                        const isCurrentMilestone =
                          !milestone.complete && index === completedTrainingMilestones;

                        return (
                          <li
                            key={milestone.label}
                            className="flex min-w-0 items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-950/80 p-3"
                            aria-current={isCurrentMilestone ? "step" : undefined}
                          >
                            <StatusIcon complete={milestone.complete} current={isCurrentMilestone} />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white">{milestone.label}</p>
                              <p className="mt-1 break-words text-xs leading-5 text-neutral-400">
                                {milestone.detail}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </div>

                  {trackedSkillSummaries.length > 0 && (
                    <div className="mt-6 border-t border-neutral-800 pt-5">
                      <h3 className="text-lg font-semibold text-white">Tracked Skills</h3>
                      <p className="mt-1 text-sm text-neutral-400">
                        Skills recorded from completed session focuses.
                      </p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {trackedSkillSummaries.map((skill) => (
                          <div key={skill.focus} className="rounded border border-neutral-800 bg-neutral-950/80 p-3">
                            <p className="text-sm font-semibold text-white">{skill.focus}</p>
                            <p className="mt-1 text-xs text-neutral-400">
                              {skill.sessions} logged session{skill.sessions === 1 ? "" : "s"}
                              {skill.lastWorkedOn ? ` · Last worked ${skill.lastWorkedOn}` : ""}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {recentProgressHighlights.length > 0 && (
                    <div className="mt-6 border-t border-neutral-800 pt-5">
                      <h3 className="text-lg font-semibold text-white">Recent Progress Highlights</h3>
                      <div className="mt-4 grid gap-3 lg:grid-cols-3">
                        {recentProgressHighlights.map((highlight, index) => (
                          <div key={`${highlight.date}-${highlight.focus}-${index}`} className="rounded border border-amber-500/20 bg-amber-400/5 p-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">
                              {highlight.focus || "Session win"}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-neutral-200">{highlight.wins}</p>
                            {highlight.date && <p className="mt-2 text-xs text-neutral-500">{highlight.date}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 sm:pb-16 sm:pt-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(420px,0.38fr)_minmax(0,0.62fr)] xl:gap-8">
          <div className="space-y-8">
            <section id="case-file-section" className="rounded-lg border border-neutral-800 bg-neutral-950 p-5 sm:p-6">
              <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
                <div>
                  <h2 className="text-2xl font-bold sm:text-3xl">Dog Case File</h2>
                  <p className="mt-3 text-neutral-400">
                    Tell us the dog problem you want solved first. The AI will translate owner-friendly concerns into a structured Patriot K9 training plan.
                  </p>
                </div>

                <div className="flex w-full flex-col gap-2 lg:w-auto lg:flex-row">
                  {hasActiveDog && (
                    <button
                      type="button"
                      onClick={() => setProfileCollapsed((prev) => !prev)}
                      className="min-h-11 w-full rounded border border-neutral-600 px-4 py-3 font-semibold hover:bg-neutral-900 lg:w-auto"
                    >
                      {profileCollapsed ? "View / Edit Case File" : "Hide Case File"}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleAddDog}
                    className="min-h-11 w-full rounded border border-neutral-600 px-4 py-3 font-semibold hover:bg-neutral-900 lg:w-auto"
                  >
                    Start New Dog Evaluation
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveDogProfile}
                    disabled={profileSaving}
                    className="min-h-11 w-full rounded bg-amber-400 px-4 py-3 font-semibold text-black disabled:opacity-50 lg:w-auto"
                  >
                    {profileSaving
                      ? "Saving case file..."
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
              <section id="session-log-section" className="rounded-lg border border-neutral-800 bg-neutral-950 p-5 sm:p-6">
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
              <section id="first-session-section" className="rounded-lg border border-amber-500/30 bg-amber-400/10 p-6 sm:p-8">
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
                <section id="current-plan-section" className="rounded-lg border border-neutral-800 bg-neutral-950 p-5 sm:p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <h2 className="text-2xl font-bold sm:text-3xl">Current Training Plan</h2>
                      <p className="mt-3 text-neutral-400">
                        {workflowState === "plan_ready_to_log"
                          ? "Run the current plan, then log what happened so the trainer can progress from real results."
                          : "Review the active plan, log real training results, and then progress to the next session."}
                      </p>
                    </div>

                    <div className="w-full rounded border border-amber-500/30 bg-amber-400/10 px-4 py-3 text-center text-sm text-amber-200 lg:w-auto lg:text-left">
                      {workflowState === "plan_ready_to_log"
                        ? "Next action: Log today's training session"
                        : "Next action: Generate the next session"}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 rounded-lg border border-neutral-800 bg-black p-4 sm:grid-cols-2 lg:grid-cols-5 sm:p-5">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Active dog</p>
                      <p className="mt-1 truncate text-sm font-semibold text-white">{dogProfile.name || "Not set"}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Current phase</p>
                      <p className="mt-1 break-words text-sm font-semibold text-white">{currentPlanPhase}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Session type</p>
                      <p className="mt-1 break-words text-sm font-semibold text-white">{currentPlanSessionType || "Not specified"}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Estimated duration</p>
                      <p className="mt-1 text-sm font-semibold text-white">{currentPlanDuration}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Primary cue</p>
                      <p className="mt-1 break-words text-sm font-semibold text-white">{currentPlanPrimaryCue || "Not specified"}</p>
                    </div>
                  </div>

                  {workflowState === "progressing" && (
                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-neutral-400">
                        Use logged training results to guide the next progression.
                      </p>
                      <button
                        type="button"
                        onClick={handleGenerateNextSessionPlan}
                        disabled={!hasActiveDog || !hasSessions || planLoading}
                        className="min-h-11 w-full shrink-0 rounded bg-amber-400 px-5 py-3 font-semibold text-black hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:ring-offset-2 focus:ring-offset-neutral-950 disabled:opacity-50 sm:w-auto"
                      >
                        {planLoading ? "Generating..." : "Generate Next Session"}
                      </button>
                    </div>
                  )}

                  <div className="mt-6 overflow-hidden rounded-lg border border-neutral-800 bg-black p-3 sm:p-4">
                    {currentPlan ? (
                      parsedCurrentPlan.length > 0 ? (
                        <div className="space-y-2">
                          {parsedCurrentPlan.map((section) => {
                            const sectionId = `training-plan-${section.label
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, "-")}`;
                            const isOpen = openPlanSections.includes(section.label);

                            return (
                              <div
                                key={section.label}
                                className="overflow-hidden rounded border border-neutral-800 bg-neutral-950/80"
                              >
                                <button
                                  type="button"
                                  id={`${sectionId}-trigger`}
                                  aria-controls={`${sectionId}-panel`}
                                  aria-expanded={isOpen}
                                  onClick={() => togglePlanSection(section.label)}
                                  className="flex min-h-12 w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-300"
                                >
                                  <span className="min-w-0 text-xs font-semibold uppercase tracking-[0.16em] text-amber-400">
                                    {section.label}
                                  </span>
                                  <svg
                                    viewBox="0 0 16 16"
                                    className={`h-4 w-4 shrink-0 fill-none stroke-current text-amber-200 transition-transform duration-150 ${
                                      isOpen ? "rotate-180" : ""
                                    }`}
                                    aria-hidden="true"
                                  >
                                    <path d="m3 6 5 5 5-5" strokeWidth="1.8" />
                                  </svg>
                                </button>
                                {isOpen && (
                                  <div
                                    id={`${sectionId}-panel`}
                                    role="region"
                                    aria-labelledby={`${sectionId}-trigger`}
                                    className="border-t border-neutral-800 px-4 py-4"
                                  >
                                    <div className="whitespace-pre-wrap text-sm leading-7 text-neutral-200">
                                      {section.content}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
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

                  {savedPlanSummaries.length > 0 && (
                    <div className="mt-6 space-y-3">
                      <h3 className="text-xl font-semibold">Saved Session Plans</h3>
                      <div className="space-y-2">
                        {savedPlanSummaries.map((plan) => (
                          <button
                            key={plan.id}
                            type="button"
                            onClick={() => setCurrentPlan(plan.content)}
                            aria-pressed={plan.content === currentPlan}
                            className={`block min-h-12 w-full rounded border p-4 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-neutral-950 ${
                              plan.content === currentPlan
                                ? "border-amber-500/50 bg-amber-400/10 text-white"
                                : "border-neutral-800 bg-black text-neutral-300 hover:bg-neutral-900"
                            }`}
                          >
                            <span className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                              <span className="min-w-0">
                                <span className="block font-semibold text-white">
                                  {plan.outputType === "initial_session_plan"
                                    ? "First Session Plan"
                                    : "Next Session Plan"}
                                </span>
                                <span className="mt-1 block line-clamp-2 text-sm leading-6 text-neutral-400">
                                  {plan.objectivePreview}
                                </span>
                                {plan.phase && (
                                  <span className="mt-2 inline-flex rounded-full border border-neutral-700 px-2 py-0.5 text-xs font-medium text-neutral-300">
                                    Phase: {plan.phase}
                                  </span>
                                )}
                              </span>
                              <span className="shrink-0 text-xs text-neutral-500">
                                {new Date(plan.createdAt).toLocaleString()}
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </section>

                {workflowState === "progressing" && (
                  <section className="rounded-lg border border-neutral-800 bg-neutral-950 p-5 sm:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-amber-500/30 bg-neutral-900 text-lg font-bold text-amber-300">
                          {dogProfile.profileImageUrl ? (
                            <Image
                              src={dogProfile.profileImageUrl}
                              alt={`${dogProfile.name} active dog profile`}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            dogProfile.name.trim().slice(0, 1).toUpperCase() || "K9"
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">
                            Patriot K9 Coach
                          </p>
                          <h2 className="mt-1 truncate text-2xl font-bold sm:text-3xl">
                            Coaching for {dogProfile.name || "your active dog"}
                          </h2>
                          <p className="mt-2 text-sm text-neutral-400">
                            Get guidance based on your dog&apos;s case file, current training plan, and logged sessions.
                          </p>
                        </div>
                      </div>

                      <div className="flex w-full flex-wrap gap-2 lg:w-auto lg:justify-end">
                        <span className="rounded border border-neutral-700 bg-black/30 px-3 py-2 text-xs font-medium text-neutral-300">
                          Phase: {currentPlanPhase}
                        </span>
                        {isPremiumUser ? (
                          <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200">
                            Premium Active
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleUpgrade}
                            disabled={upgradeCheckoutLoading}
                            className="min-h-10 rounded bg-amber-400 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:ring-offset-2 focus:ring-offset-neutral-950 disabled:opacity-60"
                          >
                            {upgradeCheckoutLoading ? "Starting checkout..." : "Upgrade to Premium"}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2" aria-label="Coach context">
                      {hasActiveDog && (
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
                          Case file loaded
                        </span>
                      )}
                      {hasCurrentPlan && (
                        <span className="rounded-full border border-amber-500/30 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200">
                          Current plan loaded
                        </span>
                      )}
                      {hasSessions && (
                        <span className="rounded-full border border-neutral-700 bg-black/30 px-3 py-1 text-xs font-medium text-neutral-300">
                          Session history available
                        </span>
                      )}
                    </div>

                    <div className="mt-5 rounded border border-amber-500/25 bg-amber-400/5 p-4">
                      <p className="text-sm font-semibold text-amber-200">Need hands-on support?</p>
                      <p className="mt-1 text-sm leading-6 text-neutral-300">
                        Join the{" "}
                        <a
                          href="https://discord.gg/Mmb4KSp9Y8"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-amber-400 underline underline-offset-4 hover:text-amber-300"
                        >
                          Patriot K9 community Discord
                        </a>{" "}
                        for direct feedback and kennel community support.
                      </p>
                    </div>

                    <div className="mt-6">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-400">
                        Suggested questions
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {coachPromptSuggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => setInput(suggestion)}
                            disabled={loading || isFreeChatLimitReached}
                            className="min-h-10 rounded-full border border-neutral-700 bg-black/30 px-3 py-2 text-left text-sm text-neutral-200 hover:border-amber-500/50 hover:bg-amber-400/10 focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 overflow-hidden rounded-lg border border-neutral-800 bg-black p-3 sm:p-4">
                      <div
                        ref={chatContainerRef}
                        className="max-h-[420px] space-y-4 overflow-x-hidden overflow-y-auto pr-1 sm:pr-2"
                        aria-live="polite"
                      >
                        {messages.length === 0 && !loading && (
                          <div className="rounded border border-neutral-800 bg-neutral-950/80 p-4 text-sm text-neutral-300">
                            <p className="font-semibold text-white">Start with the training decision in front of you.</p>
                            <p className="mt-2 leading-6 text-neutral-400">
                              Ask about today&apos;s session, behavior changes, progression, rewards, corrections, or the next practical step.
                            </p>
                            <ul className="mt-3 grid gap-2 text-neutral-300 sm:grid-cols-2">
                              <li>Today&apos;s training priority</li>
                              <li>Whether to add distraction</li>
                              <li>How to recover after a setback</li>
                              <li>When to progress the plan</li>
                            </ul>
                          </div>
                        )}

                        {messages.map((message, index) => (
                          <div
                            key={`${message.role}-${index}`}
                            className={`max-w-[96%] break-words whitespace-pre-wrap rounded-lg border px-4 py-3 text-sm leading-6 sm:max-w-[82%] ${
                              message.role === "user"
                                ? "ml-auto border-amber-500/30 bg-amber-400 text-black"
                                : "mr-auto border-neutral-800 bg-neutral-900 text-neutral-100"
                            }`}
                          >
                            <p
                              className={`mb-1 text-xs font-semibold uppercase tracking-[0.14em] ${
                                message.role === "user" ? "text-black/70" : "text-amber-300"
                              }`}
                            >
                              {message.role === "user" ? "You" : "Patriot K9 Coach"}
                            </p>
                            {message.content}
                          </div>
                        ))}

                        {loading && (
                          <div
                            className="mr-auto max-w-[96%] rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-neutral-300 sm:max-w-[82%]"
                            role="status"
                          >
                            Patriot K9 Coach is preparing guidance for {dogProfile.name || "your dog"}...
                          </div>
                        )}
                      </div>
                    </div>

                    {isFreeChatLimitReached ? (
                      <div className="mt-6 rounded-lg border border-amber-500/30 bg-amber-400/10 p-5 sm:p-6" aria-live="polite">
                        <p className="text-sm uppercase tracking-[0.2em] text-amber-300">
                          Free coaching complete
                        </p>
                        <h3 className="mt-3 text-xl font-bold sm:text-2xl">
                          Continue with Patriot K9 Coach
                        </h3>
                        <p className="mt-3 max-w-2xl text-neutral-200">
                          You&apos;ve used the free coaching messages for this account. Upgrade to unlock unlimited coaching, ongoing sessions, session history, and progression support.
                        </p>
                        {upgradeCheckoutError && (
                          <p className="mt-4 text-sm text-red-200" role="alert">{upgradeCheckoutError}</p>
                        )}
                        <button
                          type="button"
                          onClick={handleUpgrade}
                          disabled={upgradeCheckoutLoading}
                          className="mt-5 min-h-11 w-full rounded bg-amber-400 px-5 py-3 font-semibold text-black hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:ring-offset-2 focus:ring-offset-neutral-950 disabled:opacity-60 sm:w-auto"
                        >
                          {upgradeCheckoutLoading ? "Starting checkout..." : "Upgrade to Premium"}
                        </button>
                      </div>
                    ) : (
                      <div className="sticky bottom-3 z-10 mt-6 rounded-lg border border-neutral-700 bg-neutral-950/95 p-3 shadow-[0_12px_32px_rgba(0,0,0,0.3)] backdrop-blur sm:p-4">
                        <label htmlFor="patriot-k9-coach-input" className="sr-only">
                          Ask Patriot K9 Coach about your dog&apos;s training
                        </label>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                          <textarea
                            id="patriot-k9-coach-input"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" && !event.shiftKey) {
                                event.preventDefault();
                                void handleSend();
                              }
                            }}
                            placeholder="Ask Patriot K9 Coach about your dog&apos;s training..."
                            disabled={loading || !hasActiveDog}
                            className="min-h-[104px] w-full flex-1 resize-y rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-base leading-6 text-white outline-none placeholder:text-neutral-500 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-[88px]"
                          />

                          <button
                            type="button"
                            onClick={handleSend}
                            disabled={loading || !input.trim() || !hasActiveDog}
                            className="min-h-11 w-full rounded bg-amber-400 px-6 py-3 font-semibold text-black hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:ring-offset-2 focus:ring-offset-neutral-950 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                          >
                            {loading ? "Preparing..." : "Send"}
                          </button>
                        </div>
                        <p className="mt-3 text-xs text-neutral-500">
                          Press Enter to send. Use Shift+Enter for a new line.
                        </p>
                        {!isPremiumUser && (
                          <p className="mt-1 text-xs text-amber-300/90">
                            Free plan includes 3 AI messages. Upgrade for unlimited coaching.
                          </p>
                        )}
                      </div>
                    )}
                  </section>
                )}

                {(workflowState === "plan_ready_to_log" || workflowState === "progressing") && (
                  <section className="rounded-lg border border-neutral-800 bg-neutral-950 p-5 sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">
                          Training Journal
                        </p>
                        <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Mission Reports</h2>
                        <p className="mt-3 text-neutral-400">
                          Review previous training sessions, progress, and coaching decisions.
                        </p>
                      </div>
                      {isPremiumUser && (
                        <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-200">
                          Premium Active
                        </span>
                      )}
                    </div>

                    <div className="mt-6 grid gap-3 rounded-lg border border-neutral-800 bg-black p-4 sm:grid-cols-2 xl:grid-cols-5">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Completed sessions</p>
                        <p className="mt-1 text-lg font-semibold text-white">{sessionLogs.length}</p>
                      </div>
                      {dogProfile.name && (
                        <div className="min-w-0">
                          <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Active dog</p>
                          <p className="mt-1 truncate text-sm font-semibold text-white">{dogProfile.name}</p>
                        </div>
                      )}
                      {hasCurrentPlan && (
                        <div className="min-w-0">
                          <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Current phase</p>
                          <p className="mt-1 break-words text-sm font-semibold text-white">{currentPlanPhase}</p>
                        </div>
                      )}
                      {latestSession?.date && (
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Last completed</p>
                          <p className="mt-1 text-sm font-semibold text-white">{latestSession.date}</p>
                        </div>
                      )}
                      {dogProfile.mainGoal && (
                        <div className="min-w-0">
                          <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Training goal</p>
                          <p className="mt-1 break-words text-sm font-semibold text-white">{dogProfile.mainGoal}</p>
                        </div>
                      )}
                    </div>

                    {sessionLogs.length === 0 ? (
                      <div className="mt-6 rounded-lg border border-neutral-800 bg-black p-5 text-center sm:p-6">
                        <h3 className="text-xl font-semibold text-white">No Mission Reports Yet</h3>
                        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-neutral-400">
                          Complete your first training session to begin tracking your dog&apos;s progress.
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            document.getElementById("session-log-section")?.scrollIntoView({
                              behavior: "smooth",
                              block: "start",
                            })
                          }
                          className="mt-5 min-h-11 w-full rounded bg-amber-400 px-5 py-3 font-semibold text-black hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:ring-offset-2 focus:ring-offset-neutral-950 sm:w-auto"
                        >
                          Log Today&apos;s Session
                        </button>
                      </div>
                    ) : (
                      <div className="relative mt-6 space-y-4 before:absolute before:bottom-5 before:left-[11px] before:top-5 before:w-px before:bg-neutral-800 sm:before:left-[15px]">
                        {visibleMissionReports.map((log, index) => {
                          const outcome = getSessionOutcome(log.wins);
                          const reportNumber = sessionLogs.length - index;
                          const isLatestReport = index === 0;

                          return (
                            <article key={log.id} className="relative pl-8 sm:pl-10">
                              <span
                                className={`absolute left-0 top-5 flex h-[23px] w-[23px] items-center justify-center rounded-full border text-xs font-bold sm:h-[31px] sm:w-[31px] ${
                                  isLatestReport
                                    ? "border-amber-500/50 bg-amber-400/15 text-amber-200"
                                    : "border-neutral-700 bg-neutral-950 text-neutral-400"
                                }`}
                                aria-hidden="true"
                              >
                                {reportNumber}
                              </span>
                              <div
                                className={`rounded-lg border p-4 sm:p-5 ${
                                  isLatestReport
                                    ? "border-amber-500/30 bg-amber-400/5"
                                    : "border-neutral-800 bg-black"
                                }`}
                              >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <h3 className="text-lg font-semibold text-white sm:text-xl">
                                        Mission #{reportNumber}
                                      </h3>
                                      {isLatestReport && (
                                        <span className="rounded-full border border-amber-500/30 bg-amber-400/10 px-2 py-0.5 text-xs font-semibold text-amber-200">
                                          Latest report
                                        </span>
                                      )}
                                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-200">
                                        Completed
                                      </span>
                                    </div>
                                    {log.date && <p className="mt-2 text-sm text-neutral-400">{log.date}</p>}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSession(log.id)}
                                    className="min-h-10 w-full rounded border border-neutral-700 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-300 sm:w-auto"
                                    aria-label={`Delete Mission ${reportNumber}`}
                                  >
                                    Delete
                                  </button>
                                </div>

                                {log.focus && (
                                  <div className="mt-4 rounded border border-neutral-800 bg-neutral-950/80 px-3 py-3">
                                    <p className="text-xs uppercase tracking-[0.16em] text-amber-400">Training focus</p>
                                    <p className="mt-1 text-sm font-semibold text-white">{log.focus}</p>
                                  </div>
                                )}

                                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                  {log.duration && (
                                    <div className="rounded border border-neutral-800 bg-neutral-950/80 p-3">
                                      <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Duration</p>
                                      <p className="mt-1 text-sm font-semibold text-white">{log.duration}</p>
                                    </div>
                                  )}
                                  {outcome.result !== "Not set" && (
                                    <div className="rounded border border-neutral-800 bg-neutral-950/80 p-3">
                                      <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Outcome</p>
                                      <p className="mt-1 text-sm font-semibold text-white">{outcome.result}</p>
                                    </div>
                                  )}
                                </div>

                                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                                  {outcome.winsSummary !== "Not set" && (
                                    <div className="rounded border border-neutral-800 bg-neutral-950/80 p-3">
                                      <p className="text-xs uppercase tracking-[0.16em] text-amber-400">Wins</p>
                                      <p className="mt-2 text-sm leading-6 text-neutral-200">{outcome.winsSummary}</p>
                                    </div>
                                  )}
                                  {log.issues && (
                                    <div className="rounded border border-neutral-800 bg-neutral-950/80 p-3">
                                      <p className="text-xs uppercase tracking-[0.16em] text-amber-400">Challenges</p>
                                      <p className="mt-2 text-sm leading-6 text-neutral-200">{log.issues}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    )}

                    {olderMissionReportsCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowOlderMissionReports((showOlder) => !showOlder)}
                        aria-expanded={showOlderMissionReports}
                        className="mt-5 min-h-11 w-full rounded border border-neutral-700 px-4 py-3 text-sm font-semibold text-neutral-200 hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-300 sm:w-auto"
                      >
                        {showOlderMissionReports
                          ? "Show Recent Mission Reports"
                          : `View ${olderMissionReportsCount} Older Mission Report${olderMissionReportsCount === 1 ? "" : "s"}`}
                      </button>
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

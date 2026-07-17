import {
  getAvailableMainGoals,
  getDefaultMainGoal,
  normalizeGoalType,
  normalizeMainGoal,
} from "@/lib/dogGoals";

export const severityOptions = ["Mild", "Moderate", "Serious", "Urgent"] as const;

export const durationOptions = [
  "Just started",
  "A few weeks",
  "A few months",
  "Since puppyhood",
  "Not sure",
] as const;

export const whereItHappensOptions = [
  "Home",
  "Walks",
  "Public places",
  "Around dogs",
  "Around people",
  "Visitors at the door",
  "In the crate",
  "When left alone",
  "Multiple situations",
] as const;

export const previousTrainingOptions = [
  "No formal training",
  "Basic obedience",
  "Group class",
  "Private trainer",
  "Board and train",
  "Self-taught",
  "Unknown",
] as const;

export const equipmentOptions = [
  "Flat collar",
  "Harness",
  "Slip lead",
  "Prong collar",
  "E-collar",
  "Long line",
  "Crate",
  "Food rewards",
  "Toy rewards",
  "None",
] as const;

export const sexOptions = ["Not set", "Male", "Female"] as const;

export const homeEnvironmentOptions = [
  "Not set",
  "Apartment",
  "Neighborhood",
  "Rural property",
] as const;

export type DogCaseFile = {
  id?: string;
  profileImagePath?: string | null;
  profileImageUrl?: string | null;
  name: string;
  breed: string;
  age: string;
  sex: string;
  weight: string;
  goalType: string;
  mainGoal: string;
  selectedGoals: string[];
  severity: string;
  issueDuration: string;
  whereItHappens: string[];
  childrenInHome: boolean;
  otherDogsInHome: boolean;
  catsOrSmallAnimals: boolean;
  frequentVisitors: boolean;
  homeEnvironment: string;
  previousTraining: string;
  equipmentUsed: string[];
  rewardType: string;
  skillLevel: string;
  triedAlready: string;
  successLooksLike: string;
  additionalNotes: string;
  customNotes: string;
};

type StoredCaseFilePayload = {
  version: 1;
  breed?: string;
  age?: string;
  sex?: string;
  weight?: string;
  selectedGoals?: string[];
  severity?: string;
  issueDuration?: string;
  whereItHappens?: string[];
  childrenInHome?: boolean;
  otherDogsInHome?: boolean;
  catsOrSmallAnimals?: boolean;
  frequentVisitors?: boolean;
  homeEnvironment?: string;
  previousTraining?: string;
  equipmentUsed?: string[];
  triedAlready?: string;
  successLooksLike?: string;
  additionalNotes?: string;
};

const STORAGE_PREFIX = "__PATRIOT_K9_CASE_FILE__";

export const emptyDogCaseFile: DogCaseFile = {
  name: "",
  breed: "",
  age: "",
  sex: "Not set",
  weight: "",
  goalType: "Behavior Problems",
  mainGoal: "Pulling on leash",
  selectedGoals: ["Pulling on leash"],
  severity: "Moderate",
  issueDuration: "A few weeks",
  whereItHappens: [],
  childrenInHome: false,
  otherDogsInHome: false,
  catsOrSmallAnimals: false,
  frequentVisitors: false,
  homeEnvironment: "Not set",
  previousTraining: "No formal training",
  equipmentUsed: [],
  rewardType: "Food",
  skillLevel: "Beginner",
  triedAlready: "",
  successLooksLike: "",
  additionalNotes: "",
  customNotes: "",
};

const protocolMap: Record<string, string[]> = {
  "Pulling on leash": [
    "Leash Pressure Communication System",
    "Structured Heel Protocol",
    "Engagement Development Protocol",
  ],
  Barking: [
    "Threshold Management Protocol",
    "Handler Leadership System",
    "Public Neutrality Protocol",
    "Place Command System",
  ],
  "Puppy biting": [
    "Puppy Foundation Protocol",
    "Drive Capping System",
    "Engagement Development Protocol",
  ],
  "Potty training": [
    "Puppy Foundation Protocol",
    "Crate Conditioning System",
    "Routine Structure",
  ],
  "Crate training": [
    "Crate Conditioning System",
    "Threshold Management Protocol",
  ],
  "Reactivity around dogs": [
    "Reactivity Rehabilitation Protocol",
    "Threshold Management Protocol",
    "Public Neutrality Protocol",
  ],
  "Reactivity around people": [
    "Reactivity Rehabilitation Protocol",
    "Public Neutrality Protocol",
    "Handler Leadership System",
  ],
  "Fear or confidence issues": [
    "Fear Rehabilitation Protocol",
    "Structured Socialization Protocol",
  ],
  "Jumping on people": [
    "Handler Leadership System",
    "Place Command System",
    "Impulse Control",
  ],
  "Resource guarding": [
    "Neutral Possession System",
    "Relationship Rehabilitation Protocol",
    "Handler Leadership System",
  ],
  "Separation anxiety": [
    "Crate Conditioning System",
    "Relationship Rehabilitation Protocol",
    "Threshold Management Protocol",
  ],
  "Come when called": [
    "Recall Reliability Protocol",
    "Engagement Development Protocol",
    "Long Line Progression",
  ],
  "German Shepherd training": [
    "Drive Capping System",
    "Structured Heel Protocol",
    "Handler Leadership System",
  ],
  "Service dog foundation": [
    "Service Dog Foundation Protocol",
    "Public Neutrality Protocol",
    "Structured Socialization Protocol",
  ],
  "Multi-dog household structure": [
    "Multi-Dog Household Protocol",
    "Handler Leadership System",
    "Place Command System",
  ],
};

const dedupe = (values: string[]) => [...new Set(values.filter(Boolean))];

const normalizeSelectedGoals = (
  goalType: string,
  selectedGoals: string[] | undefined,
  fallbackGoal: string
) => {
  const availableGoals = getAvailableMainGoals(goalType, fallbackGoal);
  const merged = dedupe([...(selectedGoals ?? []), fallbackGoal]).slice(0, 3);

  if (merged.length === 0) {
    return [getDefaultMainGoal(goalType)];
  }

  return merged.map((goal) => (availableGoals.includes(goal) ? goal : goal));
};

const parseStoredCaseFile = (rawNotes?: string | null): StoredCaseFilePayload | null => {
  if (!rawNotes) return null;

  if (rawNotes.startsWith(STORAGE_PREFIX)) {
    try {
      return JSON.parse(rawNotes.slice(STORAGE_PREFIX.length)) as StoredCaseFilePayload;
    } catch {
      return null;
    }
  }

  return null;
};

export const hydrateDogCaseFile = (profile: {
  id?: string;
  profile_image_path?: string | null;
  profile_image_url?: string | null;
  name?: string | null;
  goal_type?: string | null;
  main_goal?: string | null;
  reward_type?: string | null;
  skill_level?: string | null;
  custom_notes?: string | null;
}) => {
  const parsed = parseStoredCaseFile(profile.custom_notes);
  const normalizedGoalType = normalizeGoalType(profile.goal_type);
  const normalizedMainGoal = normalizeMainGoal(normalizedGoalType, profile.main_goal);
  const resolvedGoalType = normalizedMainGoal.goalType;
  const resolvedMainGoal = normalizedMainGoal.goal;
  const selectedGoals = normalizeSelectedGoals(
    resolvedGoalType,
    parsed?.selectedGoals,
    resolvedMainGoal
  );

  return {
    ...emptyDogCaseFile,
    id: profile.id,
    profileImagePath: profile.profile_image_path ?? null,
    profileImageUrl: profile.profile_image_url ?? null,
    name: profile.name ?? "",
    goalType: resolvedGoalType,
    mainGoal: selectedGoals.includes(resolvedMainGoal)
      ? resolvedMainGoal
      : selectedGoals[0],
    selectedGoals,
    rewardType: profile.reward_type ?? "Food",
    skillLevel: profile.skill_level ?? "Beginner",
    breed: parsed?.breed ?? "",
    age: parsed?.age ?? "",
    sex: parsed?.sex ?? "Not set",
    weight: parsed?.weight ?? "",
    severity: parsed?.severity ?? "Moderate",
    issueDuration: parsed?.issueDuration ?? "A few weeks",
    whereItHappens: parsed?.whereItHappens ?? [],
    childrenInHome: parsed?.childrenInHome ?? false,
    otherDogsInHome: parsed?.otherDogsInHome ?? false,
    catsOrSmallAnimals: parsed?.catsOrSmallAnimals ?? false,
    frequentVisitors: parsed?.frequentVisitors ?? false,
    homeEnvironment: parsed?.homeEnvironment ?? "Not set",
    previousTraining: parsed?.previousTraining ?? "No formal training",
    equipmentUsed: parsed?.equipmentUsed ?? [],
    triedAlready: parsed?.triedAlready ?? "",
    successLooksLike: parsed?.successLooksLike ?? "",
    additionalNotes:
      parsed?.additionalNotes ??
      (profile.custom_notes?.startsWith(STORAGE_PREFIX) ? "" : profile.custom_notes ?? ""),
    customNotes:
      parsed?.additionalNotes ??
      (profile.custom_notes?.startsWith(STORAGE_PREFIX) ? "" : profile.custom_notes ?? ""),
  } satisfies DogCaseFile;
};

export const serializeDogCaseFile = (profile: DogCaseFile) => {
  const payload: StoredCaseFilePayload = {
    version: 1,
    breed: profile.breed.trim(),
    age: profile.age.trim(),
    sex: profile.sex,
    weight: profile.weight.trim(),
    selectedGoals: profile.selectedGoals.slice(0, 3),
    severity: profile.severity,
    issueDuration: profile.issueDuration,
    whereItHappens: profile.whereItHappens,
    childrenInHome: profile.childrenInHome,
    otherDogsInHome: profile.otherDogsInHome,
    catsOrSmallAnimals: profile.catsOrSmallAnimals,
    frequentVisitors: profile.frequentVisitors,
    homeEnvironment: profile.homeEnvironment,
    previousTraining: profile.previousTraining,
    equipmentUsed: profile.equipmentUsed,
    triedAlready: profile.triedAlready.trim(),
    successLooksLike: profile.successLooksLike.trim(),
    additionalNotes: profile.additionalNotes.trim(),
  };

  return `${STORAGE_PREFIX}${JSON.stringify(payload)}`;
};

export const toggleMultiValue = (currentValues: string[], value: string, max?: number) => {
  if (currentValues.includes(value)) {
    return currentValues.filter((item) => item !== value);
  }

  if (typeof max === "number" && currentValues.length >= max) {
    return currentValues;
  }

  return [...currentValues, value];
};

export const ensurePrimaryPriority = (selectedGoals: string[], currentMainGoal: string) => {
  if (selectedGoals.length === 0) {
    return "";
  }

  if (selectedGoals.includes(currentMainGoal)) {
    return currentMainGoal;
  }

  return selectedGoals[0];
};

const booleanSummary = (label: string, enabled: boolean) => (enabled ? label : null);

export const getHouseholdContextSummary = (profile: DogCaseFile) =>
  dedupe(
    [
      booleanSummary("Children in home", profile.childrenInHome),
      booleanSummary("Other dogs in home", profile.otherDogsInHome),
      booleanSummary("Cats or small animals in home", profile.catsOrSmallAnimals),
      booleanSummary("Frequent visitors", profile.frequentVisitors),
      profile.homeEnvironment !== "Not set" ? profile.homeEnvironment : null,
    ].filter(Boolean) as string[]
  );

export const getProtocolRecommendations = (profile: DogCaseFile) => {
  const mappedProtocols = profile.selectedGoals.flatMap((goal) => protocolMap[goal] ?? []);
  return dedupe(mappedProtocols);
};

export const buildDogCaseFileContext = (profile: DogCaseFile) => {
  const householdContext = getHouseholdContextSummary(profile);
  const protocols = getProtocolRecommendations(profile);

  return `Name: ${profile.name || "unknown"}
Breed: ${profile.breed || "unknown"}
Age: ${profile.age || "unknown"}
Sex: ${profile.sex || "unknown"}
Weight: ${profile.weight || "unknown"}
Goal Category: ${normalizeGoalType(profile.goalType)}
Selected Goals/Problems: ${profile.selectedGoals.join(", ") || "none"}
Primary Priority: ${profile.mainGoal || "unknown"}
Severity: ${profile.severity || "unknown"}
Duration: ${profile.issueDuration || "unknown"}
Where It Happens: ${profile.whereItHappens.join(", ") || "not provided"}
Household Context: ${householdContext.join(", ") || "not provided"}
Previous Training: ${profile.previousTraining || "unknown"}
Equipment Used: ${profile.equipmentUsed.join(", ") || "not provided"}
Reward Type: ${profile.rewardType || "unknown"}
Skill Level: ${profile.skillLevel || "unknown"}
What Has Been Tried: ${profile.triedAlready || "none"}
What Success Looks Like: ${profile.successLooksLike || "none"}
Additional Notes: ${profile.additionalNotes || "none"}
Likely Protocol Mapping: ${protocols.join(", ") || "none identified"}`;
};

export const goalTypeOptions = [
  "Puppy Foundation",
  "Behavior Problems",
  "Basic Obedience",
  "Advanced Training",
] as const;

export const mainGoalOptions: Record<(typeof goalTypeOptions)[number], string[]> = {
  "Puppy Foundation": [
    "Puppy biting",
    "Potty training",
    "Crate training",
    "Socialization",
    "Confidence building",
    "Basic puppy obedience",
  ],
  "Behavior Problems": [
    "Pulling on leash",
    "Barking",
    "Jumping on people",
    "Reactivity around dogs",
    "Reactivity around people",
    "Separation anxiety",
    "Resource guarding",
    "Fear or confidence issues",
    "Aggression concerns",
  ],
  "Basic Obedience": [
    "Come when called",
    "Walking nicely on leash",
    "Sit / Down / Stay",
    "Place command",
    "General obedience",
    "Engagement and focus",
  ],
  "Advanced Training": [
    "Off-leash reliability",
    "Public manners",
    "Service dog foundation",
    "E-collar foundation",
    "Working dog foundation",
    "German Shepherd training",
    "Multi-dog household structure",
  ],
};

const legacyGoalTypeMap: Record<string, (typeof goalTypeOptions)[number]> = {
  Obedience: "Basic Obedience",
  "Behavior Fix": "Behavior Problems",
  "AKC Obedience": "Basic Obedience",
  Rally: "Advanced Training",
  Agility: "Advanced Training",
  "Service Dog Foundation": "Advanced Training",
  "Protection Foundation": "Advanced Training",
};

const legacyMainGoalMap: Record<string, { goalType: (typeof goalTypeOptions)[number]; goal: string }> = {
  Heel: { goalType: "Basic Obedience", goal: "Walking nicely on leash" },
  "Heel position": { goalType: "Basic Obedience", goal: "Walking nicely on leash" },
  "Heel Position": { goalType: "Basic Obedience", goal: "Walking nicely on leash" },
  Recall: { goalType: "Basic Obedience", goal: "Come when called" },
  "Loose leash walking": {
    goalType: "Basic Obedience",
    goal: "Walking nicely on leash",
  },
  "Sit stay": { goalType: "Basic Obedience", goal: "Sit / Down / Stay" },
  "Down stay": { goalType: "Basic Obedience", goal: "Sit / Down / Stay" },
  Sit: { goalType: "Basic Obedience", goal: "Sit / Down / Stay" },
  Down: { goalType: "Basic Obedience", goal: "Sit / Down / Stay" },
  Stay: { goalType: "Basic Obedience", goal: "Sit / Down / Stay" },
  "Place command": { goalType: "Basic Obedience", goal: "Place command" },
  Place: { goalType: "Basic Obedience", goal: "Place command" },
  "Engagement and focus": {
    goalType: "Basic Obedience",
    goal: "Engagement and focus",
  },
  Engagement: { goalType: "Basic Obedience", goal: "Engagement and focus" },
  Neutrality: { goalType: "Advanced Training", goal: "Public manners" },
  "Reactivity work": { goalType: "Behavior Problems", goal: "Reactivity around dogs" },
  "Public exposure": { goalType: "Advanced Training", goal: "Public manners" },
  "Impulse control": { goalType: "Basic Obedience", goal: "Impulse control" },
  "Toy control": { goalType: "Advanced Training", goal: "Working dog foundation" },
  "Crate training": { goalType: "Puppy Foundation", goal: "Crate training" },
};

export const normalizeGoalType = (goalType?: string | null) => {
  if (!goalType) {
    return "Behavior Problems" as const;
  }

  if ((goalTypeOptions as readonly string[]).includes(goalType)) {
    return goalType as (typeof goalTypeOptions)[number];
  }

  return legacyGoalTypeMap[goalType] ?? ("Behavior Problems" as const);
};

export const normalizeMainGoal = (goalType: string, mainGoal?: string | null) => {
  const normalizedGoalType = normalizeGoalType(goalType);

  if (!mainGoal) {
    return {
      goalType: normalizedGoalType,
      goal: mainGoalOptions[normalizedGoalType][0],
      isLegacy: false,
    };
  }

  if (mainGoalOptions[normalizedGoalType].includes(mainGoal)) {
    return {
      goalType: normalizedGoalType,
      goal: mainGoal,
      isLegacy: false,
    };
  }

  const mappedLegacyGoal = legacyMainGoalMap[mainGoal];

  if (mappedLegacyGoal) {
    return {
      goalType: mappedLegacyGoal.goalType,
      goal: mappedLegacyGoal.goal,
      isLegacy: false,
    };
  }

  return {
    goalType: normalizedGoalType,
    goal: mainGoal,
    isLegacy: true,
  };
};

export const getDefaultMainGoal = (goalType: string) => {
  const normalizedGoalType = normalizeGoalType(goalType);
  return mainGoalOptions[normalizedGoalType][0];
};

export const getAvailableMainGoals = (goalType: string, currentMainGoal?: string) => {
  const normalizedGoalType = normalizeGoalType(goalType);
  const options = [...mainGoalOptions[normalizedGoalType]];

  if (currentMainGoal && !options.includes(currentMainGoal)) {
    options.push(currentMainGoal);
  }

  return options;
};

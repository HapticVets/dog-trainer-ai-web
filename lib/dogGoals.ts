export const goalTypeOptions = [
  "Puppy Foundation",
  "Behavior Problems",
  "Obedience",
  "Advanced Training",
] as const;

export const mainGoalOptions: Record<(typeof goalTypeOptions)[number], string[]> = {
  "Puppy Foundation": [
    "Puppy biting",
    "Potty training",
    "Crate training",
    "Socialization",
    "Name recognition",
    "Basic obedience",
  ],
  "Behavior Problems": [
    "Barking",
    "Jumping on people",
    "Pulling on leash",
    "Reactivity around dogs",
    "Reactivity around people",
    "Separation anxiety",
    "Resource guarding",
    "Aggression concerns",
    "Fear or confidence issues",
  ],
  Obedience: [
    "Recall",
    "Heel position",
    "Sit stay",
    "Down stay",
    "Place command",
    "Engagement and focus",
    "Loose leash walking",
  ],
  "Advanced Training": [
    "Public manners",
    "Service dog foundation",
    "Off-leash reliability",
    "Working dog foundation",
    "German Shepherd training",
    "Multi-dog household structure",
  ],
};

const legacyGoalTypeMap: Record<string, (typeof goalTypeOptions)[number]> = {
  "Behavior Fix": "Behavior Problems",
  "AKC Obedience": "Obedience",
  Rally: "Advanced Training",
  Agility: "Advanced Training",
  "Service Dog Foundation": "Advanced Training",
  "Protection Foundation": "Advanced Training",
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

import {
  emptyDogCaseFile,
  serializeDogCaseFile,
} from "@/lib/dogCaseFile";
import {
  getAvailableMainGoals,
  isKennelBreedingManagementGoalType,
  kennelBreedingManagementGoalType,
  normalizeGoalType,
  goalTypeOptions,
} from "@/lib/dogGoals";

export const dogRecordTypes = ["personal", "client", "breeding"] as const;

export type DogRecordType = (typeof dogRecordTypes)[number];

export type AdminDogProfile = {
  id: string;
  name: string;
  goal_type: string | null;
  main_goal: string | null;
  reward_type: string | null;
  skill_level: string | null;
  custom_notes: string | null;
  profile_image_path: string | null;
  profile_image_url?: string | null;
  record_type: DogRecordType;
  client_owner_name: string | null;
  client_owner_email: string | null;
  client_owner_phone: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateAdminDogInput = {
  name: string;
  breed?: string;
  age?: string;
  sex?: "Male" | "Female";
  goalType?: string;
  mainGoal?: string;
  recordType: DogRecordType;
  clientOwnerName?: string;
  clientOwnerEmail?: string;
  clientOwnerPhone?: string;
};

export const isDogRecordType = (value: unknown): value is DogRecordType =>
  typeof value === "string" && dogRecordTypes.includes(value as DogRecordType);

export const isInternalDogRecord = (value: unknown): value is DogRecordType =>
  isDogRecordType(value);

export const dogRecordTypeLabel: Record<DogRecordType, string> = {
  personal: "Personal Dog",
  client: "Client Dog",
  breeding: "Breeding / Kennel Dog",
};

export const getAdminDogGoalTypeOptions = (recordType: DogRecordType) =>
  recordType === "breeding"
    ? [...goalTypeOptions, kennelBreedingManagementGoalType]
    : [...goalTypeOptions];

export const normalizeAdminDogGoalType = (goalType: string | undefined, recordType: DogRecordType) => {
  if (recordType === "breeding" && isKennelBreedingManagementGoalType(goalType)) {
    return kennelBreedingManagementGoalType;
  }

  return normalizeGoalType(goalType);
};

export const isValidAdminDogGoalType = (goalType: string | undefined, recordType: DogRecordType) =>
  Boolean(goalType) && getAdminDogGoalTypeOptions(recordType).includes(goalType as never);

export const isValidAdminDogMainGoal = (goalType: string, mainGoal: string | undefined) => {
  if (isKennelBreedingManagementGoalType(goalType)) return !mainGoal?.trim();
  if (!mainGoal?.trim()) return true;
  return getAvailableMainGoals(goalType).includes(mainGoal.trim());
};

export const buildAdminDogPayload = (userId: string, input: CreateAdminDogInput) => {
  const goalType = normalizeAdminDogGoalType(input.goalType, input.recordType);
  const mainGoal = isKennelBreedingManagementGoalType(goalType)
    ? null
    : input.mainGoal?.trim() || null;
  const caseFile = {
    ...emptyDogCaseFile,
    name: input.name.trim(),
    breed: input.breed?.trim() ?? "",
    age: input.age?.trim() ?? "",
    sex: input.sex ?? "Not set",
    goalType,
    mainGoal: mainGoal ?? "",
    selectedGoals: mainGoal ? [mainGoal] : [],
  };

  return {
    clerk_user_id: userId,
    name: caseFile.name,
    goal_type: goalType,
    main_goal: mainGoal,
    reward_type: caseFile.rewardType,
    skill_level: caseFile.skillLevel,
    custom_notes: serializeDogCaseFile(caseFile),
    record_type: input.recordType,
    client_owner_name:
      input.recordType === "client" ? input.clientOwnerName?.trim() || null : null,
    client_owner_email:
      input.recordType === "client" ? input.clientOwnerEmail?.trim() || null : null,
    client_owner_phone:
      input.recordType === "client" ? input.clientOwnerPhone?.trim() || null : null,
    updated_at: new Date().toISOString(),
  };
};

import { supabaseAdmin } from "@/lib/supabase-admin";

export type GraduationRequirement = {
  title: string;
  completed: boolean;
};

export type DogTrainingPhase = {
  id: string;
  dogId: string;
  phaseKey: string | null;
  phaseTitle: string | null;
  phaseDescription: string | null;
  currentObjective: string | null;
  progressPercent: number;
  estimatedTimeRemaining: string | null;
  graduationRequirements: GraduationRequirement[];
  nextPhaseKey: string | null;
  nextPhaseTitle: string | null;
  nextPhasePreview: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DogTrainingPhaseUpdate = Omit<
  DogTrainingPhase,
  "id" | "dogId" | "createdAt" | "updatedAt"
>;

const getOwnedDog = async (userId: string, dogId: string) => {
  const { data, error } = await supabaseAdmin
    .from("dog_profiles")
    .select("id")
    .eq("id", dogId)
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
};

const normalizeRequirements = (value: unknown): GraduationRequirement[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const candidate = item as { title?: unknown; completed?: unknown };
    if (typeof candidate.title !== "string" || !candidate.title.trim()) return [];
    return [{ title: candidate.title.trim(), completed: candidate.completed === true }];
  });
};

const mapPhase = (record: {
  id: string;
  dog_id: string;
  phase_key: string | null;
  phase_title: string | null;
  phase_description: string | null;
  current_objective: string | null;
  progress_percent: number | null;
  estimated_time_remaining: string | null;
  graduation_requirements: unknown;
  next_phase_key: string | null;
  next_phase_title: string | null;
  next_phase_preview: string | null;
  created_at: string;
  updated_at: string;
}): DogTrainingPhase => ({
  id: record.id,
  dogId: record.dog_id,
  phaseKey: record.phase_key,
  phaseTitle: record.phase_title,
  phaseDescription: record.phase_description,
  currentObjective: record.current_objective,
  progressPercent: Math.min(Math.max(record.progress_percent ?? 0, 0), 100),
  estimatedTimeRemaining: record.estimated_time_remaining,
  graduationRequirements: normalizeRequirements(record.graduation_requirements),
  nextPhaseKey: record.next_phase_key,
  nextPhaseTitle: record.next_phase_title,
  nextPhasePreview: record.next_phase_preview,
  createdAt: record.created_at,
  updatedAt: record.updated_at,
});

export const getDogTrainingPhase = async (userId: string, dogId: string) => {
  const dog = await getOwnedDog(userId, dogId);
  if (!dog) throw new Error("Dog profile was not found for the authenticated user.");

  const { data, error } = await supabaseAdmin
    .from("dog_training_phase")
    .select("*")
    .eq("dog_id", dogId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapPhase(data) : null;
};

export const updateDogTrainingPhase = async (
  userId: string,
  dogId: string,
  update: Partial<DogTrainingPhaseUpdate>,
) => {
  const dog = await getOwnedDog(userId, dogId);
  if (!dog) throw new Error("Dog profile was not found for the authenticated user.");

  const payload = {
    dog_id: dogId,
    phase_key: update.phaseKey?.trim() || null,
    phase_title: update.phaseTitle?.trim() || null,
    phase_description: update.phaseDescription?.trim() || null,
    current_objective: update.currentObjective?.trim() || null,
    progress_percent:
      typeof update.progressPercent === "number"
        ? Math.min(Math.max(Math.round(update.progressPercent), 0), 100)
        : 0,
    estimated_time_remaining: update.estimatedTimeRemaining?.trim() || null,
    graduation_requirements: normalizeRequirements(update.graduationRequirements),
    next_phase_key: update.nextPhaseKey?.trim() || null,
    next_phase_title: update.nextPhaseTitle?.trim() || null,
    next_phase_preview: update.nextPhasePreview?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from("dog_training_phase")
    .upsert(payload, { onConflict: "dog_id" })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapPhase(data);
};

export const buildDogTrainingPhaseContext = (phase: DogTrainingPhase | null) => {
  if (!phase?.phaseTitle) {
    return "TRAINING PHASE\nNo proprietary training phase has been assigned to this dog yet.";
  }

  const requirements = phase.graduationRequirements.length
    ? phase.graduationRequirements
        .map((requirement) => `- ${requirement.completed ? "Complete" : "Incomplete"}: ${requirement.title}`)
        .join("\n")
    : "No graduation requirements assigned.";

  return `TRAINING PHASE
Current phase: ${phase.phaseTitle}
Description: ${phase.phaseDescription || "Not provided"}
Current objective: ${phase.currentObjective || "Not provided"}
Progress: ${phase.progressPercent}%
Estimated time remaining: ${phase.estimatedTimeRemaining || "Not provided"}
Graduation requirements:
${requirements}
Next phase preview: ${phase.nextPhaseTitle || "Not assigned"}${phase.nextPhasePreview ? ` - ${phase.nextPhasePreview}` : ""}

Use this phase as context only. Do not advance, rename, or create proprietary phases. Phase advancement requires an explicit future workflow.`;
};

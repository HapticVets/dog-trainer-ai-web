import { hydrateDogCaseFile } from "@/lib/dogCaseFile";

type BreedingDogSexSource = {
  id: string;
  name: string;
  custom_notes: string | null;
};

export type BreedingDogOption = {
  id: string;
  name: string;
  sex: "male" | "female";
};

export const normalizeBreedingDogSex = (value: string | null | undefined) => {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "male") return "male" as const;
  if (normalized === "female") return "female" as const;
  return null;
};

export const toBreedingDogOption = (dog: BreedingDogSexSource): BreedingDogOption | null => {
  const sex = normalizeBreedingDogSex(hydrateDogCaseFile(dog).sex);
  return sex ? { id: dog.id, name: dog.name, sex } : null;
};

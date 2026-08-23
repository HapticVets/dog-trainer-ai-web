import { hydrateDogCaseFile } from "@/lib/dogCaseFile";
import { normalizeDogSex } from "@/lib/dogSex";

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
  const sex = normalizeDogSex(value);
  return sex ? sex.toLowerCase() as "male" | "female" : null;
};

export const toBreedingDogOption = (dog: BreedingDogSexSource): BreedingDogOption | null => {
  const sex = normalizeBreedingDogSex(hydrateDogCaseFile(dog).sex);
  return sex ? { id: dog.id, name: dog.name, sex } : null;
};

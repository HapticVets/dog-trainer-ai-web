export type DogSex = "Male" | "Female";

export const normalizeDogSex = (value: unknown): DogSex | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "male") {
    return "Male";
  }

  if (normalized === "female") {
    return "Female";
  }

  return null;
};

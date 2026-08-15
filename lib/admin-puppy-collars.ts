export const STANDARD_COLLAR_COLORS = [
  "Red", "Blue", "Green", "Yellow", "Orange", "Purple", "Pink",
  "Black", "White", "Teal", "Gray", "Brown", "Lime", "Navy",
] as const;

const collarSwatches: Record<string, string> = {
  Red: "#dc2626", Blue: "#2563eb", Green: "#16a34a", Yellow: "#eab308",
  Orange: "#ea580c", Purple: "#9333ea", Pink: "#ec4899", Black: "#171717",
  White: "#f5f5f5", Teal: "#0f766e", Gray: "#6b7280", Brown: "#92400e",
  Lime: "#65a30d", Navy: "#1e3a8a",
};

export function normalizeCollarColor(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) return null;
  if (normalized.length > 40) return undefined;
  const standard = STANDARD_COLLAR_COLORS.find((color) => color.toLowerCase() === normalized.toLowerCase());
  return standard ?? normalized.replace(/\b\w/g, (character) => character.toUpperCase());
}

export function collarSwatch(color: string | null) {
  return color ? collarSwatches[color] ?? "#d4a72c" : "#525252";
}

export function collarLabel(color: string | null) {
  return color ? `${color} Collar` : "Collar Not Assigned";
}

export type EvaluationFieldType = "rating" | "pass_needs_work" | "yes_no" | "short_text" | "long_notes" | "measurement";

export type EvaluationField = { id: string; label: string; type: EvaluationFieldType; required?: boolean };
export type EvaluationSection = { id: string; title: string; notes?: boolean; fields: EvaluationField[] };
export type EvaluationConfig = { sections: EvaluationSection[] };
export type EvaluationResults = Record<string, string | number | boolean | null>;

export const fieldTypeLabels: Record<EvaluationFieldType, string> = {
  rating: "Rating 1-5",
  pass_needs_work: "Pass / Needs Work",
  yes_no: "Yes / No",
  short_text: "Short Text",
  long_notes: "Long Notes",
  measurement: "Measurement / Observation",
};

export const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function emptyConfig(): EvaluationConfig {
  return { sections: [{ id: createId(), title: "Evaluation", notes: true, fields: [] }] };
}

export function generalServiceDogProgressConfig(): EvaluationConfig {
  const rating = (label: string): EvaluationField => ({ id: createId(), label, type: "rating" });
  const notes = (label: string): EvaluationField => ({ id: createId(), label, type: "long_notes" });
  return {
    sections: [
      { id: createId(), title: "Engagement & Handler Relationship", fields: ["Handler Engagement", "Handler Orientation", "Response to Guidance"].map(rating) },
      { id: createId(), title: "Obedience / Control", fields: ["Heel", "Sit / Down Reliability", "Stay", "Recall", "Place"].map(rating) },
      { id: createId(), title: "Environmental Stability", fields: ["Environmental Confidence", "Recovery", "Public Neutrality", "People Neutrality", "Dog Neutrality"].map(rating) },
      { id: createId(), title: "Drive / Regulation", fields: ["Toy Drive", "Drive Regulation", "Impulse Control", "Ability to Disengage"].map(rating) },
      { id: createId(), title: "Service Dog Development", fields: [...["Settling", "Handler Focus Around Distractions"].map(rating), { id: createId(), label: "Public Manners", type: "pass_needs_work" }, { id: createId(), label: "Appropriate for Current Training Environment", type: "yes_no" }] },
      { id: createId(), title: "Observations", fields: ["Strengths Observed", "Current Challenges", "Development Focus", "Trainer Notes"].map(notes) },
    ],
  };
}

export function isEvaluationConfig(value: unknown): value is EvaluationConfig {
  if (!value || typeof value !== "object" || !Array.isArray((value as EvaluationConfig).sections)) return false;
  return (value as EvaluationConfig).sections.every((section) => section && typeof section.id === "string" && typeof section.title === "string" && Array.isArray(section.fields) && section.fields.every((field) => field && typeof field.id === "string" && typeof field.label === "string" && fieldTypeLabels[field.type as EvaluationFieldType]));
}

export function evaluationPreview(config: EvaluationConfig, results: EvaluationResults) {
  const values = config.sections.flatMap((section) => section.fields.map((field) => ({ label: field.label, value: results[field.id] }))).filter((item) => item.value !== null && item.value !== undefined && item.value !== "");
  return values.slice(0, 2).map((item) => `${item.label}: ${String(item.value)}`).join(" · ") || "No observations recorded.";
}

export function evaluationContext(config: EvaluationConfig, results: EvaluationResults, summary: string | null) {
  const observations = config.sections.map((section) => {
    const fields = section.fields.map((field) => {
      const value = results[field.id];
      return value === null || value === undefined || value === "" ? null : `${field.label}: ${String(value)}`;
    }).filter(Boolean);
    const sectionNote = results[`${section.id}:notes`];
    return fields.length || sectionNote ? `${section.title}\n${[...fields, sectionNote ? `Section notes: ${String(sectionNote)}` : null].filter(Boolean).join("\n")}` : null;
  }).filter(Boolean).join("\n\n");
  return `${summary ? `Professional summary: ${summary}\n\n` : ""}${observations || "No observations recorded."}`;
}

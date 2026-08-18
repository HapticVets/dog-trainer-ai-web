import { isEvaluationConfig, type EvaluationConfig, type EvaluationResults } from "@/lib/adminClientEvaluations";

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
const ratingLabel = (value: unknown) => ({ 1: "1 - Significant Support Needed", 2: "2 - Developing", 3: "3 - Functional / Moderate", 4: "4 - Strong", 5: "5 - Very Strong" }[Number(value)] ?? String(value));
const isPrivateTrainerNote = (label: string) => label.trim().toLowerCase() === "trainer notes";

export type ClientEvaluationEmailInput = { dogName: string; title: string; evaluationDate: string; config: EvaluationConfig; results: EvaluationResults; trainerSummary: string | null; introduction: string; clientSummary: string; includeTrainerNotes: boolean };

export function buildClientEvaluationEmail(input: ClientEvaluationEmailInput) {
  const sections = input.config.sections.map((section) => {
    const rows = section.fields.filter((field) => input.includeTrainerNotes || !isPrivateTrainerNote(field.label)).map((field) => {
      const raw = input.results[field.id]; if (raw === null || raw === undefined || raw === "") return null;
      const value = field.type === "rating" ? ratingLabel(raw) : String(raw);
      return { label: field.label, value };
    }).filter((row): row is { label: string; value: string } => Boolean(row));
    const sectionNotes = input.results[`${section.id}:notes`];
    return rows.length || sectionNotes ? { title: section.title, rows, notes: sectionNotes ? String(sectionNotes) : null } : null;
  }).filter((section): section is { title: string; rows: Array<{ label: string; value: string }>; notes: string | null } => Boolean(section));
  const date = new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date(input.evaluationDate));
  const safeSummary = input.clientSummary.trim() || "";
  const text = ["PATRIOT K9 COMMAND", "", input.dogName, input.title, date, input.introduction.trim(), "", "EVALUATION OVERVIEW", ...sections.flatMap((section) => ["", section.title.toUpperCase(), ...section.rows.map((row) => `${row.label}: ${row.value}`), ...(section.notes ? [`Section Notes: ${section.notes}`] : [])]), ...(safeSummary ? ["", "TRAINER SUMMARY", safeSummary] : []), "", "Patriot K9 Command", "Structured Dog Training"].filter(Boolean).join("\n");
  const htmlSections = sections.map((section) => `<section><h2>${escapeHtml(section.title)}</h2>${section.rows.map((row) => `<p><strong>${escapeHtml(row.label)}:</strong> ${escapeHtml(row.value)}</p>`).join("")}${section.notes ? `<p><strong>Section Notes:</strong><br>${escapeHtml(section.notes).replace(/\n/g, "<br>")}</p>` : ""}</section>`).join("");
  const html = `<main style="max-width:680px;margin:0 auto;font-family:Arial,sans-serif;color:#202020;line-height:1.55"><p style="letter-spacing:2px;font-size:12px;font-weight:bold;color:#9a6d00">PATRIOT K9 COMMAND</p><h1 style="margin:0">${escapeHtml(input.dogName)}</h1><p style="margin:4px 0 20px">${escapeHtml(input.title)}<br>${escapeHtml(date)}</p>${input.introduction.trim() ? `<p>${escapeHtml(input.introduction.trim()).replace(/\n/g, "<br>")}</p>` : ""}<h2>Evaluation Overview</h2>${htmlSections}${safeSummary ? `<h2>Trainer Summary</h2><p>${escapeHtml(safeSummary).replace(/\n/g, "<br>")}</p>` : ""}<hr style="border:0;border-top:1px solid #ddd;margin:28px 0"><p><strong>Patriot K9 Command</strong><br>Structured Dog Training</p></main>`;
  return { text, html, sections, date };
}

export function safeEvaluationEmailInput(value: { config_snapshot: unknown; results: unknown; title: string; evaluation_date: string; trainer_summary: string | null }, dogName: string, introduction: string, clientSummary: string, includeTrainerNotes: boolean): ClientEvaluationEmailInput | null {
  if (!isEvaluationConfig(value.config_snapshot) || !value.results || typeof value.results !== "object" || Array.isArray(value.results)) return null;
  return { dogName, title: value.title, evaluationDate: value.evaluation_date, config: value.config_snapshot, results: value.results as EvaluationResults, trainerSummary: value.trainer_summary, introduction, clientSummary, includeTrainerNotes };
}

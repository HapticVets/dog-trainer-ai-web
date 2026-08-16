import OpenAI from "openai";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Context = { params: Promise<{ id: string; puppyId: string }> };
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const traits = ["handler_engagement", "environmental_confidence", "recovery", "adaptability", "food_motivation", "toy_drive", "drive_regulation", "neutrality", "handler_orientation", "independence", "sound_recovery", "handling_tolerance", "frustration_tolerance", "crate_settling", "recall_tendency", "disengagement"];

const weekNumber = (value: string) => Number(value.match(/\d+/)?.[0]);

export async function POST(request: Request, { params }: Context) {
  try {
    await requireAdmin();
    const { id: litterId, puppyId } = await params;
    const body = await request.json() as { development_week?: unknown };
    const requestedWeek = Number(body.development_week);
    if (!Number.isInteger(requestedWeek) || requestedWeek < 1) return NextResponse.json({ error: "Choose a valid development week." }, { status: 400 });

    const { data: puppy, error: puppyError } = await supabaseAdmin.from("admin_litter_puppies").select("id,puppy_code,collar_color").eq("id", puppyId).eq("litter_id", litterId).maybeSingle();
    if (puppyError || !puppy) return NextResponse.json({ error: "Puppy record not found in this litter." }, { status: 404 });
    const { data: evaluations, error: evaluationError } = await supabaseAdmin.from("admin_puppy_evaluations").select("evaluation_week,evaluation_date,strengths,development_focus,overall_notes,handler_engagement,environmental_confidence,recovery,adaptability,food_motivation,toy_drive,drive_regulation,neutrality,handler_orientation,independence,sound_recovery,handling_tolerance,frustration_tolerance,crate_settling,recall_tendency,disengagement").eq("puppy_id", puppyId).eq("litter_id", litterId).order("evaluation_date", { ascending: true });
    if (evaluationError) {
      console.error("Public puppy summary evaluation lookup failed", { code: evaluationError.code, message: evaluationError.message, details: evaluationError.details, hint: evaluationError.hint });
      return NextResponse.json({ error: "Unable to load saved evaluations." }, { status: 500 });
    }
    const selected = (evaluations ?? []).filter((evaluation) => weekNumber(evaluation.evaluation_week) === requestedWeek);
    if (!selected.length) return NextResponse.json({ error: `No saved Week ${requestedWeek} evaluation is available to generate from.` }, { status: 400 });

    const evaluationContext = (evaluations ?? []).map((evaluation) => ({
      week: evaluation.evaluation_week,
      date: evaluation.evaluation_date,
      scores: Object.fromEntries(traits.map((trait) => [trait, evaluation[trait as keyof typeof evaluation]])),
      strengths: evaluation.strengths,
      developmentFocus: evaluation.development_focus,
      trainerNotes: evaluation.overall_notes,
    }));
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      temperature: 0.2,
      response_format: { type: "json_schema", json_schema: { name: "buyer_safe_puppy_summary", strict: true, schema: { type: "object", additionalProperties: false, required: ["summary"], properties: { summary: { type: "string" } } } } },
      messages: [{ role: "system", content: "Write a concise 2-5 sentence buyer-safe puppy development summary. Use only the supplied saved evaluation evidence. Scores and trainer notes are internal evidence only: never include numeric scores, scoring terminology, private operational commentary, internal shorthand, placement decisions, medical claims, guarantees, adult obedience judgments, or definitive suitability claims. Treat the puppy as developing; use cautious, age-appropriate wording such as currently showing, developing, continuing to build, or age-appropriate when supported. Mention a trend only if the supplied history supports it. Do not invent observations." }, { role: "user", content: JSON.stringify({ selectedDevelopmentWeek: requestedWeek, puppy: { collarColor: puppy.collar_color, code: puppy.puppy_code }, savedEvaluations: evaluationContext }) }],
    });
    const raw = completion.choices[0]?.message?.content ?? "{}";
    let parsed: { summary?: unknown };
    try { parsed = JSON.parse(raw) as { summary?: unknown }; } catch { parsed = {}; }
    const draft = typeof parsed.summary === "string" ? parsed.summary.trim() : "";
    if (!draft) {
      console.error("Public puppy summary generation returned no usable draft", { puppyId, requestedWeek });
      return NextResponse.json({ error: "Unable to generate a buyer-safe summary. Please try again." }, { status: 500 });
    }
    return NextResponse.json({ draft });
  } catch (error) {
    console.error("Public puppy summary generation failed", error);
    return NextResponse.json({ error: "Unable to generate a buyer-safe summary. Please try again." }, { status: 500 });
  }
}

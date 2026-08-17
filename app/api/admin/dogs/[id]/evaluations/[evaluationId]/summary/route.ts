import OpenAI from "openai";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { evaluationContext, isEvaluationConfig } from "@/lib/adminClientEvaluations";
import { supabaseAdmin } from "@/lib/supabase-admin";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
type Context = { params: Promise<{ id: string; evaluationId: string }> };

export async function POST(_request: Request, { params }: Context) {
  try {
    await requireAdmin(); const { id, evaluationId } = await params;
    const { data: dog } = await supabaseAdmin.from("dog_profiles").select("id,name").eq("id", id).eq("record_type", "client").maybeSingle();
    if (!dog) return NextResponse.json({ error: "Client Dog record not found." }, { status: 404 });
    const { data: evaluation, error } = await supabaseAdmin.from("admin_dog_evaluations").select("*").eq("id", evaluationId).eq("dog_id", id).maybeSingle();
    if (error || !evaluation) return NextResponse.json({ error: "Client evaluation not found." }, { status: 404 });
    if (!isEvaluationConfig(evaluation.config_snapshot)) return NextResponse.json({ error: "Saved evaluation structure is invalid." }, { status: 400 });
    const observations = evaluationContext(evaluation.config_snapshot, evaluation.results ?? {}, evaluation.trainer_summary ?? null);
    const completion = await openai.chat.completions.create({ model: "gpt-4.1", temperature: 0.1, messages: [{ role: "system", content: "Write a concise internal professional dog-training evaluation summary. Use only supplied observations; do not invent findings, diagnoses, scores, or promises. Use exactly these headings: OVERALL OBSERVATION, CURRENT STRENGTHS, CURRENT LIMITATIONS, TRAINING PRIORITIES, NEXT DIRECTION." }, { role: "user", content: `Dog: ${dog.name}\nEvaluation: ${evaluation.title}\n\nSAVED OBSERVATIONS\n${observations}` }] });
    const summary = completion.choices[0]?.message?.content?.trim();
    if (!summary) return NextResponse.json({ error: "Unable to generate an evaluation summary." }, { status: 500 });
    return NextResponse.json({ summary });
  } catch (error) { console.error("Admin evaluation summary generation failed", error); return NextResponse.json({ error: "Unable to generate an evaluation summary." }, { status: 500 }); }
}

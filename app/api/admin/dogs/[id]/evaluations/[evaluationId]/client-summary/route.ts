import OpenAI from "openai";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { buildClientEvaluationEmail, safeEvaluationEmailInput } from "@/lib/clientEvaluationEmail";
import { supabaseAdmin } from "@/lib/supabase-admin";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
type Context = { params: Promise<{ id: string; evaluationId: string }> };

export async function POST(_request: Request, { params }: Context) {
  try {
    await requireAdmin(); const { id, evaluationId } = await params;
    const { data: dog } = await supabaseAdmin.from("dog_profiles").select("id,name").eq("id", id).eq("record_type", "client").maybeSingle();
    if (!dog) return NextResponse.json({ error: "Client Dog record not found." }, { status: 404 });
    const { data: evaluation, error } = await supabaseAdmin.from("admin_dog_evaluations").select("title,evaluation_date,config_snapshot,results,trainer_summary").eq("id", evaluationId).eq("dog_id", id).maybeSingle();
    if (error || !evaluation) return NextResponse.json({ error: "Client evaluation not found." }, { status: 404 });
    const input = safeEvaluationEmailInput(evaluation, dog.name, "", "", false);
    if (!input) return NextResponse.json({ error: "Saved evaluation data is invalid." }, { status: 400 });
    const safeObservations = buildClientEvaluationEmail(input).text;
    const completion = await openai.chat.completions.create({ model: "gpt-4.1", temperature: 0.1, messages: [{ role: "system", content: "Write one concise, constructive, client-safe dog-training summary. Use only the supplied evaluation observations and optional internal summary for context. Do not quote or reveal private Trainer Notes, internal process, evaluator metadata, database details, unsupported claims, diagnoses, or promises. Use plain dog-owner language. Mention strengths and practical priorities when supported." }, { role: "user", content: `Dog: ${dog.name}\n\nCLIENT-SAFE OBSERVATIONS\n${safeObservations}\n\nOPTIONAL INTERNAL PROFESSIONAL SUMMARY (translate safely; do not copy blindly)\n${evaluation.trainer_summary || "None"}` }] });
    const summary = completion.choices[0]?.message?.content?.trim();
    if (!summary) return NextResponse.json({ error: "Unable to generate a client summary." }, { status: 500 });
    return NextResponse.json({ summary });
  } catch (error) { console.error("Client evaluation client-summary generation failed", error); return NextResponse.json({ error: "Unable to generate a client summary." }, { status: 500 }); }
}

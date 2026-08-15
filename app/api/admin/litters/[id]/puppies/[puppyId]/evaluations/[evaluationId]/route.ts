import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Context = { params: Promise<{ id: string; puppyId: string; evaluationId: string }> };
const traits = ["handler_engagement", "environmental_confidence", "recovery", "adaptability", "food_motivation", "toy_drive", "drive_regulation", "neutrality", "handler_orientation", "independence", "sound_recovery", "handling_tolerance", "frustration_tolerance", "crate_settling", "recall_tendency", "disengagement"] as const;

function logSupabaseError(action: string, error: { code?: string; message?: string; details?: string; hint?: string }) {
  console.error(`Admin puppy evaluation ${action} failed`, { code: error.code, message: error.message, details: error.details, hint: error.hint });
}

async function verifyEvaluation(litterId: string, puppyId: string, evaluationId: string) {
  const { data, error } = await supabaseAdmin.from("admin_puppy_evaluations").select("id").eq("id", evaluationId).eq("litter_id", litterId).eq("puppy_id", puppyId).maybeSingle();
  if (error) {
    logSupabaseError("lookup", error);
    return { error: NextResponse.json({ error: error.code === "42P01" || error.code === "PGRST205" ? "Puppy evaluation storage is not ready. Apply the Phase 4 evaluation migration." : "Unable to verify evaluation." }, { status: 500 }) };
  }
  if (!data) return { error: NextResponse.json({ error: "Evaluation not found." }, { status: 404 }) };
  return { evaluation: data };
}

function parseEvaluation(body: Record<string, unknown>) {
  if (typeof body.evaluation_week !== "string" || !body.evaluation_week.trim()) return { error: "Evaluation week is required." };
  if (typeof body.evaluation_date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.evaluation_date)) return { error: "A valid evaluation date is required." };
  const scores: Record<string, number> = {};
  for (const trait of traits) {
    if (!Number.isInteger(body[trait]) || Number(body[trait]) < 1 || Number(body[trait]) > 5) return { error: "Every evaluation trait must be scored from 1 to 5." };
    scores[trait] = Number(body[trait]);
  }
  return { values: { evaluation_week: body.evaluation_week.trim(), evaluation_date: body.evaluation_date, ...scores, strengths: typeof body.strengths === "string" && body.strengths.trim() ? body.strengths.trim() : null, development_focus: typeof body.development_focus === "string" && body.development_focus.trim() ? body.development_focus.trim() : null, overall_notes: typeof body.overall_notes === "string" && body.overall_notes.trim() ? body.overall_notes.trim() : null, updated_at: new Date().toISOString() } };
}

export async function PUT(request: Request, { params }: Context) {
  try {
    await requireAdmin();
    const { id: litterId, puppyId, evaluationId } = await params;
    const existing = await verifyEvaluation(litterId, puppyId, evaluationId);
    if (existing.error) return existing.error;
    const parsed = parseEvaluation((await request.json()) as Record<string, unknown>);
    if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const { data, error } = await supabaseAdmin.from("admin_puppy_evaluations").update(parsed.values).eq("id", evaluationId).eq("litter_id", litterId).eq("puppy_id", puppyId).select("*").single();
    if (error) { logSupabaseError("update", error); return NextResponse.json({ error: "Unable to update evaluation." }, { status: 500 }); }
    return NextResponse.json({ success: true, evaluation: data });
  } catch (error) { console.error("Admin puppy evaluation update failed", error); return NextResponse.json({ error: "Unable to update evaluation." }, { status: 500 }); }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    await requireAdmin();
    const { id: litterId, puppyId, evaluationId } = await params;
    const existing = await verifyEvaluation(litterId, puppyId, evaluationId);
    if (existing.error) return existing.error;
    const { error: mediaError } = await supabaseAdmin.from("admin_puppy_media").update({ evaluation_id: null }).eq("evaluation_id", evaluationId).eq("puppy_id", puppyId);
    if (mediaError && mediaError.code !== "42P01" && mediaError.code !== "PGRST205") {
      logSupabaseError("media unlink", mediaError);
      return NextResponse.json({ error: "Unable to preserve linked development media." }, { status: 500 });
    }
    const { error } = await supabaseAdmin.from("admin_puppy_evaluations").delete().eq("id", evaluationId).eq("litter_id", litterId).eq("puppy_id", puppyId);
    if (error) { logSupabaseError("delete", error); return NextResponse.json({ error: "Unable to delete evaluation." }, { status: 500 }); }
    return NextResponse.json({ success: true });
  } catch (error) { console.error("Admin puppy evaluation delete failed", error); return NextResponse.json({ error: "Unable to delete evaluation." }, { status: 500 }); }
}

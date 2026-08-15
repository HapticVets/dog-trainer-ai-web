import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Context = { params: Promise<{ id: string; puppyId: string }> };

const traits = [
  "handler_engagement",
  "environmental_confidence",
  "recovery",
  "adaptability",
  "food_motivation",
  "toy_drive",
  "drive_regulation",
  "neutrality",
  "handler_orientation",
  "independence",
  "sound_recovery",
  "handling_tolerance",
  "frustration_tolerance",
  "crate_settling",
  "recall_tendency",
  "disengagement",
] as const;

function logSupabaseError(action: string, error: { code?: string; message?: string; details?: string; hint?: string }) {
  console.error(`Admin puppy evaluation ${action} failed`, { code: error.code, message: error.message, details: error.details, hint: error.hint });
}

function storageError(error: { code?: string }, action: "load" | "save") {
  return error.code === "42P01" || error.code === "PGRST205"
    ? "Puppy evaluation storage is not ready. Apply the Phase 4 evaluation migration."
    : `Unable to ${action} puppy evaluations.`;
}

async function verifyPuppy(litterId: string, puppyId: string) {
  const { data, error } = await supabaseAdmin.from("admin_litter_puppies").select("id").eq("id", puppyId).eq("litter_id", litterId).maybeSingle();
  if (error) {
    logSupabaseError("puppy lookup", error);
    return { error: NextResponse.json({ error: "Unable to verify puppy record." }, { status: 500 }) };
  }
  if (!data) return { error: NextResponse.json({ error: "Puppy record not found in this litter." }, { status: 404 }) };
  return { puppy: data };
}

function parseEvaluation(body: Record<string, unknown>) {
  if (typeof body.evaluation_week !== "string" || !body.evaluation_week.trim()) return { error: "Evaluation week is required." };
  if (typeof body.evaluation_date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.evaluation_date)) return { error: "A valid evaluation date is required." };
  const scores: Record<string, number> = {};
  for (const trait of traits) {
    if (!Number.isInteger(body[trait]) || Number(body[trait]) < 1 || Number(body[trait]) > 5) return { error: "Every evaluation trait must be scored from 1 to 5." };
    scores[trait] = Number(body[trait]);
  }
  return { values: { evaluation_week: body.evaluation_week.trim(), evaluation_date: body.evaluation_date, ...scores, strengths: typeof body.strengths === "string" && body.strengths.trim() ? body.strengths.trim() : null, development_focus: typeof body.development_focus === "string" && body.development_focus.trim() ? body.development_focus.trim() : null, overall_notes: typeof body.overall_notes === "string" && body.overall_notes.trim() ? body.overall_notes.trim() : null } };
}

export async function GET(_request: Request, { params }: Context) {
  try {
    await requireAdmin();
    const { id: litterId, puppyId } = await params;
    const verified = await verifyPuppy(litterId, puppyId);
    if (verified.error) return verified.error;
    const { data, error } = await supabaseAdmin.from("admin_puppy_evaluations").select("*").eq("litter_id", litterId).eq("puppy_id", puppyId).order("evaluation_date", { ascending: false }).order("created_at", { ascending: false });
    if (error) { logSupabaseError("load", error); return NextResponse.json({ error: storageError(error, "load") }, { status: 500 }); }
    return NextResponse.json({ evaluations: data ?? [] });
  } catch (error) { console.error("Admin puppy evaluation load failed", error); return NextResponse.json({ error: "Unable to load puppy evaluations." }, { status: 500 }); }
}

export async function POST(request: Request, { params }: Context) {
  try {
    const adminId = await requireAdmin();
    const { id: litterId, puppyId } = await params;
    const verified = await verifyPuppy(litterId, puppyId);
    if (verified.error) return verified.error;
    const parsed = parseEvaluation((await request.json()) as Record<string, unknown>);
    if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const { data, error } = await supabaseAdmin.from("admin_puppy_evaluations").insert({ puppy_id: puppyId, litter_id: litterId, evaluated_by_clerk_user_id: adminId, ...parsed.values }).select("*").single();
    if (error) { logSupabaseError("create", error); return NextResponse.json({ error: storageError(error, "save") }, { status: 500 }); }
    return NextResponse.json({ success: true, evaluation: data }, { status: 201 });
  } catch (error) { console.error("Admin puppy evaluation create failed", error); return NextResponse.json({ error: "Unable to save evaluation." }, { status: 500 }); }
}

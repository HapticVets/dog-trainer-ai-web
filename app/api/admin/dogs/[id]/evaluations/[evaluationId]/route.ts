import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { isEvaluationConfig } from "@/lib/adminClientEvaluations";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Context = { params: Promise<{ id: string; evaluationId: string }> };
async function evaluationForClientDog(dogId: string, evaluationId: string) {
  const { data: dog } = await supabaseAdmin.from("dog_profiles").select("id").eq("id", dogId).eq("record_type", "client").maybeSingle();
  if (!dog) return null;
  const { data, error } = await supabaseAdmin.from("admin_dog_evaluations").select("*").eq("id", evaluationId).eq("dog_id", dogId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function GET(_request: Request, { params }: Context) {
  try { await requireAdmin(); const { id, evaluationId } = await params; const evaluation = await evaluationForClientDog(id, evaluationId); if (!evaluation) return NextResponse.json({ error: "Client evaluation not found." }, { status: 404 }); const { data: dog } = await supabaseAdmin.from("dog_profiles").select("client_owner_email").eq("id", id).eq("record_type", "client").maybeSingle(); return NextResponse.json({ evaluation, defaultRecipient: dog?.client_owner_email?.trim() || "" }); }
  catch (error) { console.error("Admin client evaluation load failed", error); return NextResponse.json({ error: "Unable to load client evaluation." }, { status: 500 }); }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    await requireAdmin(); const { id, evaluationId } = await params; const existing = await evaluationForClientDog(id, evaluationId);
    if (!existing) return NextResponse.json({ error: "Client evaluation not found." }, { status: 404 });
    const body = await request.json() as Record<string, unknown>; const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof body.title !== "undefined") { if (typeof body.title !== "string" || !body.title.trim()) return NextResponse.json({ error: "Evaluation title is required." }, { status: 400 }); update.title = body.title.trim(); }
    if (typeof body.evaluation_date !== "undefined") { if (typeof body.evaluation_date !== "string" || Number.isNaN(Date.parse(body.evaluation_date))) return NextResponse.json({ error: "Evaluation date is invalid." }, { status: 400 }); update.evaluation_date = body.evaluation_date; }
    if (typeof body.results !== "undefined") { if (!body.results || typeof body.results !== "object" || Array.isArray(body.results)) return NextResponse.json({ error: "Observations are invalid." }, { status: 400 }); update.results = body.results; }
    if (typeof body.config_snapshot !== "undefined") { if (!isEvaluationConfig(body.config_snapshot)) return NextResponse.json({ error: "Evaluation sections are invalid." }, { status: 400 }); update.config_snapshot = body.config_snapshot; }
    if (typeof body.trainer_summary !== "undefined") update.trainer_summary = typeof body.trainer_summary === "string" ? body.trainer_summary.trim() || null : null;
    const { data, error } = await supabaseAdmin.from("admin_dog_evaluations").update(update).eq("id", evaluationId).eq("dog_id", id).select("*").single();
    if (error) throw error;
    return NextResponse.json({ evaluation: data });
  } catch (error) { console.error("Admin client evaluation update failed", error); return NextResponse.json({ error: "Unable to update client evaluation." }, { status: 500 }); }
}

export async function DELETE(_request: Request, { params }: Context) {
  try { await requireAdmin(); const { id, evaluationId } = await params; const existing = await evaluationForClientDog(id, evaluationId); if (!existing) return NextResponse.json({ error: "Client evaluation not found." }, { status: 404 }); const { error } = await supabaseAdmin.from("admin_dog_evaluations").delete().eq("id", evaluationId).eq("dog_id", id); if (error) throw error; return NextResponse.json({ success: true }); }
  catch (error) { console.error("Admin client evaluation delete failed", error); return NextResponse.json({ error: "Unable to delete client evaluation." }, { status: 500 }); }
}
